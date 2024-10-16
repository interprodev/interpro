import { Component, EventEmitter, Injector, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { LoopBackAuth, LoopBackConfig, Player, Team, TeamApi } from '@iterpro/shared/data-access/sdk';
import { ErrorService } from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as Papa from 'papaparse';
import { Message } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { first } from 'rxjs/operators';
import { ImportStoreActions } from 'src/app/+state/import-store';
import { RawPlayersStats, SessionMessage } from 'src/app/+state/import-store/interfaces/import-store.interfaces';
import { RootStoreState } from 'src/app/+state/root-store.state';
import { ImportPlayersStatsService } from './import-players-stats.service';

interface ParsedImport {
	playersStats: RawPlayersStats;
	notMappedPlayers?: string[];
}

@UntilDestroy()
@Component({
	selector: 'iterpro-import-players-stats',
	templateUrl: './import-players-stats.component.html',
	styleUrls: ['./../../import.common.css']
})
export class ImportPlayerStatsComponent extends EtlBaseInjectable implements OnInit, OnDestroy {
	@Output() sessions: EventEmitter<any> = new EventEmitter<any>();
	@Output() cancelImport: EventEmitter<void> = new EventEmitter<void>();
	@Output() messages: EventEmitter<SessionMessage[]> = new EventEmitter<SessionMessage[]>();

	sessionMessages: SessionMessage[] = [];
	isFileSelected = false;
	urlUpload: string;

	currentTeam: Team;

	@ViewChild('fUpload', { static: false })
	private fileUploader: FileUpload;

	private readonly excludedHeaders: string[] = ['Date', 'Session Title', 'Player Name', 'Split Name', 'Tags'];
	private proceeds = false;
	private currentTeamId: string;
	private players: Player[];

	constructor(
		private error: ErrorService,
		private teamApi: TeamApi,
		private auth: LoopBackAuth,
		private importPlayersStats: ImportPlayersStatsService,
		private translate: TranslateService,
		private store$: Store<RootStoreState>,
		injector: Injector
	) {
		super(injector);
	}

	ngOnDestroy() {}

	ngOnInit() {
		this.urlUpload = LoopBackConfig.getPath() + '/csvUpload';
		this.currentTeamId = this.auth.getCurrentUserData().currentTeamId;

		this.teamApi
			.findById(this.currentTeamId, {
				include: {
					relation: 'players',
					scope: {
						fields: ['id', 'displayName']
					}
				}
			})
			.pipe(first(), untilDestroyed(this))
			.subscribe(
				(results: Team) => {
					this.currentTeam = results;
					this.players = results.players;
				},
				(error: Error) => {
					this.error.handleError(error);
				}
			);
	}

	async onSelect({ files }: { files: File[] }) {
		this.setMessages([
			{
				severity: 'info',
				summary: '',
				detail: this.translate.instant('import.feedbacks.loading')
			}
		]);
		const playersStatsToImport: RawPlayersStats[] = [];
		const missingPlayersForSession: Array<string[]> = [];
		this.proceeds = true;
		this.isFileSelected = true;

		const fileCount = files.length;

		for (const [index, file] of Array.from(files).entries()) {
			try {
				const resultParsed = await this.readFile(file, index, fileCount);
				playersStatsToImport.push(resultParsed.playersStats);
				missingPlayersForSession.push(resultParsed.notMappedPlayers);
			} catch (e) {
				if (this.fileUploader) {
					this.fileUploader.clear();
				}

				this.pushMessage({
					severity: 'error',
					summary: this.translate.instant('error'),
					detail: this.translate.instant('import.feedbacks.errorCSV')
				});
				this.proceeds = false;
			}
		}

		if (this.proceeds === true) {
			this.convert(playersStatsToImport, missingPlayersForSession);
		}
	}

	private readFile(file: Blob, index: number, length: number): Promise<ParsedImport> {
		const fileReader = new FileReader();
		return new Promise<ParsedImport>((resolve, reject) => {
			fileReader.onerror = (e: Event) => {
				fileReader.abort();
				reject(e);
			};
			fileReader.onloadstart = (e: Event) => this.onStartLoad(index, length);
			fileReader.onloadend = (e: Event) => {
				const resultParsed = this.onLoadEnd(fileReader.result as string);
				resolve(resultParsed);
			};
			fileReader.readAsText(file);
		});
	}

	private onStartLoad(index: number, length: number) {
		this.pushMessage({
			severity: 'info',
			summary: '',
			detail: this.translate.instant('import.feedbacks.parsing', {
				val1: index + 1,
				val2: length
			})
		});
	}

	private onLoadEnd(file: string): ParsedImport {
		const resultParse = this.parse(file);
		if (resultParse) {
			const sessionMessages = [];
			const errors = this.validate(resultParse.playersStats);
			if (errors.find(({ severity }) => severity === 'error')) {
				sessionMessages.push(...errors);
				this.concatMessages(errors);
				this.proceeds = this.proceeds && false;
			} else {
				if (resultParse.notMappedPlayers.length > 0) {
					sessionMessages.push({
						severity: 'warn',
						summary: this.translate.instant('warning'),
						detail: this.translate.instant('import.feedbacks.parsedWithUnmapped')
					});
				} else {
					sessionMessages.push({
						severity: 'info',
						summary: '',
						detail: this.translate.instant('import.feedbacks.parsed')
					});
				}
				this.proceeds = this.proceeds && true;
			}
			this.concatMessages(sessionMessages);
		} else {
			this.proceeds = this.proceeds && false;
		}
		return resultParse;
	}

	private getHeaders(csvData: string) {
		try {
			const firstLine = csvData.split('\n')[0];
			const parsed: Papa.ParseResult<any> = Papa.parse(firstLine, {
				delimiter: this.currentTeam.sepPlayer
			});
			return parsed.data[0].filter(x => !this.excludedHeaders.includes(x));
		} catch {
			return [];
		}
	}

	private parse(csvData: string): ParsedImport {
		if (csvData.split(/\r\n|\n/)[0].indexOf(this.currentTeam.sepPlayer) === -1) {
			this.pushMessage({
				severity: 'error',
				summary: this.translate.instant('error'),
				detail: this.translate.instant('import.feedbacks.errorCSV.separator')
			});
			return null;
		}
		const parsed: Papa.ParseResult<any> = Papa.parse(csvData, {
			header: true,
			skipEmptyLines: true,
			delimiter: this.currentTeam.sepPlayer
		});
		if (parsed.errors.length > 0) {
			this.concatMessages(
				parsed.errors.map(x => ({
					severity: 'error',
					summary: this.translate.instant('error'),
					detail: `${x.message} at row ${x.row + 1}`
				}))
			);

			return null;
		}
		try {
			const notMappedPlayers: string[] = [];
			const playersStats = this.etlPlayerService.getPlayerStatsFromCsv(parsed.data, this.currentTeam);

			playersStats.forEach(playerStat => {
				const player = this.players.find(
					({ displayName }) => displayName.trim().toLowerCase() === playerStat.playerName.trim().toLowerCase()
				);

				if (!player) {
					notMappedPlayers.push(playerStat.playerName);
				} else {
					playerStat.playerId = player.id;
				}
			});

			const newSessionImport: RawPlayersStats = {
				csvFile: csvData,
				headers: this.getHeaders(csvData),
				playersStats
			};
			return { playersStats: newSessionImport, notMappedPlayers };
		} catch (e) {
			this.isFileSelected = false;
		}
	}

	private validate(stats: RawPlayersStats): Message[] {
		const sessionMessages: Message[] = [];
		return sessionMessages;
	}

	private async convert(playersStats: RawPlayersStats[], missingPlayers: Array<string[]>) {
		try {
			const importStores: any[] = await this.importPlayersStats.buildSessionForTable(playersStats, missingPlayers);
			this.store$.dispatch(ImportStoreActions.nextPhase());
			const info: any = {
				importStores
			};
			this.sessions.emit(info);
		} catch (e) {
			console.error(e);
		}
	}

	clear() {
		this.isFileSelected = false;
		this.sessionMessages = [];
		this.cancelImport.emit();
	}

	checkForPlayersProviderMapping(team: Team): boolean {
		return !team._playerProviderMapping || team._playerProviderMapping?.rawMetrics?.length === 0;
	}

	private setMessages(messages: SessionMessage[]) {
		this.sessionMessages = [...messages];
		this.messages.emit(messages);
	}
	private pushMessage(message: SessionMessage) {
		this.sessionMessages = [...this.sessionMessages, message];
		this.messages.emit(this.sessionMessages);
	}
	private concatMessages(messages: SessionMessage[]) {
		this.sessionMessages = [...this.sessionMessages, ...messages];
		this.messages.emit(this.sessionMessages);
	}
}

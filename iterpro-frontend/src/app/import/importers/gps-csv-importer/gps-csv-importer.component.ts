import { Component, EventEmitter, Injector, OnDestroy, OnInit, Output } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	LoopBackAuth,
	LoopBackConfig,
	Player,
	PlayerApi,
	SessionPlayerData,
	Team,
	TeamApi,
	TeamSeason,
	TeamSeasonApi
} from '@iterpro/shared/data-access/sdk';
import { CalendarService, ErrorService } from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { flatten, groupBy, uniq, uniqBy } from 'lodash';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { Observable, Observer, forkJoin } from 'rxjs';
import { catchError, first, map, switchMap, tap } from 'rxjs/operators';
import { ImportGpsService } from '../../services/import-gps.service';
import { ImportStoreActions } from './../../../+state/import-store';
import {
	ImportedSessionSetInfo,
	MatchEvent,
	RawSessionImportData,
	RawSessionPlayerData,
	SessionMessage,
	TrainingEvent
} from './../../../+state/import-store/interfaces/import-store.interfaces';
import { ImportStore } from './../../../+state/import-store/ngrx/import-store.model';
import { RootStoreState } from './../../../+state/root-store.state';

@UntilDestroy()
@Component({
	selector: 'iterpro-gps-csv-importer',
	templateUrl: './gps-csv-importer.component.html',
	styleUrls: ['./../../import.common.css']
})
export class GpsCSVImporterComponent extends EtlBaseInjectable implements OnInit, OnDestroy {
	@Output() sessions: EventEmitter<ImportedSessionSetInfo> = new EventEmitter<ImportedSessionSetInfo>();
	@Output() cancelImport: EventEmitter<void> = new EventEmitter<void>();
	@Output() messages: EventEmitter<SessionMessage[]> = new EventEmitter<SessionMessage[]>();

	isFileSelected = false;
	urlUpload: string;

	currentTeam: Team;

	private readonly excludedHeaders: string[] = ['Date', 'Session Title', 'Player Name', 'Split Name', 'Tags'];
	private currentTeamId: string;
	private currentTeamSplitSession: string;
	private currentTeamGameSplitSession: string;
	private players: Player[] = [];
	private currentSeason: TeamSeason;

	constructor(
		private error: ErrorService,
		private teamApi: TeamApi,
		private auth: LoopBackAuth,
		private translate: TranslateService,
		private calendarService: CalendarService,
		private store$: Store<RootStoreState>,
		private importGpsService: ImportGpsService,
		private currentTeamService: CurrentTeamService,
		private teamSeasonApi: TeamSeasonApi,
		private playerApi: PlayerApi,
		injector: Injector
	) {
		super(injector);
	}

	ngOnDestroy() {}

	ngOnInit() {
		this.urlUpload = LoopBackConfig.getPath() + '/api/csvUpload';
		this.currentTeamId = this.auth.getCurrentUserData().currentTeamId;
		this.currentSeason = this.currentTeamService.getCurrentSeason();

		forkJoin([
			this.teamApi.findById(this.currentTeamId),
			this.playerApi.find({
				where: { teamId: this.currentTeamId },
				fields: ['id', 'displayName']
			}),
			this.teamSeasonApi.getPlayers(this.currentSeason.id, { fields: ['id', 'displayName'] })
		])
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: ([team, teamPlayers, seasonPlayers]: [Team, Player[], Player[]]) => {
					this.currentTeam = team;
					this.currentTeamSplitSession = team.mainSplitName;
					this.currentTeamGameSplitSession = team.mainGameName;
					this.players = uniqBy([...teamPlayers, ...seasonPlayers], 'id');
				},
				error: (error: Error) => {
					this.error.handleError(error);
				}
			});
	}

	checkForGPSProviderMapping(team: Team): boolean {
		return (
			team &&
			(!team._gpsProviderMapping ||
				(team._gpsProviderMapping?.rawMetrics?.length === 0 &&
					team._gpsProviderMapping?._gpsMetricsMapping?.length === 0))
		);
	}

	clear() {
		this.isFileSelected = false;
		this.cancelImport.emit();
	}

	onSelect({ files }: { files: File[] }) {
		this.messages.emit([
			{
				severity: 'info',
				summary: '',
				detail: this.translate.instant('import.feedbacks.loading', { value: files.length })
			}
		]);

		const parsing$ = Array.from(files).map(file => this.parseFile(file));

		forkJoin(parsing$)
			.pipe(
				switchMap((sessionsToImport: RawSessionImportData[]) => this.importGpsService.getObservable(sessionsToImport)),
				map(([sessions, events, games]: [RawSessionImportData[], TrainingEvent[], MatchEvent[]]) =>
					this.convertIntoTableData(sessions, events, games)
				),
				untilDestroyed(this)
			)
			.subscribe({
				next: (converted: ImportStore[]) => {
					const info: ImportedSessionSetInfo = {
						importStores: converted,
						currentTeamSplitSession: this.currentTeamSplitSession,
						currentTeamGameSplitSession: this.currentTeamGameSplitSession
					};
					this.sessions.emit(info);
					this.store$.dispatch(ImportStoreActions.nextPhase());
				},
				error: (err: Error) => this.error.handleError(err)
			});
	}

	private parseFile(file: File): Observable<any> {
		return this.readCSVFile(file).pipe(
			map((results: string) => this.extractRawData(results)),
			tap((results: Papa.ParseResult<any>) => this.validateRawData(results, file.name)),
			map(({ data }: Papa.ParseResult<any>) => this.getSessionPlayerData(data)),
			tap(([sessions]: Array<any>) => this.validateSessionPlayerData(sessions, file.name, this.translate)),
			map(([sessions, parsed]: Array<any>) => sessions.map(data => this.encapsulateIntoSessionPlayer(data, parsed))),
			map((rawSessions: RawSessionPlayerData[]) => rawSessions.map(data => this.encapsulateIntoSessionImport(data))),
			tap((rawImports: RawSessionImportData[]) => this.validateDate(rawImports, file.name, this.translate)),
			tap((rawImports: RawSessionImportData[]) => this.onLoadEnd(rawImports, file.name, this.translate)),
			catchError((errors: SessionMessage[]) => {
				this.messages.emit(errors);
				throw `Error while importing ${file.name}`;
			}),
			first()
		);
	}

	private readCSVFile(file: File): Observable<string> {
		const fileReader = new FileReader();
		return new Observable((observer: Observer<string>) => {
			fileReader.readAsText(file);
			fileReader.onloadstart = () => this.onLoadStart(file.name);
			fileReader.onloadend = () => {
				this.isFileSelected = false;
				observer.next(fileReader.result as string);
			};
			fileReader.onerror = (e: Event) => {
				fileReader.abort();
				this.isFileSelected = false;
				observer.error(e);
			};
		});
	}

	private onLoadEnd(sessions: RawSessionImportData[], name: string, translate: TranslateService) {
		const filtered = sessions.filter(({ notMappedPlayers }) => notMappedPlayers.length > 0);
		if (filtered?.length) {
			this.messages.emit([
				{
					severity: 'warn',
					summary: name,
					detail: translate.instant('import.feedbacks.parsedWithUnmapped')
				}
			]);
		} else {
			this.messages.emit([
				{
					severity: 'info',
					summary: name,
					detail: translate.instant('import.feedbacks.parsed')
				}
			]);
		}
	}

	private onLoadStart(name: string) {
		this.messages.emit([
			{
				severity: 'info',
				summary: name,
				detail: this.translate.instant('import.feedbacks.parsing')
			}
		]);
	}

	private extractRawData(csvData: string): Papa.ParseResult<any> {
		const parsed: Papa.ParseResult<any> = Papa.parse(csvData, {
			header: true,
			skipEmptyLines: true
		});

		return parsed;
	}

	private validateRawData({ errors }: Papa.ParseResult<any>, name: string) {
		if (errors.length > 0) {
			throw errors.map(({ message, row }) => ({
				severity: 'error',
				summary: name,
				detail: `${message} (Row ${row + 1})`
			}));
		}
	}

	private getSessionPlayerData(data: unknown[]): Array<any> {
		const sessions = this.convertIntoSessionPlayerData(data);
		const grouped = this.splitIntoDifferentSessionData(sessions);
		return [grouped, data];
	}

	private convertIntoSessionPlayerData(parsed: unknown[]): SessionPlayerData[] {
		return this.etlGpsService.getSessionsFromCsv(parsed, this.currentTeam);
	}

	private splitIntoDifferentSessionData(data: SessionPlayerData[]): Array<SessionPlayerData[]> {
		const groupByDate = groupBy(data, this.currentTeam._gpsProviderMapping.dateColumn);
		return Object.values(groupByDate);
	}

	private encapsulateIntoSessionPlayer(sessions: SessionPlayerData[], parsed?: unknown[]): RawSessionPlayerData {
		const teamId = this.auth.getCurrentUserData().currentTeamId;
		const notMappedPlayers: string[] = [];

		sessions.forEach(session => {
			session.gdType = this.calendarService.getGD(session.date);
			session.teamId = teamId;

			const playerName = session.playerName.trim().toLowerCase();
			const player = this.players.find(({ displayName }) => displayName.trim().toLowerCase() === playerName);
			if (!player) {
				notMappedPlayers.push(session.playerName);
			} else {
				session.playerId = player.id;
			}
		});

		return { sessions, notMappedPlayers, parsed };
	}

	private encapsulateIntoSessionImport({
		sessions,
		notMappedPlayers,
		parsed
	}: RawSessionPlayerData): RawSessionImportData {
		const teamId = this.auth.getCurrentUserData().currentTeamId;
		const mainSessionPlayerData = sessions.find(({ mainSession }) => mainSession);

		let derivedMainSessionData: Pick<RawSessionImportData, 'date' | 'gdType' | 'nameSession'>;

		if (mainSessionPlayerData) {
			const isGame = mainSessionPlayerData.splitName === this.currentTeamGameSplitSession;
			const defaultName = `${moment(mainSessionPlayerData.date).format('DD/MM/YYYY HH:mm')} ${
				isGame ? ' GAME' : ' SESSION'
			}`;

			derivedMainSessionData = {
				date: mainSessionPlayerData.date,
				gdType: isGame ? 'GD' : this.calendarService.getGD(mainSessionPlayerData.date),
				nameSession: derivedMainSessionData?.nameSession || defaultName
			};
		}

		const session: RawSessionImportData = {
			id: undefined,
			...derivedMainSessionData,
			csvFile: String(Papa.unparse(parsed)),
			teamId,
			identifier: `${teamId}_${String(derivedMainSessionData?.nameSession)}`,
			headers: this.getHeaders(parsed),
			sessionPlayerData: sessions.filter(({ playerId }) => playerId),
			notMappedPlayers: uniq(notMappedPlayers)
		};

		return session;
	}

	private getHeaders([first]: unknown[]): string[] {
		return Object.keys(first)
			.filter(field => !this.excludedHeaders.includes(field))
			.map(field => field.replace(/�/g, '_'));
	}

	private validateDate(sessions: RawSessionImportData[], name: string, translate: TranslateService) {
		const filtered = flatten(sessions).filter(({ date }) => !moment(date).isValid());
		if (filtered?.length) {
			throw {
				severity: 'error',
				summary: name,
				detail: `${translate.instant('import.feedbacks.errors.invalidDate')}`
			};
		}
	}

	private validateSessionPlayerData(
		allSessions: Array<SessionPlayerData[]>,
		name: string,
		translate: TranslateService
	) {
		const filtered = flatten(allSessions).filter(({ splitName }) =>
			[this.currentTeamSplitSession, this.currentTeamGameSplitSession].includes(splitName)
		);
		if (!filtered || filtered.length === 0) {
			throw {
				severity: 'error',
				summary: name,
				detail: `${translate.instant('import.feedbacks.errors.noMainSplitName')}`
			};
		}
	}

	private convertIntoTableData(
		rawSessions: RawSessionImportData[],
		events: TrainingEvent[],
		matches: MatchEvent[]
	): ImportStore[] {
		const converted = this.importGpsService.buildSessionForTable(rawSessions, events, matches);
		const fields = this.etlGpsService
			.getMetricsMapping()
			.filter(({ algo }) => !algo)
			.map(({ metricName }) => metricName);
		converted.forEach(x => (x.sessionObj.headers = fields));
		return converted;
	}
}

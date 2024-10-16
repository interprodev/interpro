import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	Customer,
	ExtendedPlayerScouting,
	LoopBackAuth,
	Player,
	PlayerApi,
	PlayerDescriptionEntry,
	PlayerReportEntriesEmitter,
	PlayerScoutingApi,
	Team
} from '@iterpro/shared/data-access/sdk';
import { ReportDownloadComponent } from '@iterpro/shared/ui/components';
import { CustomerNamePipe, MarkedPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	EditModeService,
	ErrorService,
	TINY_EDITOR_OPTIONS,
	getId,
	getMomentFormatFromStorage,
	parseHtmlStringToText,
	sortByDate
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EditorModule as TinyMceEditorModule } from '@tinymce/tinymce-angular';
import { saveAs } from 'file-saver';
import { cloneDeep, last } from 'lodash';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { first } from 'rxjs/operators';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [
		CommonModule,
		TranslateModule,
		PrimeNgModule,
		FormsModule,
		TinyMceEditorModule,
		ReportDownloadComponent,
		MarkedPipe
	],
	selector: 'iterpro-player-descriptions-entries',
	templateUrl: './player-descriptions-entries.component.html',
	styleUrls: ['./player-descriptions-entries.component.scss']
})
export class PlayerDescriptionsEntriesComponent implements OnInit, OnChanges {
	@Input() player!: Player | ExtendedPlayerScouting;
	@Input() customers: Customer[] = [];
	@Input() type!: 'Player' | 'PlayerScouting';
	@Input() team!: Team;
	@Output() playerDescriptionsEmitter: EventEmitter<PlayerReportEntriesEmitter> =
		new EventEmitter<PlayerReportEntriesEmitter>();
	playerDescriptionsEntry!: PlayerDescriptionEntry | null;
	private tempPlayerDescriptionsEntry!: PlayerDescriptionEntry | null;
	private tempPlayerDescriptions!: PlayerDescriptionEntry[] | null;
	protected readonly tinyEditorInit = TINY_EDITOR_OPTIONS;
	isLoading = true;
	historicalRecordsOptions!: SelectItem[];
	apiService!: PlayerApi | PlayerScoutingApi;
	protected readonly getId = getId;
	relevantLinkUrl!: string;
	relevantLinkLabel!: string;
	constructor(
		private auth: LoopBackAuth,
		private error: ErrorService,
		public editService: EditModeService,
		private playerApi: PlayerApi,
		private translate: TranslateService,
		private customerPipe: CustomerNamePipe,
		private playerScoutingApi: PlayerScoutingApi,
		private confirmationService: ConfirmationService
	) {}

	ngOnInit(): void {
		this.loadAPIService();
		this.loadPlayerDescriptionsEntry();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['player'] && changes['player'].currentValue) {
			this.player.descriptions = sortByDate(this.player?.descriptions || [], 'date');
			this.resetPlayerDescriptionEntry();
			setTimeout(() => {
				this.loadPlayerDescriptionsEntry();
			}, 100);
		}
	}

	private resetPlayerDescriptionEntry() {
		this.playerDescriptionsEntry = null;
		this.tempPlayerDescriptionsEntry = null;
		this.tempPlayerDescriptions = null;
	}

	private loadAPIService() {
		switch (this.type) {
			case 'Player':
				this.apiService = this.playerApi;
				break;
			case 'PlayerScouting':
				this.apiService = this.playerScoutingApi;
				break;
			default:
				console.error('PlayerAttributesEntriesComponent: type not supported');
		}
	}

	private loadPlayerDescriptionsEntry() {
		this.isLoading = true;
		this.playerDescriptionsEntry = last(this.player.descriptions || []) as PlayerDescriptionEntry;
		this.loadDescriptionsHistoryOptions();
		this.isLoading = false;
	}

	private loadDescriptionsHistoryOptions() {
		this.historicalRecordsOptions = (this.player.descriptions || [])
			.map((entry: PlayerDescriptionEntry) => ({
				label: `${moment(entry.date).format(getMomentFormatFromStorage())} - ${this.customerPipe.transform(
					entry.authorId,
					this.customers
				)}`,
				value: getId(entry)
			}))
			.reverse();
	}
	onSelectHistoricalRecord(entryId: string) {
		this.playerDescriptionsEntry = this.player.descriptions.find(
			item => getId(item) === entryId
		) as PlayerDescriptionEntry;
	}

	//#region CRUD
	onAddNewEntry() {
		this.tempPlayerDescriptions = cloneDeep(this.player.descriptions);
		this.tempPlayerDescriptionsEntry = cloneDeep(this.playerDescriptionsEntry);
		this.playerDescriptionsEntry = this.getBasicDescriptionEntryFields();
		this.editService.editMode = true;
	}

	onDeleteEntry() {
		if (!getId(this.playerDescriptionsEntry)) {
			this.playerDescriptionsEntry = last(this.player.descriptions || []) as PlayerDescriptionEntry;
			return;
		}
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.edit'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => this.deleteEntry()
		});
	}

	private deleteEntry() {
		this.isLoading = true;
		this.apiService
			.destroyByIdDescriptions(this.player.id, getId(this.playerDescriptionsEntry))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.player.descriptions = this.player.descriptions.filter(
						({ id }) => id !== getId(this.playerDescriptionsEntry)
					);
					this.playerDescriptionsEntry = last(this.player.descriptions || []) as PlayerDescriptionEntry;
					this.loadDescriptionsHistoryOptions();
					this.editService.editMode = false;
					this.isLoading = false;
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private getBasicDescriptionEntryFields(): PlayerDescriptionEntry {
		return {
			date: moment().toDate(),
			authorId: this.auth.getCurrentUserId(),
			description: null,
			weaknesses: null,
			strengths: null,
			notesThreads: []
		} as any;
	}

	private getEntryWithoutId(entry: PlayerDescriptionEntry): PlayerDescriptionEntry {
		delete (entry as any)?._id;
		return entry;
	}

	saveEntry() {
		this.isLoading = true;
		const data = cloneDeep(this.playerDescriptionsEntry);
		const isNew = !getId(data);
		const obs$ = isNew
			? this.apiService.createDescriptions(this.player.id, data)
			: this.apiService.updateByIdDescriptions(
					this.player.id,
					getId(this.playerDescriptionsEntry),
					this.getEntryWithoutId(data as PlayerDescriptionEntry)
			  );
		obs$.pipe(first(), untilDestroyed(this)).subscribe({
			next: (entry: PlayerDescriptionEntry) => {
				if (!isNew) {
					this.player.descriptions = this.player.descriptions.map(item => {
						if (getId(item) === getId(data)) {
							return entry;
						}
						return item;
					});
				} else {
					this.player.descriptions = sortByDate([...(this.player?.descriptions || []), entry], 'date');
				}
				this.playerDescriptionsEmitter.emit({
					descriptions: this.player.descriptions,
					playerId: getId(this.player) as string
				});
				this.playerDescriptionsEntry = entry;
				this.loadDescriptionsHistoryOptions();
				this.editService.editMode = false;
				this.isLoading = false;
			},
			error: (error: Error) => this.error.handleError(error)
		});
	}

	onDiscard() {
		this.player.descriptions = cloneDeep(this.tempPlayerDescriptions) as PlayerDescriptionEntry[];
		this.playerDescriptionsEntry = cloneDeep(this.tempPlayerDescriptionsEntry);
		if (!this.playerDescriptionsEntry) {
			this.playerDescriptionsEntry = last(this.player.descriptions || []) as PlayerDescriptionEntry;
		}
		this.editService.editMode = false;
	}

	onEdit() {
		this.tempPlayerDescriptions = cloneDeep(this.player.descriptions);
		this.tempPlayerDescriptionsEntry = cloneDeep(this.playerDescriptionsEntry);
		this.editService.editMode = true;
	}
	downloadCSV() {
		const csvData: any[] = [];
		this.player.descriptions.forEach((row: PlayerDescriptionEntry) => {
			const links = {};
			Object.values(row.relevantLinks).forEach((item: { label: string; url: string }) => {
				links[item.label] = item.url;
			});
			csvData.push({
				date: moment(row.date).format(getMomentFormatFromStorage()),
				author: this.customerPipe.transform(row.authorId, this.customers),
				description: parseHtmlStringToText(row.description),
				strengths: parseHtmlStringToText(row.strengths),
				weaknesses: parseHtmlStringToText(row.weaknesses),
				recommendations: row.recommendations,
				...links
			}) as any;
		});
		const results = Papa.unparse(csvData);
		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, `${this.player.displayName} - ${this.team.name} descriptions history.csv`);
	}
	//endregion

	//#region RelevantLink
	addLink(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (!this.relevantLinkUrl || !this.relevantLinkLabel) return;
		if (this.playerDescriptionsEntry && !this.playerDescriptionsEntry?.relevantLinks)
			this.playerDescriptionsEntry.relevantLinks = [];
		this.playerDescriptionsEntry?.relevantLinks.push({ label: this.relevantLinkLabel, url: this.relevantLinkUrl });
		this.relevantLinkUrl = this.relevantLinkLabel = '';
	}

	removeLink(i: number) {
		if (this.playerDescriptionsEntry) {
			this.playerDescriptionsEntry.relevantLinks = this.playerDescriptionsEntry?.relevantLinks.filter(
				(player: PlayerDescriptionEntry, index: number) => i !== index
			) as any[];
		}
	}
	//endregion
}

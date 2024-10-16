import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	AdditionalFieldEntry,
	AttributeCategory,
	Customer,
	ExtendedPlayerScouting,
	LoopBackAuth,
	MixedAttributeCategory,
	Player,
	PlayerApi,
	PlayerAttributesEntry,
	PlayerReportEntriesEmitter,
	PlayerScoutingApi,
	SwissAttributeCategory,
	Team,
	attributeCategories,
	swissAttributesCategories, PotentialLetter
} from '@iterpro/shared/data-access/sdk';
import { ReportDownloadComponent } from '@iterpro/shared/ui/components';
import { CustomerNamePipe, FilterByFieldPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	EditModeService,
	ErrorService,
	completeWithAdditionalFields,
	getAvgValueForSpinner,
	getColorClass,
	getId,
	getLetterColorClass,
	getLiteralAvg,
	getMomentFormatFromStorage,
	getNumericalAvg,
	getPlayerAttributesEntryValue,
	getSpinnerColor,
	getStyleForInputNumber,
	sortByDate, getTeamsPlayerAttributes, getCategoryValues
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { saveAs } from 'file-saver';
import { cloneDeep, last } from 'lodash';
import * as moment from 'moment/moment';
import * as Papa from 'papaparse';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { first } from 'rxjs/operators';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [
		CommonModule,
		PrimeNgModule,
		FormsModule,
		TranslateModule,
		RoundProgressModule,
		ReportDownloadComponent,
		FilterByFieldPipe,
	],
	selector: 'iterpro-player-attributes-entries',
	templateUrl: './player-attributes-entries.component.html',
	styleUrls: ['./player-attributes-entries.component.scss'],
})
export class PlayerAttributesEntriesComponent implements OnInit, OnChanges {
	@Input({required: true}) player!: Player | ExtendedPlayerScouting;
	@Input({required: true}) customers: Customer[] = [];
	@Input({required: true}) type!: 'Player' | 'PlayerScouting';
	@Input({required: true}) team!: Team;
	@Input({required: true}) playerDescriptionSetting!: 'tipss' | 'attributes';
	@Output() playerAttributesEmitter: EventEmitter<PlayerReportEntriesEmitter> =
		new EventEmitter<PlayerReportEntriesEmitter>();
	playerAttributesEntry!: PlayerAttributesEntry | undefined;
	private tempPlayerAttributesEntry!: PlayerAttributesEntry | undefined;
	private tempPlayerAttributes!: PlayerAttributesEntry[] | undefined;
	isLoading = true;
	historicalRecordsOptions!: SelectItem[];
	errorField: ErrorField = { metricName: '', categoryName:'', errorMessage: null };
	attributeCategories: { title: string; category: AttributeCategory }[] = attributeCategories;
	swissAttributesCategories: { title: string; category: SwissAttributeCategory }[] = swissAttributesCategories;
	apiService!: PlayerApi | PlayerScoutingApi;
	inputValidatorPrognosis = /^[A|B|C|a|b|c]*$/;
	protected readonly getId = getId;
	constructor(
		private auth: LoopBackAuth,
		private error: ErrorService,
		public editService: EditModeService,
		private playerApi: PlayerApi,
		private translate: TranslateService,
		private customerPipe: CustomerNamePipe,
		private playerScoutingApi: PlayerScoutingApi,
		private confirmationService: ConfirmationService,
	) {}

	ngOnInit(): void {
		this.loadAPIService();
		this.loadPlayerAttributesEntry();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['player'] && changes['player'].currentValue) {
			this.player.attributes = sortByDate(this.player?.attributes || [], 'date');
			this.resetPlayerAttributesEntry();
			setTimeout(() => {
				this.loadPlayerAttributesEntry();
			}, 100);
		}
	}

	private resetPlayerAttributesEntry() {
		this.playerAttributesEntry = undefined;
		this.tempPlayerAttributesEntry = undefined;
		this.tempPlayerAttributes = undefined;
	}

	private loadAPIService() {
		switch (this.type) {
			case 'Player':
				this.apiService = this.playerApi;
				break;
			case 'PlayerScouting':
				this.apiService = this.playerScoutingApi;
				this.swissAttributesCategories = this.swissAttributesCategories.filter(
					({ category }) => category === 'prognosis'
				);
				break;
			default:
				console.error('PlayerAttributesEntriesComponent: type not supported');
		}
	}

	private loadPlayerAttributesEntry(): void {
		this.isLoading = true;
		this.selectLastEntry();
		this.isLoading = false;
	}

	private selectLastEntry() {
		if (this.player?.attributes?.length > 0) {
			this.playerAttributesEntry = completeWithAdditionalFields(
				last(this.player?.attributes || []) as PlayerAttributesEntry,
				getTeamsPlayerAttributes([this.team]),
				this.type,
				this.team?.club?.scoutingSettings
			);
		}
		this.loadAttributesHistoryOptions();
	}

	private removeAdditionalFields(entry: PlayerAttributesEntry): PlayerAttributesEntry {
		return {
			...entry,
			values: (entry?.values || []).map(item => {
				return {
					metric: item.metric,
					value: item.value
				};
			})
		};
	}

	onSelectHistoricalRecord(entryId: string) {
		this.playerAttributesEntry = completeWithAdditionalFields(
			this.player.attributes.find(item => getId(item) === entryId) as PlayerAttributesEntry,
			getTeamsPlayerAttributes([this.team]),
			this.type,
			this.team?.club?.scoutingSettings
		);
	}

	private loadAttributesHistoryOptions() {
		this.historicalRecordsOptions = (this.player.attributes || [])
			.map((entry: PlayerAttributesEntry) => ({
				label: `${moment(entry.date).format(getMomentFormatFromStorage())} - ${this.customerPipe.transform(
					entry.authorId,
					this.customers
				)}`,
				value: getId(entry)
			}))
			.reverse();
	}

	//endregion

	//#region CRUD

	onAddNewEntry() {
		this.playerAttributesEntry = this.newAttributesEntry();
		this.tempPlayerAttributes = cloneDeep(this.player.attributes); 
		this.editService.editMode = true;
		this.errorField = { metricName: '', categoryName: '', errorMessage: null };

	}

	onDeleteEntry() {
		if (!getId(this.playerAttributesEntry)) {
			this.playerAttributesEntry = completeWithAdditionalFields(
				last(this.player.attributes || []) as PlayerAttributesEntry,
				getTeamsPlayerAttributes([this.team]),
				this.type,
				this.team?.club?.scoutingSettings
			);
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
			.destroyByIdAttributes(this.player.id, getId(this.playerAttributesEntry))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.player.attributes = this.player.attributes.filter(({ id }) => id !== getId(this.playerAttributesEntry));
					this.playerAttributesEntry = completeWithAdditionalFields(
						last(this.player.attributes || []) as PlayerAttributesEntry,
						getTeamsPlayerAttributes([this.team]),
						this.type,
						this.team?.club?.scoutingSettings
					);
					this.loadAttributesHistoryOptions();
					this.editService.editMode = false;
					this.isLoading = false;
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private newAttributesEntry(): PlayerAttributesEntry {
		let basicEntry: PlayerAttributesEntry = this.getBasicAttributesEntryFields();
		basicEntry = completeWithAdditionalFields(
			basicEntry,
			getTeamsPlayerAttributes([this.team]),
			this.type,
			this.team?.club?.scoutingSettings
		);
		return basicEntry;
	}

	private getBasicAttributesEntryFields(): PlayerAttributesEntry {
		return {
			date: moment().toDate(),
			authorId: this.auth.getCurrentUserId(),
			values: [],
			notesThreads: []
		} as any;
	}

	private getEntryWithoutId(entry: PlayerAttributesEntry): PlayerAttributesEntry {
		delete (entry as any)?._id;
		return entry;
	}

	saveEntry() {
		this.isLoading = true;
		const data = this.removeAdditionalFields(this.playerAttributesEntry as PlayerAttributesEntry);
		const isNew = !getId(data);
		const obs$ = isNew
			? this.apiService.createAttributes(this.player.id, data)
			: this.apiService.updateByIdAttributes(this.player.id, getId(data), this.getEntryWithoutId(data));
		obs$.pipe(first(), untilDestroyed(this)).subscribe({
			next: (entry: PlayerAttributesEntry) => {
				const entryWithAdditionalFields: PlayerAttributesEntry = completeWithAdditionalFields(
					entry,
					getTeamsPlayerAttributes([this.team]),
					this.type,
					this.team?.club?.scoutingSettings
				);
				if (!isNew) {
					this.player.attributes = this.player.attributes.map(item => {
						if (getId(item) === getId(entry)) {
							return completeWithAdditionalFields(entryWithAdditionalFields,
								getTeamsPlayerAttributes([this.team]),
								this.type,
								this.team?.club?.scoutingSettings);
						}
						return item;
					});
				} else {
					this.player.attributes = sortByDate([...(this.player?.attributes || []), entryWithAdditionalFields], 'date');
				}
				this.playerAttributesEmitter.emit({
					attributes: this.player.attributes.map(a => this.removeAdditionalFields(a)),
					playerId: getId(this.player) as string
				});
				this.playerAttributesEntry = entryWithAdditionalFields;
				this.loadAttributesHistoryOptions();
				this.editService.editMode = false;
				this.isLoading = false;
			},
			error: (error: Error) => this.error.handleError(error)
		});
	}

	onDiscard() {
		this.player.attributes = cloneDeep(this.tempPlayerAttributes) as PlayerAttributesEntry[];
		this.playerAttributesEntry = cloneDeep(this.tempPlayerAttributesEntry);
		if (!this.playerAttributesEntry) {
			this.selectLastEntry();
		}
		this.editService.editMode = false;
	}

	onEdit() {
		this.tempPlayerAttributes = cloneDeep(this.player.attributes);
		this.tempPlayerAttributesEntry = cloneDeep(this.playerAttributesEntry);
		this.editService.editMode = true;
	}

	downloadCSV() {
		const csvData: any[] = [];
		this.player.attributes.forEach((row: PlayerAttributesEntry) => {
			const values = {};
			Object.values(row.values).forEach((item: AdditionalFieldEntry) => {
				values[item.metric] = item.value;
			});
			csvData.push({
				date: moment(row.date).format(getMomentFormatFromStorage()),
				author: this.customerPipe.transform(row.authorId, this.customers),
				...values
			});
		});
		const results = Papa.unparse(csvData);
		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, `${this.player.displayName} - ${this.team.name} attributes history.csv`);
	}

	//endregion

	//region Template Utils

	getAvgValue(category: MixedAttributeCategory, base: number): string {
		if (category === 'potential') {
			return getLiteralAvg(this.playerAttributesEntry as PlayerAttributesEntry, 'potential');
		} else if (category === 'prognosis') {
			const value = getPlayerAttributesEntryValue(
				this.playerAttributesEntry as PlayerAttributesEntry,
				'prognosisScore'
			);
			return value ? String(value) : '-';
		}
		return getNumericalAvg(
			base,
			getCategoryValues(this.playerAttributesEntry as PlayerAttributesEntry, category),
			this.team.club.scoutingSettings
		);
	}

	getAvgValueForSpinner(category: MixedAttributeCategory): number {
		if (category === 'potential') {
			return this.getAvgValueForSpinnerPotential();
		} else if (category === 'prognosis') {
			return this.convertToSpinnerPercentage(
				String(getPlayerAttributesEntryValue(this.playerAttributesEntry as PlayerAttributesEntry, 'prognosisScore'))
			);
		}
		return getAvgValueForSpinner(
			this.playerDescriptionSetting === 'attributes',
			getCategoryValues(this.playerAttributesEntry as PlayerAttributesEntry, category),
			this.team.club.scoutingSettings
		);
	}

	getSpinnerColor(category: MixedAttributeCategory): string {
		if (category === 'potential') {
			return this.getSpinnerColorPotential();
		} else if (category === 'prognosis') {
			return this.getSpinnerColorPrognosis();
		}
		return getSpinnerColor(
			this.playerDescriptionSetting === 'attributes',
			getCategoryValues(this.playerAttributesEntry as PlayerAttributesEntry, category),
			this.team.club.scoutingSettings
		);
	}

	getStyleForInputNumber(value: number): { [key: string]: string } {
		return getStyleForInputNumber(
			value,
			this.playerDescriptionSetting === 'attributes',
			this.team.club.scoutingSettings,
			this.editService.editMode
		);
	}

	private getSpinnerColorPotential(): string {
		const potential = this.getAvgValue('potential', this.playerDescriptionSetting === 'attributes' ? 10 : 20) as PotentialLetter;
		return getLetterColorClass(potential);
	}

	private getSpinnerColorPrognosis(): string {
		return getLetterColorClass(
			String(getPlayerAttributesEntryValue(this.playerAttributesEntry as PlayerAttributesEntry, 'prognosisScore')) as PotentialLetter
		);
	}

	getColorClass(value: number, base: number): string {
		return getColorClass(
			value,
			base,
			this.playerDescriptionSetting === 'attributes',
			this.team.club.scoutingSettings,
			true
		);
	}

	private getAvgValueForSpinnerPotential(): number {
		const avg = getLiteralAvg(this.playerAttributesEntry as PlayerAttributesEntry, 'potential');
		return this.convertToSpinnerPercentage(avg);
	}

	private convertToSpinnerPercentage(num: string): number {
		switch (num) {
			case 'A':
				return 100;
			case 'B':
				return 66;
			case 'C':
				return 33;
			default:
				return 0;
		}
	}

	getArrow(metric: string): string | null {
		if (!this.player?.attributes || this.player?.attributes?.length === 0) return null;
		const index = this.player.attributes.findIndex(({ date }) =>
			moment(date).isSame(this.playerAttributesEntry?.date, 'day')
		);
		const current = getPlayerAttributesEntryValue(this.playerAttributesEntry as PlayerAttributesEntry, metric) || 1;
		const previous =
			index !== -1 && this.player.attributes[index - 1]
				? getPlayerAttributesEntryValue(this.player.attributes[index - 1], metric)
				: null;
		return previous ? (current > previous ? 'fa-arrow-up' : current < previous ? 'fa-arrow-down' : null) : null;
	}
	//endregion


	hasEmptyFields(): boolean | undefined {
		return this.playerAttributesEntry?.values.some((item: any) => item.value === '' || item.value === null);
		}

	updatePlayerAttributesEntry = (metricName: string, categoryName: string, value: string) => {
		return {
		  ...this.playerAttributesEntry,
		  values: (this.playerAttributesEntry?.values || []).map(item => {
			return item.metricName === metricName && item.category === categoryName ? { ...item, value } : item;
		  })
		} as PlayerAttributesEntry;
	  };
	
	blurValidator(event: any,  metricName: string, categoryName: string) {
		const max = 10;
		const isEmpty = event.target.value === ''
		if (isEmpty) {
			this.playerAttributesEntry = this.updatePlayerAttributesEntry(metricName, categoryName, event.target.value);
			this.errorField = {
				metricName: metricName,
				categoryName,
				errorMessage: this.translate.instant('my-team.attributes.validator', { value: max })
			};
		} else {
			this.errorField = { metricName: '', categoryName, errorMessage: null };
		} 
	}

	inputValidator(event: any, metricName: string, categoryName: string) {
		const pattern =
			this.playerDescriptionSetting === 'attributes'
				? /^([1-9]|10)$/
				: this.team.club.scoutingSettings.tipssSettings.scale === 'fiveDouble'
				? /^(?:[1-4](?:\.5)?|5)$/
				: /^(?:[1-9]?|10)$/;
		const min = 1;
		const max =
			this.playerDescriptionSetting === 'attributes'
				? 10
				: this.team.club.scoutingSettings.tipssSettings.scale === 'fiveDouble'
				? 5
				: 10;

			const isInvalid = ((event.target.value > max || event.target.value < min || !pattern.test(event.target.value)) && event.target.value !== '')
			 if (isInvalid) {
		    	event.target.value = event.target.value.substr(0, event.target.value.length - 1);
				this.playerAttributesEntry = this.updatePlayerAttributesEntry(metricName, categoryName, event.target.value);
		} 
	}	
}


interface ErrorField {
	metricName: string;
	categoryName: string;
	errorMessage: string | null;
}

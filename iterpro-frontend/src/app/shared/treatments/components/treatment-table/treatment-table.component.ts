import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { AuthActions, AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import {
	Club,
	ClubApi,
	Customer,
	EventApi,
	Injury,
	LoopBackAuth,
	MEDICAL_TREATMENTS,
	MedicalTreatment,
	Player,
	Team,
	TeamApi,
	TreatmentMetric
} from '@iterpro/shared/data-access/sdk';
import { EditorDialogComponent } from '@iterpro/shared/ui/components';
import { CustomerNamePipe, CustomerNameSelectItemPipe, SelectItemLabelPipe } from '@iterpro/shared/ui/pipes';
import {
	ConstantService,
	CustomTreatmentService,
	ErrorService,
	ReportService,
	getMomentFormatFromStorage,
	sortByDateDesc,
	sortByName, AlertService
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { cloneDeep, isArray } from 'lodash';
import moment from 'moment';
import * as Papa from 'papaparse';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog/dynamicdialog-ref';
import { distinctUntilChanged, filter, first, take } from 'rxjs/operators';
import {
	ApplyToPlayersEvent,
	DeleteTreatmentEvent,
	SaveTreatmentEvent,
	TreatmentColumn,
	TreatmentSection,
	TreatmentType
} from '../../interfaces/treatment-table.interface';
import { MedicationLabelPipe } from '../../pipes/medication-label.pipe';
import { TreatmentCategoriesTooltipPipe } from '../../pipes/treatment-categories-tooltip.pipe';
import { TreatmentCompletePipe } from '../../pipes/treatment-complete.pipe';
import { TreatmentsTooltipPipe } from '../../pipes/treatments-tooltip.pipe';
import { getReportCSV } from '../../utils/csv-report.utils';
import { TreatmentEditComponent } from '../treatment-edit/treatment-edit.component';
import * as TrtUtilsService from './../../utils/treatment-table-utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

@UntilDestroy()
@Component({
	selector: 'iterpro-treatment-table',
	templateUrl: './treatment-table.component.html',
	styleUrls: ['./treatment-table.component.scss'],
	providers: [CustomerNameSelectItemPipe]
})
export class TreatmentTableComponent implements OnInit, OnChanges {
	@Input() readonly section: TreatmentSection = 'injury';
	@Input() readonly mode: 'single' | 'multiple' = 'single';
	@Input() rows: TreatmentType[] = []; // treatments
	@Input() readonly injuries: Injury[] = [];
	@Input() readonly injury: Injury;
	@Input() readonly player: Player;
	@Input() readonly players: Player[];
	@Input() showFilters = false;
	@Input() tableScrollHeight: string = '500px';
	@Input() readonlyMode = false;
	@Input() currentEventDate: Date;
	filteredRows: TreatmentType[] = [];
	backupRows: TreatmentType[];
	@Output() deleteRow: EventEmitter<DeleteTreatmentEvent> = new EventEmitter();
	@Output() saveRow: EventEmitter<SaveTreatmentEvent> = new EventEmitter();
	@Output() applyToPlayers: EventEmitter<ApplyToPlayersEvent> = new EventEmitter();

	secMetrics: TreatmentMetric[];
	physiotherapyMetrics: TreatmentMetric[];
	injuryOptions: SelectItem[] = [];
	locationOptions: SelectItem[] = [];
	injuryTypeOptions: SelectItem[] = [];
	physioCategoriesOptions: SelectItem[] = [];
	physioTreatmentsOptions: TreatmentMetric[] = [];
	secTreatmentsOptions: SelectItem[] = [];
	treatmentTypesOptions: SelectItem[] = [
		{ label: 'prevention.treatments.physiotherapy', value: 'physiotherapy' },
		{ label: 'prevention.treatments.medicationSupplements', value: 'medicationSupplements' },
		{ label: 'prevention.treatments.sec', value: 'SeC' }
	];
	pinnedTreatments: string[] = [];
	playersApplyTo: Player[] = [];
	deleteRowDialog: { visible: boolean; row: TreatmentType } = {
		visible: false,
		row: null
	};
	admMappings: Map<string, string> = new Map<string, string>();
	customers: Customer[] = [];
	customerOptions: SelectItem[] = [];

	allColumns: TreatmentColumn[] = [
		{ header: 'prevention.treatments.complete', align: 'center', tooltip: 'tooltip.complete', width: '100' },
		{ header: 'prevention.treatments.data', required: true, tooltip: 'tooltip.date', width: '120' },
		{ header: 'prevention.treatments.time', required: true, tooltip: 'tooltip.time', width: '80' },
		{ header: 'prevention.treatments.treatmentType', required: true, tooltip: 'tooltip.treatmentType', width: '200' },
		{
			header: 'medical.infirmary.details.category',
			required: false,
			tooltip: 'medical.infirmary.details.category',
			width: '400'
		},
		{ header: 'prevention.treatments.treatment', required: false, tooltip: 'tooltip.treatment', width: '400' },
		{ header: 'prevention.treatments.drug', tooltip: 'tooltip.drug', width: '300' },
		{ header: 'prevention.treatments.dose', tooltip: 'tooltip.dose', width: '300' },
		{ header: 'prevention.treatments.prescription', tooltip: 'tooltip.prescription', width: '200' },
		{ header: 'prevention.treatments.author', tooltip: 'tooltip.author', width: '200' },
		{ header: 'medical.infirmary.treatment.attachment', tooltip: 'tooltip.attachment', width: '150' },
		{
			header: 'medical.infirmary.details.issue.injury',
			required: false,
			tooltip: 'medical.infirmary.details.issue.injury',
			width: '200'
		},
		{ header: 'prevention.treatments.location', required: false, tooltip: 'tooltip.location', width: '100' },
		{ header: 'prevention.treatments.type', tooltip: 'tooltip.type', width: '200' },
		{ header: 'lastAuthor', tooltip: 'lastAuthor', width: '250' },
		{ header: 'prevention.treatments.note', tooltip: 'tooltip.note', align: 'center', width: '100' }
	];

	tableFilters: {
		period: { model: Date[] };
		treatmentType: { model: string[]; options: SelectItem[] };
		treatmentCategory: { model: string[]; options: SelectItem[] };
		treatment: { model: string[]; options: SelectItem[] };
		author: { model: string[]; options: SelectItem[] };
		prescriptor: { model: string[]; options: SelectItem[] };
		injury: { model: string[]; options: SelectItem[] };
		injuryLocation: { model: string[]; options: SelectItem[] };
		injuryType: { model: string[]; options: SelectItem[] };
		completion: { model: string[]; options: SelectItem[] };
	};
	isLoading: boolean;
	team: Team;
	readonly #currentTeam$ = this.authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());

	constructor(
		private router: Router,
		private clubApi: ClubApi,
		private eventApi: EventApi,
		private auth: LoopBackAuth,
		private error: ErrorService,
		private report: ReportService,
		private readonly teamApi: TeamApi,
		private authStore: Store<AuthState>,
		private alertService: AlertService,
		private translate: TranslateService,
		private dialogService: DialogService,
		private confirmationService: ConfirmationService,
		private preventionConstantService: ConstantService,
		private customTreatmentService: CustomTreatmentService,
		private customerNamePipe: CustomerNamePipe,
		private selectItemLabelPipe: SelectItemLabelPipe,
		private medicationLabelPipe: MedicationLabelPipe,
		private treatmentsTooltipPipe: TreatmentsTooltipPipe,
		private treatmentCompletePipe: TreatmentCompletePipe,
		private treatmentCategoriesTooltipPipe: TreatmentCategoriesTooltipPipe,
		private customerNamesSelectItemPipe: CustomerNameSelectItemPipe
	) {
		this.#currentTeam$
			.pipe(distinctUntilChanged(),
				filter(team => !!team))
			.subscribe({
				next: (team: Team) => {
					this.team = team;
					this.initializeAdmMappings();
				}
			});
	}

	ngOnInit(): void {
		this.translate
			.get(this.auth.getCurrentUserData().currentLanguage)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: () => {
					this.loadUsersDataAndInitializeTreatments();
				}
			});
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['rows']) {
			if (this.rows) {
				this.isLoading = true;
				this.filteredRows = cloneDeep(this.rows);
				this.loadPlayerTreatments();
			}
		}
		if (changes['injuries']) {
			this.injuryOptions = this.getInjuryOptions();
		}
	}

	private initializeAdmMappings() {
		this.admMappings.set('Implant', 'implant');
		this.admMappings.set('Inhal', 'inhalation');
		this.admMappings.set('Instill', 'instillation');
		this.admMappings.set('N', 'nasal');
		this.admMappings.set('O', 'oral');
		this.admMappings.set('P', 'parenteral');
		this.admMappings.set('R', 'rectal');
		this.admMappings.set('SL', 'sublingual/buccal/oromucosal');
		this.admMappings.set('TD', 'transdermal');
		this.admMappings.set('V', 'vaginal');
		this.admMappings.set('', '');
	}

	private loadPlayerTreatments() {
		this.filteredRows.forEach((treatment: TreatmentType) => {
			if (Array.isArray(treatment.filteredPhysioTreatmentOptions))
				treatment.filteredPhysioTreatmentOptions = TrtUtilsService.sortByPinned(
					treatment.filteredPhysioTreatmentOptions || [],
					this.pinnedTreatments
				);
		});
		this.backupRows = this.backupRows ? this.backupRows : cloneDeep(this.filteredRows);
		this.isLoading = false;
	}

	private loadUsersDataAndInitializeTreatments() {
		const { clubId } = this.auth.getCurrentUserData();
		this.clubApi
			.getCustomers(clubId, { fields: ['id', 'firstName', 'lastName'] })
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (customers: Customer[]) => {
					this.customers = customers;
					const options = customers.map(({ firstName, lastName, id }) => ({
						label: firstName + ' ' + lastName,
						value: id
					}));
					this.customerOptions = sortByName(options, 'label');
					this.initializeTreatments();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	add() {
		this.openTreatmentEditDialog(undefined);
	}

	edit(treatment: TreatmentType, index: number) {
		this.openTreatmentEditDialog(treatment, index);
	}

	private openTreatmentEditDialog(treatment?: TreatmentType, index?: number): void {
		if (!this.player) {
			return this.alertService.notify('warn', 'medical.prevention.treatment', 'dropdown.placeholderPlayer', false);
		}
		const existingTreatment = index !== undefined;
		const baseHeader = existingTreatment
			? this.translate.instant('preferences.treatments.edit')
			: this.translate.instant('buttons.addTreatment');
		const dialogRef: DynamicDialogRef = this.dialogService.open(TreatmentEditComponent, {
			header: baseHeader + ' - ' + this.player.displayName,
			width: '70vw',
			height: '80vh',
			styleClass: 'dialog-header-padding-2 dialog-content-padding-2',
			data: {
				treatment,
				userId: this.auth.getCurrentUserId(),
				playerId: this.player?.id,
				injury: this.injury,
				pinnedTreatments: this.pinnedTreatments || [],
				secMetrics: this.secMetrics,
				physiotherapyMetrics: this.physiotherapyMetrics,
				injuryOptions: this.injuryOptions,
				locationOptions: this.locationOptions,
				injuryTypeOptions: this.injuryTypeOptions,
				physioCategoriesOptions: this.physioCategoriesOptions,
				physioTreatmentsOptions: this.physioTreatmentsOptions,
				secTreatmentsOptions: this.secTreatmentsOptions,
				treatmentTypesOptions: this.treatmentTypesOptions,
				admMappings: this.admMappings,
				customerOptions: this.customerOptions,
				currentTeam: this.team,
				currentEventDate: this.currentEventDate
			}
		});

		dialogRef.onClose
			.pipe(
				take(1),
				filter(treatment => !!treatment)
			)
			.subscribe(({ treatment, pinnedTreatments }) => {
				if (pinnedTreatments && pinnedTreatments !== this.pinnedTreatments) {
					this.savePinnedTreatments(pinnedTreatments);
				}
				if (this.instantCreationMode()) {
					this.save(treatment, index);
				} else {
					if (!existingTreatment) {
						this.filteredRows = [...this.filteredRows, treatment];
					} else {
						this.filteredRows[index] = treatment;
					}
				}
			});
	}

	clone(rowData: TreatmentType) {
		delete rowData?.attachedFile;
		const author = this.auth.getCurrentUserData();
		const item = cloneDeep({
			...rowData,
			id: undefined,
			lastUpdateAuthorId: author.id,
			lastUpdateAuthor: author,
			lastUpdateDate: moment().toDate()
		});
		this.openTreatmentEditDialog(item);
	}

	deleteFromEventConfirm(alsoEvent?: boolean) {
		this.deleteRow.emit({ alsoEvent, instance: this.deleteRowDialog.row });
		this.deleteRowDialog = {
			visible: false,
			row: null
		};
	}

	save(rowData: TreatmentType, rowIndex?: number) {
		const attachedFile = rowData?.attachedFile;
		delete rowData?.attachedFile;
		this.saveRow.emit({ instance: rowData, index: rowIndex, attachedFile });
	}

	private savePinnedTreatments(pinnedTreatments: string[]) {
		this.teamApi
			.patchAttributes(this.team.id, { pinnedTreatments: pinnedTreatments })
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (updated: Team) => {
					this.team = {
						...this.team,
						...updated
					};
					this.authStore.dispatch(
						AuthActions.performPatchTeam({teamId: this.team.id, team: { ...this.team}})
					);
					this.initializeTreatments();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	//#region Options Initialization

	private initializeTreatments() {
		const { pinnedTreatments } = this.team;
		this.pinnedTreatments = [...(pinnedTreatments || [])];
		const treatmentMetrics: TreatmentMetric[] = this.getTreatmentMetrics();
		this.secMetrics = treatmentMetrics.filter(({ type }) => type === 'sec');
		this.physiotherapyMetrics = treatmentMetrics.filter(({ type }) => type === 'physiotherapy');
		this.secTreatmentsOptions = this.getSecOptions();
		this.physioTreatmentsOptions = this.getPhysioTreatmentsDetailsOptions();
		this.physioCategoriesOptions = this.getPhysioCategoriesOptions();
		this.locationOptions = this.getLocationOptions();
		this.injuryTypeOptions = this.getTypeOptions(); // only for prevention
		this.treatmentTypesOptions = this.treatmentTypesOptions.map(item => ({
			...item,
			label: this.translate.instant(item.label)
		}));
		this.loadFiltersOptions();
	}

	private getInjuryOptions(): SelectItem[] {
		return TrtUtilsService.getInjuryList(sortByDateDesc(this.injuries || [], 'date'), this.translate);
	}

	private getTreatmentMetrics(): TreatmentMetric[] {
		let { treatmentMetrics } = this.team;
		if (!treatmentMetrics || treatmentMetrics.length === 0) {
			treatmentMetrics = this.customTreatmentService.defaultTreatments();
		}
		return treatmentMetrics.filter(({ active }) => active);
	}

	private getLocationOptions(): SelectItem[] {
		const locationOptions = this.preventionConstantService.getLocations().map(({ value, label }) => ({
			label: this.translate.instant(label),
			value: value
		}));
		return sortByName(locationOptions, 'label');
	}

	private getTypeOptions(): SelectItem[] {
		let typeOptions = this.preventionConstantService.getTypes().map(({ value, label }) => ({
			label: this.translate.instant(label),
			value: value
		}));

		typeOptions = sortByName(typeOptions, 'label');
		typeOptions.unshift({
			label: this.translate.instant('none'),
			value: 'none'
		});
		return typeOptions;
	}

	private getSecOptions(): SelectItem<TreatmentMetric>[] {
		const secOptions = this.secMetrics.map(({ value, label }) => ({
			label: this.translate.instant(label),
			value: value
		}));
		// @ts-ignore
		return TrtUtilsService.sortByPinned(sortByName(secOptions, 'label'), this.pinnedTreatments);
	}

	private getPhysioTreatmentsDetailsOptions(): TreatmentMetric[] {
		const detailsOptions = this.physiotherapyMetrics.map((treatment: TreatmentMetric) => ({
			...treatment,
			label: this.translate.instant(treatment.label)
		}));
		return TrtUtilsService.sortByPinned(detailsOptions, this.pinnedTreatments);
	}

	private getPhysioCategoriesOptions(): SelectItem[] {
		const physioOptions = MEDICAL_TREATMENTS['physiotherapy'].map(({ label, value }) => ({
			label: this.translate.instant(label),
			value: value
		}));
		return sortByName(physioOptions, 'label');
	}

	//endRegion

	//#region Table Logic

	instantCreationMode(): boolean {
		return this.mode === 'single' && !this.currentEventDate;
	}

	isInjuryClosed(): boolean {
		return this.injury && this.injury.currentStatus === 'medical.infirmary.details.statusList.healed';
	}

	openDialogNote(treatment: TreatmentType) {
		const ref = this.createEditorDialog(treatment.notes);
		ref.onClose.subscribe({
			next: (notes: string) => {
				if (notes) {
					treatment.notes = notes;
				}
			}
		});
	}

	private createEditorDialog(content: string): DynamicDialogRef {
		return this.dialogService.open(EditorDialogComponent, {
			data: {
				editable: false,
				content: content
			},
			width: '50%',
			header: this.translate.instant('prevention.treatments.note'),
			closable: true
		});
	}
	//endRegion

	//region Table Filters

	private loadFiltersOptions() {
		this.tableFilters = {
			period: { model: undefined },
			treatmentType: { options: this.treatmentTypesOptions, model: [] },
			treatmentCategory: { options: this.physioCategoriesOptions, model: [] },
			treatment: { options: [...this.secTreatmentsOptions, ...this.physioTreatmentsOptions], model: [] },
			author: { options: this.customerOptions, model: [] },
			prescriptor: { options: this.customerOptions, model: [] },
			injury: { options: this.injuryOptions, model: [] },
			injuryLocation: { options: sortByName(this.locationOptions, 'label'), model: [] },
			injuryType: { options: sortByName(this.injuryTypeOptions, 'label'), model: [] },
			completion: {
				options: [
					{ value: 'true', label: 'Completed' },
					{ value: 'false', label: 'Uncomplete' }
				],
				model: []
			}
		};
	}

	resetFilters() {
		this.loadFiltersOptions();
		this.applyGenericFilters();
	}

	applyGenericFilters() {
		if (this.allFiltersReset()) {
			this.filteredRows = cloneDeep(this.rows);
		} else {
			this.filteredRows = this.rows.filter((treatment: TreatmentType) => {
				const periodCondition =
					this.isUndefinedOrEmpty(this.tableFilters.period.model) ||
					moment(treatment.date).isBetween(
						moment(this.tableFilters.period.model[0]),
						moment(this.tableFilters.period.model[1]),
						'day',
						'[]'
					);
				const treatmentTypeCondition =
					!this.isFilterFilled(this.tableFilters.treatmentType.model) ||
					this.tableFilters.treatmentType.model.includes(treatment.treatmentType);
				const categoryCondition =
					!this.isFilterFilled(this.tableFilters.treatmentCategory.model) ||
					(treatment.treatmentType === 'physiotherapy' &&
						this.filterMultiValueField(this.tableFilters.treatmentCategory.model, treatment, 'category'));
				const treatmentCondition =
					!this.isFilterFilled(this.tableFilters.treatment.model) ||
					(treatment.treatmentType !== 'medicationSupplements' &&
						(treatment.treatmentType === 'SeC'
							? this.filterMultiValueField(this.tableFilters.treatment.model, treatment, 'treatment')
							: this.filterMultiValueField(this.tableFilters.treatment.model, treatment, 'description')));
				const authorCondition =
					!this.isFilterFilled(this.tableFilters.author.model) ||
					this.tableFilters.author.model.includes(treatment.author);
				const prescriptionCondition =
					!this.isFilterFilled(this.tableFilters.prescriptor.model) ||
					this.tableFilters.prescriptor.model.includes(treatment.prescriptor);
				const completionCondition =
					!this.isFilterFilled(this.tableFilters.completion.model) ||
					this.tableFilters.completion.model.includes(treatment.complete ? 'true' : 'false');
				const basicConditions: boolean =
					periodCondition &&
					treatmentTypeCondition &&
					categoryCondition &&
					treatmentCondition &&
					authorCondition &&
					prescriptionCondition &&
					completionCondition;
				if (this.section === 'injury') return basicConditions;
				return basicConditions && this.getInjuryConditions(treatment);
			});
		}
	}

	private isFilterFilled(model, minLength = 0): boolean {
		return isArray(model) ? model.length > minLength : !!model;
	}

	private isUndefinedOrEmpty(value: any[]): boolean {
		return !value || value.length === 0;
	}

	private filterMultiValueField(optionModel: string[], treatment: TreatmentType, key: string): boolean {
		if (!treatment[key]) return false;
		return optionModel.some(item => treatment[key]?.includes(item));
	}

	private getInjuryConditions(treatment: MedicalTreatment): boolean {
		const injuryCondition =
			!this.isFilterFilled(this.tableFilters.injury.model) ||
			this.tableFilters.injury.model.includes(treatment?.injuryId);
		const injuryLocationCondition =
			!this.isFilterFilled(this.tableFilters.injuryLocation.model) ||
			this.tableFilters.injuryLocation.model.includes(treatment.location);
		const injuryTypeCondition =
			!this.isFilterFilled(this.tableFilters.injuryType.model) ||
			this.tableFilters.injuryType.model.includes(treatment.injuryType);
		return injuryCondition && injuryLocationCondition && injuryTypeCondition;
	}

	private allFiltersReset(): boolean {
		return Object.keys(this.tableFilters).every(
			key => !this.tableFilters[key]?.model || this.tableFilters[key]?.model?.length === 0
		);
	}

	//endregion

	//#region PDF report

	downloadReportPdf() {
		const t = this.translate.instant.bind(this.translate);
		const treatments = this.filteredRows;
		const secItems = treatments.filter(({ treatmentType }) => treatmentType === 'SeC');
		const medItems = treatments.filter(({ treatmentType }) => treatmentType === 'medicationSupplements');
		const phyItems = treatments.filter(({ treatmentType }) => treatmentType === 'physiotherapy');
		const data = {
			player: `${this.player.name} ${this.player.displayName}`,
			image: this.player.downloadUrl,
			sections: [
				{
					title: t('prevention.treatments.sec'),
					headers: TrtUtilsService.getSecHeadersForPDF(t),
					values: TrtUtilsService.getSecValuesForPDF(
						t,
						this.treatmentsTooltipPipe,
						this.customerNamePipe,
						this.selectItemLabelPipe,
						this.treatmentCompletePipe,
						secItems,
						this.locationOptions,
						this.secMetrics,
						this.customers
					)
				},
				{
					title: t('prevention.treatments.medicationSupplements'),
					headers: TrtUtilsService.getMedSuppHeadersForPDF(t),
					values: TrtUtilsService.getMedSuppValuesForPDF(
						t,
						this.medicationLabelPipe,
						this.customerNamePipe,
						this.selectItemLabelPipe,
						this.treatmentCompletePipe,
						this.team,
						medItems,
						this.locationOptions,
						this.customers
					)
				},
				{
					title: t('prevention.treatments.physiotherapy'),
					headers: TrtUtilsService.getPhyHeadersForPDF(t),
					values: TrtUtilsService.getPhyValuesForPDF(
						t,
						this.treatmentsTooltipPipe,
						this.treatmentCategoriesTooltipPipe,
						this.customerNamePipe,
						this.selectItemLabelPipe,
						this.treatmentCompletePipe,
						phyItems,
						this.physiotherapyMetrics,
						this.locationOptions,
						this.injuryTypeOptions,
						this.customers
					)
				}
			]
		};

		this.report
			.getImage(data.image)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (image) => {
					this.report.getReport('maintenance_treatment', { ...data, image }, 'positions.HoM');
				}
			});
	}

	//endregion

	//#region CSV report
	downloadReportCSV() {
		/** Get author and prescriptor before downloading CSV */
		const rows: TreatmentType[] = this.rows.map(row => ({
			...row,
			prescriptor: this.customerNamesSelectItemPipe.transform(row.prescriptor, this.customerOptions),
			author: this.customerNamesSelectItemPipe.transform(row.author, this.customerOptions)
		}));

		/** Create and download CSV */
		const name = this.player.displayName;
		const prefix = this.section === 'injury' ? 'Injury Treatment' : 'Medical Records';
		const fileName = `${prefix} - ${name} - ${moment().startOf('day').format(getMomentFormatFromStorage())}.csv`;
		const data = getReportCSV(
			this.section === 'injury',
			this.translate,
			this.secTreatmentsOptions,
			this.physioCategoriesOptions,
			this.locationOptions,
			this.injuryTypeOptions,
			this.team,
			this.injury,
			rows
		);
		const results = Papa.unparse(data, {});
		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	//endregion

	//#region Delete Row Dialog
	openDeleteRowDialog(rowData: TreatmentType, localRowIndex?: number) {
		if (!this.currentEventDate && rowData?.eventId) {
			// show the dialog only if it's the last treatment in event
			this.eventApi
				.countMedicalTreatments(rowData.eventId)
				.pipe(first(), untilDestroyed(this))
				.subscribe(
					{
						next: ({count}: {count: number}) => {
							if (count === 1) {
								this.deleteRowDialog = {
									visible: true,
									row: rowData
								};
							} else {
								this.deleteRow.emit({ alsoEvent: false, instance: rowData });
							}
						},
						error: (error: Error) => this.error.handleError(error)
					}
				);
		} else {
			this.filteredRows.splice(localRowIndex, 1);
			if (!this.currentEventDate) {
				this.deleteRow.emit({ alsoEvent: false, instance: rowData, localRowIndex });
			}
		}
	}

	discardDeleteRowDialog() {
		this.deleteRowDialog = {
			visible: false,
			row: null
		};
	}

	//endregion

	//#region Action Button visibility
	isEditMode(): boolean {
		return !this.readonlyMode;
	}
	showRedirectToEventButton(rowData: TreatmentType): boolean {
		return !this.currentEventDate && rowData?.eventId && this.isEditMode();
	}

	showCheckButton(): boolean {
		return !this.currentEventDate && this.section === 'prevention' && this.isEditMode();
	}

	showCloneButton(): boolean {
		return this.isEditMode();
	}
	showDeleteButton(): boolean {
		return this.isEditMode();
	}
	getRowBackgroundColor(rowData: TreatmentType): string {
		return rowData?.injuryId ? 'rgba(215, 44, 44, 0.4)' : '';
	}

	//endregion

	//#region Apply To Menu
	onCloseApplyToMenu(rowData: TreatmentType) {
		if (this.playersApplyTo?.length === 0) return;
		this.confirmationService.confirm({
			message: this.translate.instant('treatments.applyTo', {
				value: this.playersApplyTo.map(value => this.players.find(item => item === value).displayName).join(', ')
			}),
			header: 'IterPRO',
			accept: () => this.applyToPlayers.emit({ instance: rowData, playerIds: this.playersApplyTo.map(({ id }) => id) }),
			reject: () => (this.playersApplyTo = [])
		});
	}

	//endregion

	//#region Show/hide filters
	toggleFilters() {
		this.showFilters = !this.showFilters;
	}

	//endregion

	//#region Redirect To Planning
	async goToPlanning(rowData: TreatmentType) {
		const { eventId, date } = rowData;
		await this.router.navigate(['/manager/planning', { id: eventId, date }]);
	}

	//endregion
}

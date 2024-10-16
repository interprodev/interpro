import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { AuthSelectors, AuthState, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Attachment,
	ClubApi,
	ClubSeason, Customer,
	PersonCostItem,
	PersonCostItemApi,
	Team
} from '@iterpro/shared/data-access/sdk';
import {
	CsvUploadDownloadComponent,
	EditorDialogComponent, IconButtonComponent,
	ReportDownloadComponent, SkeletonTableComponent
} from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	BlockUiInterceptorService,
	ErrorService,
	ReportService,
	getMomentFormatFromStorage,
	getPDFv2Path,
	sortByDateDesc,
	getAllSelectItemGroupValues, getActiveTeams
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { cloneDeep, orderBy } from 'lodash';
import * as moment from 'moment';
import { ConfirmationService, SelectItem, SelectItemGroup } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog/dynamicdialog-ref';
import { Observable, forkJoin, combineLatest, switchMap } from 'rxjs';
import { distinctUntilChanged, filter, first } from 'rxjs/operators';
import {
	CostItemFilters,
	CostItemPDFReport,
	CostItemSearchPerson,
	DataToReportInput,
	ExtendedPersonCostItem,
	PersonCostItemType
} from '../interfaces/cost-item.interface';
import { calcTotalAmount, getPaymentStatusIcon } from '../utils/data';
import {
	getCostItemCSV,
	getCostItemMixedTable,
	getCostItemSummary,
	getHeaders,
	getValueFromHeaderCsv
} from '../utils/report';
import { FormsModule } from '@angular/forms';
import { ArrayFromNumberPipe, SelectItemLabelPipe } from '@iterpro/shared/ui/pipes';
import { MultipleFileUploadComponent } from '@iterpro/shared/feature-components';
import { CostItemPersonTeamPipe } from '../pipes/cost-items-person-team.pipe';
import * as Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IterproUserPermission, PermissionsService } from '@iterpro/shared/data-access/permissions';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [
		CommonModule,
		TranslateModule,
		PrimeNgModule,
		ReportDownloadComponent,
		FormsModule,
		ArrayFromNumberPipe,
		MultipleFileUploadComponent,
		SelectItemLabelPipe,
		CostItemPersonTeamPipe,
		CsvUploadDownloadComponent,
		IconButtonComponent,
		SkeletonTableComponent
	],
	selector: 'iterpro-cost-items-table',
	templateUrl: './cost-items-table.component.html',
	styleUrls: ['./cost-items-table.component.scss']
})
export class CostItemsTableComponent {
	@Input({required: true}) mode: 'subscriptionCost' | 'costNote' | 'both' = 'both';
	@Input() personId: string;
	@Input() personType: PersonCostItemType;
	@Input() personName: string;
	@Input() personTeamId: string;
	items: ExtendedPersonCostItem[];
	backupItems: ExtendedPersonCostItem[];
	isLoading = true;
	typeOptions: SelectItem[];
	typeOptionsPlural: SelectItem[];
	personOptions: SelectItemGroup[] = [];
	clubSeasonOptions: SelectItem[] = [];
	showFilters: boolean;
	filters: CostItemFilters = {
		seasonIds: undefined,
		teamIds: undefined,
		types: undefined,
		occurrencePeriod: undefined,
		personIds: undefined,
		archivedPersons: false
	};
	currency: string;
	filterPersonLabel: { single: string; plural: string };
	teamsOptions: SelectItem[] = [];
	@ViewChild('inputjson', { static: false })
	fileInput: ElementRef;
	isBulkUploading: boolean;
	// Services
	readonly clubApi = inject(ClubApi);
	readonly #authStore = inject(Store<AuthState>);
	readonly #errorService = inject(ErrorService);
	readonly #translateService = inject(TranslateService);
	readonly #reportService = inject(ReportService);
	readonly #dialogService = inject(DialogService);
	readonly #costItemApi = inject(PersonCostItemApi);
	readonly #notificationService = inject(AlertService);
	readonly #confirmationService = inject(ConfirmationService);
	readonly #currentTeamService = inject(CurrentTeamService);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	readonly #permissionService = inject(PermissionsService);
	readonly #currentTeam$ = this.#authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());
	readonly #customer$ = this.#authStore.select(AuthSelectors.selectCustomer).pipe(takeUntilDestroyed());
	constructor() {
		if (!this.personType && this.personId) {
			console.error('CostItemsTableComponent: personType is required');
		}
		combineLatest(this.#customer$, this.#currentTeam$)
			.pipe(
				distinctUntilChanged(),
				filter(([customer, currentTeam]: [Customer, Team]) => !!customer && !!currentTeam),
				switchMap(([customer, currentTeam]: [Customer, Team]) => {
					const availableTeamIds = this.#permissionService.getUserAvailableTeamIdsByPermissions('cost-items', customer.admin, customer.teamSettings);
					this.filterPersonLabel = this.getFilterPersonLabel(this.personType);
					this.currency = this.#currentTeamService.getCurrency();
					return this.loadAll(currentTeam.clubId, availableTeamIds, this.personId);
				})
			)
			.subscribe({
				next: result => {
					this.setSeasonAndPersonOptions(result);
					this.setTypesOptions();
					this.isLoading = false;
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	private loadAll(clubId: string, availableTeamIds: string[], personId: string): Observable<[ClubSeason[], Team[], CostItemSearchPerson[], CostItemSearchPerson[], CostItemSearchPerson[]]> {
		const obs$ = [
			this.#blockUiInterceptorService.disableOnce(this.clubApi.getClubSeasons(clubId)),
			this.#blockUiInterceptorService.disableOnce(this.clubApi.getTeams(clubId, {
				where: { id: { inq: availableTeamIds } },
				fields: ['id', 'name']
			}))
		];
		if (!personId) {
			const personObs$ = ['Player', 'Staff', 'Agent'].map((type: PersonCostItemType) =>
				this.#blockUiInterceptorService.disableOnce(this.getClubPersons(type, clubId))
			);
			obs$.push(...personObs$);
		}
		return forkJoin(obs$).pipe(untilDestroyed(this)) as Observable<[ClubSeason[], Team[], CostItemSearchPerson[], CostItemSearchPerson[], CostItemSearchPerson[]]>;
	}

	private setSeasonAndPersonOptions(results: [ClubSeason[], Team[], CostItemSearchPerson[], CostItemSearchPerson[], CostItemSearchPerson[]]) {
		const [clubSeasons, teams, players, staff, agents] = results;
		this.clubSeasonOptions = sortByDateDesc(clubSeasons, 'start').map((season: ClubSeason) => ({
			label: season.name,
			value: season.id
		}));
		this.teamsOptions = teams.map((team: Team) => ({
			label: team.name,
			value: team.id
		}));
		if (players || staff || agents) {
			this.personOptions = [
				{
					label: this.#translateService.instant('admin.squads.element.players'),
					value: 'players',
					items: orderBy(players, 'displayName').map(({ displayName, id, archived, teamId }) => ({
						label: displayName,
						value: id,
						archived,
						teamId
					}))
				},
				{
					label: this.#translateService.instant('admin.squads.element.staff'),
					value: 'staffs',
					items: orderBy(staff, 'displayName').map(({ displayName, id, archived, teamId }) => ({
						label: displayName,
						value: id,
						archived,
						teamId
					}))
				},
				{
					label: this.#translateService.instant('admin.squads.element.agents'),
					value: 'agents',
					items: orderBy(agents, 'displayName').map(({ displayName, id, archived, teamId }) => ({
						label: displayName,
						value: id,
						archived,
						teamId
					}))
				}
			];
		}
		this.loadItems();
	}

	private setTypesOptions() {
		if (this.mode === 'both') {
			this.typeOptions = [
				{ label: this.#translateService.instant('costItem.cost'), value: 'costNote' },
				{ label: this.#translateService.instant('costItem.subscription'), value: 'subscriptionCost' }
			];
			this.typeOptionsPlural = [
				{ label: this.#translateService.instant('costItem.costs'), value: 'costNote' },
				{ label: this.#translateService.instant('costItem.subscriptions'), value: 'subscriptionCost' }
			];
		} else if (this.mode === 'costNote') {
			this.typeOptions = [{ label: this.#translateService.instant('costItem.cost'), value: 'costNote' }];
		} else {
			this.typeOptions = [{ label: this.#translateService.instant('costItem.subscription'), value: 'subscriptionCost' }];
		}
	}

	private loadItems() {
		this.isLoading = true;
		this.#blockUiInterceptorService
			.disableOnce(
				this.#costItemApi.find({
					where: this.getFilterForMode()
				})
			)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (result: PersonCostItem[]) => {
					this.backupItems = result.map((item: PersonCostItem) => ({
						...item,
						occurrenceDate: item?.occurrenceDate ? new Date(item.occurrenceDate) : null,
						paymentDate: item?.paymentDate ? new Date(item.paymentDate) : null,
						expiryDate: item?.expiryDate ? new Date(item.expiryDate) : null
					}));
					this.items = this.backupItems.filter(
						item => !!this.personId || this.filterCostItemByArchivedPerson(item, false)
					);
					this.isLoading = false;
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	private getFilterForMode() {
		const baseFilter = this.personId
			? { personId: this.personId, personType: this.personType }
			: {
					// @ts-ignore
					personId: { inq: this.getAllPersonOptionsIds() },
					personType: this.personType
			  };
		if (this.mode === 'both') {
			return baseFilter;
		}
		return { ...baseFilter, type: this.mode };
	}

	private getAllPersonOptionsIds(): string[] {
		return getAllSelectItemGroupValues(this.personOptions).map(({ value }) => value);
	}

	personChanged(rowData: ExtendedPersonCostItem) {
		rowData.personType = this.getPersonTypeFromRowData(rowData);
	}

	private getPersonTypeFromRowData(rowData: ExtendedPersonCostItem): PersonCostItemType {
		const item: SelectItemGroup = this.personOptions.find(({ items }) =>
			items.find(({ value }) => value === rowData.personId)
		);
		return this.getPersonTypeFromGroup(item.value);
	}

	//region Crud

	edit(rowData: ExtendedPersonCostItem, index: number) {
		this.items[index].backup = cloneDeep(rowData);
		this.items[index].editMode = true;
	}

	discard(rowData: ExtendedPersonCostItem, index: number) {
		if (!this.items[index].id) {
			this.items.splice(index, 1);
			return;
		}
		this.items[index] = cloneDeep(this.items[index].backup);
		this.items[index].editMode = false;
	}

	clone(rowData: ExtendedPersonCostItem) {
		const item = cloneDeep(rowData);
		delete item.id;
		item.editMode = false;
		this.items.push({ ...item, editMode: true, backup: cloneDeep(item) });
	}

	add() {
		const item = new PersonCostItem({
			type: this.mode === 'both' ? 'costNote' : this.mode,
			creationDate: new Date(),
			clubSeasonId: this.clubSeasonOptions[0].value,
			personId: this.personId,
			occurrenceDate: null,
			personType: this.personType,
			value: 0,
			paymentDate: null,
			_attachments: []
		});
		this.items.unshift({ ...item, editMode: true, backup: cloneDeep(item) });
	}

	private toServer(item: ExtendedPersonCostItem): PersonCostItem {
		delete item.backup;
		delete item.editMode;
		delete item.fileRepositoryVisibility;
		return item;
	}

	private hasErrorOrMissingFields(rowData: PersonCostItem): boolean {
		if (!rowData.personId) {
			this.#notificationService.notify('error', 'financial', 'alert.playerMissing', false);
			return true;
		}
		if (!rowData.occurrenceDate) {
			this.#notificationService.notify('error', 'financial', 'alert.occurrenceDateMissing', false);
			return true;
		}
		if (!rowData.paymentDate) {
			this.#notificationService.notify('error', 'financial', 'alert.paymentDateMissing', false);
			return true;
		}
		if (!rowData.clubSeasonId) {
			this.#notificationService.notify('error', 'financial', 'alert.seasonMissing', false);
			return true;
		}
		if (!rowData.type) {
			this.#notificationService.notify('error', 'financial', 'alert.typeMissing', false);
			return true;
		}
		if (!rowData.value) {
			this.#notificationService.notify('error', 'financial', 'alert.costMissing', false);
			return true;
		}
		return false;
	}

	save(rowData: PersonCostItem) {
		if (this.hasErrorOrMissingFields(rowData)) {
			return;
		}
		const obs$ = rowData.id
			? this.#costItemApi.updateAttributes(rowData.id, this.toServer(rowData))
			: this.#costItemApi.create(this.toServer(rowData));
		const alertKey = rowData.id ? 'alert.recordUpdated' : 'alert.recordCreated';
		obs$.pipe(first(), untilDestroyed(this)).subscribe({
			next: (result: PersonCostItem) => {
				rowData = result;
				(rowData as ExtendedPersonCostItem).backup = cloneDeep(rowData);
				this.backupItems = cloneDeep(this.items);
				this.#notificationService.notify('success', 'financial', alertKey, false);
			},
			error: (error: Error) => this.#errorService.handleError(error)
		});
	}

	delete(rowData: PersonCostItem, index: number) {
		if (!rowData.id) {
			this.items.splice(index, 1);
			return;
		}
		this.confirmDelete(rowData);
	}

	private confirmDelete(rowData: PersonCostItem) {
		this.#confirmationService.confirm({
			message: this.#translateService.instant('confirm.delete'),
			header: this.#translateService.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				this.#costItemApi
					.deleteById(rowData.id)
					.pipe(first(), untilDestroyed(this))
					.subscribe({
						next: () => {
							this.items = this.items.filter(({ id }) => id !== rowData.id);
							this.#notificationService.notify('success', 'financial', 'alert.recordDeleted', false);
						},
						error: (error: Error) => this.#errorService.handleError(error)
					});
			},
			reject: () => {}
		});
	}

	//endregion

	//region Attachments
	saveFileDialog(rowData: ExtendedPersonCostItem, attachments: Attachment[]) {
		rowData.fileRepositoryVisibility = false;
		rowData._attachments = attachments;
	}
	//endregion

	//region Notes Dialog
	openDialogNote(rowData: ExtendedPersonCostItem) {
		const ref = this.createEditorDialog(rowData.notes, rowData.editMode);
		ref.onClose.subscribe((notes: string) => {
			if (notes) {
				rowData.notes = notes;
			}
		});
	}

	private createEditorDialog(content: string, editMode: boolean): DynamicDialogRef {
		return this.#dialogService.open(EditorDialogComponent, {
			data: { editable: editMode, content: content },
			width: '50%',
			header: this.#translateService.instant('prevention.treatments.note'),
			closable: true
		});
	}
	//endregion

	getPaymentStatus(rowData: PersonCostItem): { icon: string; color: string } {
		return getPaymentStatusIcon(rowData);
	}

	calcTotalAmount(status: 'pending' | 'paid' | 'outstanding', type: 'subscription' | 'costNote'): number {
		return calcTotalAmount(this.items, status, type);
	}

	//region Filters
	filtersChanged() {
		if (this.areAllFiltersEmpty()) {
			this.items = cloneDeep(this.backupItems);
		} else {
			this.items = this.backupItems.filter((item: ExtendedPersonCostItem) => {
				return (
					(this.isUndefinedOrEmpty(this.filters.seasonIds) || this.filters.seasonIds.includes(item.clubSeasonId)) &&
					(this.isUndefinedOrEmpty(this.filters.teamIds) ||
						this.filters.teamIds.includes(this.getTeamIdFromPersonId(item.personId))) &&
					(this.isUndefinedOrEmpty(this.filters.types) || this.filters.types.includes(item.type)) &&
					(this.isUndefinedOrEmpty(this.filters.occurrencePeriod) ||
						moment(item.occurrenceDate).isBetween(
							moment(this.filters.occurrencePeriod[0]),
							moment(this.filters.occurrencePeriod[1])
						)) &&
					(this.isUndefinedOrEmpty(this.filters.personIds) || this.filters.personIds.includes(item.personId)) &&
					this.filterCostItemByArchivedPerson(item, this.filters.archivedPersons)
				);
			});
		}
	}

	private getTeamIdFromPersonId(personId: string): string {
		const person = getAllSelectItemGroupValues(this.personOptions).find(({ value }) => value === personId);
		return person?.teamId;
	}

	private filterCostItemByArchivedPerson(item: ExtendedPersonCostItem, filterByArchived: boolean): boolean {
		const allItems = getAllSelectItemGroupValues(this.personOptions);
		return (
			// @ts-ignore
			allItems.map(({ value, archived }) => value === item.personId && archived === filterByArchived) !== undefined
		);
	}

	private isUndefinedOrEmpty(value: any[]): boolean {
		return !value || value.length === 0;
	}

	private areAllFiltersEmpty(): boolean {
		return (
			(!this.filters.seasonIds || this.filters.seasonIds?.length === 0) &&
			(!this.filters.types || this.filters.types?.length === 0) &&
			(!this.filters.occurrencePeriod || this.filters.occurrencePeriod?.length === 0) &&
			(!this.filters.personIds || this.filters.personIds?.length === 0) &&
			this.filters.archivedPersons === undefined
		);
	}

	resetFilters() {
		this.filters = {
			seasonIds: undefined,
			teamIds: undefined,
			personIds: undefined,
			types: undefined,
			occurrencePeriod: undefined,
			archivedPersons: undefined
		};
		this.items = cloneDeep(this.backupItems);
	}
	//endregion

	//region PDF Report
	async downloadPDFReport() {
		const title = this.#translateService.instant('navigator.transactions').toUpperCase();
		const subTitle = this.personId ? this.personName : 'GLOBAL';
		const report: CostItemPDFReport = {
			header: {
				title,
				subTitle
			},
			metadata: {
				createdLabel: `${this.#translateService.instant('general.createdOn')} ${moment(new Date()).format(
					`${getMomentFormatFromStorage()} hh:mm`
				)}`
			},
			summary: getCostItemSummary(this.getDataToReportInput()),
			table: getCostItemMixedTable(this.getDataToReportInput())
		};
		this.#reportService.getReport(getPDFv2Path('admin', 'admin_cost_notes', false), report, '', null, `${title}`);
	}
	//endregion

	//region CSV Report Download
	async downloadCSVReport() {
		const csvData = getCostItemCSV(this.getDataToReportInput());
		const title = this.#translateService.instant('navigator.transactions').toUpperCase();
		this.#reportService.getReportCSV(title, csvData, { encoding: 'utf-8' });
	}
	//endregion

	//region CSV Upload
	downloadEmptyCsv() {
		const headerObj = {};
		const headers: string[] = getHeaders(this.filterPersonLabel.single, this.personId).map((header: string) => this.#translateService.instant(header));
		// leaving first column of header empty for numbering etc.
		headerObj['No.'] = '';

		// Adding all other properties to header.
		headers.forEach(prop => {
			headerObj[prop] = '';
		});

		const results = Papa.unparse([headerObj]);
		let base = this.#translateService.instant('navigator.transactions').toUpperCase();
		if (!this.personId) {
			base+= '_GLOBAL';
		}
		const fileName = base + '_empty.csv';

		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	private checkIfHeadersAreValid(fileHeaders: string[]): boolean {
		const requiredHeaders = getHeaders(this.filterPersonLabel.single, this.personId).map(header => this.#translateService.instant(header));
		return requiredHeaders.every(header => fileHeaders.includes(header));
	}

	fileChanged(e) {
		let csvData: any[] = [];
		let csvHeaders: string[] = [];
		const fileReader: FileReader = new FileReader();

		// Reading from uploaded file.
		fileReader.onload = loadEvent => {
			const csvRead = fileReader.result;
			const resultsCsv: Papa.ParseResult<any> = Papa.parse(csvRead.toString(), {
				header: true,
				skipEmptyLines: true
			});
			csvData = resultsCsv.data;
			csvHeaders = resultsCsv.meta.fields;
			this.fileInput.nativeElement.value = '';
		};

		fileReader.onloadend = () => {
			// check if headers are valid
			if (!this.checkIfHeadersAreValid(csvHeaders)) {
				this.#notificationService.notify('error', 'error', 'import.feedbacks.errorCSV.header');
				return;
			}
			this.bulkPrepareCostItems(csvData);
		}

		// Error handling for file reader
		fileReader.onerror = ev => {
			this.#notificationService.notify('error', 'error', 'import.feedbacks.errorCSV');
		};
		// Reading first file uploaded.
		fileReader.readAsText(e.target.files[0]);
	}

	private bulkPrepareCostItems(csvRows: any[]): void {
		this.isBulkUploading = true;
		const headers: string[] = getHeaders(this.filterPersonLabel.single, this.personId);
		const input = this.getDataToReportInput();
		this.items = (csvRows || []).map((value: string, index) => {
			const toRemove = this.personId ? 1 : 0;
			const item = <ExtendedPersonCostItem>
				{
					clubSeasonId: getValueFromHeaderCsv(headers[0], value[input.t(headers[0])], input),
					personId: this.personId || getValueFromHeaderCsv(headers[1], value[input.t(headers[1])], input),
					occurrenceDate: getValueFromHeaderCsv(headers[2-toRemove], value[input.t(headers[2-toRemove])], input) as Date,
					type: getValueFromHeaderCsv(headers[3-toRemove], value[input.t(headers[3-toRemove])], input) as string,
					description: getValueFromHeaderCsv(headers[4-toRemove], value[input.t(headers[4-toRemove])], input) as string,
					value: getValueFromHeaderCsv(headers[5-toRemove], value[input.t(headers[5-toRemove])], input) as number,
					paymentDate: getValueFromHeaderCsv(headers[6-toRemove], value[input.t(headers[6-toRemove])], input) as Date,
					paid: getValueFromHeaderCsv(headers[7-toRemove], value[input.t(headers[7-toRemove])], input) as boolean,
					expiryDate: getValueFromHeaderCsv(headers[8-toRemove], value[input.t(headers[8-toRemove])], input) as Date,
					notes: getValueFromHeaderCsv(headers[9-toRemove], value[input.t(headers[9-toRemove])], input) as string,
					creationDate: new Date(),
					_attachments: [],
					editMode: true
				}
				item.personType = this.personType || this.getPersonTypeFromRowData(item);
				return item;
		});
	}

	onBulkSave() {
		const hasError = this.items.some((item: PersonCostItem) => this.hasErrorOrMissingFields(item));
		if (hasError) return;
		const toServerItems = this.items.map((item: ExtendedPersonCostItem) => this.toServer(item));
		this.#costItemApi
			.createMany(toServerItems)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (result: PersonCostItem[]) => {
					this.#notificationService.notify('success', 'financial', 'alert.allRecordsSaved', false);
					this.loadItems();
					this.isBulkUploading = false;
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	onBulkCancel() {
		this.items = this.backupItems;
		this.isBulkUploading = false;
	}
	//endregion

	private getDataToReportInput(): DataToReportInput {
		return {
			t: this.#translateService.instant.bind(this.#translateService),
			items: this.items,
			clubSeasonOptions: this.clubSeasonOptions,
			typeOptions: this.typeOptions,
			currency: this.currency,
			personOptions: this.personOptions,
			personId: this.personId,
			singlePersonLabel: this.filterPersonLabel.single
		};
	}

	private getClubPersons(type: PersonCostItemType, clubId: string): Observable<CostItemSearchPerson[]> {
		const filter = {
			fields: ['displayName', 'id', 'teamId', 'downloadUrl', 'archived']
		};
		switch (type) {
			case 'Player': {
				return this.clubApi.getPlayers(clubId, filter);
			}
			case 'Staff': {
				return this.clubApi.getStaff(clubId, filter);
			}
			case 'Agent': {
				return this.clubApi.getAgents(clubId, filter);
			}
			default: {
				console.warn('CostItemsTableComponent.getClubPersons: type not supported');
			}
		}
	}

	private getFilterPersonLabel(personType: PersonCostItemType): { single: string; plural: string } {
		switch (personType) {
			case 'Player':
				return { single: 'general.player', plural: 'admin.squads.element.players' };
			case 'Staff':
				return { single: 'admin.squads.element.staff', plural: 'admin.squads.element.staff' };
			case 'Agent':
				return { single: 'admin.squads.player.agent', plural: 'admin.squads.element.agents' };
			default:
				return { single: 'costItem.personnel', plural: 'costItem.personnel' };
		}
	}

	private getPersonTypeFromGroup(group: string): PersonCostItemType {
		switch (group) {
			case 'players':
				return 'Player';
			case 'staffs':
				return 'Staff';
			case 'agents':
				return 'Agent';
			default:
				console.warn('CostItemsTableComponent.getPersonTypeFromGroup: group not supported');
		}
	}
}

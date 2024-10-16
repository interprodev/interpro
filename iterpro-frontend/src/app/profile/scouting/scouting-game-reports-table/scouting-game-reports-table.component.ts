import {
	Component,
	EventEmitter,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	SimpleChange,
	SimpleChanges
} from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Customer,
	GameReportRow,
	PlayerScouting,
	ReportDataColumn,
	ScoutingGameInit,
	TeamApi,
	TeamTableFilterTemplate
} from '@iterpro/shared/data-access/sdk';
import { ColumnVisibilityOption } from '@iterpro/shared/ui/components';
import { CustomerNamePipe } from '@iterpro/shared/ui/pipes';
import {
	AlertService,
	CompetitionsConstantsService,
	ErrorService,
	ReportService,
	ScoutingEventService,
	getMomentFormatFromStorage,
	getUniqueReportDataColumns
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { isEqual, omit, uniq, uniqWith } from 'lodash';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { ConfirmationService, FilterMetadata, LazyLoadEvent, MenuItem, SelectItem } from 'primeng/api';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { FilterEmitter, FilterOptions, FilterState } from 'src/app/shared/table-filter/models/table-filter.model';
import { getFiltersForTemplate, getUpdatedFilterOptions } from 'src/app/shared/table-filter/utils/table-filter.util';
import { Column, CompletionStatus, GameReportWithAdditionalData, TableFilters } from './interfaces/table.interfaces';
import { PAGINATION_SIZE, getDefaultLazyLoadOptions, getTableRow } from './utils/common';
import { getTableRowsData } from './utils/report';
import {
	getBasicColumnOptions,
	getColumns,
	getReportColumnOptions,
	initialVisibleBasicColumns
} from './utils/table-fields';
import {
	filterBirthYear,
	filterCompetition,
	filterLastAuthor,
	filterLastUpdate,
	filterLevel,
	filterNationality,
	filterPlayer,
	filterPosition,
	filterScout,
	filterTeam
} from './utils/table-filters-fn';
import { ScoutingViewType } from '../scouting-calendar/scouting-calendar.component';

const basicCompetitions: SelectItem[] = [{ label: 'Custom Competition', value: -1 }];
@UntilDestroy()
@Component({
	selector: 'iterpro-scouting-game-reports-table',
	templateUrl: './scouting-game-reports-table.component.html',
	styleUrls: ['./scouting-game-reports-table.component.scss']
})
export class ScoutingGameReportsTableComponent implements OnInit, OnChanges, OnDestroy {
	@Input({ required: true }) players: PlayerScouting[] = [];
	@Input({ required: true }) customers: Customer[] = [];
	@Input({ required: true }) scoutingViewType: ScoutingViewType;
	@Output() rowClick: EventEmitter<GameReportRow> = new EventEmitter<GameReportRow>();
	@Output() closeTable: EventEmitter<void> = new EventEmitter<void>();
	selectedDates: Date[];
	private queryOptions: LazyLoadEvent;
	private currentTeamCache: Map<string, string> = new Map<string, string>();
	wyscoutCompetitions: SelectItem[];
	currentTeamId: string;

	initialTableFilters: TableFilters;
	filterOptions: FilterOptions<GameReportRow> = {
		scout: {
			label: 'positions.scout',
			type: 'multi',
			filterFn: filterScout,
			interpolateScoutFn: this.getScoutNameForFilter.bind(this)
		},
		// @ts-ignore
		player: { label: 'profile.player', type: 'player', filterFn: filterPlayer },
		teams: { label: 'profile.team', type: 'multi', filterFn: filterTeam },
		level: { label: 'scouting.game.level', type: 'multi', filterFn: filterLevel, translateLabelPrefix: '' },
		nationality: {
			label: 'profile.overview.nationality',
			type: 'multi',
			filterFn: filterNationality,
			translateLabelPrefix: 'nationalities'
		},
		position: { label: 'profile.position', type: 'multi', filterFn: filterPosition, translateLabelPrefix: '' },
		competition: {
			label: 'event.subformat',
			type: 'multi',
			filterFn: filterCompetition,
			interpolateCompetitionFn: this.getCompetitionNameForFilter.bind(this)
		},
		birthYear: { label: 'profile.overview.birthYear', type: 'multi', filterFn: filterBirthYear },
		lastUpdate: { label: 'lastUpdate', type: 'datetime', filterFn: filterLastUpdate },
		lastUpdateAuthor: {
			label: 'lastAuthor',
			type: 'multi',
			filterFn: filterLastAuthor,
			interpolateScoutFn: this.customerPipe.transform.bind(this),
			translateLabelPrefix: ''
		}
	};
	filters: { [s: string]: FilterMetadata } = {};
	reportDataColumns: ReportDataColumn[] = [];
	games: GameReportWithAdditionalData[] = [];
	totalRecords = 0;
	tableValues: GameReportRow[] = [];
	selectedTableValues: GameReportRow[] = [];
	filteredTableValues: GameReportRow[] = [];
	visibleColumns: string[] = initialVisibleBasicColumns;
	columnOptions: ColumnVisibilityOption[];
	columns: Column[] = [];
	forceResetTableFilters = true;
	completionStatuses = CompletionStatus;
	pageSize = PAGINATION_SIZE;
	isCsvDownloading = false;
	showFilterTemplateSelection = false;
	filtersForTemplate: { [s: string]: unknown };
	filtersTabTypes: MenuItem[] = [
		{
			id: 'filters',
			label: 'Filters',
			command: () => (this.activeFilterTabType = this.filtersTabTypes[0])
		},
		{
			id: 'tableColumns',
			label: 'Table columns',
			command: () => (this.activeFilterTabType = this.filtersTabTypes[1])
		}
	];
	activeFilterTabType: MenuItem = this.filtersTabTypes[0];
	showFilters = false;
	constructor(
		private teamApi: TeamApi,
		private alert: AlertService,
		private error: ErrorService,
		private translate: TranslateService,
		private reportService: ReportService,
		private service: ScoutingEventService,
		private customerPipe: CustomerNamePipe,
		private currentTeamService: CurrentTeamService,
		private confirmationService: ConfirmationService,
		private competitionsService: CompetitionsConstantsService
	) {}
	ngOnInit() {
		this.initVariables();
	}

	ngOnChanges(changes: SimpleChanges) {
		const scoutingGameWasClosed =
			changes['scoutingViewType'].currentValue !== changes['scoutingViewType'].previousValue &&
			changes['scoutingViewType'].currentValue === ScoutingViewType.GameReports;
		if (scoutingGameWasClosed) {
			this.onPeriodChange(this.selectedDates);
		}
	}

	ngOnDestroy() {
		this.currentTeamCache.clear();
	}

	//#regiom Initialization Variables
	private initVariables() {
		this.currentTeamId = this.currentTeamService.getCurrentTeam().id;
		this.setDefaultLazyLoadOptions();
		this.setDefaultDateRange();
		this.resetInitialFiltersValues();
		this.initCompetitions();
	}
	private initCompetitions() {
		this.wyscoutCompetitions = [
			...basicCompetitions,
			...this.competitionsService.withProvider('Wyscout').getCompetitions()
		];
	}

	private setDefaultDateRange() {
		if (!this.selectedDates || this.selectedDates.filter(date => !date).length !== 2) {
			this.selectedDates = [moment().startOf('month').toDate(), moment().endOf('month').toDate()];
		}
	}

	private setDefaultLazyLoadOptions() {
		this.queryOptions = getDefaultLazyLoadOptions();
	}

	private resetInitialFiltersValues() {
		const filters: TableFilters = {
			birthYear: [],
			competition: [],
			lastUpdate: [],
			lastUpdateAuthor: [],
			level: [],
			nationality: [],
			player: [],
			position: [],
			scout: [],
			teams: []
		};
		this.setTableFiltersValues(filters);
	}
	//endregion

	//#region FilterOptions Functions
	private getScoutNameForFilter(id: string): string {
		return this.customerPipe.transform(id, this.customers);
	}

	private getCompetitionNameForFilter(id: number): string {
		return this.wyscoutCompetitions.find(({ value }) => value === id)?.label;
	}
	//endregion

	//#region Filters Events
	onPeriodChange(dateRange: Date[]) {
		if (!dateRange || dateRange.filter(date => date != null).length !== 2) return;
		this.forceResetTableFilters = true;
		this.selectedDates = dateRange;
		this.setDefaultLazyLoadOptions();
		this.getGamesWithReports(dateRange, { ...this.queryOptions, filters: this.filters }).subscribe({
			next: () => this.renderTable(),
			error: (error: Error) => this.error.handleError(error)
		});
	}
	//endregion

	//#region Load Games With Reports
	private getGamesWithReports(
		selectedDates: Date[],
		options?: LazyLoadEvent,
		isForCsv: boolean = false
	): Observable<GameReportWithAdditionalData[]> {
		this.queryOptions = {
			...this.queryOptions,
			...options
		};
		return this.teamApi[isForCsv ? 'getGamesWithReportsCSV' : 'getGamesWithReports'](
			this.currentTeamId,
			selectedDates,
			this.queryOptions,
			moment().utcOffset()
		).pipe(
			untilDestroyed(this),
			map(({ count, items, filtersItems }) => {
				if (!isForCsv) {
					const filters: TableFilters = this.getUniqueTableFiltersFromResults(filtersItems);
					this.setReportDataColumns(items);
					this.setGamesWithReports(items);
					this.setTotalRecordCount(count);
					if (filters && this.forceResetTableFilters) {
						this.setTableFiltersValues(filters);
					}
				}
				return this.games;
			})
		);
	}

	private getUniqueTableFiltersFromResults(filtersItems: TableFilters): TableFilters {
		if (!filtersItems) this.resetInitialFiltersValues();
		const uniquePlayers = uniqWith([...this.initialTableFilters.player, ...filtersItems.player], isEqual);
		return {
			birthYear: uniq([...this.initialTableFilters.birthYear, ...filtersItems.birthYear]),
			competition: uniq([...this.initialTableFilters.competition, ...filtersItems.competition]),
			lastUpdate: uniq([...this.initialTableFilters.lastUpdate, ...filtersItems.lastUpdate]),
			lastUpdateAuthor: uniq([...this.initialTableFilters.lastUpdateAuthor, ...filtersItems.lastUpdateAuthor]),
			level: uniq([...this.initialTableFilters.level, ...filtersItems.level]),
			nationality: uniq([...this.initialTableFilters.nationality, ...filtersItems.nationality]),
			player: uniquePlayers,
			position: uniq([...this.initialTableFilters.position, ...filtersItems.position]),
			scout: uniq([...this.initialTableFilters.scout, ...filtersItems.scout]),
			teams: uniq([...this.initialTableFilters.teams, ...filtersItems.teams])
		};
	}

	private setReportDataColumns(games: GameReportRow[]) {
		this.reportDataColumns = getUniqueReportDataColumns(
			games.filter(item => item?.reportData).map(({ reportData }) => reportData)
		);
	}

	private setGamesWithReports(games: GameReportWithAdditionalData[]) {
		this.games = games;
	}

	private setTotalRecordCount(count: number = 0) {
		this.totalRecords = count;
	}

	private setTableFiltersValues(filters: TableFilters) {
		this.initialTableFilters = filters;
	}
	//endregion

	//#region Table Rendering
	private renderTable() {
		this.tableValues = this.getTableValues(this.games);
		this.filteredTableValues = [...this.tableValues];
		if (this.filteredTableValues?.length === 0) {
			this.showFilters = true;
		}
		this.loadColumnsWithOptions();
		this.forceResetTableFilters = false;
	}
	private getTableValues(games: GameReportWithAdditionalData[] = []): GameReportRow[] {
		return games.map(game => getTableRow(game, this.customerPipe, this.customers, this.wyscoutCompetitions));
	}

	private loadColumnsWithOptions() {
		this.visibleColumns = uniq([...this.visibleColumns, ...this.reportDataColumns.map(({ key }) => key)]);
		const basicColumnOptions = getBasicColumnOptions(
			this.visibleColumns.filter(column => initialVisibleBasicColumns.includes(column))
		);
		const reportDataColumnOptions = getReportColumnOptions(this.reportDataColumns);
		this.columnOptions = [...basicColumnOptions, ...reportDataColumnOptions];
		this.columns = this.getColumns(this.visibleColumns);
	}

	private getColumns(visibleColumns: string[] = []): Column[] {
		const columns = getColumns(this.reportDataColumns);
		const columnsToTranslate =
			visibleColumns.length > 0
				? columns.filter(({ field, hideInTable }) => visibleColumns.includes(field) || hideInTable)
				: columns;
		return columnsToTranslate.map((columnItem: Column) => ({
			...columnItem,
			header: columnItem.header.length > 0 ? this.translate.instant(columnItem.header) : columnItem.header
		}));
	}
	//endregion

	//#region Table Columns Functions
	changeViewableColumns(visibleColumns: string[]) {
		this.visibleColumns = visibleColumns;
		this.columns = this.getColumns(visibleColumns);
	}
	//endregion

	//#region Table Filter Functions

	handleExtractedState(event: FilterEmitter) {
		setTimeout(() => {
			this.filtersForTemplate = getFiltersForTemplate(event.state);
			this.showFilterTemplateSelection = true;
		}, 10);
	}
	handleFilterStateUpdated(event: FilterEmitter) {
		setTimeout(() => {
			this.filtersForTemplate = getFiltersForTemplate(event.state);
			this.filterChanged(this.getFiltersForApiCall(event.state));
		}, 10);
	}

	private getFiltersForApiCall(state: Array<FilterState<any>>): { [s: string]: FilterMetadata } {
		const filtered = state.filter(({ selection }) => !!selection.items);
		return Object.assign({}, ...(filtered || []).map(({ key, selection }) => ({ [key]: { value: selection.items } })));
	}

	private filterChanged(filters: { [s: string]: FilterMetadata }) {
		this.filters = filters;
		if (filters) {
			this.getGamesWithReports(this.selectedDates, { filters }).subscribe({
				next: () => this.renderTable(),
				error: (error: Error) => this.error.handleError(error)
			});
		}
	}
	//endregion

	//#region Table Filter Template Functions
	handleFilterTemplateChanged(event: TeamTableFilterTemplate) {
		setTimeout(() => {
			this.resetInitialFiltersValues();
			this.forceResetTableFilters = true;
			this.filterOptions = getUpdatedFilterOptions(event, this.filterOptions);
			this.filterChanged(this.getFiltersForApiCallFromTemplate(event));
			this.visibleColumns = event.visibility;
		}, 10);
	}

	private getFiltersForApiCallFromTemplate(event: TeamTableFilterTemplate): { [s: string]: FilterMetadata } {
		const filters = {};
		Object.keys(event.filters).forEach(key => {
			if (event.filters[key]?.length > 0) {
				filters[key] = {
					value: event.filters[key]
				};
			}
		});
		return filters;
	}
	//endregion

	//#region Common Functions
	ngForTrackByFn(row: any) {
		return row.id;
	}

	onRowClick(row: GameReportRow) {
		this.rowClick.emit(row);
	}

	onPageChange(options: LazyLoadEvent) {
		// Check if the event is triggered during initialization
		if (options.first === 0) {
			// Do nothing or add specific initialization logic if needed
			return;
		}
		this.getGamesWithReports(this.selectedDates, omit(options, ['filters'])).subscribe({
			next: () => this.renderTable(),
			error: (error: Error) => this.error.handleError(error)
		});
	}
	//endregion

	//region Delete Game Reports
	askToDeleteGameReports() {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.deleteAll'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				this.deleteGameReports();
			}
		});
	}
	private deleteGameReports() {
		const ids$: Array<Observable<string>> = this.selectedTableValues.map(({ id }) => this.service.deleteGameReport(id));
		forkJoin<Observable<string>[]>(ids$)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: result => {
					this.selectedTableValues = [];
					this.onPeriodChange(this.selectedDates);
					this.alert.notify('success', 'Scouting Reports', 'alert.recordDeleted', false);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}
	//endregion

	//#region Report Download Functions

	downloadPdf() {
		const title = this.getScoutReportFilename();
		const exportableColumns = this.columns.filter(
			({ field, type }) => this.visibleColumns.includes(field) && !['video', 'doc'].includes(type)
		);
		const data = {
			title,
			table: {
				headers: exportableColumns.map(({ header }) => header),
				rows: getTableRowsData([...this.getTableValues(this.games)], this.columns, this.visibleColumns, this.translate)
			}
		};
		this.reportService.getReport('scout_report_games_view', data, null, null, title + '.pdf');
	}

	private getScoutReportFilename(extension?: string) {
		const filename =
			'Scout Report - ' +
			this.translate.instant('scouting.calendar.report.byTeam') +
			' - ' +
			moment().startOf('day').format(getMomentFormatFromStorage());

		return extension ? filename + '.' + extension : filename;
	}

	downloadCsv() {
		this.isCsvDownloading = true;
		this.getGamesWithReports(
			this.selectedDates,
			{ ...{ ...this.queryOptions, rows: null }, filters: this.filters },
			true
		).subscribe({
			next: () => {
				this.isCsvDownloading = false;
				const fileName = this.getScoutReportFilename('csv');
				const copy = getTableRowsData(
					[...this.getTableValues(this.games)],
					this.columns,
					this.visibleColumns,
					this.translate
				);
				const results = Papa.unparse(copy);
				const blob = new Blob([results], { type: 'text/plain' });
				saveAs(blob, fileName);
			},
			error: (error: Error) => {
				this.isCsvDownloading = false;
				this.error.handleError(error);
			}
		});
	}
	//endregion
}

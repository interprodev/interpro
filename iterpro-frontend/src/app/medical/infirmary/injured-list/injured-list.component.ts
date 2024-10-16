import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonListViewPDF, Injury, MedicalTreatment, TeamTableFilterTemplate } from '@iterpro/shared/data-access/sdk';
import { ColumnVisibilityOption } from '@iterpro/shared/ui/components';
import { AgePipe } from '@iterpro/shared/ui/pipes';
import {
	AzureStoragePipe,
	InjuryIconService,
	ReportService,
	TreatmentsOfTheDayTooltipPipe,
	getMomentFormatFromStorage,
	getPDFv2Path,
	tableToMixedTable
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import moment from 'moment';
import { MenuItem, SelectItem } from 'primeng/api';
import { FilterEmitter, FilterOptions } from 'src/app/shared/table-filter/models/table-filter.model';
import { getFiltersForTemplate, getUpdatedFilterOptions } from 'src/app/shared/table-filter/utils/table-filter.util';
import {
	InjuredListColumn,
	f,
	getColumnOptions,
	getColumns,
	getColumnsFields,
	getInjuryValues,
	initialVisibility,
	lastOf
} from './injured-list.utils';

@Component({
	selector: 'iterpro-injured-list',
	templateUrl: './injured-list.component.html',
	styleUrls: ['./injured-list.component.scss']
})
export class InjuredListComponent implements OnChanges {
	@Input() injuries: Injury[];
	@Input() medicalTreatments: MedicalTreatment[];
	@Input() showFilters = false;
	@Output() editInjuryEmitter: EventEmitter<any> = new EventEmitter<any>();
	items: any[] = [];
	itemsBackup: any[] = [];
	filterOptions: FilterOptions<Injury & { lastAssessment: string; lastTreatment: string }> = {
		issue: { label: 'medical.infirmary.details.issue', type: 'multi' },
		date: { label: 'medical.infirmary.report.injuryDate', type: 'multi' },
		system: { label: 'medical.infirmary.details.system', type: 'multi' },
		location: { label: 'medical.infirmary.details.location', type: 'multi' },
		type: { label: 'medical.infirmary.details.type', type: 'multi' },
		category: { label: 'medical.infirmary.details.category', type: 'multi' },
		occurrence: { label: 'medical.infirmary.details.occurrence', type: 'multi' },
		severity: { label: 'medical.infirmary.details.severity', type: 'multi' },
		currentStatus: { label: 'medical.infirmary.report.status', type: 'multi' },
		diagnosis: { label: 'medical.infirmary.details.diagnosis', type: 'multi' },
		lastAssessment: { label: 'medical.infirmary.report.lastAssessment', type: 'multi' },
		lastTreatment: { label: 'medical.infirmary.report.lastTherapy', type: 'multi' }
	};

	columns: InjuredListColumn[];
	visibleColumns: string[] = getColumnsFields();
	columnOptions: ColumnVisibilityOption[] = getColumnOptions(initialVisibility);
	showFilterTemplateSelection: boolean;
	filtersForTemplate: { [s: string]: unknown };
	filtersTabTypes: MenuItem[] = [
		{
			id: 'filters',
			label: 'Filters',
			command: () => this.activeFilterTabType = this.filtersTabTypes[0]
		},
		{
			id: 'tableColumns',
			label: 'Table columns',
			command: () => this.activeFilterTabType = this.filtersTabTypes[1]
		}
	];
	activeFilterTabType: MenuItem = this.filtersTabTypes[0];
	constructor(
		private agePipe: AgePipe,
		private translate: TranslateService,
		private reportService: ReportService,
		private azureUrlPipe: AzureStoragePipe,
		private injuryIconService: InjuryIconService,
		private treatmentsOfTheDayTooltipPipe: TreatmentsOfTheDayTooltipPipe
	) {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['medicalTreatments']) {
			this.loadItems(this.injuries);
		}
		if (changes['injuries']) {
			this.loadColumns();
			this.loadItems(this.injuries);
		}
	}
	private loadColumns() {
		const columns: InjuredListColumn[] = getColumns();
		const columnsToTranslate =
			this.visibleColumns.length > 0
				? columns.filter(({ field, column }) => this.visibleColumns.includes(column ? column : field))
				: columns;
		this.columns = columnsToTranslate.map(column => ({
			...column,
			header: column.header.length > 0 ? this.translate.instant(column.header) : column.header
		}));
	}

	private loadItems(injuries: Injury[] = []) {
		const t = this.translate.instant.bind(this.translate);
		this.items = injuries.map(injury => ({
			id: String(injury.id),
			downloadUrl: injury.player.downloadUrl,
			displayName: injury.player.displayName,
			position: injury.player.position,
			age: injury.player.birthDate,
			...getInjuryValues(injury, t),
			lastAssessment: f(lastOf(injury._injuryAssessments, 'date')),
			lastTreatment: f(lastOf(this.getInjuryMedicalTreatments(injury.id), 'date'))
		}));
		this.itemsBackup = cloneDeep(this.items);
	}

	private getInjuryMedicalTreatments(itemInjuryId: string): MedicalTreatment[] {
		return this.medicalTreatments.filter(({ injuryId }) => injuryId === itemInjuryId);
	}

	editInjury(injury: Injury) {
		this.editInjuryEmitter.emit(injury.id);
	}

	//region Filters
	filterPlayers(filteredItems: any[]) {
		this.items = filteredItems;
	}
	changeViewableColumns(visibleColumns: string[]) {
		this.visibleColumns = visibleColumns;
		this.loadColumns();
	}
	resetFilters() {
		this.items = cloneDeep(this.itemsBackup);
	}

	//endregion

	getListReportPDF() {
		const title = `${this.translate.instant(`infirmary`).toUpperCase()} ${this.translate
			.instant(`profile.team`)
			.toUpperCase()}`;
		const report: CommonListViewPDF = {
			header: {
				title: title,
				subTitle: ''
			},
			metadata: {
				createdLabel: `${this.translate.instant('general.createdOn')} ${moment(new Date()).format(
					`${getMomentFormatFromStorage()} hh:mm`
				)}`
			},
			table: tableToMixedTable(
				this.visibleColumns,
				this.columns,
				this.items,
				this.translate,
				this.azureUrlPipe,
				this.agePipe,
				this.injuryIconService,
				this.treatmentsOfTheDayTooltipPipe
			)
		};
		this.reportService.getReport(
			getPDFv2Path('infirmary', 'infirmary_team_list_view', false),
			report,
			'',
			null,
			`${title}`
		);
	}

	handleFilterStateUpdated(event: FilterEmitter) {
		setTimeout(() => {
			const state = event.state;
			this.filtersForTemplate = getFiltersForTemplate(state);
			this.filterPlayers(event.filteredItems);
			this.showFilterTemplateSelection = true;
		}, 10);
	}
	handleFilterTemplateChanged(event: TeamTableFilterTemplate) {
		setTimeout(() => {
			this.filterOptions = getUpdatedFilterOptions(event, this.filterOptions);
			this.visibleColumns = event.visibility;
			this.loadColumnOptions();
		}, 10);
	}

	private loadColumnOptions() {
		this.columnOptions = getColumnOptions(initialVisibility).map((column: ColumnVisibilityOption) => ({
			...column,
			model: (column.model || []).filter((model: string) => this.visibleColumns.includes(model))
		}));
	}
}

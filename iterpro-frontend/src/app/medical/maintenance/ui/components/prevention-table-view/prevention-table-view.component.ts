import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MedicalPreventionPlayer, PdfMixedTable } from '@iterpro/shared/data-access/sdk';
import { AgePipe } from '@iterpro/shared/ui/pipes';
import {
	AzureStoragePipe,
	InjuryIconService,
	TreatmentsOfTheDayTooltipPipe,
	compareValues,
	tableToMixedTable
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { MedicalPreventionColumn, getColumns } from './fields';

enum InjuryStatusOrder {
	'notAvailable' = 0,
	'careful' = 1,
	'injury' = 2,
	'complaint' = 3,
	'illness' = 4,
	'fit' = 5
}
@Component({
	selector: 'iterpro-prevention-table-view',
	templateUrl: './prevention-table-view.component.html',
	styleUrls: ['./prevention-table-view.component.css']
})
export class PreventionTableComponent implements OnChanges {
	@Input() players: MedicalPreventionPlayer[];
	@Input() visibleColumns: string[] = [];
	@Input() testColumns: string[] = [];
	@Output() onPlayerClick: EventEmitter<MedicalPreventionPlayer> = new EventEmitter<MedicalPreventionPlayer>();

	columns: MedicalPreventionColumn[];

	constructor(
		private agePipe: AgePipe,
		private azurePipe: AzureStoragePipe,
		private translate: TranslateService,
		private injuryIconService: InjuryIconService,
		private treatmentsOfTheDayTooltipPipe: TreatmentsOfTheDayTooltipPipe
	) {}

	ngOnChanges(changes: SimpleChanges) {
		const columns: MedicalPreventionColumn[] = getColumns(this.testColumns);
		const columnsToTranslate =
			this.visibleColumns.length > 0
				? columns.filter(({ field, column }) => this.visibleColumns.includes(column ? column : field))
				: columns;
		this.columns = columnsToTranslate.map(column => ({
			...column,
			header: column.header.length > 0 ? this.translate.instant(column.header) : column.header
		}));
	}

	onRowClick(player: MedicalPreventionPlayer) {
		this.onPlayerClick.emit(player);
	}

	// this function is used by the parent component
	getTable(): PdfMixedTable {
		return tableToMixedTable(
			this.visibleColumns,
			this.columns,
			this.players,
			this.translate,
			this.azurePipe,
			this.agePipe,
			this.injuryIconService,
			this.treatmentsOfTheDayTooltipPipe
		);
	}
	getDisplay(field: string) {
		return this.visibleColumns.indexOf(field) >= 0 ? 'table-cell' : 'none';
	}

	customSort(event) {
		event.data.sort((data1: MedicalPreventionPlayer, data2: MedicalPreventionPlayer) => {
			const value1 = data1[event.field];
			const value2 = data2[event.field];
			const ordered =
				event.field === 'injuries' ? this.compareInjuryValues(value1, value2) : compareValues(value1, value2);
			return event.order * ordered;
		});
	}

	private compareInjuryValues(value1: any, value2: any) {
		const status1 = this.injuryIconService.getHealthStatus(value1);
		const status2 = this.injuryIconService.getHealthStatus(value2);
		return InjuryStatusOrder[status1] < InjuryStatusOrder[status2] ? 1 : -1;
	}

	ngForTrackByFn(player: MedicalPreventionPlayer) {
		return player.id;
	}
}

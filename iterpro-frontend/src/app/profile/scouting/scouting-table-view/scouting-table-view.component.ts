import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ExtendedPlayerScouting, PlayerAttribute, TableColumn } from '@iterpro/shared/data-access/sdk';
import { PlayersPipe } from '@iterpro/shared/ui/pipes';
import {
	AzureStoragePipe,
	InjuryIconService,
	SportType,
	compareValues,
	getReportColumns,
	getUniqueReportDataArrayColumns
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import { Table } from 'primeng/table';

@Component({
	selector: 'iterpro-scouting-table-view',
	templateUrl: './scouting-table-view.component.html',
	styleUrls: ['./scouting-table-view.component.css'],
	providers: [PlayersPipe, AzureStoragePipe]
})
export class ScoutingTableComponent implements OnChanges {
	@Input({required: true}) players: ExtendedPlayerScouting[];
	@Input() filterPlayer = '';
	@Input({required: true}) visibleColumns: string[] = [];
	@Input() standardAttributes: PlayerAttribute[];
	@Input() isSwissGameReport = false;
	@Input() isWatford = false;
	@Input({required: true}) sportType: SportType;
	@Input({required: true}) isTableLoading: boolean;

	@Output() onPlayerClick: EventEmitter<ExtendedPlayerScouting> = new EventEmitter<ExtendedPlayerScouting>();

	@ViewChild('table', { static: false }) table: Table;

	columns: TableColumn[];
	textFiltered: ExtendedPlayerScouting[];
	filtered: ExtendedPlayerScouting[];
	hasSomeArchivedPlayer = false;

	constructor(
		// injuryIconService is used by the getReport() function
		public injuryIconService: InjuryIconService,
		private translate: TranslateService,
		private playersPipe: PlayersPipe
	) {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['players'] || changes['filterPlayer'] || changes['visibleColumns']) {
			this.loadAll();
		}
	}

	private loadAll() {
		const tempFiltered = (this.textFiltered = this.playersPipe.transform(this.players, this.filterPlayer));
		this.loadFiltered(tempFiltered);
		this.hasSomeArchivedPlayer = this.isThereAnyArchivedPlayer(this.players);
		const reportDataColumns = getUniqueReportDataArrayColumns(
			this.filtered.map(({ reportDataAvgFlatted }) => reportDataAvgFlatted)
		);
		const columns: TableColumn[] = getReportColumns(
			reportDataColumns,
			this.standardAttributes,
			this.isSwissGameReport,
			this.hasSomeArchivedPlayer,
			this.sportType
		);
		const columnsToTranslate =
			this.visibleColumns.length > 0 ? columns.filter(({ field }) => this.visibleColumns.includes(field)) : columns;
		this.columns = columnsToTranslate.map(column => ({
			...column,
			header: column.header.length > 0 ? this.translate.instant(column.header) : column.header
		}));
	}

	private loadFiltered(tempFiltered: ExtendedPlayerScouting[]) {
		const clonedPlayers = cloneDeep(tempFiltered);
		for (const player of clonedPlayers) {
			// @ts-ignore
			player['reportDataAvgFlatted'] = {};
			if (player?.reportDataAvg) {
				for (const reportData of player.reportDataAvg) {
					player['reportDataAvgFlatted'][reportData.sectionId + reportData.key] = reportData;
				}
			}
		}
		this.filtered = clonedPlayers;
	}

	onRowClick(player: ExtendedPlayerScouting) {
		this.onPlayerClick.emit(player);
	}

	private isThereAnyArchivedPlayer(players: ExtendedPlayerScouting[]): boolean {
		return players.some(({ archived }) => archived);
	}

	// this function is used by the parent component
	getData(): ExtendedPlayerScouting[] {
		return this.filtered;
	}

	trackByFn(player: ExtendedPlayerScouting): string {
		return player.id;
	}
}

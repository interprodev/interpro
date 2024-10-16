import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ExtendedPlayerScouting, Player, ScoutingColumnVisibility, ScoutingLineup, TableColumn } from '@iterpro/shared/data-access/sdk';
import { ColumnVisibilityOption } from '@iterpro/shared/ui/components';
import { SportType, getColumnVisibility, getId, getReportColumns, getScoutingColumnOptions } from '@iterpro/shared/utils/common-utils';
import { sortBy } from 'lodash';
import { ScoutingMapping } from '../../scouting-details/scouting-details.component';

const initialVisiblity: ScoutingColumnVisibility = {
	general: ['downloadUrl', 'displayName', 'birthDateText', 'nationality', 'currentTeam'],
	attributes: ['position', 'foot'],
	deal: ['feeRange', 'wageRange'],
	reportData: []
};

@Component({
	selector: 'iterpro-scouting-shortlist-table',
	templateUrl: './scouting-shortlist-table.component.html',
	styleUrls: ['./scouting-shortlist-table.component.css']
})
export class ScoutingShortlistTableComponent implements OnChanges {
	@Input() scenarioRoles: boolean;
	@Input() scenario!: ScoutingLineup;
	@Input() players: Player[] = [];
	@Input() roles: { role: string }[] = [];
	@Input() scoutingPlayers: ExtendedPlayerScouting[] = [];
	@Input() isPlayerDescriptionTipss = false;
	@Input() isWatfordGameReport = false;
	@Input() visibleColumns: string[] = this.columnVisibilityToArray(initialVisiblity);
	@Input() sportType: SportType;

	@Output() selectedPlayer: EventEmitter<ExtendedPlayerScouting> = new EventEmitter<ExtendedPlayerScouting>();
	@Output() visibleColumnsChange: EventEmitter<string[]> = new EventEmitter<string[]>();
	@Output() visibleColumnsResetRequest: EventEmitter<void> = new EventEmitter<void>();

	shortlistScoutings: ExtendedPlayerScouting[] = [];
	columnOptions: ColumnVisibilityOption[] = [];
	columns: TableColumn[] = [];
	showFilters = false;

	ngOnChanges(changes: SimpleChanges) {
		if (changes?.visibleColumns?.currentValue) {
			this.columns = getReportColumns([], undefined, this.isPlayerDescriptionTipss, false, this.sportType);

			const actualVisibility: ScoutingColumnVisibility = getColumnVisibility(this.columns, this.visibleColumns);
			this.columnOptions = getScoutingColumnOptions(
				actualVisibility,
				[],
				undefined,
				this.isPlayerDescriptionTipss,
				this.isWatfordGameReport,
				this.sportType
			);
		}
	}

	getMappedScoutingPlayers(element: Player | { role: string }): ExtendedPlayerScouting[] {
		const shortlist = this.getShortlist(element);
		const shortlistScoutings = shortlist.map(({ associatedScoutingId, associatedPosition }) => ({
			...this.scoutingPlayers.find(({ id }) => id === associatedScoutingId),
			associatedPosition
		}));
		return shortlistScoutings;
	}

	onSelectPlayer(event: ExtendedPlayerScouting) {
		this.selectedPlayer.emit(event);
	}

	changeViewableColumns(columns: string[]) {
		this.visibleColumnsChange.emit(columns);
	}

	requestViewableColumnsReset() {
		this.visibleColumnsResetRequest.emit();
	}

	ngForTrackByFn(player: ExtendedPlayerScouting) {
		return getId(player);
	}

	private getShortlist(element: Player | { role: string }): ScoutingMapping[] {
		const mappings = this.scenarioRoles
			? this.scenario._roles.find(({ role }) => role === (<{ role: string }>element).role).mappings || []
			: this.scenario._players.find(({ playerId }) => playerId === (element as Player).id).mappings || [];
		return sortBy(mappings, 'associatedPosition');
	}

	private columnVisibilityToArray(visibleFields: ScoutingColumnVisibility): string[] {
		return [...visibleFields.general, ...visibleFields.attributes, ...visibleFields.deal];
	}
}

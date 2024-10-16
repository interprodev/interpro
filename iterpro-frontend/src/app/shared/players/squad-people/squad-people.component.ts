import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	Agent,
	Club,
	Customer,
	LoopBackAuth,
	People,
	Player,
	SquadPlayersFilter,
	SquadPlayersPageInfo,
	Staff,
	TeamTableFilterTemplate
} from '@iterpro/shared/data-access/sdk';
import {
	DocumentsExpiryDateFlagComponent,
	PictureComponent,
	PlayerFlagComponent,
	PlayerProviderWidgetComponent,
	SkeletonTableComponent,
	TableColumnFilterComponent
} from '@iterpro/shared/ui/components';
import { PlayersPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { compareValues, getTeamSettings } from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { uniqBy } from 'lodash';
import { MenuItem, SelectItem } from 'primeng/api';
import { TableFilterTemplateComponent } from 'src/app/shared/table-filter-template/table-filter-template.component';
import { TableFilterComponent } from '../../table-filter/table-filter.component';
import { PlayerHeader, PlayerRow, PlayerTable, PlayersService, SquadPlayerOptions } from '../services/players.service';
import { FilteredPeople, filterPeople, initialFilters } from '../utils/filters';
import { TableColumnVisibilityConfig, adminColumns, alwaysVisible, initialVisibility } from '../utils/headers';

@Component({
	standalone: true,
	imports: [
		CommonModule,
		TranslateModule,
		PrimeNgModule,
		TableFilterTemplateComponent,
		PlayerFlagComponent,
		FormsModule,
		PlayerProviderWidgetComponent,
		DocumentsExpiryDateFlagComponent,
		PictureComponent,
		TableColumnFilterComponent,
		TableFilterComponent,
		SkeletonTableComponent
	],
	selector: 'iterpro-squad-people',
	templateUrl: './squad-people.component.html',
	styleUrls: ['./squad-people.component.scss'],
	providers: [PlayersPipe]
})
export class SquadPeopleComponent implements OnChanges, OnInit {
	readonly lazyLoadingRows: number = 30;

	@Input() onPlayerClick: any;
	@Input() onStaffClick: any;
	@Input() onAgentClick: any;
	@Input() openArchive: any;
	@Input() openDelete: any;
	@Input({ required: true }) club: Club;
	@Input({ required: true }) showFilters: boolean;
	@Input({ required: true }) selectedPeople: People[] = [];
	@Input({ required: true }) totalPeopleRows: number;

	@Output() loadPage: EventEmitter<SquadPlayersPageInfo> = new EventEmitter<SquadPlayersPageInfo>();
	@Output() filter: EventEmitter<SquadPlayersFilter> = new EventEmitter<SquadPlayersFilter>();
	@Output() addSelectedPlayers: EventEmitter<string> = new EventEmitter<string>();
	@Output() removeSelectedPlayers: EventEmitter<string> = new EventEmitter<string>();
	@Output() resetSelectedPlayers: EventEmitter<void> = new EventEmitter<void>();

	table: PlayerTable;
	columns: PlayerHeader[];
	filters: SquadPlayersFilter;
	options: SquadPlayerOptions;
	visibility: TableColumnVisibilityConfig = initialVisibility();
	selectedRows: any;
	enableLazyLoading = true;
	totalRows = 0;
	daysBeforeExpiry: number;
	taxes: { taxes: number; vat: number };
	showFilterTemplateSelection = false;
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
	constructor(
		private readonly auth: LoopBackAuth,
		private readonly playersPipe: PlayersPipe,
		private readonly playersService: PlayersService,
		private readonly translateService: TranslateService
	) {
		this.columns = adminColumns;
	}

	ngOnInit(): void {
		this.initAll();
	}

	private initAll() {
		this.filters = {
			...initialFilters(this.club),
			team: [this.getCurrentUser().currentTeamId]
		};
		this.visibility = initialVisibility();
		this.showFilterTemplateSelection = true;
		this.taxes = { taxes: this.club.taxes, vat: this.club.vat };
	}

	ngOnChanges(changes: SimpleChanges) {
		const isPlayersChanged = this.isReallyChanged(
			(changes['club']?.currentValue as Club)?.players,
			(changes['club']?.previousValue as Club)?.players
		);
		const isStaffChanged = this.isReallyChanged(
			(changes['club']?.currentValue as Club)?.staff,
			(changes['club']?.previousValue as Club)?.staff
		);
		const isAgentsChanged = this.isReallyChanged(
			(changes['club']?.currentValue as Club)?.agents,
			(changes['club']?.previousValue as Club)?.agents
		);
		if (isPlayersChanged || isStaffChanged || isAgentsChanged) {
			this.table = null;
			this.update();
		}
	}

	private isReallyChanged(current: any[], previous: any[]): boolean {
		if (!previous && current) return true;
		return current && previous && current !== previous;
	}

	//#region TableFilterTemplate
	handleFilterTemplateChanged(favoriteTemplate: Partial<TeamTableFilterTemplate>) {
		if (!favoriteTemplate) {
			favoriteTemplate = {
				filters: {},
				visibility: {}
			};
		}
		this.filters = {
			...initialFilters(this.club),
			team: [this.getCurrentUser().currentTeamId],
			...favoriteTemplate.filters
		};
		this.visibility = { ...initialVisibility(), ...favoriteTemplate.visibility };
		this.filter.emit({
			status: this.filters.status,
			team: this.filters.team,
			season: this.filters.season,
			contractNotarizationStatus: this.filters.contractNotarizationStatus,
			birthYear: this.filters.birthYear,
			nationality: this.filters.nationality,
			origin: this.filters.origin,
			contractType: this.filters.contractType,
			contractExpiryYear: this.filters.contractExpiryYear,
			netValueFlag: this.filters.netValueFlag,
			feeFrom: this.filters.feeFrom,
			wageFrom: this.filters.wageFrom,
			position: this.filters.position
		});
	}

	private getCurrentUser(): Customer {
		return this.auth.getCurrentUserData();
	}
	//#endregion

	update(update = false) {
		const { currentTeamId, teamSettings } = this.getCurrentUser();
		const currentTeamSettings = getTeamSettings(teamSettings, currentTeamId);
		this.daysBeforeExpiry = currentTeamSettings.notificationDocumentsDays
			? currentTeamSettings.notificationDocumentsDays
			: 7;
		if (this.club && this.filters) {
			const filtered: FilteredPeople = filterPeople(this.club, this.filters);
			const columns = this.columns.filter(c => this.getCellVisibility(c.field)).map(column => column.field);
			this.table = this.playersService.toTable(filtered, [...alwaysVisible, ...columns], this.club);
			this.setupOptions(this.table.rows, update);
			// no lazy loading for staff & agents
			this.enableLazyLoading = filtered.type === 'Player';
			this.totalRows = this.enableLazyLoading ? this.totalPeopleRows : this.table.rows.length;
		} else {
			this.table = null;
			this.totalRows = 0;
		}
	}

	loadRecords({ first, sortField, sortOrder }) {
		const page = first > 0 && this.enableLazyLoading ? Math.floor(first / this.lazyLoadingRows) : 0;
		this.loadPage.emit({ page, sortBy: sortField ? sortField : '', order: sortOrder === 1 ? 'ASC' : 'DESC' });
	}

	customSort(event) {
		event.data.sort((a, b) => {
			const aCell = a.cells.find(({ field }) => field === event.field);
			const bCell = b.cells.find(({ field }) => field === event.field);
			const value1 = aCell.raw !== undefined ? aCell.raw : aCell.value;
			const value2 = bCell.raw !== undefined ? bCell.raw : bCell.value;
			if (value1 === null) {
				return 1;
			} else if (value2 === null) {
				return -1;
			}
			return event.order * compareValues(value1, value2);
		});
	}

	setupOptions(rows: PlayerRow[], update: boolean = false) {
		if (update) this.updatePositions(rows);
		else this.options = this.playersService.getOptions(this.club, rows);
	}

	updatePositions(rows: PlayerRow[]): void {
		const selectPlayers: SelectItem<string>[] = rows
			.map(({ player }) => player as Player)
			.filter(player => !!player && !!player.position)
			.map(({ position }) => ({ label: this.translateService.instant(position), value: position }));

		if (this.options) this.options.positions = uniqBy(selectPlayers, 'value');
	}

	updateGenericFilters(key: string, resetSelectedPlayers = false) {
		this.filter.emit({ [key]: this.filters[key] });
		if (resetSelectedPlayers) {
			this.resetSelectedPlayers.emit();
		}
	}

	updateRoleFilters() {
		this.selectedPeople.forEach(({ id }) => this.removeSelectedPlayers.emit(id));
		this.filter.emit({});
	}

	updateFilters(): void {
		this.update(true);
	}

	resetFilters() {
		this.filters = {
			...initialFilters(this.club),
			team: [this.getCurrentUser().currentTeamId]
		};
		this.visibility = initialVisibility();
		this.filter.emit({ status: this.filters.status, team: this.filters.team, season: this.filters.season });
	}

	getCellVisibility(field: string) {
		const { registry, asset, salary, amortization } = this.visibility;
		const visible = [...registry, ...asset, ...salary, ...amortization];
		return visible.indexOf(field) >= 0;
	}

	clickRow(person: Player | Agent | Staff) {
		if (this.filters.role === 'Player') this.onPlayerClick(person);
		else if (this.filters.role === 'Agent') this.onAgentClick(person);
		else if (this.filters.role === 'Staff') this.onStaffClick(person);
	}

	getTable(): PlayerTable {
		return this.table;
	}

	getCSV() {
		return this.playersService.toCSV(this.table);
	}

	getPlayerSelectionClass(id: any): string {
		return this.getSelectedPeopleIndex(id) > -1 ? 'fa-check-square' : 'fa-square';
	}

	togglePlayerSelection(e: Event, id: string) {
		e.stopPropagation();
		const index = this.getSelectedPeopleIndex(id);
		if (index > -1) {
			this.removeSelectedPlayers.emit(id);
		} else {
			this.addSelectedPlayers.emit(id);
		}
	}

	private getSelectedPeopleIndex(id: string): number {
		return this.selectedPeople.findIndex(dude => dude.id === id);
	}
}

import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { Customer, Event, Player, Staff, TeamGroup } from '@iterpro/shared/data-access/sdk';
import { sortBy } from 'lodash';
import { SelectItem } from 'primeng/api';
import { EventFormatService } from '../services/event-format.service';
import { EventPaletteService } from '../services/event-palette.service';
@Component({
	selector: 'iterpro-planning-event-filter',
	templateUrl: './planning-event-filter.html',
	styleUrls: ['./planning-event-filter.css']
})
export class PlanningEventFilterComponent implements OnChanges, OnInit {
	@Input() events: Event[];
	@Input() nationalClub: boolean;
	@Input() players: Player[];
	@Input() staff: Staff[];
	@Input() authors: Customer[];
	@Input() groups: TeamGroup[];

	@Output() changeFormat: EventEmitter<string[]> = new EventEmitter<string[]>();
	@Output() changePlayers: EventEmitter<Player[]> = new EventEmitter<Player[]>();
	@Output() changeStaff: EventEmitter<Staff[]> = new EventEmitter<Staff[]>();
	@Output() changeAuthors: EventEmitter<Customer[]> = new EventEmitter<Customer[]>();
	@Output() changeGroups: EventEmitter<TeamGroup[]> = new EventEmitter<TeamGroup[]>();

	formats: SelectItem[];

	selectedFormats: string[] = [];
	selectedPlayers: Player[] = [];
	selectedStaff: Staff[] = [];
	staffList: SelectItem[] = [];
	selectedAuthors: Customer[] = [];
	authorsList: SelectItem[] = [];
	selectedGroups: TeamGroup[] = [];
	groupList: SelectItem[] = [];

	readonly #eventPaletteService = inject(EventPaletteService);
	readonly #eventFormatService = inject(EventFormatService);

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['players'] && this.players) {
			this.players = sortBy(this.players, 'displayName');
		}
		if (changes['staff'] && this.staff) {
			this.staffList = sortBy(this.staff, 'lastName').map(x => ({
				value: x,
				label: `${x.firstName} ${x.lastName}`
			}));
		}
		if (changes['authors'] && this.authors) {
			this.authorsList = sortBy(this.authors, 'lastName').map(x => ({
				value: x,
				label: `${x.firstName} ${x.lastName}`
			}));
		}
	}

	ngOnInit() {
		this.formats = this.nationalClub
			? this.#eventFormatService.getNationalClubSelectableFormats(true)
			: this.#eventFormatService.getClubSelectableFormats(true);
	}

	changeSelection() {
		this.changeFormat.emit(this.selectedFormats);
	}

	changePlayersSelection() {
		this.changePlayers.emit(this.selectedPlayers);
	}

	changeStaffSelection() {
		this.changeStaff.emit(this.selectedStaff);
	}

	changeAuthorSelection() {
		this.changeAuthors.emit(this.selectedAuthors);
	}

	changeGroupSelection() {
		this.changeGroups.emit(this.selectedGroups);
	}

	getFormatColor(format: string) {
		return this.#eventPaletteService.getColor(format);
	}
}

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
	ExtendedPlayerScouting,
	Player,
	SearchPlayerDropdownElement,
	Staff,
	Team
} from '@iterpro/shared/data-access/sdk';
import { PictureComponent, PlayerProviderWidgetComponent } from '@iterpro/shared/ui/components';
import { ClickOutsideDirective } from '@iterpro/shared/ui/directives';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModule, PictureComponent, TranslateModule, PlayerProviderWidgetComponent, ClickOutsideDirective],
	selector: 'iterpro-search-dropdown',
	templateUrl: './search-dropdown.component.html',
	styleUrls: ['./search-dropdown.component.css']
})
export class SearchDropdownComponent implements OnInit {
	@Input() teams: Team[] = [];
	@Input({required: true}) people: SearchPlayerDropdownElement[] = [];
	@Input({required: true}) selectedPerson!: Player | ExtendedPlayerScouting | Staff;
	@Input() showCaretIcon!: boolean;
	@Input() personType: 'Player' | 'Staff' = 'Player';
	@Output() selectPerson: EventEmitter<SearchPlayerDropdownElement> = new EventEmitter<SearchPlayerDropdownElement>();

	term = new FormControl();
	peopleBackup: SearchPlayerDropdownElement[] = [];
	maxResults = 10;
	searching = false;
	dropdownOpen = false;

	constructor() {
		this.setResults = this.setResults.bind(this);
		this.setResults2 = this.setResults2.bind(this);
		this.subscribeToTerm();
	}

	ngOnInit() {
		this.peopleBackup = [...this.people];
	}

	onSelect(res: SearchPlayerDropdownElement) {
		this.dropdownOpen = false;
		this.selectPerson.emit(res);
	}

	private subscribeToTerm() {
		this.term.valueChanges
			.pipe(debounceTime(400), distinctUntilChanged())
			.pipe(untilDestroyed(this))
			.subscribe(this.setResults2);
	}

	private setResults2(searchstring: string) {
		if (!searchstring || searchstring === '') this.people = [...this.peopleBackup];
		else {
			const re = new RegExp(searchstring, 'i');
			this.people = (this.peopleBackup || []).filter(
				({ player }) => player && (re.test(player.displayName) || re.test(player.lastName) || re.test(player.name))
			);
		}
	}

	private setResults(people) {
		this.searching = false;
		this.people = people
			.map((players, i) => ({
				team: this.teams[i],
				players: players
			}))
			.reduce((l, { team, players }, index) => {
				const withTeam = players.map((player: Player) => ({
					player,
					team,
					performanceMetrics: null,
					tacticalMetrics: null,
					robustness: null
				}));

				return withTeam.length ? [...l, { team, isTeam: true }, ...withTeam] : l;
			}, [])
			.splice(0, this.maxResults);
	}
}

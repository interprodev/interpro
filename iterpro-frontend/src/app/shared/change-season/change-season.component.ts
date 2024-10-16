import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TeamSeason } from '@iterpro/shared/data-access/sdk';
import { Store } from '@ngrx/store';
import { DropdownModule } from 'primeng/dropdown';
import { Observable } from 'rxjs';
import { SeasonStoreActions, SeasonStoreSelectors } from './../../+state';
import { RootStoreState } from '../../+state/root-store.state';

@Component({
	standalone: true,
	imports: [CommonModule, FormsModule, DropdownModule],
	selector: 'iterpro-change-season',
	template: `
		<div class="tw-flex tw-items-center">
			<p-dropdown
				*ngIf="teamSeasons$ | async"
				[options]="teamSeasons$ | async"
				[optionLabel]="'name'"
				[ngModel]="selected$ | async"
				(ngModelChange)="changeCurrentSeasonAction($event)"
				[disabled]="disabled"
			></p-dropdown>
		</div>
	`
})
export class ChangeSeasonComponent implements OnInit {
	@Input() reset = false;
	@Input() disabled = false;

	public selected$: Observable<TeamSeason>;
	public teamSeasons$: Observable<TeamSeason[]>;

	constructor(private readonly store$: Store<RootStoreState>) {
		this.teamSeasons$ = this.store$.select(SeasonStoreSelectors.selectAllSeasonsDescOrder);
		this.selected$ = this.store$.select(SeasonStoreSelectors.selectDefault);
	}

	ngOnInit() {
		if (this.reset) {
			this.store$.dispatch(SeasonStoreActions.resetSeasonSelection());
		}
	}

	changeCurrentSeasonAction(selected: TeamSeason) {
		this.store$.dispatch(SeasonStoreActions.performSeasonSelection({ selected }));
	}
}

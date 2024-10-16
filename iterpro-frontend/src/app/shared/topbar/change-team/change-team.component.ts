import { AsyncPipe} from '@angular/common';
import { Component, Input } from '@angular/core';
import { AuthActions, AuthSelectors, AuthState, SelectableTeam } from '@iterpro/shared/data-access/auth';
import { Club } from '@iterpro/shared/data-access/sdk';
import { Store } from '@ngrx/store';
import { StyleClassModule } from 'primeng/styleclass';
import { Observable } from 'rxjs';
import { SkeletonDropdownComponent, PictureComponent } from '@iterpro/shared/ui/components';
import { RippleModule } from 'primeng/ripple';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

@Component({
	standalone: true,
	imports: [AsyncPipe, RippleModule, StyleClassModule, PictureComponent, SkeletonDropdownComponent, FormsModule, TranslateModule],
	selector: 'iterpro-change-team',
	templateUrl: './change-team.component.html',
	styleUrl: './change-team.component.scss'
})
export class ChangeTeamComponent {
	@Input() showLogoutButton!: boolean;

	selectedClub$!: Observable<Club | undefined>;
	selectedTeam$!: Observable<SelectableTeam | undefined>;
	teamList$!: Observable<SelectableTeam[]>;
	searchTerm: string;
	constructor(private readonly store$: Store<AuthState>) {
		this.store$.dispatch(AuthActions.loadTeamList());
		this.selectedClub$ = this.store$.select(AuthSelectors.selectClub);
		this.teamList$ = this.store$.select(AuthSelectors.selectTeamList);
		this.selectedTeam$ = this.store$.select(AuthSelectors.selectCurrentSelectableTeam);
	}

	updateSelectedTeamAction(value: SelectableTeam) {
		this.store$.dispatch(AuthActions.updateSelectedTeam({ teamId: value.id }));
	}

	logout(): void {
		this.store$.dispatch(AuthActions.performLogout({}));
	}

	searchTeam(query: string) {
		this.searchTerm = query;
		const tempItems = this.store$.select(AuthSelectors.selectTeamList);
		if (query && query.trim() !== '') {
			this.teamList$ = tempItems.pipe(
				map((items) => items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())))
			);
		} else {
			this.teamList$ = tempItems;
		}
	}
}

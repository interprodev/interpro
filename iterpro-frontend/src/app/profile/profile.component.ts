import { Component, OnInit } from '@angular/core';
import { AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { IterproOrgType, PermissionsService } from '@iterpro/shared/data-access/permissions';
import { UIBlock } from '@iterpro/shared/ui/components';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { RootStoreState } from '../+state/root-store.state';

@Component({
	selector: 'iterpro-profile',
	template: `
		<div class="main">
			<iterpro-launchpad [blocks]="blocks" [hideDisabledModules]="(clubType$ | async) === 'agent'" />
		</div>
	`
})
export class ProfileComponent implements OnInit {
	public blocks: UIBlock[] = [];
	public readonly clubType$: Observable<IterproOrgType> = this.store$.select(AuthSelectors.selectOrganizationType);

	constructor(
		private readonly store$: Store<RootStoreState>,
		private readonly permissionService: PermissionsService,
		private readonly currentTeamService: CurrentTeamService
	) {}

	ngOnInit() {
		this.store$.select(AuthSelectors.selectSportType).subscribe({
			next: (type: string) => {
				this.blocks = [
					{
						link: '/players/my-team',
						title: 'navigator.myTeam',
						subtitle: 'navigator.myTeam.description',
						img: `assets/img/blocks/profile/my-team${!type || type !== 'football' ? `-${type}` : ''}.jpg`
					},
					{
						link: '/players/compare-players',
						title: 'navigator.comparePlayers',
						subtitle: 'navigator.comparePlayers.description',
						img: 'assets/img/blocks/profile/comparison.jpg'
					},
					{
						link: '/players/scouting',
						title: 'navigator.scouting',
						subtitle: 'navigator.scouting.description',
						img: `assets/img/blocks/profile/scouting${!type || type !== 'football' ? `-${type}` : ''}.jpg`
					},
					{
						link: '/players/transfers',
						title: 'navigator.transfers',
						subtitle: 'navigator.transfers.description',
						img: `assets/img/blocks/profile/transfers.jpg`
					}
				];

				this.blocks = this.blocks.map(block => ({
					...block,
					enabled: this.permissionService.canAccessToRoute(block.link, this.currentTeamService.getCurrentTeam())
				}));
			}
		});
	}
}

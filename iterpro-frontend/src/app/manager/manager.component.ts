import { Component, OnInit } from '@angular/core';
import { AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { IterproOrgType, PermissionsService } from '@iterpro/shared/data-access/permissions';
import { UIBlock } from '@iterpro/shared/ui/components';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { RootStoreState } from '../+state/root-store.state';

@Component({
	selector: 'iterpro-manager',
	template: `
		<div class="main">
			<iterpro-launchpad [blocks]="blocks" [hideDisabledModules]="(clubType$ | async) === 'agent'" />
		</div>
	`
})
export class ManagerComponent implements OnInit {
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
						link: '/manager/tactics',
						title: 'navigator.tactics',
						subtitle: 'navigator.tactics.description',
						img: `assets/img/blocks/manager/tactics${!type || type !== 'football' ? `-${type}` : ''}.jpg`
					},
					{
						link: '/manager/video-gallery',
						title: 'navigator.videogallery',
						subtitle: 'navigator.videogallery.description',
						img: `assets/img/blocks/manager/video-gallery${!type || type !== 'football' ? `-${type}` : ''}.jpg`
					},
					{
						link: '/manager/drills',
						title: 'navigator.drills',
						subtitle: 'navigator.drills.description',
						img: `assets/img/blocks/manager/drills${!type || type !== 'football' ? `-${type}` : ''}.jpg`
					},
					{
						link: '/manager/planning',
						title: 'navigator.planning',
						subtitle: 'navigator.planning.description',
						img: 'assets/img/blocks/manager/planning.jpg'
					},
					{
						link: '/manager/attendances',
						title: 'navigator.attendances',
						subtitle: 'navigator.attendances.description',
						img: 'assets/img/blocks/manager/attendances.jpg'
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

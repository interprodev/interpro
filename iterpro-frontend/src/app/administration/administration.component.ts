import { Component, OnInit } from '@angular/core';
import { AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { IterproOrgType, PermissionsService } from '@iterpro/shared/data-access/permissions';
import { UIBlock } from '@iterpro/shared/ui/components';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { RootStoreState } from '../+state/root-store.state';

@Component({
	template: `
		<div class="main">
			<iterpro-launchpad [blocks]="blocks" [hideDisabledModules]="(clubType$ | async) === 'agent'" />
		</div>
	`,
	selector: 'iterpro-administration'
})
export class AdministrationComponent implements OnInit {
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
						link: '/administration/squads',
						params: { refresh: new Date().getTime() },
						title: 'navigator.squads',
						subtitle: 'navigator.squads.description',
						img: 'assets/img/blocks/finance/squads.jpg'
					},
					{
						link: '/administration/finance-overview',
						title: 'navigator.overview',
						subtitle: 'navigator.overview.description',
						img: 'assets/img/blocks/finance/overview.jpg'
					},
					{
						link: '/administration/bonus',
						title: 'navigator.bonusTracking',
						subtitle: 'navigator.bonus.description',
						img: 'assets/img/blocks/finance/bonus.jpg'
					},
					{
						link: '/administration/cash-flow',
						title: 'navigator.cashflow',
						subtitle: 'navigator.cashflow.description',
						img: 'assets/img/blocks/finance/cashflow.jpg'
					},
					{
						link: '/administration/cost-items',
						title: 'navigator.transactions',
						subtitle: 'navigator.costNoteAndSubscription.description',
						img: 'assets/img/blocks/finance/costitems.jpg'
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

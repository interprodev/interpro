import { Component, OnInit } from '@angular/core';
import { environment } from '@iterpro/config';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { PermissionsService } from '@iterpro/shared/data-access/permissions';
import { UIBlock } from '@iterpro/shared/ui/components';

@Component({
	selector: 'iterpro-finance',
	template: `
		<div class="main">
			<iterpro-launchpad [blocks]="blocks" [hideDisabledModules]="isGrassRoots" />
		</div>
	`
})
export class FinanceComponent implements OnInit {
	public blocks: UIBlock[] = [];
	public readonly isGrassRoots = environment.mode === 'grassroots';
	constructor(
		private readonly permissionService: PermissionsService,
		private readonly currentTeamService: CurrentTeamService
	) {}

	ngOnInit() {
		this.blocks = [
			{
				link: '/administration/finance/overview',
				title: 'navigator.overview',
				subtitle: 'navigator.overview.description',
				img: 'assets/img/blocks/finance/overview.jpg'
			},
			{
				link: '/administration/finance/bonus',
				title: 'navigator.bonus',
				subtitle: 'navigator.bonus.description',
				img: 'assets/img/blocks/finance/bonus.jpg'
			},
			{
				link: '/administration/finance/cash-flow',
				title: 'navigator.cashflow',
				subtitle: 'navigator.cashflow.description',
				img: 'assets/img/blocks/finance/cashflow.jpg'
			},
			{
				link: '/administration/finance/cost-items',
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
}

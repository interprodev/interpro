import { Routes } from '@angular/router';
import { AdministrationComponent } from './administration.component';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';

export const administrationRoutes: Routes = [
	{
		path: '',
		component: AdministrationComponent
	},
	{
		path: 'squads',
		loadChildren: () => import('../squads/squads.module').then(m => m.SquadsModule),
		canActivate: [PermissionsGuard]
	},
	{
		path: 'finance-overview',
		loadChildren: () => import('../finance/finance-overview/finance-overview.module').then(m => m.FinanceOverviewModule),
		canActivate: [PermissionsGuard]
	},
	{
		path: 'bonus',
		loadChildren: () => import('../finance/finance-bonus/finance-bonus.module').then(m => m.FinanceBonusModule),
		canActivate: [PermissionsGuard]
	},
	{
		path: 'cash-flow',
		loadChildren: () =>
			import('../finance/finance-cash-flow/finance-cash-flow.module').then(m => m.FinanceCashFlowModule),
		canActivate: [PermissionsGuard]
	},
	{
		path: 'cost-items',
		loadChildren: () =>
			import('../finance/finance-cost-items/finance-cost-items.module').then(m => m.FinanceCostItemsModule),
		canActivate: [PermissionsGuard]
	}
];

import { Routes } from '@angular/router';
import { authGuard, nationalClubGuard, temporaryPasswordGuard } from '@iterpro/shared/data-access/auth';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';

export const dashboardRoutes: Routes = [
	{
		path: '',
		redirectTo: 'standings',
		pathMatch: 'full',
		canLoad: [PermissionsGuard]
	},
	{
		path: 'standings',
		loadChildren: () => import('./standings/standings-dashboard.module').then(m => m.StandingsDashboardModule),
		canLoad: [nationalClubGuard, PermissionsGuard],
		data: { preload: true }
	},
	{
		path: 'custom',
		loadChildren: () => import('./iframe-dashboard/iframe-dashboard.module').then(m => m.IframeDashboardModule),
		canLoad: [],
		data: { preload: true }
	},
	{
		path: 'admin',
		loadChildren: () => import('./admin-dashboard/admin-dashboard.module').then(m => m.AdminDashboardModule),
		canLoad: [authGuard, temporaryPasswordGuard, PermissionsGuard]
	}
];

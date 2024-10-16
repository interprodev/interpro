import { Route } from '@angular/router';
import { chatGuard } from '@iterpro/chat/data-access';
import { authGuard, nationalClubGuard, temporaryPasswordGuard } from '@iterpro/shared/data-access/auth';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';

export const appRoutes: Route[] = [
	{
		path: 'home',
		redirectTo: 'dashboards',
		pathMatch: 'prefix',
		canLoad: [PermissionsGuard]
	},
	{
		path: 'standings',
		redirectTo: 'dashboards',
		pathMatch: 'prefix',
		canLoad: [PermissionsGuard]
	},
	{
		path: 'login',
		loadComponent: () => import('@iterpro/login-shell').then(m => m.LoginShellComponent)
	},
	{
		path: 'inbox',
		loadComponent: () => import('@iterpro/chat-shell').then(m => m.ChatShellComponent),
		canLoad: [authGuard, chatGuard]
	},
	{
		path: 'settings',
		loadChildren: () => import('./settings/settings.routes').then(m => m.settingsRoutes)
	},
	{
		path: 'notifications',
		loadChildren: () => import('./notifications/notifications.module').then(m => m.NotificationsModule),
		canLoad: [authGuard]
	},
	{
		path: 'import-data',
		loadChildren: () => import('./import/import.module').then(m => m.ImportModule),
		canLoad: [authGuard, temporaryPasswordGuard, PermissionsGuard]
	},
	{
		path: 'repository',
		loadChildren: () => import('./repository/repository.module').then(m => m.RepositoryModule),
		canLoad: [authGuard, temporaryPasswordGuard]
	},
	{
		path: 'dashboards',
		loadChildren: () => import('./dashboards/dashboards.routes').then(m => m.dashboardRoutes),
		canLoad: [nationalClubGuard, PermissionsGuard],
		data: { preload: true }
	},
	{
		path: 'manager',
		loadChildren: () => import('./manager/manager.module').then(m => m.ManagerModule),
		// canLoad: [PermissionsGuard] // TODO Matteo recover this line, commented for working on the template list
	},
	{
		path: 'medical',
		loadChildren: () => import('./medical/medical.module').then(m => m.MedicalModule),
		canLoad: [PermissionsGuard]
	},
	{
		path: 'performance',
		loadChildren: () => import('./performance/performance.module').then(m => m.PerformanceModule),
		canLoad: [PermissionsGuard]
	},
	{
		path: 'players',
		loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule),
		canLoad: [PermissionsGuard]
	},
	{
		path: 'administration',
		loadChildren: () => import('./administration/administration.module').then(m => m.AdministrationModule),
		canLoad: [authGuard, temporaryPasswordGuard, PermissionsGuard]
	},
	{
		path: '**',
		redirectTo: 'dashboards',
		pathMatch: 'full'
	}
];

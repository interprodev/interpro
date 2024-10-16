import { Route } from '@angular/router';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';

export const settingsRoutes: Route[] = [
	{
		path: '',
		loadComponent: () => import('./settings.component').then(c => c.SettingsComponent),
		children: [
			{
				path: '',
				redirectTo: 'user-preferences',
				pathMatch: 'full',
			},
			{
				path: 'user-preferences',
				loadChildren: () =>
					import('./settings-user-preferences/settings-user-preferences.routes').then(r => r.usersPreferencesRoutes),
				canActivate: [PermissionsGuard],
			},
/*			{
				path: 'account-management',
				loadChildren: () =>
					import('./settings-account-management/settings-account-management.routes').then(
						r => r.accountManagementRoutes
					),
				canActivate: [PermissionsGuard]
			},*/
			{
				path: 'club-preferences',
				loadChildren: () =>
					import('./settings-club-preferences/settings-club-preferences.routes').then(r => r.clubPreferencesRoutes),
				canActivate: [PermissionsGuard]
			},
			{
				path: 'teams',
				loadChildren: () => import('./settings-teams/settings-teams.routes').then(r => r.teamsRoutes),
				canActivate: [PermissionsGuard]
			},
			{
				path: 'thresholds',
				loadChildren: () => import('./settings-thresholds/settings-thresholds.routes').then(r => r.thresholdsRoutes),
				canActivate: [PermissionsGuard]
			}
		]
	}
];

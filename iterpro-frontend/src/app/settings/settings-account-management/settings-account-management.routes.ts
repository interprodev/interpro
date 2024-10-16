import { Route } from '@angular/router';
import { unsavedChangesGuardNew } from '@iterpro/shared/utils/common-utils';

export const accountManagementRoutes: Route[] = [
	{
		path: '',
		loadComponent: () => import('./components/account-management.component').then(c => c.AccountManagementComponent),
		children: [
			{
				path: '',
				redirectTo: 'users-permissions',
				pathMatch: 'full',
			},
			{
				path: 'users-permissions',
				loadComponent: () =>
					import(
						'./components/settings-account-management-users-permissions/settings-account-management-users-permissions.component'
					).then(c => c.SettingsAccountManagementUsersPermissionsComponent),
				canDeactivate: [unsavedChangesGuardNew]
			},
			{
				path: 'open-api',
				loadComponent: () =>
					import(
						'./components/settings-account-management-open-api/settings-account-management-open-api.component'
					).then(c => c.SettingsAccountManagementOpenApiComponent),
				canDeactivate: [unsavedChangesGuardNew]
			}
		]
	}
];

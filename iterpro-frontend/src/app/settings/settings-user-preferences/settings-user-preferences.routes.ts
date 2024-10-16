import { Route } from '@angular/router';
import { unsavedChangesGuardNew } from '@iterpro/shared/utils/common-utils';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';

export const usersPreferencesRoutes: Route[] = [
	{
		path: '',
		loadComponent: () =>
			import('./components/settings-user-preferences.component').then(c => c.SettingsUserPreferencesComponent),
		children: [
			{
				path: '',
				redirectTo: 'general',
				pathMatch: 'full',
			},
			{
				path: 'general',
				loadComponent: () =>
					import('./components/settings-user-preferences-general/settings-user-preferences-general.component').then(
						c => c.SettingsUserPreferencesGeneralComponent
					),
				canActivate: [PermissionsGuard],
				canDeactivate: [unsavedChangesGuardNew]
			},
			{
				path: 'notifications',
				loadComponent: () =>
					import('./components/settings-user-preferences-notifications/settings-user-preferences-notifications.component').then(
						c => c.SettingsUserPreferencesNotificationsComponent
					),
				canActivate: [PermissionsGuard],
				canDeactivate: [unsavedChangesGuardNew]
			},
			{
				path: 'security',
				loadComponent: () =>
					import('./components/settings-user-preferences-security/settings-user-preferences-security.component').then(
						m => m.SettingsUserPreferencesSecurityComponent
					),
				canActivate: [PermissionsGuard],
				canDeactivate: [unsavedChangesGuardNew]
			},
			{
				path: 'users-permissions',
				loadComponent: () =>
					import(
						'../settings-account-management/components/settings-account-management-users-permissions/settings-account-management-users-permissions.component'
						).then(c => c.SettingsAccountManagementUsersPermissionsComponent),
				canDeactivate: [unsavedChangesGuardNew]
			},
		]
	}
];

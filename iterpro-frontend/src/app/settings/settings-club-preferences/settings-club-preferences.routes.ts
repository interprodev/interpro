import { Route } from '@angular/router';
import { unsavedChangesGuardNew } from '@iterpro/shared/utils/common-utils';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';

export const clubPreferencesRoutes: Route[] = [
	{
		path: '',
		loadComponent: () => import('./components/club-preferences.component').then(c => c.ClubPreferencesComponent),
		children: [
			{
				path: '',
				redirectTo: 'general',
				pathMatch: 'full',
			},
			{
				path: 'general',
				loadComponent: () =>
					import('./components/settings-club-preferences-general/club-preferences-general.component').then(
						c => c.SettingsClubPreferencesGeneralComponent
					),
				canActivate: [PermissionsGuard],
				canDeactivate: [unsavedChangesGuardNew]
			},
			{
				path: 'finance',
				loadComponent: () =>
					import('./components/settings-club-preferences-finance/club-preferences-finance.component').then(
						c => c.SettingsClubPreferencesFinanceComponent
					),
				canActivate: [PermissionsGuard],
				canDeactivate: [unsavedChangesGuardNew]
			},
			{
				path: 'scouting',
				loadComponent: () =>
					import('./components/settings-club-preferences-scouting/club-preferences-scouting.component').then(
						c => c.SettingsClubPreferencesScoutingComponent
					),
				canActivate: [PermissionsGuard],
				canDeactivate: [unsavedChangesGuardNew]
			},
			{
				path: 'seasons',
				loadComponent: () =>
					import('./components/settings-club-preferences-seasons/club-preferences-seasons.component').then(
						c => c.SettingsClubPreferencesSeasonsComponent
					),
				canActivate: [PermissionsGuard],
				canDeactivate: [unsavedChangesGuardNew]
			}
		]
	}
];

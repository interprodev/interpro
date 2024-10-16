import { Route } from '@angular/router';
import { unsavedChangesGuardNew } from '@iterpro/shared/utils/common-utils';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';

export const thresholdsRoutes: Route[] = [
	{
		path: '',
		loadComponent: () => import('./components/settings-thresholds.component').then(c => c.SettingsThresholdsComponent),
		children: [
			{
				path: '',
				redirectTo: 'team',
				pathMatch: 'full',
			},
			{
				path: 'individual',
				loadComponent: () =>
					import('./components/settings-thresholds-individual/settings-thresholds-individual.component').then(
						c => c.SettingsThresholdsIndividualComponent
					),
				canActivate: [PermissionsGuard],
				canDeactivate: [unsavedChangesGuardNew]
			},
			{
				path: 'team',
				loadComponent: () =>
					import('./components/settings-thresholds-team/settings-thresholds-team.component').then(
						c => c.SettingsThresholdsTeamComponent
					),
				canActivate: [PermissionsGuard],
				canDeactivate: [unsavedChangesGuardNew]
			}
		]
	}
];

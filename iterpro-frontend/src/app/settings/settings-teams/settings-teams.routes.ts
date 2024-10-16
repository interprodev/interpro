import { Route } from '@angular/router';
import { unsavedChangesGuardNew } from '@iterpro/shared/utils/common-utils';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';

export const teamsRoutes: Route[] = [
	{
		path: '',
		loadComponent: () => import('./components/settings-teams.components').then(c => c.TeamsComponent),
		children: [
			{
				path: '',
				redirectTo: 'general',
				pathMatch: 'full',
			},
			{
				path: 'general',
				loadComponent: () =>
					import('./components/settings-teams-general/settings-teams-general.component').then(
						c => c.SettingsTeamsGeneralComponent
					),
				canActivate: [PermissionsGuard],
				canDeactivate: [unsavedChangesGuardNew]
			},
			{
				path: 'seasons',
				loadComponent: () =>
					import('./components/settings-teams-seasons/settings-teams-seasons.component').then(
						c => c.SettingsTeamsSeasonsComponent
					),
				canActivate: [PermissionsGuard],
				canDeactivate: [unsavedChangesGuardNew]
			},
			{
				path: 'metrics',
				loadComponent: () =>
					import('./components/settings-teams-metrics/settings-teams-metrics.component').then(
						c => c.SettingsTeamsMetricsComponent
					),
				canActivate: [PermissionsGuard],
				canDeactivate: [unsavedChangesGuardNew]
			},
			{
				path: 'player-groups',
				loadComponent: () =>
					import('./components/settings-teams-player-groups/settings-teams-player-groups.component').then(
						c => c.SettingsTeamsPlayerGroupsComponent
					),
				canDeactivate: [unsavedChangesGuardNew]
			},
			{
				path: 'integrations',
				loadComponent: () =>
					import('./components/settings-teams-integrations/settings-teams-integrations.component').then(
						c => c.SettingsTeamsIntegrationsComponent
					),
				canActivate: [PermissionsGuard],
				canDeactivate: [unsavedChangesGuardNew]
			},
			{
				path: 'go-score',
				loadComponent: () =>
					import('./components/settings-teams-go-score/settings-teams-go-score.component').then(
						c => c.SettingsTeamsGoScoreComponent
					),
				canActivate: [PermissionsGuard],
				canDeactivate: [unsavedChangesGuardNew]
			},
			{
				path: 'player-app',
				loadComponent: () =>
					import('./components/settings-teams-player-app/settings-teams-player-app.component').then(
						c => c.SettingsTeamsPlayerAppComponent
					),
				canActivate: [PermissionsGuard],
				canDeactivate: [unsavedChangesGuardNew]
			}
		]
	}
];

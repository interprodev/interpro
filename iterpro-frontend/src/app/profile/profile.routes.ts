import { Routes } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';

export const profileRoutes: Routes = [
	{
		path: '',
		component: ProfileComponent
		// canDeactivate: [unsavedChangesGuard]
	},
	{
		path: 'my-team',
		loadChildren: () => import('./my-team/my-team.module').then(m => m.MyTeamModule),
		canActivate: [PermissionsGuard]
	},
	{
		path: 'compare-players',
		loadChildren: () => import('./compare-players/compare-players.module').then(m => m.ComparePlayersModule),
		canActivate: [PermissionsGuard]
	},
	{
		path: 'scouting',
		loadChildren: () => import('./scouting/scouting.module').then(m => m.ScoutingModule),
		canActivate: [PermissionsGuard]
	},
	{
		path: 'transfers',
		loadChildren: () => import('../transfers/transfers.module').then(m => m.TransfersModule),
		canActivate: [PermissionsGuard]
	}
];

import { Routes } from '@angular/router';
import { ManagerComponent } from './manager.component';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';

export const managerRoutes: Routes = [
	{
		path: '',
		component: ManagerComponent
	},
	{
		path: 'attendances',
		loadChildren: () => import('./attendances/attendances.module').then(m => m.AttendancesModule),
		canActivate: [PermissionsGuard]
	},
	{
		path: 'tactics',
		loadChildren: () => import('./tactics/tactics.module').then(m => m.TacticsModule),
		canActivate: [PermissionsGuard]
	},
	{
		path: 'planning',
		loadChildren: () => import('./planning/planning.module').then(m => m.PlanningModule),
		canActivate: [PermissionsGuard]
	},
	{
		path: 'drills',
		loadChildren: () => import('./drills/drills.module').then(m => m.DrillsModule),
		canActivate: [PermissionsGuard]
	},
	{
		path: 'video-gallery',
		loadChildren: () =>
			import('./video-gallery-container/video-gallery-container.module').then(m => m.VideoGalleryContainerModule),
		canActivate: [PermissionsGuard]
	}
];

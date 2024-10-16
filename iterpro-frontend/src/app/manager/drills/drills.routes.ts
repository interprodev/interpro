import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@iterpro/shared/utils/common-utils';
import { DrillsComponent } from './drills.component';

export const drillsRoutes: Route[] = [
	{
		path: '',
		component: DrillsComponent,
		canDeactivate: [unsavedChangesGuard]
	},
	{
		path: 'stats',
		loadComponent: () => import('@iterpro/manager/drills/stats/stats-shell').then(m => m.DrillsStatsShellComponent)
	},
	{
		path: 'canvas',
		loadChildren: () => import('./drills-canvas/drills-canvas.module').then(m => m.DrillsCanvasModule)
	}
];

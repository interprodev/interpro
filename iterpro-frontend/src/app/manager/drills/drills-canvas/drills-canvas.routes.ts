import { Routes } from '@angular/router';
import { unsavedChangesGuardNew } from '@iterpro/shared/utils/common-utils';
import { clonedCanvasResolver } from './resolvers/cloned-canvas.resolver';
import { drillsCanvasResolver } from './resolvers/drills-canvas.resolver';

export const drillsCanvasRoutes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		loadComponent: () => import('./drills-canvas.component').then(c => c.DrillsTemplatesComponent)
	},
	{
		path: 'new',
		loadComponent: () =>
			import('./components/drills-canvas-edit/drills-canvas-edit.component').then(m => m.DrillsCanvasEditComponent),
		resolve: { clonedCanvas: clonedCanvasResolver },
		canDeactivate: [unsavedChangesGuardNew]
	},
	{
		path: ':id',
		loadComponent: () =>
			import('./components/drills-canvas-edit/drills-canvas-edit.component').then(m => m.DrillsCanvasEditComponent),
		resolve: { drillCanvas: drillsCanvasResolver },
		canDeactivate: [unsavedChangesGuardNew]
	}
];

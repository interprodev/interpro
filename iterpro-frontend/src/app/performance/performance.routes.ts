import { Routes } from '@angular/router';
import { PerformanceComponent } from './performance.component';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';

export const performanceRoutes: Routes = [
	{
		path: '',
		component: PerformanceComponent
	},
	{
		path: 'session-analysis',
		loadChildren: () => import('./session-analysis/session-analysis.module').then(m => m.SessionAnalysisModule),
		canActivate: [PermissionsGuard]
	},
	{
		path: 'workload-analysis',
		loadChildren: () => import('./workload-analysis/workload-analysis.module').then(m => m.WorkloadAnalysisModule),
		canActivate: [PermissionsGuard]
	},
	{
		path: 'test-analysis',
		loadChildren: () => import('./test-analysis/test-analysis.module').then(m => m.TestAnalysisModule),
		canActivate: [PermissionsGuard]
	},
	{
		path: 'assessments',
		loadChildren: () => import('./assessments/assessments.module').then(m => m.AssessmentsModule),
		canActivate: [PermissionsGuard]
	},
	{
		path: 'readiness',
		loadChildren: () => import('./readiness/readiness.module').then(m => m.ReadinessModule),
		canActivate: [PermissionsGuard]
	}
];

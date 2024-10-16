import { Routes } from '@angular/router';
import { authGuard, temporaryPasswordGuard } from '@iterpro/shared/data-access/auth';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';
import { unsavedChangesGuard } from '@iterpro/shared/utils/common-utils';
import { TestAnalysisComponent } from '../performance/test-analysis/test-analysis.component';
import { ExaminationComponent } from './examination/examination.component';
import { InfirmaryComponent } from './infirmary/infirmary.component';
import { PreventionComponent } from './maintenance/prevention/prevention.component';
import { MedicalStatisticsComponent } from './medical-statistics/medical-statistics.component';
import { MedicalComponent } from './medical.component';

export const medicalRoutes: Routes = [
	{
		path: '',
		component: MedicalComponent,
		canActivate: [authGuard]
	},
	{
		path: 'examination',
		component: ExaminationComponent,
		canActivate: [authGuard, temporaryPasswordGuard, PermissionsGuard],
		canDeactivate: [unsavedChangesGuard]
	},
	{
		path: 'maintenance',
		canActivate: [authGuard, temporaryPasswordGuard, PermissionsGuard],
		component: PreventionComponent,
		canDeactivate: [unsavedChangesGuard]
	},
	{
		path: 'infirmary',
		component: InfirmaryComponent,
		canActivate: [authGuard, temporaryPasswordGuard, PermissionsGuard],
		canDeactivate: [unsavedChangesGuard]
	},
	{
		path: 'medical-statistics',
		canActivate: [authGuard, temporaryPasswordGuard, PermissionsGuard],
		component: MedicalStatisticsComponent,
		canDeactivate: [unsavedChangesGuard]
	},
	{
		path: 'medical-test-analysis',
		canActivate: [authGuard, temporaryPasswordGuard, PermissionsGuard],
		component: TestAnalysisComponent
	}
];

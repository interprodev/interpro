import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceCashFlowComponent } from './finance-cash-flow.component';
import { Route, RouterModule } from '@angular/router';
import { authGuard, temporaryPasswordGuard } from '@iterpro/shared/data-access/auth';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';
import { unsavedChangesGuard } from '@iterpro/shared/utils/common-utils';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ReportDownloadComponent } from '@iterpro/shared/ui/components';
import { MaskDirective } from '@iterpro/shared/ui/directives';

const routes: Route[] = [
	{
		path: '',
		component: FinanceCashFlowComponent,
		canActivate: [authGuard, temporaryPasswordGuard, PermissionsGuard],
		canDeactivate: [unsavedChangesGuard]
	}
];

@NgModule({
	imports: [CommonModule, PrimeNgModule, RouterModule.forChild(routes), TranslateModule, FormsModule, ReportDownloadComponent, MaskDirective],
	declarations: [FinanceCashFlowComponent]
})
export class FinanceCashFlowModule {}

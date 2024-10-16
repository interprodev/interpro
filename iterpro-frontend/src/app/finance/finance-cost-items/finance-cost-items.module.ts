import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { Route, RouterModule } from '@angular/router';
import { authGuard, temporaryPasswordGuard } from '@iterpro/shared/data-access/auth';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';
import { unsavedChangesGuard } from '@iterpro/shared/utils/common-utils';
import { FinanceCostItemsComponent } from './finance-cost-items.component';
import { TabViewModule } from 'primeng/tabview';
import { CostItemsTableComponent } from '../../shared/cost-items/cost-items-table/cost-items-table.component';

const routes: Route[] = [
	{
		path: '',
		component: FinanceCostItemsComponent,
		canActivate: [authGuard, temporaryPasswordGuard, PermissionsGuard],
		canDeactivate: [unsavedChangesGuard]
	}
];

@NgModule({
	imports: [RouterModule.forChild(routes), TabViewModule, TranslateModule, CommonModule, CostItemsTableComponent],
	declarations: [FinanceCostItemsComponent]
})
export class FinanceCostItemsModule {}

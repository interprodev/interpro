import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { authGuard, temporaryPasswordGuard } from '@iterpro/shared/data-access/auth';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';
import { unsavedChangesGuard } from '@iterpro/shared/utils/common-utils';
import { FinanceOverviewComponent } from './finance-overview.component';
import { FinancialDashboardPlayerComponent } from './financial-dashboard/financial-dashboard-player/financial-dashboard-player.component';
import { FinancialDashboardComponent } from './financial-dashboard/financial-dashboard.component';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { FormsModule } from '@angular/forms';
import { FinancialAnalysisModule } from './financial-analysis/financial-analysis.module';
import { TranslateModule } from '@ngx-translate/core';
import { ReportDownloadComponent } from '@iterpro/shared/ui/components';
import { PlayerDropdownComponent } from '../../shared/players/player-dropdown/player-dropdown.component';
import { ShortNumberPipe, ToLocalPipe } from '@iterpro/shared/ui/pipes';
import { BlockUIModule } from 'ng-block-ui';

const routes: Route[] = [
	{
		path: '',
		component: FinanceOverviewComponent,
		canActivate: [authGuard, temporaryPasswordGuard, PermissionsGuard],
		canDeactivate: [unsavedChangesGuard]
	}
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		PrimeNgModule,
		FormsModule,
		FinancialAnalysisModule,
		TranslateModule,
		ReportDownloadComponent,
		PlayerDropdownComponent,
		ShortNumberPipe,
		BlockUIModule,
		ToLocalPipe
	],
	declarations: [FinanceOverviewComponent, FinancialDashboardComponent, FinancialDashboardPlayerComponent]
})
export class FinanceOverviewModule {}

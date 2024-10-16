import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { MultipleFileUploadComponent } from '@iterpro/shared/feature-components';
import { ReportDownloadComponent, TableStatsComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { FormatDateUserSettingPipe, SessionGDPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { ChangeSeasonComponent } from './../../shared/change-season/change-season.component';
import { DrillsBreakdownComponent } from './drills-breakdown/drills-breakdown.component';
import { PeriodBreakdownComponent } from './period-breakdown/period-breakdown.component';
import { PlayerComparisonComponent } from './player-comparison/player-comparison.component';
import { SessionSummaryComponent } from './session-summary/session-summary.component';
import { StressBalanceComponent } from './stress-balance/stress-balance.component';
import { WorkloadAnalysisComponent } from './workload-analysis.component';
import { WorkloadDistributionComponent } from './workload-distribution/workload-distribution.component';
import { SessionAnalysisStoreModule } from 'src/app/+state/session-analysis-store';

const routes: Route[] = [
	{
		path: '',
		component: WorkloadAnalysisComponent
	}
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		PrimeNgModule,
		FormsModule,
		TranslateModule,
		ReportDownloadComponent,
		ChangeSeasonComponent,
		MultipleFileUploadComponent,
		TableStatsComponent,
		FormatDateUserSettingPipe,
		SessionGDPipe,
		SessionAnalysisStoreModule
	],
	declarations: [
		WorkloadAnalysisComponent,
		SessionSummaryComponent,
		PlayerComparisonComponent,
		DrillsBreakdownComponent,
		PeriodBreakdownComponent,
		WorkloadDistributionComponent,
		StressBalanceComponent
	],
	providers: [SessionGDPipe]
})
export class WorkloadAnalysisModule {}

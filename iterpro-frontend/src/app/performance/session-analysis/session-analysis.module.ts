import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { MultipleFileUploadComponent } from '@iterpro/shared/feature-components';
import { ReportDownloadComponent, TableStatsComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { FormatDateUserSettingPipe, SessionGDPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { SessionAnalysisStoreModule } from './../../+state/session-analysis-store';
import { PlayerDropdownComponent } from './../../shared/players/player-dropdown/player-dropdown.component';
import { AdvancedIndividualComponent } from './advanced-individual/advanced-individual.component';
import { DrillsBreakdownComponent } from './drills-breakdown/drills-breakdown.component';
import { PDFMetricsComponent } from './pdf-metrics/pdf-metrics.component';
import { PeriodFiltersComponent } from './period-filters/period-filters.component';
import { PeriodTotalComponent } from './period-total/period-total.component';
import { PeriodTrendComponent } from './period-trend/period-trend.component';
import { SessionAnalysisChartComponent } from './session-analysis-chart/session-analysis-chart.component';
import { SessionAnalysisComponent } from './session-analysis.component';
import { SessionFiltersComponent } from './session-filters/session-filters.component';
import { SessionIndividualComponent } from './session-individual/session-individual.component';
import { SessionProfileComponent } from './session-profile/session-profile.component';
import { SessionSummaryComponent } from './session-summary/session-summary.component';
import { SessionTeamComponent } from './session-team/session-team.component';

const routes: Route[] = [
	{
		path: '',
		component: SessionAnalysisComponent
	}
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		FormsModule,
		PrimeNgModule,
		SessionAnalysisStoreModule,
		TranslateModule,
		TableStatsComponent,
		ReportDownloadComponent,
		MultipleFileUploadComponent,
		PlayerDropdownComponent,
		FormatDateUserSettingPipe,
		SessionGDPipe
	],
	declarations: [
		SessionAnalysisComponent,
		SessionFiltersComponent,
		SessionTeamComponent,
		SessionAnalysisChartComponent,
		SessionSummaryComponent,
		SessionProfileComponent,
		SessionIndividualComponent,
		PDFMetricsComponent,
		AdvancedIndividualComponent,
		DrillsBreakdownComponent,
		PeriodFiltersComponent,
		PeriodTotalComponent,
		PeriodTrendComponent
	]
})
export class SessionAnalysisModule {}

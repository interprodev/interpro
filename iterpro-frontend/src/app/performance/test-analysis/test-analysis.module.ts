import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { ReportDownloadComponent, TableStatsComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { TestAnalysisComparisonComponent } from './test-analysis-comparison/test-analysis-comparison.component';
import { TestAnalysisPeriodComponent } from './test-analysis-period/test-analysis-period.component';
import { TestAnalysisComponent } from './test-analysis.component';

const routes: Route[] = [
	{
		path: '',
		component: TestAnalysisComponent
	}
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		FormsModule,
		PrimeNgModule,
		TranslateModule,
		ReportDownloadComponent,
		TableStatsComponent,
		FormatDateUserSettingPipe
	],
	declarations: [TestAnalysisComponent, TestAnalysisPeriodComponent, TestAnalysisComparisonComponent]
})
export class TestAnalysisModule {}

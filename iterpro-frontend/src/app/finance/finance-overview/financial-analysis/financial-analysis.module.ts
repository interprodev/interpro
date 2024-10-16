import { NgModule } from '@angular/core';
import { FinancialAnalysisCurrentComponent } from './financial-analysis-current/financial-analysis-current.component';
import { FinancialAnalysisComponent } from './financial-analysis.component';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { NgClass, NgForOf, NgIf, NgStyle } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ReportDownloadComponent, TableStatsComponent } from '@iterpro/shared/ui/components';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';

@NgModule({
	imports: [PrimeNgModule, NgClass, TranslateModule, FormsModule, ReportDownloadComponent, TableStatsComponent, NgForOf, ShortNumberPipe, NgStyle, NgIf],
	exports: [FinancialAnalysisComponent],
	declarations: [FinancialAnalysisComponent, FinancialAnalysisCurrentComponent]
})
export class FinancialAnalysisModule {}

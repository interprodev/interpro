import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportDownloadComponent, TableStatsComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';
import { MedicalStatisticsComponent } from './medical-statistics.component';

@NgModule({
	imports: [CommonModule, FormsModule, TranslateModule, PrimeNgModule, TableStatsComponent, ReportDownloadComponent],
	exports: [MedicalStatisticsComponent],
	declarations: [MedicalStatisticsComponent]
})
export class MedicalStatisticsModule {}

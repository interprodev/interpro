import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LaunchpadComponent } from '@iterpro/shared/ui/components';
import { CustomerNamePipe, SelectItemLabelPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { MedicalEventLabelsService, TreatmentsOfTheDayTooltipPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { ExaminationModule } from './examination/examination.module';
import { InfirmaryModule } from './infirmary/infirmary.module';
import { DetailsReportService } from './infirmary/injury/injury-details/injury-details-report.service';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { MedicalStatisticsModule } from './medical-statistics/medical-statistics.module';
import { MedicalComponent } from './medical.component';
import { medicalRoutes } from './medical.routes';
import { OsiicsDialogComponent } from './ui/components/osics-dialog/osiics-dialog.component';
import { TreatmentsTooltipPipe } from '../shared/treatments/pipes/treatments-tooltip.pipe';
import { TreatmentCategoriesTooltipPipe } from '../shared/treatments/pipes/treatment-categories-tooltip.pipe';
import { TreatmentCompletePipe } from '../shared/treatments/pipes/treatment-complete.pipe';
import { MedicationLabelPipe } from '../shared/treatments/pipes/medication-label.pipe';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(medicalRoutes),
		FormsModule,
		PrimeNgModule,
		TranslateModule,
		LaunchpadComponent,
		ExaminationModule,
		OsiicsDialogComponent,
		InfirmaryModule,
		MedicalStatisticsModule,
		MaintenanceModule
	],
	declarations: [MedicalComponent],
	providers: [
		DetailsReportService,
		MedicalEventLabelsService,
		TreatmentsOfTheDayTooltipPipe,
		CustomerNamePipe,
		TreatmentsTooltipPipe,
		TreatmentCategoriesTooltipPipe,
		SelectItemLabelPipe,
		MedicationLabelPipe,
		TreatmentCompletePipe
	]
})
export class MedicalModule {}

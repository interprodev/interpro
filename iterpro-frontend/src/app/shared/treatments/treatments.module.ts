import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CloudUploadComponent } from '@iterpro/shared/feature-components';
import {
	ActionButtonsComponent,
	DialogFooterButtonsComponent,
	FormTimepickerComponent,
	IconModalPreviewComponent,
	ReportDownloadComponent,
	TableAttachmentComponent
} from '@iterpro/shared/ui/components';
import {
	ArrayFromNumberPipe,
	CustomerNameSelectItemPipe,
	IsIncludePipe,
	SelectItemLabelPipe
} from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AzureStoragePipe, FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { MedicalSupplementsDialogComponent } from './components/medical-supplements-dialog/medical-supplements-dialog.component';
import { MedicalTreatmentsComponent } from './components/medical-treatments/medical-treatments.component';
import { TreatmentDialogComponent } from './components/treatment-dialog/treatment-dialog.component';
import { TreatmentEditComponent } from './components/treatment-edit/treatment-edit.component';
import { TreatmentTableComponent } from './components/treatment-table/treatment-table.component';
import { MedicationLabelPipe } from './pipes/medication-label.pipe';
import { TreatmentCategoriesTooltipPipe } from './pipes/treatment-categories-tooltip.pipe';
import { TreatmentCompletePipe } from './pipes/treatment-complete.pipe';
import { TreatmentInjuryLabelPipe } from './pipes/treatment-injury-label.pipe';
import { TreatmentTypeLabelPipe } from './pipes/treatment-type-label.pipe';
import { TreatmentsTooltipPipe } from './pipes/treatments-tooltip.pipe';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		PrimeNgModule,
		TranslateModule,
		ReportDownloadComponent,
		FormatDateUserSettingPipe,
		CustomerNameSelectItemPipe,
		SelectItemLabelPipe,
		ReactiveFormsModule,
		EditorComponent,
		TableAttachmentComponent,
		ArrayFromNumberPipe,
		IsIncludePipe,
		CloudUploadComponent,
		IconModalPreviewComponent,
		AzureStoragePipe,
		FormTimepickerComponent,
		ActionButtonsComponent,
		DialogFooterButtonsComponent
	],
	declarations: [
		TreatmentEditComponent,
		TreatmentTableComponent,
		TreatmentDialogComponent,
		MedicalTreatmentsComponent,
		MedicalSupplementsDialogComponent,
		MedicationLabelPipe,
		TreatmentCategoriesTooltipPipe,
		TreatmentCompletePipe,
		TreatmentInjuryLabelPipe,
		TreatmentTypeLabelPipe,
		TreatmentsTooltipPipe
	],
	exports: [TreatmentDialogComponent, MedicalTreatmentsComponent]
})
export class TreatmentsModule {}

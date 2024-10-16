import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { FileUploaderComponent, MultipleFileUploadComponent } from '@iterpro/shared/feature-components';
import { BodyChartComponent, CsvUploadDownloadComponent, ReportDownloadComponent } from '@iterpro/shared/ui/components';
import { CapitalizePipe, CustomerNamePipe, MarkedPipe, SelectItemLabelPipe, SortPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AzureStoragePipe,
	CustomTreatmentService,
	EventToHtmlService,
	MedicalEventLabelsService,
	unsavedChangesGuard
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { BlockUIModule } from 'ng-block-ui';
import { InjuryIconComponent } from '../../shared/injury-icon/injury-icon.component';
import { PlayerDropdownComponent } from '../../shared/players/player-dropdown/player-dropdown.component';
import { TreatmentsModule } from '../../shared/treatments/treatments.module';
import { CustomRecurrenceComponent } from './custom-recurrence/custom-recurrence.component';
import { EventViewerModule } from './event-viewer/event-viewer.module';
import { PlanViewerComponent } from './plan-viewer/plan-viewer.component';
import { PlanningEventFilterComponent } from './planning-event-filter/planning-event-filter';
import { PlanningComponent } from './planning.component';
import {
	CalendarTimeRangeSettingComponent
} from '../../shared/calendar-time-range-setting/calendar-time-range-setting.component';
import { MedicationLabelPipe } from 'src/app/shared/treatments/pipes/medication-label.pipe';
import { TreatmentsTooltipPipe } from '../../shared/treatments/pipes/treatments-tooltip.pipe';
import { TreatmentCompletePipe } from 'src/app/shared/treatments/pipes/treatment-complete.pipe';
import { TreatmentCategoriesTooltipPipe } from '../../shared/treatments/pipes/treatment-categories-tooltip.pipe';

const routes: Route[] = [
	{
		path: '',
		component: PlanningComponent,
		canDeactivate: [unsavedChangesGuard]
	}
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		BlockUIModule,
		FormsModule,
		PrimeNgModule,
		TranslateModule,
		FullCalendarModule,
		EventViewerModule,
		AzureStoragePipe,
		InjuryIconComponent,
		ReportDownloadComponent,
		PlayerDropdownComponent,
		BodyChartComponent,
		FileUploaderComponent,
		MultipleFileUploadComponent,
		TreatmentsModule,
		CustomerNamePipe,
		MarkedPipe,
		CapitalizePipe,
		SortPipe,
		CalendarTimeRangeSettingComponent,
		CsvUploadDownloadComponent
	],
	declarations: [CustomRecurrenceComponent, PlanningComponent, PlanViewerComponent, PlanningEventFilterComponent],
	providers: [
		EventToHtmlService,
		MedicalEventLabelsService,
		CustomTreatmentService,
		CustomerNamePipe,
		SelectItemLabelPipe,
		MedicationLabelPipe,
		TreatmentsTooltipPipe,
		TreatmentCompletePipe,
		TreatmentCategoriesTooltipPipe
	]
})
export class PlanningModule {}

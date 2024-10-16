import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import {
	MultipleCloudUploadComponent,
	MultipleFileUploadComponent,
	SearchDropdownComponent
} from '@iterpro/shared/feature-components';
import {
	ActionButtonsComponent,
	BodyChartComponent,
	IconButtonComponent,
	PictureComponent,
	PlayerFlagComponent,
	PlayerProviderWidgetComponent,
	RedirectIconComponent,
	ReportDownloadComponent,
	TableAttachmentComponent,
	TableColumnFilterComponent,
	TimepickerComponent
} from '@iterpro/shared/ui/components';
import { ClickOutsideDirective, TeleportToDirective } from '@iterpro/shared/ui/directives';
import { AgePipe, ArrayFromNumberPipe, CustomerNamePipe, PlayersPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AzureStoragePipe,
	CustomTreatmentService,
	EventToHtmlService,
	FormatDateUserSettingPipe,
	TreatmentsOfTheDayTooltipPipe
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { BlockUIModule } from 'ng-block-ui';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { EventViewerModule } from '../../manager/planning/event-viewer/event-viewer.module';
import { CalendarTimeRangeSettingComponent } from '../../shared/calendar-time-range-setting/calendar-time-range-setting.component';
import { ChangeSeasonComponent } from '../../shared/change-season/change-season.component';
import { InjuryIconComponent } from '../../shared/injury-icon/injury-icon.component';
import { PlayerCardComponent } from '../../shared/players/player-card/player-card.component';
import { TableFilterTemplateComponent } from '../../shared/table-filter-template/table-filter-template.component';
import { TableFilterComponent } from '../../shared/table-filter/table-filter.component';
import { TreatmentsModule } from '../../shared/treatments/treatments.module';
import { PreventionAnamnesysComponent } from './prevention-anamnesys/prevention-anamnesys.component';
import { PreventionAssessmentComponent } from './prevention-assessment/prevention-assessment.component';
import { PreventionDiaryComponent } from './prevention-diary/prevention-diary.component';
import { PreventionPlayerComponent } from './prevention-player/prevention-player.component';
import { PreventionScreeningComponent } from './prevention-screening/prevention-screening.component';
import { PreventionComponent } from './prevention/prevention.component';
import { ChronicFormComponent } from './ui/components/chronic-form/chronic-form.component';
import { MaintenanceCalendarComponent } from './ui/components/maintenance-calendar/maintenance-calendar.component';
import { PreventionTableComponent } from './ui/components/prevention-table-view/prevention-table-view.component';
import { ChronicInjuriesTooltipPipe } from './ui/pipes/chronicInjuriesTooltip.pipe';
import { ScreeningExpirationPipe } from './ui/pipes/screening-expiration.pipe';
import { TestInstancesTooltip } from './ui/pipes/testInstancesTooltip.pipe';
import { ToSelectItemPipe } from './ui/pipes/toSelectItem.pipe';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		PrimeNgModule,
		TranslateModule,
		BlockUIModule,
		FullCalendarModule,
		RoundProgressModule,
		EventViewerModule,
		MultipleCloudUploadComponent,
		ReportDownloadComponent,
		PlayerCardComponent,
		TableFilterComponent,
		TableColumnFilterComponent,
		TableFilterTemplateComponent,
		PictureComponent,
		BodyChartComponent,
		MultipleFileUploadComponent,
		SearchDropdownComponent,
		PlayerFlagComponent,
		PlayersPipe,
		FormatDateUserSettingPipe,
		TreatmentsModule,
		AzureStoragePipe,
		AgePipe,
		ClickOutsideDirective,
		TeleportToDirective,
		InjuryIconComponent,
		TableAttachmentComponent,
		CustomerNamePipe,
		InputTextareaModule,
		CalendarTimeRangeSettingComponent,
		TimepickerComponent,
		IconButtonComponent,
		ActionButtonsComponent,
		ArrayFromNumberPipe,
		ChangeSeasonComponent,
		PlayerProviderWidgetComponent,
		RedirectIconComponent
	],
	declarations: [
		PreventionComponent,
		PreventionDiaryComponent,
		PreventionPlayerComponent,
		PreventionScreeningComponent,
		PreventionAnamnesysComponent,
		PreventionAssessmentComponent,
		PreventionTableComponent,
		MaintenanceCalendarComponent,
		ChronicFormComponent,
		ScreeningExpirationPipe,
		ChronicInjuriesTooltipPipe,
		TestInstancesTooltip,
		ToSelectItemPipe,
		TreatmentsOfTheDayTooltipPipe
	],
	providers: [CustomTreatmentService, AgePipe, PlayersPipe, EventToHtmlService]
})
export class MaintenanceModule {}

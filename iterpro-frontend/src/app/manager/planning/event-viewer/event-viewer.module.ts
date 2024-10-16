import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
	CloudUploadComponent,
	FileUploaderComponent,
	MultipleFileUploadComponent
} from '@iterpro/shared/feature-components';
import {
	AttachmentsComponent,
	BodyChartComponent,
	CustomReportTemplateComponent,
	IconButtonComponent,
	MatchDetailsComponent,
	PictureComponent,
	RedirectIconComponent,
	ReportDownloadComponent,
	SkeletonGridComponent,
	TableAttachmentComponent,
	ThirdPartyPlayersClubGameComponent,
	ThirdPartyTeamSeekerComponent,
	TimepickerComponent
} from '@iterpro/shared/ui/components';
import {
	CapitalizePipe,
	CustomerNamePipe,
	FilterByIncludesPipe,
	MarkedPipe,
	OsicsPipe,
	PlayersStatsFilterByPositionPipe,
	PlayersStatsEnabledPipe,
	SelectItemLabelPipe,
	SelectItemPipe,
	SortPipe,
	PlayersStatsAreAllCheckedPipe,
	CustomersToSelectItemsPipe,
	LastAuthorPipe
} from '@iterpro/shared/ui/pipes';
import { AutoCompleteComponent, PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AzureStoragePipe,
	FormatDateUserSettingPipe,
	FormService,
	SchemaConversionService,
	VideoService
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { InjuryIconComponent } from '../../../shared/injury-icon/injury-icon.component';
import { TreatmentsModule } from '../../../shared/treatments/treatments.module';
import { EventMedicalDetailsComponent } from './event-medical-details/event-medical-details.component';
import { EventPlayerComponent } from './event-player/event-player.component';
import { EventStaffComponent } from './event-staff/event-staff.component';
import { EventViewerComponent } from './event-viewer.component';
import { DrillListFilterPipe } from './pipes/drill-list-filter.pipe';
import { DrillThemesFilterPipe } from './pipes/drill-themes-filter.pipe';
import { PlannedDrillFilterPipe } from './pipes/planned-drill-filter.pipe';
import { BlockUIModule } from 'ng-block-ui';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { DrillsSearchComponent } from '@iterpro/manager/drills/ui';
import { MatchDetailsService } from './services/match-details.service';
import { PlayerDropdownComponent } from '../../../shared/players/player-dropdown/player-dropdown.component';
import { BadgeModule } from 'primeng/badge';
import {
	PerformanceReportAttachmentsComponent,
	PerformanceReportAttachmentsHeaderComponent,
	PerformanceReportHistoryComponent,
	PlayerPerformanceReportComponent
} from '@iterpro/players/shared';
import { SelectablePlayersAreAllCheckedPipe } from './pipes/selectable-players-are-all-checked.pipe';
import { PlayerIsSelectedForGamePipe } from './pipes/player-is-selected-for-game.pipe';
import { VideoModule } from '../../shared/ui/video/video.module';
import { PlayerReportVideosPipe } from './pipes/player-report-videos.pipe';
import { PlayerReportDocumentsPipe } from './pipes/player-report-documents.pipe';
import { PlayersModifiedTrainingPipe } from './pipes/players-modified-training.pipe';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		TranslateModule,
		PrimeNgModule,
		TreatmentsModule,
		InjuryIconComponent,
		MultipleFileUploadComponent,
		AutoCompleteComponent,
		ThirdPartyTeamSeekerComponent,
		ThirdPartyPlayersClubGameComponent,
		TableAttachmentComponent,
		FileUploaderComponent,
		AzureStoragePipe,
		CustomerNamePipe,
		MarkedPipe,
		SortPipe,
		BlockUIModule,
		CapitalizePipe,
		AutoCompleteModule,
		SelectItemPipe,
		SelectItemLabelPipe,
		RedirectIconComponent,
		FilterByIncludesPipe,
		EditorComponent,
		ReportDownloadComponent,
		DrillsSearchComponent,
		MatchDetailsComponent,
		PlayerDropdownComponent,
		FormatDateUserSettingPipe,
		OsicsPipe,
		BodyChartComponent,
		TimepickerComponent,
		IconButtonComponent,
		ReactiveFormsModule,
		PlayersStatsEnabledPipe,
		PictureComponent,
		PlayersStatsFilterByPositionPipe,
		PlayersStatsAreAllCheckedPipe,
		CustomReportTemplateComponent,
		BadgeModule,
		PlayerPerformanceReportComponent,
		CustomersToSelectItemsPipe,
		SkeletonGridComponent,
		VideoModule,
		LastAuthorPipe,
		PerformanceReportHistoryComponent,
		PerformanceReportAttachmentsComponent,
		PerformanceReportAttachmentsHeaderComponent,
		CloudUploadComponent,
		AttachmentsComponent
	],
	exports: [EventViewerComponent],
	declarations: [
		EventViewerComponent,
		EventMedicalDetailsComponent,
		EventStaffComponent,
		EventPlayerComponent,
		PlannedDrillFilterPipe,
		DrillListFilterPipe,
		DrillThemesFilterPipe,
		SelectablePlayersAreAllCheckedPipe,
		PlayerIsSelectedForGamePipe,
		PlayerReportVideosPipe,
		PlayerReportDocumentsPipe,
		PlayersModifiedTrainingPipe
	],
	providers: [
		MatchDetailsService,
		DrillListFilterPipe,
		DrillThemesFilterPipe,
		PlayersStatsEnabledPipe,
		PlayersStatsFilterByPositionPipe,
		PlayerReportVideosPipe,
		PlayerReportVideosPipe,
		SchemaConversionService,
		FormService,
		VideoService
	]
})
export class EventViewerModule {}

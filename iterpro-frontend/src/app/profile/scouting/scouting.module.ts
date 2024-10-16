import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { ScoutingEventShellComponent } from '@iterpro/players/scouting/event/shell';
import {
	CloudUploadComponent,
	MultipleFileUploadComponent,
	PlayerReportComponent,
	PlayerTipssScoutingHeaderComponent,
	SearchDropdownComponent,
	ThirdPartyPlayerSearchComponent
} from '@iterpro/shared/feature-components';
import {
	ActionButtonsComponent,
	CsvUploadDownloadComponent,
	EditorDialogComponent,
	IconButtonComponent,
	IconModalPreviewComponent,
	PictureComponent,
	PlayerFlagComponent,
	PlayerProviderWidgetComponent,
	PriceRangeComponent,
	ReportDownloadComponent,
	RoleCardComponent,
	SkeletonTableComponent,
	StarSvgComponent,
	TableColumnFilterComponent,
	TacticBoardComponent
} from '@iterpro/shared/ui/components';
import { ClickOutsideDirective, TeleportToDirective } from '@iterpro/shared/ui/directives';
import {
	AgePipe,
	ArrayFromNumberPipe,
	CapitalizePipe,
	CustomerNamePipe,
	HtmlToStringPipe,
	PlayersNotArchivedPipe,
	PlayersPipe,
	SelectItemLabelPipe
} from '@iterpro/shared/ui/pipes';
import { PlusDropdownComponent, PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AzureStoragePipe,
	CustomTreatmentService,
	EventToHtmlService,
	FormService,
	FormatDateUserSettingPipe,
	MedicalEventLabelsService,
	SchemaConversionService,
	unsavedChangesGuard
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { BlockUIModule } from 'ng-block-ui';
import { ScrollerModule } from 'primeng/scroller';
import { CalendarTimeRangeSettingComponent } from '../../shared/calendar-time-range-setting/calendar-time-range-setting.component';
import { CommentThreadedComponent } from '../../shared/comment/comment-threaded/comment-threaded.component';
import { PlayerCardImageComponent } from '../../shared/players/player-card-image/player-card-image.component';
import { PlayerCardComponent } from '../../shared/players/player-card/player-card.component';
import { PlayerDropdownComponent } from '../../shared/players/player-dropdown/player-dropdown.component';
import { TableFilterTemplateComponent } from '../../shared/table-filter-template/table-filter-template.component';
import { TableFilterComponent } from '../../shared/table-filter/table-filter.component';
import { ScoutingCalendarComponent } from './scouting-calendar/scouting-calendar.component';
import { ScoutingCareerComponent } from './scouting-career/scouting-career.component';
import { ScoutingContractComponent } from './scouting-contract/scouting-contract.component';
import { ScoutingDetailsComponent } from './scouting-details/scouting-details.component';
import { ScoutingEventMatchStatsComponent } from './scouting-event-match-stats/scouting-event-match-stats.component';
import { ScoutingFieldComponent } from './scouting-field/scouting-field.component';
import { ScoutingShortlistFiltersComponent } from './scouting-field/scouting-shortlist-filters/scouting-shorlist-filters.component';
import { ScoutingShortlistTableComponent } from './scouting-field/scouting-shortlist-table/scouting-shortlist-table.component';
import { ScoutingShortlistComponent } from './scouting-field/scouting-shortlist/scouting-shortlist.component';
import { FilterHideInTablePipe } from './scouting-game-reports-table/pipes/filter-hide-in-table.pipe';
import { ScoutingGameReportsTableComponent } from './scouting-game-reports-table/scouting-game-reports-table.component';
import { ScoutingNewPlayerDialogComponent } from './scouting-new-player-dialog/scouting-new-player-dialog.component';
import { ScoutingNotesComponent } from './scouting-notes/scouting-notes.component';
import { ScoutingPlayerAttributeHeaderComponent } from './scouting-player-attribute-header/scouting-player-attribute-header.component';
import { ScoutingPlayerGamesComponent } from './scouting-player-games/scouting-player-games.component';
import { ScoutingPlayerHeaderComponent } from './scouting-player-header/scouting-player-header.component';
import { ScoutingPlayerComponent } from './scouting-player/scouting-player.component';
import { ScoutingTableComponent } from './scouting-table-view/scouting-table-view.component';
import { ScoutingComponent } from './scouting.component';
import { ToTransferDialogComponent } from './to-transfer-dialog/to-transfer-dialog.component';

const routes: Route[] = [
	{
		path: '',
		component: ScoutingComponent,
		canDeactivate: [unsavedChangesGuard]
	}
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		PrimeNgModule,
		FormsModule,
		TranslateModule,
		FullCalendarModule,
		RoundProgressModule,
		BlockUIModule,
		PlayerProviderWidgetComponent,
		PriceRangeComponent,
		TacticBoardComponent,
		EditorDialogComponent,
		CommentThreadedComponent,
		PlayerCardComponent,
		PlayerCardImageComponent,
		TableFilterComponent,
		TableColumnFilterComponent,
		AzureStoragePipe,
		ArrayFromNumberPipe,
		PlayersNotArchivedPipe,
		PlayersPipe,
		FormatDateUserSettingPipe,
		ClickOutsideDirective,
		TeleportToDirective,
		TableFilterTemplateComponent,
		CsvUploadDownloadComponent,
		ReportDownloadComponent,
		SearchDropdownComponent,
		CapitalizePipe,
		ThirdPartyPlayerSearchComponent,
		IconModalPreviewComponent,
		PictureComponent,
		PlayerFlagComponent,
		PlusDropdownComponent,
		MultipleFileUploadComponent,
		PlayerReportComponent,
		PlayerTipssScoutingHeaderComponent,
		CloudUploadComponent,
		CustomerNamePipe,
		SelectItemLabelPipe,
		ScrollerModule,
		CalendarTimeRangeSettingComponent,
		PlayerDropdownComponent,
		ScoutingEventShellComponent,
		IconButtonComponent,
		HtmlToStringPipe,
		RoleCardComponent,
		StarSvgComponent,
		SkeletonTableComponent,
		ActionButtonsComponent
	],
	declarations: [
		ScoutingComponent,
		ScoutingCalendarComponent,
		ScoutingCareerComponent,
		ScoutingContractComponent,
		ScoutingDetailsComponent,
		ScoutingEventMatchStatsComponent,
		ScoutingFieldComponent,
		ScoutingShortlistComponent,
		ScoutingShortlistFiltersComponent,
		ScoutingShortlistTableComponent,
		ScoutingGameReportsTableComponent,
		ScoutingNewPlayerDialogComponent,
		ScoutingNotesComponent,
		ScoutingPlayerComponent,
		ScoutingPlayerAttributeHeaderComponent,
		ScoutingPlayerGamesComponent,
		ScoutingPlayerHeaderComponent,
		ScoutingTableComponent,
		ToTransferDialogComponent,
		FilterHideInTablePipe
	],
	providers: [
		AgePipe,
		EventToHtmlService,
		CustomerNamePipe,
		MedicalEventLabelsService,
		CustomTreatmentService,
		SchemaConversionService,
		FormService
	]
})
export class ScoutingModule {}

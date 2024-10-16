import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SearchDropdownComponent } from '@iterpro/shared/feature-components';
import {
	BodyChartComponent, IconButtonComponent,
	PlayerFlagComponent,
	ReportDownloadComponent,
	TableAttachmentComponent,
	TableColumnFilterComponent,
	TimepickerComponent,
	PictureComponent, PlayerProviderWidgetComponent
} from '@iterpro/shared/ui/components';
import { ClickOutsideDirective } from '@iterpro/shared/ui/directives';
import {
	AgePipe,
	CapitalizePipe,
	CustomerNamePipe,
	CustomersToSelectItemsPipe,
	MarkedPipe,
	OsicsPipe
} from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AzureStoragePipe, FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { EditorModule as TinyMceEditorModule } from '@tinymce/tinymce-angular';
import { MomentModule } from 'ngx-moment';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PlayerDropdownComponent } from '../../shared/players/player-dropdown/player-dropdown.component';
import { TableFilterTemplateComponent } from '../../shared/table-filter-template/table-filter-template.component';
import { TableFilterComponent } from '../../shared/table-filter/table-filter.component';
import { TreatmentsModule } from '../../shared/treatments/treatments.module';
import { OsiicsDialogComponent } from '../ui/components/osics-dialog/osiics-dialog.component';
import { CsvDownloaderComponent } from './csv-downloader/csv-downloader.component';
import { InfirmaryComponent } from './infirmary.component';
import { InfirmaryService } from './infirmary.service';
import { InjuredListComponent } from './injured-list/injured-list.component';
import { AssessmentsListComponent } from './injury/assessments-list/assessments-list.component';
import { EditAssessmentComponent } from './injury/edit-assessment/edit-assessment.component';
import { InjuryAssessmentComponent } from './injury/injury-assessments/injury-assessments.component';
import { InjuryDetailsComponent } from './injury/injury-details/injury-details.component';
import { InjuryComponent } from './injury/injury.component';
import { KanbanItemComponent } from './kanban/kanban-item/kanban-item.component';
import { KanbanComponent } from './kanban/kanban.component';
import { PendingElementPipe } from './pipes/pending-element.pipe';
import { ReportComponent } from './report/report.component';
import {
	TeamSeasonCompetitionsComponent
} from '../../settings/settings-teams/components/settings-teams-seasons/components/team-season-competitions/team-season-competitions.component';
import {
	TeamSeasonLineupComponent
} from '../../settings/settings-teams/components/settings-teams-seasons/components/team-season-lineup/team-season-lineup.component';
import {
	TeamSeasonStaffComponent
} from '../../settings/settings-teams/components/settings-teams-seasons/components/team-season-staff/team-season-staff.component';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		PrimeNgModule,
		TranslateModule,
		TinyMceEditorModule,
		MomentModule,
		BodyChartComponent,
		ReportDownloadComponent,
		PlayerFlagComponent,
		OsiicsDialogComponent,
		TableFilterTemplateComponent,
		TableFilterComponent,
		TableColumnFilterComponent,
		PlayerDropdownComponent,
		SearchDropdownComponent,
		PictureComponent,
		FormatDateUserSettingPipe,
		AzureStoragePipe,
		OsicsPipe,
		AgePipe,
		CustomerNamePipe,
		CapitalizePipe,
		MarkedPipe,
		ClickOutsideDirective,
		TreatmentsModule,
		CustomersToSelectItemsPipe,
		TableAttachmentComponent,
		TimepickerComponent,
		InputTextareaModule,
		IconButtonComponent,
		TeamSeasonCompetitionsComponent,
		TeamSeasonLineupComponent,
		TeamSeasonStaffComponent,
		PlayerProviderWidgetComponent
	],
	declarations: [
		InfirmaryComponent,
		ReportComponent,
		KanbanComponent,
		KanbanItemComponent,
		InjuryComponent,
		InjuryDetailsComponent,
		InjuredListComponent,
		InjuryAssessmentComponent,
		AssessmentsListComponent,
		EditAssessmentComponent,
		CsvDownloaderComponent,
		PendingElementPipe
	],
	providers: [InfirmaryService]
})
export class InfirmaryModule {}

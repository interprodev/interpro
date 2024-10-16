import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import {
	CloudUploadComponent,
	PlayerReportComponent,
	SearchDropdownComponent
} from '@iterpro/shared/feature-components';
import {
	BodyChartComponent,
	IconButtonComponent,
	LegendContentComponent,
	ModalPreviewComponent,
	PlayerProviderWidgetComponent,
	ReportDownloadComponent,
	TacticBoardComponent,
	PictureComponent,
	PlayerFlagComponent
} from '@iterpro/shared/ui/components';
import { ClickOutsideDirective } from '@iterpro/shared/ui/directives';
import {
	ActiveThrFilterPipe,
	ArrayFromNumberPipe,
	CapitalizePipe,
	CustomerNamePipe,
	MarkedPipe,
	PlayersPipe
} from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AzureStoragePipe,
	FormatDateUserSettingPipe,
	VideoService,
	unsavedChangesGuard
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { BlockUIModule } from 'ng-block-ui';
import { ChangeSeasonComponent } from './../../shared/change-season/change-season.component';
import { PlayerCardComponent } from './../../shared/players/player-card/player-card.component';
import { PlayersTableComponent } from './../../shared/players/players-table/players-table.component';
import { FitnessComponent } from './fitness/fitness.component';
import { GameStatsComponent } from './game-stats/game-stats.component';
import { MyTeamComponent } from './my-team.component';
import { OverviewComponent } from './overview/overview.component';
import { PlayerComponent } from './player/player.component';
import { RobustnessComponent } from './robustness/robustness.component';
import { ThresholdsModule } from './thresholds/thresholds.module';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { RobustnessChartService } from './robustness/robustness-chart.service';

const routes: Route[] = [
	{
		path: '',
		component: MyTeamComponent,
		canDeactivate: [unsavedChangesGuard]
	}
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		BlockUIModule,
		PrimeNgModule,
		FormsModule,
		TranslateModule,
		PlayerProviderWidgetComponent,
		ChangeSeasonComponent,
		ReportDownloadComponent,
		PlayerCardComponent,
		PlayerReportComponent,
		PlayersTableComponent,
		BodyChartComponent,
		ModalPreviewComponent,
		LegendContentComponent,
		CloudUploadComponent,
		TacticBoardComponent,
		SearchDropdownComponent,
		ClickOutsideDirective,
		ThresholdsModule,
		ArrayFromNumberPipe,
		PlayersPipe,
		CapitalizePipe,
		MarkedPipe,
		FormatDateUserSettingPipe,
		AzureStoragePipe,
		EditorComponent,
		IconButtonComponent,
		PictureComponent,
		PlayerFlagComponent
	],
	declarations: [
		MyTeamComponent,
		FitnessComponent,
		GameStatsComponent,
		OverviewComponent,
		PlayerComponent,
		RobustnessComponent
	],
	providers: [PlayersPipe, CapitalizePipe, CustomerNamePipe, VideoService, ActiveThrFilterPipe, RobustnessChartService]
})
export class MyTeamModule {}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { CloudUploadComponent, MultipleFileUploadComponent } from '@iterpro/shared/feature-components';
import {
	LegendContentComponent,
	PictureComponent,
	ReportDownloadComponent,
	TacticBoardComponent
} from '@iterpro/shared/ui/components';
import { CapitalizePipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AzureStoragePipe,
	FormatDateUserSettingPipe,
	unsavedChangesGuard,
	VideoService
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { BlockUIModule } from 'ng-block-ui';
import { PlayerCardTacticComponent } from '../../shared/players/player-card-tactic/player-card-tactic.component';
import { ChangeSeasonComponent } from './../../shared/change-season/change-season.component';
import { VerticalCommentThreadedComponent } from './../../shared/comment/vertical-comment-threaded/vertical-comment-threaded.component';
import { InjuryIconComponent } from './../../shared/injury-icon/injury-icon.component';
import { MatchAnalysisComparisonComponent } from './match-analysis/match-analysis-comparison/match-analysis-comparison.component';
import { MatchAnalysisSummaryComponent } from './match-analysis/match-analysis-summary/match-analysis-summary.component';
import { MatchAnalysisComponent } from './match-analysis/match-analysis.component';
import { PlayerCardDetailsComponent } from './player-card-details/player-card-details.component';
import { PreparationComponent } from './preparation/preparation.component';
import { TacticsComponent } from './tactics.component';
import { VideoModule } from '../shared/ui/video/video.module';

const routes: Route[] = [
	{
		path: '',
		component: TacticsComponent,
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
		RoundProgressModule,
		ChangeSeasonComponent,
		ReportDownloadComponent,
		LegendContentComponent,
		ReportDownloadComponent,
		MultipleFileUploadComponent,
		TacticBoardComponent,
		PlayerCardTacticComponent,
		CloudUploadComponent,
		VerticalCommentThreadedComponent,
		InjuryIconComponent,
		FormatDateUserSettingPipe,
		AzureStoragePipe,
		CapitalizePipe,
		VideoModule,
		PictureComponent
	],
	declarations: [
		TacticsComponent,
		MatchAnalysisComparisonComponent,
		MatchAnalysisSummaryComponent,
		MatchAnalysisComponent,
		PlayerCardDetailsComponent,
		PreparationComponent
	],
	providers: [CapitalizePipe, VideoService]
})
export class TacticsModule {}

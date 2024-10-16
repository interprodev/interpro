import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard, nationalClubGuard } from '@iterpro/shared/data-access/auth';
import { MatchDetailsComponent, ReportDownloadComponent, SkeletonTableComponent } from '@iterpro/shared/ui/components';
import { ArrayFromNumberPipe, CapitalizePipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';
import { ChangeSeasonComponent } from '../../shared/change-season/change-season.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { MatchListComponent } from './match-list/match-list.component';
import { StandingsDashboardComponent } from './standings-dashboard.component';

const routes: Routes = [
	{
		path: '',
		component: StandingsDashboardComponent,
		canActivate: [authGuard, nationalClubGuard]
	}
];

@NgModule({
	imports: [
		RouterModule.forChild(routes),
		CommonModule,
		PrimeNgModule,
		TranslateModule,
		ReportDownloadComponent,
		ChangeSeasonComponent,
		CapitalizePipe,
		MatchDetailsComponent,
		ArrayFromNumberPipe,
		SkeletonTableComponent
	],
	declarations: [StandingsDashboardComponent, LeaderboardComponent, MatchListComponent]
})
export class StandingsDashboardModule {}

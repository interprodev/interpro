import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { BodyChartComponent, RedirectIconComponent, TimepickerComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { unsavedChangesGuard } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { BlockUIModule } from 'ng-block-ui';
import { PlayerDropdownComponent } from './../../shared/players/player-dropdown/player-dropdown.component';
import { TestComponent } from './../../shared/test/test.component';
import { AssessmentsComponent } from './assessments.component';
import { RpeSurveyComponent } from './rpe/rpe-survey/rpe-survey.component';
import { RpeTeamviewComponent } from './rpe/rpe-teamview/rpe-teamview.component';
import { WellnessSurveyComponent } from './wellness/wellness-survey/wellness-survey.component';
import { LocationsPipe } from './wellness/wellness-teamview/locations.pipe';
import { WellnessTeamviewComponent } from './wellness/wellness-teamview/wellness-teamview.component';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ChangeSeasonComponent } from 'src/app/shared/change-season/change-season.component';

const routes: Route[] = [
	{
		path: '',
		component: AssessmentsComponent,
		canDeactivate: [unsavedChangesGuard]
	}
];

@NgModule({
	imports: [
		CommonModule,
		BlockUIModule,
		RouterModule.forChild(routes),
		PrimeNgModule,
		FormsModule,
		TranslateModule,
		PlayerDropdownComponent,
		BodyChartComponent,
		RedirectIconComponent,
		TestComponent,
		SelectButtonModule,
		TimepickerComponent,
		ChangeSeasonComponent
	],
	declarations: [
		AssessmentsComponent,
		RpeSurveyComponent,
		RpeTeamviewComponent,
		WellnessSurveyComponent,
		WellnessTeamviewComponent,
		LocationsPipe
	]
})
export class AssessmentsModule {}

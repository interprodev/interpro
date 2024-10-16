import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import {
	BodyChartComponent, IconButtonComponent, PictureComponent,
	PlayerFlagComponent,
	ReportDownloadComponent, SkeletonTableComponent,
	TableStatsComponent
} from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AzureStoragePipe, FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { BlockUIModule } from 'ng-block-ui';
import { PlayerDropdownComponent } from './../../shared/players/player-dropdown/player-dropdown.component';
import { ReadinessListComponent } from './readiness-list/readiness-list.component';
import { ReadinessPeriodComponent } from './readiness-period/readiness-period.component';
import { ReadinessSessionComponent } from './readiness-session/readiness-session.component';
import { ReadinessTableComponent } from './readiness-table/readiness-table.component';
import { ReadinessComponent } from './readiness.component';
import { ArrayFromNumberPipe } from '@iterpro/shared/ui/pipes';

const routes: Route[] = [
	{
		path: '',
		component: ReadinessComponent
	}
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		BlockUIModule,
		PrimeNgModule,
		TranslateModule,
		FormsModule,
		ReportDownloadComponent,
		PlayerDropdownComponent,
		BodyChartComponent,
		PlayerFlagComponent,
		TableStatsComponent,
		RoundProgressModule,
		AzureStoragePipe,
		FormatDateUserSettingPipe,
		ArrayFromNumberPipe,
		IconButtonComponent,
		PictureComponent,
		SkeletonTableComponent
	],
	declarations: [
		ReadinessComponent,
		ReadinessSessionComponent,
		ReadinessPeriodComponent,
		ReadinessListComponent,
		ReadinessTableComponent
	]
})
export class ReadinessModule {}

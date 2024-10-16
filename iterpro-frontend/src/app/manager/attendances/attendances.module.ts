import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { ChartComponent, ReportDownloadComponent, TableStatsComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { unsavedChangesGuard } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { BlockUIModule } from 'ng-block-ui';
import { AttendancesComponent } from './attendances.component';
import { StatisticsComponent } from './statistics/statistics.component';

const routes: Route[] = [
	{
		path: '',
		component: AttendancesComponent,
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
		TableStatsComponent,
		ChartComponent,
		ReportDownloadComponent
	],
	declarations: [AttendancesComponent, StatisticsComponent]
})
export class AttendancesModule {}

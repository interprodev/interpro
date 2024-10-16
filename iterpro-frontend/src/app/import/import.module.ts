import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '@iterpro/shared/data-access/auth';
import { RedirectIconComponent } from '@iterpro/shared/ui/components';
import { SanitizeCsvHeadersPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { BlockUIModule } from 'ng-block-ui';
import { MomentModule } from 'ngx-moment';
import { ImportDashboardComponent } from './dashboard/import-dashboard.component';
import { ImportDrillMapperComponent } from './drill-mapper/import-drill-mapper.component';
import { ImportComponent } from './import.component';
import { GpsAPIImporterComponent } from './importers/gps-api-importer/gps-api-importer.component';
import { GpsCSVImporterComponent } from './importers/gps-csv-importer/gps-csv-importer.component';
import { ImportPlayerStatsComponent } from './importers/import-players-stats/import-players-stats.component';
import { ImportTeamStatsComponent } from './importers/import-team-stats/import-team-stats.component';
import { ImportMessagesComponent } from './messages/import-messages.component';
import { ImportTableComponent } from './table/import-table.component';
import { ImportWizardComponent } from './wizard/import-wizard.component';

const routes: Routes = [
	{
		path: '',
		component: ImportComponent,
		canActivate: [authGuard]
	}
];

@NgModule({
	imports: [
		RouterModule.forChild(routes),
		CommonModule,
		BlockUIModule,
		FormsModule,
		PrimeNgModule,
		TranslateModule,
		MomentModule,
		RedirectIconComponent,
		SanitizeCsvHeadersPipe,
		FormatDateUserSettingPipe
	],
	declarations: [
		ImportComponent,
		ImportDashboardComponent,
		ImportWizardComponent,
		ImportDrillMapperComponent,
		ImportMessagesComponent,
		ImportPlayerStatsComponent,
		ImportTeamStatsComponent,
		ImportTableComponent,
		GpsCSVImporterComponent,
		GpsAPIImporterComponent
	]
})
export class ImportModule {}

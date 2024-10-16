import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DrillsStatsModule } from '@iterpro/manager/drills/stats/stats-shell';
import { DrillsFiltersComponent, DrillsSearchComponent } from '@iterpro/manager/drills/ui';
import { FileUploaderComponent } from '@iterpro/shared/feature-components';
import {
	CsvUploadDownloadComponent,
	IconButtonComponent,
	ReportDownloadComponent
} from '@iterpro/shared/ui/components';
import { BulletTextBoxDirective, LazyLoadImagesDirective } from '@iterpro/shared/ui/directives';
import { ArrayFromNumberPipe, CapitalizePipe, CustomerNamePipe, MarkedPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { ChangeSeasonComponent } from '../../shared/change-season/change-season.component';
import { DrillCardComponent } from './drill-card/drill-card.component';
import { DrillDetailComponent } from './drill-detail/drill-detail.component';
import { DrillsComponent } from './drills.component';
import { drillsRoutes } from './drills.routes';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(drillsRoutes),
		PrimeNgModule,
		FormsModule,
		FontAwesomeModule,
		TranslateModule,
		DrillsStatsModule,
		CsvUploadDownloadComponent,
		DrillsFiltersComponent,
		DrillsSearchComponent,
		ReportDownloadComponent,
		FileUploaderComponent,
		ArrayFromNumberPipe,
		MarkedPipe,
		CustomerNamePipe,
		FormatDateUserSettingPipe,
		BulletTextBoxDirective,
		EditorComponent,
		CapitalizePipe,
		IconButtonComponent,
		LazyLoadImagesDirective,
		ChangeSeasonComponent
	],
	declarations: [DrillsComponent, DrillCardComponent, DrillDetailComponent]
})
export class DrillsModule {}

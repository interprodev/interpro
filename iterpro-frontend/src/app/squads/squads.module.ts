import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '@iterpro/shared/data-access/auth';
import { SearchDropdownComponent, ThirdPartyPlayerSearchComponent } from '@iterpro/shared/feature-components';
import {
	CsvUploadDownloadComponent,
	CsvUploadPreviewComponent,
	IconButtonComponent, PictureComponent, PlayerProviderWidgetComponent,
	ReportDownloadComponent, SkeletonTableComponent
} from '@iterpro/shared/ui/components';
import { ClickOutsideDirective } from '@iterpro/shared/ui/directives';
import { ArrayFromNumberPipe, CapitalizePipe, ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { FormatDateUserSettingPipe, unsavedChangesGuard } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { BlockUIModule } from 'ng-block-ui';
import { SquadPeopleComponent } from '../shared/players/squad-people/squad-people.component';
import { PlayersService } from '../shared/players/services/players.service';
import { PlayerAppCredentialsComponent } from './player-app-credentials/player-app-credentials.component';
import { ImportBulkPlayersCsv } from './service/import-bulk-players-csv.service';
import { SquadsPersonModule } from './squads-person/squads-person.module';
import { SquadsComponent } from './squads.component';
import { ActivateDialogComponent } from './utils/activate-dialog/activate-dialog.component';
import { ArchiviationDialogComponent } from './utils/archiviation-dialog/archiviation-dialog.component';
import { ChangeSeasonComponent } from '../shared/change-season/change-season.component';

const squadsRoutes: Routes = [
	{
		path: '',
		component: SquadsComponent,
		canActivate: [authGuard],
		canDeactivate: [unsavedChangesGuard]
	}
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(squadsRoutes),
		FormsModule,
		ReactiveFormsModule,
		PrimeNgModule,
		BlockUIModule,
		TranslateModule,
		SquadsPersonModule,
		SearchDropdownComponent,
		CsvUploadDownloadComponent,
		CsvUploadPreviewComponent,
		ThirdPartyPlayerSearchComponent,
		SquadPeopleComponent,
		CapitalizePipe,
		ShortNumberPipe,
		ArrayFromNumberPipe,
		FormatDateUserSettingPipe,
		ReportDownloadComponent,
		ClickOutsideDirective,
		IconButtonComponent,
		SkeletonTableComponent,
		ChangeSeasonComponent,
		PictureComponent,
		PlayerProviderWidgetComponent
	],
	exports: [RouterModule],
	declarations: [SquadsComponent, PlayerAppCredentialsComponent, ActivateDialogComponent, ArchiviationDialogComponent],
	providers: [ImportBulkPlayersCsv, PlayersService, CapitalizePipe, FormatDateUserSettingPipe]
})
export class SquadsModule {}

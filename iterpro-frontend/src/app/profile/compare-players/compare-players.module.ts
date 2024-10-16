import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { SearchDropdownComponent } from '@iterpro/shared/feature-components';
import { ReportDownloadComponent, TacticBoardComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AzureStoragePipe, FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { BlockUIModule } from 'ng-block-ui';
import { ComparePlayersComponent } from './compare-players.component';
import { CompareTableComponent } from './compare-table/compare-table.component';
import { PlayerPicComponent } from './player-pic/player-pic.component';
import { ProfileTableComponent } from './profile-table/profile-table.component';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';

const routes: Route[] = [
	{
		path: '',
		component: ComparePlayersComponent
	}
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		BlockUIModule,
		PrimeNgModule,
		FormsModule,
		ReactiveFormsModule,
		TranslateModule,
		TacticBoardComponent,
		ReportDownloadComponent,
		SearchDropdownComponent,
		FormatDateUserSettingPipe,
		AzureStoragePipe,
		ShortNumberPipe
	],
	declarations: [ComparePlayersComponent, ProfileTableComponent, PlayerPicComponent, CompareTableComponent]
})
export class ComparePlayersModule {}

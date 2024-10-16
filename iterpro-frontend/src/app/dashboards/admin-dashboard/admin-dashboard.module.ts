import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '@iterpro/shared/data-access/auth';
import { TacticBoardComponent, PictureComponent } from '@iterpro/shared/ui/components';
import { CapitalizePipe, ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AzureStoragePipe, FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { BlockUIModule } from 'ng-block-ui';
import { PlayerDropdownComponent } from '../../shared/players/player-dropdown/player-dropdown.component';
import { AdminDashboardPlayerComponent } from './admin-dashboard-player/admin-dashboard-player.component';
import { AdminDashboardTeamComponent } from './admin-dashboard-team/admin-dashboard-team.component';
import { AdminDashboardComponent } from './admin-dashboard.component';

const routes: Routes = [
	{
		path: '',
		component: AdminDashboardComponent,
		canActivate: [authGuard]
	}
];

@NgModule({
	imports: [
		RouterModule.forChild(routes),
		CommonModule,
		PrimeNgModule,
		FormsModule,
		BlockUIModule,
		TranslateModule,
		PlayerDropdownComponent,
		TacticBoardComponent,
		AzureStoragePipe,
		ShortNumberPipe,
		CapitalizePipe,
		FormatDateUserSettingPipe,
		PictureComponent
	],
	exports: [RouterModule],
	declarations: [AdminDashboardComponent, AdminDashboardPlayerComponent, AdminDashboardTeamComponent]
})
export class AdminDashboardModule {}

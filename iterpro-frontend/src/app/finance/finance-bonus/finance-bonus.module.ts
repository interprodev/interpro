import { NgModule } from '@angular/core';
import { FinanceBonusComponent } from './finance-bonus.component';
import { SharedModule } from 'primeng/api';
import { authGuard, temporaryPasswordGuard } from '@iterpro/shared/data-access/auth';
import { PermissionsGuard } from '@iterpro/shared/data-access/permissions';
import { AzureStoragePipe, FormatDateUserSettingPipe, unsavedChangesGuard } from '@iterpro/shared/utils/common-utils';
import { Route, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableBonusComponent } from './table-bonus/table-bonus.component';
import { TeamBonusBuilderComponent } from './team-bonus-builder/team-bonus-builder.component';
import { TeamPerformanceBonusComponent } from './team-bonus-builder/team-performance-bonus/team-performance-bonus.component';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CustomerNamePipe, SelectItemLabelPipe, SelectItemValuePipe, ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import { ReportDownloadComponent } from '@iterpro/shared/ui/components';
import { BlockUIModule } from 'ng-block-ui';
import { MaskDirective } from '@iterpro/shared/ui/directives';

const routes: Route[] = [
	{
		path: '',
		component: FinanceBonusComponent,
		canActivate: [authGuard, temporaryPasswordGuard, PermissionsGuard],
		canDeactivate: [unsavedChangesGuard]
	}
];

@NgModule({
	imports: [CommonModule, PrimeNgModule, RouterModule.forChild(routes), SharedModule, TranslateModule, FormsModule,
		ShortNumberPipe, ReportDownloadComponent,
		CustomerNamePipe, SelectItemValuePipe, SelectItemLabelPipe, FormatDateUserSettingPipe, BlockUIModule, AzureStoragePipe, MaskDirective],
	declarations: [FinanceBonusComponent, TableBonusComponent, TeamBonusBuilderComponent, TeamPerformanceBonusComponent],
	providers: [SelectItemLabelPipe],
	exports: [FinanceBonusComponent]
})
export class FinanceBonusModule {}

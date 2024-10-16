import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CloudUploadComponent, MultipleFileUploadComponent } from '@iterpro/shared/feature-components';
import {
	PlayerFlagComponent,
	PlayerProviderWidgetComponent,
	ReportDownloadComponent,
	SideTabComponent,
	SideTabsComponent,
	TacticBoardComponent,
	PictureComponent
} from '@iterpro/shared/ui/components';
import { ClickOutsideDirective, MaskDirective, TeleportToDirective } from '@iterpro/shared/ui/directives';
import { CapitalizePipe, CustomerNamePipe, MarkedPipe, ShortNumberPipe, TeamNamePipe } from '@iterpro/shared/ui/pipes';
import { AutoCompleteComponent, PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AzureStoragePipe, FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ThresholdsModule } from '../../profile/my-team/thresholds/thresholds.module';
import { CommentThreadedComponent } from '../../shared/comment/comment-threaded/comment-threaded.component';
import { CostItemsTableComponent } from '../../shared/cost-items/cost-items-table/cost-items-table.component';
import { AmortizationCommonService } from './squads-person-amortization/services/amortization-common.service';
import { SquadsPersonAmortizationComponent } from './squads-person-amortization/squads-person-amortization.component';
import { SquadsPersonBonusesComponent } from './squads-person-bonuses/squads-person-bonuses.component';
import { SquadsPersonDetailsComponent } from './squads-person-details/squads-person-details.component';
import { SquadsPersonEvaluationComponent } from './squads-person-evaluation/squads-person-evaluation.component';
import { ContractListItemComponent } from './squads-person-legal/components/contract-list-item/contract-list-item.component';
import { EmploymentContractComponent } from './squads-person-legal/components/employment-contract/employment-contract.component';
import { TransferContractComponent } from './squads-person-legal/components/transfer-contract/transfer-contract.component';
import { AgentContractComponent } from './squads-person-legal/form-controls/agent-contract/agent-contract.component';
import { BonusPanelComponent } from './squads-person-legal/form-controls/bonus-panel/bonus-panel.component';
import { NotifyCustomersDialogComponent } from './squads-person-legal/form-controls/notify-customers-dialog/notify-customers-dialog.component';
import { SquadsPersonLegalComponent } from './squads-person-legal/squads-person-legal.component';
import { SquadsPersonNotesComponent } from './squads-person-notes/squads-person-notes.component';
import { SquadsPersonOverviewComponent } from './squads-person-overview/squads-person-overview.component';
import { SquadsPersonComponent } from './squads-person.component';
import { NetSalaryPipe } from 'src/app/transfers/shared/pipes/net-salary.pipe';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		PrimeNgModule,
		TranslateModule,
		ThresholdsModule,
		AutoCompleteComponent,
		CostItemsTableComponent,
		PlayerProviderWidgetComponent,
		ReportDownloadComponent,
		CloudUploadComponent,
		MultipleFileUploadComponent,
		TacticBoardComponent,
		FormatDateUserSettingPipe,
		CommentThreadedComponent,
		PictureComponent,
		AzureStoragePipe,
		ShortNumberPipe,
		CapitalizePipe,
		AutoCompleteModule,
		SideTabsComponent,
		SideTabComponent,
		CustomerNamePipe,
		EditorComponent,
		MarkedPipe,
		TeleportToDirective,
		BonusPanelComponent,
		AgentContractComponent,
		ClickOutsideDirective,
		MaskDirective,
		TeamNamePipe,
		PlayerFlagComponent,
		NetSalaryPipe
	],
	exports: [SquadsPersonComponent],
	declarations: [
		SquadsPersonComponent,
		SquadsPersonAmortizationComponent,
		SquadsPersonBonusesComponent,
		SquadsPersonDetailsComponent,
		SquadsPersonEvaluationComponent,
		SquadsPersonLegalComponent,
		NotifyCustomersDialogComponent,
		ContractListItemComponent,
		EmploymentContractComponent,
		TransferContractComponent,
		SquadsPersonNotesComponent,
		SquadsPersonOverviewComponent
	],
	providers: [AmortizationCommonService]
})
export class SquadsPersonModule {}

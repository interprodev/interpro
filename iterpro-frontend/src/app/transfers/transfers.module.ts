import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Route, RouterModule } from '@angular/router';
import { authGuard } from '@iterpro/shared/data-access/auth';
import { SearchDropdownComponent, ThirdPartyPlayerSearchComponent } from '@iterpro/shared/feature-components';
import {
	IconButtonComponent,
	PlayerFlagComponent,
	TacticBoardComponent,
	PictureComponent,
	PlayerProviderWidgetComponent
} from '@iterpro/shared/ui/components';
import { ClickOutsideDirective, MaskDirective } from '@iterpro/shared/ui/directives';
import { CapitalizePipe, MillionsPipe, ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { FormatDateUserSettingPipe, unsavedChangesGuard } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { PlayersService } from '../shared/players/services/players.service';
import { AmortizationChartService } from '../squads/squads-person/squads-person-amortization/services/amortization-chart.service';
import { AmortizationTableService } from '../squads/squads-person/squads-person-amortization/services/amortization-table.service';
import { SquadsPersonModule } from '../squads/squads-person/squads-person.module';
import { TransfersWindowSelectionComponent } from './shared/components/transfers-window-selection/transfers-window-selection.component';
import { DealValuePipe } from './shared/pipes/deal-value.pipe';
import { NetSalaryPipe } from './shared/pipes/net-salary.pipe';
import { PercentageDiffPipe } from './shared/pipes/percentage-diff.pipe';
import { ProfileUrlPipe } from './shared/pipes/profile-url.pipe';
import { PurchaseCostPipe } from './shared/pipes/purchase-cost.pipe';
import { SalaryBreakdownPipe } from './shared/pipes/salary-breakdown.pipe';
import { TooltipTransferPipe } from './shared/pipes/tooltip-transfer.pipe';
import { TransferPersonStatusPipe } from './shared/pipes/transfer-person-status.pipe';
import { TradingBalanceBreakdownBoardComponent } from './trading-balance/components/trading-balance-breakdown-board/trading-balance-breakdown-board.component';
import { TradingBalanceBreakdownChartComponent } from './trading-balance/components/trading-balance-breakdown-chart/trading-balance-breakdown-chart.component';
import { TradingBalanceChartComponent } from './trading-balance/components/trading-balance-chart/trading-balance-chart.component';
import { TradingBalanceWindowBudgetComponent } from './trading-balance/components/trading-balance-window-budget/trading-balance-window-budget.component';
import { TradingBalanceComponent } from './trading-balance/trading-balance.component';
import { TradingCompareDealOverviewComponent } from './trading-compare/components/trading-compare-deal-overview/trading-compare-deal-overview.component';
import { TradingComparePlayerComponent } from './trading-compare/components/trading-compare-player/trading-compare-player.component';
import { TradingLegalService } from './trading-compare/services/trading-legal.service';
import { TradingCompareComponent } from './trading-compare/trading-compare.component';
import { TransfersDealsAddPurchaseComponent } from './transfers-deals/components/transfers-deals-add-purchase/transfers-deals-add-purchase.component';
import { TransfersDealsAddSaleComponent } from './transfers-deals/components/transfers-deals-add-sale/transfers-deals-add-sale.component';
import { TransfersDealsFiltersComponent } from './transfers-deals/components/transfers-deals-filters/transfers-deals-filters.component';
import { TransfersDealsKanbanItemComponent } from './transfers-deals/components/transfers-deals-kanban-item/transfers-deals-kanban-item.component';
import { TransfersDealsKanbanComponent } from './transfers-deals/components/transfers-deals-kanban/transfers-deals-kanban.component';
import { TransfersDealsThirdPartyPlayerComponent } from './transfers-deals/components/transfers-deals-third-party-player/transfers-deals-third-party-player.component';
import { TransfersDealsComponent } from './transfers-deals/transfers-deals.component';
import { TransfersComponent } from './transfers.component';

export const routes: Route[] = [
	{
		path: '',
		component: TransfersComponent,
		canActivate: [authGuard],
		canDeactivate: [unsavedChangesGuard]
	}
];

@NgModule({
	imports: [
		RouterModule.forChild(routes),
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		TranslateModule,
		PrimeNgModule,
		CapitalizePipe,
		MillionsPipe,
		TacticBoardComponent,
		SearchDropdownComponent,
		PlayerFlagComponent,
		ShortNumberPipe,
		ClickOutsideDirective,
		SquadsPersonModule,
		AutoCompleteModule,
		PictureComponent,
		ThirdPartyPlayerSearchComponent,
		IconButtonComponent,
		MaskDirective,
		NetSalaryPipe,
		PlayerProviderWidgetComponent
	],
	exports: [RouterModule],
	declarations: [
		TransfersComponent,
		TransfersWindowSelectionComponent,
		TransfersDealsComponent,
		TransfersDealsKanbanComponent,
		TransfersDealsFiltersComponent,
		TransfersDealsKanbanItemComponent,
		TransfersDealsThirdPartyPlayerComponent,
		TransfersDealsAddSaleComponent,
		TransfersDealsAddPurchaseComponent,
		TradingBalanceComponent,
		TradingBalanceBreakdownChartComponent,
		TradingBalanceBreakdownBoardComponent,
		TradingBalanceChartComponent,
		TradingBalanceWindowBudgetComponent,
		TradingCompareComponent,
		TradingComparePlayerComponent,
		TradingCompareDealOverviewComponent,
		TooltipTransferPipe,
		ProfileUrlPipe,
		TransferPersonStatusPipe,
		DealValuePipe,
		PurchaseCostPipe,
		PercentageDiffPipe,
		SalaryBreakdownPipe
	],
	providers: [
		PlayersService,
		TradingLegalService,
		AmortizationChartService,
		AmortizationTableService,
		CapitalizePipe,
		MillionsPipe,
		ShortNumberPipe,
		FormatDateUserSettingPipe
	]
})
export class TransfersModule {}

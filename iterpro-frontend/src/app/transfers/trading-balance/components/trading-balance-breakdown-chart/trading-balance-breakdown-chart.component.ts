import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { ShortNumberPipe, toShortNumber } from '@iterpro/shared/ui/pipes';
import { PRIMARIES } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BreakdownItem, PurchaseBreakdown, SaleBreakdown } from 'src/app/transfers/shared/interfaces/transfers.interface';
import { TradingBalanceChartService } from '../../services/trading-balance-chart.service';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'iterpro-trading-balance-breakdown-chart',
	templateUrl: './trading-balance-breakdown-chart.component.html',
	host: { class: 'pflex-w-full pflex-block' }
})
export class TradingBalanceBreakdownChartComponent {
	/** Services */
	readonly #shortNumberPipe = inject(ShortNumberPipe);
	readonly #translateService = inject(TranslateService);
	readonly #tradingBalanceChartService = inject(TradingBalanceChartService);

	/** Input & Outputs */
	@Input({ required: true }) set breakdown(value: SaleBreakdown & PurchaseBreakdown) {
		if (value) {
			this.chartOptions = this.getHorizontalChartOptions(value);
			this.chartData = this.getChartData(value);
		}
	}

	/** Data */
	chartData: ChartData | null = null;
	chartOptions: ChartOptions | null = null;

	private getChartData(breakdown: SaleBreakdown & PurchaseBreakdown): ChartData {
		/** Exclude rejected deals */
		delete breakdown.rejected;

		/** Create Labels */
		const labels = Object.keys(breakdown).map(x => this.#translateService.instant('admin.transfers.deals.' + x));

		/** Get BreakdownItem values */
		const transferFees = Object.values(breakdown).map(({ transferFee }) => transferFee);
		const wage = Object.values(breakdown).map(({ wageBonus }) => wageBonus);
		const benefit = Object.values(breakdown).map(({ benefits }) => benefits);
		const agents = Object.values(breakdown).map(({ agent }) => agent);

		/** Create Datasets */
		const datasets = [
			{
				data: transferFees,
				backgroundColor: PRIMARIES[0],
				label: this.#translateService.instant('admin.transfers.trading.value'),
				barThickness: 30
			},
			{
				data: wage,
				backgroundColor: PRIMARIES[1],
				label: this.#translateService.instant('admin.transfers.trading.salary'),
				barThickness: 30
			},
			{
				data: benefit,
				backgroundColor: PRIMARIES[2],
				label: this.#translateService.instant('admin.transfers.trading.benefits'),
				barThickness: 30
			},
			{
				data: agents,
				backgroundColor: PRIMARIES[3],
				label: this.#translateService.instant('admin.transfers.trading.agents'),
				barThickness: 30
			}
		];

		return { labels, datasets };
	}

	private getHorizontalChartOptions(breakdown: SaleBreakdown & PurchaseBreakdown): ChartOptions {
		const options: ChartOptions = this.#tradingBalanceChartService.getHorizontalChartOptions();

		options.scales.x.ticks = { display: false };
		options.scales.y.ticks = { display: true, color: 'white' };
		options.plugins.legend = { display: true, labels: { color: 'white' } };
		options.plugins.tooltip.axis = 'y';
		options.plugins.tooltip.callbacks = {
			title: ([{ label, dataset, dataIndex }, ...{}]) => {
				return `${label}: ${breakdown[Object.keys(breakdown)[dataIndex]].count} - [${this.sumAllValues(
					breakdown[Object.keys(breakdown)[dataIndex]]
				)}]`;
			},
			label: ({ dataset, raw }) => dataset.label + ': ' + this.#shortNumberPipe.transform(Number(raw), true)
		};

		return options;
	}

	private sumAllValues(breakdownItem: BreakdownItem): string {
		return toShortNumber(breakdownItem.agent + breakdownItem.benefits + breakdownItem.wage + breakdownItem.transferFee, true);
	}
}

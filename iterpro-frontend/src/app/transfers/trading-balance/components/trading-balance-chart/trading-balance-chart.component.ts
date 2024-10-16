import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import { getDefaultPieConfig } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions, Plugin } from 'chart.js';
import { PurchaseBreakdown, SaleBreakdown, TransfersBreakdown } from 'src/app/transfers/shared/interfaces/transfers.interface';
import { TradingBalanceChartService } from '../../services/trading-balance-chart.service';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'iterpro-trading-balance-chart',
	templateUrl: 'trading-balance-chart.component.html'
})
export class TradingBalanceChartComponent implements OnChanges {
	/** Services */
	readonly #shortNumberPipe = inject(ShortNumberPipe);
	readonly #translateService = inject(TranslateService);
	readonly #tradingBalanceChartService = inject(TradingBalanceChartService);

	/** Inputs & Outputs */
	@Input({ required: true }) salesBreakdown: SaleBreakdown;
	@Input({ required: true }) purchasesBreakdown: PurchaseBreakdown;

	/** Data */
	transfersBreakdown: TransfersBreakdown = {
		purchasesBreakdown: null,
		salesBreakdown: null
	};
	chartData: ChartData | null = null;
	chartOptions: ChartOptions | null = null;
	plugins: Plugin[] = this.#tradingBalanceChartService.getDoughnutChartPlugins();

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['salesBreakdown'] || changes['purchasesBreakdown']) {
			/** Set Transfers Breakdown */
			this.transfersBreakdown = {
				purchasesBreakdown: this.purchasesBreakdown,
				salesBreakdown: this.salesBreakdown
			};

			/** Recalculate Chart */
			this.chartData = this.getBalanceChart(this.transfersBreakdown);
			this.chartOptions = this.getDataBalanceOptions();
		}
	}

	private getBalanceChart(breakdown: TransfersBreakdown): ChartData {
		const amountPurchases: number = this.getAmount(breakdown.purchasesBreakdown);
		const amountSales: number = this.getAmount(breakdown.salesBreakdown);

		const datasets = [
			{
				data: [Number(amountSales.toFixed(0)), Number(amountPurchases.toFixed(0))],
				backgroundColor: ['#008000', '#DC143C'],
				borderColor: ['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.6)'],
				borderWidth: 0,
				labels: [
					this.#translateService.instant('admin.transfers.trading.purchase'),
					this.#translateService.instant('admin.transfers.trading.sales')
				],
				barThickness: 30
			}
		];

		const data: ChartData = {
			datasets,
			labels: [
				this.#translateService.instant('admin.transfers.trading.sales'),
				this.#translateService.instant('admin.transfers.trading.purchase')
			]
		};

		return data;
	}

	private getDataBalanceOptions(): ChartOptions {
		const options: ChartOptions = {
			...getDefaultPieConfig(),
			cutout: '75%'
		};

		options.plugins.legend = {
			display: false
		};

		options.plugins.tooltip = {
			callbacks: {
				label: ({ label, parsed }) => `${label}: ${this.#shortNumberPipe.transform(parsed, true)}`
			}
		};

		options.plugins.datalabels = {
			...options.plugins.datalabels,
			display: false
		};

		return options;
	}

	private getAmount(breakdown: SaleBreakdown | PurchaseBreakdown): number {
		if (!breakdown) {
			return 0;
		}

		/** Exclude "rejected" deals */
		delete breakdown.rejected;

		/** Get BreakdownItem amount */
		return Object.values(breakdown)
			.map(({ transferFee }) => transferFee)
			.reduce((a, b) => a + b, 0);
	}
}

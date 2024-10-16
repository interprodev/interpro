import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { ClubTransfer } from '@iterpro/shared/data-access/sdk';
import { ChartData, ChartOptions, Plugin } from 'chart.js';
import { TradingCompareItem } from '../../models/trading-compare.types';
import { TradingLegalService } from '../../services/trading-legal.service';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'iterpro-trading-compare-deal-overview',
	templateUrl: './trading-compare-deal-overview.component.html'
})
export class TradingCompareDealOverviewComponent implements OnChanges {
	/** Services */
	readonly #tradingLegalService = inject(TradingLegalService);

	/** Inputs & Outputs */
	@Input({ required: true }) leftComparePlayer: TradingCompareItem;
	@Input({ required: true }) rightComparePlayer: TradingCompareItem;

	/** Data */
	chartData: ChartData | null;
	chartOptions: ChartOptions | null;
	chartPlugins: Plugin[] | null;

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['leftComparePlayer'] || changes['rightComparePlayer']) {
			this.updateData();
		}
	}

	private updateData() {
		if (this.leftComparePlayer && this.leftComparePlayer.cost && this.rightComparePlayer && this.rightComparePlayer.cost) {
			/** Calculate diff between compare players */
			this.#tradingLegalService.addDiff(this.leftComparePlayer, this.rightComparePlayer.cost);
			this.#tradingLegalService.addDiff(this.rightComparePlayer, this.leftComparePlayer.cost);
		}

		if (this.leftComparePlayer && this.rightComparePlayer) {
			this.updateChartData(this.leftComparePlayer.transfer, this.rightComparePlayer.transfer);
		}
	}

	private updateChartData(left: ClubTransfer, right: ClubTransfer) {
		if (left && right) {
			const { data, options, plugins } = this.#tradingLegalService.toChartData(left, right);
			this.chartData = data;
			this.chartOptions = options;
			this.chartPlugins = plugins;
		}
	}
}

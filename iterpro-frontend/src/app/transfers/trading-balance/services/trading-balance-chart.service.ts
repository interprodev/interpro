import { Injectable, inject } from '@angular/core';
import { ShortNumberPipe, toShortNumber } from '@iterpro/shared/ui/pipes';
import { getDefaultCartesianConfig } from '@iterpro/shared/utils/common-utils';
import { ChartOptions, Color, Plugin } from 'chart.js';
import { Context } from 'chartjs-plugin-datalabels';
import { Options } from 'chartjs-plugin-datalabels/types/options';

@Injectable({ providedIn: 'root' })
export class TradingBalanceChartService {
	readonly #shortNumberPipe = inject(ShortNumberPipe);

	getHorizontalBarDataLabels(): Options {
		return {
			backgroundColor: (context: Context) => context.dataset.backgroundColor as Color,
			color: 'black',
			borderRadius: 4,
			borderWidth: 1.5,
			borderColor: '#333333',
			align: 'center',
			anchor: 'center',
			clamp: true,
			font: { weight: 'bold', size: 10 },
			display: (context: Context) => {
				const value = context.dataset.data[context.dataIndex];
				return !!value && Number(value) !== 0;
			},
			formatter: value => this.#shortNumberPipe.transform(value, true)
		};
	}

	getHorizontalChartOptions(): ChartOptions {
		const options: ChartOptions = {
			...getDefaultCartesianConfig(),
			indexAxis: 'y',
			responsive: true
		};

		options.scales = {
			x: {
				stacked: true,
				min: 0,
				ticks: {
					color: '#ddd',
					callback: (value: number) => this.#shortNumberPipe.transform(value, true)
				},
				grid: {
					display: false
				}
			},
			y: {
				stacked: true,
				ticks: {
					color: '#ddd'
				}
			}
		};

		options.plugins.legend.position = 'bottom';
		// options.plugins.datalabels = this.getHorizontalBarDataLabels();

		return options;
	}

	getDoughnutChartPlugins(): Plugin[] {
		const doughnutLabel: Plugin = {
			id: 'doughnutLabel',
			beforeDatasetsDraw(chart, args, pluginOptions) {
				const { ctx, data } = chart;
				ctx.save();
				const xCoor = chart.getDatasetMeta(0).data[0].x;
				const yCoor = chart.getDatasetMeta(0).data[0].y;
				ctx.font = 'bold 2.5rem sans-serif';
				ctx.fillStyle = 'white';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';

				/**
				 * Subtract Sales from Purchases --> Balance
				 * And put in the center of the chart
				 */
				const balance = Number(data.datasets[0].data[0]) - Number(data.datasets[0].data[1]);
				ctx.fillText(toShortNumber(balance, true), xCoor, yCoor);
			}
		};

		return [doughnutLabel];
	}
}

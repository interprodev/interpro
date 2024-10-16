import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { Player } from '@iterpro/shared/data-access/sdk';
import {
	ADVANCED_COLORS,
	CalendarService,
	PRIMARIES,
	getBackendFormat,
	getDefaultCartesianConfig,
	getMomentFormatFromStorage,
	getTimeseriesXAxis,
	isNotEmpty,
	sortByDate,
	workloadLabels
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { Font } from 'chartjs-plugin-datalabels/types/options';
import { groupBy, meanBy } from 'lodash';
import * as moment from 'moment';
import { AdvancedMetricData } from 'src/app/+state/session-analysis-store/ngrx/session-analysis-store.interfaces';

export interface TrendPlayer {
	players: Player[];
	workload: any[];
}

type EWMAValues = 'ewmaAcuteLoad' | 'ewmaCronicLoad' | 'ewmaAlCl';

@Component({
	selector: 'iterpro-stress-balance',
	templateUrl: './stress-balance.component.html'
})
export class StressBalanceComponent implements OnChanges {
	@Input() data: any;
	@Input() metric: string;
	@Input() period: any;
	@Input() trendPlayer: TrendPlayer;
	@Input() labels: boolean;

	dataChart: ChartData;
	optionsChart: ChartOptions;

	readonly #translateService = inject(TranslateService);
	readonly #calendarService = inject(CalendarService);

	ngOnChanges(changes: SimpleChanges) {
		if ((changes['data'] || changes['metric'] || changes['trendPlayer'] || changes['labels']) && this.data) {
			this.render(this.data, this.trendPlayer);
		}
	}

	getReport(): any {
		const { dataChart, optionsChart } = this.getChart(this.data);
		// dataChart.labels.forEach(label => (label = moment(this.toServer.convert(label.toDate()))));
		const ticks = dataChart.labels.map(label => '(' + this.#calendarService.getGD(moment(label).toDate()) + ')');
		const data = {
			trendData: dataChart,
			trendOptions: optionsChart,
			trendTicks: ticks,
			metric: this.metric
		};
		return data;
	}

	private render(data, trendPlayer?: TrendPlayer) {
		const { dataChart, optionsChart } = this.getChart(data);

		if (!!trendPlayer && !!trendPlayer.workload && this.metric !== 'ewma') {
			const displayName = trendPlayer.players.length === 1 ? trendPlayer.players[0].displayName : '';
			// here is extracted the ewma for the selected player. uncomment if comparing player becomes necessary in the ewma metric view
			// trendPlayer.workload.ewma =
			// !!data['ewma'] && !!data['ewma'][displayName.toUpperCase()] ? [data['ewma'][displayName.toUpperCase()]] : [];
			const trendPlayerChart = this.getChart(trendPlayer.workload);
			trendPlayerChart.dataChart.datasets.forEach(chartElement => {
				chartElement.label =
					displayName.length > 0
						? chartElement.label + ' ' + displayName
						: this.#translateService.instant('sidebar.stressbalance.' + chartElement.metric + '2');
				if (chartElement.type === 'line') {
					// e3bbf4
					chartElement.borderColor = '#ecd1f7';
					chartElement.pointBorderColor = '#ecd1f7';
					chartElement.pointBackgroundColor = '#ecd1f7';
					chartElement.pointHoverBackgroundColor = '#ecd1f7';
					chartElement.borderDash = [];
				} else if (chartElement.type === 'bar') {
					chartElement.backgroundColor = this.tintBackgroundColor(chartElement.backgroundColor, 0.7);
				}
			});
			dataChart.datasets.forEach(chartElement => {
				chartElement.label = this.#translateService.instant('sidebar.stressbalance.' + chartElement.metric + '1');
			});
			dataChart.datasets = [...dataChart.datasets, ...trendPlayerChart.dataChart.datasets];
		}

		this.dataChart = dataChart;
		this.optionsChart = optionsChart;
	}

	private getChart(data) {
		const ordered = groupBy(sortByDate(data.stress_balance, 'label'), 'label');
		const categories = Object.keys(ordered).map((x: any) => moment(x, getBackendFormat()));
		const workload = Object.values(ordered).map((x: any) => Number(x[0].workload).toFixed(1));
		const results = Object.values(ordered).map((x: any) => x[0].eventResult);
		const opponents = Object.values(ordered).map((x: any) => x[0].opponent);
		const homes = Object.values(ordered).map((x: any) => x[0].home);
		let ewma;
		let readiness;
		if (this.metric === 'ewma') {
			if (data['ewma']) {
				ewma = [
					this.getEwmaValue(data['ewma'], 'ewmaAcuteLoad'),
					this.getEwmaValue(data['ewma'], 'ewmaCronicLoad'),
					this.getEwmaValue(data['ewma'], 'ewmaAlCl')
				];
			}
		} else if (this.metric === 'readiness') {
			readiness = Object.values(ordered).map((x: any) => Number(x[0].readiness).toFixed(1));
		}

		return {
			dataChart: this.getChartData(categories, workload, ewma, readiness, this.#translateService),
			optionsChart: this.getChartOptions(
				this.metric === 'ewma',
				readiness,
				categories,
				this.#calendarService,
				opponents,
				results,
				homes,
				this.#translateService
			)
		};
	}

	private getChartData(
		categories: moment.Moment[],
		workload: string[],
		ewma: any[],
		readiness: string[],
		translate: TranslateService
	) {
		const datasets: { labels: any[]; datasets: any[] } = {
			labels: categories,
			datasets: [
				{
					data: workload,
					yAxisID: 'y',
					type: 'bar',
					backgroundColor: workload.map((data, index) => {
						const found = this.data.stress_balance.find(
							({ label }) => label === categories[index].format(getMomentFormatFromStorage())
						);
						return found && found.opponent ? PRIMARIES[1] : PRIMARIES[0];
					}),
					label: translate.instant('workload'),
					metric: 'workload'
				}
			]
		};

		if (ewma) {
			const labels = ['AL EWMA', 'CL EWMA', 'AL/CL EWMA'];
			const obj = [
				{
					data: ewma[0],
					type: 'line',
					label: labels[0],
					borderColor: ADVANCED_COLORS[0],
					pointBorderColor: ADVANCED_COLORS[0],
					pointBackgroundColor: ADVANCED_COLORS[0],
					pointHoverBackgroundColor: ADVANCED_COLORS[0],
					pointHoverBorderColor: '#fff',
					backgroundColor: 'transparent',
					pointRadius: 0,
					borderWidth: 2,
					cubicInterpolationMode: 'monotone',
					borderJoinStyle: 'miter',
					yAxisID: 'y',
					xAxisID: 'x',
					metric: 'ewma'
				},
				{
					data: ewma[1],
					type: 'line',
					label: labels[1],
					borderColor: ADVANCED_COLORS[1],
					pointBorderColor: ADVANCED_COLORS[1],
					pointBackgroundColor: ADVANCED_COLORS[1],
					pointHoverBackgroundColor: ADVANCED_COLORS[1],
					pointHoverBorderColor: '#fff',
					backgroundColor: 'transparent',
					pointRadius: 0,
					borderWidth: 2,
					cubicInterpolationMode: 'monotone',
					borderJoinStyle: 'miter',
					yAxisID: 'y',
					xAxisID: 'x',
					metric: 'ewma'
				},
				{
					data: ewma[2],
					type: 'line',
					label: labels[2],
					borderColor: ADVANCED_COLORS[2],
					pointBorderColor: ADVANCED_COLORS[2],
					pointBackgroundColor: ADVANCED_COLORS[2],
					pointHoverBackgroundColor: ADVANCED_COLORS[2],
					pointHoverBorderColor: '#fff',
					backgroundColor: 'transparent',
					pointRadius: 0,
					borderWidth: 2,
					cubicInterpolationMode: 'monotone',
					borderJoinStyle: 'miter',
					yAxisID: 'yB',
					xAxisID: 'x',
					metric: 'ewma'
				}
			];
			datasets.datasets = [...obj, ...datasets.datasets];
		}

		if (readiness) {
			datasets.datasets.unshift({
				data: readiness,
				type: 'line',
				label: translate.instant('readiness'),
				borderColor: '#a05195',
				pointBorderColor: '#a05195',
				pointBackgroundColor: '#a05195',
				pointHoverBackgroundColor: '#a05195',
				pointHoverBorderColor: '#fff',
				// borderDash: [5, 5],
				backgroundColor: 'transparent',
				pointRadius: 0,
				borderWidth: 2,
				cubicInterpolationMode: 'monotone',
				borderJoinStyle: 'miter',
				yAxisID: 'yB',
				xAxisID: 'x',
				metric: 'readiness'
			});
		}

		return datasets;
	}

	private getChartOptions(
		ewma,
		readiness,
		categories,
		calendar,
		opponents,
		results,
		homes,
		translate: TranslateService
	) {
		const options = {
			...getDefaultCartesianConfig(),
			responsive: true,
			maintainAspectRatio: true
		};
		options.plugins.datalabels = this.getDatalabels(this.labels, translate);
		options.scales.y = {
			position: 'left',
			stacked: false,
			grid: {
				color: 'transparent'
			},
			border: { display: false },
			beginAtZero: true,
			min: 0,
			max: 6,
			ticks: {
				color: '#ddd',
				callback: value => {
					if (value === 1) return translate.instant('event.effort.1');
					else if (value === 2) return translate.instant('event.effort.2');
					else if (value === 3) return translate.instant('event.effort.3');
					else if (value === 4) return translate.instant('event.effort.4');
					else if (value === 5) return translate.instant('event.effort.5');
					else if (value === 6) return translate.instant('event.effort.6');
					else return '';
				},
				padding: 15
			}
		};
		options.scales.x = getTimeseriesXAxis(options.scales.x);
		options.scales.x.ticks.callback = (value, index, values: any[]) => {
			if (values && isNotEmpty(values)) {
				return calendar.getGD(moment(values[index].value).toDate());
			}
		};

		if (readiness) {
			options.scales = {
				...options.scales,
				yB: {
					position: 'right',
					stacked: false,
					grid: {
						color: '#333333',
						display: false
					},
					border: { display: false },
					beginAtZero: true,
					min: 0,
					max: 100,
					ticks: {
						color: '#ddd',
						callback: (value: number, index, values) =>
							value % 1 === 0 && index === values.length - 1 ? value + '%' : value,
						padding: 15
					}
				}
			};
		}

		if (ewma) {
			options.scales = {
				...options.scales,
				yB: {
					position: 'right',
					stacked: false,
					grid: {
						color: '#333333',
						display: false
					},
					border: { display: false },
					min: 0,
					suggestedMax: 2,
					beginAtZero: true,
					ticks: {
						color: '#ddd',
						callback: (value: number) => {
							if (value % 1 === 0) {
								return value;
							}
						},
						padding: 15
					}
				}
			};
			options.plugins.annotation = {
				annotations: [
					{
						type: 'box',
						drawTime: 'beforeDatasetsDraw',
						// xScaleID: 'x',
						yScaleID: 'yB',
						backgroundColor: 'rgba(0, 204, 106, 0.3)',
						yMin: 0.8,
						yMax: 1.3,
						xMax: undefined,
						xMin: undefined
					},
					{
						type: 'box',
						drawTime: 'beforeDatasetsDraw',
						// xScaleID: 'x',
						yScaleID: 'yB',
						backgroundColor: 'rgba(255, 255, 0, 0.3)',
						yMin: 1.3,
						yMax: 1.5,
						xMax: undefined,
						xMin: undefined
					},
					{
						type: 'box',
						drawTime: 'beforeDatasetsDraw',
						// xScaleID: 'x',
						yScaleID: 'yB',
						backgroundColor: 'rgba(255, 0, 0, 0.3)',
						yMax: undefined,
						yMin: 1.5,
						xMax: undefined,
						xMin: undefined
					}
				]
			};
		}

		options.plugins.tooltip = {
			mode: 'index',
			intersect: false,
			callbacks: {
				title: ([{ label }, ...{}]) => {
					const date = moment(label);
					return `${date.format(`${getMomentFormatFromStorage()}`)} (${calendar.getGD(date.toDate())})`;
				},
				afterTitle: ([tooltipItem, ...{}]) => {
					const opp = opponents[tooltipItem.dataIndex];
					const res = results[tooltipItem.dataIndex];
					const h = homes[tooltipItem.dataIndex];
					if (opp) {
						return `${opp} ${res} (${h ? 'H' : 'A'})`;
					}
				},
				label: ({ dataset, formattedValue }) => {
					const workloadInfo =
						dataset.label === 'Workload'
							? `: ${workloadLabels(Math.ceil(Number(formattedValue)), translate)} (${formattedValue})`
							: `: ${formattedValue}`;
					return dataset.label + workloadInfo;
				}
			}
		};

		return options;
	}

	private getDatalabels(labels, translate: TranslateService) {
		return {
			backgroundColor: context =>
				context.dataset.type === 'bubble'
					? null
					: context.dataset.backgroundColor && context.dataset.backgroundColor !== 'transparent'
					? context.dataset.backgroundColor
					: context.dataset.borderColor,
			borderRadius: context => (context.dataset.type === 'bubble' ? null : 4),
			align: context => (context.dataset.type === 'bubble' ? 'center' : 'end'),
			anchor: context => (context.dataset.type === 'bubble' ? 'center' : 'end'),
			color: context => (context.dataset.label === translate.instant('intensity') ? '#fafafa' : 'black'),
			display: context =>
				context.dataset.type === 'bubble'
					? context.dataset.data[context.dataIndex].y > 0
					: labels
					? context.dataset.data[context.dataIndex] > 0
					: false,
			font: {
				weight: 'bold',
				size: 11
			} as Font,
			formatter: (value, context) => (context.dataset.type === 'bubble' ? value.y : value)
		};
	}

	private getEwmaValue(data: Map<string, AdvancedMetricData[]>, value: EWMAValues): string[] {
		const map = new Map(Object.entries(data));
		return Array.from(map.keys()).map(d => {
			const values: number[] = map.get(d).map((metricData: AdvancedMetricData) => metricData.values[value]);
			const average: string = isNaN(meanBy(values)) ? '0' : meanBy(values).toFixed(1);
			return average;
		});
	}

	/**
	 *  brightness is a value between 0 and 1
	 *  0 -> no brightness added -> color is the same
	 *  1 -> full brightness added -> color is white (FF in hex)
	 */
	private tintBackgroundColor(backgroundColors: string[], brightness: number) {
		return backgroundColors.map(backgroundColor => {
			const rgb = this.hexToRgb(backgroundColor);
			const tintedRgb = this.tintRgb(rgb, brightness);
			return '#' + tintedRgb.r.toString(16) + tintedRgb.g.toString(16) + tintedRgb.b.toString(16);
		});
	}

	private tintRgb(rgb: { r: number; g: number; b: number }, alpha: number) {
		const r = Math.ceil(rgb.r + (255 - rgb.r) * alpha);
		const g = Math.ceil(rgb.g + (255 - rgb.g) * alpha);
		const b = Math.ceil(rgb.b + (255 - rgb.b) * alpha);
		return { r, g, b };
	}

	private hexToRgb(hex) {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16)
			  }
			: null;
	}
}

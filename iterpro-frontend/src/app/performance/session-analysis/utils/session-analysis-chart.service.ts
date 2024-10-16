import { Injectable } from '@angular/core';
import { DeviceMetricDescriptor, Threshold } from '@iterpro/shared/data-access/sdk';
import {
	ADVANCED_COLORS,
	PRIMARIES,
	annotations,
	copyValue,
	getDataLabels,
	getDefaultCartesianConfig,
	getDefaultRadarConfig,
	getMomentFormatFromStorage,
	getStandardYAxis,
	getThresholdActiveValue,
	getTimeseriesXAxis,
	isNotEmpty,
	radarBackground
} from '@iterpro/shared/utils/common-utils';
import { BubbleDataPoint, ChartData, ChartDataset, ChartOptions } from 'chart.js';
import { flatten, isArray, max } from 'lodash';
import * as moment from 'moment';
import { ChartFlags } from './../../../+state/session-analysis-store/ngrx/session-analysis-store.interfaces';
import { TranslateService } from '@ngx-translate/core';

export interface ChartInterfaceData {
	data: ChartData;
	options: ChartOptions;
}

@Injectable({
	providedIn: 'root'
})
export class SessionAnalysisChartService {
	axesIds = ['y', 'yB'];
	positions = ['left', 'right'];

	constructor(private translate: TranslateService) {
		moment().locale(this.translate.currentLang);
	}

	initCartesianChart() {
		return [{ datasets: [], labels: [] }, getDefaultCartesianConfig()];
	}

	initRadarChart() {
		return [{ datasets: [], labels: [] }, getDefaultRadarConfig()];
	}

	getDataSessionTeamBubble(data, categories): ChartDataset[] {
		const datasets: ChartDataset[] = [
			{
				data: data[0].map((x, i) => ({
					x: Number(x).toFixed(1),
					y: Number(data[1][i]).toFixed(1),
					r: Number(data[2][i]).toFixed(1),
					name: categories[i]
				})),
				type: 'bubble',
				borderColor: PRIMARIES[0],
				backgroundColor: `${PRIMARIES[0]}80`
			}
		];

		return datasets;
	}

	getOptionsSessionTeamBubble(data, metrics) {
		const options: ChartOptions = { ...getDefaultCartesianConfig('linear') };
		options.responsive = true;
		options.maintainAspectRatio = true;
		(options.scales.x as any).title = {
			display: true,
			text: metrics[0].metricLabel,
			color: '#ddd'
		};
		(options.scales.y as any).title = {
			display: true,
			text: metrics[1].metricLabel,
			color: '#ddd'
		};
		options.elements = {
			point: {
				radius: context => {
					const dataValues = (context.dataset.data as BubbleDataPoint[]).map(x => Number(x.r));
					const maxValue = Math.max(...dataValues);
					const value = context.dataset.data[context.dataIndex] as BubbleDataPoint;
					const size = context.chart.width;
					const base = Math.abs(value.r) / maxValue;
					return (size / 24) * base;
				}
			}
		};
		options.plugins.legend = {
			display: false
		};
		options.plugins.tooltip = {
			callbacks: {
				title: ([{ raw }, ...{}]: any[]) => raw.name,
				label: ({ raw }: any) =>
					`${metrics[0].metricLabel}: ${raw.x}; ${metrics[1].metricLabel}: ${raw.y}; ${metrics[2].metricLabel}: ${raw.r}`
			}
		};

		return options;
	}

	getDataSessionTeam(data: any, selectedMetrics: DeviceMetricDescriptor[], thresholdsMap: any, chartFlags: ChartFlags): ChartDataset[] {
		const datasets = [];
		selectedMetrics.forEach((metric, index) => {
			const threshold = Object.values(thresholdsMap).map(value => value[selectedMetrics[index].metricName]);
			datasets.push({
				label: metric.metricLabel,
				backgroundColor: chartFlags.thresholds ? data[index].map(text => this.getColorText(text)) : PRIMARIES[index],
				data: data[index],
				yAxisID: this.axesIds[index],
				datalabels: chartFlags.thresholds
					? this.getThresholdsLabels(threshold, chartFlags.thresholds)
					: chartFlags.labels
						? getDataLabels(chartFlags.labels, chartFlags.percent)
						: {},
				barPercentage: 0.8,
				categoryPercentage: 0.5
			});
		});

		return datasets;
	}

	getOptionsSessionTeam(data, metrics: DeviceMetricDescriptor[], percent: boolean, visible: boolean): ChartOptions {
		const options = { ...getDefaultCartesianConfig('category'), responsive: true, maintainAspectRatio: true };
		let axes = {};

		metrics.forEach(({}, index) => {
			axes = {
				...axes,
				[this.axesIds[index]]: getStandardYAxis(index, { suggestedMin: 0 })
			};
		});
		(options.scales as any) = {
			...options.scales,
			...axes,
			x: {
				...options.scales.x,
				stacked: false
			}
		};

		options.plugins.tooltip = {
			mode: 'index',
			intersect: false,
			callbacks: {
				label: ({ dataset, formattedValue }) => {
					return `${dataset.label}: ${formattedValue}${percent || visible ? '%' : ''}`;
				}
			}
		};
		options.plugins.annotation = { annotations: this.getAnnotations(data, metrics, visible) };

		if (percent || visible) {
			Object.entries(options.scales).forEach(([key, { ticks, suggestedMax, grace }]: [string, any]) => {
				if (key.includes('y')) {
					ticks.callback = (value, index, ticksArr) => (value % 1 === 0 && index === ticksArr.length - 1 ? value + '%' : value);
					suggestedMax = Math.floor(max(flatten(data).filter((n: number) => !isNaN(n) && n !== Infinity)) as number);
					grace = '10%';
				}
			});
			if (visible) {
				options.plugins.annotation.annotations = this.getThresholdsAnnotations(options.plugins.annotation.annotations);
			}
		}

		return options;
	}

	getDataSessionIndividual(data, metrics, labels) {
		const datasets = [];

		metrics.forEach((metric, index) => {
			datasets.push({
				data: data[index],
				backgroundColor: PRIMARIES[index],
				label: metric.metricLabel,
				yAxisID: this.axesIds[index],
				datalabels: labels ? getDataLabels(labels) : {}
			});
		});

		return datasets;
	}

	getOptionsSessionIndividual(percent, metrics) {
		const options = { ...getDefaultCartesianConfig(), responsive: true };

		let axes = {};
		metrics.forEach(({}, index) => {
			axes = {
				...axes,
				[this.axesIds[index]]: getStandardYAxis(index)
			};
		});
		options.scales = {
			...options.scales,
			...axes
		};

		if (percent) {
			Object.entries(options.scales).forEach(([key, { ticks, suggestedMax, grace }]: [string, any]) => {
				if (key.includes('y')) {
					ticks.callback = (value, index, ticksArr) => (value % 1 === 0 && index === ticksArr.length - 1 ? value + '%' : value);
					suggestedMax = 100;
					grace = '10%';
				}
			});
		}

		options.plugins.tooltip = {
			mode: 'index',
			intersect: false
		};

		options.plugins.annotation = {};

		return options;
	}

	getRadarDataSessionIndividual(data, metrics): ChartData {
		const labelsArray: string[] = metrics.map(x => this.formatLabel(x, 25));
		return {
			labels: labelsArray,
			datasets: [
				{
					data,
					backgroundColor: radarBackground,
					borderColor: PRIMARIES[0],
					pointBackgroundColor: PRIMARIES[0],
					pointBorderColor: '#fff',
					pointHoverBackgroundColor: PRIMARIES[0],
					pointHoverBorderColor: PRIMARIES[0],
					tension: 0
				}
			]
		};
	}

	getRadarOptionsSessionIndividual(absolute): ChartOptions {
		const options = { ...getDefaultRadarConfig() };
		options.plugins.tooltip = {
			callbacks: {
				title: ([{ label }, ...{}]) => <string | string[]>(isArray(label) ? (label as any).join(' ') : label),
				label: ({ dataIndex }) => {
					if (absolute) {
						return `Absolute: ${Number(absolute[dataIndex]).toFixed(1)}`;
					}
				},
				afterLabel: ({ formattedValue }) => `Thresholds %: ${formattedValue}%`
			},
			displayColors: false
		};

		return options;
	}

	getDataPeriodTrend(
		data: any[][],
		metrics: DeviceMetricDescriptor[],
		thresholds: Threshold | Threshold[],
		visible: boolean,
		labels: boolean
	): any[] {
		const datasets: any[] = [];

		// LINE CHART
		if (metrics[1]) {
			datasets.push({
				data: data[2].map(value => Number(value)),
				yAxisID: this.axesIds[1],
				xAxisID: 'x',
				type: 'line',
				fill: false,
				pointRadius: 0,
				borderWidth: 2,
				borderColor: PRIMARIES[7],
				pointBorderColor: PRIMARIES[6],
				pointBackgroundColor: PRIMARIES[6],
				pointHoverBackgroundColor: PRIMARIES[5],
				pointHoverBorderColor: '#fff',
				label: metrics[1].metricLabel,
				cubicInterpolationMode: 'monotone',
				datalabels: thresholds && visible ? this.getThresholdsLabels(thresholds, visible) : labels ? getDataLabels(labels) : {}
			});
		}

		// SERIES 0
		datasets.push({
			data: data[0].map(value => Number(value)),
			yAxisID: this.axesIds[0],
			xAxisID: 'x',
			type: 'bar',
			backgroundColor: PRIMARIES[0],
			label: metrics[0] ? `${metrics[0].metricLabel} - [S0]` : '',
			datalabels: labels ? getDataLabels(labels) : {}
		});

		// SERIES 1
		datasets.push({
			data: data[1].map(value => Number(value)),
			yAxisID: this.axesIds[0],
			xAxisID: 'x',
			type: 'bar',
			backgroundColor: PRIMARIES[1],
			label: metrics[0] ? `${metrics[0].metricLabel} - [S1]` : '',
			datalabels: labels ? getDataLabels(labels) : {}
		});

		return datasets;
	}

	getOptionsPeriodTrend(metrics, percent, calendar, eventData, language) {
		const options = { ...getDefaultCartesianConfig() };
		let axes = {};
		metrics.forEach((_, index) => {
			axes = {
				...axes,
				[this.axesIds[index]]: getStandardYAxis(index, { suggestedMin: 0, stacked: true })
			};
		});

		if (percent) {
			Object.entries(options.scales).forEach(([key, { ticks, suggestedMax, grace }]: [string, any]) => {
				if (key.includes('y')) {
					ticks.callback = (value, index, ticksArr) => (value % 1 === 0 && index === ticksArr.length - 1 ? value + '%' : value);
					suggestedMax = 100;
					grace = '10%';
				}
			});
		}
		options.scales = {
			...options.scales,
			...axes
		};
		options.scales.x = getTimeseriesXAxis(options.scales.x, calendar);

		options.plugins.tooltip = {
			mode: 'index',
			intersect: false,
			callbacks: {
				title: ([{ label }, ...{}]) => {
					const date = moment(label);
					return `${date.format(`${getMomentFormatFromStorage()} ddd`)} (${calendar.getGD(date.toDate())})`;
				},
				afterTitle: ([{ label }, ...{}]) => {
					const formattedDate = moment(label).format(getMomentFormatFromStorage());
					const eventDataObj = eventData[formattedDate];
					const opponent = eventDataObj && eventDataObj.opponent ? eventDataObj.opponent : '';
					const result = eventDataObj && eventDataObj.result ? eventDataObj.result : '';
					let homeValue = eventDataObj && eventDataObj.home ? eventDataObj.home : null;
					homeValue = homeValue === null ? '(A)' : homeValue ? '(H)' : '(A)';
					const home = opponent !== '' || result !== '' ? homeValue : '';
					return `${opponent} ${result} ${home}`;
				},
				label: ({ dataset, formattedValue }) => `${dataset.label}: ${formattedValue}`
			}
		};
		options.plugins.annotation = {};
		// options.overlayBars = false;
		options.responsive = true;
		options.maintainAspectRatio = true;

		return options;
	}

	getDataAdvanced(datasets, axes, type, labels, flags: ChartFlags): any {
		const data = [];

		datasets.forEach((d, index) => {
			const obj = {
				yAxisID: axes[index],
				xAxisID: 'x',
				data: flatten(d),
				type,
				backgroundColor: ADVANCED_COLORS[index],
				label: labels[index],
				barPercentage: 0.8,
				categoryPercentage: 0.5,
				datalabels: flags.labels ? getDataLabels(true) : {}
			};

			if (type === 'line') {
				obj['borderColor'] = ADVANCED_COLORS[index];
				obj['pointBorderColor'] = ADVANCED_COLORS[index];
				obj['pointBackgroundColor'] = ADVANCED_COLORS[index];
				obj['pointHoverBackgroundColor'] = ADVANCED_COLORS[index];
				obj['pointHoverBorderColor'] = '#fff';
				obj['cubicInterpolationMode'] = 'monotone';
				obj['borderJoinStyle'] = 'miter';
				obj['pointRadius'] = 0;
				obj['borderWidth'] = 2;
				obj['order'] = 1;
				obj['yAxisID'] = obj['yAxisID'] === 'y' ? 'yA2' : obj['yAxisID'];
			}

			data.push(obj);
		});

		return data;
	}

	getOptionAdvanced(data, axes, view, type, calendar, opt?, ewma?) {
		const options = copyValue(getDefaultCartesianConfig());

		if (!options.scales.yB && axes.includes('yB')) {
			options.scales = {
				...options.scales,
				yB: {
					type: 'linear',
					position: 'right',
					grid: {
						color: 'transparent'
					},
					border: { display: false },
					min: 0,
					beginAtZero: true,
					ticks: {
						color: '#ddd'
					},
					stacked: false
				}
			};
		}

		if (opt === true) {
			options.scales.yB.beginAtZero = false;
			options.scales.yB.min = undefined;
			if (view === 0) {
				options.scales.y.beginAtZero = false;
				options.scales.y.min = undefined;
			}
		}

		if (view === 1) {
			options.scales.x = getTimeseriesXAxis(options.scales.x, calendar);
		}

		if (type === 'line') {
			options.scales = {
				...options.scales,
				yA2: {
					display: false,
					position: 'left',
					stacked: false,
					grid: {
						color: 'transparent'
					},
					border: { display: false },
					beginAtZero: true,
					min: 0,
					max: options.scales.y.max,
					ticks: {
						color: '#ddd',
						callback: value => {
							if (value % 1 === 0) {
								return value;
							}
						},
						padding: 15
					}
				}
			};

			const bars = data.datasets.filter(({ yAxisID }) => yAxisID === 'y');
			const sums = bars[0].data.map((x, index) => x + bars[1].data[index]);
			options.scales.y.max = Math.ceil(Math.max.apply({}, sums));
			options.scales['yA2'].max = Math.ceil(Math.max.apply({}, sums));
		}

		options.plugins.tooltip = {
			...options.plugins.tooltip,
			mode: 'index',
			intersect: false
		};

		if (ewma)
			options.plugins.annotation = {
				annotations: {
					ewmaLow: {
						type: 'box',
						drawTime: 'beforeDatasetsDraw',
						yScaleID: 'yB',
						backgroundColor: 'rgba(0, 204, 106, 0.3)',
						borderColor: 'transparent',
						borderWidth: 0,
						yMin: 0.8,
						yMax: 1.3
					},
					ewmaMedium: {
						type: 'box',
						drawTime: 'beforeDatasetsDraw',
						yScaleID: 'yB',
						backgroundColor: 'rgba(255, 255, 0, 0.3)',
						borderColor: 'transparent',
						borderWidth: 0,
						yMin: 1.3,
						yMax: 1.5
					},
					ewmaHigh: {
						type: 'box',
						drawTime: 'beforeDatasetsDraw',
						yScaleID: 'yB',
						backgroundColor: 'rgba(255, 0, 0, 0.3)',
						borderColor: 'transparent',
						borderWidth: 0,
						yMin: 1.5
					}
				}
			};

		options.responsive = true;
		options.maintainAspectRatio = true;

		return options;
	}

	getAnnotations(data, metrics, visible) {
		data.forEach((d, index) => {
			data[index] = d.filter(x => x).map(x => Number(x));
		});
		let annotationsData = {};
		if (isNotEmpty(data)) {
			metrics.forEach(({}, index) => {
				const sum = data[index].length > 0 ? data[index].reduce((a, b) => a + b) : 0;
				const avg = sum / data[index].length;
				annotationsData = {
					...annotationsData,
					[`${this.axesIds[index]}_ann`]: {
						type: 'line',
						scaleID: this.axesIds[index],
						value: avg,
						borderColor: visible ? this.getColorText(avg) : annotations[index],
						borderDash: [20, 20],
						borderWidth: 2,
						drawTime: 'beforeDatasetsDraw'
					}
				};
			});
		}
		return annotationsData;
	}

	getThresholdsAnnotations(optionAnnotations) {
		return {
			red: {
				type: 'box',
				drawTime: 'beforeDatasetsDraw',
				yScaleID: 'y',
				backgroundColor: 'rgba(158, 15, 15, 0.2)',
				borderColor: 'transparent',
				borderWidth: 0,
				yMin: 120,
				yMax: 150
			},
			orange: {
				type: 'box',
				drawTime: 'beforeDatasetsDraw',
				yScaleID: 'y',
				backgroundColor: 'rgba(228, 151, 12, 0.2)',
				borderColor: 'transparent',
				borderWidth: 0,
				yMin: 110,
				yMax: 120
			},
			green: {
				type: 'box',
				drawTime: 'beforeDatasetsDraw',
				yScaleID: 'y',
				backgroundColor: 'rgba(0, 142, 74, 0.2)',
				borderColor: 'transparent',
				borderWidth: 0,
				yMin: 90,
				yMax: 110
			},
			yellow: {
				type: 'box',
				drawTime: 'beforeDatasetsDraw',
				yScaleID: 'y',
				backgroundColor: 'rgba(204, 204, 0, 0.2)',
				borderColor: 'transparent',
				borderWidth: 0,
				yMin: 80,
				yMax: 90
			},
			grey: {
				type: 'box',
				drawTime: 'beforeDatasetsDraw',
				yScaleID: 'y',
				backgroundColor: 'rgba(172, 172, 172, 0.2)',
				borderColor: 'transparent',
				borderWidth: 0,
				yMax: 80,
				yMin: 0
			},
			...optionAnnotations
		};
	}

	getThresholdsLabels(thresholds: Threshold | Threshold[], visible: boolean) {
		return {
			align: 'end',
			anchor: 'end',
			backgroundColor: context => {
				const i = context.dataIndex;
				if (Array.isArray(thresholds) && thresholds[i]) {
					const threshold = thresholds[i];
					const thresholdActiveValue = getThresholdActiveValue(threshold);
					if (threshold && thresholdActiveValue) {
						return 'rgba(255, 255, 255, 0.9)';
					} else {
						return 'transparent';
					}
				}
			},
			borderRadius: 4,
			borderWidth: 0,
			color: context => {
				const i = context.dataIndex;
				if (Array.isArray(thresholds) && thresholds[i]) {
					const value = context.dataset.data[i];
					const threshold = thresholds[i];
					const thresholdActiveValue = getThresholdActiveValue(threshold);
					let colorText = 'white';
					if (threshold && thresholdActiveValue) {
						colorText = this.getColorText(value);
					}
					return colorText;
				}
				return 'white';
			},
			font: {
				size: 14,
				weight: 'normal'
			},
			offset: 20,
			display: context => {
				const i = context.dataIndex;
				const value = context.dataset.data[i];
				return value > 0 && thresholds[i] && thresholds[i].value && thresholds[i].intervals && visible;
			},
			formatter: (value, context) => {
				const i = context.dataIndex;
				if (Array.isArray(thresholds) && thresholds[i]) {
					const val = context.dataset.data[i];
					const threshold = thresholds[i];
					const thresholdActiveValue = getThresholdActiveValue(threshold);
					if (threshold && thresholdActiveValue) {
						const perc = (val / thresholdActiveValue) * 100;
						const percNumber = Number(val).toFixed(0);
						const glyph = perc < 100 ? '\u25BC' : '\u25B2';
						return glyph + ' ' + percNumber + '%';
					}
				}
				return '';
			}
		};
	}

	formatLabel(str, maxwidth) {
		const sections = [];
		const words = str.split(' ');
		let temp = '';

		words.forEach((item, index) => {
			if (temp.length > 0) {
				const concat = temp + ' ' + item;
				if (concat.length > maxwidth) {
					sections.push(temp);
					temp = '';
				} else {
					if (index === words.length - 1) {
						sections.push(concat);
						return;
					} else {
						temp = concat;
						return;
					}
				}
			}
			if (index === words.length - 1) {
				sections.push(item);
				return;
			}

			if (item.length < maxwidth) {
				temp = item;
			} else {
				sections.push(item);
			}
		});
		return sections;
	}

	getColorText(value: number): string {
		let colorText = 'transparent';
		value = Number(value);
		if (value < 80) colorText = 'grey';
		else if (value >= 80 && value < 90) colorText = 'yellow';
		else if (value >= 90 && value < 110) colorText = 'green';
		else if (value >= 110 && value < 120) colorText = 'orange';
		else colorText = 'red';
		return colorText;
	}
}

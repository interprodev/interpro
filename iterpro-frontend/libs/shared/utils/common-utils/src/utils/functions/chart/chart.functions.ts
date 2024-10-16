import { ChartOptionsWithLabels, PluginChartOptionsWithLabels } from '@iterpro/shared/data-access/sdk';
import { Color, Plugin } from 'chart.js';
import { Context } from 'chartjs-plugin-datalabels';
import { Options } from 'chartjs-plugin-datalabels/types/options';
import chroma from 'chroma-js';
import * as moment from 'moment';
import { Moment } from 'moment';
import { CalendarService } from '../../../services/calendar.service';
import { getMomentFormatFromStorage } from '../../dates/date-format.util';
import { toShortNumber } from '@iterpro/shared/ui/pipes';

export const getStandardYAxis = (index = 0, options?: any): any => {
	const positions = ['left', 'right'];
	return {
		// beginAtZero: true,
		grid: {
			color: index === 0 ? '#333' : 'transparent',
			display: index === 0,
			drawBorder: false
		},
		// min: 0,
		position: positions[index],
		stacked: false,
		ticks: {
			color: '#ddd',
			callback: (value: number) => {
				if (value % 1 === 0) {
					return value;
				}
			},
			padding: 15
		},
		type: 'linear',
		...options
	};
};

export const getTimeseriesXAxis = (
	axis: any,
	calendarService?: CalendarService,
	format: 'day' | 'month' | 'monthShort' | 'quarter' | 'year' = 'day'
) => {
	return {
		...(axis || {}),
		bounds: 'ticks',
		stacked: true,
		time: {
			minUnit: 'day',
			displayFormats: {
				day: `${getMomentFormatFromStorage()} ddd`,
				month: 'MMMM YYYY',
				quarter: 'MMMM YYYY',
				year: 'YYYY'
			}
		},
		ticks: {
			...(axis || {}).ticks,
			// source: 'data',
			callback: (value: any, index: number, values: any[]) => {
				const date: Moment = values && values.length > 0 ? moment(values[index].value) : moment(new Date(value));
				const baseLabel = date.format(getDateFormatted(format));
				return calendarService ? `${baseLabel} (${calendarService.getGD(date.toDate())})` : baseLabel;
			}
		},
		type: 'time'
	};
};

function getDateFormatted(format: 'day' | 'month' | 'monthShort' | 'quarter' | 'year' = 'day'): string {
	switch (format) {
		case 'day':
			return `${getMomentFormatFromStorage()} ddd`;
		case 'month':
			return 'MMMM YYYY';
		case 'monthShort':
			return 'MMM YYYY';
		case 'quarter':
			return 'MMMM YYYY';
		case 'year':
			return 'YYYY';
	}
}

export const getDefaultCartesianConfig = (
	type?: 'linear' | 'logarithmic' | 'category' | 'time' | 'timeseries' | 'radialLinear'
): ChartOptionsWithLabels => ({
	responsive: false,
	maintainAspectRatio: false,
	plugins: {
		datalabels: {
			display: false
		},
		legend: {
			display: true,
			labels: {
				color: '#ddd',
				padding: 10
			}
		},
		tooltip: {
			mode: 'index',
			intersect: false
		}
	},
	layout: {
		padding: {}
	},
	scales: {
		x: {
			grid: {
				display: false,
				color: '#333'
			},
			border: {
				display: false
			},
			stacked: false,
			ticks: {
				color: '#ddd',
				autoSkip: false
			},
			type: type || 'category'
		},
		y: getStandardYAxis()
	}
});

export const getDefaultRadarConfig: () => ChartOptionsWithLabels = (): ChartOptionsWithLabels => ({
	responsive: true,
	plugins: {
		datalabels: {
			display: false
		},
		legend: {
			display: false
		},
		tooltip: {}
	},
	scales: {
		r: {
			beginAtZero: true,
			min: 0,
			max: 100,
			ticks: {
				showLabelBackdrop: false,
				display: false,
				color: '#ddd'
			},
			pointLabels: {
				color: '#ddd'
			},
			angleLines: {
				color: '#333333'
			},
			grid: {
				color: '#333333'
			}
		}
	}
});

export const getDefaultPieConfig: () => any = (): PluginChartOptionsWithLabels<any> => {
	return {
		plugins: {
			datalabels: {
				display: true,
				font: {
					weight: 'bold',
					size: 18,
					family: 'Gotham'
				},
				color(data: any) {
					const rgb: [number, number, number] = chroma(data.dataset.backgroundColor[data.dataIndex]).rgb();
					const threshold = 140;
					const luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
					return luminance > threshold ? '#333333' : '#dddddd';
				},
				formatter(value: number) {
					return value === 0 ? '' : value;
				}
			},
			legend: {
				display: true,
				labels: {
					color: '#ddd',
					padding: 10
				}
			},
			tooltip: {
				callbacks: {
					label: (context: any) => {
						const dataset = context.dataset;
						const total = (dataset.data as number[]).reduce(
							(previousValue, currentValue) => previousValue + currentValue,
							0
						);
						const curr = context.parsed as number;
						const precentage = Math.floor((curr / total) * 100 + 0.5);
						return precentage + '%';
					}
				}
			}
		}
	};
};

export const hexToRgbA = (hex: string) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
				a: 0.5
			}
		: null;
};

// export const round = value => Number(Number(value).toFixed(1));

// nestedObjectKey example y
export const getDataLabels = (
	hasDatalabels: boolean,
	percent?: boolean,
	nestedObjectKey?: string,
	backgroundColor?: string
): Options => {
	if (hasDatalabels) {
		return {
			backgroundColor: (context: Context) => {
				return (
					backgroundColor
						? backgroundColor
						: context.dataset.backgroundColor
							? context.dataset.backgroundColor
							: context.dataset.borderColor
				) as Color;
			},
			color: 'black',
			borderRadius: 4,
			borderWidth: 1.5,
			borderColor: '#333333',
			align: 'center',
			anchor: 'center',
			clamp: true,
			font: { weight: 'bold', size: 10 },
			display: (context: Context) => {
				const data: any = context.dataset.data[context.dataIndex];
				const value = nestedObjectKey ? data[nestedObjectKey] : data;
				return !!value && Number(value) !== 0;
			},
			formatter: value => {
				const data = Number(nestedObjectKey ? value[nestedObjectKey] : value);
				return `${toShortNumber(Number(data.toFixed(1)))}${percent ? '%' : ''}`;
			}
		};
	}

	return {};
};

export const formatLabel = (str: string, maxwidth: number) => {
	const sections: any[] = [];
	const words = str.split(' ');
	let temp = '';

	words.forEach((item: string, index: number) => {
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
};

export const normalizeBubbleRadius = (numbers: number[] | string[]): number[] => {
	const ratio = Math.max(...numbers.map(v => Number(v))) / 10;
	return numbers.map(v => Math.round(Number(v) / ratio));
};

export const legendMargin: Plugin = {
	id: 'legendMargin',
	afterInit(chart: any) {
		// Get a reference to the original fit function
		const fitValue = chart.legend?.fit;
		chart.legend.fit = function fit() {
			fitValue.bind(chart.legend)();
			return (this.height += 24);
		};
	}
};

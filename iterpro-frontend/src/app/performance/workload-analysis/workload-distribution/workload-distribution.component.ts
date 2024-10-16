import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
	CalendarService,
	WORKLOAD_COLORS,
	clearAndCopyCircularJSON,
	getBackendFormat,
	getDefaultCartesianConfig,
	getMomentFormatFromStorage,
	getTimeseriesXAxis,
	isNotEmpty,
	workloadLabels
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { Font } from 'chartjs-plugin-datalabels/types/options';
import * as moment from 'moment';

@Component({
	selector: 'iterpro-workload-distribution',
	templateUrl: './workload-distribution.component.html'
})
export class WorkloadDistributionComponent implements OnChanges {
	@Input() data: any;
	@Input() period: Date[]; // [startDate, endDate]
	@Input() labels: boolean;

	window: Date[];

	dataBreakdown: any;
	optionsBreakdown: any;
	dataComposition: any;
	optionsComposition: any;
	colors: Map<string, string> = new Map<string, string>();

	constructor(private readonly translateService: TranslateService, private readonly calendarService: CalendarService) {
		this.colors.set('workload', '#ffffff');
		this.colors.set('intensity', '#F61111');
		this.colors.set('cardio', '#a05195');
		this.colors.set('kinematic', '#2f4b7c');
		this.colors.set('mechanical', '#14B85E');
		this.colors.set('metabolic', '#F7C31A');
		this.colors.set('perceived', '#ADD8E6');
		moment().locale(this.translateService.currentLang);
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['data'] && this.data && !this.data['ewma']) {
			/**
			 * Split period in chucks / windows
			 * If period is less than 7 days no need to breakdown chart in chunks
			 **/
			const periodDuration: number = moment(this.period[1]).diff(moment(this.period[0]), 'day');

			if (periodDuration <= 7) {
				this.window = this.period;
			} else {
				this.window = [moment(this.period[1]).subtract(1, 'week').toDate(), this.period[1]];
			}

			this.renderBreakdown(this.data.workload_distribution, this.window);
			this.renderComposition(this.data.workload_distribution);
		}

		if (changes.labels && this.data) this.renderBreakdown(this.data.workload_distribution, this.window);
	}

	getBreakdown(data, window: Date[]) {
		let categories: any[] = Object.keys(data.avg_values).map(x => moment(x, getBackendFormat()));
		let values = Object.values(data.avg_values);

		const startIndex = categories.findIndex(
			x => moment(x).format(getBackendFormat()) === moment(window[0]).format(getBackendFormat())
		);
		const endIndex = categories.findIndex(
			x => moment(x).format(getBackendFormat()) === moment(window[1]).format(getBackendFormat())
		);

		categories = categories.slice(startIndex, endIndex + 1);
		values = values.slice(startIndex, endIndex + 1);

		const load = values.map(({ workload }, i) => ({
			x: categories[i],
			y: Number(workload).toFixed(1),
			r: !workload || workload === 0 ? 0 : 12
		}));
		const intensity = values.map(({ intensity }, i) => ({
			x: categories[i],
			y: Number(intensity).toFixed(1),
			r: !intensity || intensity === 0 ? 0 : 12
		}));
		const cardio = values.map(({ cardio }) => Number(cardio).toFixed(1));
		const kinematic = values.map(({ kinematic }) => Number(kinematic).toFixed(1));
		const mechanical = values.map(({ mechanical }) => Number(mechanical).toFixed(1));
		const metabolic = values.map(({ metabolic }) => Number(metabolic).toFixed(1));
		const perceived = values.map(({ perceived }) => Number(perceived).toFixed(1));
		const results = values.map(({ eventResult }) => eventResult);
		const opponents = values.map(({ opponent }) => opponent);
		const homes = values.map(({ home }) => home);

		const dataBreakdown = {
			labels: categories,
			datasets: [
				{
					data: load,
					yAxisID: 'yB',
					type: 'bubble',
					backgroundColor: this.colors.get('workload'),
					label: this.translateService.instant('workload')
				},
				{
					data: intensity,
					yAxisID: 'y',
					type: 'bubble',
					backgroundColor: this.colors.get('intensity'),
					label: this.translateService.instant('intensity')
				},
				{
					data: cardio,
					yAxisID: 'y',
					type: 'bar',
					backgroundColor: this.colors.get('cardio'),
					label: this.translateService.instant('cardio')
				},
				{
					data: kinematic,
					yAxisID: 'y',
					type: 'bar',
					backgroundColor: this.colors.get('kinematic'),
					label: this.translateService.instant('kinematic')
				},
				{
					data: mechanical,
					yAxisID: 'y',
					type: 'bar',
					backgroundColor: this.colors.get('mechanical'),
					label: this.translateService.instant('mechanical')
				},
				{
					data: metabolic,
					yAxisID: 'y',
					type: 'bar',
					backgroundColor: this.colors.get('metabolic'),
					label: this.translateService.instant('metabolic')
				},
				{
					data: perceived,
					yAxisID: 'y',
					type: 'bar',
					backgroundColor: this.colors.get('perceived'),
					label: this.translateService.instant('perceived')
				}
			]
		};

		const optionsBreakdown = {
			...getDefaultCartesianConfig()
		};
		optionsBreakdown.plugins.datalabels = this.getDatalabels(this.labels);
		optionsBreakdown.scales = {
			...optionsBreakdown.scales,
			yB: {
				position: 'right',
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
						if (value === 1) return this.translateService.instant('event.effort.1');
						else if (value === 2) return this.translateService.instant('event.effort.2');
						else if (value === 3) return this.translateService.instant('event.effort.3');
						else if (value === 4) return this.translateService.instant('event.effort.4');
						else if (value === 5) return this.translateService.instant('event.effort.5');
						else if (value === 6) return this.translateService.instant('event.effort.6');
						else return '';
					},
					padding: 15
				}
			}
		};
		optionsBreakdown.scales.y.max = 120;
		optionsBreakdown.scales.y.ticks.callback = (value: number, index, ticksArr) =>
			value % 1 === 0 && index === ticksArr.length - 1 ? value + '%' : value;
		optionsBreakdown.scales.x = getTimeseriesXAxis(optionsBreakdown.scales.x);
		(optionsBreakdown.scales.x as any).stacked = false;
		optionsBreakdown.scales.x.ticks.callback = (value, index, val: any) => {
			if (val && isNotEmpty(val)) {
				return this.calendarService.getGD(moment(val[index].value).toDate());
			}
		};

		optionsBreakdown.plugins.tooltip = {
			mode: 'index',
			intersect: false,
			callbacks: {
				title: ([{ label }]) => {
					const dateToGet = label;
					const formattedDate = moment(dateToGet).format(`${getMomentFormatFromStorage()} dddd`);
					return formattedDate;
				},
				afterTitle: ([tooltipItem]) => {
					const opp = opponents[tooltipItem.dataIndex];
					const res = results[tooltipItem.dataIndex];
					const h = homes[tooltipItem.dataIndex];
					if (opp) {
						return `${opp} ${res} (${h ? 'H' : 'A'})`;
					}
				},
				label: ({ formattedValue, dataset, parsed }) => {
					let value: any = formattedValue;
					if (dataset.label === this.translateService.instant('workload')) {
						value = `${workloadLabels(Math.ceil(parsed.y), this.translateService)} (${parsed.y})`;
					} else if (dataset.label === this.translateService.instant('intensity')) {
						value = parsed.y + '';
					}
					return dataset.label + ': ' + value;
				}
			}
		};

		return { dataBreakdown, optionsBreakdown };
	}

	renderBreakdown(data, window: Date[]): void {
		const { dataBreakdown, optionsBreakdown } = this.getBreakdown(data, window);
		this.dataBreakdown = dataBreakdown;
		this.optionsBreakdown = optionsBreakdown;
	}

	renderComposition(data) {
		const labels = [this.translateService.instant('game_load'), this.translateService.instant('training_load')];
		let datasets = [];

		const cat = Object.keys(data.percentage.game_load).sort();

		cat.forEach((x, index) => {
			datasets = [
				...datasets,
				{
					data: [data.percentage.game_load[x], data.percentage.training_load[x]],
					backgroundColor: WORKLOAD_COLORS.slice(2)[index],
					label: this.translateService.instant(x),
					barThickness: 20
				}
			];
		});

		this.dataComposition = {
			datasets: datasets,
			labels: labels
		};

		this.optionsComposition = {
			...getDefaultCartesianConfig(),
			indexAxis: 'y'
		};
		this.optionsComposition.plugins.legend.position = 'bottom';
		this.optionsComposition.plugins.datalabels = this.getHorizontalBarDataLabels();
		this.optionsComposition.scales = {
			x: {
				stacked: true,
				max: 100,
				display: false,
				ticks: {
					callback: (value, index, values) => (value % 1 === 0 && index === values.length - 1 ? value + '%' : value),
					color: '#333333',
					font: { color: '#ddd' }
				}
			},
			y: {
				stacked: true,
				display: false,
				ticks: {
					autoSkip: false,
					font: { color: '#ddd' },
					color: '#333333'
				}
			}
		};
		this.optionsComposition.plugins.tooltip = {
			callbacks: {
				label: ({ label, formattedValue }) => `${label}: ${Number(formattedValue).toFixed(0)}%`
			}
		};
	}

	getDatalabels(labels) {
		return {
			backgroundColor: context => {
				return context.dataset.type === 'bubble'
					? null
					: context.dataset.backgroundColor
					? context.dataset.backgroundColor
					: context.dataset.borderColor;
			},
			borderRadius: context => {
				return context.dataset.type === 'bubble' ? null : 4;
			},
			align: context => {
				return context.dataset.type === 'bubble' ? 'center' : 'end';
			},
			anchor: context => {
				return context.dataset.type === 'bubble' ? 'center' : 'end';
			},
			color: context => {
				return context.dataset.label === this.translateService.instant('intensity') ? '#fafafa' : 'black';
			},
			display: context => {
				return context.dataset.type === 'bubble'
					? context.dataset.data[context.dataIndex].y > 0
					: labels
					? context.dataset.data[context.dataIndex] > 0
					: false;
			},
			font: {
				weight: 'bold',
				size: 11
			} as Font,
			formatter: function (value, context) {
				return context.dataset.type === 'bubble' ? value.y : value;
			}
		};
	}

	getHorizontalBarDataLabels() {
		return {
			align: 'start',
			anchor: 'end',
			font: {
				weight: 'bold'
			},
			display: context => {
				return context.dataset.data[context.dataIndex] > 0;
			},
			color: 'white',
			formatter: value => {
				return Number(value).toFixed(0) + '%';
			}
		};
	}

	getPreviousWeekWindow(window) {
		const end = moment(window[1]).subtract(8, 'day').toDate();
		const start =
			moment(end).diff(moment(this.period[0]), 'day') <= 7
				? moment(this.period[0]).toDate()
				: moment(window[0]).subtract(8, 'day').toDate();
		return [start, end];
	}

	getPreviousWeek() {
		this.window = this.getPreviousWeekWindow(this.window);
		this.renderBreakdown(this.data.workload_distribution, this.window);
	}

	getNextWeekWindow(window) {
		let start;
		let end;
		if (moment(window[0]).isSame(this.period[0], 'day')) {
			end =
				moment(this.period[1]).diff(moment(this.period[0]), 'day') <= 7
					? moment(this.period[1]).toDate()
					: moment(window[1]).add(8, 'day').toDate();
			start = moment(end).subtract(1, 'week').toDate();
		} else {
			start = moment(window[0]).add(8, 'day').toDate();
			end =
				moment(this.period[1]).diff(moment(start), 'day') <= 7
					? moment(this.period[1]).toDate()
					: moment(window[1]).add(8, 'day').toDate();
		}
		return [start, end];
	}

	getWindows() {
		const windows = [this.window];
		let window = this.window;
		while (!this.hasNoNextWeekFlag(window)) {
			window = this.getNextWeekWindow(window);
			windows.push(window);
		}
		window = this.window;
		while (!this.hasNoPreviousWeekFlag(window)) {
			window = this.getPreviousWeekWindow(window);
			windows.unshift(window);
		}
		return windows;
	}

	getNextWeek() {
		this.window = this.getNextWeekWindow(this.window);
		this.renderBreakdown(this.data.workload_distribution, this.window);
	}

	hasNoPreviousWeekFlag(window) {
		return moment(this.period[0]).isBetween(moment(window[0]), moment(window[1]), 'day', '[]');
	}

	previousWeekFlag() {
		return this.hasNoPreviousWeekFlag(this.window);
	}

	hasNoNextWeekFlag(window) {
		return moment(this.period[1]).isBetween(moment(window[0]), moment(window[1]), 'day', '[]');
	}

	nextWeekFlag() {
		return this.hasNoNextWeekFlag(this.window);
	}

	getReport() {
		const windows = this.getWindows();
		const breakdowns = windows.map(window => this.getBreakdown(this.data.workload_distribution, window).dataBreakdown);
		const data = {
			breakdowns,
			breakdownOptions: this.optionsBreakdown,
			compositionData: clearAndCopyCircularJSON(this.dataComposition),
			compositionOptions: this.optionsComposition
		};

		return data;
	}
}

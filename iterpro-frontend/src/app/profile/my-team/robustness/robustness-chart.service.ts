import { inject, Injectable } from '@angular/core';
import { Injury, RobustnessData, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { CapitalizePipe } from '@iterpro/shared/ui/pipes';
import {
	getDefaultCartesianConfig,
	getDefaultPieConfig,
	getMomentFormatFromStorage,
	getTimeseriesXAxis,
	isNotEmpty
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { sortBy } from 'lodash';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
const moment = extendMoment(Moment);

@Injectable({
	providedIn: 'root',
})
export class RobustnessChartService {
	private palette = ['#FF4040', '#8100FF', '#ffff00', '#008000'];
	private paletteInner = ['#452363', '#F7C31A', '#8dbf7c'];
	private paletteBorder = ['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.6)'];

	readonly #capitalizePipe = inject(CapitalizePipe);
	readonly #translateService = inject(TranslateService);

	getChartPieData(robustnessData: RobustnessData): ChartData {
		const categories = Object.keys(robustnessData.breakdown).map(x => this.#capitalizePipe.transform(x));
		const categoriesStatus = Object.keys(robustnessData.breakdownStatus).map(x => this.#capitalizePipe.transform(x));
		const values = [
			{
				data: Object.values(robustnessData.breakdown).map(n => +Number(n).toFixed(1)),
				backgroundColor: this.palette,
				borderColor: this.paletteBorder,
				borderWidth: 0,
				labels: categories
			},
			{
				data: Object.values(robustnessData.breakdownStatus).map(n => +Number(n).toFixed(1)),
				backgroundColor: this.paletteInner,
				borderColor: this.paletteBorder,
				borderWidth: 0,
				labels: categoriesStatus
			}
		];

		return { datasets: values };
	}

	getChartPieOptions(): ChartOptions {
		const options: any = { ...getDefaultPieConfig() };
		options.plugins.legend = {
			display: false
		};
		options.plugins = {
			datalabels: {
				clip: true,
				anchor: 'start',
				align: 'center',
				borderColor: context => context.dataset.backgroundColor,
				borderWidth: 2,
				backgroundColor: 'rgba(0, 0, 0, 0.75)',
				color: '#e6e6e6',
				borderRadius: 5,
				padding: 3,
				display: context => context.dataset.data[context.dataIndex] > 0, // context => (context.dataset.data[context.dataIndex] > 0 ? 'auto' : false),
				formatter: (value, context) =>
					`${this.#translateService.instant(
						`tooltip.${context.dataset.labels[context.dataIndex].toLowerCase()}`
					)}: ${value}%`
			}
		};
		options.plugins.tooltip = {
			enabled: true,
			callbacks: {
				label: context => {
					const value = context.dataset.data[context.dataIndex];
					return `${this.#translateService.instant(
						`tooltip.${context.dataset.labels[context.dataIndex].toLowerCase()}`
					)}: ${value}%`;
				}
			}
		};

		return options;
	}

	getTimelineChart(season: TeamSeason, results: RobustnessData) {
		const rangeByDays = this.getSeasonRangeByDays(season);
		const daysMap = this.getDaysMap(rangeByDays, results);
		const data = this.getChartTimelineData(daysMap, rangeByDays);
		return {
			data,
			options: this.getChartTimelineOptions(daysMap, data, this.#capitalizePipe, this.#translateService)
		};
	}

	private getSeasonRangeByDays(season: TeamSeason): Moment.Moment[] {
		return Array.from(moment.range(moment(season.offseason), moment(season.inseasonEnd)).by('days'));
	}

	private getDaysMap(rangeByDays: Moment.Moment[], results: RobustnessData) {
		const daysMap = rangeByDays.reduce((mapObj: Map<string, number>, day: Moment.Moment) => {
			mapObj.set(day.format(getMomentFormatFromStorage()), null);
			return mapObj;
		}, new Map<string, number>());

		results.injuryMonthBreakDown.forEach((injury: Injury) => {
			const daysArray = Array.from(moment.range(moment(injury.date), moment(injury.endDate)).by('days'));
			daysArray.forEach(day => {
				const injuriesForDay: any = daysMap.get(moment(day).format(getMomentFormatFromStorage())) || [];
				injuriesForDay.unshift(injury);
				daysMap.set(moment(day).format(getMomentFormatFromStorage()), injuriesForDay);
			});
		});
		return daysMap;
	}

	private getAvailable(injuries: Injury[]): any {
		let availability = { available: 'yes' };
		(injuries || []).forEach(inj => {
			if (isNotEmpty(inj._injuryAssessments)) {
				inj._injuryAssessments = sortBy(inj._injuryAssessments, 'date').reverse();
				if (inj._injuryAssessments[0].available !== 'yes' && !moment().isSame(inj.endDate, 'day')) {
					availability = inj._injuryAssessments[0];
				}
			}
		});
		return availability;
	}

	private getChartTimelineData(daysMap, days): any {
		const values = Array.from(daysMap.values());

		const notAvailable = values.map((injuries: Injury[]) => {
			const availabilty = this.getAvailable(injuries);
			return Array.isArray(injuries) && availabilty.available === 'no' ? 1 : null;
		});
		const injured = values.map((injuries: Injury[]) =>
			Array.isArray(injuries) && injuries.some(({ issue }) => issue === 'medical.infirmary.details.issue.injury')
				? 1
				: null
		);
		const illness = values.map((injuries: Injury[]) =>
			Array.isArray(injuries) && injuries.some(({ issue }) => issue === 'medical.infirmary.details.issue.illness')
				? 1
				: null
		);
		const complaint = values.map((injuries: Injury[]) =>
			Array.isArray(injuries) && injuries.some(({ issue }) => issue === 'medical.infirmary.details.issue.complaint')
				? 1
				: null
		);

		const data = [
			{
				data: notAvailable,
				label: 'notAvailable',
				type: 'line',
				yAxisId: 'y',
				xAxisId: 'x',
				borderWidth: 5,
				borderColor: this.paletteInner[0],
				pointBorderColor: this.paletteInner[0],
				pointBackgroundColor: this.paletteInner[0],
				pointHoverBackgroundColor: this.paletteInner[0],
				pointHoverBorderColor: '#fff',
				borderCapStyle: 'butt',
				cubicInterpolationMode: 'monotone',
				pointHitRadius: 2
			},
			{
				data: injured,
				type: 'line',
				label: 'injured',
				yAxisId: 'y',
				xAxisId: 'x',
				borderWidth: 5,
				borderColor: this.palette[0],
				pointBorderColor: this.palette[0],
				pointBackgroundColor: this.palette[0],
				pointHoverBackgroundColor: this.palette[0],
				pointHoverBorderColor: '#fff',
				borderCapStyle: 'butt',
				cubicInterpolationMode: 'monotone',
				pointHitRadius: 2
			},
			{
				data: illness,
				type: 'line',
				label: 'illness',
				yAxisId: 'y',
				xAxisId: 'x',
				borderWidth: 5,
				borderColor: this.palette[1],
				pointBorderColor: this.palette[1],
				pointBackgroundColor: this.palette[1],
				pointHoverBackgroundColor: this.palette[1],
				pointHoverBorderColor: '#fff',
				borderCapStyle: 'butt',
				cubicInterpolationMode: 'monotone',
				pointHitRadius: 2
			},
			{
				data: complaint,
				type: 'line',
				label: 'complaint',
				yAxisId: 'y',
				xAxisId: 'x',
				borderWidth: 5,
				borderColor: this.palette[2],
				pointBorderColor: this.palette[2],
				pointBackgroundColor: this.palette[2],
				pointHoverBackgroundColor: this.palette[2],
				pointHoverBorderColor: '#fff',
				borderCapStyle: 'butt',
				cubicInterpolationMode: 'monotone',
				pointHitRadius: 2
			}
		];

		return { labels: days, datasets: data };
	}

	private getChartTimelineOptions(
		dataMap,
		data: ChartData,
		capitalize: CapitalizePipe,
		translate: TranslateService
	): ChartOptions {
		const options: any = {
			...getDefaultCartesianConfig(),
			animation: false,
			maintainAspectRatio: false,
			hover: { mode: null }
		};
		options.plugins.legend = {
			display: false
		};
		options.scales.y.ticks.display = false;
		options.scales.y.min = 0;
		options.scales.y.max = 2;
		options.scales.x = getTimeseriesXAxis(options.scales.x, null, 'monthShort');
		options.scales.x.grid.display = false;
		options.scales.x.time = {
			minUnit: 'month',
			displayFormats: {
				millisecond: 'MMM YY',
				second: 'MMM YY',
				minute: 'MMM YY',
				hour: 'MMM YY',
				day: 'MMM YY',
				week: 'MMM YY',
				month: 'MMM YY',
				quarter: 'MMM YY',
				year: 'MMM YY'
			}
		};

		options.plugins.tooltip = {
			mode: 'index',
			intersect: true,
			callbacks: {
				title: ([{ label }]) => moment(label).format(getMomentFormatFromStorage()),
				label: context => {
					const values = dataMap.get(moment(context.label).format(getMomentFormatFromStorage()));
					const value = values[values.length > 1 ? context.datasetIndex : 0];
					const osics = value?.osics ? ` - ${value?.osics}` : ``;
					if (Number(context.formattedValue)) {
						return `${translate.instant(value?.issue)} - ${translate.instant(value?.location)}${osics}`;
					}
				},
				footer: item =>
					item.some(({ formattedValue }) => formattedValue === '1')
						? `${translate.instant('tooltip.notAvailable')}`
						: ``
			}
		};

		return options;
	}
}

import { Injectable, inject } from '@angular/core';
import { DeviceMetricDescriptor, Player, TeamGroup } from '@iterpro/shared/data-access/sdk';
import { CalendarService, formatLabel } from '@iterpro/shared/utils/common-utils';
import { ChartData } from 'chart.js';
import { sortBy } from 'lodash';
import * as moment from 'moment';
import {
	AdvancedEnum,
	AdvancedMetricData,
	ChartFlags,
	Views
} from 'src/app/+state/session-analysis-store/ngrx/session-analysis-store.interfaces';
import { ChartInterfaceData, SessionAnalysisChartService } from './session-analysis-chart.service';

type AdvancedMetricLabels =
	| 'Acute Load'
	| 'Chronic Load'
	| 'AL/CL'
	| 'Weekly Monotony'
	| 'Monthly Monotony'
	| 'Weekly Strain'
	| 'Monthly Strain'
	| 'Training Stress Balance'
	| 'AL EWMA'
	| 'CL EWMA'
	| 'AL/CL EWMA';

@Injectable({
	providedIn: 'root'
})
export class AdvancedAnalysisService {
	readonly #chartService = inject(SessionAnalysisChartService);
	readonly #calendarService = inject(CalendarService);

	triggerAdvancedAnalysis(
		chartData: ChartData,
		advancedData: Map<string, AdvancedMetricData[]>,
		advancedMetric: AdvancedEnum,
		metric: DeviceMetricDescriptor,
		players: (Player | TeamGroup)[],
		view: Views,
		flags: ChartFlags,
		datePeriod?: Date[]
	): ChartInterfaceData {
		let dates: string[] = Array.from(advancedData.keys());
		let metricLabels: AdvancedMetricLabels[] = [];
		let datasets = [];
		let axesId = [];
		let opt = false;
		let ewma = false;

		if (view === Views.Period) {
			dates = [];
			let currentDate: Date = datePeriod[0];
			const endDate: Date = datePeriod[1];
			while (currentDate <= endDate) {
				const offsetDate = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000);
				dates.push(offsetDate.toISOString());
				currentDate = moment(currentDate).add(1, 'day').toDate();
			}
		}

		dates.forEach(date => {
			const filteredData: AdvancedMetricData[] = (advancedData.get(date) || []).filter(
				data => data.metric === metric.metricName
			);

			sortBy(players as Player[], 'displayName').forEach(player => {
				const playerData = filteredData.find(data => data.playerId === player.id);

				switch (advancedMetric) {
					case AdvancedEnum.ACWL: {
						datasets = [
							[...(datasets[0] || []), playerData ? playerData.values.acuteLoad : 0],
							[...(datasets[1] || []), playerData ? playerData.values.cronicLoad : 0],
							[...(datasets[2] || []), playerData ? playerData.values.alClRatio : 0]
						];

						metricLabels = ['Acute Load', 'Chronic Load', 'AL/CL'];
						axesId = ['y', 'y', 'yB'];
						ewma = true;

						break;
					}

					case AdvancedEnum.Monotony: {
						datasets = [
							[...(datasets[0] || []), playerData ? playerData.values.weeklyMonotony : 0],
							[...(datasets[1] || []), playerData ? playerData.values.monthlyMonotony : 0]
						];

						metricLabels = ['Weekly Monotony', 'Monthly Monotony'];
						axesId = ['yB', 'yB'];

						break;
					}

					case AdvancedEnum.Strain: {
						datasets = [
							[...(datasets[0] || []), playerData ? playerData.values.weeklyStrain : 0],
							[...(datasets[1] || []), playerData ? playerData.values.monthlyStrain : 0]
						];

						metricLabels = ['Weekly Strain', 'Monthly Strain'];
						axesId = ['yB', 'yB'];

						break;
					}

					case AdvancedEnum['Training Stress Balance']: {
						datasets = [[...(datasets[0] || []), playerData ? playerData.values.totalStressBalance : 0]];

						metricLabels = ['Training Stress Balance'];
						axesId = ['yB'];
						opt = true;

						break;
					}

					case AdvancedEnum['AL/CL EWMA']: {
						datasets = [
							[...(datasets[0] || []), playerData ? playerData.values.ewmaAcuteLoad : 0],
							[...(datasets[1] || []), playerData ? playerData.values.ewmaCronicLoad : 0],
							[...(datasets[2] || []), playerData ? playerData.values.ewmaAlCl : 0]
						];

						metricLabels = ['AL EWMA', 'CL EWMA', 'AL/CL EWMA'];
						axesId = ['y', 'y', 'yB'];
						ewma = true;

						break;
					}
				}
			});
		});

		return this.getAdvancedChart(chartData, datasets, metricLabels, axesId, view, metric, flags, opt, ewma);
	}

	getAdvancedChart(
		chartData: ChartData,
		datasets: any[],
		labels: AdvancedMetricLabels[],
		axesId,
		view: Views,
		metric: DeviceMetricDescriptor,
		flags: ChartFlags,
		opt = false,
		ewma = false
	): ChartInterfaceData {
		const type = view === Views.Session ? 'bar' : 'line';

		let chartData_data = [];

		if (chartData.datasets.length < 2 || view === Views.Session) {
			chartData_data = type === 'bar' ? [chartData.datasets[0]] : [chartData.datasets[chartData.datasets.length - 1]];
		} else {
			chartData_data =
				type === 'bar'
					? [chartData.datasets[0], chartData.datasets[1]]
					: [chartData.datasets[chartData.datasets.length - 2], chartData.datasets[chartData.datasets.length - 1]];
		}

		let categories: any[] = chartData.labels;

		const data: ChartData = {
			labels: [],
			datasets: []
		};

		chartData_data.forEach(x => data.datasets.push(x));
		data.labels = categories.map(x => (x.length > 10 ? formatLabel(x, 25) : x));
		data.datasets.push(...this.#chartService.getDataAdvanced(datasets, axesId, type, labels, flags));

		if (flags.order) {
			const metricsDatasets = data.datasets.map(d => d.data);
			[datasets, categories] = this.sortData(metricsDatasets, categories, metric.metricName + 'ASC', metric);
		}

		const chartDataResult: ChartInterfaceData = {
			data,
			options: this.#chartService.getOptionAdvanced(data, axesId, view, type, this.#calendarService, opt, ewma)
		};

		return chartDataResult;
	}

	sortData(data: any[][], categories: string[], orderLabel: string, metric: DeviceMetricDescriptor) {
		if (orderLabel) {
			const dataField =
				orderLabel === metric.metricName + 'ASC' || orderLabel === metric.metricName + 'DESC' ? 'd1' : 'd2';
			data[0]
				.map((v, i) => ({
					d1: Number(v),
					d2: Number(data[1][i]),
					c: categories[i]
				}))
				.sort((a, b) => (a[dataField] < b[dataField] ? -1 : a[dataField] === b[dataField] ? 0 : 1))
				.forEach((v, i) => {
					data[0][i] = v.d1;
					data[1][i] = v.d2;
					categories[i] = v.c;
				});

			if (orderLabel.indexOf('DESC') !== -1) {
				data[0] = data[0].reverse();
				data[1] = data[1].reverse();
				categories = categories.reverse();
			}
		}

		return [data, categories];
	}
}

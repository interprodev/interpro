import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { Player } from '@iterpro/shared/data-access/sdk';
import {
	PRIMARIES,
	clearAndCopyCircularJSON,
	getBackendFormat,
	getDataLabels,
	getDefaultCartesianConfig,
	getMomentFormatFromStorage,
	getThresholdActiveValue,
	legendMargin
} from '@iterpro/shared/utils/common-utils';
import { ChartData, Plugin } from 'chart.js';
import chroma from 'chroma-js';
import { flatten, fromPairs, isArray, omit, sortBy, uniq } from 'lodash';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';

@Component({
	selector: 'iterpro-test-analysis-period',
	templateUrl: './test-analysis-period.component.html',
	styleUrls: ['./test-analysis-period.component.css']
})
export class TestAnalysisPeriodComponent implements OnChanges {
	yAxesIds = ['y', 'yB'];
	positions = ['left', 'right'];
	options: any;
	data: ChartData;
	columns: string[] = [];
	columnsInDateFormat: Date[] = [];
	chartPlugins: Plugin[] = [];

	@Input() serverData: { chart: any; table: any[] };
	@Input() metrics: SelectItem[] = [];
	@Input() downloadReport: any;
	@Input() labels: boolean;
	@Input() percent: boolean;
	@Input() selectedPlayerPeriod: Player[] = [];

	ngOnChanges(changes: SimpleChanges) {
		this.data = null;
		if ((changes['serverData'] && changes['serverData'].currentValue) || changes['labels'] || changes['percent']) {
			if (this.serverData && this.serverData.chart) this.render(this.serverData.chart, this.labels, this.percent);
			if (this.serverData && this.serverData.table) this.renderTable(this.serverData.table);
		}
	}

	private renderTable(table: any[]) {
		if (table && table.length > 0) {
			this.columns = Object.keys(omit(table[0], 'playerId'));
			this.columnsInDateFormat = (this.columns || []).map(column => moment(column, getBackendFormat()).toDate());
		}
	}

	downloadPeriodReport() {
		const mapped = this.serverData.table.map(row => {
			const dates = omit(row, 'playerId');
			const object = Object.entries(dates).map(([date, value]) => ({
				date: moment(date, getMomentFormatFromStorage()).toDate(),
				value
			}));
			return {
				values: object.map(({ value }) => this.getValues(value)),
				playerName: this.getPlayerName(row.playerId)
			};
		});
		this.downloadReport(
			{
				data: clearAndCopyCircularJSON(this.data),
				options: this.options
			},
			{
				table: {
					columns: Object.keys(this.serverData.table[0]).filter(label => label !== 'playerId'),
					data: mapped
				}
			}
		);
	}

	private sortDates(data: { [key: string]: number }): { [key: string]: number } {
		if (!data) {
			return data;
		}
		const dataArray = Object.entries(data);

		// Sort the array based on the parsed date
		const sortedArray = sortBy(dataArray, ([date]) => moment(date, getMomentFormatFromStorage(), true).toDate());

		return fromPairs(sortedArray);
	}

	render(serverData: any, datalabels: boolean, percent: boolean) {
		const data = { ...serverData };
		const labels = uniq(flatten(Object.values(data).map(data => Object.keys(data))))
			.map(label => moment(label, getBackendFormat()).toDate())
			.sort((a, b) => a.getTime() - b.getTime())
			.map(date => moment(date).format(getMomentFormatFromStorage()));
		let datasets = [];

		const metricDatasets = this.metrics.map((selectedMetric, metricIndex) => {
			let dataset = [];
			this.selectedPlayerPeriod.forEach(player => {
				const playerThreshold = player._thresholdsTests.find(({ metric }) => metric === selectedMetric);
				const thresholdActiveValue = playerThreshold ? getThresholdActiveValue(playerThreshold) : 1;
				const playerData = data[`${player.id}_${metricIndex}`];
				const color = dataset[dataset.length - 1]
					? chroma(dataset[dataset.length - 1].borderColor)
							.darken(2 / this.selectedPlayerPeriod.length)
							.hex()
					: PRIMARIES[metricIndex];
				const entries = Object.entries(this.sortDates(playerData) || []).map(([x, y]) => {
					return {
						x: moment(x).toDate(),
						y: percent ? (Number(y) / thresholdActiveValue) * 100 : y
					};
				});
				if (playerData) {
					dataset = [
						...dataset,
						{
							label: `${player.displayName} - ${selectedMetric}`,
							data: entries.map(({ y }) => y),
							yAxisID: this.yAxesIds[metricIndex],
							backgroundColor: 'transparent',
							borderColor: color,
							pointBorderColor: color,
							pointBackgroundColor: color,
							pointHoverBackgroundColor: color,
							pointHoverBorderColor: '#fff',
							pointRadius: 5,
							borderWidth: 2,
							spanGaps: true,
							cubicInterpolationMode: 'monotone',
							datalabels: getDataLabels(datalabels, undefined, null, color)
						}
					];
				}
			});
			return dataset;
		});
		datasets = flatten(metricDatasets);

		this.data = {
			datasets,
			labels
		};

		this.options = {
			...getDefaultCartesianConfig(),
			responsive: true,
			maintainAspectRatio: true
		};

		this.chartPlugins = [legendMargin];
		// this.options.scales.x = getTimeseriesXAxis(this.options.scales.x, calendar);

		this.options.scales.y = {
			id: 'y',
			type: 'linear',
			position: 'left',
			grid: {
				color: '#333333',
				display: true
			},
			border: { display: false },
			ticks: {
				beginAtZero: true,
				callback: value => {
					if (value % 1 === 0) {
						return value;
					}
				},
				color: '#ddd',
				padding: 15
			},
			// suggestedMax: 100,
			stacked: false
		};

		if (this.metrics.length > 1) {
			this.setYAxesRight();
			if (percent) {
				this.setYAxesLeftForPercent();
				this.setYAxesRightForPercent();
				this.setTootipForPercent();
			} else {
				this.setYAxesLeft();
				this.setTooltip();
			}
		} else {
			if (percent) {
				this.setYAxesLeftForPercent();
				this.setTootipForPercent();
			} else {
				this.setYAxesLeft();
				this.setTooltip();
			}
		}
	}

	// Left side Y-Axis
	setYAxesLeft() {
		// (this.options.scales.y as any).beginAtZero = true;
		(this.options.scales.y as any).ticks = {
			color: '#ddd',
			callback: value => {
				if (value % 1 === 0) return value;
			}
		};
	}

	/**
	 * The right hand side / second Y-Axis need to be initailaised on request (when number of  selected metrics > 1 )
	 * If more than 1 metrics need to be displayed on chart then we use right side of y axis also.
	 */
	setYAxesRight() {
		this.options.scales = {
			...this.options.scales,
			yB: {
				type: 'linear',
				position: 'right',
				grid: {
					color: 'transparent',
					display: false
				},
				border: { display: false },
				beginAtZero: false,
				// min: 0,
				ticks: {
					color: '#ddd',
					callback: (value: number) => {
						if (value % 1 === 0) {
							return value;
						}
					},
					padding: 15
				},
				stacked: false
			}
		};
	}

	setYAxesLeftForPercent() {
		(this.options.scales.y as any).beginAtZero = true;
		this.options.scales.y.ticks = {
			color: '#ddd',
			callback: (value: number, index, ticksArr) =>
				value % 1 === 0 && index === ticksArr.length - 1 ? value + '%' : value
		};
	}

	setYAxesRightForPercent() {
		(this.options.scales.yB as any).beginAtZero = true;
		(this.options.scales.yB as any).suggestedMax = 100;
		this.options.scales.yB.ticks = {
			color: '#ddd',
			callback: (value: number, index, ticksArr) =>
				value % 1 === 0 && index === ticksArr.length - 1 ? value + '%' : value
		};
	}

	setTooltip() {
		this.options.plugins.tooltip = {
			mode: 'index',
			intersect: false
			// callbacks: {
			// 	title: (tooltipItem, dataMap) => {
			// 		return Array.isArray(tooltipItem[0].xLabel) ? tooltipItem[0].xLabel.join(' ') : tooltipItem[0].xLabel;
			// 	}
			// }
		};
	}

	// When % button/icon is selected, the data need to be displayed in percentage so as in tooltip.
	setTootipForPercent() {
		this.options.plugins.tooltip = {
			mode: 'index',
			intersect: false,
			callbacks: {
				mode: 'index',
				intersect: false,
				title: ([{ label }, ...{}]) => <string | string[]>(isArray(label) ? <unknown>label.join(' ') : label),
				label: ({ dataset, formattedValue }) => `${dataset.label}: ${Number(formattedValue).toFixed(0)}%`
			}
		};
	}

	getPlayerName(playerId: string): string {
		const player = this.selectedPlayerPeriod.find(({ id }) => playerId === id);
		return player ? player.displayName : '';
	}

	getValues(object): string {
		return Object.entries(object)
			.map(([key, value]) => `${this.metrics[Number(key)]}: ${value}`)
			.join(', ');
	}
}

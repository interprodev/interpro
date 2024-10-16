import { DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
	PRIMARIES,
	clearAndCopyCircularJSON,
	formatLabel,
	getDataLabels,
	getDefaultCartesianConfig,
	getThresholdActiveValue
} from '@iterpro/shared/utils/common-utils';
import { isArray } from 'lodash';

@Component({
	selector: 'iterpro-test-analysis-comparison',
	templateUrl: './test-analysis-comparison.component.html',
	styleUrls: ['./test-analysis-comparison.component.css']
})
export class TestAnalysisComparisonComponent implements OnChanges {
	yAxesIds = ['y', 'yB'];
	positions = ['left', 'right'];
	options: any;
	data: any;

	headers: string[];
	rows: string[][];

	@Input() serverData: any;
	@Input() metrics: any[] = [];
	@Input() order: boolean;
	@Input() downloadReport: any;
	@Input() downloadCsv: any;
	@Input() labels: boolean;
	@Input() percent: boolean;
	@Input() selectedPlayers: any[];

	constructor(private readonly decimalPipe: DecimalPipe) {}

	ngOnChanges(changes: SimpleChanges) {
		this.data = null;
		if (changes['serverData'] || changes['order'] || changes['labels'] || changes['percent']) {
			if (this.serverData) this.render(this.serverData, this.order, this.labels, this.percent);
		}
	}

	downloadComparisonReport() {
		this.downloadReport({
			data: clearAndCopyCircularJSON(this.data),
			options: this.options
		});
	}

	downloadComparisonCsv() {
		this.downloadCsv();
	}

	render(serverData, order: boolean, labels: boolean, percent: boolean) {
		const data = serverData.slice();

		// IF: ORDER - SORT
		if (order) data.sort((a, b) => (a.series0 > b.series0 ? 1 : b.series0 > a.series0 ? -1 : 0));
		let dataset = [];

		// IF: PERCENT - CALCULATE PERCENT
		if (percent) {
			const thresholdPercentValues: any[][] = [];
			thresholdPercentValues[0] = [];
			thresholdPercentValues[1] = [];

			this.metrics.forEach((x, index) => {
				this.selectedPlayers.forEach((pl, i) => {
					if (data && i < data.length) {
						const threshold = pl._thresholdsTests.find(th => th.metric === x);
						const thresholdActiveValue = threshold ? getThresholdActiveValue(threshold) : 1;
						thresholdPercentValues[index].push(
							Number((Number(data[i]['series' + index.toString()]) / thresholdActiveValue) * 100).toFixed(1)
						);
					}
				});
				dataset.push({
					label: x + ' ',
					backgroundColor: PRIMARIES[index],
					data: thresholdPercentValues[index],
					yAxisID: this.yAxesIds[index],
					datalabels: getDataLabels(labels),
					barPercentage: 0.8,
					categoryPercentage: 0.5
				});
			});
		} else {
			this.metrics.forEach((x, index) => {
				dataset = [
					...dataset,
					{
						label: x,
						backgroundColor: PRIMARIES[index],
						data: data.map(d => this.decimalPipe.transform(d['series' + index.toString()], '0.0-2').toString()),
						yAxisID: this.yAxesIds[index],
						datalabels: getDataLabels(labels),
						barPercentage: 0.8,
						categoryPercentage: 0.5
					}
				];
			});
		}

		this.data = {
			labels: data.map(x => x.label).map(x => (x.length > 10 ? formatLabel(x, 25) : x)),
			datasets: dataset
		};

		// TABLE STATS
		this.headers = this.data.datasets.map(({ label }) => label);
		this.rows = this.data.labels.map((label, index) => [label, ...this.data.datasets.map(({ data }) => data[index])]);

		// SET UP OPTIONS
		this.options = {
			...getDefaultCartesianConfig(),
			responsive: true,
			maintainAspectRatio: true
		};
		this.options.scales.y.suggestedMin = 0;
		delete this.options.scales.y.min;
		delete this.options.scales.y.beginAtZero;

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
		this.options.scales.y.beginAtZero = true;
		this.options.scales.y.ticks = {
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
				id: 'yB',
				position: 'right',
				grid: {
					color: 'transparent',
					display: false
				},
				border: { display: false },
				suggestedMin: 0,
				beginAtZero: true,
				ticks: {
					color: '#ddd',
					callback: value => {
						if (value % 1 === 0) {
							return value;
						}
					}
				}
			}
		};
	}

	setYAxesLeftForPercent() {
		this.options.scales.y.beginAtZero = true;
		this.options.scales.y.ticks = {
			color: '#ddd',
			callback: (value, index, ticksArr) => (value % 1 === 0 && index === ticksArr.length - 1 ? value + '%' : value)
		};
	}

	setYAxesRightForPercent() {
		this.options.scales.yB.beginAtZero = true;
		this.options.scales.yB.suggestedMax = 100;
		this.options.scales.yB.ticks = {
			color: '#ddd',
			callback: (value, index, ticksArr) => (value % 1 === 0 && index === ticksArr.length - 1 ? value + '%' : value)
		};
	}

	setTooltip() {
		this.options.plugins.tooltip = {
			mode: 'index',
			intersect: false
			// callbacks: {
			// 	title: (tooltipItem, dataMap) => {
			// 		return tooltipItem[0].xLabel;
			// 	}
			// }
		};
	}

	// When % button/icon is selected, the data need to be displayed in percentage so as in tooltip.
	setTootipForPercent() {
		this.options.plugins.tooltip = {
			callbacks: {
				mode: 'index',
				intersect: false,
				title: ([{ label }, ...{}]) => <string | string[]>(isArray(label) ? <unknown>label.join(' ') : label),
				label: ({ formattedValue }) => Number(formattedValue).toFixed(0) + '%'
			}
		};
	}
}

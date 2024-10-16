import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Player } from '@iterpro/shared/data-access/sdk';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import {
	PRIMARIES,
	clearAndCopyCircularJSON,
	getDefaultCartesianConfig,
	hexToRgbA
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { SelectItem } from 'primeng/api';
import { getMax, sortData } from '../utils';

@Component({
	selector: 'iterpro-financial-analysis-current',
	templateUrl: './financial-analysis-current.component.html',
	styleUrls: ['./financial-analysis-current.component.css'],
	providers: [ShortNumberPipe, DecimalPipe]
})
export class FinancialAnalysisCurrentComponent implements OnChanges {
	@Input() serverData: any;
	@Input() labels: boolean;
	@Input() order: boolean;
	@Input() selectedPlayers: Player[];
	@Input() selectedMetrics: string[] = [];
	@Input() downloadReport: any;
	@Input() downloadCsv: any;
	@Input() roa: boolean;
	@Input() allPlayers: SelectItem[];
	@Input() metric1: string;
	@Input() metric2: string;
	@Input() metric3: string;

	@Output() downloadReportEmitter: EventEmitter<{ data: ChartData; options: ChartOptions }> = new EventEmitter<{
		data: ChartData;
		options: ChartOptions;
	}>();
	@Output() downloadCsvEmitter: EventEmitter<any> = new EventEmitter<any>();

	yAxesIds = ['y', 'yB'];
	positions = ['left', 'right'];
	options: ChartOptions;
	data: ChartData;

	// TABLE STATS
	headers: string[] = [];
	rows: string[][] = [];

	constructor(
		private translate: TranslateService,
		private shortNumber: ShortNumberPipe
	) {}

	ngOnChanges(changes: SimpleChanges) {
		this.data = null;
		if (
			changes['serverData'] ||
			changes['order'] ||
			changes['labels'] ||
			changes['roa'] ||
			changes['selectedPlayers'] ||
			changes['selectedMetrics'] ||
			changes['metric1'] ||
			changes['metric2'] ||
			changes['metric3']
		) {
			if (this.roa && this.selectedPlayers.length > 0) {
				this.getChartRoa(this.serverData);
			} else {
				this.getChart(this.serverData, this.labels);
			}
		}
	}

	downloadFinanceAnalysisCurrentPdf() {
		this.downloadReportEmitter.emit({
			data: clearAndCopyCircularJSON(this.data),
			options: this.options
		});
	}

	downloadFinanceAnalysisCurrentCsv() {
		this.downloadCsvEmitter.emit();
	}

	getChart(serverData, labels) {
		let datasets = [];
		const options: any = {
			...getDefaultCartesianConfig(),
			responsive: true,
			maintainAspectRatio: true
		};
		options.scales.x.stacked = true;
		options.scales.y.stacked = true;
		options.scales = {
			...options.scales,
			xB: {
				display:
					this.selectedMetrics.includes('contractLength') ||
					this.selectedMetrics.includes('productivity') ||
					this.selectedMetrics.includes('availability') ||
					this.selectedMetrics.includes('investmentPerformance')
						? true
						: false,
				grid: {
					display: false,
					color: '#333333'
				},
				ticks: {
					autoSkip: false,
					display: false,
					color: '#ddd'
				},
				stacked: false,
				position: 'right'
			}
		};
		options.scales = {
			...options.scales,
			yB: {
				display:
					this.selectedMetrics.includes('contractLength') ||
					this.selectedMetrics.includes('productivity') ||
					this.selectedMetrics.includes('availability') ||
					this.selectedMetrics.includes('investmentPerformance')
						? true
						: false,
				grid: {
					display: false,
					color: '#333333'
				},
				ticks: {
					autoSkip: false,
					color: '#ddd',
					callback: (value, index, ticksArr) => (value % 1 === 0 && index === ticksArr.length - 1 ? value + '%' : value)
				},
				stacked: this.selectedMetrics.includes('investmentPerformance') ? true : false,
				position: 'right'
			}
		};

		if (
			this.selectedMetrics.includes('productivity') ||
			this.selectedMetrics.includes('availability') ||
			this.selectedMetrics.includes('investmentPerformance')
		) {
			options.scales.yB.max = 100;
		}

		let filtered = Object.entries(serverData).filter(x => this.selectedPlayers.map(({ id }) => id).includes(x[0]));
		let categories = filtered.map(x => this.allPlayers.find(({ value }) => value.id === x[0]).value.displayName);
		[filtered, categories] = sortData(filtered, categories, this.selectedMetrics[0], this.order);

		this.selectedMetrics.forEach((metric, index) => {
			const values = filtered.map(x => x[metric]);
			let toAdd;
			switch (metric) {
				case 'contractCost':
				case 'purchaseCost': {
					const basicWages = values.map(({ basicWages }) => basicWages);
					const appearanceBonus = values.map(({ appearanceBonus }) => appearanceBonus);
					const performanceBonus = values.map(({ performanceBonus }) => performanceBonus);
					const standardTeamBonus = values.map(({ standardTeamBonus }) => standardTeamBonus);
					const signingBonus = values.map(({ signingBonus }) => signingBonus);
					const customBonus = values.map(({ customBonus }) => customBonus);
					const benefits = values.map(({ benefits }) => benefits);
					const agent = values.map(({ agent }) => agent);
					const max = getMax(
						basicWages,
						appearanceBonus,
						performanceBonus,
						standardTeamBonus,
						signingBonus,
						customBonus,
						benefits,
						agent
					);
					toAdd = [
						{
							data: basicWages,
							max,
							type: 'bar',
							stack: metric === 'contractCost' ? 'contract' : 'purchase',
							yAxisID: 'y',
							xAxisID: 'x',
							label:
								metric === 'contractCost'
									? this.translate.instant('admin.contracts.basicWage')
									: this.translate.instant('admin.contracts.transferFee'),
							backgroundColor: PRIMARIES[index + 0],
							borderColor: PRIMARIES[index + 0],
							hoverBackgroundColor: PRIMARIES[index + 0],
							hoverBorderColor: PRIMARIES[index + 0],
							barPercentage: 0.8,
							categoryPercentage: 0.5
						},
						{
							data: appearanceBonus,
							max,
							type: 'bar',
							stack: metric === 'contractCost' ? 'contract' : 'purchase',
							yAxisID: 'y',
							xAxisID: 'x',
							label: this.translate.instant('admin.contracts.appearance'),
							backgroundColor: PRIMARIES[index + 1],
							borderColor: PRIMARIES[index + 1],
							hoverBackgroundColor: PRIMARIES[index + 1],
							hoverBorderColor: PRIMARIES[index + 1],
							barPercentage: 0.8,
							categoryPercentage: 0.5
						},
						{
							data: performanceBonus,
							max,
							type: 'bar',
							stack: metric === 'contractCost' ? 'contract' : 'purchase',
							yAxisID: 'y',
							xAxisID: 'x',
							label: this.translate.instant('admin.contracts.performance'),
							backgroundColor: PRIMARIES[index + 2],
							borderColor: PRIMARIES[index + 2],
							hoverBackgroundColor: PRIMARIES[index + 2],
							hoverBorderColor: PRIMARIES[index + 2],
							barPercentage: 0.8,
							categoryPercentage: 0.5
						},
						{
							data: standardTeamBonus,
							max,
							type: 'bar',
							stack: metric === 'contractCost' ? 'contract' : 'purchase',
							yAxisID: 'y',
							xAxisID: 'x',
							label: this.translate.instant('admin.contracts.standardTeam'),
							backgroundColor: PRIMARIES[index + 3],
							borderColor: PRIMARIES[index + 3],
							hoverBackgroundColor: PRIMARIES[index + 3],
							hoverBorderColor: PRIMARIES[index + 3],
							barPercentage: 0.8,
							categoryPercentage: 0.5
						},
						{
							data: signingBonus,
							max,
							type: 'bar',
							stack: metric === 'contractCost' ? 'contract' : 'purchase',
							yAxisID: 'y',
							xAxisID: 'x',
							label: this.translate.instant('admin.contracts.signing'),
							backgroundColor: PRIMARIES[index + 4],
							borderColor: PRIMARIES[index + 4],
							hoverBackgroundColor: PRIMARIES[index + 4],
							hoverBorderColor: PRIMARIES[index + 4],
							barPercentage: 0.8,
							categoryPercentage: 0.5
						},
						{
							data: customBonus,
							max,
							type: 'bar',
							stack: metric === 'contractCost' ? 'contract' : 'purchase',
							yAxisID: 'y',
							xAxisID: 'x',
							label: this.translate.instant('admin.contracts.custom'),
							backgroundColor: PRIMARIES[index + 5],
							borderColor: PRIMARIES[index + 5],
							hoverBackgroundColor: PRIMARIES[index + 5],
							hoverBorderColor: PRIMARIES[index + 5],
							barPercentage: 0.8,
							categoryPercentage: 0.5
						},
						{
							data: benefits,
							max,
							type: 'bar',
							stack: metric === 'contractCost' ? 'contract' : 'purchase',
							yAxisID: 'y',
							xAxisID: 'x',
							label: this.translate.instant('admin.contracts.benefits'),
							backgroundColor: PRIMARIES[index + 4],
							borderColor: PRIMARIES[index + 4],
							hoverBackgroundColor: PRIMARIES[index + 4],
							hoverBorderColor: PRIMARIES[index + 4],
							barPercentage: 0.8,
							categoryPercentage: 0.5
						},
						{
							data: agent,
							max,
							type: 'bar',
							stack: metric === 'contractCost' ? 'contract' : 'purchase',
							yAxisID: 'y',
							xAxisID: 'x',
							label: this.translate.instant('admin.contracts.agent'),
							backgroundColor: PRIMARIES[index + 5],
							borderColor: PRIMARIES[index + 5],
							hoverBackgroundColor: PRIMARIES[index + 5],
							hoverBorderColor: PRIMARIES[index + 5],
							barPercentage: 0.8,
							categoryPercentage: 0.5
						}
					];
					datasets = [...datasets, ...toAdd];
					break;
				}
				case 'roi': {
					let roi = [];
					let residualRoi = [];
					values.forEach((x, i) => {
						if (!x) {
							x = {
								roi: 0,
								residualRoi: 0
							};
						}
						roi = [...roi, (x['roi'] || 0).toFixed(0)];
						residualRoi = [...residualRoi, (x['residualRoi'] || 0).toFixed(0)];
					});
					const max = getMax(roi, residualRoi);
					toAdd = [
						{
							data: roi,
							max,
							type: 'bar',
							stack: 'roi',
							yAxisID: 'y',
							xAxisID: 'x',
							label: this.translate.instant('financial.dashboard.roi'),
							backgroundColor: PRIMARIES[index + 0],
							borderColor: PRIMARIES[index + 0],
							hoverBackgroundColor: PRIMARIES[index + 0],
							hoverBorderColor: PRIMARIES[index + 0],
							barPercentage: 0.8,
							categoryPercentage: 0.5
						},
						{
							data: residualRoi,
							max,
							type: 'bar',
							stack: 'roi',
							yAxisID: 'y',
							xAxisID: 'x',
							label: this.translate.instant('financial.dashboard.residualRoi'),
							backgroundColor: PRIMARIES[index + 1],
							borderColor: PRIMARIES[index + 1],
							hoverBackgroundColor: PRIMARIES[index + 1],
							hoverBorderColor: PRIMARIES[index + 1],
							barPercentage: 0.8,
							categoryPercentage: 0.5
						}
					];
					datasets = [...datasets, ...toAdd];
					break;
				}
				case 'totalInvestmentValue': {
					toAdd = [
						{
							data: filtered.map(x => x['purchaseCostOverall'] && x['purchaseCostOverall'].toFixed(0)),
							backgroundColor: PRIMARIES[index + 0],
							yAxisID: 'y',
							label: this.translate.instant('purchaseCost'),
							stack: metric,
							barPercentage: 0.8,
							categoryPercentage: 0.5
						},
						{
							data: filtered.map(x => x['contractCostOverall'] && x['contractCostOverall'].toFixed(0)),
							backgroundColor: PRIMARIES[index + 1],
							yAxisID: 'y',
							label: this.translate.instant('contractCost'),
							stack: metric,
							barPercentage: 0.8,
							categoryPercentage: 0.5
						}
					];
					datasets = [...datasets, ...toAdd];
					break;
				}
				case 'investmentPerformance': {
					let lossesPerc = [];
					let residualRoiPerc = [];
					let roiPerc = [];
					let untappedPerc = [];
					values.forEach((x, i) => {
						if (!x) {
							x = {
								roi: 0,
								residualRoi: 0
							};
						}
						lossesPerc = [...lossesPerc, (x['losses_perc'] || 0).toFixed(0)];
						residualRoiPerc = [...residualRoiPerc, (x['residualRoi_perc'] || 0).toFixed(0)];
						roiPerc = [...roiPerc, (x['roi_perc'] || 0).toFixed(0)];
						untappedPerc = [...untappedPerc, (x['untapped_perc'] || 0).toFixed(0)];
					});
					toAdd = [
						{
							data: roiPerc,
							type: 'bar',
							stack: 'investment',
							yAxisID: 'yB',
							xAxisID: 'x',
							label: this.translate.instant('financial.dashboard.roi'),
							backgroundColor: PRIMARIES[index + 0],
							borderColor: PRIMARIES[index + 0],
							hoverBackgroundColor: PRIMARIES[index + 0],
							hoverBorderColor: PRIMARIES[index + 0],
							barPercentage: 0.8,
							categoryPercentage: 0.5
						},
						{
							data: residualRoiPerc,
							type: 'bar',
							stack: 'investment',
							yAxisID: 'yB',
							xAxisID: 'x',
							label: this.translate.instant('financial.dashboard.residualRoi'),
							backgroundColor: PRIMARIES[index + 1],
							borderColor: PRIMARIES[index + 1],
							hoverBackgroundColor: PRIMARIES[index + 1],
							hoverBorderColor: PRIMARIES[index + 1],
							barPercentage: 0.8,
							categoryPercentage: 0.5
						},
						{
							data: lossesPerc,
							type: 'bar',
							stack: 'investment',
							yAxisID: 'yB',
							xAxisID: 'x',
							label: this.translate.instant('financial.dashboard.losses'),
							backgroundColor: PRIMARIES[index + 2],
							borderColor: PRIMARIES[index + 2],
							hoverBackgroundColor: PRIMARIES[index + 2],
							hoverBorderColor: PRIMARIES[index + 2],
							barPercentage: 0.8,
							categoryPercentage: 0.5
						},
						{
							data: untappedPerc,
							type: 'bar',
							stack: 'investment',
							yAxisID: 'yB',
							xAxisID: 'x',
							label: this.translate.instant('financial.dashboard.untapped'),
							backgroundColor: PRIMARIES[index + 3],
							borderColor: PRIMARIES[index + 3],
							hoverBackgroundColor: PRIMARIES[index + 3],
							hoverBorderColor: PRIMARIES[index + 3],
							barPercentage: 0.8,
							categoryPercentage: 0.5
						}
					];
					datasets = [...datasets, ...toAdd];
					break;
				}
				default: {
					toAdd = {
						data: values.map(x => Number(x).toFixed(0)),
						backgroundColor: PRIMARIES[index],
						yAxisID: metric === 'marketValue' || metric === 'losses' ? 'y' : 'yB',
						label: this.translate.instant(metric),
						stack: metric,
						barPercentage: 0.8,
						categoryPercentage: 0.5
					};
					datasets = [...datasets, toAdd];
					break;
				}
			}

			if (
				metric === 'contractCost' ||
				metric === 'purchaseCost' ||
				metric === 'marketValue' ||
				metric === 'roi' ||
				metric === 'totalInvestmentValue' ||
				metric === 'losses' ||
				metric === 'investmentPerformance'
			) {
				options.scales.y.ticks.callback = (value, i, vals) => this.shortNumber.transform(value, true);
				options.plugins.tooltip.callbacks = {
					label: ({ dataset, raw }) => `${dataset.label}: ${this.shortNumber.transform(Number(raw), true)}`
				};
			}
			if (metric === 'investmentPerformance' || metric === 'availability' || metric === 'productivity') {
				options.plugins.tooltip.callbacks = {
					label: ({ dataset, raw }) => `${dataset.label}: ${Number(raw)}%`
				};
			}
			options.plugins.datalabels =
				metric === 'contractCost' ||
				metric === 'purchaseCost' ||
				metric === 'totalInvestmentValue' ||
				metric === 'investmentPerformance'
					? this.getInnerDatalabels(labels, this.shortNumber)
					: this.getDatalabels(labels, this.shortNumber);
		});

		this.data = {
			labels: categories,
			datasets
		};

		// TABLE STATS
		this.headers = this.data.datasets.map(({ label }) => label);
		this.rows = (this.data.labels as string[]).map((labels, index) => [
			labels,
			...this.data.datasets.map(({ data }) => String(data[index]))
		]);

		this.options = options;
	}

	getInnerDatalabels(labels, shortNumber) {
		return {
			align: 'start',
			anchor: 'end',
			font: {
				weight: 'bold'
			},
			color: data => {
				const rgb = hexToRgbA(data.dataset.backgroundColor);
				const threshold = 200;
				const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
				return luminance > threshold ? '#333333' : '#dddddd';
			},
			display: context => {
				return labels ? context.dataset.data[context.dataIndex] > 0 : false;
			},
			formatter: (value, context) => {
				if (value && value < context.dataset.max) return '';
				return shortNumber.transform(value, true);
			}
		};
	}

	getDatalabels(labels, shortNumber) {
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
				return context.dataset.label === 'Intensity' ? '#fafafa' : 'black';
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
			},
			formatter: (value, context) => {
				return context.dataset.type === 'bubble' ? value.y : shortNumber.transform(value, true);
			}
		};
	}

	getChartRoa(server) {
		let datasets = [];
		const filtered = Object.entries(server).filter(([playerId, value]) =>
			this.selectedPlayers.map(({ id }) => id).includes(playerId)
		);
		const categories = filtered.map(
			([playerId]) => this.allPlayers.find(({ value }) => value.id === playerId).value.displayName
		);
		const mapped = filtered.map(([, value], i) => {
			value['totalCost'] = Object.keys(value['contractCost']).reduce(
				(prev, current, index) => prev + +Object.values(value['contractCost'])[index],
				0
			);
			value['totalInvestmentValue'] = value['purchaseCostOverall'] + value['contractCostOverall'];
			value['roiBubble'] = value['roi']['roi'];
			return {
				x: +Number(
					!value[this.getMetricBubble(this.metric1)] || isNaN(value[this.getMetricBubble(this.metric1)])
						? 0
						: value[this.getMetricBubble(this.metric1)]
				).toFixed(1),
				y: +Number(
					!value[this.getMetricBubble(this.metric2)] || isNaN(value[this.getMetricBubble(this.metric2)])
						? 0
						: value[this.getMetricBubble(this.metric2)]
				).toFixed(1),
				_r: +Number(
					!value[this.getMetricBubble(this.metric3)] || isNaN(value[this.getMetricBubble(this.metric3)])
						? 0
						: value[this.getMetricBubble(this.metric3)]
				).toFixed(1),
				name: categories[i]
			};
		});

		datasets = [
			{
				data: mapped,
				type: 'bubble',
				borderColor: PRIMARIES[0],
				backgroundColor: `${PRIMARIES[0]}80`,
				radius: context => {
					const dataValues = context.dataset.data.map(({ _r }) => Number(_r));
					const maxValue = Math.max(...dataValues);
					const value = context.dataset.data[context.dataIndex];
					const size = context.chart.width;
					const base = Math.abs(value._r) / maxValue;
					return (size / 24) * base;
				}
			},
			...datasets
		];

		this.data = {
			datasets,
			labels: categories
		};
		const options = {
			...getDefaultCartesianConfig('linear'),
			responsive: true,
			maintainAspectRatio: true
		};
		options.plugins.legend = {
			display: false
		};
		(options.scales.x as any).title = {
			display: true,
			text: this.translate.instant(this.metric1),
			color: '#ddd'
		};
		(options.scales.y as any).title = {
			display: true,
			text: this.translate.instant(this.metric2),
			color: '#ddd'
		};
		options.plugins.tooltip = {
			callbacks: {
				title: ([{ raw }]: any[]) => raw.name,
				label: tooltipItem => {
					const chartPoint = tooltipItem.raw;
					return `${this.translate.instant(this.metric1)}: ${this.shortNumber.transform(
						chartPoint.x,
						true
					)}; ${this.translate.instant(this.metric2)}: ${this.shortNumber.transform(
						chartPoint.y,
						true
					)}; ${this.translate.instant(this.metric3)}: ${this.shortNumber.transform(chartPoint._r, true)}`;
				}
			}
		};

		this.options = options;
	}

	getMetricBubble(metric) {
		switch (metric) {
			case 'contractCost':
				return 'totalCost';
			case 'purchaseCost':
				return 'purchaseCostOverall';
			case 'roi':
				return 'roiBubble';
			default:
				return metric;
		}
	}
}

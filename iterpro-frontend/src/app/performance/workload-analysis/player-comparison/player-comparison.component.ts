import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Event, PdfBase } from '@iterpro/shared/data-access/sdk';
import {
	getDefaultCartesianConfig,
	getMomentFormatFromStorage,
	workloadLabels
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment';

interface PlayerComparisonPDF extends PdfBase {
	comparisonData: any;
	comparisonOptions: any;
	comparisonTable: any;
}

@Component({
	selector: 'iterpro-player-comparison',
	templateUrl: './player-comparison.component.html'
})
export class PlayerComparisonComponent implements OnChanges {
	@Input() session: Event;
	@Input() sessionPlayers: any[];
	@Input() sessionName: string;
	@Input() players: any[];
	@Input() metrics: any[];
	@Input() labels: boolean;

	headers: string[] = [];
	rows: string[][] = [];

	data: any;
	options: any;
	sort: boolean;
	colors: Map<string, string> = new Map<string, string>();
	metricsLabels: string[];

	constructor(private translate: TranslateService) {
		this.colors.set('workload', '#ffffff');
		this.colors.set('intensity', '#F61111');
		this.colors.set('cardio', '#a05195');
		this.colors.set('kinematic', '#2f4b7c');
		this.colors.set('mechanical', '#14B85E');
		this.colors.set('metabolic', '#F7C31A');
		this.colors.set('perceived', '#ADD8E6');
	}

	ngOnChanges(changes: SimpleChanges) {
		if (
			(changes['players'] ||
				changes['metrics'] ||
				changes['session'] ||
				changes['sessionPlayers'] ||
				changes['labels']) &&
			this.players &&
			this.metrics &&
			this.session &&
			this.sessionPlayers
		) {
			this.render();
		}

		if (changes['metrics'] && this.metrics) {
			this.metricsLabels = this.metrics.map(m => this.translate.instant(m));
		}
	}

	render() {
		this.data = this.getChartData(this.translate);
		this.options = this.getChartOptions(this.translate);
	}

	getChartData(translate) {
		const ids = this.players.map(({ id }) => id);
		const filtered = this.sessionPlayers.filter(({ playerId, mainSession }) => ids.includes(playerId) && mainSession);

		const playersLabels: string[] = this.players.map(({ displayName }) => displayName);
		let datasets = [];

		this.metrics.forEach(metric => {
			if (metric !== 'intensity' && metric !== 'workload') {
				const dataset = filtered.map(x => Math.round(Number(x[metric + 'Workload'])));
				datasets = [
					...datasets,
					{
						data: dataset,
						yAxisID: 'y',
						xAxisID: 'x',
						type: 'bar',
						backgroundColor: this.colors.get(metric),
						label: translate.instant(metric),
						barPercentage: 0.8,
						categoryPercentage: 0.5
					}
				];
			}
		});

		if (this.metrics.includes('intensity')) {
			const intensity = filtered.map(({ intensity }, i) => ({
				x: playersLabels[i],
				y: Math.round(intensity),
				r: !intensity || intensity === 0 ? 0 : 12
			}));

			datasets = [
				{
					data: intensity,
					yAxisID: 'y',
					xAxisID: 'x',
					type: 'bubble',
					backgroundColor: this.colors.get('intensity'),
					label: translate.instant('intensity')
				},
				...datasets
			];
		}

		if (this.metrics.includes('workload')) {
			const workload = filtered.map(({ workload }, i) => ({
				x: playersLabels[i],
				y: Number(workload).toFixed(1),
				r: !workload || workload === 0 ? 0 : 12
			}));
			datasets = [
				{
					data: workload,
					yAxisID: 'yB',
					xAxisID: 'x',
					type: 'bubble',
					backgroundColor: this.colors.get('workload'),
					label: translate.instant('workload')
				},
				...datasets
			];
		}

		const data = {
			datasets,
			labels: playersLabels
		};

		const headers = datasets.map(({ label }) => label);
		const rows: string[][] = playersLabels
			.map((_, index) => ({
				...datasets.map(d => {
					if (d.type === 'bubble') {
						return d.data[index].y;
					}

					return d.data[index];
				})
			}))
			.map(r => Object.values(r));

		this.headers = headers;
		this.headers.unshift(this.translate.instant('general.player'));

		this.rows = rows.map(row => row.map(value => (isNaN(Number(value)) ? '0.0' : value)));
		this.rows.map((row, index) => row.unshift(playersLabels[index]));

		return data;
	}

	getChartOptions(translate) {
		const options: any = {
			...getDefaultCartesianConfig(),
			responsive: true,
			maintainAspectRatio: true
		};

		options.scales.y.max = 120;

		options.plugins.datalabels = this.getDatalabels(this.labels, translate);

		if (this.metrics.includes('workload')) {
			options.scales = {
				...options.scales,
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
							if (value === 1) return translate.instant('event.effort.1');
							else if (value === 2) return translate.instant('event.effort.2');
							else if (value === 3) return translate.instant('event.effort.3');
							else if (value === 4) return translate.instant('event.effort.4');
							else if (value === 5) return translate.instant('event.effort.5');
							else if (value >= 6) return translate.instant('event.effort.6');
						},
						padding: 15
					}
				}
			};
		}

		options.plugins.tooltip = {
			mode: 'index',
			intersect: false,
			callbacks: {
				label: ({ formattedValue, dataset, parsed }) => {
					let value = formattedValue;
					if (dataset.label === translate.instant('workload')) {
						value = `${workloadLabels(Math.ceil(parsed.y), translate)} (${parsed.y})`;
					} else if (dataset.label === translate.instant('intensity')) {
						value = parsed.y;
					}
					return dataset.label + ': ' + value;
				}
			}
		};

		return options;
	}

	getDatalabels(labels, translate) {
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
				return context.dataset.label === translate.instant('intensity') ? '#fafafa' : 'black';
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
				return context.dataset.type === 'bubble' ? value.y : value;
			}
		};
	}

	getReport() {
		const t = this.translate.instant.bind(this.translate);
		const data: PlayerComparisonPDF = {
			header: {
				title: this.translate.instant(`workload.playerComparison`).toUpperCase(),
				subTitle: ''
			},
			metadata: {
				createdLabel: `${this.translate.instant('general.createdOn')} ${moment(new Date()).format(
					`${getMomentFormatFromStorage()} hh:mm`
				)}`
			},
			comparisonData: this.getChartData(this.translate),
			comparisonOptions: this.getChartOptions(this.translate),
			comparisonTable: {
				headers: this.headers.map((header, index) => ({
					label: header,
					alignment: index === 0 ? 'left' : 'right'
				})),
				rows: this.rows.map(row =>
					row.map((value, index) => ({
						label: value,
						alignment: index === 0 ? 'left' : 'right'
					}))
				)
			}
		};

		return data;
	}
}

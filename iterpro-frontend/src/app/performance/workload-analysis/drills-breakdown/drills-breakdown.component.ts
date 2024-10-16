import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { PRIMARIES, getDefaultCartesianConfig, workloadLabels } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { meanBy, round } from 'lodash';

@Component({
	selector: 'iterpro-drills-breakdown',
	templateUrl: './drills-breakdown.component.html'
})
export class DrillsBreakdownComponent implements OnChanges {
	@Input() session: any;
	@Input() sessionPlayers: any[];
	@Input() sessionName = '';
	@Input() players: any[];
	@Input() labels: boolean;

	data: any;
	options: any;
	dataComposition: any;
	optionsComposition: any;
	colors: Map<string, string> = new Map<string, string>();

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
			(changes.players || changes.session || changes.sessionPlayers || changes.labels) &&
			this.session &&
			this.sessionPlayers
		) {
			this.extractData();
		}
	}

	getDrillsSessions() {
		const ids = this.players.map(x => x.id);
		const filtered = this.sessionPlayers.filter(({ playerId, mainSession }) => ids.includes(playerId) && !mainSession);
		const drillsNames =
			this.session && this.session._drillsExecuted && this.session._drillsExecuted.length > 0
				? this.session._drillsExecuted.map(({ name }) => name)
				: [];

		let drillsSessions = [];
		drillsNames.forEach(drill => {
			const dSess = filtered.filter(({ splitName }) => splitName === drill);
			drillsSessions = [
				...drillsSessions,
				{
					name: drill,
					workload: round(meanBy(dSess, 'workload'), 1),
					intensity: round(meanBy(dSess, 'intensity'), 1),
					cardio: round(meanBy(dSess, 'cardioWorkload'), 1),
					kinematic: round(meanBy(dSess, 'kinematicWorkload'), 1),
					mechanical: round(meanBy(dSess, 'mechanicalWorkload'), 1),
					metabolic: round(meanBy(dSess, 'metabolicWorkload'), 1),
					perceived: round(meanBy(dSess, 'perceivedWorkload'), 1)
				}
			];
		});
		return drillsSessions;
	}

	extractData() {
		const drillsSessions = this.getDrillsSessions();
		this.render(drillsSessions);
	}

	render(sessions) {
		this.data = this.getChartData(sessions, this.translate);
		this.options = this.getChartOptions(this.translate);
		this.dataComposition = this.getChartDataComposition(sessions);
		this.optionsComposition = this.getChartOptionsComposition();
	}

	getChartData(sessions, translate) {
		const categories = sessions.map(({ name }) => name);
		const datasets = [
			{
				data: sessions.map(({ workload }, i) => ({
					x: categories[i],
					y: workload,
					r: !workload || workload === 0 ? 0 : 12
				})),
				yAxisID: 'yB',
				xAxisID: 'x',
				type: 'bubble',
				backgroundColor: this.colors.get('workload'),
				label: translate.instant('workload')
			},
			{
				data: sessions.map(({ intensity }, i) => ({
					x: categories[i],
					y: Number(intensity).toFixed(0),
					r: !intensity || intensity === 0 ? 0 : 12
				})),
				yAxisID: 'y',
				xAxisID: 'x',
				type: 'bubble',
				backgroundColor: this.colors.get('intensity'),
				label: translate.instant('intensity')
			},
			{
				data: sessions.map(({ cardio }) => cardio),
				yAxisID: 'y',
				xAxisID: 'x',
				type: 'bar',
				backgroundColor: this.colors.get('cardio'),
				label: translate.instant('cardio')
			},
			{
				data: sessions.map(({ kinematic }) => kinematic),
				yAxisID: 'y',
				xAxisID: 'x',
				type: 'bar',
				backgroundColor: this.colors.get('kinematic'),
				label: translate.instant('kinematic')
			},
			{
				data: sessions.map(({ mechanical }) => mechanical),
				yAxisID: 'y',
				xAxisID: 'x',
				type: 'bar',
				backgroundColor: this.colors.get('mechanical'),
				label: translate.instant('mechanical')
			},
			{
				data: sessions.map(({ metabolic }) => metabolic),
				yAxisID: 'y',
				xAxisID: 'x',
				type: 'bar',
				backgroundColor: this.colors.get('metabolic'),
				label: translate.instant('metabolic')
			},
			{
				data: sessions.map(({ perceived }) => perceived),
				yAxisID: 'y',
				xAxisID: 'x',
				type: 'bar',
				backgroundColor: this.colors.get('perceived'),
				label: translate.instant('perceived')
			}
		];

		return {
			labels: categories,
			datasets: datasets
		};
	}

	getChartOptions(translate) {
		const options: any = {
			...getDefaultCartesianConfig(),
			responsive: true
			// maintainAspectRatio: true
		};

		options.scales.y.max = 120;

		options.plugins.datalabels = this.getDatalabels(this.labels, translate);

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
						else if (value === 6) return translate.instant('event.effort.6');
						else return '';
					},
					padding: 15
				}
			}
		};

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

	getChartDataComposition(sessions) {
		const sum = sessions.map(({ workload }) => workload).reduce((a, b) => a + b, 0);
		const categories = [''];
		let datasets = [];

		sessions.forEach(({ name, workload }, index) => {
			datasets = [
				...datasets,
				{
					data: [(workload * 100) / sum],
					backgroundColor: PRIMARIES[index],
					label: name,
					barThickness: 30
				}
			];
		});

		return { labels: categories, datasets };
	}

	getChartOptionsComposition() {
		const options: any = {
			...getDefaultCartesianConfig(),
			elements: {
				bar: {
					borderWidth: 2
				}
			},
			indexAxis: 'y'
		};

		options.plugins.legend.position = 'bottom';
		options.plugins.datalabels = this.getHorizontalBarDataLabels();
		options.scales = {
			x: {
				stacked: true,
				max: 100,
				display: false
			},
			y: {
				stacked: true,
				display: false
			}
		};

		options.plugins.tooltip = {
			callbacks: {
				label: ({ label, formattedValue }) => {
					const value = Number((formattedValue as string).replace(',', '.'));
					return `${label}: ${value.toFixed(1)}%`;
				}
			}
		};

		return options;
	}

	getDatalabels(labels, translate) {
		return {
			backgroundColor: function (context) {
				return context.dataset.type === 'bubble'
					? null
					: context.dataset.backgroundColor
						? context.dataset.backgroundColor
						: context.dataset.borderColor;
			},
			borderRadius: function (context) {
				return context.dataset.type === 'bubble' ? null : 4;
			},
			align: function (context) {
				return context.dataset.type === 'bubble' ? 'center' : 'end';
			},
			anchor: function (context) {
				return context.dataset.type === 'bubble' ? 'center' : 'end';
			},
			color: function (context) {
				return context.dataset.label === translate.instant('intensity') ? '#fafafa' : 'black';
			},
			display: function (context) {
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
			color: 'white',
			display: function (context) {
				return context.dataset.data[context.dataIndex] > 0;
			},
			formatter: function (value, context) {
				return Number(value).toFixed(0) + '%';
			}
		};
	}

	getReport() {
		const t = this.translate.instant.bind(this.translate);
		const drillsSessions = this.getDrillsSessions();
		const data = {
			drillsData: this.getChartData(drillsSessions, this.translate),
			drillsOptions: this.getChartOptions(this.translate),
			compositionData: this.getChartDataComposition(drillsSessions),
			compositionOptions: this.getChartOptionsComposition()
		};

		return data;
	}
}

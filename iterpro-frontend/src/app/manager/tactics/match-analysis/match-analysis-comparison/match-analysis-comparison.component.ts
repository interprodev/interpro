import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { DeviceMetricDescriptor, Match, PlayerStat, TeamGroup } from '@iterpro/shared/data-access/sdk';
import { CapitalizePipe } from '@iterpro/shared/ui/pipes';
import {
	AlertService,
	PRIMARIES,
	ReportService,
	getDataLabels,
	getDefaultCartesianConfig,
	isGroup,
	isNotEmpty
} from '@iterpro/shared/utils/common-utils';
import { ChartData, ChartOptions } from 'chart.js';
import { flatten, max } from 'lodash';
import { cleanJSON } from '../match-analysis.component';

@Component({
	selector: 'iterpro-match-analysis-comparison',
	templateUrl: './match-analysis-comparison.component.html'
})
export class MatchAnalysisComparisonComponent implements OnChanges {
	@Input() match: Match;
	@Input() sidebarOpen: boolean;
	@Input() metrics: DeviceMetricDescriptor[];
	@Input() playerStats: Array<PlayerStat | TeamGroup>;
	@Input() allPlayersStats: PlayerStat[];
	@Input() thresholdsMap: any;

	@Output() sidebarEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

	order = false;
	datalabels = false;
	percentage = false;
	options: ChartOptions;
	data: ChartData;
	selectedOrderMetric: string;
	private indexes = ['y', 'yB'];

	constructor(
		private reportService: ReportService,
		private datePipe: DatePipe,
		private currentTeamService: CurrentTeamService,
		private notificationService: AlertService,
		private capitalize: CapitalizePipe
	) {}

	ngOnChanges() {
		if (this.match) {
			if (isNotEmpty(this.match._playerStats)) this.drawBarComparison();
			else this.resetData();
		}
	}

	onToggleSidebar() {
		this.sidebarOpen = !this.sidebarOpen;
		this.sidebarEmitter.emit(this.sidebarOpen);
	}

	onToggleOrder() {
		this.order = !this.order;
		if (this.order === true) {
			this.selectedOrderMetric = this.metrics[0].metricName + 'ASC';
		} else {
			this.selectedOrderMetric = null;
		}

		this.drawBarComparison();
	}

	onToggleLabels() {
		this.datalabels = !this.datalabels;
		this.drawBarComparison();
	}

	onTogglePercent() {
		this.percentage = !this.percentage;
		this.drawBarComparison();
	}

	downloadReport() {
		this.reportService.getReport('match_comparison', this.getComparisonReport());
	}

	private resetData() {
		this.data = null;
	}

	private getComparisonReport() {
		const d = this.datePipe.transform.bind(this.datePipe);
		const data = cleanJSON(this.data);

		return JSON.parse(
			JSON.stringify({
				displayDate: d(this.match.date, 'dd/MM/yy'),
				displayTime: d(this.match.date, 'HH:mm'),
				suffix: this.percentage ? '%' : '',
				team: this.currentTeamService.getCurrentTeam().name,
				home: this.match.home,
				opponent: this.match.opponent,
				result: this.match.result,
				data,
				options: this.options
			})
		);
	}

	private drawBarComparison() {
		this.options = { ...getDefaultCartesianConfig() };
		this.options.responsive = true;
		this.options.maintainAspectRatio = true;
		const graphMap: any = {};
		for (const metric of this.metrics) {
			graphMap[metric.metricName] = [];
		}
		if (this.playerStats && isNotEmpty(this.metrics)) {
			const plStatBuilt = [];
			for (const pls of this.playerStats) {
				if (isGroup((pls as TeamGroup).players))
					plStatBuilt.push(this.getMediumPlayerStatForGroupAndMetric(this.allPlayersStats, pls, this.metrics));
				else plStatBuilt.push(pls);
			}
			for (const plStat of plStatBuilt) {
				for (const metr of this.metrics) {
					const arr = graphMap[metr.metricName];
					let fieldValue = null;
					fieldValue = plStat[metr.metricName] || null;
					const thrVals = this.thresholdsMap.get(plStat.playerName);
					const thr = thrVals?.find(({ name }) => name === metr.metricName)?.value || 1;
					if (fieldValue)
						arr.push(
							this.percentage
								? Number((Number(fieldValue) / (thr || 1)) * 100).toFixed(1)
								: Number(fieldValue).toFixed(1)
						);
					else arr.push(null);

					graphMap[metr.metricName] = arr;
				}
			}

			let datasets: any = Object.entries(graphMap).map(([label, data], index) => ({
				data,
				label: this.capitalize.transform(this.metrics.find(({ metricName }) => metricName === label).metricLabel),
				backgroundColor: PRIMARIES[index],
				yAxisID: this.indexes[index],
				barPercentage: 0.8,
				categoryPercentage: 0.5
			}));

			if (this.metrics.length > 1) {
				this.options.scales = {
					...this.options.scales,
					yB: {
						position: 'right',
						grid: {
							color: 'transparent',
							display: false
						},
						beginAtZero: true,
						min: 0,
						ticks: {
							color: '#ddd',
							callback: (value: number) => {
								if (value % 1 === 0) {
									return value;
								}
							}
						}
					}
				};
			} else if (this.options.scales.yB) {
				this.options.scales.yB = null;
			}

			if (this.percentage) {
				Object.entries(this.options.scales).forEach(([key, { ticks, suggestedMax, grace }]: [string, any]) => {
					if (key.includes('y')) {
						ticks.callback = (value, index, ticksArr) =>
							value % 1 === 0 && index === ticksArr.length - 1 ? value + '%' : value;
						suggestedMax = Math.floor(
							max(
								flatten(datasets.map(({ data }) => data)).filter((n: number) => !isNaN(n) && n !== Infinity)
							) as number
						);
						grace = '10%';
					}
				});
			}

			if (isNotEmpty(datasets[0].data) && datasets[0].data.find(x => x && x !== 0)) {
				const sommaMetrica1 = datasets[0].data.length > 0 ? datasets[0].data.reduce((a, b) => a + b) : 0;
				const avgMetrica1 = sommaMetrica1 / datasets[0].data.length;

				let annotations: object = {
					yA_ann: {
						borderDash: [20, 20],
						type: 'line',
						mode: 'horizontal',
						scaleID: 'y',
						value: avgMetrica1,
						borderColor: PRIMARIES[0],
						borderWidth: 2
					}
				};
				if (datasets.length > 1) {
					const sommaMetrica2 = datasets[1].data.length > 0 ? datasets[1].data.reduce((a, b) => a + b) : 0;
					const avgMetrica2 = sommaMetrica2 / datasets[1].data.length;
					annotations = {
						...annotations,
						yB_ann: {
							borderDash: [20, 20],
							type: 'line',
							scaleID: 'yB',
							mode: 'horizontal',
							value: avgMetrica2,
							borderColor: PRIMARIES[1],
							borderWidth: 2
						}
					};
				}
			}

			this.options.plugins.tooltip = {
				mode: 'index',
				intersect: false
			};

			if (this.datalabels) {
				this.options.plugins.datalabels = getDataLabels(this.datalabels);
			}

			let labels = this.playerStats.map((p: PlayerStat | TeamGroup) =>
				isGroup((p as TeamGroup).players) ? (<TeamGroup>p).name : (<PlayerStat>p).playerName
			);

			[datasets, labels] = this.sortData(datasets, labels, this.selectedOrderMetric, this.metrics[0]);

			this.data = {
				labels,
				datasets
			};
		} else {
			this.notificationService.notify('error', 'matchAnalysis', 'alert.metricsRequired', false);
		}
	}

	private filterGroupPlayerStats(playerStats: PlayerStat[], group: TeamGroup) {
		return [].concat(playerStats.filter(({ playerId }) => group.players.indexOf(playerId) !== -1));
	}

	private getMediumPlayerStatForGroupAndMetric(
		playerStatsOriginal: PlayerStat[],
		group: any,
		metrics: DeviceMetricDescriptor[]
	) {
		const mapPlayerStats = new Map<string, PlayerStat>();
		const playersInPlayerStatGroup = [];
		const playerStats = this.filterGroupPlayerStats(playerStatsOriginal, group);

		// init group players session map
		group.players.forEach(player => {
			const playerStat = new PlayerStat({
				playerId: player
			});
			metrics.forEach(metric => {
				playerStat[metric.metricName] = 0;
			});

			mapPlayerStats.set(player.toLowerCase(), playerStat);
		});

		// set sessions sum for all player of the group
		playerStats.forEach(plStat => {
			if (playersInPlayerStatGroup.indexOf(plStat.playerId === -1)) playersInPlayerStatGroup.push(plStat.playerId);
			const playerStatForPlayer = mapPlayerStats.get(plStat.playerId);
			metrics.forEach(metric => {
				const valueForMetricCurrentPlStat = plStat[metric.metricName] || null;
				if (valueForMetricCurrentPlStat) {
					const rawFieldPlayerStat =
						metric.metricName in playerStatForPlayer ? playerStatForPlayer[metric.metricName] : null;
					if (rawFieldPlayerStat) playerStatForPlayer[metric.metricName] += Number(valueForMetricCurrentPlStat);
					else playerStatForPlayer[metric.metricName] = Number(valueForMetricCurrentPlStat);
				}
			});
			mapPlayerStats.set(plStat.playerId, playerStatForPlayer);
		});

		const plStatArray = Array.from(mapPlayerStats.entries());

		let mValues = [0, 0];
		plStatArray.forEach(plEntry => {
			const plS: PlayerStat = plEntry[1];
			metrics.forEach((metric, index) => {
				const fieldValue = metric.metricName in plS ? plS[metric.metricName] : null;
				if (fieldValue) {
					mValues[index] += Number(fieldValue);
				}
			});
		});

		mValues = mValues.map(mValue => mValue / playersInPlayerStatGroup.length);

		const groupPlStat: PlayerStat = new PlayerStat();
		metrics.forEach(({ metricName }, index) => {
			groupPlStat[metricName] = mValues[index];
		});

		groupPlStat.playerName = group.name;
		return groupPlStat;
	}

	private sortData(dataset, categories, order, metric) {
		const data = [dataset[0].data || [], (dataset[1] && dataset[1].data) || []];
		if (order) {
			const dataField = order === metric.metricName + 'ASC' || order === metric.metricName + 'DESC' ? 'd1' : 'd2';
			data[0]
				.map((v, i) => ({
					d1: Number(v),
					d2: Number(data[1][i]),
					c: categories[i]
				}))
				.sort(function (a, b) {
					return a[dataField] < b[dataField] ? -1 : a[dataField] === b[dataField] ? 0 : 1;
				})
				.forEach((v, i) => {
					data[0][i] = v.d1;
					data[1][i] = v.d2;
					categories[i] = v.c;
				});

			if (order.indexOf('DESC') !== -1) {
				data[0] = data[0].reverse();
				data[1] = data[1].reverse();
				categories = categories.reverse();
			}

			dataset[0].data = data[0];
			if (dataset[1]) dataset[1].data = data[1];
		}

		return [dataset, categories];
	}
}

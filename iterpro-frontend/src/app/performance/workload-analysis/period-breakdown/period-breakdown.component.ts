import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { Player } from '@iterpro/shared/data-access/sdk';
import {
	clearAndCopyCircularJSON,
	getDefaultCartesianConfig,
	getMomentFormatFromStorage
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { isEqual } from 'lodash';
import * as moment from 'moment';

@Component({
	selector: 'iterpro-period-breakdown',
	templateUrl: './period-breakdown.component.html'
})
export class PeriodBreakdownComponent implements OnChanges {
	@Input() data: any;
	@Input() players: any[];
	@Input() datePeriod: Date[];
	@Input() periodResults: any;
	@Input() labels: boolean;

	dataTit: any;
	optionsTit: any;
	dataLoad: any;
	optionsLoad: any;
	sort = true;

	readonly #translateService = inject(TranslateService);

	ngOnChanges(changes: SimpleChanges) {
		const change = changes['data'];
		if (!!change && this.data) {
			if (!isEqual(change.currentValue, change.previousValue)) {
				this.extractData();
			}
		}

		if (changes.labels) this.extractData();
	}

	extractData() {
		if (this.data) {
			this.renderTit(this.data.period_breakdown.timeInTarget);
			this.renderLoad(this.data.period_breakdown.loadMap, this.#translateService);
		}
	}

	renderTit(data) {
		this.optionsTit = {
			...getDefaultCartesianConfig(),
			indexAxis: 'y'
		};
		this.optionsTit.plugins.legend.display = false;
		this.optionsTit.scales = {
			x: {
				max: 100,
				ticks: {
					color: '#ddd',
					callback: (value, index, values) => (value % 1 === 0 && index === values.length - 1 ? value + '%' : value)
				}
			},
			y: {
				ticks: {
					autoSkip: false,
					color: '#ddd'
				}
			}
		};

		this.optionsTit.plugins.tooltip = {
			callbacks: {
				label: ({ label, formattedValue }) => `${label}: ${Number(formattedValue).toFixed(0)}%`
			}
		};

		this.optionsTit.plugins.datalabels = this.getDatalabels(this.labels);

		this.dataTit = {
			labels: [
				this.#translateService.instant('above'),
				this.#translateService.instant('inTarget'),
				this.#translateService.instant('below')
			],
			datasets: [
				{
					data: [
						Number(data['above']).toFixed(0),
						Number(data['inTarget']).toFixed(0),
						Number(data['below']).toFixed(0)
					],
					backgroundColor: ['#f95d6a', '#14B85E', 'grey'],
					datalabels: {
						align: 'end',
						anchor: 'end'
					}
				}
			]
		};
	}

	renderLoad(data, translate) {
		const categoriesIds = Object.keys(data);
		let tempPlayer: Player;
		let categories = categoriesIds.map(x => {
			tempPlayer = this.players.find(player => player.id === x);
			return tempPlayer ? tempPlayer.displayName : '';
		});
		const dataValues = Object.values(data);
		let gameLoad = dataValues.map((x: any) => Number(x.game_load).toFixed(1));
		let trainingLoad = dataValues.map((x: any) => Number(x.training_load).toFixed(1));
		const tooltipDataForPlayers = {};
		categoriesIds.forEach((item, index) => {
			const displayName = categories[index];
			if (displayName.length > 0) {
				tooltipDataForPlayers[displayName] = data[item];
			}
		});

		[[gameLoad, trainingLoad], categories] = this.sortData([gameLoad, trainingLoad], categories, 'game_loadASC');

		const datasets = [
			{
				data: gameLoad,
				type: 'bar',
				backgroundColor: '#f95d6a',
				label: this.#translateService.instant('game_load')
			},
			{
				data: trainingLoad,
				type: 'bar',
				backgroundColor: '#ffa600',
				label: this.#translateService.instant('training_load')
			}
		];

		this.dataLoad = {
			labels: categories,
			datasets
		};

		this.optionsLoad = {
			...getDefaultCartesianConfig()
		};
		this.optionsLoad.scales.x.stacked = true;
		this.optionsLoad.scales.y.stacked = true;
		// this.optionsLoad.scales.y.max = 100;
		// this.optionsLoad.scales.y.ticks.callback = (value, index, ticksArr) =>
		// 	value % 1 === 0 && index === ticksArr.length - 1 ? value + '%' : value;

		this.optionsLoad.plugins.tooltip = {
			mode: 'index',
			intersect: false,
			callbacks: {
				label: ({ label, dataset, formattedValue }) => {
					const playerData = tooltipDataForPlayers[label];
					if (dataset.label === translate.instant('game_load')) {
						return `Games: ${playerData.countGames} - Total minutes: ${Number(playerData.gameMinutes).toFixed(
							0
						)} min - Total Game Load: ${formattedValue}`;
					} else {
						return `Training sessions: ${playerData.countTrainings} - Total minutes: ${Number(
							playerData.trainingMinutes
						).toFixed()} min - Total Training Load: ${formattedValue}`;
					}
				}
			}
		};

		this.optionsLoad.plugins.datalabels = this.getDatalabels(this.labels);
	}

	onToggleOrder() {
		this.sort = !this.sort;
		this.renderLoad(this.data.period_breakdown.loadMap, this.#translateService);
	}

	sortData(data, categories, metric) {
		if (this.sort) {
			const dataField = metric === 'game_load' + 'ASC' || metric === 'game_load' + 'DESC' ? 'sum' : 'c';
			data[0]
				.map((v, i) => ({
					d1: Number(v),
					d2: Number(data[1][i]),
					sum: Number(v) + Number(data[1][i]),
					c: categories[i]
				}))
				.sort((a, b) => {
					return a[dataField] < b[dataField] ? -1 : a[dataField] === b[dataField] ? 0 : 1;
				})
				.forEach((v, i) => {
					data[0][i] = v.d1;
					data[1][i] = v.d2;
					categories[i] = v.c;
				});

			if (metric.indexOf('DESC') !== -1) {
				data[0] = data[0].reverse();
				data[1] = data[1].reverse();
				categories = categories.reverse();
			}
		}

		return [data, categories];
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
			color: 'black',
			display: context => {
				return context.dataset.type === 'bubble'
					? context.dataset.data[context.dataIndex].y > 0
					: labels
					? context.dataset.data[context.dataIndex] > 0
					: false;
			},
			font: {
				weight: 'bold'
			},
			formatter: (value, context) => (context.dataset.type === 'bubble' ? value.y : value)
		};
	}

	getReport() {
		const t = this.#translateService.instant.bind(this.#translateService);
		const perc = val => (val || val === 0 ? Math.round(val * 100) + '%' : '');
		const toFixed = val => ((val && val.toFixed) || val === 0 ? val.toFixed(0) : '');
		const period =
			this.datePeriod && this.datePeriod.length > 1
				? moment(this.datePeriod[0]).format(getMomentFormatFromStorage()) +
				  ' - ' +
				  moment(this.datePeriod[1]).format(getMomentFormatFromStorage())
				: '';
		const data = {
			info: {
				period: { label: t('sidebar.period'), value: period },
				days: {
					label: t('sidebar.counterDays'),
					value: this.periodResults && this.periodResults.general.totalDays
				},
				trainings: {
					label: t('sidebar.trainingCounter'),
					value: this.periodResults && this.periodResults.general.trainingSessions
				},
				games: {
					label: t('sidebar.gamesCounter'),
					value: this.periodResults && this.periodResults.general.games
				}
			},
			titData: clearAndCopyCircularJSON(this.dataTit),
			titOptions: this.optionsTit,
			loadData: clearAndCopyCircularJSON(this.dataLoad),
			loadOptions: this.optionsLoad,
			time: {
				title: t('workload.timeInTarget')
			},
			overview: {
				title: t('workload.overview'),
				headers: ['', 'N', '%', 'min'],
				values: [
					[t('workload.general.totalDays'), this.data.general.totalDays, '', ''],
					[
						t('workload.general.daysOff'),
						this.data.general.daysOff,
						perc(this.data.general.daysOff / this.data.general.totalDays),
						''
					],
					[
						t('workload.general.trainingSession'),
						this.data.general.trainingSessions,
						perc(this.data.general.trainingSessions / this.data.general.allSessions),
						toFixed(this.data.general.trainingMinutes)
					],
					[
						t('workload.general.games'),
						this.data.general.games,
						perc(this.data.general.games / this.data.general.allSessions),
						toFixed(this.data.general.gameMinutes)
					],
					[
						t('workload.general.totalSessions'),
						this.data.general.allSessions,
						'',
						toFixed(this.data.general.trainingMinutes + this.data.general.gameMinutes)
					]
				]
			}
		};

		return data;
	}
}

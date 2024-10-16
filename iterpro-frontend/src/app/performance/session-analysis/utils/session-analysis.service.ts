import { PercentPipe } from '@angular/common';
import { Injectable, Injector } from '@angular/core';
import {
	DeviceMetricDescriptor,
	Event,
	LoopBackAuth,
	Player,
	SessionPlayerData,
	Team,
	TeamGroup,
	Threshold
} from '@iterpro/shared/data-access/sdk';
import {
	CalendarService,
	ThresholdsService,
	formatLabel,
	getBackendFormat,
	getThresholdActiveValue,
	isNotEmpty,
	getTeamSettings
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { sortBy } from 'lodash';
import * as momentLib from 'moment';
import { extendMoment } from 'moment-range';
import { Observable, of } from 'rxjs';
import {
	ChartFlags,
	FiltersType,
	PeriodMatch,
	PeriodTotalSession,
	PeriodTrendSession,
	SplitSelectItem,
	SummaryMetric
} from './../../../+state/session-analysis-store/ngrx/session-analysis-store.interfaces';
import { ChartInterfaceData, SessionAnalysisChartService } from './session-analysis-chart.service';
const moment = extendMoment(momentLib);

@Injectable({
	providedIn: 'root'
})
export class SessionAnalysisService extends EtlBaseInjectable {
	private sessionAnalysisChartService: SessionAnalysisChartService;
	private percentPipe: PercentPipe;
	private calendar: CalendarService;
	private translate: TranslateService;

	constructor(
		injector: Injector,
		private readonly thresholdsService: ThresholdsService,
		private readonly authService: LoopBackAuth
	) {
		super(injector);
		this.sessionAnalysisChartService = injector.get(SessionAnalysisChartService);
		this.percentPipe = injector.get(PercentPipe);
		this.calendar = injector.get(CalendarService);
		this.translate = injector.get(TranslateService);
	}

	isNotArchived(player, session) {
		return player && (!player.archived || (player.archived && player.archivedDate > session.date));
	}

	isGroup(players) {
		return players && Array.isArray(players);
	}

	extractDefaultMetrics(team: Team): Observable<DeviceMetricDescriptor[]> {
		const activePerformance: string[] =
			getTeamSettings(this.authService.getCurrentUserData().teamSettings, team.id).metricsPerformance || [];
		const metricsMappings = this.etlGpsService.getMetricsMapping();
		return of(activePerformance.map(metric => metricsMappings.find(({ metricName }) => metricName === metric)));
	}

	setGroupThresholds(metrics) {
		const groupThresholds = {};
		metrics.forEach(x => {
			const thr = this.etlGpsService.getDefaultThresholds().find(({ name }) => name === x.metricName);
			groupThresholds[x.metricName] = getThresholdActiveValue(thr);
		});
		return groupThresholds;
	}

	setPlayerThresholds(session, player, metrics, percent, thresholdFlag) {
		const thresholds = {};
		let playerThreholds = [];
		if (player._thresholds) {
			if (percent) {
				playerThreholds = this.thresholdsService.getGpsThresholdsForDayType('GD', player._thresholds);
			} else if (thresholdFlag) {
				if (this.thresholdsService.hasGpsThresholdsForDayType(player._thresholds, null, session.start)) {
					playerThreholds = this.thresholdsService.getGpsThresholdsForDate(session.start, player._thresholds);
				} else {
					// this.alert.notify('warn', 'Session Analysis', 'seasonAnalysis.missingThresholds');
					playerThreholds = [];
				}
			} else {
				playerThreholds = [];
			}
		}

		metrics.forEach(metric => {
			if (metric) {
				const threshold = playerThreholds.find(({ name }) => name === metric.metricName);
				thresholds[metric.metricName] = threshold
					? threshold
					: {
							value: 0,
							intervals: [null, null, null, null]
						};
			}
		});

		return thresholds;
	}

	filterGroupSessions(
		playersSessions: SessionPlayerData[],
		teamGroups: TeamGroup[],
		split: SplitSelectItem,
		modified: FiltersType
	): SessionPlayerData[] {
		return playersSessions.filter(
			({ playerId, splitName, dirty }) =>
				teamGroups.indexOf(playerId) !== -1 &&
				splitName.toLowerCase() === split.label.toLowerCase() &&
				(modified === 0 || this.convertModified(dirty) === modified)
		);
	}

	filterPlayerSessions(
		playersSessions: SessionPlayerData[],
		player: Player,
		split: SplitSelectItem,
		modified: FiltersType
	): SessionPlayerData[] {
		return (
			playersSessions &&
			playersSessions.filter(
				({ playerId, splitName, dirty }) =>
					String(playerId) === String(player.id) &&
					splitName.toLowerCase() === split?.value?.toLowerCase() &&
					(modified === 0 || this.convertModified(dirty) === modified)
			)
		);
	}

	filterMainSession(playersSessions: SessionPlayerData[], player: Player): SessionPlayerData[] {
		return playersSessions.filter(
			({ playerId, mainSession, date }) =>
				String(playerId) === String(player.id) &&
				mainSession &&
				(!player.archived || (player.archived && player.archivedDate > date))
		);
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

	getSummaryValues(currentSession: SessionPlayerData, currentPlayer: Player, activeMetrics: string[]): SummaryMetric[] {
		const currentThresholds: Threshold[] = this.thresholdsService.getGpsThresholdsForDayType(
			'GD',
			currentPlayer._thresholds || []
		);

		const metrics: SummaryMetric[] = [];

		if (isNotEmpty(activeMetrics)) {
			for (const metric of activeMetrics) {
				let metricValue: number = currentSession[metric] ? currentSession[metric] : NaN;

				metricValue = Number(metricValue);
				const thrFound = currentThresholds.find(({ name }) => name === metric);
				const thr = thrFound ? getThresholdActiveValue(thrFound) : 1;

				const metricNormValue = metricValue / thr;
				const colorText = this.getColorText(metricNormValue);

				metrics.push({
					name: this.etlGpsService.getMetricLabel(metric),
					value: Number(metricValue.toFixed(1)),
					norm: metricNormValue,
					colorMetric: colorText
				});
			}
		}

		return metrics;
	}

	getMediumSessionForGroupAndMetric(sessions, group, metrics) {
		const mapSession = new Map<string, SessionPlayerData>();
		const playersInSessionsGroup = [];

		group.players.forEach(player => {
			const playerSession = new SessionPlayerData({
				// playerName: player.toLowerCase()
				playerId: player
			});
			metrics.forEach(metric => {
				playerSession[metric.metricName] = 0;
			});

			mapSession.set(player.toLowerCase(), playerSession);
		});

		sessions.forEach(session => {
			if (!playersInSessionsGroup.includes(session.playerId)) playersInSessionsGroup.push(session.playerId);
			const sessForPlayer = mapSession.get(session.playerId);
			metrics.forEach(metric => {
				if (metric.algo) {
					sessForPlayer[metric.metricName] += session[metric.metricName];
				} else if (metric.metricName in session) {
					sessForPlayer[metric.metricName] += session[metric.metricName];
				}
			});
			sessForPlayer['date'] = session.date;
			mapSession.set(session.playerId, sessForPlayer);
		});

		const sessArray = Array.from(mapSession.entries());

		let mValues = [0, 0];
		let dateToSet: Date = null;
		sessArray.forEach(sessEntry => {
			const sessP: SessionPlayerData = sessEntry[1];
			dateToSet = sessions[0].date;
			metrics.forEach((metric, index) => {
				if (metric.algo) {
					mValues[index] += Number(sessP[metric.metricName]);
				} else if (metric.metricName in sessP) mValues[index] += Number(sessP[metric.metricName]);
			});
		});

		mValues = mValues.map(mValue => mValue / playersInSessionsGroup.length);

		const groupSession: SessionPlayerData = new SessionPlayerData();

		metrics.forEach((x, index) => {
			groupSession[x.metricName] = mValues[index];
		});

		groupSession.playerName = group.name;
		groupSession.date = dateToSet;
		return groupSession;
	}

	getChartDataSessionTeamBubble(
		sessionPlayers: SessionPlayerData[],
		players: (Player | TeamGroup)[],
		metrics: DeviceMetricDescriptor[],
		split: SplitSelectItem,
		modified: FiltersType
	): ChartInterfaceData {
		const categories: string[] = [];

		let sessionToDraw: SessionPlayerData[] = [];

		sortBy(players, 'displayName').forEach(player => {
			const sessArray = this.filterPlayerSessions(sessionPlayers, player as Player, split, modified);

			if (isNotEmpty(sessArray)) {
				sessionToDraw = sessionToDraw.concat(sessArray);
				categories.push((player as Player).displayName);
			}
		});

		const datasets: any = [];
		datasets[0] = [];
		datasets[1] = [];
		datasets[2] = [];

		sessionToDraw.forEach(sp => {
			metrics.forEach((metric, index) => {
				if (metric.metricName in sp && sp[metric.metricName]) {
					if (metric.algo) {
						datasets[index].push(Number(sp[metric.metricName]).toFixed(1));
					} else {
						datasets[index].push(Number(sp[metric.metricName] * 1).toFixed(1));
					}
				} else {
					datasets[index].push(null);
				}
			});
		});

		const chartData: ChartInterfaceData = {
			data: {
				labels: categories.map(x => (x.length > 10 ? formatLabel(x, 25) : x)),
				datasets: this.sessionAnalysisChartService.getDataSessionTeamBubble(datasets, categories)
			},
			options: this.sessionAnalysisChartService.getOptionsSessionTeamBubble(datasets, metrics)
		};

		return chartData;
	}

	getChartDataSessionTeam(
		session: Event,
		playersSessions: SessionPlayerData[],
		players: (Player | TeamGroup)[],
		modified: FiltersType,
		metrics: DeviceMetricDescriptor[],
		split: SplitSelectItem,
		flags: ChartFlags
	): ChartInterfaceData {
		let categories = [];
		let sessionToDraw: SessionPlayerData[] = [];

		const thresholdsMap: Map<any, any> = new Map<any, any>();

		sortBy(players, 'displayName').forEach(player => {
			if (this.isGroup((player as TeamGroup).players)) {
				thresholdsMap[(player as TeamGroup).name.toLowerCase()] = this.setGroupThresholds(metrics);
				const sessForGroup: SessionPlayerData[] = this.filterGroupSessions(
					playersSessions,
					(player as TeamGroup).players,
					split,
					modified
				);

				if (isNotEmpty(sessForGroup)) {
					categories.push((player as TeamGroup).name);
					sessionToDraw.push(this.getMediumSessionForGroupAndMetric(sessForGroup, player, metrics));
				}
			} else {
				thresholdsMap[(player as Player).displayName.toLowerCase()] = this.setPlayerThresholds(
					session,
					player,
					metrics,
					flags.percent,
					flags.thresholds
				);

				const sessArray = this.filterPlayerSessions(playersSessions, player as Player, split, modified);

				if (isNotEmpty(sessArray)) {
					sessionToDraw = sessionToDraw.concat(sessArray);
					categories.push((player as Player).displayName);
				}
			}
		});

		let datasets = [];
		datasets[0] = [];
		datasets[1] = [];

		// extract data to draw
		sessionToDraw.forEach(sp => {
			metrics.forEach((metric, index) => {
				if (metric.metricName in sp && sp[metric.metricName]) {
					const th = thresholdsMap[sp.playerName.toLowerCase()][metric.metricName];
					if (metric.algo) {
						datasets[index].push(
							flags.percent || flags.thresholds
								? th && getThresholdActiveValue(th)
									? Number((sp[metric.metricName] / getThresholdActiveValue(th)) * 100 || 0).toFixed(1)
									: 0
								: Number(sp[metric.metricName]).toFixed(1)
						);
					} else {
						datasets[index].push(
							flags.percent || flags.thresholds
								? th && getThresholdActiveValue(th)
									? Number(((sp[metric.metricName] * 1) / getThresholdActiveValue(th)) * 100 || 0).toFixed(1)
									: 0
								: Number(sp[metric.metricName] * 1).toFixed(1)
						);
					}
				} else {
					datasets[index].push(null);
				}
			});
		});

		if (flags.order) {
			[datasets, categories] = this.sortData(datasets, categories, metrics[0].metricName + 'ASC', metrics[0]);
		}

		const chartData: ChartInterfaceData = {
			data: {
				labels: categories.map(x => (x.length > 10 ? formatLabel(x, 25) : x)),
				datasets: this.sessionAnalysisChartService.getDataSessionTeam(datasets, metrics, thresholdsMap, flags)
			},
			options: this.sessionAnalysisChartService.getOptionsSessionTeam(
				datasets,
				metrics,
				flags.percent,
				flags.thresholds
			)
		};

		return chartData;
	}

	getChartDataSessionIndividual(
		playersSessions: SessionPlayerData[],
		currentPlayer: Player,
		splits: SplitSelectItem[],
		metrics: DeviceMetricDescriptor[],
		chartFlags: ChartFlags
	): ChartInterfaceData {
		const mainSessions: SessionPlayerData[] = this.filterMainSession(playersSessions, currentPlayer);
		const currentMainSession: SessionPlayerData = isNotEmpty(mainSessions) ? mainSessions[0] : null;
		const thresholdPlayer: Threshold[] = this.thresholdsService.getGpsThresholdsForDate(
			currentMainSession ? currentMainSession.date : new Date(),
			currentPlayer._thresholds || []
		);

		let allSessions = playersSessions.filter(({ playerId }) => String(playerId) === String(currentPlayer.id));
		allSessions = allSessions.sort((s1, s2) => moment(s1.splitStartTime).unix() - moment(s2.splitStartTime).unix());

		const barDatasets = [];
		barDatasets[0] = [];
		barDatasets[1] = [];
		const categories = [];

		const metricsThresholds = [];
		metrics.forEach(metric => {
			metricsThresholds.push(thresholdPlayer.find(({ name }) => name === metric.metricName));
		});

		// extract data for bar chart
		allSessions.forEach(sess => {
			const foundS = splits.find(({ label }) => label.toLowerCase() === sess.splitName.toLowerCase());
			if (!sess.mainSession && foundS) {
				categories.push(sess.splitName);
				metrics.forEach((metric, index) => {
					if (metric.algo) {
						barDatasets[index].push(
							chartFlags.percent
								? Number((sess[metric.metricName] / getThresholdActiveValue(metricsThresholds[index])) * 100).toFixed(1)
								: Number(sess[metric.metricName]).toFixed(1)
						);
					} else if (metric.metricName in sess) {
						barDatasets[index].push(
							chartFlags.percent
								? Number(
										((sess[metric.metricName] * 1) / getThresholdActiveValue(metricsThresholds[index])) * 100
									).toFixed(1)
								: Number(sess[metric.metricName] * 1).toFixed(1)
						);
					} else {
						barDatasets[index].push(null);
					}
				});
			}
		});

		const chartData: ChartInterfaceData = {
			data: {
				labels: categories.map(x => (x.length > 10 ? formatLabel(x, 25) : x)),
				datasets: this.sessionAnalysisChartService.getDataSessionIndividual(barDatasets, metrics, chartFlags.labels)
			},
			options: this.sessionAnalysisChartService.getOptionsSessionIndividual(chartFlags.percent, metrics)
		};

		return chartData;
	}

	getRadarChartSessionIndividual(
		currentMainSession: SessionPlayerData,
		thresholdsPlayer: Threshold[],
		metrics: DeviceMetricDescriptor[]
	): ChartInterfaceData {
		if (currentMainSession) {
			const radarDatasets: number[] = [];
			let absolute = [];
			let metricsRadar: string[] = metrics.slice(0, 6).map(({ metricName }) => metricName);

			metricsRadar.forEach(m => {
				const value = thresholdsPlayer.find(({ name }: Threshold) => name === m);
				absolute = [...absolute, currentMainSession[m]];
				radarDatasets.push(
					parseInt(
						this.percentPipe.transform(
							currentMainSession[m] /
								(!value || (getThresholdActiveValue(value) && getThresholdActiveValue(value) === 0)
									? undefined
									: getThresholdActiveValue(value)),
							'1.0-0'
						),
						10
					)
				);
			});

			metricsRadar = metricsRadar.map(x => this.etlGpsService.getMetricLabel(x));

			const radarData: ChartData = this.sessionAnalysisChartService.getRadarDataSessionIndividual(
				radarDatasets,
				metricsRadar
			);
			const radarOptions: ChartOptions = this.sessionAnalysisChartService.getRadarOptionsSessionIndividual(absolute);

			return {
				data: radarData,
				options: radarOptions
			};
		}
	}

	getChartDataPeriodTotal(
		players: (Player | TeamGroup)[],
		sessions: PeriodTotalSession[],
		metrics: DeviceMetricDescriptor[],
		flags: ChartFlags
	): ChartInterfaceData {
		let categories = [];
		let datasets = [];

		const firstMetricArray: number[] = [];
		const secondoMetricArray: number[] = [];
		const thresholdsMap = {};

		sessions = sortBy(
			sessions
				.filter(({ label }) => players.map(({ id }) => id).includes(label))
				.map(({ label, values }) => {
					const player: Player | TeamGroup = players.find(({ id }) => id === label);
					return {
						label: player ? (player as Player).displayName : (player as TeamGroup).name,
						values
					};
				}),
			'label'
		);

		sessions.forEach((session: PeriodTotalSession) => {
			const player = (players as Player[]).find(({ displayName }) => session.label === displayName);

			if (player) {
				thresholdsMap[(player as Player).displayName.toLowerCase()] = this.setPlayerThresholds(
					session,
					player,
					metrics,
					flags.percent,
					flags.thresholds
				);
			} else {
				thresholdsMap[session.label.toLowerCase()] = this.setGroupThresholds(metrics);
			}

			// Create a map from metric
			const sessionValuesMap = new Map(Object.entries(session.values));

			let firstMetricValue = metrics[0] ? sessionValuesMap.get(metrics[0].metricName) : 0;
			let secondMetricValue = metrics[1] ? sessionValuesMap.get(metrics[1].metricName) : 0;

			if (flags.percent) {
				const th1Percent = thresholdsMap[session.label.toLowerCase()][metrics[0].metricName];

				// PUSH IN FIRST METRIC ARRAY
				firstMetricValue =
					th1Percent && getThresholdActiveValue(th1Percent) && firstMetricValue
						? +Number((firstMetricValue / getThresholdActiveValue(th1Percent)) * 100).toFixed(1)
						: 0;

				if (metrics[1]) {
					const th2Percent = thresholdsMap[session.label.toLowerCase()][metrics[1].metricName];
					secondMetricValue =
						th1Percent && getThresholdActiveValue(th1Percent) && secondMetricValue
							? +Number((secondMetricValue / getThresholdActiveValue(th2Percent)) * 100).toFixed(1)
							: 0;
				}
			} else {
				firstMetricValue = +Number(firstMetricValue).toFixed(1);
				secondMetricValue = +Number(secondMetricValue).toFixed(1);
			}

			categories.push(session.label);
			firstMetricArray.push(firstMetricValue);
			secondoMetricArray.push(secondMetricValue);
		});

		datasets = [firstMetricArray, secondoMetricArray];

		if (flags.order) {
			[datasets, categories] = this.sortData(datasets, categories, metrics[0].metricName + 'ASC', metrics[0]);
		}

		const result: ChartInterfaceData = {
			data: {
				labels: categories.map(x => (x.length > 10 ? formatLabel(x, 25) : x)),
				datasets: this.sessionAnalysisChartService.getDataSessionTeam(datasets, metrics, thresholdsMap, flags)
			},
			options: this.sessionAnalysisChartService.getOptionsSessionTeam(
				datasets,
				metrics,
				flags.percent,
				flags.thresholds
			)
		};

		return result;
	}

	getSinglePlayerChartData(
		sessions: PeriodTrendSession[],
		selectedMetrics: DeviceMetricDescriptor[],
		periodTableDate: Map<string, Map<string, { [key: string]: number }[]>>,
		selectedPlayer: Player,
		eventGameData: Map<string, PeriodMatch>
	): ChartInterfaceData {
		// Setting up dates labels
		const labels: any[] = sessions
			.map(x => moment(x.label, getBackendFormat(), this.translate.currentLang))
			.map((x: any) => (x.length > 10 ? formatLabel(x, 25) : x));

		// Setting up datasets

		// Get Player Data
		// const playerData: { [key: string]: number }[][] = Array.from(
		// 	periodTableDate.get(selectedPlayer.displayName).values()
		// );

		const playerData: any = [...periodTableDate.get(selectedPlayer.displayName).entries()]
			.map(([date, values]) => [moment(date, getBackendFormat()).toDate(), values])
			.sort((date1: any, date2: any) => date1 - date2)
			.map(([, values]) => values);

		const datasets = [
			// Session 1 First Metric
			playerData.map(data =>
				isNotEmpty(data) && selectedMetrics[0] ? Number(data[0][selectedMetrics[0].metricName]) : 0
			),
			// Session 2 First Metric
			playerData.map(data =>
				isNotEmpty(data) && data[1] && selectedMetrics[0] ? Number(data[1][selectedMetrics[0].metricName]) : 0
			),
			// Session Avg. Second Metric
			playerData.map(data =>
				isNotEmpty(data) && selectedMetrics[1]
					? Number(
							(data[0] ? data[0][selectedMetrics[1].metricName] : 0) +
								(data[1] ? data[1][selectedMetrics[1].metricName] : 0)
						)
					: 0
			)
		];

		// Setting up options
		const options: ChartOptions = this.sessionAnalysisChartService.getOptionsPeriodTrend(
			selectedMetrics,
			false,
			this.calendar,
			eventGameData,
			this.translate.currentLang
		);

		// Creating Chart Data Object
		const chartData: ChartInterfaceData = {
			data: {
				labels,
				datasets: this.sessionAnalysisChartService.getDataPeriodTrend(datasets, selectedMetrics, null, false, true)
			},
			options
		};

		return chartData;
	}

	getChartDataPeriodTrend(
		sessions: PeriodTrendSession[],
		players: Player[],
		metrics: DeviceMetricDescriptor[],
		eventGameData: Map<string, PeriodMatch>,
		flags: ChartFlags
	): ChartInterfaceData {
		let categories = [];
		let datasets = [];
		let thresholdsLabelsTrend: Threshold[] = [];

		const clonedSessions: PeriodTrendSession[] = [];
		sessions.forEach(s => clonedSessions.push(Object.assign({}, s)));

		clonedSessions
			.filter(s => !!s && !!s.values)
			.forEach(session => {
				const player = players[0];

				if (player) {
					// Init thresholds
					let thresholdPerDay: Threshold[] = [];

					// Check if player has GPS Thresholds for session day
					const hasGpsThresholdsForDayType: boolean = this.thresholdsService.hasGpsThresholdsForDayType(
						player._thresholds,
						null,
						moment(session.label, getBackendFormat()).toDate()
					);

					if (hasGpsThresholdsForDayType) {
						thresholdPerDay = this.thresholdsService.getGpsThresholdsForDate(
							moment(session.label, getBackendFormat()).toDate(),
							player._thresholds
						);
					} else {
						thresholdsLabelsTrend = [];
					}

					// Find correspondig threshols to first metric
					const mappedThreshold: Threshold = thresholdPerDay
						.filter(threshold => threshold && metrics[0])
						.find(({ name }) => name === metrics[0].metricName);

					thresholdsLabelsTrend.push(mappedThreshold || null);
				} else {
					thresholdsLabelsTrend = null;
				}
			});

		categories = sessions.map(x => moment(x.label, getBackendFormat(), this.translate.currentLang));

		// Mappo per ogni sessione il primo valore della prima metrica
		// Mappo per ogni sessione il secondo valore della prima metrica
		// Mappo per ogni sessione la somma del primo e secondo valore della seconda metrica
		// Es: values['rpe'] = [10.3, 8.5, ...]
		datasets = [
			sessions.map(({ values }) => (values && metrics[0] ? Number(values[metrics[0].metricName][0].toFixed(1)) : 0)),
			sessions.map(({ values }) =>
				values && metrics[0] && values[metrics[0].metricName][1]
					? Number(values[metrics[0].metricName][1].toFixed(1))
					: 0
			),
			sessions.map(({ values }) =>
				values && metrics[1]
					? Number((values[metrics[1].metricName][0] || 0) + (values[metrics[1].metricName][1] || 0)).toFixed(1)
					: 0
			)
		];

		if (flags.order) {
			[datasets, categories] = this.sortData(datasets, categories, metrics[0].metricName + 'ASC', metrics[0]);
		}

		const result: ChartInterfaceData = {
			data: {
				labels: categories.map(x => (x.length > 10 ? formatLabel(x, 25) : x)),
				datasets: this.sessionAnalysisChartService.getDataPeriodTrend(
					datasets,
					metrics,
					thresholdsLabelsTrend,
					flags.thresholds,
					flags.labels
				)
			},
			options: this.sessionAnalysisChartService.getOptionsPeriodTrend(
				metrics,
				flags.percent,
				this.calendar,
				eventGameData,
				this.translate.currentLang
			)
		};

		return result;
	}

	getSessionDuration(session: Event, playersSessions: SessionPlayerData[], player?: Player): number {
		const playerSession =
			player && playersSessions.find(({ playerId, mainSession }) => playerId === player.id && mainSession)
				? playersSessions.find(({ playerId, mainSession }) => playerId === player.id && mainSession)
				: { duration: null };

		let duration: number;
		if (playerSession) {
			duration = playerSession.duration;
		} else {
			duration = session ? session.duration : 0;
		}

		return +Number(duration).toFixed(1);
	}

	convertModified(dirty) {
		if (dirty === null || dirty === undefined) return 0;
		if (dirty === true) return 1;
		if (dirty === false) return 2;
	}

	getColorText(value: number): string {
		let colorText = 'transparent';
		if (Number(value) < 0.8) return 'grey';
		else if (Number(value) >= 0.8 && Number(value) < 0.9) return 'yellow';
		else if (Number(value) >= 0.9 && Number(value) < 1.1) colorText = 'green';
		else if (Number(value) >= 1.1 && Number(value) < 1.2) colorText = 'orange';
		else colorText = 'red';
		return colorText;
	}
}

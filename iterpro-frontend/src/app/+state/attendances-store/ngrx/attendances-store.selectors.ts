import { AuthSelectors } from '@iterpro/shared/data-access/auth';
import { Event, Injury, TeamSeason } from '@iterpro/shared/data-access/sdk';
import {
	PRIMARIES,
	copyValue,
	formatLabel,
	getDataLabels,
	getDefaultCartesianConfig,
	primariesExtra
} from '@iterpro/shared/utils/common-utils';
import { MemoizedSelector, createFeatureSelector, createSelector } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { flatten, uniq } from 'lodash';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import {
	getClubGameSessionAttrs,
	getEventAttrs,
	getGameSessionAttrs,
	getInjuryAttrsByStatus,
	getTodayAttrs,
	getTrainingSessionAttrs
} from '../../../manager/attendances/utils/attrs';
import {
	getDatesOfMonth,
	getDays,
	getDaysNumbers,
	getMonth as getMonthNumber,
	getMonths
} from '../../../manager/attendances/utils/date';
import {
	Counter,
	Legend,
	Metric,
	PlayerRole,
	SecondaryTeamStats,
	SessionType,
	TeamType,
	ViewType,
	paletteEvents
} from '../interfaces/attendances-store.interfaces';
import fields from '../utils/items';
import { getCompetitionId } from '../utils/utils';
import { AttendancesDay, AttendancesStore } from './attendances-store.model';
import { State, adapter, attendancesStoresFeatureKey } from './attendances-store.state';

// selectIds, selectEntities, selectAll, selectTotal
const { selectAll } = adapter.getSelectors();

export const selectState: MemoizedSelector<object, State> = createFeatureSelector<State>(attendancesStoresFeatureKey);

const getView = (state: State): ViewType => state.view;
const getToday = (state: State): Date => state.today;
const getYear = (state: State): number => state.year;
const getMonth = (state: State): number => state.month;
const getTooltip = (state: State): string => state.tooltip;
const getDatePeriod = (state: State): [Date, Date] => state.datePeriod;
const getSelectableGroupStats = (state: State): PlayerRole[] => state.selectablePlayerRoles;
const getSelectedGroupStat = (state: State): PlayerRole[] => state.selectedPlayerRoles;
const getSessionType = (state: State): SessionType => state.sessionType;
const getInjuries = (state: State): Injury[] => state.injuries;
const getEvents = (state: State): Event[] => state.events;
const getSelectedMetric = (state: State): string => state.selectedMetric;
const getTeamType = (state: State): TeamType[] => state.teamTypes;
const getPrimaryTeamStats = (state: State): Map<string, any> => state.primaryTeamStats;
const getOrdered = (state: State): boolean => state.ordered;
const getLabelled = (state: State): boolean => state.labelled;
const getLoading = (state: State): boolean => state.loading;

export const selectAllAttendances: MemoizedSelector<object, AttendancesStore[]> = createSelector(
	selectState,
	selectAll
);

export const selectView: MemoizedSelector<object, ViewType> = createSelector(selectState, getView);
export const selectTeamType: MemoizedSelector<object, TeamType[]> = createSelector(selectState, getTeamType);

export const selectViewIsActivityLog: MemoizedSelector<object, boolean> = createSelector(
	selectView,
	view => view === ViewType.ACTIVITY_LOG
);

export const selectViewIsStatistics: MemoizedSelector<object, boolean> = createSelector(
	selectView,
	view => view === ViewType.STATISTICS
);

export const selectToday: MemoizedSelector<object, Date> = createSelector(selectState, getToday);

export const selectYear: MemoizedSelector<object, number> = createSelector(selectState, getYear);

export const selectMonth: MemoizedSelector<object, number> = createSelector(selectState, getMonth);

export const selectTooltip: MemoizedSelector<object, string> = createSelector(selectState, getTooltip);
export const selectDatePeriod: MemoizedSelector<object, [Date, Date]> = createSelector(selectState, getDatePeriod);
export const selectPrimaryTeamStats: MemoizedSelector<object, Map<string, any>> = createSelector(
	selectState,
	getPrimaryTeamStats
);
export const selectIsOrdered: MemoizedSelector<object, boolean> = createSelector(selectState, getOrdered);
export const selectIsLabelled: MemoizedSelector<object, boolean> = createSelector(selectState, getLabelled);
export const selectIsLoading: MemoizedSelector<object, boolean> = createSelector(selectState, getLoading);
export const selectTimeSpan: MemoizedSelector<object, [Date, Date]> = createSelector(
	selectDatePeriod,
	selectYear,
	selectMonth,
	(datePeriod, year, month) => (datePeriod ? datePeriod : getDatesOfMonth(year, month))
);

export const selectFrom: MemoizedSelector<object, Date> = createSelector(selectTimeSpan, timeSpan =>
	timeSpan.length > 0 ? timeSpan[0] : null
);

export const selectTo: MemoizedSelector<object, Date> = createSelector(selectTimeSpan, timeSpan =>
	timeSpan.length > 1 ? timeSpan[1] : null
);

export const selectSelectableGroupStats: MemoizedSelector<object, PlayerRole[]> = createSelector(
	selectState,
	getSelectableGroupStats
);

export const selectSelectedGroupStats: MemoizedSelector<object, PlayerRole[]> = createSelector(
	selectState,
	getSelectedGroupStat
);

export const selectSessionType: MemoizedSelector<object, SessionType> = createSelector(selectState, getSessionType);
export const selectInjuries: MemoizedSelector<object, Injury[]> = createSelector(selectState, getInjuries);
export const selectEvents: MemoizedSelector<object, Event[]> = createSelector(selectState, getEvents);

export const selectCurrentTeamSeason: MemoizedSelector<object, TeamSeason> = createSelector(
	AuthSelectors.selectTeam,
	selectFrom,
	(team, from) =>
		team
			? team.teamSeasons.find(season =>
					moment(from).isBetween(
						moment(season.offseason).startOf('month'),
						moment(season.inseasonEnd).endOf('month'),
						undefined,
						'[]'
					)
			  )
			: null
);
export const selectTeamSeasons: MemoizedSelector<object, TeamSeason[]> = createSelector(
	AuthSelectors.selectTeam,
	selectFrom,
	selectTo,
	(team, from, to) =>
		team
			? team.teamSeasons.filter(
					season =>
						moment(from).isBetween(moment(season.offseason), moment(season.inseasonEnd), undefined, '[]') ||
						moment(to).isBetween(moment(season.offseason), moment(season.inseasonEnd), undefined, '[]')
			  )
			: []
);

export const selectSessionTypeEvents: MemoizedSelector<object, Event[]> = createSelector(
	selectEvents,
	selectSessionType,
	selectViewIsStatistics,
	(events, sessionType, isStatisticsView) => {
		if (isStatisticsView && sessionType !== SessionType.ALL) {
			// to filter events we need a boolean to check against event.individual which is boolean
			// convert filterType (number) (0 -> TEAM, 1 -> INDIVIDUAL) to boolean
			const isIndividual = sessionType === SessionType.INDIVIDUAL;
			events = events.filter(event =>
				[null, undefined].includes(event.individual) ? !isIndividual : event.individual === isIndividual
			);
		}
		return events;
	}
);

export const selectSessionTypeInternationalEvents: MemoizedSelector<object, Event[]> = createSelector(
	selectSessionTypeEvents,
	events => events.filter(event => event.format === 'international')
);

export const selectSessionTypeTrainingEvents: MemoizedSelector<object, Event[]> = createSelector(
	selectSessionTypeEvents,
	events => events.filter(event => event.format === 'training' && event._sessionImport)
);

export const selectSessionTypeMatchEvents: MemoizedSelector<object, Event[]> = createSelector(
	selectSessionTypeEvents,
	events => events.filter(event => event.format === 'game' && event.match)
);
export const selectEventCounter: MemoizedSelector<object, Counter> = createSelector(
	selectSessionTypeTrainingEvents,
	selectSessionTypeMatchEvents,
	selectFrom,
	selectTo,
	(trainings, matches, from, to) => ({
		games: matches.length,
		days: getDays(from, to).length,
		sessions: trainings.length + matches.length,
		trainings: trainings.length
	})
);

export const selectDays: MemoizedSelector<object, number[]> = createSelector(selectFrom, selectTo, (from, to) =>
	getDaysNumbers(from, to)
);

export const selectDayNames: MemoizedSelector<object, string[]> = createSelector(selectDays, selectFrom, (days, from) =>
	days.map(
		day =>
			moment()
				.month(moment(from).month())
				.date(day + 1)
				.format('dd')[0]
	)
);

export const selectYearList: MemoizedSelector<object, SelectItem[]> = createSelector(AuthSelectors.selectTeam, team =>
	[
		...new Set([
			...(team?.teamSeasons || []).map(season => moment(season.offseason).get('year')),
			...(team?.teamSeasons || []).map(season => moment(season.inseasonEnd).get('year'))
		])
	]
		.sort()
		.reverse()
		.map(year => ({
			label: year.toFixed(0),
			value: year
		}))
);

export const selectMonthList = (translate: TranslateService): MemoizedSelector<object, SelectItem[]> =>
	createSelector(selectToday, selectYear, (today, year) => {
		let months: SelectItem[] = getMonths();
		if (moment().get('year') === year) {
			const todayMonth = getMonthNumber(today);
			months = months.filter(month => month.value <= todayMonth);
		}
		return months.map(month => ({ label: translate.instant(month.label), value: month.value }));
	});

export const selectDefaultDatePeriod: MemoizedSelector<object, [Date, Date]> = createSelector(
	selectDatePeriod,
	selectYear,
	selectMonth,
	selectDays,
	(datePeriod, year, month, days) =>
		datePeriod
			? datePeriod
			: [
					moment()
						.startOf('day')
						.set({ year, month: month - 1, date: days[0] + 1 })
						.toDate(),
					moment()
						.startOf('day')
						.set({ year, month: month - 1, date: days[days.length - 1] + 1 })
						.toDate()
			  ]
);

export const selectAllMetrics: MemoizedSelector<object, Metric[]> = createSelector(
	selectState,
	() => fields['metrics']
);

export const selectIsPrimaryTeam: MemoizedSelector<object, boolean> = createSelector(
	selectTeamType,
	teamTypes => teamTypes.indexOf(TeamType.PRIMARY) > -1
);

export const selectIsNationalPrimaryTeam: MemoizedSelector<object, boolean> = createSelector(
	AuthSelectors.selectIsNationalClub,
	selectIsPrimaryTeam,
	(isNationalClub, isPrimaryTeam) => isNationalClub && isPrimaryTeam
);

export const selectIsSecondaryTeam: MemoizedSelector<object, boolean> = createSelector(
	selectTeamType,
	teamTypes => teamTypes.indexOf(TeamType.SECONDARY) > -1
);

export const selectIsNationalSecondaryTeam: MemoizedSelector<object, boolean> = createSelector(
	AuthSelectors.selectIsNationalClub,
	selectIsSecondaryTeam,
	(isNationalClub, isSecondaryTeam) => isNationalClub && isSecondaryTeam
);

export const selectMetrics: MemoizedSelector<object, Metric[]> = createSelector(
	selectIsNationalSecondaryTeam,
	selectAllMetrics,
	(isNationalSecondaryTeam, metrics) =>
		isNationalSecondaryTeam ? metrics.filter(metric => !!metric.clubGame) : metrics
);

export const selectSelectedMetric: MemoizedSelector<object, string> = createSelector(selectState, getSelectedMetric);

export const selectDefaultMetric: MemoizedSelector<object, string> = createSelector(selectMetrics, metrics =>
	metrics.length > 0 ? metrics[0].value : null
);

export const selectMetric: MemoizedSelector<object, string> = createSelector(
	selectSelectedMetric,
	selectDefaultMetric,
	(userMetric, defaultMetric) => (userMetric ? userMetric : defaultMetric)
);

export const selectClubLegend: MemoizedSelector<object, Legend[]> = createSelector(selectState, () => [
	{
		label: 'event.format.training',
		attrs: getEventAttrs({ format: 'training' })
	},
	{
		label: 'workloadAnalysis.options.individual.yes',
		attrs: getTrainingSessionAttrs({ individual: true })
	},
	{
		label: 'event.format.modified',
		attrs: getTrainingSessionAttrs({ dirty: true })
	},
	{
		label: 'event.format.doubleSession',
		attrs: { ...getTrainingSessionAttrs(null), text: 'D' }
	},
	{
		label: 'event.format.gym',
		attrs: getEventAttrs({ format: 'gym' })
	},
	{
		label: 'event.format.game',
		attrs: getGameSessionAttrs(null)
	},
	{
		label: 'event.format.friendlyGame',
		attrs: getEventAttrs({ format: 'friendly' })
	},
	{
		label: 'event.format.internationalDuty',
		attrs: getEventAttrs({ format: 'international' })
	},
	{
		label: 'event.format.off',
		attrs: getEventAttrs({ format: 'off' })
	},
	{
		label: 'event.format.today',
		attrs: getTodayAttrs()
	},
	// { label: '', attrs: null },
	{
		label: 'medical.infirmary.details.statusList.assessment',
		attrs: getInjuryAttrsByStatus('medical.infirmary.details.statusList.assessment')
	},
	{
		label: 'medical.infirmary.details.statusList.therapy',
		attrs: getInjuryAttrsByStatus('medical.infirmary.details.statusList.therapy')
	},
	{
		label: 'medical.infirmary.details.statusList.rehab',
		attrs: getInjuryAttrsByStatus('medical.infirmary.details.statusList.rehab')
	},
	{
		label: 'medical.infirmary.details.statusList.reconditioning',
		attrs: getInjuryAttrsByStatus('medical.infirmary.details.statusList.reconditioning')
	},
	{
		label: 'medical.infirmary.details.statusList.returnToPlay',
		attrs: getInjuryAttrsByStatus('medical.infirmary.details.statusList.returnToPlay')
	}
	// { label: '', attrs: null }
]);

export const selectNationalLegend: MemoizedSelector<object, Legend[]> = createSelector(selectState, () => [
	{
		label: 'event.format.training',
		attrs: getEventAttrs({ format: 'training' })
	},
	{
		label: 'workloadAnalysis.options.individual.yes',
		attrs: getTrainingSessionAttrs({ individual: true })
	},
	{
		label: 'event.format.modified',
		attrs: getTrainingSessionAttrs({ dirty: true })
	},
	{
		label: 'event.format.doubleSession',
		attrs: { ...getTrainingSessionAttrs(null), text: 'D' }
	},
	{
		label: 'event.format.gym',
		attrs: getEventAttrs({ format: 'gym' })
	},
	{
		label: 'event.format.game',
		attrs: getGameSessionAttrs(null)
	},
	{
		label: 'event.format.friendlyGame',
		attrs: getEventAttrs({ format: 'friendly' })
	},
	{
		label: 'event.format.clubGame',
		attrs: getClubGameSessionAttrs(null, null)
	},
	{
		label: 'event.format.off',
		attrs: getEventAttrs({ format: 'off' })
	},
	{
		label: 'event.format.today',
		attrs: getTodayAttrs()
	},
	// { label: '', attrs: null },
	{
		label: 'medical.infirmary.details.statusList.assessment',
		attrs: getInjuryAttrsByStatus('medical.infirmary.details.statusList.assessment')
	},
	{
		label: 'medical.infirmary.details.statusList.therapy',
		attrs: getInjuryAttrsByStatus('medical.infirmary.details.statusList.therapy')
	},
	{
		label: 'medical.infirmary.details.statusList.rehab',
		attrs: getInjuryAttrsByStatus('medical.infirmary.details.statusList.rehab')
	},
	{
		label: 'medical.infirmary.details.statusList.reconditioning',
		attrs: getInjuryAttrsByStatus('medical.infirmary.details.statusList.reconditioning')
	},
	{
		label: 'medical.infirmary.details.statusList.returnToPlay',
		attrs: getInjuryAttrsByStatus('medical.infirmary.details.statusList.returnToPlay')
	}
	// { label: '', attrs: null }
]);

export const selectLegend: MemoizedSelector<object, Legend[]> = createSelector(
	AuthSelectors.selectIsNationalClub,
	selectNationalLegend,
	selectClubLegend,
	(isNationalClub, nationalLegend, clubLegend) => (isNationalClub ? nationalLegend : clubLegend)
);

const extractClubGameStats = (attendances: AttendancesStore[], sumPrimaryStats = false) => {
	const result: Map<string, SecondaryTeamStats> = new Map<string, SecondaryTeamStats>();

	let key: string;
	let days: AttendancesDay[];
	attendances.forEach(attendance => {
		key = attendance.player.id;

		result[key] = {
			apps: 0,
			appsBySubFormat: {},
			minutesPlayed: 0,
			minutesPlayedBySubFormat: {},
			startingApps: 0,
			substitutingApps: 0,
			gameRate: 0,
			daysPerGame: 0
		};
		days = attendance.days;
		let startEvent: Date;
		const daysPerGame: number[] = [];
		let totalMinutes = 0;

		days.forEach(day => {
			day.items
				.filter(({ event }) => !!event)
				.forEach(({ event, type }) => {
					const subformat = event.subformat;
					const info = event._playerMatchStats.find(stats => stats.playerId === key);
					if (info) {
						const { minutesPlayed, substituteInMinute } = info;
						if (type === 'clubGame') {
							result[key].apps++;
							result[key].minutesPlayed += minutesPlayed;

							if (!result[key].appsBySubFormat[subformat]) {
								result[key].appsBySubFormat[subformat] = 0;
							}
							result[key].appsBySubFormat[subformat]++;

							if (!result[key].minutesPlayedBySubFormat[subformat]) {
								result[key].minutesPlayedBySubFormat[subformat] = 0;
							}
							result[key].minutesPlayedBySubFormat[subformat] += minutesPlayed;

							if (!substituteInMinute) {
								result[key].startingApps++;
							} else {
								result[key].substitutingApps++;
							}
						}

						if (sumPrimaryStats || type === 'clubGame') {
							if (startEvent) {
								daysPerGame.push(moment(event.start).dayOfYear() - moment(startEvent).dayOfYear() - 1); // -1 because we need days _between_ events
							}
							startEvent = event.start;
							totalMinutes += minutesPlayed;
						}
					}
				});
		});

		result[key].gameRate = totalMinutes / 90;
		result[key].daysPerGame = daysPerGame.length > 0 ? daysPerGame.reduce((a, b) => a + b, 0) / daysPerGame.length : 0;
	});
	return result;
};

export const selectCompetitionStatLabels: MemoizedSelector<object, string[]> = createSelector(
	AuthSelectors.selectIsNationalClub,
	selectIsNationalPrimaryTeam,
	selectIsNationalSecondaryTeam,
	(isNationalClub, isNationalPrimaryTeam, isNationalSecondaryTeam) => {
		const clubCompetitions = ['nationalCup', 'internationalCup', 'nationalLeague'];
		if (!isNationalClub) {
			return [...clubCompetitions, 'friendly'];
		}
		const labels = isNationalPrimaryTeam
			? ['tournament', 'tournamentQualifiers', 'tournamentFinalStages', 'friendly']
			: [];
		return isNationalSecondaryTeam ? [...labels, ...clubCompetitions, 'Club friendly'] : labels;
	}
);

export const selectMetricLabels: MemoizedSelector<object, string[]> = createSelector(
	selectMetric,
	selectMetrics,
	selectCompetitionStatLabels,
	AuthSelectors.selectIsNationalClub,
	(metric, metrics, competitionLabels, isNationalClub) => {
		switch (metric) {
			case 'attendance.statistics.items.apps':
			case 'attendance.statistics.items.minutesPlayed': {
				return competitionLabels;
			}
			case 'attendance.statistics.items.performanceReliability': {
				return ['attendance.statistics.performanceReliability'];
			}
			case 'attendance.statistics.items.robustness': {
				return ['attendance.statistics.robustness'];
			}
			case 'attendance.statistics.items.daysMissedInjury': {
				return ['attendance.statistics.gamesMissedThroughInjury', 'attendance.statistics.trainingMissedThroughInjury'];
			}
			case 'attendance.statistics.items.daysMissedInternationalDuties': {
				return [
					'attendance.statistics.gamesMissedThroughInternational',
					'attendance.statistics.trainingMissedThroughInternational'
				];
			}
			case 'attendance.statistics.items.daysMissedOthers': {
				return ['attendance.statistics.gamesMissedThroughOthers', 'attendance.statistics.trainingMissedThroughOthers'];
			}
			case 'attendance.statistics.items.periodBreakdown': {
				const breakdownLabels = [
					'event.format.general',
					'event.format.travel',
					'event.format.training',
					'event.format.game',
					'event.format.friendly',
					'event.format.gym',
					'event.format.administration',
					'event.format.medical',
					'event.format.off'
				];
				return isNationalClub ? breakdownLabels : [...breakdownLabels, 'event.format.internationalDuty'];
			}
			case 'attendance.statistics.items.availability': {
				return [
					'attendance.statistics.items.availability',
					'attendance.statistics.gameAvailability',
					'attendance.statistics.trainingAvailability'
				];
			}
			case 'attendance.statistics.items.startingApps': {
				return ['attendance.statistics.playerStartingApps', 'attendance.statistics.playerSubstituteApps'];
			}
			case 'attendance.statistics.percTrainingTime': {
				return ['attendance.statistics.percTrainingTime'];
			}
			case 'attendance.statistics.percGameTime': {
				return ['attendance.statistics.percGameTime'];
			}
			case 'attendance.statistics.items.daysPerGame':
			case 'attendance.statistics.items.gameRate':
			case 'attendance.statistics.items.playingTime':
			default: {
				const found = metrics.find((m: Metric) => m.value === metric);
				return found ? [found.label] : [];
			}
		}
	}
);

export const selectSecondaryTeamStats: MemoizedSelector<object, Map<string, SecondaryTeamStats>> = createSelector(
	selectIsNationalSecondaryTeam,
	selectAllAttendances,
	selectTeamType,
	(isNationalSecondaryTeam, attendances, teamType) =>
		isNationalSecondaryTeam ? extractClubGameStats(attendances, teamType.indexOf(TeamType.PRIMARY) > -1) : null
);

const parseStats = (
	dataToParse: Map<string, any>,
	metric: string,
	players: PlayerRole[],
	metricLabels: string[],
	ordered: boolean,
	seasons: TeamSeason[]
): ChartData => {
	let data: ChartData = { datasets: [], labels: [] };
	let datasets: number[][] = [[]];
	const datasetData = [];
	for (const key in dataToParse) {
		if (players.map(x => x.id).includes(key)) datasetData.push(dataToParse[key]);
	}
	if (datasetData.length > 0) {
		switch (metric) {
			case 'attendance.statistics.items.gameRate': {
				datasetData.forEach(x => datasets[0].push(x.gameRate));
				break;
			}
			case 'attendance.statistics.items.playingTime': {
				datasetData.forEach(x => datasets[0].push(x.playingTime));
				break;
			}
			case 'attendance.statistics.items.minutesPlayed': {
				const labels = (
					uniq(flatten(datasetData.map(({ minutesPlayedBySubFormat }) => Object.keys(minutesPlayedBySubFormat)))) || []
				).sort();
				metricLabels = labels.map(x => getCompetitionId(x, metricLabels, seasons));
				const subformatMap = {};
				if (labels.length > 0) {
					labels.forEach((x, index) => {
						subformatMap[x] = index;
						datasets[index] = [];
					});
					datasetData.forEach(x => {
						labels.forEach(val => {
							const indexArr = subformatMap[val];
							datasets[indexArr].push(val in x.minutesPlayedBySubFormat ? x.minutesPlayedBySubFormat[val] : 0);
						});
					});
				}

				break;
			}
			case 'attendance.statistics.items.daysPerGame': {
				datasetData.forEach(x => datasets[0].push(x.daysPerGame));
				break;
			}
			case 'attendance.statistics.items.availability': {
				datasets = [[], [], []];
				datasetData.forEach(x => {
					datasets[0].push(x.availability);
					datasets[1].push(x.gameAvailability);
					datasets[2].push(x.trainingAvailability);
				});
				break;
			}
			case 'attendance.statistics.items.performanceReliability': {
				datasetData.forEach(x => datasets[0].push(x.performanceReliability));
				break;
			}
			case 'attendance.statistics.items.robustness': {
				datasetData.forEach(x => datasets[0].push(x.robustness));
				break;
			}
			case 'attendance.statistics.items.daysMissedInjury': {
				datasets = [[], []];
				datasetData.forEach(x => {
					datasets[0].push(x.gamesMissedInjuries);
					datasets[1].push(x.trainingsMissedInjuries);
				});
				break;
			}
			case 'attendance.statistics.items.daysMissedInternationalDuties': {
				datasets = [[], []];
				datasetData.forEach(x => {
					datasets[0].push(x.gamesMissedInternational);
					datasets[1].push(x.trainingsMissedInternational);
				});
				break;
			}
			case 'attendance.statistics.items.daysMissedOthers': {
				datasets = [[], []];
				datasetData.forEach(x => {
					datasets[0].push(x.gamesMissedOthers);
					datasets[1].push(x.trainingsMissedOthers);
				});
				break;
			}
			case 'attendance.statistics.items.periodBreakdown': {
				datasets = metricLabels.map(() => []);
				const hasInternationalDuty = datasets.length > 9;
				for (const { periodBreakDown } of datasetData) {
					datasets[0].push('general' in periodBreakDown ? periodBreakDown['general'] : 0);
					datasets[1].push('travel' in periodBreakDown ? periodBreakDown['travel'] : 0);
					datasets[2].push('training' in periodBreakDown ? periodBreakDown['training'] : 0);
					datasets[3].push('game' in periodBreakDown ? periodBreakDown['game'] : 0);
					datasets[4].push('friendly' in periodBreakDown ? periodBreakDown['friendly'] : 0);
					datasets[5].push('gym' in periodBreakDown ? periodBreakDown['gym'] : 0);
					datasets[6].push('administration' in periodBreakDown ? periodBreakDown['administration'] : 0);
					datasets[7].push('medical' in periodBreakDown ? periodBreakDown['medical'] : 0);
					datasets[8].push('off' in periodBreakDown ? periodBreakDown['off'] : 0);
					if (hasInternationalDuty) {
						datasets[9].push('international' in periodBreakDown ? periodBreakDown['international'] : 0);
					}
				}
				break;
			}
			case 'attendance.statistics.items.apps': {
				const labels = (
					uniq(flatten(datasetData.map(({ appsBySubFormat }) => Object.keys(appsBySubFormat)))) || []
				).sort();
				metricLabels = labels.map(x => getCompetitionId(x, metricLabels, seasons));
				const subformatMap = {};
				if (labels.length > 0) {
					labels.forEach((x, index) => {
						subformatMap[x] = index;
						datasets[index] = [];
					});
					datasetData.forEach(x => {
						labels.forEach(val => {
							const indexArr = subformatMap[val];
							datasets[indexArr].push(val in x.appsBySubFormat ? x.appsBySubFormat[val] : 0);
						});
					});
				}

				break;
			}
			case 'attendance.statistics.items.startingApps': {
				datasets = [[], []];
				datasetData.forEach(x => {
					datasets[0].push(x.startingApps);
					datasets[1].push(x.substitutingApps);
				});
				break;
			}
			case 'attendance.statistics.percTrainingTime': {
				datasetData.forEach(x => datasets[0].push(x.trainingPercentCalled));
				break;
			}
			case 'attendance.statistics.percGameTime': {
				datasetData.forEach(x => datasets[0].push(x.gamePercentCalled));
				break;
			}
		}
		data = {
			labels: [],
			datasets: []
		};

		let categories = players.map(x => (!x.playerIds ? x.displayName : x.name));

		if (categories && categories.length > 0) {
			if (ordered) {
				const first = datasets[0];
				const rest = datasets.slice(1);
				const prop = metric === 'attendance.statistics.items.availability' ? 'd0' : 'sum';
				const joinedDataset = first.map((val, i) => {
					const obj = {};
					obj['category'] = categories[i];
					obj['sum'] = val;
					obj['d0'] = val;
					rest.forEach((set, j) => {
						obj['d' + (j + 1)] = set[i];
						obj['sum'] += set[i];
					});
					return obj;
				});

				joinedDataset.sort((a, b) =>
					Number(a[prop]) < Number(b[prop]) ? -1 : Number(a[prop]) === Number(b[prop]) ? 0 : 1
				);
				datasets = datasets.map((_value, i) => joinedDataset.map(obj => obj['d' + i]));

				categories = joinedDataset.map(obj => obj['category']);
			}

			data.labels = categories.map(x => (x ? (x.length > 10 ? formatLabel(x, 25) : x) : ''));

			const isPeriodBreakdown = metric === 'attendance.statistics.items.periodBreakdown';

			data.datasets = datasets.map((dataset, index) => ({
				data: dataset.map(x => Number(Number(x).toFixed(1))),
				backgroundColor: isPeriodBreakdown ? paletteEvents[index] : PRIMARIES.concat(primariesExtra)[index],
				label: metricLabels[index] || '',
				barPercentage: 0.8,
				categoryPercentage: 0.5
			}));
		}
	}

	return data;
};

const sumRawStats = (rawStat: any, toAddStat: any) => {
	const sumStat = {};
	for (const key in rawStat) {
		sumStat[key] = rawStat[key];
	}
	for (const key in toAddStat) {
		sumStat[key] =
			['daysPerGame', 'gameRate'].indexOf(key) < 0 && !!rawStat[key]
				? typeof rawStat[key] === 'object'
					? sumRawStats(rawStat[key], toAddStat[key])
					: rawStat[key] + toAddStat[key]
				: toAddStat[key];
	}
	return sumStat;
};

export const selectRawStats: MemoizedSelector<object, any> = createSelector(
	selectTeamType,
	selectPrimaryTeamStats,
	selectSecondaryTeamStats,
	(teamType, primaryTeamStats, secondaryTeamStats) => {
		const rawStats = {};
		if (teamType.indexOf(TeamType.PRIMARY) > -1) {
			for (const key in primaryTeamStats) {
				rawStats[key] = primaryTeamStats[key];
			}
		}
		if (teamType.indexOf(TeamType.SECONDARY) > -1) {
			for (const key in secondaryTeamStats) {
				rawStats[key] = rawStats[key] ? sumRawStats(rawStats[key], secondaryTeamStats[key]) : secondaryTeamStats[key];
			}
		}
		return rawStats;
	}
);

export const selectParsedStats: MemoizedSelector<object, ChartData> = createSelector(
	selectRawStats,
	selectMetric,
	selectSelectedGroupStats,
	selectMetricLabels,
	selectIsOrdered,
	selectTeamSeasons,
	(stats, metric, players, metricLabels, ordered, seasons) =>
		parseStats(stats, metric, players, metricLabels, ordered, seasons)
);

export const selectAttendanceStats: MemoizedSelector<object, ChartData> = createSelector(
	selectParsedStats,
	selectIsLabelled,
	(data, showLabels) => {
		const temp = copyValue(data);
		(data.datasets as any[]).forEach(x => {
			x.datalabels = getDataLabels(showLabels);
		});
		data = copyValue(temp);
		return data;
	}
);

export const selectAttendanceStatsOptions: MemoizedSelector<object, ChartOptions> = createSelector(
	selectMetric,
	selectRawStats,
	selectSelectedGroupStats,
	(metric, rawStats, playersInfo) => {
		const options: ChartOptions = {
			...getDefaultCartesianConfig(),
			// animation: undefined,
			responsive: true,
			maintainAspectRatio: true
		};

		if (metric === 'attendance.statistics.items.availability' || metric === 'attendance.statistics.items.playingTime') {
			options.scales['y'].ticks.callback = (value: number, index: number) =>
				value % 1 === 0 && index === 0 ? value + '%' : value;
			(options.scales['y'] as any).suggestedMax = 100;
		} else if (
			metric === 'attendance.statistics.items.daysMissedInjury' ||
			metric === 'attendance.statistics.items.daysMissedInternationalDuties' ||
			metric === 'attendance.statistics.items.daysMissedOthers' ||
			metric === 'attendance.statistics.items.periodBreakdown' ||
			metric === 'attendance.statistics.items.minutesPlayed' ||
			metric === 'attendance.statistics.items.apps' ||
			metric === 'attendance.statistics.items.startingApps'
		) {
			(options.scales['x'] as any).stacked = true;
			(options.scales['y'] as any).stacked = true;
		}

		options.plugins.tooltip = {
			mode: 'index',
			intersect: false
			// callbacks: {
			// 	title: (tooltipItem: any[]) =>
			// 		Array.isArray(tooltipItem[0].xLabel) ? tooltipItem[0].xLabel.join(' ') : tooltipItem[0].xLabel,
			// 	label: (tooltipItem: any, { datasets }: { datasets: any[] }) => {
			// 		const tooltipLabel = datasets[tooltipItem.datasetIndex].label;

			// 		let label = !!tooltipLabel && tooltipLabel.length > 0 ? tooltipLabel + ': ' : '';
			// 		label += Math.round(tooltipItem.yLabel * 100) / 100;

			// 		if (metric === 'attendance.statistics.items.periodBreakdown') {
			// 			// Searching for player with player's displayName which is matched with chart's xLabel also.
			// 			const playerName = Array.isArray(tooltipItem.xLabel) ? tooltipItem.xLabel.join(' ') : tooltipItem.xLabel;
			// 			const player = playersInfo.find(({ displayName }) => displayName === playerName);
			// 			const minutes: any =
			// 				!!player && !!rawStats[player.id]
			// 					? // save the periodBreakDownMinutes minutes which gives minutes per activity.
			// 					  rawStats[player.id].periodBreakDownMinutes
			// 					: {};
			// 			const breakdownLabel = [
			// 				'general',
			// 				'travel',
			// 				'training',
			// 				'game',
			// 				'friendly',
			// 				'gym',
			// 				'administration',
			// 				'medical',
			// 				'off',
			// 				'internationalDuty'
			// 			][tooltipItem.datasetIndex];

			// 			// append the minutes to label
			// 			label = minutes[breakdownLabel] ? label + ' - ' + minutes[breakdownLabel].toFixed(0) + ' min' : '';
			// 		}

			// 		return label;
			// 	}
			// }
		};

		return options;
	}
);

export const selectPlayersStats: MemoizedSelector<object, Map<string, Record<string, number>>> = createSelector(
	selectAllAttendances,
	attendances => {
		const map: Map<string, Record<string, number>> = new Map();

		attendances.forEach(attendance => {
			const reduced: Record<string, number> = attendance.days
				.filter(d => d.current.legend && d.current.legend !== 'today')
				.map(day => day.current.legend as string)
				.reduce((occurrences, item) => {
					occurrences[item] = (occurrences[item] || 0) + 1;
					return occurrences;
				}, {});

			map.set(attendance.player.displayName, reduced);
		});

		return map;
	}
);

import {
	DeviceMetricDescriptor,
	Event,
	Player,
	SessionPlayerData,
	Team,
	TeamGroup,
	TeamSeason
} from '@iterpro/shared/data-access/sdk';
import { getBackendFormat, getMomentFormatFromStorage, isNotEmpty } from '@iterpro/shared/utils/common-utils';
import { MemoizedSelector, createFeatureSelector, createSelector } from '@ngrx/store';
import { sortBy, uniqBy } from 'lodash';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import {
	ALCLIndividual,
	AdvancedEnum,
	AdvancedMetricData,
	BubbleMetrics,
	ChartFlags,
	FiltersType,
	PeriodAnalysis,
	PeriodMatch,
	PeriodTotalSession,
	PeriodTrendSession,
	RouteParams,
	SemaphoreMetricValue,
	SessionAnalysis,
	SessionsType,
	SplitSelectItem,
	TrendTableData,
	ViewFlags,
	Views
} from './session-analysis-store.interfaces';
import { State, sessionAnalysisStoreFeatureKey } from './session-analysis-store.state';

//#region GETTERS
const getRouteParams = (state: State): RouteParams => state.routeParams;
const getTeam = (state: State): Team => state.selectedTeam;
const getView = (state: State): Views => state.selectedView;
const getSessionView = (state: State): SessionAnalysis => state.sessionFilters.selectedAnalysis;
const getPeriodView = (state: State): PeriodAnalysis => state.periodFilters.selectedAnalysis;
const getSeasons = (state: State): TeamSeason[] => orderSeasons(state.seasons);
const getPlayers = (state: State): Player[] | TeamGroup[] => orderPlayers(state.players);
const getGroups = (state: State): TeamGroup[] => state.groups;
const getMetrics = (state: State): DeviceMetricDescriptor[] => state.metrics;
const getSessionSplits = (state: State): SplitSelectItem[] => state.sessionFilters.splits;
const getPeriodSplits = (state: State): SplitSelectItem[] => state.periodFilters.splits;
const getSessions = (state: State): Event[] => orderSessions(state.sessionFilters.sessions);
const getSelectedFilter = (state: State): FiltersType => state.selectedFilter;
const getSelectedSeason = (state: State): TeamSeason => state.selectedSeason;
const getPlayersSessions = (state: State): SessionPlayerData[] => state.sessionFilters.playersSessions;
const getSelectedSession = (state: State): Event => state.sessionFilters.selectedSession;
const getSelectedDatePeriod = (state: State): Date[] => state.periodFilters.selectedDatePeriod;
const getSelectedSessionPlayers = (state: State): (Player | TeamGroup)[] => state.sessionFilters.selectedPlayers;
const getSelectedPeriodPlayers = (state: State): (Player | TeamGroup)[] => state.periodFilters.selectedPlayers;
const getSelectedIndividualPlayer = (state: State): Player => state.sessionFilters.selectedIndividualPlayer;
const getSelectedMetrics = (state: State): DeviceMetricDescriptor[] => state.selectedMetrics;
const getSelectedBubbleMetrics = (state: State): BubbleMetrics => state.sessionFilters.bubbleMetrics;
const getSelectedSessionTeamSplit = (state: State): SplitSelectItem => state.sessionFilters.selectedTeamSplit;
const getSelectedSessionIndividualSplits = (state: State): SplitSelectItem[] =>
	state.sessionFilters.selectedIndividualSplits;
const getSelectedPeriodSplits = (state: State): SplitSelectItem[] => state.periodFilters.selectedSplits;
const getChartFlags = (state: State): ChartFlags => state.chartFlags;
const getViewFlags = (state: State): ViewFlags => state.viewFlags;
const getSelectedAdvanced = (state: State): AdvancedEnum => state.advanced.selectedAdvanced;
const getAdvancedProgress = (state: State): boolean => state.advanced.advancedProgress;
const getPeriodGames = (state: State): number => state.periodFilters.games;
const getPeriodTrainings = (state: State): number => state.periodFilters.trainings;
const getPeriodTotalSessions = (state: State): PeriodTotalSession[] => state.periodFilters.periodTotalSessions;
const getPeriodTrendSessions = (state: State): PeriodTrendSession[] => state.periodFilters.periodTrendSessions;
const getSelectedPeriodSessionType = (state: State): SessionsType => state.periodFilters.selectedSessionType;
const getSelectedPeriodEventData = (state: State): Map<string, PeriodMatch> => state.periodFilters.eventData;
const getSelectedPeriodTrendTableData = (state: State): Map<string, TrendTableData[]> => state.periodFilters.tableData;
const getThresholdsEnableFlag = (state: State): ChartFlags => state.chartFlagsEnable;
// #endregion

//#region BASIC SELECTORS
export const selectState: MemoizedSelector<object, State> =
	createFeatureSelector<State>(sessionAnalysisStoreFeatureKey);
export const selectRouteParams: MemoizedSelector<object, RouteParams> = createSelector(selectState, getRouteParams);
export const selectSelectedView: MemoizedSelector<object, Views> = createSelector(selectState, getView);
export const selectSelectedSessionAnalysisView: MemoizedSelector<object, SessionAnalysis> = createSelector(
	selectState,
	getSessionView
);
export const selectSelectedPeriodAnalysisView: MemoizedSelector<object, PeriodAnalysis> = createSelector(
	selectState,
	getPeriodView
);
export const selectSelectedTeam: MemoizedSelector<object, Team> = createSelector(selectState, getTeam);
export const selectSeasons: MemoizedSelector<object, TeamSeason[]> = createSelector(selectState, getSeasons);
export const selectPlayers: MemoizedSelector<object, Player[] | TeamGroup[]> = createSelector(selectState, getPlayers);
export const selectGroups: MemoizedSelector<object, TeamGroup[]> = createSelector(selectState, getGroups);
export const selectMetrics: MemoizedSelector<object, DeviceMetricDescriptor[]> = createSelector(
	selectState,
	getMetrics
);
export const selectMetricsLabels: MemoizedSelector<object, string[]> = createSelector(
	selectMetrics,
	(metrics: DeviceMetricDescriptor[]) => metrics.map(({ metricLabel }) => metricLabel)
);
export const selectSessionSplits: MemoizedSelector<object, SplitSelectItem[]> = createSelector(
	selectState,
	getSessionSplits
);
export const selectPeriodSplits: MemoizedSelector<object, SplitSelectItem[]> = createSelector(
	selectState,
	getPeriodSplits
);
export const selectSessions: MemoizedSelector<object, Event[]> = createSelector(selectState, getSessions);
export const selectPlayersSessions: MemoizedSelector<object, SessionPlayerData[]> = createSelector(
	selectState,
	getPlayersSessions
);
export const selectSelectedSeason: MemoizedSelector<object, TeamSeason> = createSelector(
	selectState,
	getSelectedSeason
);
export const selectSelectedSession: MemoizedSelector<object, Event> = createSelector(selectState, getSelectedSession);
export const selectSelectedDatePeriod: MemoizedSelector<object, Date[]> = createSelector(
	selectState,
	getSelectedDatePeriod
);
export const selectSelectedSessionPlayers: MemoizedSelector<object, (Player | TeamGroup)[]> = createSelector(
	selectState,
	getSelectedSessionPlayers
);
export const selectSelectedPeriodPlayers: MemoizedSelector<object, (Player | TeamGroup)[]> = createSelector(
	selectState,
	getSelectedPeriodPlayers
);
export const selectSelectedIndividualPlayer: MemoizedSelector<object, Player> = createSelector(
	selectState,
	getSelectedIndividualPlayer
);
export const selectSelectedFilter: MemoizedSelector<object, FiltersType> = createSelector(
	selectState,
	getSelectedFilter
);
export const selectSelectedMetrics: MemoizedSelector<object, DeviceMetricDescriptor[]> = createSelector(
	selectState,
	getSelectedMetrics
);
export const selectSelectedBubbleMetrics: MemoizedSelector<object, BubbleMetrics> = createSelector(
	selectState,
	getSelectedBubbleMetrics
);
export const selectSelectedSessionTeamSplit: MemoizedSelector<object, SplitSelectItem> = createSelector(
	selectState,
	getSelectedSessionTeamSplit
);
export const selectSelectedSessionIndividualSplits: MemoizedSelector<object, SplitSelectItem[]> = createSelector(
	selectState,
	getSelectedSessionIndividualSplits
);
export const selectSelectedPeriodSplits: MemoizedSelector<object, SplitSelectItem[]> = createSelector(
	selectState,
	getSelectedPeriodSplits
);
export const selectChartFlags: MemoizedSelector<object, ChartFlags> = createSelector(selectState, getChartFlags);
export const selectViewFlags: MemoizedSelector<object, ViewFlags> = createSelector(selectState, getViewFlags);
export const selectSelectedAdvanced: MemoizedSelector<object, AdvancedEnum> = createSelector(
	selectState,
	getSelectedAdvanced
);
export const selectAdvancedProgress: MemoizedSelector<object, boolean> = createSelector(
	selectState,
	getAdvancedProgress
);
export const selectPeriodGames: MemoizedSelector<object, number> = createSelector(selectState, getPeriodGames);
export const selectPeriodTrainings: MemoizedSelector<object, number> = createSelector(selectState, getPeriodTrainings);
export const selectPeriodTotalSessions: MemoizedSelector<object, PeriodTotalSession[]> = createSelector(
	selectState,
	getPeriodTotalSessions
);
export const selectPeriodTrendSessions: MemoizedSelector<object, PeriodTrendSession[]> = createSelector(
	selectState,
	state => {
		const sessions: PeriodTrendSession[] = getPeriodTrendSessions(state);
		if (sessions.length) {
			return sessions.slice().sort((a, b) => {
				const aDate = moment(a.label, getBackendFormat());
				const bDate = moment(b.label, getBackendFormat());
				return aDate.isAfter(bDate) ? 1 : -1;
			});
		}

		return sessions;
	}
);
export const selectPeriodSessionDates: MemoizedSelector<object, string[]> = createSelector(
	selectPeriodTrendSessions,
	(sessions: PeriodTrendSession[]) =>
		sessions
			.filter(s => s && s.values)
			.map(({ label }) => {
				const date: moment.Moment = moment(label, getBackendFormat());
				return date.format(getMomentFormatFromStorage());
			})
);
export const selectSelectedPeriodSessionType: MemoizedSelector<object, SessionsType> = createSelector(
	selectState,
	getSelectedPeriodSessionType
);
export const selectSelectedPeriodEventData: MemoizedSelector<object, Map<string, PeriodMatch>> = createSelector(
	selectState,
	getSelectedPeriodEventData
);
export const selectSelectedPeriodTrendTableData: MemoizedSelector<
	object,
	Map<string, TrendTableData[]>
> = createSelector(selectState, getSelectedPeriodTrendTableData);
export const selectChartFlagsEnable: MemoizedSelector<object, ChartFlags> = createSelector(
	selectState,
	getThresholdsEnableFlag
);
// #endregion

//#region ADVANCED SELECTORS
export const selectSelectedSessionDuration: MemoizedSelector<object, number> = createSelector(
	selectSelectedSession,
	(selectedSession: Event) => (selectedSession ? +Number(selectedSession.duration).toFixed(1) : 0)
);

export const selectPlayersInSession: MemoizedSelector<object, Player[]> = createSelector(
	selectSelectedSession,
	selectPlayersSessions,
	selectPlayers,
	(session: Event, playersSessions: SessionPlayerData[], players: Player[]) => {
		if (session && isNotEmpty(playersSessions)) {
			return players.filter(({ id }) => playersSessions.map(({ playerId }) => playerId).includes(id));
		}
	}
);

export const selectSelectedSessionPlayersOptions: MemoizedSelector<object, SelectItem<Player | TeamGroup>[]> =
	createSelector(selectSelectedSessionPlayers, (players: Player[]) =>
		players ? players.map(p => ({ label: p.displayName, value: p })) : []
	);

export const selectSelectedPeriodPlayersOptions: MemoizedSelector<object, SelectItem<Player | TeamGroup>[]> =
	createSelector(selectSelectedPeriodPlayers, (players: Player[] | TeamGroup[]) =>
		players ? players.map(p => ({ label: p.displayName || p.name, value: p })) : []
	);

export const selectPlayersOptions: MemoizedSelector<object, SelectItem<Player | TeamGroup>[]> = createSelector(
	selectPlayers,
	selectPeriodTotalSessions,
	selectPlayersInSession,
	selectGroups,
	selectSelectedView,
	(
		players: Player[],
		periodTotalSessions: PeriodTotalSession[],
		sessionPlayers: Player[],
		groups: TeamGroup[],
		view: Views
	): SelectItem<Player | TeamGroup>[] => {
		// SESSION
		let playerOptions: SelectItem<Player | TeamGroup>[] = [];
		if (view === Views.Session && isNotEmpty(sessionPlayers)) {
			// PLAYERS IN SESSION & CLEAN DUPLICATES AND NULL
			playerOptions = uniqBy(sessionPlayers, 'displayName')
				.filter(player => !!player)
				.map(p => ({ label: p.displayName, value: p }));
		}

		// PERIOD
		let periodPlayers: SelectItem<Player>[];
		if (view === Views.Period) {
			periodPlayers = players
				.filter(({ id }) => periodTotalSessions.map(({ label }) => label).includes(id))
				.map(p => ({
					label: p.displayName,
					value: p
				}));

			if (!periodPlayers.length) return players.map(p => ({ label: p.displayName, value: p }));
		}

		// ADD GROUPS
		playerOptions = [
			...groups.map(group => ({ label: group.name, value: { ...group, displayName: group.name } })),
			...(view === Views.Session ? playerOptions : periodPlayers)
		];

		return playerOptions;
	}
);

export const selectAdvancedData: MemoizedSelector<object, Map<string, AdvancedMetricData[]>> = createSelector(
	selectState,
	(state: State) => (state.advanced.advancedData ? new Map(Object.entries(state.advanced.advancedData).sort()) : null)
);

export const selectSessionPlayersStatistics: MemoizedSelector<
	object,
	Map<string, SemaphoreMetricValue[]>
> = createSelector(
	selectPlayersSessions,
	selectMetrics,
	selectSelectedSessionPlayers,
	selectSelectedSessionTeamSplit,
	selectSelectedTeam,
	(
		playersSessions: SessionPlayerData[],
		metrics: DeviceMetricDescriptor[],
		selectedPlayers: Player[] | TeamGroup[],
		split: SplitSelectItem,
		team: Team
	) => {
		const playersNames: string[] = orderPlayers(selectedPlayers as Player[]).map(p => p.displayName);
		const filteredSessions: SessionPlayerData[] = playersSessions.filter(
			({ playerName, splitName }) => playersNames.includes(playerName) && splitName === split?.label
		);
		const statsMap = new Map<string, SemaphoreMetricValue[]>();

		// PLAYERS
		metrics.forEach(m => {
			filteredSessions.forEach(s => {
				const values: SemaphoreMetricValue[] = statsMap.get(s.playerName) || [];
				const semaphore: string = s[`${m.metricName}Semaphore`];
				const threshold: string = round(s[`${m.metricName}Threshold`], 2);
				const norm: number = s[`${m.metricName}Norm`];
				const ratio: string = norm != 0 ? round(norm * 100, 0) + '%' : null;
				const value: string = round(s[m.metricName], 2);
				const canShowSemaphore: boolean = !!value && value !== '-' && split.value === team.mainSplitName;
				const obj: SemaphoreMetricValue = { value, norm, ratio, semaphore, threshold, canShowSemaphore };
				statsMap.set(s.playerName, [...values, obj]);
			});
		});

		// GROUPS
		metrics.forEach(m => {
			selectedPlayers.forEach(p => {
				if (p.players) {
					const average: number = filteredSessions
						.filter(({ playerId }) => p.players.includes(playerId))
						.reduce((avg, session, _, { length }) => avg + session[m.metricName] / length, 0);

					const obj: SemaphoreMetricValue = { value: round(average, 2) };
					const values: SemaphoreMetricValue[] = statsMap.get(p.displayName) || [];
					statsMap.set(p.displayName, [...values, obj]);
				}
			});
		});

		return statsMap;
	}
);

export const selectPeriodTotalPlayersStatistics: MemoizedSelector<
	object,
	Map<string, SemaphoreMetricValue[]>
> = createSelector(
	selectSelectedPeriodPlayersOptions,
	selectPeriodTotalSessions,
	selectMetrics,
	(
		playersOptions: SelectItem<Player | TeamGroup>[],
		periodTotalSessions: PeriodTotalSession[],
		metrics: DeviceMetricDescriptor[]
	) => {
		const statsMap = new Map<string, SemaphoreMetricValue[]>();
		const periodSessions: PeriodTotalSession[] = periodTotalSessions
			.filter(({ label }) => playersOptions.map(({ value }) => value.id).includes(label))
			.map(({ label, values }) => {
				const item: SelectItem<Player | TeamGroup> = playersOptions.find(({ value }) => value.id === label);
				return {
					label: item ? (item.value as Player).displayName : label,
					values
				};
			});

		metrics.forEach(m => {
			periodSessions.forEach(s => {
				const values: SemaphoreMetricValue[] = statsMap.get(s.label) || [];
				const value: string = round(s.values[m.metricName], 2);
				const obj: SemaphoreMetricValue = { value };
				statsMap.set(s.label, [...values, obj]);
			});
		});

		return statsMap;
	}
);

export const selectAllPeriodTrendSessions: MemoizedSelector<object, PeriodTrendSession[]> = createSelector(
	selectPeriodTrendSessions,
	selectSelectedDatePeriod,
	(sessions: PeriodTrendSession[], datePeriod: Date[]) => {
		const allSessions: PeriodTrendSession[] = [];
		const period: string[] = [];
		const start: moment.Moment = moment(datePeriod[0]);
		const end: moment.Moment = moment(datePeriod[1]);

		while (start.isSameOrBefore(end)) {
			period.push(start.format(getBackendFormat()));
			start.add(1, 'days');
		}

		period.forEach(date => {
			const session: PeriodTrendSession = sessions.find(({ label }) => label === date);
			if (session) {
				allSessions.push(session);
			} else {
				allSessions.push({
					label: date,
					values: null
				});
			}
		});

		return allSessions;
	}
);

export const selectPlayersPeriodTrendTableData: MemoizedSelector<
	object,
	Map<string, Map<string, { [key: string]: number }[]>> // Map<Player01, Map<01/01/2022, { rpe: 10, ... }[]>>
> = createSelector(
	selectSelectedPeriodPlayers,
	selectAllPeriodTrendSessions,
	selectSelectedPeriodTrendTableData,
	selectSelectedMetrics,
	(
		selectedPlayers: Player[],
		allPeriodSessions: PeriodTrendSession[],
		periodTableData: Map<string, TrendTableData[]>,
		selectedMetrics: DeviceMetricDescriptor[]
	) => {
		if (periodTableData) {
			const mapTableData = new Map<string, TrendTableData[]>(Object.entries(periodTableData));
			const statsMap = new Map<string, Map<string, { [key: string]: number }[]>>();
			const metricNames: string[] = selectedMetrics.map(({ metricName }) => metricName);
			const sessionsDates: string[] = sortBy(allPeriodSessions, 'label').map(({ label }) => label);

			sortBy(selectedPlayers, 'displayName').forEach(p => {
				if (p) {
					const playerMap = new Map<string, {}[]>();

					sessionsDates.forEach(date => {
						const playerSessions: TrendTableData[] = mapTableData.get(p.id)?.filter(({ _id }) => _id === date);
						const metricsValues: { [key: string]: number }[] = [];

						if (playerSessions && playerSessions.length) {
							playerSessions.forEach(s => {
								const metricValue = {};
								metricNames.forEach(metric => {
									metricValue[metric] = Number(s[metric].toFixed(1));
								});

								metricsValues.push(metricValue);
							});
						}

						playerMap.set(date, metricsValues);
						statsMap.set(p.displayName, playerMap);
					});
				}
			});

			return statsMap;
		}
	}
);

export const selectPeriodTrendPlayersStatistics: MemoizedSelector<
	object,
	Map<string, SemaphoreMetricValue[]>
> = createSelector(
	selectSelectedPeriodPlayersOptions,
	selectPeriodTrendSessions,
	selectSelectedPeriodTrendTableData,
	selectMetrics,
	(
		playersOptions: SelectItem<Player | TeamGroup>[],
		periodSessions: PeriodTrendSession[],
		periodTableData: Map<string, TrendTableData[]>,
		metrics: DeviceMetricDescriptor[]
	) => {
		if (periodTableData) {
			const mapTableData = new Map(Object.entries(periodTableData));
			const statsMap = new Map<string, SemaphoreMetricValue[]>();
			const metricNames: string[] = metrics.map(({ metricName }) => metricName);
			const players: Player[] = [...mapTableData.keys()].map(k =>
				playersOptions.map(({ value }) => value as Player).find(({ id }) => id === k)
			);
			const sessionsDates: string[] = periodSessions.map(({ label }) => label);

			players.forEach(p => {
				if (p) {
					sessionsDates.forEach(d => {
						const key: string = p.displayName || p.name;
						const values: SemaphoreMetricValue[] = statsMap.get(key) || [];
						const playerSessions: TrendTableData[] = mapTableData.get(p.id).filter(({ _id }) => _id === d);

						if (playerSessions && playerSessions.length) {
							const metricsValues: string[] = metricNames.map(metric =>
								playerSessions.map(s => round(s[metric], 2)).join(' | ')
							);

							// const metricsValues: string[] = metricNames.map(metric => round(playerSessions[0][metric], 2));
							const semaphores: string[] = metricNames.map(metric => playerSessions[0][`${metric}Semaphore`]);
							const thresholds: string[] = metricNames.map(metric => round(playerSessions[0][`${metric}Threshold`], 2));
							const norms: number[] = metricNames.map(metric => playerSessions[0][`${metric}Norm`]);
							const ratios: string[] = norms.map(n => (n != 0 ? round(n * 100, 0) + '%' : null));
							const canShowSemaphores: boolean[] = metricsValues.map(v => !!v && v !== '-');
							const obj: SemaphoreMetricValue = {
								value: metricsValues,
								norm: norms,
								ratio: ratios,
								semaphore: semaphores,
								threshold: thresholds,
								canShowSemaphore: canShowSemaphores
							};
							statsMap.set(key, [...values, obj]);
						} else {
							statsMap.set(key, [
								...values,
								{
									value: metricNames.map(() => '-'),
									norm: metricNames.map(() => undefined),
									ratio: metricNames.map(() => undefined),
									semaphore: metricNames.map(() => undefined),
									threshold: metricNames.map(() => undefined),
									canShowSemaphore: metricNames.map(() => undefined)
								}
							]);
						}
					});
				}
			});

			return statsMap;
		}
	}
);

export const selectPlayersStatistics: MemoizedSelector<object, Map<string, SemaphoreMetricValue[]>> = createSelector(
	selectSelectedView,
	selectSelectedPeriodAnalysisView,
	selectSessionPlayersStatistics,
	selectPeriodTotalPlayersStatistics,
	selectPeriodTrendPlayersStatistics,
	(
		view: Views,
		periodView: PeriodAnalysis,
		sessionStats: Map<string, SemaphoreMetricValue[]>,
		periodTotalStats: Map<string, SemaphoreMetricValue[]>,
		periodTrendStats: Map<string, SemaphoreMetricValue[]>
	) => {
		if (view === Views.Session) {
			return sessionStats;
		} else {
			return periodView === PeriodAnalysis.Total ? periodTotalStats : periodTrendStats;
		}
	}
);

export const selectIndividualPlayerStatistics: MemoizedSelector<object, Map<string, string[]>> = createSelector(
	selectPlayersSessions,
	selectSelectedIndividualPlayer,
	selectSelectedSessionIndividualSplits,
	selectSelectedMetrics,
	(
		playersSessions: SessionPlayerData[],
		selectedPlayer: Player,
		selectedSplits: SplitSelectItem[],
		selectedMetrics: DeviceMetricDescriptor[]
	) => {
		const statsMap = new Map<string, string[]>();

		if (selectedPlayer && isNotEmpty(selectedSplits) && isNotEmpty(playersSessions) && isNotEmpty(selectedMetrics)) {
			const splitsNames = selectedSplits.map(({ label }) => label);
			const filteredSessions: SessionPlayerData[] = playersSessions.filter(
				({ playerName, splitName }) => playerName === selectedPlayer.displayName && splitsNames.includes(splitName)
			);

			selectedMetrics.forEach(m => {
				filteredSessions.forEach(s => {
					const values: string[] = statsMap.get(s.splitName) || [];
					statsMap.set(s.splitName, [...values, round(s[m.metricName], 2)]);
				});
			});
		}

		return statsMap;
	}
);

export const selectIndividualMainSession: MemoizedSelector<object, SessionPlayerData> = createSelector(
	selectSelectedIndividualPlayer,
	selectPlayersSessions,
	(player: Player, sessions: SessionPlayerData[]) => {
		const mainSessions = sessions.filter(
			({ playerId, mainSession, date }) =>
				player &&
				playerId === player.id &&
				mainSession &&
				(!player.archived || (player.archived && player.archivedDate > date))
		);

		return isNotEmpty(mainSessions) ? mainSessions[0] : null;
	}
);

export const selectSelectedPeriodPlayersIDS: MemoizedSelector<object, string[]> = createSelector(
	selectPlayers,
	selectSelectedPeriodPlayers,
	(players, teamPlayers: (Player | TeamGroup)[]) =>
		teamPlayers?.length ? teamPlayers.map(({ id }) => id) : players.map(({ id }) => id)
);

export const selectSelectedGroups: MemoizedSelector<object, TeamGroup[]> = createSelector(
	selectSelectedPeriodPlayers,
	(players: (Player | TeamGroup)[]) => players.filter(p => 'players' in p) as TeamGroup[]
);

export const selectPeriodTriggerData: MemoizedSelector<
	object,
	{
		datePeriod: Date[];
		team: Team;
		playersIds: string[];
		groups: TeamGroup[];
		splits: SplitSelectItem[];
		filter: FiltersType;
		sessionType: SessionsType;
	}
> = createSelector(
	selectSelectedDatePeriod,
	selectSelectedTeam,
	selectSelectedPeriodPlayersIDS,
	selectSelectedGroups,
	selectSelectedPeriodSplits,
	selectSelectedFilter,
	selectSelectedPeriodSessionType,
	(
		datePeriod: Date[],
		team: Team,
		playersIds: string[],
		groups: TeamGroup[],
		splits: SplitSelectItem[],
		filter: FiltersType,
		sessionType: SessionsType
	) => ({ datePeriod, team, playersIds, groups, splits, filter, sessionType })
);

export const selectAdvancedOptions: MemoizedSelector<object, SelectItem<AdvancedEnum>[]> = createSelector(
	selectState,
	() => Object.keys(AdvancedEnum).map(k => ({ label: k, value: AdvancedEnum[k] }))
);

export const selectAdvancedWrongSelectionFlag: MemoizedSelector<object, boolean> = createSelector(
	selectSelectedView,
	selectSelectedMetrics,
	selectSelectedPeriodPlayers,
	(view: Views, metrics: DeviceMetricDescriptor[], players: (Player | TeamGroup)[]) =>
		view === Views.Session
			? !(isNotEmpty(metrics) && metrics[0].algo)
			: !(isNotEmpty(metrics) && metrics[0].algo && players.length === 1)
);

export const selectNoAdvancedDataFlag: MemoizedSelector<object, boolean> = createSelector(
	selectAdvancedData,
	(advancedData: Map<string, AdvancedMetricData[]>) => !(advancedData && !!advancedData.size)
);

export const selectIndividualALCL: MemoizedSelector<object, ALCLIndividual[]> = createSelector(
	selectAdvancedData,
	selectSelectedSession,
	selectSelectedMetrics,
	selectSelectedIndividualPlayer,
	(
		advancedData: Map<string, AdvancedMetricData[]>,
		session: Event,
		selectedMetrics: DeviceMetricDescriptor[],
		selectedPlayer: Player
	) => {
		const returnData: ALCLIndividual[] = [];
		if (advancedData) {
			if (selectedPlayer && advancedData && advancedData.size && isNotEmpty(selectedMetrics)) {
				const date: Date = moment(session.start).toDate();
				date.setUTCHours(0, 0, 0, 0);
				const metricDataArray: AdvancedMetricData[] = advancedData.get(date.toISOString());
				const metricData: AdvancedMetricData = metricDataArray?.find(
					({ metric, playerId }) => metric === selectedMetrics[0].metricName && playerId === selectedPlayer.id
				);

				if (metricData) {
					const tsb = metricData?.values.ewmaCronicLoad - metricData?.values.ewmaAcuteLoad || 0;
					returnData.push({ name: 'TSB', value: Number(tsb).toFixed(1) });

					const alcl = metricData.values.ewmaAlCl;
					returnData.push({ name: 'AL/CL', value: Number(alcl).toFixed(1) });
				}
			}
		}
		return returnData;
	}
);

export const selectCanLoadEWMA: MemoizedSelector<object, boolean> = createSelector(
	selectAdvancedWrongSelectionFlag,
	selectSelectedTeam,
	(wrongSelectionFlag: boolean, team: Team) => !wrongSelectionFlag && !!team
);
// #endregion

//#region UTILITIES

// Sort Seasons
const orderSeasons = (seasons: TeamSeason[]): TeamSeason[] => sortBy(seasons, 'offseason').reverse();

// Sort Players
const orderPlayers = (players: Player[] | TeamGroup[]): Player[] | TeamGroup[] =>
	sortBy(players as Player[], 'displayName');

// Sort Event Sessions
export const orderSessions = (sessions: Event[]): Event[] =>
	sortBy(sessions, 'start')
		.reverse()
		.filter(({ start }) => moment(start).isSameOrBefore(moment()));

// Round decimals
const round = (value: number, decimals: number): string =>
	value ? (Math.round(value * 100) / 100).toFixed(decimals) : '-';

// #endregion

import { Event, Player, SessionPlayerData, TeamGroup, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { Action, createReducer, on } from '@ngrx/store';
import { sortBy } from 'lodash';
import { SessionAnalysis, SplitSelectItem } from './session-analysis-store.interfaces';
import { State, initialState } from './session-analysis-store.state';

import { isNotEmpty, removeDuplicates } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';
import * as SessionAnalysisStoreActions from './session-analysis-store.actions';

const sessionAnalysisStoreReducer = createReducer(
	initialState,
	on(SessionAnalysisStoreActions.setRouteParams, (state, { routeParams }): State => ({ ...state, routeParams })),
	on(
		SessionAnalysisStoreActions.selectView,
		(state, { selectedView }): State => ({
			...state,
			selectedView,
			chartFlags: {
				...state.chartFlags,
				thresholds: false,
				bubble: false
			},
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.selectSessionAnalysis,
		(state, { selectedAnalysis }): State => ({
			...state,
			sessionFilters: {
				...state.sessionFilters,
				selectedAnalysis
			},
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.selectPeriodAnalysis,
		(state, { selectedAnalysis }): State => ({
			...state,
			periodFilters: {
				...state.periodFilters,
				selectedAnalysis
			},
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.initStoreSuccess,
		(state, { selectedTeam, seasons, selectedSeason }): State => ({
			...state,
			selectedTeam,
			seasons,
			selectedSeason
		})
	),
	on(
		SessionAnalysisStoreActions.loadSeasonInfo,
		(state, { selectedSeason }): State => ({
			...state,
			selectedSeason,
			periodFilters: {
				...state.periodFilters,
				selectedDatePeriod: buildPeriod(selectedSeason)
			}
		})
	),
	on(
		SessionAnalysisStoreActions.loadSeasonInfoSuccess,
		(state, { players, groups, metrics }): State => ({
			...state,
			routeParams: {
				...state.routeParams,
				season_id: null
			},
			players,
			groups,
			metrics,
			selectedMetrics: metrics.slice(0, 2),
			sessionFilters: {
				...state.sessionFilters,
				selectedIndividualPlayer: players[0],
				bubbleMetrics: {
					xAxis: metrics[0],
					yAxis: metrics[1],
					size: metrics[2]
				}
			},
			periodFilters: {
				...state.periodFilters,
				selectedPlayers: players
			}
		})
	),
	on(
		SessionAnalysisStoreActions.loadSessionsSuccess,
		(state, { sessionsResult }): State => ({
			...state,
			sessionFilters: {
				...state.sessionFilters,
				sessions: extractPastSessions(sessionsResult.events)
			}
		})
	),
	on(
		SessionAnalysisStoreActions.selectSession,
		(state, { selectedSession }): State => ({
			...state,
			routeParams: {
				...state.routeParams,
				session_id: null
			},
			sessionFilters: {
				...state.sessionFilters,
				selectedSession
			},
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.loadSessionDetails,
		(state): State => ({
			...state,
			viewFlags: {
				...state.viewFlags,
				isLoading: true
			}
		})
	),
	on(SessionAnalysisStoreActions.loadSessionDetailsSuccess, (state, { sessionPlayers }): State => {
		const playersSessions: SessionPlayerData[] = sortBy(sessionPlayers, 'playerName');
		const splits: SplitSelectItem[] = extractSplits({ ...state.sessionFilters.selectedSession, sessionPlayers });
		const selectedSessionTeamSplit: SplitSelectItem = extractSessionSelectedSplit(splits) as SplitSelectItem;
		const selectedSessionIndividualSplits: SplitSelectItem[] = extractSessionSelectedSplit(
			splits,
			SessionAnalysis.Individual
		) as SplitSelectItem[];
		const selectedPlayers = extractSelectedPlayers(state, playersSessions);
		const type = state.sessionFilters.selectedSession.type;
		const anyThresholds = state.players.some(({ _thresholds }) => _thresholds.find(({ name }) => name === type));

		return {
			...state,
			viewFlags: {
				...state.viewFlags,
				isLoading: false
			},
			chartFlagsEnable: {
				...state.chartFlagsEnable,
				thresholds: anyThresholds
			},
			sessionFilters: {
				...state.sessionFilters,
				playersSessions,
				splits,
				selectedPlayers,
				selectedTeamSplit: selectedSessionTeamSplit,
				selectedIndividualSplits: selectedSessionIndividualSplits,
				selectedIndividualPlayer: (selectedPlayers as Player[]).find(p => p.id === playersSessions[0].playerId)
			}
		};
	}),
	on(
		SessionAnalysisStoreActions.selectSessionPlayers,
		(state, { selectedPlayers }): State => ({
			...state,
			sessionFilters: {
				...state.sessionFilters,
				selectedPlayers
			},
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.selectPeriodPlayers,
		(state, { selectedPlayers }): State => ({
			...state,
			periodFilters: {
				...state.periodFilters,
				selectedPlayers
			},
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.selectIndividualPlayer,
		(state, { selectedIndividualPlayer }): State => ({
			...state,
			sessionFilters: {
				...state.sessionFilters,
				selectedIndividualPlayer
			}
		})
	),
	on(
		SessionAnalysisStoreActions.selectMetrics,
		(state, { selectedMetrics }): State => ({
			...state,
			selectedMetrics,
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.selectBubbleMetrics,
		(state, { bubbleMetrics }): State => ({
			...state,
			sessionFilters: {
				...state.sessionFilters,
				bubbleMetrics
			},
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.selectSessionTeamSplit,
		(state, { selectedTeamSplit }): State => ({
			...state,
			sessionFilters: {
				...state.sessionFilters,
				selectedTeamSplit
			},
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.selectFilter,
		(state, { selectedFilter }): State => ({
			...state,
			selectedFilter,
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.selectSessionType,
		(state, { selectedSessionType }): State => ({
			...state,
			periodFilters: {
				...state.periodFilters,
				selectedSessionType
			},
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.selectSessionIndividualSplits,
		(state, { selectedIndividualSplits }): State => ({
			...state,
			sessionFilters: {
				...state.sessionFilters,
				selectedIndividualSplits
			}
		})
	),
	on(
		SessionAnalysisStoreActions.selectAdvancedOption,
		(state, { selectedAdvanced }): State => ({
			...state,
			advanced: {
				...state.advanced,
				selectedAdvanced
			}
		})
	),
	on(
		SessionAnalysisStoreActions.loadAdvancedSessionData,
		(state): State => ({
			...state,
			advanced: {
				...state.advanced,
				advancedProgress: true
			}
		})
	),
	on(
		SessionAnalysisStoreActions.loadAdvancedPeriodData,
		(state): State => ({
			...state,
			advanced: {
				...state.advanced,
				advancedProgress: true
			}
		})
	),
	on(
		SessionAnalysisStoreActions.loadAdvancedDataSuccess,
		(state, { advancedData }): State => ({
			...state,
			advanced: {
				...state.advanced,
				advancedData,
				advancedProgress: false
			}
		})
	),
	on(
		SessionAnalysisStoreActions.loadAdvancedDataFailure,
		(state): State => ({
			...state,
			advanced: {
				...state.advanced,
				advancedProgress: false
			}
		})
	),
	on(
		SessionAnalysisStoreActions.selectDatePeriod,
		(state, { selectedDatePeriod }): State => ({
			...state,
			periodFilters: {
				...state.periodFilters,
				selectedDatePeriod
			},
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.selectPeriodSplits,
		(state, { selectedSplits }): State => ({
			...state,
			periodFilters: {
				...state.periodFilters,
				selectedSplits
			},
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.loadPeriodTotalDetails,
		(state): State => ({
			...state,
			viewFlags: {
				...state.viewFlags,
				isLoading: true
			}
		})
	),
	on(
		SessionAnalysisStoreActions.loadPeriodTotalDetailsSuccess,
		(state, { result }): State => ({
			...state,
			viewFlags: {
				...state.viewFlags,
				isLoading: false
			},
			periodFilters: {
				...state.periodFilters,
				games: result.games,
				trainings: result.trainings,
				periodTotalSessions: result.data,
				selectedPlayers: state.players.filter(p => result.data.map(d => d.label).includes(p.id)),
				splits: result.splits.map(s => ({ label: s, value: s, main: result.mainSplits.includes(s), start: null })),
				selectedSplits: isNotEmpty(state.periodFilters.selectedSplits)
					? state.periodFilters.selectedSplits
					: result.mainSplits.map(s => ({ label: s, value: s, main: true, start: null }))
			}
		})
	),
	on(
		SessionAnalysisStoreActions.loadPeriodTrendDetails,
		(state): State => ({
			...state,
			viewFlags: {
				...state.viewFlags,
				isLoading: true
			}
		})
	),
	on(
		SessionAnalysisStoreActions.loadPeriodTrendDetailsSuccess,
		(state, { result }): State => ({
			...state,
			viewFlags: {
				...state.viewFlags,
				isLoading: false
			},
			periodFilters: {
				...state.periodFilters,
				games: result.games,
				trainings: result.trainings,
				periodTrendSessions: result.data,
				splits: result.splits.map(s => ({ label: s, value: s, main: result.mainSplits.includes(s), start: null })),
				eventData: result.eventData,
				tableData: result.tableData,
				selectedPlayers: [...state.players, ...state.groups].filter(({ id }) =>
					Array.from(Object.keys(result.tableData)).includes(id)
				),
				selectedSplits: isNotEmpty(state.periodFilters.selectedSplits)
					? state.periodFilters.selectedSplits
					: result.mainSplits.map(s => ({ label: s, value: s, main: true, start: null }))
			}
		})
	),
	on(
		SessionAnalysisStoreActions.toggleSidebar,
		(state, { sidebar }): State => ({
			...state,
			viewFlags: {
				...state.viewFlags,
				sidebar
			}
		})
	),
	on(
		SessionAnalysisStoreActions.toggleThresholds,
		(state, { thresholds }): State => ({
			...state,
			chartFlags: {
				...state.chartFlags,
				thresholds,
				bubble: false
			},
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.togglePercentage,
		(state, { percent }): State => ({
			...state,
			chartFlags: {
				...state.chartFlags,
				percent,
				bubble: false
			},
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.toggleOrder,
		(state, { order }): State => ({
			...state,
			chartFlags: {
				...state.chartFlags,
				order,
				bubble: false
			}
		})
	),
	on(
		SessionAnalysisStoreActions.toggleLabels,
		(state, { labels }): State => ({
			...state,
			chartFlags: {
				...state.chartFlags,
				labels,
				bubble: false
			}
		})
	),
	on(
		SessionAnalysisStoreActions.toggleBubble,
		(state, { bubble }): State => ({
			...state,
			chartFlags: {
				...state.chartFlags,
				labels: false,
				order: false,
				percent: false,
				thresholds: false,
				bubble
			},
			advanced: { ...state.advanced, selectedAdvanced: null }
		})
	),
	on(
		SessionAnalysisStoreActions.showUploadDialog,
		(state): State => ({
			...state,
			viewFlags: {
				...state.viewFlags,
				uploadDialog: true
			}
		})
	),
	on(
		SessionAnalysisStoreActions.hideUploadDialog,
		(state): State => ({
			...state,
			viewFlags: {
				...state.viewFlags,
				uploadDialog: false
			}
		})
	),
	on(
		SessionAnalysisStoreActions.saveAttachmentsSuccess,
		(state, { session }): State => ({
			...state,
			sessionFilters: {
				...state.sessionFilters,
				selectedSession: session
			}
		})
	),
	on(SessionAnalysisStoreActions.resetStore, () => initialState)
);

export { State, initialState, sessionAnalysisStoreFeatureKey } from './session-analysis-store.state';
export const sessionAnalysisreducer = (state: State | undefined, action: Action) =>
	sessionAnalysisStoreReducer(state, action);
export const clearSelectedAdvanced = (state: State) => ({ advanced: { ...state.advanced, selectedAdvanced: null } });

//#region UTILS FUNCTION
const extractPastSessions = (sessions: Event[]): Event[] =>
	sessions.filter(s => moment(s.start).isSameOrBefore(new Date()));

const extractSplits = (session: Event): SplitSelectItem[] => {
	let splits: SplitSelectItem[];

	if (session && isNotEmpty(session.sessionPlayers)) {
		splits = session.sessionPlayers.map(s => ({
			label: s.splitName,
			value: s.splitName,
			start: s.splitStartTime,
			main: s.mainSession
		}));

		splits = sortBy(removeDuplicates(splits), session.format === 'game' ? 'label' : 'start') as SplitSelectItem[];
	}

	return splits;
};

const extractSessionSelectedSplit = (
	splits: SplitSelectItem[],
	view?: SessionAnalysis
): SplitSelectItem | SplitSelectItem[] => {
	let selected;

	if (splits) {
		if (splits.some(s => s.main)) {
			selected = splits.find(s => s.main);
		}

		if (!Array.isArray(splits)) {
			selected = splits[0];
		}

		if (view === SessionAnalysis.Individual) {
			splits = splits.filter(({ main }) => main === false);
			selected = splits;
		}
	}

	return selected;
};

const extractSelectedPlayers = (state: State, sessionPlayers: SessionPlayerData[]): Player[] | TeamGroup[] => {
	const playersPresentInSession = (state.players as Player[]).filter(p =>
		sessionPlayers.map(session => session.playerId).includes(p.id)
	);
	return playersPresentInSession;
};

const buildPeriod = (season: TeamSeason): Date[] => {
	let start: Date = moment().startOf('day').subtract(7, 'days').toDate();
	let end: Date = moment().toDate(); // TODAY

	// CHECK Casi limite
	// PREV SEASON
	if (moment(end).isAfter(moment(season.inseasonEnd))) {
		start = moment(season.inseasonEnd).subtract(7, 'days').startOf('day').toDate();
		end = season.inseasonEnd;
	} else {
		// NEXT SEASON
		if (moment(end).isAfter(moment(season.inseasonStart))) {
			if (moment(end).subtract(7, 'days').isBefore(moment(season.inseasonStart))) {
				start = season.inseasonStart;
			}
		}
	}

	return [start, end];
};
// #endregion

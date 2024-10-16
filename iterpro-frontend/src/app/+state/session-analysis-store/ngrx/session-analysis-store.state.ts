import { DeviceMetricDescriptor, Player, Team, TeamGroup, TeamSeason } from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment';
import {
	AdvancedState,
	ChartFlags,
	FiltersType,
	PeriodAnalysis,
	PeriodFilters,
	RouteParams,
	SessionAnalysis,
	SessionFilters,
	SessionsType,
	ViewFlags,
	Views
} from './session-analysis-store.interfaces';

export const sessionAnalysisStoreFeatureKey = 'sessionAnalysisStore';

export interface State {
	routeParams: RouteParams;
	selectedTeam: Team;
	selectedView: Views;
	seasons: TeamSeason[];
	players: Player[];
	groups: TeamGroup[];
	metrics: DeviceMetricDescriptor[];
	selectedSeason: TeamSeason;
	selectedMetrics: DeviceMetricDescriptor[];
	selectedFilter: FiltersType;
	sessionFilters: SessionFilters;
	periodFilters: PeriodFilters;
	thresholdsMap: any;
	thresholdsMapGD: any;
	advanced: AdvancedState;
	chartFlags: ChartFlags;
	chartFlagsEnable: ChartFlags;
	viewFlags: ViewFlags;
}

export const initialState: State = {
	routeParams: {
		metric: null,
		date: null,
		session_id: null,
		season_id: null,
		player_id: null,
		ewma: false
	},
	selectedTeam: null,
	selectedView: Views.Session,
	seasons: [],
	players: [],
	groups: [],
	metrics: [],
	selectedSeason: null,
	selectedMetrics: [],
	selectedFilter: FiltersType.All,
	sessionFilters: {
		selectedAnalysis: SessionAnalysis.Team,
		sessions: [],
		splits: [],
		playersSessions: [],
		selectedSession: null,
		selectedTeamSplit: null,
		selectedIndividualSplits: [],
		selectedIndividualPlayer: null,
		selectedPlayers: [],
		bubbleMetrics: {
			xAxis: null,
			yAxis: null,
			size: null
		}
	},
	periodFilters: {
		splits: [],
		games: null,
		trainings: null,
		eventData: null,
		tableData: null,
		periodTotalSessions: [],
		periodTrendSessions: [],
		selectedAnalysis: PeriodAnalysis.Total,
		selectedDatePeriod: [moment().subtract(7, 'days').startOf('day').toDate(), moment().startOf('day').toDate()],
		selectedSessionType: SessionsType.All,
		selectedSplits: [],
		selectedPlayers: []
	},
	thresholdsMap: {},
	thresholdsMapGD: {},
	advanced: {
		advancedData: null,
		selectedAdvanced: null,
		advancedProgress: false
	},
	chartFlags: {
		bubble: false,
		percent: false,
		thresholds: false,
		labels: true,
		order: false
	},
	chartFlagsEnable: {
		bubble: true,
		percent: true,
		thresholds: true,
		labels: true,
		order: true
	},
	viewFlags: {
		sidebar: true,
		uploadDialog: false,
		isLoading: false
	}
};

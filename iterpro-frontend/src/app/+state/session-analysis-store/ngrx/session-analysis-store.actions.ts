import { Params } from '@angular/router';
import {
	Attachment,
	DeviceMetricDescriptor,
	Event,
	Player,
	SessionPlayerData,
	Team,
	TeamGroup,
	TeamSeason
} from '@iterpro/shared/data-access/sdk';
import { createAction, props } from '@ngrx/store';
import { SessionAnalysisActions } from './session-analysis-store.actions.enum';
import {
	AdvancedEnum,
	AdvancedMetricData,
	BubbleMetrics,
	FiltersType,
	PeriodAnalysis,
	PeriodReportDataCSV,
	PeriodTotalReportDataPDF,
	PeriodTotalResult,
	PeriodTrendReportDataPDF,
	PeriodTrendResult,
	RouteParams,
	SessionAnalysis,
	SessionAnalysisReportType,
	SessionsResult,
	SessionsType,
	SplitSelectItem,
	TeamSessionReportDataCSV,
	TeamSessionReportDataPDF,
	Views
} from './session-analysis-store.interfaces';

// GENERAL & VIEWS
export const selectView = createAction(SessionAnalysisActions.SelectView, props<{ selectedView: Views }>());
export const selectSessionAnalysis = createAction(
	SessionAnalysisActions.SelectSessionView,
	props<{ selectedAnalysis: SessionAnalysis }>()
);
export const selectPeriodAnalysis = createAction(
	SessionAnalysisActions.SelectPeriodView,
	props<{ selectedAnalysis: PeriodAnalysis }>()
);

// INITIALIZE / RESET STORE
export const resetStore = createAction(SessionAnalysisActions.ResetStore);
export const initStore = createAction(SessionAnalysisActions.InitStore, props<{ routeParams: Params }>());
export const initStoreSuccess = createAction(
	SessionAnalysisActions.InitStoreSuccess,
	props<{
		selectedTeam: Team;
		seasons: TeamSeason[];
		selectedSeason: TeamSeason;
	}>()
);
export const initStoreFailure = createAction(SessionAnalysisActions.initStoreFailure, props<{ error: any }>());

// ROUTE PARAMS
export const setRouteParams = createAction(
	SessionAnalysisActions.SetRouteParams,
	props<{ routeParams: RouteParams }>()
);

// SEASON
export const loadSeasonInfo = createAction(
	SessionAnalysisActions.LoadSeasonInfo,
	props<{ selectedSeason: TeamSeason }>()
);
export const loadSeasonInfoSuccess = createAction(
	SessionAnalysisActions.LoadSeasonInfoSuccess,
	props<{ players: Player[]; groups: TeamGroup[]; metrics: DeviceMetricDescriptor[] }>()
);
export const loadSeasonInfoFailure = createAction(
	SessionAnalysisActions.LoadSeasonInfoFailure,
	props<{ error: any }>()
);

// SESSIONS
export const selectSession = createAction(SessionAnalysisActions.SelectSession, props<{ selectedSession: Event }>());
export const loadSessions = createAction(SessionAnalysisActions.LoadSessions);
export const loadSessionsSuccess = createAction(
	SessionAnalysisActions.LoadSessionsSuccess,
	props<{ sessionsResult: SessionsResult }>()
);
export const loadSessionsFailure = createAction(SessionAnalysisActions.LoadSessionsFailure, props<{ error: any }>());
export const loadSessionDetails = createAction(
	SessionAnalysisActions.LoadSessionDetails,
	props<{ selectedSession: Event }>()
);
export const loadSessionDetailsSuccess = createAction(
	SessionAnalysisActions.LoadSessionDetailsSuccess,
	props<{ sessionPlayers: SessionPlayerData[] }>()
);
export const loadSessionDetailsFailure = createAction(
	SessionAnalysisActions.LoadSessionDetailsFailure,
	props<{ error: any }>()
);

// LOAD PERIOD DETAILS
export const loadPeriodTotalDetails = createAction(SessionAnalysisActions.LoadPeriodTotal);
export const loadPeriodTotalDetailsSuccess = createAction(
	SessionAnalysisActions.LoadPeriodTotalSuccess,
	props<{ result: PeriodTotalResult }>()
);
export const loadPeriodTotalDetailsFailure = createAction(
	SessionAnalysisActions.LoadPeriodTotalFailure,
	props<{ error: any }>()
);
export const loadPeriodTrendDetails = createAction(SessionAnalysisActions.LoadPeriodTrend);
export const loadPeriodTrendDetailsSuccess = createAction(
	SessionAnalysisActions.LoadPeriodTrendSuccess,
	props<{ result: PeriodTrendResult }>()
);
export const loadPeriodTrendDetailsFailure = createAction(
	SessionAnalysisActions.LoadPeriodTrendFailure,
	props<{ error: any }>()
);

// PLAYERS
export const selectSessionPlayers = createAction(
	SessionAnalysisActions.SelectSessionPlayers,
	props<{ selectedPlayers: Player[] | TeamGroup[] }>()
);
export const selectIndividualPlayer = createAction(
	SessionAnalysisActions.SelectIndividualPlayer,
	props<{ selectedIndividualPlayer: Player }>()
);
export const selectPeriodPlayers = createAction(
	SessionAnalysisActions.SelectPeriodPlayers,
	props<{ selectedPlayers: Player[] | TeamGroup[] }>()
);

// SPLITS
export const selectSessionTeamSplit = createAction(
	SessionAnalysisActions.SelectSessionSplit,
	props<{ selectedTeamSplit: SplitSelectItem }>()
);
export const selectSessionIndividualSplits = createAction(
	SessionAnalysisActions.SelectIndividualSplits,
	props<{ selectedIndividualSplits: SplitSelectItem[] }>()
);
export const selectPeriodSplits = createAction(
	SessionAnalysisActions.SelectPeriodSplits,
	props<{ selectedSplits: SplitSelectItem[] }>()
);

// FILTER
export const selectFilter = createAction(SessionAnalysisActions.SelectFilter, props<{ selectedFilter: FiltersType }>());

// SESSION TYPE
export const selectSessionType = createAction(
	SessionAnalysisActions.SelectSessionType,
	props<{ selectedSessionType: SessionsType }>()
);

// METRICS
export const selectMetrics = createAction(
	SessionAnalysisActions.SelectMetrics,
	props<{ selectedMetrics: DeviceMetricDescriptor[] }>()
);
export const selectBubbleMetrics = createAction(
	SessionAnalysisActions.SelectBubbleMetrics,
	props<{ bubbleMetrics: BubbleMetrics }>()
);

// ADVANCED
export const selectAdvancedOption = createAction(
	SessionAnalysisActions.SelectAdvancedOption,
	props<{ selectedAdvanced: AdvancedEnum }>()
);
export const loadAdvancedSessionData = createAction(
	SessionAnalysisActions.LoadAdvancedSessionData,
	props<{ team: Team; session: Event; players: Player[]; metrics: DeviceMetricDescriptor[] }>()
);
export const loadAdvancedPeriodData = createAction(
	SessionAnalysisActions.LoadAdvancedPeriodData,
	props<{ team: Team; datePeriod: Date[]; players: Player[]; metrics: DeviceMetricDescriptor[] }>()
);
export const loadAdvancedDataSuccess = createAction(
	SessionAnalysisActions.LoadAdvancedDataSuccess,
	props<{ advancedData: Map<string, AdvancedMetricData[]> }>()
);
export const loadAdvancedDataFailure = createAction(
	SessionAnalysisActions.LoadAdvancedDataFailure,
	props<{ error: any }>()
);

// DATE PERIOD
export const selectDatePeriod = createAction(
	SessionAnalysisActions.SelectDatePeriod,
	props<{ selectedDatePeriod: Date[] }>()
);

// CHART FLAGS
export const toggleSidebar = createAction(SessionAnalysisActions.ToggleSidebar, props<{ sidebar: boolean }>());
export const toggleThresholds = createAction(SessionAnalysisActions.ToggleThresholds, props<{ thresholds: boolean }>());
export const togglePercentage = createAction(SessionAnalysisActions.TogglePercentage, props<{ percent: boolean }>());
export const toggleOrder = createAction(SessionAnalysisActions.ToggleOrder, props<{ order: boolean }>());
export const toggleLabels = createAction(SessionAnalysisActions.ToggleLabels, props<{ labels: boolean }>());
export const toggleBubble = createAction(SessionAnalysisActions.ToggleBubble, props<{ bubble: boolean }>());

// DOWNLOAD FILES CSV & PDF
export const downloadPDF = createAction(
	SessionAnalysisActions.DownloadPDF,
	props<{
		reportData: TeamSessionReportDataPDF | PeriodTotalReportDataPDF | PeriodTrendReportDataPDF;
		reportType: SessionAnalysisReportType;
		filename: string;
		isV2?: boolean;
	}>()
);
export const downloadSessionTeamCSV = createAction(
	SessionAnalysisActions.DownloadSessionTeamCSV,
	props<{ reportData: TeamSessionReportDataCSV[] }>()
);
export const downloadPeriodCSV = createAction(
	SessionAnalysisActions.DownloadPeriodCSV,
	props<{ reportData: PeriodReportDataCSV }>()
);

// UPLOAD & SAVE
export const showUploadDialog = createAction(SessionAnalysisActions.ShowUploadDialog);
export const hideUploadDialog = createAction(SessionAnalysisActions.HideUploadDialog);
export const saveAttachments = createAction(
	SessionAnalysisActions.SaveAttachments,
	props<{ attachments: Attachment[] }>()
);
export const saveAttachmentsSuccess = createAction(
	SessionAnalysisActions.SaveAttachmentsSuccess,
	props<{ session: Event }>()
);
export const saveAttachmentsFailed = createAction(SessionAnalysisActions.SaveAttachmentsFailed);

// CALENDAR SESSION
export const goCalendarSession = createAction(SessionAnalysisActions.GoCalendarSession);

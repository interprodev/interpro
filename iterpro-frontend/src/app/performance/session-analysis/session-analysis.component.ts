import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { CalendarService } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { SelectItem } from 'primeng/api';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { RootStoreState } from 'src/app/+state/root-store.state';
import {
	SessionAnalysisStoreActions,
	SessionAnalysisStoreInterfaces,
	SessionAnalysisStoreSelectors
} from 'src/app/+state/session-analysis-store';
import {
	ALCLIndividual,
	AdvancedEnum,
	AdvancedMetricData,
	BubbleMetrics,
	ChartFlags,
	FiltersType,
	PeriodAnalysis,
	PeriodMatch,
	PeriodReportDataCSV,
	PeriodTotalReportDataPDF,
	PeriodTotalSession,
	PeriodTrendReportDataPDF,
	PeriodTrendSession,
	SemaphoreMetricValue,
	SessionAnalysis,
	SessionsType,
	SplitSelectItem,
	TeamSessionReportDataCSV,
	TeamSessionReportDataPDF,
	ViewFlags,
	Views
} from 'src/app/+state/session-analysis-store/ngrx/session-analysis-store.interfaces';
import { DropdownChangeEvent } from 'primeng/dropdown';

@UntilDestroy()
@Component({
	templateUrl: './session-analysis.component.html',
	styleUrls: ['./session-analysis.component.css']
})
export class SessionAnalysisComponent implements OnInit, OnDestroy {
	viewStates = Views;
	sessionViews = SessionAnalysis;
	periodViews = PeriodAnalysis;

	//#region STATES
	viewsStates$: Observable<{ mainView: Views; sessionView: SessionAnalysis; periodView: PeriodAnalysis }>;

	//#region GENERAL FILTERS
	selectedTeam$: Observable<Team>;
	teamSeasons$: Observable<TeamSeason[]>;
	metrics$: Observable<DeviceMetricDescriptor[]>;
	metricsLabels$: Observable<string[]>;
	playersOptions$: Observable<SelectItem<Player | TeamGroup>[]>;

	//#region SESSION FILTERS
	sessions$: Observable<Event[]>;
	sessionSplits$: Observable<SplitSelectItem[]>;
	playersInSession$: Observable<Player[]>;
	selectedSeason$: Observable<TeamSeason>;
	selectedSession$: Observable<Event>;
	selectedSessionDuration$: Observable<number>;
	selectedSessionGDType$: Observable<string>;
	selectedSessionPlayersOptions$: Observable<SelectItem<Player | TeamGroup>[]>;
	selectedFilter$: Observable<FiltersType>;
	selectedMetrics$: Observable<DeviceMetricDescriptor[]>;
	selectedBubbleMetrics$: Observable<BubbleMetrics>;
	selectedSessionTeamSplit$: Observable<SplitSelectItem>;
	selectedSessionIndividualSplits$: Observable<SplitSelectItem[]>;
	selectedIndividualPlayer$: Observable<Player>;
	// #endregion

	//#region PERIOD FILTERS
	selectedDatePeriod$: Observable<Date[]>;
	selectedPeriodPlayersOptions$: Observable<SelectItem<Player | TeamGroup>[]>;
	periodSplits$: Observable<SplitSelectItem[]>;
	selectedPeriodSplits$: Observable<SplitSelectItem[]>;
	selectedPeriodSessionType$: Observable<SessionsType>;
	periodTotalSessions$: Observable<PeriodTotalSession[]>;
	periodSessionDates$: Observable<string[]>;
	periodTrendSessions$: Observable<PeriodTrendSession[]>;
	periodGames$: Observable<number>;
	periodTrainings$: Observable<number>;
	periodTotalPlayersStatistics$: Observable<Map<string, SemaphoreMetricValue[]>>;
	periodTrendPlayersStatistics$: Observable<Map<string, SemaphoreMetricValue[]>>;
	periodTrendTableData$: Observable<Map<string, Map<string, { [key: string]: number }[]>>>;
	periodEventData$: Observable<Map<string, PeriodMatch>>;
	// #endregion

	//#region DATA
	sessionPlayersStatistics$: Observable<Map<string, SemaphoreMetricValue[]>>;
	playersSessions$: Observable<SessionPlayerData[]>;
	individualMainSession$: Observable<SessionPlayerData>;
	individualPlayerStatistics$: Observable<Map<string, string[]>>;
	individualALCL$: Observable<ALCLIndividual[]>;
	chartFlags$: Observable<ChartFlags>;
	chartFlagsEnable$: Observable<ChartFlags>;
	viewFlags$: Observable<ViewFlags>;
	// #endregion

	//#region ADVANCED
	advancedOptions$: Observable<SelectItem<AdvancedEnum>[]>;
	selectedAdvanced$: Observable<AdvancedEnum>;
	advancedData$: Observable<Map<string, AdvancedMetricData[]>>;
	canLoadAdvanced$: Observable<boolean>;
	advancedFlags$: Observable<{ inProgress: boolean; wrongSelection: boolean; noData: boolean }>;
	// #endregion

	//#region Period Trend Metric
	selectedMetric: DeviceMetricDescriptor;
	metricIndex = 0;
	metrics: DeviceMetricDescriptor[];
	// #endregion

	constructor(
		private readonly calendarService: CalendarService,
		private readonly store$: Store<RootStoreState>,
		private readonly route: ActivatedRoute
	) {}

	ngOnInit(): void {
		this.viewsStates$ = combineLatest([
			this.store$.select(SessionAnalysisStoreSelectors.selectSelectedView),
			this.store$.select(SessionAnalysisStoreSelectors.selectSelectedSessionAnalysisView),
			this.store$.select(SessionAnalysisStoreSelectors.selectSelectedPeriodAnalysisView)
		]).pipe(map(([mainView, sessionView, periodView]) => ({ mainView, sessionView, periodView })));

		this.selectedTeam$ = this.store$.select(SessionAnalysisStoreSelectors.selectSelectedTeam);
		this.teamSeasons$ = this.store$.select(SessionAnalysisStoreSelectors.selectSeasons);
		this.metrics$ = this.store$.select(SessionAnalysisStoreSelectors.selectMetrics);
		this.metrics$.pipe(distinctUntilChanged()).subscribe({
			next: metrics => {
				this.metrics = metrics;
				this.selectedMetric = metrics[this.metricIndex];
			}
		});
		this.metricsLabels$ = this.store$.select(SessionAnalysisStoreSelectors.selectMetricsLabels);
		this.sessionSplits$ = this.store$.select(SessionAnalysisStoreSelectors.selectSessionSplits);
		this.sessions$ = this.store$
			.select(SessionAnalysisStoreSelectors.selectSessions)
			.pipe(distinctUntilChanged((s1, s2) => s1.length === s2.length));
		this.playersOptions$ = this.store$.select(SessionAnalysisStoreSelectors.selectPlayersOptions);
		this.playersInSession$ = this.store$.select(SessionAnalysisStoreSelectors.selectPlayersInSession);
		this.selectedSession$ = this.store$
			.select(SessionAnalysisStoreSelectors.selectSelectedSession)
			.pipe(distinctUntilChanged());
		this.selectedSessionDuration$ = this.store$.select(SessionAnalysisStoreSelectors.selectSelectedSessionDuration);
		this.selectedSessionGDType$ = this.store$.select(SessionAnalysisStoreSelectors.selectSelectedSession).pipe(
			filter(s => Boolean(s)),
			map(s => this.calendarService.getGD(s.start))
		);
		this.selectedSeason$ = this.store$.select(SessionAnalysisStoreSelectors.selectSelectedSeason);
		this.selectedSessionPlayersOptions$ = this.store$.select(
			SessionAnalysisStoreSelectors.selectSelectedSessionPlayersOptions
		);
		this.selectedPeriodPlayersOptions$ = this.store$.select(
			SessionAnalysisStoreSelectors.selectSelectedPeriodPlayersOptions
		);
		this.selectedFilter$ = this.store$.select(SessionAnalysisStoreSelectors.selectSelectedFilter);
		this.selectedPeriodSessionType$ = this.store$.select(SessionAnalysisStoreSelectors.selectSelectedPeriodSessionType);
		this.selectedMetrics$ = this.store$.select(SessionAnalysisStoreSelectors.selectSelectedMetrics);
		this.selectedBubbleMetrics$ = this.store$.select(SessionAnalysisStoreSelectors.selectSelectedBubbleMetrics);
		this.selectedSessionTeamSplit$ = this.store$.select(SessionAnalysisStoreSelectors.selectSelectedSessionTeamSplit);
		this.selectedSessionIndividualSplits$ = this.store$.select(
			SessionAnalysisStoreSelectors.selectSelectedSessionIndividualSplits
		);
		this.selectedIndividualPlayer$ = this.store$.select(SessionAnalysisStoreSelectors.selectSelectedIndividualPlayer);
		this.individualMainSession$ = this.store$.select(SessionAnalysisStoreSelectors.selectIndividualMainSession);
		this.sessionPlayersStatistics$ = this.store$.select(SessionAnalysisStoreSelectors.selectPlayersStatistics);
		this.playersSessions$ = this.store$.select(SessionAnalysisStoreSelectors.selectPlayersSessions);
		this.individualALCL$ = this.store$.select(SessionAnalysisStoreSelectors.selectIndividualALCL);
		this.individualPlayerStatistics$ = this.store$.select(
			SessionAnalysisStoreSelectors.selectIndividualPlayerStatistics
		);
		this.chartFlags$ = this.store$.select(SessionAnalysisStoreSelectors.selectChartFlags);
		this.chartFlagsEnable$ = this.store$.select(SessionAnalysisStoreSelectors.selectChartFlagsEnable);
		this.viewFlags$ = this.store$.select(SessionAnalysisStoreSelectors.selectViewFlags);
		this.selectedDatePeriod$ = this.store$.select(SessionAnalysisStoreSelectors.selectSelectedDatePeriod);
		this.periodSplits$ = this.store$.select(SessionAnalysisStoreSelectors.selectPeriodSplits);
		this.selectedPeriodSplits$ = this.store$.select(SessionAnalysisStoreSelectors.selectSelectedPeriodSplits);
		this.periodGames$ = this.store$.select(SessionAnalysisStoreSelectors.selectPeriodGames);
		this.periodTrainings$ = this.store$.select(SessionAnalysisStoreSelectors.selectPeriodTrainings);
		this.periodTotalPlayersStatistics$ = this.store$.select(
			SessionAnalysisStoreSelectors.selectPeriodTotalPlayersStatistics
		);
		this.periodTrendPlayersStatistics$ = this.store$.select(
			SessionAnalysisStoreSelectors.selectPeriodTrendPlayersStatistics
		);
		this.periodTotalSessions$ = this.store$.select(SessionAnalysisStoreSelectors.selectPeriodTotalSessions);
		this.periodSessionDates$ = this.store$.select(SessionAnalysisStoreSelectors.selectPeriodSessionDates);
		this.periodTrendSessions$ = this.store$.select(SessionAnalysisStoreSelectors.selectAllPeriodTrendSessions);
		this.periodTrendTableData$ = this.store$.select(SessionAnalysisStoreSelectors.selectPlayersPeriodTrendTableData);
		this.periodEventData$ = this.store$.select(SessionAnalysisStoreSelectors.selectSelectedPeriodEventData);

		// -------- ADVANCED
		this.advancedOptions$ = this.store$.select(SessionAnalysisStoreSelectors.selectAdvancedOptions);
		this.selectedAdvanced$ = this.store$.select(SessionAnalysisStoreSelectors.selectSelectedAdvanced);
		this.advancedData$ = this.store$.select(SessionAnalysisStoreSelectors.selectAdvancedData);
		this.canLoadAdvanced$ = this.store$.select(SessionAnalysisStoreSelectors.selectCanLoadEWMA);
		this.advancedFlags$ = combineLatest([
			this.store$.select(SessionAnalysisStoreSelectors.selectAdvancedProgress),
			this.store$.select(SessionAnalysisStoreSelectors.selectAdvancedWrongSelectionFlag),
			this.store$.select(SessionAnalysisStoreSelectors.selectNoAdvancedDataFlag)
		]).pipe(map(([inProgress, wrongSelection, noData]) => ({ inProgress, wrongSelection, noData })));

		this.store$.dispatch(SessionAnalysisStoreActions.initStore({ routeParams: this.route.snapshot.params }));
	}

	ngOnDestroy(): void {
		this.store$.dispatch(SessionAnalysisStoreActions.resetStore());
	}

	onChangeFilterTab({ index }): void {
		this.store$.dispatch(
			SessionAnalysisStoreActions.selectView({ selectedView: index as SessionAnalysisStoreInterfaces.Views })
		);
	}

	onChangeSessionAnalysis({ index }): void {
		this.store$.dispatch(
			SessionAnalysisStoreActions.selectSessionAnalysis({
				selectedAnalysis: index as SessionAnalysisStoreInterfaces.SessionAnalysis
			})
		);
	}

	onChangePeriodAnalysis({ index }): void {
		this.store$.dispatch(
			SessionAnalysisStoreActions.selectPeriodAnalysis({
				selectedAnalysis: index as SessionAnalysisStoreInterfaces.PeriodAnalysis
			})
		);
	}

	onChangeSeason(selectedSeason: TeamSeason): void {
		this.store$.dispatch(SessionAnalysisStoreActions.loadSeasonInfo({ selectedSeason }));
	}

	onChangeSession(selectedSession: Event): void {
		this.store$.dispatch(SessionAnalysisStoreActions.selectSession({ selectedSession }));
	}

	onChangeTeamPlayers(selectedPlayers: Player[] | TeamGroup[]): void {
		this.store$.dispatch(SessionAnalysisStoreActions.selectSessionPlayers({ selectedPlayers }));
	}

	onChangeIndividualPlayer(selectedIndividualPlayer: Player): void {
		this.store$.dispatch(SessionAnalysisStoreActions.selectIndividualPlayer({ selectedIndividualPlayer }));
	}

	onChangeFilter(selectedFilter: FiltersType): void {
		this.store$.dispatch(SessionAnalysisStoreActions.selectFilter({ selectedFilter }));
	}

	onChangeMetrics(selectedMetrics: DeviceMetricDescriptor[]): void {
		this.store$.dispatch(SessionAnalysisStoreActions.selectMetrics({ selectedMetrics }));
	}

	onChangeBubbleMetrics(bubbleMetrics: BubbleMetrics): void {
		this.store$.dispatch(SessionAnalysisStoreActions.selectBubbleMetrics({ bubbleMetrics }));
	}

	onChangeTeamSplit(selectedTeamSplit: SplitSelectItem): void {
		this.store$.dispatch(SessionAnalysisStoreActions.selectSessionTeamSplit({ selectedTeamSplit }));
	}

	onChangeIndividualSplits(selectedIndividualSplits: SplitSelectItem[]): void {
		this.store$.dispatch(SessionAnalysisStoreActions.selectSessionIndividualSplits({ selectedIndividualSplits }));
	}

	onChangeAdvanced(selectedAdvanced: AdvancedEnum): void {
		this.store$.dispatch(SessionAnalysisStoreActions.selectAdvancedOption({ selectedAdvanced }));
	}

	onChangeDatePeriod(selectedDatePeriod: Date[]): void {
		this.store$.dispatch(SessionAnalysisStoreActions.selectDatePeriod({ selectedDatePeriod }));
	}

	onChangePeriodSplits(selectedSplits: SplitSelectItem[]): void {
		this.store$.dispatch(SessionAnalysisStoreActions.selectPeriodSplits({ selectedSplits }));
	}

	onChangeSessionType(selectedSessionType: SessionsType): void {
		this.store$.dispatch(SessionAnalysisStoreActions.selectSessionType({ selectedSessionType }));
	}

	onChangePeriodPlayers(selectedPlayers: Player[] | TeamGroup[]): void {
		this.store$.dispatch(SessionAnalysisStoreActions.selectPeriodPlayers({ selectedPlayers }));
	}

	onToggleSidebar(sidebar: boolean): void {
		this.store$.dispatch(SessionAnalysisStoreActions.toggleSidebar({ sidebar }));
	}

	onToggleThresholds(thresholds: boolean): void {
		this.store$.dispatch(SessionAnalysisStoreActions.toggleThresholds({ thresholds }));
	}

	onTogglePercentage(percent: boolean): void {
		this.store$.dispatch(SessionAnalysisStoreActions.togglePercentage({ percent }));
	}

	onToggleOrder(order: boolean): void {
		this.store$.dispatch(SessionAnalysisStoreActions.toggleOrder({ order }));
	}

	onToggleLabels(labels: boolean): void {
		this.store$.dispatch(SessionAnalysisStoreActions.toggleLabels({ labels }));
	}

	onToggleBubble(bubble: boolean): void {
		this.store$.dispatch(SessionAnalysisStoreActions.toggleBubble({ bubble }));
	}

	onCalendarSession(): void {
		this.store$.dispatch(SessionAnalysisStoreActions.goCalendarSession());
	}

	onShowUploadDialog(): void {
		this.store$.dispatch(SessionAnalysisStoreActions.showUploadDialog());
	}

	onHideUploadDialog(): void {
		this.store$.dispatch(SessionAnalysisStoreActions.hideUploadDialog());
	}

	onSaveAttachmentsToSession(attachments: Attachment[]): void {
		this.store$.dispatch(SessionAnalysisStoreActions.saveAttachments({ attachments }));
	}

	onDownloadSessionTeamPDF(reportData: TeamSessionReportDataPDF): void {
		this.store$.dispatch(
			SessionAnalysisStoreActions.downloadPDF({
				reportData,
				reportType: 'session_team',
				filename: `Session Team - ${reportData.summary.sessionName}`,
				isV2: true
			})
		);
	}

	onDownloadSessionIndividualPDF(reportData: any): void {
		this.store$.dispatch(
			SessionAnalysisStoreActions.downloadPDF({
				reportData,
				reportType: 'session_individual',
				filename: `Session Individual - ${reportData.sessionName}`
			})
		);
	}

	onDownloadSessionTeamCSV(reportData: TeamSessionReportDataCSV[]): void {
		this.store$.dispatch(SessionAnalysisStoreActions.downloadSessionTeamCSV({ reportData }));
	}

	onDownloadPeriodTotalPDF(reportData: PeriodTotalReportDataPDF): void {
		this.store$.dispatch(
			SessionAnalysisStoreActions.downloadPDF({
				reportData,
				reportType: 'period_total',
				filename: `Period Total - ${reportData.summary.datePeriod.value}`,
				isV2: true
			})
		);
	}

	onDownloadPeriodTrendPDF(reportData: PeriodTrendReportDataPDF): void {
		const report = Object.assign(
			{},
			{
				...reportData,
				data: {
					datasets: reportData.chart.data.datasets,
					labels: reportData.chart.data.labels
						.map((label: string) => new Date(label))
						.map(dt => dt.toString().slice(0, 15)) // Eg: "Wed May 08 2019"
				}
			}
		);

		this.store$.dispatch(
			SessionAnalysisStoreActions.downloadPDF({
				reportData: report,
				reportType: 'period_trend',
				filename: `Period Trend - ${reportData.summary.datePeriod.value}`,
				isV2: true
			})
		);
	}

	onDownloadPeriodCSV(reportData: PeriodReportDataCSV): void {
		this.store$.dispatch(SessionAnalysisStoreActions.downloadPeriodCSV({ reportData }));
	}

	//region Period Trend Metrics
	onMetricChange({ value }: DropdownChangeEvent): void {
		this.metricIndex = this.metrics.findIndex(({ metricName }) => metricName === value.metricName);
	}
	//endregion
}

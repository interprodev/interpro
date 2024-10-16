import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Attachment,
	Event,
	EventApi,
	Player,
	SessionsStatsApi,
	Team,
	TeamSeason,
	TeamSeasonApi
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	BlockUiInterceptorService,
	CalendarService,
	ErrorService,
	ReportService,
	SessionGDPipe,
	ToServerEquivalentService,
	getMomentFormatFromStorage,
	getPDFv2Path,
	removeDuplicates,
	sortByDate,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { cloneDeep, isEmpty, meanBy } from 'lodash';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { SelectItem } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { SeasonStoreActions, SeasonStoreSelectors } from './../../+state';
import { RootStoreState } from '../../+state/root-store.state';
import {
	AdvancedMetricData,
	PeriodReportDataCSV
} from '../../+state/session-analysis-store/ngrx/session-analysis-store.interfaces';
import FIELDS from './../session-analysis/utils/items';
import { DrillsBreakdownComponent } from './drills-breakdown/drills-breakdown.component';
import { PeriodBreakdownComponent } from './period-breakdown/period-breakdown.component';
import { PlayerComparisonComponent } from './player-comparison/player-comparison.component';
import { SessionSummaryComponent } from './session-summary/session-summary.component';
import { StressBalanceComponent, TrendPlayer } from './stress-balance/stress-balance.component';
import { WorkloadDistributionComponent } from './workload-distribution/workload-distribution.component';
import { SessionAnalysisStoreActions } from 'src/app/+state/session-analysis-store';
import { SessionAnalysisReportService } from '../session-analysis/utils/session-analysis-report.service';

@UntilDestroy()
@Component({
	templateUrl: './workload-analysis.component.html',
	styleUrls: ['./workload-analysis.component.css']
})
export class WorkloadAnalysisComponent implements OnInit, OnDestroy {
	datePeriod: Date[];
	today: Date;
	currentTeam: Team;

	sessions: Event[];
	selectedSession: Event;

	individualOptions: SelectItem[] = [];
	selectedSessionName = '';
	playerOptions: any[] = [];
	selectedPlayers: any[];
	sessionsInjected: any[];
	metricsOptions: any[] = [
		{ label: 'workload.cardio', value: 'cardio' },
		{ label: 'workload.intensity', value: 'intensity' },
		{ label: 'workload.kinematic', value: 'kinematic' },
		{ label: 'workload.mechanical', value: 'mechanical' },
		{ label: 'workload.metabolic', value: 'metabolic' },
		{ label: 'workload.perceived', value: 'perceived' },
		{ label: 'workload.workload', value: 'workload' }
	];
	selectedMetrics: any[];
	sessionView = 0;
	sidebarIndex = 0;
	periodView = 0;
	periodResults: any;
	stressBalanceMetricsOptions: any[] = [{ label: 'workload.readiness', value: 'readiness' }];
	selectedStressBalanceMetric = 'readiness';

	@ViewChild('summary', { static: false }) summaryComponent: SessionSummaryComponent;
	@ViewChild('comparison', { static: false }) comparisonComponent: PlayerComparisonComponent;
	@ViewChild('drills', { static: false }) drillsComponent: DrillsBreakdownComponent;
	@ViewChild('period', { static: false }) periodComponent: PeriodBreakdownComponent;
	@ViewChild('distribution', { static: false }) distributionComponent: WorkloadDistributionComponent;
	@ViewChild('stress', { static: false }) stressComponent: StressBalanceComponent;

	sessionPlayers: any[];
	modified: any = 0;
	individual: any = 0;
	sessionItems: SelectItem[] = [];
	individualItems: SelectItem[] = [];

	advancedProgressFlag = false;
	advancedAvailableFlag = false;
	noAdvancedFlag = false;
	advancedWrongSelectionFlag = false;
	private selectedSeason: TeamSeason;
	trendPlayer: TrendPlayer;

	// Chart flags
	uploadDialogVisibility: boolean;
	isFullscreen = false;
	labels = true;

	constructor(
		private store$: Store<RootStoreState>,
		private error: ErrorService,
		private currentTeamService: CurrentTeamService,
		private teamSeasonApi: TeamSeasonApi,
		private eventApi: EventApi,
		private alertService: AlertService,
		private calendar: CalendarService,
		private translate: TranslateService,
		private sessionsStats: SessionsStatsApi,
		private reportService: ReportService,
		private readonly sessionAnalysisReportService: SessionAnalysisReportService,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private route: ActivatedRoute,
		private toServer: ToServerEquivalentService,
		private gdSessionPipe: SessionGDPipe,
	) {}

	ngOnDestroy() {
		this.store$.dispatch(SeasonStoreActions.resetSeasonSelection());
	}

	ngOnInit() {
		this.translate.getTranslation(this.translate.currentLang).subscribe(() => {
			this.today = moment().startOf('day').toDate();
			this.currentTeam = this.currentTeamService.getCurrentTeam();
			this.metricsOptions = this.metricsOptions.map(x => ({
				label: this.translate.instant(x.label),
				value: x.value
			}));
			this.stressBalanceMetricsOptions = this.stressBalanceMetricsOptions.map(x => ({
				label: this.translate.instant(x.label),
				value: x.value
			}));
			this.sessionItems = [];
			this.individualItems = [];
			this.sessionItems = FIELDS['sessions'].map(x => ({
				label: this.translate.instant(x.label),
				value: x.value
			}));
			this.individualItems.push({
				label: this.translate.instant('workloadAnalysis.options.individual.all'),
				value: 0
			});
			this.individualItems.push({
				label: this.translate.instant('workloadAnalysis.options.individual.yes'),
				value: 1
			});
			this.individualItems.push({
				label: this.translate.instant('workloadAnalysis.options.individual.no'),
				value: 2
			});
			this.store$
				.select(SeasonStoreSelectors.selectDefault)
				.pipe(untilDestroyed(this))
				.subscribe((season: TeamSeason) => {
					this.getData(season);
				});
		});
	}

	onToggleLabels() {
		this.labels = !this.labels;
	}

	private getData(season: TeamSeason = this.currentTeamService.getCurrentSeason()) {
		this.selectedSeason = season;
		this.currentTeam = this.currentTeamService.getCurrentTeam();
		const $players = this.teamSeasonApi.getPlayers(season.id, {
			fields: ['id', 'displayName', '_thresholds', 'archived', 'archivedDate', 'teamSeasonId', 'downloadUrl']
		});
		const startDate = moment(this.selectedSeason.offseason).startOf('day').toDate();
		let endDate = moment(this.selectedSeason.inseasonEnd).startOf('day').toDate();
		if (moment().isSameOrBefore(moment(endDate))) endDate = moment().toDate();
		const $sessions = this.eventApi.getEventsOnlySessionImport(
			this.currentTeam.id,
			['workload'],
			false,
			startDate,
			endDate
		);

		forkJoin([$players, $sessions])
			.pipe(untilDestroyed(this))
			.subscribe(
				([players, { events }]: [Player[], { events: Event[] }]) => {
					const currentTeamCloned = cloneDeep(this.currentTeam);
					currentTeamCloned.players = players;
					this.currentTeam = currentTeamCloned;
					this.sessions = sortByDate(events, 'start').reverse();
					if (isEmpty(this.sessions)) {
						this.alertService.notify('warn', 'sessionAnalysis', 'alert.noGPSImportSessionsFound', false);
					} else {
						this.route.paramMap.pipe(first(), untilDestroyed(this)).subscribe((params: ParamMap) => {
							const selectedSession = params.has('id')
								? this.sessions.find(({ id }) => id === params.get('id'))
								: this.sessions[0];
							this.updateSession(selectedSession ? selectedSession : this.sessions[0]);
						});
					}
				},
				(error: Error) => {
					this.error.handleError(error);
				}
			);
	}

	populateDrillsExecuted(session, playerSessions) {
		// if (session.format === "game") {
		const drills = [];
		for (const sp of playerSessions) {
			if (!drills.find(x => x.name.toLowerCase() === sp.splitName.toLowerCase())) {
				const momSplit1 = moment(sp.splitEndTime);
				const momSplit2 = moment(sp.splitStartTime);
				const durationSplit = momSplit1.diff(momSplit2, 'minutes');
				if (sp.mainSession !== true) drills.push({ name: sp.splitName, duration: durationSplit });
			}
			session._drillsExecuted = drills;
		}
		// }
	}

	getSessionPlayerData(session: Event) {
		if (session) {
			this.eventApi
				.singleSessionDataAnalysis(['workload'], session.id)
				.pipe(untilDestroyed(this))
				.subscribe({
					next: (playerSessions: any[]) => {
						if (isEmpty(playerSessions)) {
							this.playerOptions = [];
							this.alertService.notify('warn', 'sessionAnalysis', 'alert.noGPSPlayerSessionsFound', false);
						} else {
							this.populateDrillsExecuted(session, playerSessions);
							playerSessions = sortByName(playerSessions, 'playerName');
							this.sessionPlayers = playerSessions;
							this.playerOptions = this.setPlayers(playerSessions);
							this.onChangePlayers({
								value: this.playerOptions.map(x => x.value)
							});
						}
					},
					error: (error: Error) => {
						this.error.handleError(error);
					}
				});
		}
	}

	getPeriodData() {
		const currentSeason = this.currentTeam.teamSeasons.find(x =>
			moment(this.datePeriod[0]).isBetween(moment(x.offseason), moment(x.inseasonEnd))
		);
		// Archival rule: if it isn't archived or it is archived and the archiviation date is after the session date we are analysing so it wasn't archived when the session was done
		const filtered = sortByName(this.currentTeam.players || [], 'displayName')
			.filter(({ id }) => currentSeason.playerIds.includes(id))
			.filter(
				({ archived, archivedDate }) =>
					!archived || (archived && moment(archivedDate).isAfter(moment(this.datePeriod[0])))
			);
			this.playerOptions = filtered.map(x => ({
				label: x.displayName,
				value: x
			}));
			this.selectedPlayers = !this.selectedPlayers
				? this.playerOptions.map(({ value }) => value)
				: this.selectedPlayers.filter(({ displayName }) =>
						this.playerOptions.find(({ label }) => label === displayName)
					);

		if (this.selectedPlayers.length > 0) {
			if (!currentSeason) {
				this.alertService.notify('warn', 'sessionAnalysis', 'alert.noSeasonForCurrentDate', false);
			} else {
				this.sessionsStats
					.workloadAnalysisPeriod(
						this.currentTeam.id,
						this.selectedPlayers.map(x => x.id),
						this.toServer.convert(this.datePeriod[0]).toJSON(),
						this.toServer.convert(this.datePeriod[1]).toJSON(),
						this.modified,
						this.individual
					)
					.pipe(
						first(),
						switchMap((results: any) => {
							this.periodResults = results;
							this.advancedProgressFlag = true;
							this.advancedAvailableFlag = false;
							this.noAdvancedFlag = false;
							return this.blockUiInterceptorService.disableOnce(
								this.sessionsStats.getAdvancedData(
									this.currentTeam.id,
									this.selectedPlayers.map(x => x.id),
									this.toServer.convert(moment(this.datePeriod[0]).startOf('day').toDate()).toISOString(),
									this.toServer.convert(moment(this.datePeriod[1]).endOf('day').toDate()).toISOString(),
									['workload']
								)
							);
						}),
						untilDestroyed(this)
					)
					.subscribe(
						(resultsEwma: Map<string, AdvancedMetricData[]>) => {
							this.advancedProgressFlag = false;

							// GET RESULTS AND CHECK VALIDITY
							if (resultsEwma) {
								if (!this.stressBalanceMetricsOptions.find(x => x.value === 'ewma')) {
									this.stressBalanceMetricsOptions.push({
										label: this.translate.instant('workload.ewma'),
										value: 'ewma'
									});
								}
								this.advancedAvailableFlag = true;

								// BUILD THE ENTIRE PERIOD
								const start = moment(this.toServer.convert(moment(this.datePeriod[0]).startOf('day').toDate()));
								const end = moment(this.toServer.convert(moment(this.datePeriod[1]).endOf('day').toDate()));
								const period: string[] = [];
								const mappedEwma = [];

								while (start.isSameOrBefore(end)) {
									period.push(start.toISOString());
									start.add(1, 'days');
								}

								period.forEach(day => {
									mappedEwma[day] = resultsEwma[day] || [];
								});

								this.periodResults['ewma'] = mappedEwma;
							} else {
								this.noAdvancedFlag = true;
								const ewmaIndex = this.stressBalanceMetricsOptions.findIndex(x => x.value === 'ewma');
								if (ewmaIndex) {
									this.stressBalanceMetricsOptions.splice(ewmaIndex, 1);
								}
							}

							this.periodResults = { ...this.periodResults };
						},
						(error: Error) => {
							this.advancedAvailableFlag = false;
							this.advancedProgressFlag = false;
							this.noAdvancedFlag = true;
							this.error.handleError(error);
						}
					);
			}
		}
	}

	setPlayers(playerSessions): Player[] {
		let players = playerSessions
			.filter(x => x.mainSession)
			.map(x => {
				if (this.currentTeam && this.currentTeam.players) {
					const player = this.currentTeam.players.find(pl => pl.id === x.playerId);
					if (player) return { label: player.displayName, value: player };
				}
			});
		players = removeDuplicates(players.filter(x => x));
		return players;
	}

	onChangePeriod(event) {
		if (this.datePeriod[1]) {
			this.playerOptions = [];
			this.getPeriodData();
			if (!!this.trendPlayer && this.trendPlayer.players.length > 0) {
				this.onChangeTrendPlayer({ value: this.trendPlayer.players });
			}
		}
	}

	onChangePlayers(event) {
		this.selectedPlayers = sortByName(event.value, 'displayName');
		if (!this.selectedMetrics) this.onChangeMetrics({ value: this.metricsOptions.map(x => x.value) });
		if (this.sidebarIndex === 1) this.getPeriodData();
	}

	onChangeTrendPlayer({ value }: { value: Player[] }) {
		const players = value;
		this.sessionsStats
			.workloadAnalysisPeriod(
				this.currentTeam.id,
				players.map(player => player.id),
				this.datePeriod[0].toJSON(),
				this.datePeriod[1].toJSON(),
				this.modified,
				this.individual
			)
			.pipe(first())
			.subscribe(workload => {
				this.trendPlayer = { players, workload };
			});
	}

	private updateSession(event: Event): void {
		this.selectedSession = event;
		this.selectedSessionName = this.gdSessionPipe.transform(this.selectedSession);
		if (this.selectedSession && !this.selectedSessionName && this.sessions) {
			const option: Event = this.sessions.find(({ id }) => id === this.selectedSession.id);
			if (option) this.selectedSessionName = this.gdSessionPipe.transform(option);
		}

		this.getSessionPlayerData(this.selectedSession);
	}

	onChangeSession($event: { originalEvent: PointerEvent; value: Event }) {
		this.updateSession($event.value);
	}

	onChangeMetrics(event) {
		this.selectedMetrics = event.value.sort();
	}

	onChangeMetricsPeriod(event) {
		this.selectedStressBalanceMetric = event.value;
	}

	onChangeTab(event) {
		this.sessionView = event.index;
	}

	onChangeTabPeriod(event) {
		this.periodView = event.index;
	}

	onChangeAnalysisTab(event) {
		this.sidebarIndex = event.index;
		if (this.sidebarIndex === 1) {
			if (!this.datePeriod) {
				let day = this.today;

				const { offseason, inseasonEnd } = this.selectedSeason;

				// If I'm seeing an older season, I'll take as reference for date period the end of that season, otherwise I'll take today
				if (!moment().isBetween(offseason, inseasonEnd)) day = inseasonEnd;
				this.datePeriod = [
					moment(day).subtract(7, 'days').startOf('day').toDate(),
					moment(day).startOf('day').toDate()
				];
			}
			this.getPeriodData();
		} else {
			this.updateSession(this.selectedSession);
		}
	}

	onChangeModified(event) {
		this.modified = event.value;
		this.getPeriodData();
	}

	onChangeIndividual(event) {
		this.individual = event.value;
		this.getPeriodData();
	}

	getEwmaObject(data) {
		const keys = Object.keys(data);
		const values = Object.values(data);
		const dates = Object.keys(data[keys[0]]);
		const map = {};

		dates.forEach(day => {
			map[day] = {};
			let loadsAl = [];
			let loadsCl = [];
			let loadsAlCl = [];
			values.forEach(val => {
				loadsAl = [...loadsAl, val[day]['ewmaAcuteLoad_workload']];
				loadsCl = [...loadsCl, val[day]['ewmaCronicLoad_workload']];
				loadsAlCl = [
					...loadsAlCl,
					val[day]['ewmaCronicLoad_workload'] && val[day]['ewmaCronicLoad_workload'] !== 0
						? val[day]['ewmaAcuteLoad_workload'] / val[day]['ewmaCronicLoad_workload']
						: 0
				];
			});
			map[day]['al'] = Number(meanBy(loadsAl)).toFixed(1);
			map[day]['cl'] = Number(meanBy(loadsCl)).toFixed(1);
			map[day]['al/cl'] = Number(meanBy(loadsAlCl)).toFixed(1);
		});
		return map;
	}

	getReportPdf() {
		if (this.sidebarIndex === 0) {
			const common = {
				title: 'SESSION REPORT',
				subtitle: this.selectedSessionName
			};
			const summary = this.summaryComponent.getReport();
			const comparison = this.comparisonComponent.getReport();
			const drills = this.drillsComponent.getReport();

			const data = { ...common, ...summary, ...comparison, ...drills };

			this.reportService.getReport(
				getPDFv2Path('workload-analysis', 'session-workload-analysis', false),
				data,
				'',
				null,
				`Workload Analysis - ${common.subtitle}`
			);
		} else if (this.sidebarIndex === 1) {
			const period =
				this.datePeriod && this.datePeriod.length > 1
					? moment(this.datePeriod[0]).format(getMomentFormatFromStorage()) +
						' - ' +
						moment(this.datePeriod[1]).format(getMomentFormatFromStorage())
					: '';
			const common = {
				title: 'PERIOD REPORT',
				subtitle: period
			};
			const reportLabels = {
				labels: [
					this.translate.instant('event.effort.1'),
					this.translate.instant('event.effort.2'),
					this.translate.instant('event.effort.3'),
					this.translate.instant('event.effort.4'),
					this.translate.instant('event.effort.5'),
					this.translate.instant('event.effort.6')
				]
			};
			const breakdown = this.periodComponent.getReport();
			const distribution = this.distributionComponent.getReport();
			const trend = this.stressComponent.getReport();
			const data = {
				...common,
				...breakdown,
				...distribution,
				...trend,
				labels: reportLabels
			};

			data.trendData.labels = data.trendData.labels.map(label => moment(this.toServer.convert(label.toDate())));
			this.reportService.getReport('workload_2', data, '', null, `Workload Analysis - ${period}`);
		}
	}

	getReportCsv() {
		if (this.sidebarIndex === 0) {
			this.csvSession();
		} else if (this.sidebarIndex === 1) {
			this.onDownloadPeriodCSV();
		}
	}

	private csvSession() {
		const pls = this.playerOptions.map(({ value }) => value);
		const ids = pls.map(({ id }) => id);
		let filtered = [];
		if (this.sessionPlayers)
			filtered = this.sessionPlayers.filter(({ playerId, mainSession }) => ids.includes(playerId) && mainSession);
		const csvRows = [];
		filtered.forEach(sess => {
			const singleObj = {};
			singleObj['GD_Type'] = this.calendar.getGD(moment(sess.date).toDate());
			singleObj['Date'] = moment(sess.drillStartTime).format(`${getMomentFormatFromStorage()} hh:mm`);
			singleObj['Player'] = sess.playerName;
			this.metricsOptions
				.map(x => x.value)
				.forEach(metric => {
					if (metric !== 'intensity' && metric !== 'workload')
						singleObj[metric + 'Workload'] = Number(sess[metric + 'Workload']);
					else singleObj[metric] = Number(sess[metric]);
				});
			csvRows.push(singleObj);
		});
		const results = Papa.unparse(csvRows, {});

		const fileName =
			'workload-analysis-session_' + moment(this.selectedSession.start).startOf('day').format('DD-MM-YYYY') + '.csv';
		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	private onDownloadPeriodCSV(): void {
		const reportData: PeriodReportDataCSV = this.sessionAnalysisReportService.getReportDataPeriodCSV(
			this.currentTeam,
			this.datePeriod,
			this.selectedPlayers,
			undefined,
			[
				'workload',
				'cardioWorkload',
				'perceivedWorkload',
				'metabolicWorkload',
				'kinematicWorkload',
				'mechanicalWorkload',
				'intensityWorkload'
			]
		);
		this.store$.dispatch(SessionAnalysisStoreActions.downloadPeriodCSV({ reportData }));
	}

	private csvPeriod() {
		try {
			const ewmaData = this.periodResults['ewma'] ? this.getEwmaObject(this.periodResults['ewma']) : null;
			const csvRows = [];

			for (const keyDate in this.periodResults.workload_distribution.avg_values) {
				if (keyDate) {
					const singleObj = {};
					const dataObj = this.periodResults.workload_distribution.avg_values[keyDate];
					singleObj['GD_Type'] = this.calendar.getGD(moment(keyDate).toDate());
					singleObj['Date'] = moment(keyDate, getMomentFormatFromStorage()).format(getMomentFormatFromStorage());
					singleObj['workload'] = dataObj.workload;
					singleObj['cardio'] = dataObj.cardio;
					singleObj['perceived'] = dataObj.perceived;
					singleObj['metabolic'] = dataObj.metabolic;
					singleObj['kinematic'] = dataObj.kinematic;
					singleObj['mechanical'] = dataObj.mechanical;
					singleObj['intensity'] = dataObj.intensity;
					const readinessObj = this.periodResults.stress_balance.find(({ label }) => label === keyDate);
					if (readinessObj) singleObj['readiness'] = readinessObj.readiness;
					const ewmaObj = ewmaData && keyDate in ewmaData ? ewmaData[keyDate] : null;
					if (ewmaObj) {
						singleObj['ewma_al'] = ewmaObj['al'];
						singleObj['ewma_cl'] = ewmaObj['cl'];
						singleObj['ewma_al/ewma_cl'] = ewmaObj['al/cl'];
					}
					csvRows.push(singleObj);
				}
			}
			const results = Papa.unparse(csvRows, {});

			const fileName =
				'Workload Analysis - Period ' +
				moment(this.datePeriod[0]).startOf('day').format(getMomentFormatFromStorage()) +
				'-' +
				moment(this.datePeriod[1]).startOf('day').format(getMomentFormatFromStorage()) +
				'.csv';

			const blob = new Blob([results], { type: 'text/plain' });
			saveAs(blob, fileName);
		} catch (e) {
			// TODO: should the user be notified?
			// eslint-disable-next-line no-console
			console.error(e);
		}
	}

	getLinkPlanning() {
		if (this.selectedSession) {
			const params = {
				id: this.selectedSession.id,
				start: this.selectedSession.start
			};
			return ['/manager/planning', params];
		}
	}

	saveAttachments(event: Attachment[]) {
		this.uploadDialogVisibility = false;
		this.selectedSession._attachments = event;
		this.eventApi
			.patchAttributes(this.selectedSession.id, {
				id: this.selectedSession.id,
				_attachments: this.selectedSession._attachments
			})
			.pipe(untilDestroyed(this))
			.subscribe(
				(res: any) => {
					this.alertService.notify('success', 'workloadAnalysis', 'alert.recordUpdated', false);
				},
				(error: Error) => {
					this.error.handleError(error);
				}
			);
	}
}

/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
	DeviceMetricDescriptor,
	Event,
	EventApi,
	LoopBackAuth,
	LoopBackConfig,
	Player,
	SessionPlayerData,
	SessionsStatsApi,
	Team,
	TeamGroup,
	TeamSeason,
	TeamSeasonApi
} from '@iterpro/shared/data-access/sdk';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store, select } from '@ngrx/store';
import { saveAs } from 'file-saver';
import { isEmpty } from 'lodash';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import {
	AdvancedEnum,
	PeriodAnalysis,
	PeriodTotalResult,
	PeriodTrendResult,
	SessionsResult,
	Views
} from './session-analysis-store.interfaces';

import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { PermissionsService } from '@iterpro/shared/data-access/permissions';
import {
	AlertService,
	BlockUiInterceptorService,
	ToServerEquivalentService,
	getMomentFormatFromStorage,
	getTeamSettings,
	isNotEmpty,
	isNotNull
} from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { SessionAnalysisReportService } from 'src/app/performance/session-analysis/utils/session-analysis-report.service';
import { SessionAnalysisService } from 'src/app/performance/session-analysis/utils/session-analysis.service';
import { RootStoreState } from '../../root-store.state';
import * as SessionAnalysisStoreActions from './session-analysis-store.actions';
import * as SessionAnalysisStoreSelectors from './session-analysis-store.selectors';

@Injectable()
export class SessionAnalysisStoreEffects {
	onInitStore$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.initStore),
			map(({ routeParams }) => {
				if (routeParams) {
					return {
						session_id: routeParams.session_id,
						player_id: routeParams.player_id,
						season_id: routeParams.season_id,
						date: routeParams.date,
						ewma: routeParams.ewma,
						metric: isNotNull(routeParams.metric) ? routeParams.metric.split(',') : null
					};
				}
			}),
			switchMap(routeParams => {
				const selectedTeam: Team = this.currentTeamService.getCurrentTeam();
				const seasons: TeamSeason[] = selectedTeam.teamSeasons;
				let selectedSeason: TeamSeason = this.currentTeamService.getCurrentSeason();

				if (routeParams.season_id && selectedSeason.id !== routeParams.season_id) {
					selectedSeason = seasons.find(({ id }) => id === routeParams.season_id);
				}

				return of(
					SessionAnalysisStoreActions.setRouteParams({ routeParams }),
					SessionAnalysisStoreActions.initStoreSuccess({
						seasons,
						selectedTeam,
						selectedSeason
					}),
					SessionAnalysisStoreActions.loadSeasonInfo({ selectedSeason })
				);
			})
		);
	});

	loadSeasonInfo$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.loadSeasonInfo),
			withLatestFrom(
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedTeam),
				this.store$.select(SessionAnalysisStoreSelectors.selectRouteParams)
			),
			switchMap(([{ selectedSeason }, team, routeParams]) => {
				const players$: Observable<Player[]> = this.teamSeasonApi.getPlayers(selectedSeason.id, {
					fields: ['id', 'displayName', '_thresholds', 'archived', 'archivedDate', 'teamSeasonId', 'downloadUrl']
				});
				const groups$: Observable<TeamGroup[]> = this.teamSeasonApi.getGroups(selectedSeason.id, {
					fields: ['name', 'players', 'id']
				});
				const metrics$: Observable<DeviceMetricDescriptor[]> = this.service.extractDefaultMetrics(team);
				return forkJoin([players$, groups$, metrics$]).pipe(
					switchMap(([players, groups, metrics]) => {
						const selectedMetrics: DeviceMetricDescriptor[] = routeParams.metric
							? routeParams.metric.map(metric => metrics.find(({ metricName }) => metricName === metric))
							: metrics;
						return [
							SessionAnalysisStoreActions.loadSeasonInfoSuccess({ players, groups, metrics }),
							SessionAnalysisStoreActions.selectMetrics({ selectedMetrics: selectedMetrics.slice(0, 2) })
						];
					}),
					catchError(error => of(SessionAnalysisStoreActions.loadSeasonInfoFailure({ error })))
				);
			})
		);
	});

	loadSessionsTrigger$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.loadSeasonInfoSuccess),
			map(() => SessionAnalysisStoreActions.loadSessions())
		);
	});

	loadSessions$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.loadSessions),
			withLatestFrom(
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedSeason),
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedTeam),
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedMetrics)
			),
			filter(([_, season, team, metrics]) => season && team && isNotEmpty(metrics)),
			switchMap(([_, season, team, metrics]) =>
				this.eventApi
					.getEventsOnlySessionImport(
						team.id,
						metrics.map(({ metricName }) => metricName),
						false,
						moment(season.offseason).startOf('day').toISOString(),
						moment(season.inseasonEnd).endOf('day').toISOString()
					)
					.pipe(
						map((sessionsResult: SessionsResult) =>
							SessionAnalysisStoreActions.loadSessionsSuccess({ sessionsResult })
						),
						catchError(error => of(SessionAnalysisStoreActions.loadSessionsFailure({ error })))
					)
			)
		);
	});

	onLoadSessionsSuccess$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.loadSessionsSuccess),
			withLatestFrom(this.store$.select(SessionAnalysisStoreSelectors.selectRouteParams)),
			map(([{ sessionsResult }, routeParams]) => {
				const pastSessions: Event[] = SessionAnalysisStoreSelectors.orderSessions(sessionsResult.events);

				let session: Event;

				if (routeParams && routeParams.session_id) {
					session = sessionsResult.events.find(({ id }) => id === routeParams.session_id);
					return SessionAnalysisStoreActions.selectSession({ selectedSession: session });
				} else {
					if (routeParams && routeParams.date) {
						session = sessionsResult.events.find(x => moment(x.start).isSame(moment(routeParams.date), 'day'));
						return SessionAnalysisStoreActions.selectSession({ selectedSession: session || pastSessions[0] });
					} else {
						session = pastSessions.find(({ start }) => moment().isSame(moment(start), 'day'));
						return SessionAnalysisStoreActions.selectSession({ selectedSession: session || pastSessions[0] });
					}
				}
			})
		);
	});

	onSessionSelected$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.selectSession),
			filter(({ selectedSession }) => !!selectedSession),
			map(({ selectedSession }) => SessionAnalysisStoreActions.loadSessionDetails({ selectedSession }))
		);
	});

	loadSessionDetails$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.selectSession),
			withLatestFrom(
				this.store$.select(SessionAnalysisStoreSelectors.selectMetrics),
				this.store$.select(SessionAnalysisStoreSelectors.selectPlayers)
			),
			filter(([{ selectedSession }]) => !!selectedSession),
			switchMap(([{ selectedSession }, metrics, players]) =>
				this.eventApi
					.singleSessionDataAnalysis(
						metrics.filter(m => !!m).map(({ metricName }) => metricName),
						selectedSession.id
					)
					.pipe(
						map((sessionPlayers: SessionPlayerData[]) => {
							if (isEmpty(sessionPlayers)) {
								this.alertService.notify('warn', 'sessionAnalysis', 'alert.noGPSPlayerSessionsFound', false);
							} else {
								sessionPlayers.forEach(sess => {
									const player = (players as Player[]).find(({ id }) => String(id) === String(sess.playerId));
									if (player) sess.playerName = player.displayName;
								});
							}

							return SessionAnalysisStoreActions.loadSessionDetailsSuccess({ sessionPlayers });
						}),
						catchError(error => of(SessionAnalysisStoreActions.loadSessionDetailsFailure({ error })))
					)
			)
		);
	});

	/* #region ADVANCED */
	loadAdvancedDataSessionTrigger$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.loadSessionDetailsSuccess, SessionAnalysisStoreActions.selectMetrics),
			withLatestFrom(
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedTeam),
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedSession),
				this.store$.select(SessionAnalysisStoreSelectors.selectPlayersInSession),
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedMetrics),
				this.store$.select(SessionAnalysisStoreSelectors.selectCanLoadEWMA)
			),
			filter(
				([_, team, session, sessionPlayers, metrics, canLoadAdvanced]) =>
					!!team && !!session && isNotEmpty(sessionPlayers) && canLoadAdvanced
			),
			map(([_, team, session, sessionPlayers, metrics]) => {
				return SessionAnalysisStoreActions.loadAdvancedSessionData({
					team,
					session,
					players: sessionPlayers,
					metrics
				});
			})
		);
	});

	loadAdvancedDataPeriodTrigger$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.loadPeriodTrendDetailsSuccess),
			withLatestFrom(
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedTeam),
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedDatePeriod),
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedPeriodPlayers),
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedMetrics),
				this.store$.select(SessionAnalysisStoreSelectors.selectCanLoadEWMA)
			),
			filter(
				([_, team, datePeriod, periodPlayers, metrics, canLoadAdvanced]) =>
					!!team && isNotEmpty(datePeriod) && isNotEmpty(periodPlayers) && canLoadAdvanced
			),
			map(([_, team, datePeriod, periodPlayers, metrics]) => {
				return SessionAnalysisStoreActions.loadAdvancedPeriodData({
					team,
					datePeriod,
					players: periodPlayers as Player[],
					metrics
				});
			})
		);
	});

	loadAdvancedSessionData$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.loadAdvancedSessionData),
			switchMap(({ team, session, players, metrics }) => {
				const canAccess = this.permissionsService.canTeamAccessToModule('ewma', team).response;
				if (canAccess) {
					return this.blockUiInterceptorService.disableOnce(
						this.sessionsStats
							.getAdvancedData(
								team.id,
								players.map(({ id }) => id),
								this.toServer.convert(moment(session.start).startOf('day').toDate()).toISOString(),
								this.toServer.convert(moment(session.start).endOf('day').toDate()).toISOString(),
								metrics.map(({ metricName }) => metricName),
								'day'
							)
							.pipe(
								map(advancedData => SessionAnalysisStoreActions.loadAdvancedDataSuccess({ advancedData })),
								catchError(error => of(SessionAnalysisStoreActions.loadAdvancedDataFailure({ error })))
							)
					);
				}
			})
		);
	});

	loadAdvancedDataSuccess$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.loadAdvancedDataSuccess),
			withLatestFrom(this.store$.select(SessionAnalysisStoreSelectors.selectRouteParams)),
			map(([_, routeParams]) =>
				SessionAnalysisStoreActions.selectAdvancedOption({
					selectedAdvanced: routeParams.ewma ? AdvancedEnum.ACWL : null
				})
			)
		);
	});

	loadAdvancedPeriodData$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.loadAdvancedPeriodData),
			switchMap(({ team, datePeriod, players, metrics }) => {
				const canAccess = this.permissionsService.canTeamAccessToModule('ewma', team).response;
				if (canAccess) {
					return this.blockUiInterceptorService.disableOnce(
						this.sessionsStats
							.getAdvancedData(
								team.id,
								players.map(({ id }) => id),
								this.toServer.convert(moment(datePeriod[0]).startOf('day').toDate()).toISOString(),
								this.toServer.convert(moment(datePeriod[1]).endOf('day').toDate()).toISOString(),
								metrics.map(({ metricName }) => metricName),
								'day'
							)
							.pipe(
								map(advancedData => SessionAnalysisStoreActions.loadAdvancedDataSuccess({ advancedData })),
								catchError(error => of(SessionAnalysisStoreActions.loadAdvancedDataFailure({ error })))
							)
					);
				}
			})
		);
	});

	viewsStates = Views;

	selectAdvancedOption$: Observable<void> = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(SessionAnalysisStoreActions.selectAdvancedOption),
				withLatestFrom(this.store$.pipe(select(SessionAnalysisStoreSelectors.selectSelectedView))),
				filter(([{ selectedAdvanced }, currentView]) => {
					return !selectedAdvanced && currentView === this.viewsStates.Period;
				}),
				map(() => this.alertService.notify('warn', 'sessionAnalysis', 'alert.advancedAnalysisWrongSelection', false))
			);
		},
		{ dispatch: false }
	);

	/* #endregion */

	loadPeriodTrigger$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(
				SessionAnalysisStoreActions.selectView,
				SessionAnalysisStoreActions.selectPeriodAnalysis,
				SessionAnalysisStoreActions.selectDatePeriod,
				SessionAnalysisStoreActions.selectMetrics,
				SessionAnalysisStoreActions.selectPeriodSplits,
				SessionAnalysisStoreActions.selectFilter,
				SessionAnalysisStoreActions.selectSessionType
			),
			withLatestFrom(
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedView),
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedPeriodAnalysisView),
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedDatePeriod),
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedTeam),
				this.store$.select(SessionAnalysisStoreSelectors.selectPlayers),
				this.store$.select(SessionAnalysisStoreSelectors.selectSelectedMetrics)
			),
			filter(
				([_, view, selectedPeriodAnalysis, datePeriod, team, players, metrics]) =>
					view === Views.Period && !!datePeriod && !!team && isNotEmpty(players) && isNotEmpty(metrics)
			),
			map(res => res[2]), // SelectedPeriodAnalysis
			map((selectedAnalysis: PeriodAnalysis) =>
				selectedAnalysis === PeriodAnalysis.Total
					? SessionAnalysisStoreActions.loadPeriodTotalDetails()
					: SessionAnalysisStoreActions.loadPeriodTrendDetails()
			)
		);
	});

	loadPeriodTotal$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.loadPeriodTotalDetails),
			withLatestFrom(this.store$.select(SessionAnalysisStoreSelectors.selectPeriodTriggerData)),
			switchMap(([_, { datePeriod, team, playersIds, groups, splits, filter, sessionType }]) =>
				this.sessionsStats
					.sessionsPeriodTotal(
						team.id,
						groups,
						this.toServer.convert(moment(datePeriod[0]).startOf('day').toDate()).toISOString(),
						this.toServer.convert(moment(datePeriod[1]).endOf('day').toDate()).toISOString(),
						getTeamSettings(this.auth.getCurrentUserData().teamSettings, team.id).metricsPerformance,
						isNotEmpty(splits) ? splits.map(({ label }) => label) : [team.mainSplitName, team.mainGameName],
						filter,
						sessionType
					)
					.pipe(
						map((result: PeriodTotalResult) => SessionAnalysisStoreActions.loadPeriodTotalDetailsSuccess({ result })),
						catchError(error => of(SessionAnalysisStoreActions.loadPeriodTotalDetailsFailure({ error })))
					)
			)
		);
	});

	selectPeriodPlayers$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.selectPeriodPlayers),
			withLatestFrom(this.store$.select(SessionAnalysisStoreSelectors.selectSelectedPeriodAnalysisView)),
			filter(([{ selectedPlayers }, periodView]) => periodView === PeriodAnalysis.Trend && isNotEmpty(selectedPlayers)),
			map(() => SessionAnalysisStoreActions.loadPeriodTrendDetails())
		);
	});

	loadPeriodTrend$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.loadPeriodTrendDetails),
			withLatestFrom(this.store$.select(SessionAnalysisStoreSelectors.selectPeriodTriggerData)),
			switchMap(([_, { datePeriod, team, playersIds, groups, splits, filter, sessionType }]) => {
				return this.sessionsStats
					.sessionsPeriodTrend(
						team.id,
						playersIds,
						groups,
						this.toServer.convert(moment(datePeriod[0]).startOf('day').toDate()).toISOString(),
						this.toServer.convert(moment(datePeriod[1]).endOf('day').toDate()).toISOString(),
						getTeamSettings(this.auth.getCurrentUserData().teamSettings, team.id).metricsPerformance,
						isNotEmpty(splits) ? splits.map(({ label }) => label) : [team.mainSplitName, team.mainGameName],
						filter,
						sessionType
					)
					.pipe(
						map((result: PeriodTrendResult) => SessionAnalysisStoreActions.loadPeriodTrendDetailsSuccess({ result })),
						catchError(error => of(SessionAnalysisStoreActions.loadPeriodTrendDetailsFailure({ error })))
					);
			})
		);
	});

	goCalendarSession$: Observable<void> = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(SessionAnalysisStoreActions.goCalendarSession),
				withLatestFrom(this.store$.select(SessionAnalysisStoreSelectors.selectSelectedSession)),
				map(([_, session]) => {
					if (session) {
						this.router.navigate(['/manager/planning', { id: session.id, start: session.start }]);
					} else {
						this.alertService.notify('warn', 'sessionAnalysis', 'alert.noGPSPlayerSessionsFound', false);
					}
				})
			);
		},
		{ dispatch: false }
	);

	saveAttachments$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(SessionAnalysisStoreActions.saveAttachments),
			withLatestFrom(this.store$.select(SessionAnalysisStoreSelectors.selectSelectedSession)),
			switchMap(([{ attachments }, session]) => {
				if (session) {
					return this.eventApi
						.patchAttributes(session.id, {
							id: session.id,
							_attachments: attachments
						})
						.pipe(
							switchMap(session =>
								of(
									SessionAnalysisStoreActions.hideUploadDialog(),
									SessionAnalysisStoreActions.saveAttachmentsSuccess({ session })
								)
							),
							catchError(_ => of(SessionAnalysisStoreActions.hideUploadDialog()))
						);
				} else {
					this.alertService.notify('warn', 'sessionAnalysis', 'alert.noGPSPlayerSessionsFound', false);
				}
			})
		)
	);

	onSaveAttachmentsSuccess$: Observable<Action> = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(SessionAnalysisStoreActions.saveAttachmentsSuccess),
				tap(() => this.alertService.notify('success', 'sessionAnalysis', 'alert.recordUpdated', false))
			);
		},
		{ dispatch: false }
	);

	// DOWNLOADS
	downloadPDF$: Observable<void> = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(SessionAnalysisStoreActions.downloadPDF),
				map(({ reportData, reportType, filename, isV2 }) =>
					this.reportService.downloadReport(reportType, reportData, filename, isV2)
				)
			);
		},
		{ dispatch: false }
	);

	downloadSessionTeamCSV$: Observable<void> = createEffect(
		() =>
			this.actions$.pipe(
				ofType(SessionAnalysisStoreActions.downloadSessionTeamCSV),
				withLatestFrom(this.store$.select(SessionAnalysisStoreSelectors.selectSelectedSession)),
				map(([{ reportData }, session]) => {
					const result = Papa.unparse(reportData, {});
					const filename = `GPS Data - Team Session ${moment(session.start).format(
						`${getMomentFormatFromStorage()} hh:mm`
					)}.csv`;
					const file = new Blob([result], { type: 'text/csv;charset=utf-8' });
					saveAs(file, filename);
				})
			),
		{ dispatch: false }
	);

	downloadPeriodCSV$: Observable<void> = createEffect(
		() =>
			this.actions$.pipe(
				ofType(SessionAnalysisStoreActions.downloadPeriodCSV),
				map(({ reportData }) => {
					let headers: HttpHeaders = new HttpHeaders();
					headers = headers.append('Authorization', LoopBackConfig.getAuthPrefix() + this.auth.getAccessTokenId());
					const _url: string =
						LoopBackConfig.getPath() + '/' + LoopBackConfig.getApiVersion() + '/SessionsStats/periodCsv';
					this.httpClient.post(_url, reportData, { headers, responseType: 'blob' }).subscribe(result => {
						const filename = `GPS Data - Period ${moment(reportData.dateFrom).format(
							getMomentFormatFromStorage()
						)} - ${moment(reportData.dateTo).format(getMomentFormatFromStorage())}.csv`;
						const file = new Blob([result], { type: 'text/csv;charset=utf-8' });
						saveAs(file, filename);
					});
				})
			),
		{ dispatch: false }
	);

	constructor(
		private store$: Store<RootStoreState>,
		private actions$: Actions,
		private currentTeamService: CurrentTeamService,
		private teamSeasonApi: TeamSeasonApi,
		private service: SessionAnalysisService,
		private eventApi: EventApi,
		private permissionsService: PermissionsService,
		private alertService: AlertService,
		private toServer: ToServerEquivalentService,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private sessionsStats: SessionsStatsApi,
		private reportService: SessionAnalysisReportService,
		private router: Router,
		private auth: LoopBackAuth,
		private httpClient: HttpClient
	) {}
}

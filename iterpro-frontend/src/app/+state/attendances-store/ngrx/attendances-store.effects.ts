import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSelectors } from '@iterpro/shared/data-access/auth';
import { Event, EventApi, Injury, Player, TeamSeason, TeamSeasonApi } from '@iterpro/shared/data-access/sdk';
import {
	CompetitionsConstantsService,
	ErrorService,
	EventsService,
	ReportService,
	RobustnessService,
	ToLocalEquivalentService,
	clearAndCopyCircularJSON,
	getMomentFormatFromStorage,
	isNotArchived
} from '@iterpro/shared/utils/common-utils';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { saveAs } from 'file-saver';
import { flatten, sortBy, uniq } from 'lodash';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { SelectItem } from 'primeng/api';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, filter, first, map, switchMap, withLatestFrom } from 'rxjs/operators';
import AttendancesManager from '../../../manager/attendances/utils/attendance';
import { getCurrentYear } from '../../../manager/attendances/utils/date';
import { RootStoreState } from '../../root-store.state';
import { SeasonStoreSelectors } from '../../season-store';
import { Counter, Legend, PlayerRole, ViewType } from '../interfaces/attendances-store.interfaces';
import { AttendancesStoreService } from '../services/attendances-store.service';
import { getCompetitionId } from '../utils/utils';
import * as AttendancesStoreActions from './attendances-store.actions';
import { AttendancesStore } from './attendances-store.model';
import * as AttendancesStoreSelectors from './attendances-store.selectors';

@Injectable()
export class AttendancesStoreEffects {
	componentInitializedEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AttendancesStoreActions.componentInitialized),
			withLatestFrom(this.store$.select(SeasonStoreSelectors.selectDefault)),
			map(([, season]) => {
				const day =
					!!season && !moment().isBetween(season.offseason, season.inseasonEnd) ? season.inseasonEnd : new Date();
				const year = moment(day).get('year');
				const month = moment(day).get('month') + 1;
				return AttendancesStoreActions.timeRangeDefined({ year, month });
			})
		)
	);

	viewChangedToActivityLogEffect: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AttendancesStoreActions.viewChanged),
			filter(({ view }) => view === ViewType.ACTIVITY_LOG),
			map(() => AttendancesStoreActions.activityLogViewTypeShowed())
		)
	);

	timeRangeDefinedEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(
				AttendancesStoreActions.timeRangeDefined,
				AttendancesStoreActions.monthChanged,
				AttendancesStoreActions.sessionTypeChanged,
				AttendancesStoreActions.datePeriodChanged,
				AttendancesStoreActions.activityLogViewTypeShowed
			),
			withLatestFrom(
				this.store$.select(AttendancesStoreSelectors.selectCurrentTeamSeason),
				this.store$.select(AttendancesStoreSelectors.selectFrom)
			),
			switchMap(([, season, from]) => {
				if (season) {
					return forkJoin([
						this.teamSeasonApi.getPlayers(season.id, {
							fields: ['id', '_id', 'displayName', 'archived', 'archivedDate']
						}),
						this.teamSeasonApi.getGroups(season.id, { fields: ['id', '_id', 'name', 'playerIds'] })
					]).pipe(
						first(),
						map(([players, groups]: [Player[], PlayerRole[]]) => {
							groups = sortBy(groups, 'name');
							groups.forEach(group => {
								group.displayName = group.name;
							});
							const selectedPlayerRoles: PlayerRole[] = sortBy(
								players.filter(player => isNotArchived(player, { date: from })),
								'displayName'
							);
							const selectablePlayerRoles: PlayerRole[] = [...groups, ...selectedPlayerRoles];

							return AttendancesStoreActions.groupStatsInitializedSuccess({
								selectablePlayerRoles,
								selectedPlayerRoles
							});
						}),
						catchError(error => of(AttendancesStoreActions.groupStatsInitializedFailed({ error })))
					);
				} else
					return of(
						AttendancesStoreActions.groupStatsInitializedFailed({
							error: 'No seasons found during this period of time'
						})
					);
			})
		)
	);

	groupStatsInitializedSuccessEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AttendancesStoreActions.primaryTeamStatsLoadedSuccess),
			withLatestFrom(
				this.store$.select(AttendancesStoreSelectors.selectSelectedGroupStats),
				this.store$.select(AuthSelectors.selectTeam),
				this.store$.select(AttendancesStoreSelectors.selectFrom),
				this.store$.select(AttendancesStoreSelectors.selectTo)
			),
			switchMap(([, selectedPlayerRoles, team, from, to]) => {
				const start = moment(from).startOf('day').toDate();
				const end = moment(to).isAfter(moment()) ? moment().endOf('day').toDate() : moment(to).endOf('day').toDate();
				const playerIds = selectedPlayerRoles.map(player => player.id);
				const metricName = this.attendancesStoreService.metricName();
				const { teamSeasons, id: teamId } = team;
				const { id: teamSeasonId } = teamSeasons.find(
					({ offseason, inseasonEnd }) =>
						moment(start).isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]') ||
						moment(end).isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
				);

				return forkJoin([
					this.eventApi.eventsForAttendance(teamId, teamSeasonId, playerIds, start, end, metricName || ' '),
					this.eventsService.findInjuries(playerIds, start, end, [
						'id',
						'_id',
						'playerId',
						'player',
						'endDate',
						'date',
						'statusHistory',
						'type',
						'issue',
						'location',
						'osics',
						'currentStatus'
					])
				]).pipe(
					map(([events, injuries]: [Event[], Injury[]]) => {
						const toClient = new ToLocalEquivalentService();
						events.forEach(x => {
							if (x.format === 'off') {
								x.start = toClient.convert(x.start);
								x.end = toClient.convert(x.end);
							}
						});
						return AttendancesStoreActions.eventsAndInjuriesLoadedSuccess({ events, injuries });
					}),
					catchError(error => of(AttendancesStoreActions.eventsAndInjuriesLoadedFailed({ error })))
				);
			})
		)
	);

	eventsAndInjuriesLoadedSuccessEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AttendancesStoreActions.eventsAndInjuriesLoadedSuccess),
			withLatestFrom(
				this.store$.select(AttendancesStoreSelectors.selectSessionTypeEvents),
				this.store$.select(AttendancesStoreSelectors.selectFrom),
				this.store$.select(AttendancesStoreSelectors.selectTo),
				this.store$.select(AttendancesStoreSelectors.selectSelectedGroupStats)
			),
			map(([{ injuries }, events, from, to, selectedPlayerRoles]) => {
				const startDate = from ? moment(from) : moment(to).startOf('month');

				const attendancesManager = new AttendancesManager(
					startDate.toDate(),
					to,
					selectedPlayerRoles as Player[],
					this.attendancesStoreService.service
				);

				attendancesManager.addEvents(events);
				attendancesManager.addInjuries(injuries);

				const attendancesStores = attendancesManager.getAttendances();

				return AttendancesStoreActions.loadAttendancesStores({ attendancesStores });
			})
		)
	);

	yearChangedEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AttendancesStoreActions.yearChanged),
			withLatestFrom(
				this.store$.select(AttendancesStoreSelectors.selectMonth),
				this.store$.select(AttendancesStoreSelectors.selectCurrentTeamSeason)
			),
			map(([{ year }, month, season]) => {
				const endSeasonMonth = moment(season.inseasonEnd).get('month') + 1;
				month = year === getCurrentYear() && month > endSeasonMonth ? endSeasonMonth : month;
				return AttendancesStoreActions.monthChanged({ month });
			})
		)
	);

	cellEnteredEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AttendancesStoreActions.cellEntered),
			withLatestFrom(
				this.store$.select(AttendancesStoreSelectors.selectYear),
				this.store$.select(AttendancesStoreSelectors.selectMonth)
			),
			map(([{ day, playerName, dayNum }, year, month]) => {
				let tooltip = '';

				// Appending 0 to day and month if it is in one digit.
				const dt = moment()
					.set({ year, month: month - 1, date: dayNum })
					.format(getMomentFormatFromStorage());

				tooltip = '<h4>' + dt + ' - ' + playerName + '</h4>';

				// 1) injury|complaint|illness
				const filteredInjury = day.items.filter(item => item.type === 'injury');

				filteredInjury.forEach(inj => {
					tooltip += `• ${this.translate.instant(inj.attendance.issue)}: ${this.translate.instant(
						inj.attendance.location
					)}${inj.attendance.osics ? ` - ${inj.attendance.osics}` : ''} - ${inj.tooltip}`;
				});

				// 2) Event: Game/Training/Gym/Off/Friendly Game/Internatioanal Duty etc
				const filteredEvent = day.items.filter(item => item.type !== 'injury');
				filteredEvent.forEach(event => {
					tooltip += '\n• ' + event.tooltip;
				});

				return AttendancesStoreActions.tooltipRendered({ tooltip });
			})
		)
	);

	errorEffect$: Observable<void> = createEffect(
		() =>
			this.actions$.pipe(
				ofType(
					AttendancesStoreActions.groupStatsInitializedFailed,
					AttendancesStoreActions.eventsAndInjuriesLoadedFailed,
					AttendancesStoreActions.primaryTeamStatsLoadedFailed
				),
				map(({ error }) => {
					this.errorService.handleError(error);
				})
			),
		{ dispatch: false }
	);

	activityLogPdfReportRequestedEffect$: Observable<void> = createEffect(
		() =>
			this.actions$.pipe(
				ofType(AttendancesStoreActions.activityLogPdfReportRequested),
				withLatestFrom(
					this.store$.select(AttendancesStoreSelectors.selectMonth),
					this.store$.select(AttendancesStoreSelectors.selectMonthList(this.translate)),
					this.store$.select(AttendancesStoreSelectors.selectLegend).pipe(
						map(legend =>
							legend.map(l => ({
								label: l.label ? this.translate.instant(l.label) : '',
								attrs: l.attrs
							}))
						)
					),
					this.store$.select(AttendancesStoreSelectors.selectAllAttendances),
					this.store$.select(AttendancesStoreSelectors.selectYear),
					this.store$.select(AttendancesStoreSelectors.selectEventCounter)
				),
				map(
					([, selectedMonth, monthList, legend, attendances, year, counter]: [
						any,
						number,
						SelectItem[],
						Legend[],
						AttendancesStore[],
						number,
						Counter
					]) => {
						const month = monthList.find(item => item.value === selectedMonth);
						const data = {
							title: this.translate.instant('attendances'),
							legend,
							attendances: attendances.map(({ days, player }) => ({
								player: player.displayName,
								days: days.map((day, index) => ({
									color: day.current.color,
									text: day.current.text,
									day: index + 1
								}))
							})),
							date: {
								label: this.translate.instant('sidebar.monthYear'),
								value: `${month ? month.label : '-'} ${year}`
							},
							counters: [
								{
									label: this.translate.instant('sidebar.sessionCounter'),
									value: counter.sessions
								},
								{
									label: this.translate.instant('sidebar.trainingCounter'),
									value: counter.trainings
								},
								{
									label: this.translate.instant('sidebar.gamesCounter'),
									value: counter.games
								}
							]
						};
						this.reportService.getReport('attendance_activity', data);
					}
				)
			),
		{ dispatch: false }
	);

	activityLogCsvReportRequestedEffect$: Observable<void> = createEffect(
		() =>
			this.actions$.pipe(
				ofType(AttendancesStoreActions.activityLogCsvReportRequested),
				withLatestFrom(
					this.store$.select(AttendancesStoreSelectors.selectMonth),
					this.store$.select(AttendancesStoreSelectors.selectYear),
					this.store$.select(AttendancesStoreSelectors.selectAllAttendances),
					this.store$.select(AuthSelectors.selectIsNationalClub)
				),
				map(([, month, year, attendances, isNationalClub]: [any, number, number, AttendancesStore[], boolean]) => {
					const details = []; // final array of data to parse

					// Looping through all the attendances for all the players
					attendances.forEach(att => {
						// Looping through all the days attendance data for player
						att.days.forEach((day, index) => {
							const singleObj = {}; // temp object

							let gymSession = 0; // gym session minutes
							let trainingSession = 0; // training session minutes

							singleObj['Player Name'] = att.player.displayName;

							// Each square of attendance table represents one day for corresponding player. This is that day's date in format dd/mm/yyyy
							singleObj['Date'] = moment()
								.set({ year, month: month - 1, date: index + 1 })
								.format(getMomentFormatFromStorage());

							// default values for all column fields
							singleObj['Training'] = false;
							singleObj['Modified'] = false;
							singleObj['Double Session'] = false;
							singleObj['Gym'] = false;
							singleObj['Game'] = false;
							singleObj['Friendly'] = false;
							isNationalClub ? (singleObj['Club Game'] = false) : (singleObj['International Duty'] = false);
							singleObj['Off'] = false;
							singleObj['Injured T'] = false;
							singleObj['Injured Rehab'] = false;
							singleObj['Injured Rec'] = false;
							singleObj['Return To Play'] = false;

							// sessions are two types : gym and training. Total session minutes will be calculated from both.
							singleObj['Session Minutes'] = gymSession + trainingSession;

							// Game is an event.
							singleObj['Game Minutes'] = 0;

							// Looping each day's items array list
							// legend can be training/gym/game/international etc. Check attrs.ts for more details of legend.
							day.items.forEach(item => {
								if (item.legend === 'training') {
									singleObj['Training'] = true;
									if (item.attendance) {
										trainingSession = item.attendance.duration;
									}
								}
								if (item.legend === 'sessionstraining') {
									singleObj['Training'] = true;
									if (item.attendance) {
										item.attendance.forEach(attan => {
											trainingSession = trainingSession + attan.duration;
										});
									}
								}

								if (item.text && item.text === '∗') {
									// Using '∗' star  instead of '*'
									singleObj['Modified'] = true;
								}

								if (item.text && item.text === '∗∗') {
									// Using '∗' star  instead of '*'
									singleObj['Double Session'] = true;
								}

								if (item.legend === 'gym') {
									singleObj['Gym'] = true;
									if (item.attendance) {
										item.attendance.forEach(attan => {
											gymSession = gymSession + attan.duration;
										});
									}
								}

								// Calculating the minutes for sessions (Game and training)
								singleObj['Session Minutes'] = gymSession + trainingSession;

								if (item.legend === 'game') {
									singleObj['Game'] = true;
									singleObj['Game Minutes'] = item.minutes;
								}

								// Friendly games
								if (item.legend === 'friendly') {
									singleObj['Friendly'] = true;
								}

								if (isNationalClub) {
									if (item.legend === 'clubGame') {
										singleObj['Club Game'] = true;
									}
								} else {
									if (item.legend === 'international') {
										singleObj['International Duty'] = true;
									}
								}

								if (item.legend === 'off') {
									singleObj['Off'] = true;
								}

								if (item.legend === 'therapy') {
									singleObj['Injured T'] = true;
								}

								if (item.legend === 'rehab') {
									singleObj['Injured Rehab'] = true;
								}

								if (item.legend === 'reconditioning') {
									singleObj['Injured Rec'] = true;
								}

								if (item.legend === 'returnToPlay') {
									singleObj['Return To Play'] = true;
								}
							});
							details.push(singleObj);
						});
					});
					const results = Papa.unparse(details, {});
					const fileName = 'Attendance_' + moment.monthsShort(month - 1) + year + '.csv';

					const contentDispositionHeader: string = 'Content-Disposition: attachment; filename=' + fileName;
					const blob = new Blob([results], { type: 'text/plain' });
					saveAs(blob, fileName);
				})
			),
		{ dispatch: false }
	);

	viewChangedToStatisitcsEffect: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AttendancesStoreActions.viewChanged),
			filter(({ view }) => view === ViewType.STATISTICS),
			map(() => AttendancesStoreActions.statisticsViewTypeShowed())
		)
	);

	// statistics effects
	datePeriodChangedEffect: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(AttendancesStoreActions.groupStatsInitializedSuccess),
			withLatestFrom(
				this.store$.select(AttendancesStoreSelectors.selectCurrentTeamSeason),
				this.store$.select(AttendancesStoreSelectors.selectFrom),
				this.store$.select(AttendancesStoreSelectors.selectTo),
				this.store$.select(AttendancesStoreSelectors.selectSessionType)
			),
			switchMap(([{ selectedPlayerRoles }, season, from, to, sessionType]) =>
				this.robustnessService
					.profileRobustness(
						'',
						selectedPlayerRoles.map(x => (!x.playerIds ? x.id : x)) as string[],
						moment(from).startOf('day').toDate(),
						moment(to).endOf('day').toDate(),
						this.attendancesStoreService.metricName(),
						sessionType,
						season.teamId
					)
					.pipe(
						catchError(error => of(AttendancesStoreActions.primaryTeamStatsLoadedFailed({ error }))),
						map(robustness =>
							AttendancesStoreActions.primaryTeamStatsLoadedSuccess({
								primaryTeamStats: robustness
							})
						)
					)
			)
		)
	);

	statisticsPdfReportRequestedEffect$: Observable<void> = createEffect(
		() =>
			this.actions$.pipe(
				ofType(AttendancesStoreActions.statisticsPdfReportRequested),
				withLatestFrom(
					this.store$.select(AttendancesStoreSelectors.selectFrom),
					this.store$.select(AttendancesStoreSelectors.selectTo),
					this.store$.select(AttendancesStoreSelectors.selectEventCounter),
					this.store$.select(AttendancesStoreSelectors.selectAttendanceStats),
					this.store$.select(AttendancesStoreSelectors.selectAttendanceStatsOptions),
					this.store$.select(AttendancesStoreSelectors.selectMetric),
					this.store$.select(AttendancesStoreSelectors.selectSelectedGroupStats)
				),
				map(
					([, from, to, counter, attendancesStats, options, metric, players]: [
						Action,
						Date,
						Date,
						Counter,
						ChartData,
						ChartOptions,
						string,
						PlayerRole[]
					]) => {
						attendancesStats = {
							...attendancesStats,
							datasets: attendancesStats.datasets.map(dataset => {
								const competition = this.competitionService.getCompetitionFromJson(Number(dataset.label));
								return {
									...dataset,
									label: dataset.label ? (competition ? competition.name : this.translate.instant(dataset.label)) : null
								};
							})
						};
						const report = {
							from: moment(from).format(`dddd ${getMomentFormatFromStorage()}`),
							to: moment(to).format(`dddd ${getMomentFormatFromStorage()}`),
							days: counter.days,
							sessions: counter.games + counter.trainings,
							trainings: counter.trainings,
							games: counter.games,
							data: clearAndCopyCircularJSON(attendancesStats),
							options,
							metrics: this.translate.instant(metric),
							players: players.map(player => player.displayName)
						};
						this.reportService.getReport('attendance_statistics', report);
					}
				)
			),
		{ dispatch: false }
	);

	statisticsCsvReportRequestedEffect$: Observable<void> = createEffect(
		() =>
			this.actions$.pipe(
				ofType(AttendancesStoreActions.statisticsCsvReportRequested),
				withLatestFrom(
					this.store$.select(AttendancesStoreSelectors.selectFrom),
					this.store$.select(AttendancesStoreSelectors.selectTo),
					this.store$.select(AttendancesStoreSelectors.selectIsSecondaryTeam),
					this.store$.select(AttendancesStoreSelectors.selectSelectedGroupStats),
					this.store$.select(AttendancesStoreSelectors.selectMetricLabels),
					this.store$.select(AttendancesStoreSelectors.selectRawStats),
					this.store$.select(AttendancesStoreSelectors.selectTeamSeasons)
				),
				map(
					([, from, to, isSecondaryTeam, players, metricLabels, rawStats, seasons]: [
						Action,
						Date,
						Date,
						boolean,
						PlayerRole[],
						string[],
						Map<string, any>,
						TeamSeason[]
					]) => {
						const stats = [];
						const datasetData = [];
						// eslint-disable-next-line guard-for-in
						for (const key in rawStats) {
							datasetData.push(rawStats[key]);
						}
						const labels = (
							uniq(flatten(datasetData.map(({ minutesPlayedBySubFormat }) => Object.keys(minutesPlayedBySubFormat)))) ||
							[]
						).sort();
						metricLabels = labels.map(x => getCompetitionId(x, metricLabels, seasons));
						// TODO: At the moment secondary teams have less stats to show, check with/after wyscout integration if integration is needed

						// All the players without any groups included
						const values = players.filter((x: PlayerRole) => !x.players || !this.isGroup(x.players));

						// 1) Metrics : "Apps" = > nationalCup/internationalCup/nationaleague/friendly
						const datasetApps = [[]];

						const appsSubformatMap = {};

						if (labels.length > 0) {
							labels.forEach((x, index) => {
								appsSubformatMap[x] = index;
								datasetApps[index] = [];
							});
							datasetData.forEach(x => {
								labels.forEach(val => {
									const indexArr = appsSubformatMap[val];
									datasetApps[indexArr].push(val in x.appsBySubFormat ? x.appsBySubFormat[val] : 0);
								});
							});
						}

						// 2) Metrics: "Starting Apps" => Starting Apps/Substituting App
						const datasetStartingApps = [[], []];
						datasetData.forEach(x => {
							datasetStartingApps[0].push(x.startingApps);
							datasetStartingApps[1].push(x.substitutingApps);
						});

						// 3) Metrics: "Availablity (%)" => Total Availability(%)/Game Availability(%)/Training Availability(%)
						const datasetAvailablity = [[], [], []];
						datasetData.forEach(x => {
							datasetAvailablity[0].push(x.availability);
							datasetAvailablity[1].push(x.gameAvailability);
							datasetAvailablity[2].push(x.trainingAvailability);
						});

						// 4) Metrics: "Game Rate" => Game rate
						const datasetGameRate = [[]];
						datasetData.forEach(x => datasetGameRate[0].push(x.gameRate));

						// 5) Metrics : "No. of minutes player"
						const datasetMinutesPlayed: number[][] = [[]];

						const minutesPlayedSubformatMap = {};
						if (labels.length > 0) {
							labels.forEach((x, index) => {
								minutesPlayedSubformatMap[x] = index;
								datasetMinutesPlayed[index] = [];
							});
							datasetData.forEach(x => {
								labels.forEach(val => {
									const indexArr = minutesPlayedSubformatMap[val];
									datasetMinutesPlayed[indexArr].push(
										val in x.minutesPlayedBySubFormat ? x.minutesPlayedBySubFormat[val] : 0
									);
								});
							});
						}

						// 6) Metrics: "Playing Time"
						const datasetPlayingTime = [[]];
						datasetData.forEach(x => datasetPlayingTime[0].push(x.playingTime));

						// 7) Metrics: "Productivity(%)"
						const datasetProductivity = [[]];
						datasetData.forEach(x => datasetProductivity[0].push(x.performanceReliability));

						// 8) Metrics: "No of injuries by location"
						const datasetPeriodBreakdown = [[], [], [], [], [], [], [], [], [], []];
						if (!isSecondaryTeam) {
							for (const val of datasetData) {
								datasetPeriodBreakdown[0].push('general' in val.periodBreakDown ? val.periodBreakDown['general'] : 0);
								datasetPeriodBreakdown[1].push('travel' in val.periodBreakDown ? val.periodBreakDown['travel'] : 0);
								datasetPeriodBreakdown[2].push('training' in val.periodBreakDown ? val.periodBreakDown['training'] : 0);
								datasetPeriodBreakdown[3].push('game' in val.periodBreakDown ? val.periodBreakDown['game'] : 0);
								datasetPeriodBreakdown[4].push('friendly' in val.periodBreakDown ? val.periodBreakDown['friendly'] : 0);
								datasetPeriodBreakdown[5].push('gym' in val.periodBreakDown ? val.periodBreakDown['gym'] : 0);
								datasetPeriodBreakdown[6].push(
									'administration' in val.periodBreakDown ? val.periodBreakDown['administration'] : 0
								);
								datasetPeriodBreakdown[7].push('medical' in val.periodBreakDown ? val.periodBreakDown['medical'] : 0);
								datasetPeriodBreakdown[8].push('off' in val.periodBreakDown ? val.periodBreakDown['off'] : 0);
								datasetPeriodBreakdown[9].push(
									'international' in val.periodBreakDown ? val.periodBreakDown['international'] : 0
								);
							}
						}

						// 9) Metrics: "Robustness(%)"
						const datasetRobustness = [[]];
						datasetData.forEach(x => datasetRobustness[0].push(x.robustness));

						// 10) Metrics: "Days Missed Through Injury"
						const datasetDaysMissedInjury = [[], []];
						datasetData.forEach(x => {
							datasetDaysMissedInjury[0].push(x.gamesMissedInjuries);
							datasetDaysMissedInjury[1].push(x.trainingsMissedInjuries);
						});

						// 11) Metrics: "Days Missed Through International’s Duties"
						const datasetDaysMissedIternational = [[], []];
						datasetData.forEach(x => {
							datasetDaysMissedIternational[0].push(x.gamesMissedInternational);
							datasetDaysMissedIternational[1].push(x.trainingsMissedInternational);
						});

						// 12) Metrics: "Days missed through other reasons"
						const datasetDaysMissedOther = [[], []];
						datasetData.forEach(x => {
							datasetDaysMissedOther[0].push(x.gamesMissedOthers);
							datasetDaysMissedOther[1].push(x.trainingsMissedOthers);
						});

						// 13) Metrics: "Days per game"
						const datasetDaysPerGame = [[]];
						datasetData.forEach(x => datasetDaysPerGame[0].push(x.daysPerGame));

						// Looping through each player record.
						values.forEach((player, index) => {
							const singleObj = {}; // temp object

							singleObj['Player Name'] = player['displayName'];

							// Metrics (Fixed labels): "Apps"
							datasetApps.forEach((data, i) => {
								singleObj[`Apps - ${this.getCompetition(Object.keys(appsSubformatMap)[i])}`] = data[index] || 0;
							});
							singleObj[`Apps - Friendly`] = datasetApps.length > 3 ? datasetApps[3][index] : 0;

							// Metrics (Fixed labels): "Starting Apps"
							singleObj['Starting Apps'] = datasetStartingApps[0][index];
							singleObj['Substituting App'] = datasetStartingApps[1][index];

							// Metrics (Fixed labels): "Days per stage"
							singleObj['Total Availability(%)'] = datasetAvailablity[0][index]
								? datasetAvailablity[0][index].toFixed(1)
								: datasetAvailablity[0][index];
							singleObj['Game Availability(%)'] = datasetAvailablity[1][index]
								? datasetAvailablity[1][index].toFixed(1)
								: datasetAvailablity[1][index];
							singleObj['Training Availability(%)'] = datasetAvailablity[2][index]
								? datasetAvailablity[2][index].toFixed(1)
								: datasetAvailablity[2][index];

							// Metrics (Fixed labels): "Game rate"
							singleObj['Game Rate'] = datasetGameRate[0][index]
								? datasetGameRate[0][index].toFixed(1)
								: datasetGameRate[0][index];

							// Metrics (Fixed labels): "Minutes Played"
							datasetMinutesPlayed.forEach((data, i) => {
								singleObj[`Minutes Played - ${this.getCompetition(Object.keys(appsSubformatMap)[i])}`] =
									data[index] || 0;
							});
							singleObj[`Minutes Played - Friendly`] = datasetApps.length > 3 ? datasetApps[3][index] : 0;

							// Metrics (Fixed labels): "Playing Time(%)"
							singleObj['Playing Time(%)'] = datasetPlayingTime[0][index]
								? datasetPlayingTime[0][index].toFixed(1)
								: datasetPlayingTime[0][index];

							// Metrics (Fixed labels): "productivity (%)"
							singleObj['Productivity (%)'] = datasetProductivity[0][index]
								? datasetProductivity[0][index].toFixed(1)
								: datasetProductivity[0][index];

							// Metrics (fixed labels): "Period Breakdown"
							if (!isSecondaryTeam) {
								singleObj['Period Breakdown - General'] = datasetPeriodBreakdown[0][index];
								singleObj['Period Breakdown - Travel'] = datasetPeriodBreakdown[1][index];
								singleObj['Period Breakdown - Training'] = datasetPeriodBreakdown[2][index];
								singleObj['Period Breakdown - Game'] = datasetPeriodBreakdown[3][index];
								singleObj['Period Breakdown - Friendly'] = datasetPeriodBreakdown[4][index];
								singleObj['Period Breakdown - Gym'] = datasetPeriodBreakdown[5][index];
								singleObj['Period Breakdown - Administration'] = datasetPeriodBreakdown[6][index];
								singleObj['Period Breakdown - Medical'] = datasetPeriodBreakdown[7][index];
								singleObj['Period Breakdown - Off'] = datasetPeriodBreakdown[8][index];
								singleObj['Period Breakdown - International'] = datasetPeriodBreakdown[9][index];
							}

							// Metrics (Fixed labels): "Robustness (%)"
							singleObj['Robustness(%)'] = datasetRobustness[0][index]
								? datasetRobustness[0][index].toFixed(1)
								: datasetRobustness[0][index];

							// Metrics (Fixed labels): "Days missed through injury"
							singleObj['Games Missed Through Injury'] = datasetDaysMissedInjury[0][index];
							singleObj['Trainings Missed Through Injury'] = datasetDaysMissedInjury[1][index];

							// Metrics (Fixed labels): "Days missed international’s duties"
							singleObj['Games Missed Through International Duties'] = datasetDaysMissedIternational[0][index];
							singleObj['Trainings Missed Through Injury'] = datasetDaysMissedIternational[1][index];

							// Metrics (Fixed labels): "Days missed for others reasons"
							singleObj['Games missed for other reasons'] = datasetDaysMissedOther[0][index];
							singleObj['Training missed for other reasons'] = datasetDaysMissedOther[1][index];

							// Metrics (Fixed labels): "Days per game"
							singleObj['Days per game'] = datasetDaysPerGame[0][index]
								? datasetDaysPerGame[0][index].toFixed(1)
								: datasetDaysPerGame[0][index];

							stats.push(singleObj); // Adding to final array of objects
						});

						const results = Papa.unparse(stats, {});
						const fileName =
							'AttendanceStats_' + moment(from).format('DD-MM-YYYY') + '_' + moment(to).format('DD-MM-YYYY') + '.csv';

						const contentDispositionHeader: string = 'Content-Disposition: attachment; filename=' + fileName;
						const blob = new Blob([results], { type: 'text/plain' });
						saveAs(blob, fileName);
					}
				)
			),
		{ dispatch: false }
	);

	goToCalendarDayView$: Observable<void> = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(AttendancesStoreActions.dayHeaderClicked),
				withLatestFrom(
					this.store$.select(AttendancesStoreSelectors.selectMonth),
					this.store$.select(AttendancesStoreSelectors.selectYear)
				),
				map(([{ day }, month, year]) => {
					if (day && year && month) {
						const date = new Date(year, month - 1, day);
						this.router.navigate(['/manager/planning', { dayViewDate: date }]);
					}
				})
			);
		},
		{ dispatch: false }
	);

	constructor(
		private actions$: Actions,
		private store$: Store<RootStoreState>,
		private attendancesStoreService: AttendancesStoreService,
		private teamSeasonApi: TeamSeasonApi,
		private eventApi: EventApi,
		private eventsService: EventsService,
		private translate: TranslateService,
		private reportService: ReportService,
		private errorService: ErrorService,
		private robustnessService: RobustnessService,
		private competitionService: CompetitionsConstantsService,
		private router: Router
	) {}
	private isGroup(players: PlayerRole[] | any) {
		return players && Array.isArray(players);
	}

	private getCompetition(comp: string | number): string | null {
		if (comp) {
			const wyComp = this.competitionService.getCompetitionFromJson(comp);
			if (wyComp && wyComp.name) return wyComp.name;
			else return this.translate.instant(comp as string);
		}

		return null;
	}
}

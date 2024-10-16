import { Component, OnDestroy, OnInit } from '@angular/core';
import { environment } from '@iterpro/config';
import {
	Event,
	EventApi,
	LoopBackAuth,
	Match,
	Player,
	PlayerStat,
	ResultWithQueueMessage,
	SessionImportData,
	SessionPlayerData,
	Team,
	TeamApi
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	CalendarService,
	ErrorService,
	handleQueuePlayerRecalculationAlerts,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { ConfirmationService, LazyLoadEvent } from 'primeng/api';
import { Observable, forkJoin } from 'rxjs';

@UntilDestroy()
@Component({
	selector: 'iterpro-import-dashboard',
	templateUrl: './import-dashboard.component.html',
	styleUrls: ['./import-dashboard.component.css']
})
export class ImportDashboardComponent implements OnInit, OnDestroy {
	players: Player[];
	matchLength = null;
	sessionLength = null;
	modify: any;

	currentTeamId: string;
	currentEvent: Event;
	currentTeam: Team;
	sessions: Event[];
	filteredSession: SessionPlayerData[];
	matches: Match[];
	statsTeam = [];
	statsPlayers = [];
	display: boolean;
	confirmationFlag: number;
	sessIGPSToDelete: SessionImportData;
	sessPGPSToDelete: SessionPlayerData;
	currentMatchToDelete: Match;
	playerStatToDelete: PlayerStat;
	selectedSessions = [];
	computingMetricsAll = false;
	computingWorkloadAll = false;
	deleteFlag: boolean;
	deleteFlagAll: boolean;
	lazyMatch: LazyLoadEvent;
	lazyEvent: LazyLoadEvent;

	constructor(
		private error: ErrorService,
		private confirmationService: ConfirmationService,
		private eventApi: EventApi,
		private teamApi: TeamApi,
		private authService: LoopBackAuth,
		private notificationService: AlertService,
		private calendar: CalendarService,
		private translate: TranslateService
	) {}

	ngOnDestroy() {}

	ngOnInit() {
		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(untilDestroyed(this))
			.subscribe(val => {
				const todayServer = moment().endOf('day').toDate().toJSON();
				const teamId = this.authService.getCurrentUserData().currentTeamId;
				const countSession$ = this.teamApi.countEvents(teamId, {
					format: { in: ['training', 'game', 'friendly'] },
					start: { lte: todayServer }
				});
				const countMatch$ = this.teamApi.countMatch(teamId, {
					date: { lte: todayServer }
				});
				const team$ = this.teamApi.findById(teamId, {
					include: {
						relation: 'players',
						scope: {
							fields: ['id', 'displayName']
						}
					}
				}) as Observable<Team>;

				forkJoin([countSession$, countMatch$, team$])
					.pipe(untilDestroyed(this))
					.subscribe({
						next: ([sessionCount, matchCount, team]) => {
							this.sessionLength = sessionCount.count;
							this.matchLength = matchCount.count;
							this.currentTeam = team;
							this.players = team.players;
						},
						error: (error: Error) => this.error.handleError(error)
					});
			});
	}

	loadLazySession(e: LazyLoadEvent) {
		this.lazyEvent = e;

		const todayServer = moment().endOf('day').toDate().toJSON();
		this.eventApi
			.find({
				where: {
					teamId: this.authService.getCurrentUserData().currentTeamId,
					format: { in: ['training', 'game', 'friendly'] },
					start: { lte: todayServer }
				},
				order: 'start DESC',
				skip: this.lazyEvent.first,
				limit: this.lazyEvent.rows
			})
			.pipe(untilDestroyed(this))
			.subscribe(
				(results: Event[]) => {
					results.forEach(event => {
						event['computingWorkload'] = false;
						event['computingMetrics'] = false;
						const isUtc = !event.csvGps && this.isUtc(event.lastUpdateDate);
						if (event.lastUpdateDate) {
							event.lastUpdateDate = moment(event.lastUpdateDate).utc(isUtc).toDate();
						}
						event.start = moment(event.start).toDate(); // removed .utc() for IT-6316
					});
					this.sessions = [];
					[...this.sessions] = [...results];
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	private isUtc(date: Date): boolean {
		return !!date && moment(date).isAfter(moment('10/18/2019 18:00', 'MM/DD/YYYY HH:mm'));
	}

	getTooltipForSessionImport(session) {
		return !session.event?.gpsSessionLoaded ? this.translate.instant('import.sessionEvent') : '';
	}

	loadLazyMatch(e: LazyLoadEvent) {
		this.lazyMatch = e;
		const todayServer = moment().endOf('day').toDate().toJSON();

		this.eventApi
			.find({
				order: 'start DESC',
				where: {
					teamId: this.authService.getCurrentUserData().currentTeamId,
					format: { in: ['game', 'friendly'] },
					start: { lte: todayServer }
				},
				include: {
					relation: 'match',
					fields: ['id', 'date', 'result']
				},
				fields: ['id', 'playerIds', 'match'],
				skip: this.lazyMatch.first,
				limit: this.lazyMatch.rows
			})
			.pipe(untilDestroyed(this))
			.subscribe(
				(results: any[]) => {
					results = results.filter(({ match }) => !!match);

					results.forEach(x => {
						x.match.playerIds = x.playerIds.map(id => this.players.find(player => player.id === id));
						x.match.playerIds = sortByName(x.match.playerIds, 'displayName');
					});
					this.matches = [];
					[...this.matches] = [...results.map(({ match }) => match)];
					for (const mat of results) {
						const matchSingle = { ...mat.match };
						delete matchSingle._teamStat;
						delete matchSingle._playerStats;
						if (mat.match._teamStat) {
							mat.match._teamStat.match = matchSingle;
							this.statsTeam.push(mat.match._teamStat);
						}
						if (mat.match._playerStats?.length > 0) {
							for (const plStat of mat.match._playerStats) {
								plStat.match = mat.match;
								this.statsPlayers.push(matchSingle);
							}
						}
					}
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	filterSessions(row) {
		this.currentEvent = row.data;
		this.filteredSession = row.data._sessionPlayers.filter(({ mainSession }) => mainSession);
	}

	modifySessionDirty(e: any, sessP: SessionPlayerData) {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.edit'),
			header: 'Modify Confirmation',
			icon: 'fa fa-trash',
			accept: () => this.onModifySessionPlayer(this.currentEvent, sessP),
			reject: () => (sessP.dirty = !sessP.dirty)
		});
	}

	private onModifySessionPlayer(eventSession: Event, sessionPlayer: SessionPlayerData) {
		this.eventApi
			.setSessionPlayerDirtyStatus(eventSession.id, sessionPlayer.id, sessionPlayer.dirty)
			.pipe(untilDestroyed(this))
			.subscribe(
				(results: any) => {
					this.modify = { ...results.dirty };
					this.notificationService.notify('success', 'import.imported', 'alert.recordUpdated', false);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	getGD(date: Date) {
		return this.calendar.getGD(date);
	}

	getPlayersNumberForSession(event) {
		return event.playerIds.length;
	}

	getMatchName(match: Event): string {
		return match.home === true
			? `${this.currentTeam.name.toUpperCase()} - ${match.opponent}`
			: `${match.opponent} - ${this.currentTeam.name.toUpperCase()}`;
	}

	getPlayerStat(match, player) {
		return (match._playerStats || []).find(({ playerId }) => playerId === player.id) ? 'fa-check' : '';
	}

	getLink(event) {
		const params = {
			id: event.id,
			start: event.start
		};
		return ['/manager/planning', params];
	}

	openDialogMetrics(event) {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.computeMetrics'),
			header: 'Metrics',
			icon: 'fa fa-rotate',
			accept: () => this.computeMetrics(event)
		});
	}

	openDialogDelete(event) {
		this.deleteFlag = event;
	}

	openDialogMetricsAll() {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.computeMetricsAll'),
			header: 'Metrics',
			icon: 'fa fa-rotate',
			accept: () => this.computeMetricsAll()
		});
	}

	openDialogDeleteAll() {
		this.deleteFlagAll = true;
	}

	computeMetrics(event) {
		event.computeMetrics = true;
		this.eventApi
			.recalculateDefaultMetrics([event.id])
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (results: ResultWithQueueMessage[]) => {
					if (!environment.production) {
						for (const result of results) {
							handleQueuePlayerRecalculationAlerts(this.players, result, this.notificationService);
						}
					}
				},
				error: (error: Error) => this.error.handleError(error),
				complete: () => (event.computingMetrics = false)
			});
	}

	delete(events: Event[], deleteEvents: boolean) {
		const obs$ = deleteEvents
			? events.map(({ id }) => this.eventApi.deleteEvent(id))
			: this.eventApi.resetGPSDataForEvents(events.map(({ id }) => id));
		forkJoin(obs$)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: () => {
					this.loadLazySession(this.lazyEvent);
					this.discard();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	computeMetricsAll() {
		this.computingMetricsAll = true;
		this.eventApi
			.recalculateDefaultMetrics(this.selectedSessions.map(x => x.id))
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (results: ResultWithQueueMessage[]) => {
					this.selectedSessions = [];
					if (!environment.production) {
						for (const result of results) {
							handleQueuePlayerRecalculationAlerts(this.players, result, this.notificationService);
						}
					}
				},
				error: (error: Error) => this.error.handleError(error),
				complete: () => (this.computingMetricsAll = false)
			});
	}

	discard() {
		this.deleteFlag = null;
		this.deleteFlagAll = null;
		this.selectedSessions = [];
	}
}

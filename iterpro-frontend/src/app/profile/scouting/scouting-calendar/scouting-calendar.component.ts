import {
	Component,
	EventEmitter,
	Injector,
	Input,
	OnChanges,
	OnInit,
	Output,
	ViewChild,
	ViewEncapsulation
} from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, FormatterInput, MoreLinkArg, ViewApi } from '@fullcalendar/core';
import { DateRange } from '@fullcalendar/core/internal';
import deLocale from '@fullcalendar/core/locales/de';
import esLocale from '@fullcalendar/core/locales/es';
import frLocale from '@fullcalendar/core/locales/fr';
import itLocale from '@fullcalendar/core/locales/it';
import jpLocale from '@fullcalendar/core/locales/ja';
import ptLocale from '@fullcalendar/core/locales/pt';
import ruLocale from '@fullcalendar/core/locales/ru';
import trLocale from '@fullcalendar/core/locales/tr';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import momentPlugin from '@fullcalendar/moment';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import timegridPlugin from '@fullcalendar/timegrid';
import { environment } from '@iterpro/config';
import { AuthSelectors, AuthState, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Club,
	Customer,
	LoopBackAuth,
	PlayerScouting,
	ScoutingGame,
	ScoutingGameEssentialCustomer,
	ScoutingGameInit, Team, TeamGender,
	TimelineDailyViewPDF
} from '@iterpro/shared/data-access/sdk';
import {
	BlockUiInterceptorService,
	ErrorService,
	EventToHtmlService,
	ReportService,
	ScoutingGamesService,
	ToServerEquivalentService,
	getId,
	getMomentFormatFromStorage,
	getPDFv2Path,
	sortByDate
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { flatten, uniq } from 'lodash';
import * as moment from 'moment';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { distinctUntilChanged, filter, first, switchMap, take } from 'rxjs/operators';
import Tooltip from 'tooltip.js';
import { CalendarDetailDialogComponent } from '../../../shared/calendar-detail-dailog/calendar-detail-dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import {
	CustomerPreferenceGeneral
} from '../../../settings/settings-user-preferences/components/settings-user-preferences-general/models/user-preferences-general.type';
import { combineLatest } from 'rxjs';

export interface CalendarEventMouseOver {
	element: HTMLElement;
	event: ScoutingGame;
}

export enum ScoutingViewType {
	Calendar = 1,
	GameReports = 2,
	EventDetail = 3
}

@UntilDestroy()
@Component({
	selector: 'iterpro-scouting-calendar',
	templateUrl: './scouting-calendar.component.html',
	styleUrls: ['./scouting-calendar.component.css'],
	encapsulation: ViewEncapsulation.None
})
export class ScoutingCalendarComponent extends EtlBaseInjectable implements OnInit, OnChanges {
	@Input() scoutingGame: ScoutingGameInit;
	@Input() scoutingViewType: ScoutingViewType;
	@Input() players: PlayerScouting[] = [];
	@Input() scoutCustomers: Customer[] = [];
	@Input() tipssMode = false;
	@Input() isSwiss = false;
	@Input() isWatford = false;
	@Output() redirectEmitter: EventEmitter<{ playerId: string; tabIndex: number }> = new EventEmitter<{
		playerId: string;
		tabIndex: number;
	}>();
	@Output() requestPlayers: EventEmitter<void> = new EventEmitter<void>();
	@Output() newScoutingPlayersEmitter: EventEmitter<PlayerScouting[]> = new EventEmitter<PlayerScouting[]>();

	@ViewChild(FullCalendarComponent, { static: false }) scoutingCalendar: FullCalendarComponent;
	@BlockUI('scouting-calendar') blockUI: NgBlockUI;

	readonly calendarPlugins = [
		momentPlugin,
		dayGridPlugin,
		interactionPlugin,
		listPlugin,
		timegridPlugin,
		resourceTimelinePlugin
	];
	readonly header = {
		left: 'prev,next today',
		center: 'title',
		right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth,resourceTimelineDay'
	};
	readonly slotLabelFormat: FormatterInput = {
		hour: 'numeric',
		minute: '2-digit',
		omitZeroMinute: false,
		meridiem: 'short',
		hour12: false
	};

	lastScoutingViewType: ScoutingViewType;
	scoutingViewTypes = ScoutingViewType;
	defaultView = 'dayGridMonth';
	currentView: Pick<ViewApi, 'type' | 'title'> = { type: this.defaultView, title: '' };
	currentDateRange: DateRange;
	games: ScoutingGame[] = [];
	tooltip: Tooltip = null;
	options = {
		scouts: [],
		players: []
	};
	filters = {
		scout: [],
		player: []
	};

	hasScoutingGamePermission = false;
	isScoutingAdmin = false;

	updatedDate: Date = new Date();
	cellInfo: MoreLinkArg;
	additionalInfo: Map<string, ScoutingGame> = new Map<string, ScoutingGame>();

	private mode: 'add' | 'edit';

	// This is a workaround to make "eventLimitClick" work because fullCalendar lose "this" context in the callback
	readonly createOpenCellInfoDialogFn = this.openCellInfoDialog.bind(this);

	calendarOptions: CalendarOptions;
	readonly club$ = this.authStore.select(AuthSelectors.selectClub).pipe(takeUntilDestroyed());
	club: Club;
	readonly #currentTeam$ = this.authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());
	currentTeam: Team;
	currentCustomer: CustomerPreferenceGeneral;
	readonly customer$ = this.authStore.select(AuthSelectors.selectCustomer).pipe(takeUntilDestroyed());
	constructor(
		private authStore: Store<AuthState>,
		private scoutingGameService: ScoutingGamesService,
		private translate: TranslateService,
		private error: ErrorService,
		private eventService: EventToHtmlService,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private confirmationService: ConfirmationService,
		private toServer: ToServerEquivalentService,
		private reportService: ReportService,
		private readonly dialogService: DialogService,
		injector: Injector
	) {
		super(injector);
		this.initTranslations();
	}

	ngOnInit() {
		combineLatest(this.club$, this.#currentTeam$, this.customer$)
			.pipe(
				distinctUntilChanged(),
				filter(([club, currentTeam, customer]: [Club, Team, Customer]) => !!club && !!currentTeam && !!customer)
			)
			.subscribe({
				next: (([club, currentTeam, customer]: [Club, Team, Customer]) => {
					this.club = club;
					this.currentTeam = currentTeam;
					this.currentCustomer = customer;
					moment.locale(this.translate.currentLang);
					this.initCalendarOptions(this.currentCustomer?.currentLanguage);
				}),
				error: (error: Error) => void this.error.handleError(error)
			});


		this.hasScoutingGamePermission = this.scoutingGameService.hasScoutingAdminPermissions('scouting-games');
		this.isScoutingAdmin = this.scoutingGameService.hasScoutingAdminPermissions('scouting-games-report');
	}

	ngOnChanges() {
		this.options.players = this.getSelectablePlayers();
		if (this.scoutingGame) {
			this.updatedDate = this.scoutingGame.game.start;
			this.blockUI.start();
		}
	}

	// region Calendar Options
	private initCalendarOptions(currentLanguage: string) {
		this.calendarOptions = {
			dayMaxEventRows: 4,
			moreLinkClick: this.createOpenCellInfoDialogFn,
			plugins: this.calendarPlugins,
			aspectRatio: 2.3,
			height: 'auto',
			initialDate: this.updatedDate,
			initialView: this.defaultView,
			eventTimeFormat: 'H:mm',
			allDaySlot: true,
			editable: false,
			headerToolbar: this.header,
			slotLabelFormat: this.slotLabelFormat,
			slotEventOverlap: false,
			eventOverlap: false,
			nowIndicator: true,
			timeZone: 'local',
			eventDisplay: 'block',
			locales: [esLocale, frLocale, deLocale, itLocale, jpLocale, ptLocale, trLocale, ruLocale],
			locale: this.getFullCalendarTranslation(currentLanguage),
			dateClick: this.createGame.bind(this),
			eventClick: this.selectEvent.bind(this),
			eventMouseEnter: this.showEventTooltip.bind(this),
			eventMouseLeave: this.disposeEventTooltip.bind(this),
			datesSet: this.datesRender.bind(this),
			schedulerLicenseKey: environment.SCHEDULER_LICENSE_KEY,
			resourceAreaWidth: '150px',
			resourceOrder: 'title'
		};
	}
	// endregion

	//#region Calendar Settings
	onSlotMinTimeChange(time: string) {
		setTimeout(() => {
			this.calendarOptions.slotMinTime = time;
		}, 10);
	}
	onSlotMaxTimeChange(time: string) {
		setTimeout(() => {
			this.calendarOptions.slotMaxTime = time;
		}, 10);
	}
	//#endregion

	updateEvents() {
		this.renderGames();
	}

	/**
	 * Link the <full-calendar> which is month/year picker, with <full-calendar> full calendar
	 * opens the month view.
	 * calendar is a variable for accessing the full-calendar component(full calendar) from html
	 */
	gotoDate(date: Date) {
		if (this.scoutingCalendar) {
			const calendarApi = this.scoutingCalendar.getApi();
			calendarApi.gotoDate(date); // call a method on the Calendar object
		}
	}

	// requestGamesInPeriod(dateRange: DateRange) {
	// 	this.load(dateRange);
	// }

	datesRender({ view }: { view: ViewApi }) {
		this.adjustCalendarHeight(view);
		this.currentView = { type: view.type, title: view.title };
		this.load({ start: view.currentStart, end: view.currentEnd });
		this.updatedDate = moment(view.currentStart).toDate();
	}

	private adjustCalendarHeight(view: ViewApi) {
		if (this.currentView.type !== view.type) {
			if (view.type === 'dayGridMonth') {
				this.calendarOptions.height = 'auto';
			} else {
				this.calendarOptions.height = undefined;
			}
		}
	}

	disposeEventTooltip() {
		this.tooltip.dispose();
	}

	showEventTooltip(event: any) {
		if (!!this.players && (event.view.type === 'timeGridWeek' || event.view.type === 'dayGridMonth')) {
			const mouseOverEvent: CalendarEventMouseOver = {
				event: event.event.extendedProps.sourceEvent,
				element: event.el
			};
			this.renderTooltipEvent(mouseOverEvent);
		}
	}

	private renderTooltipEvent(data: CalendarEventMouseOver) {
		const event = {
			...data.event,
			format: 'scoutingGame'
		};
		const content = this.eventService.toHtml(event, this.players, this.scoutCustomers);
		this.tooltip = new Tooltip(data.element, {
			placement: 'top',
			html: true,
			title: content
		});
	}

	selectEvent({ event }: { event: EventInput }) {
		const game = event.extendedProps.sourceEvent as ScoutingGame;
		this.getCompleteGame(game);
	}

	gameReportClickedFromReportsTable(game: ScoutingGame, gameIdField?: 'gameId') {
		// method from scouting-game-reports-table.component.ts
		this.getCompleteGame(game, gameIdField);
	}

	private getCompleteGame(game: ScoutingGame, gameIdField?: 'gameId') {
		const gameId = gameIdField ? game[gameIdField] : getId(game);
		this.blockUiInterceptorService.disableOnce(this.scoutingGameService.getMissingData(gameId)).subscribe({
			next: (missingData: Partial<ScoutingGame>) => this.editGame({ ...game, ...missingData }),
			error: (error: Error) => this.error.handleError(error)
		});
	}

	changeView(viewType: ScoutingViewType) {
		this.lastScoutingViewType = this.scoutingViewType;
		this.scoutingViewType = viewType;
	}

	save(game: ScoutingGame) {
		this.games = this.mode === 'add' ? [...this.games, game] : this.games.map(g => (g.id === game.id ? game : g));
		this.games = sortByDate(this.games, 'date');
		this.loadScoutsOptions();
		this.renderGames();
		this.mode = 'edit';
		this.requestPlayers.emit();
	}

	onRedirectEmitter(item: { playerId: string; tabIndex: number }) {
		this.redirectEmitter.emit({ playerId: item.playerId, tabIndex: item.tabIndex });
	}

	private deleteEvent(selectedGame: ScoutingGame) {
		this.scoutingGameService
			.delete(selectedGame)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.games = this.games.filter(({ id }) => id !== getId(selectedGame));
					this.loadScoutsOptions();
					this.renderGames();
					this.close();
				},
				error: (error: Error) => void this.error.handleError(error)
			});
	}

	private getUser(customerId: string) {
		const found = this.scoutCustomers.find(({ id }) => id === customerId);
		return found ? `${found.firstName} ${found.lastName}` : null;
	}

	getFullCalendarTranslation(lang): string {
		switch (lang) {
			case 'en-US':
			case 'en-GB':
				return 'en';
			case 'it-IT':
				return 'it';
			default:
				return lang;
		}
	}

	private initTranslations() {
		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					if (this.scoutingCalendar) {
						this.scoutingCalendar.options.buttonText = {
							today: this.translate.instant('today'),
							month: this.translate.instant('month'),
							week: this.translate.instant('week'),
							day: this.translate.instant('day'),
							list: this.translate.instant('list'),
							resourceTimelineDay: 'Scout'
						};
						this.scoutingCalendar.options.allDayText = this.translate.instant('all-day');
					}
				},
				error: (error: Error) => void this.error.handleError(error)
			});
	}

	private load({ start, end }: DateRange) {
		this.scoutingGameService
			.getGamesBetween(start, end, this.players)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (games: ScoutingGame[]) => {
					this.currentDateRange = { start, end };
					this.games = games;
					this.loadScoutsOptions();
					this.renderGames();
					this.handleExistingGameReports();
					this.blockUI.stop();
				},
				error: (error: Error) => void this.error.handleError(error)
			});
	}

	private handleExistingGameReports() {
		if (this.scoutingGame) {
			this.mode = 'edit';
			this.lastScoutingViewType = this.scoutingViewType;
			this.changeView(ScoutingViewType.EventDetail);
		}
	}

	private loadScoutsOptions() {
		const scouts = uniq([
			...flatten(
				this.games.filter(({ assignedTo }) => !!assignedTo && assignedTo.length > 0).map(({ assignedTo }) => assignedTo)
			)
		]);
		this.options.scouts = scouts.map(value => ({
			label: this.getUser(value),
			value
		}));
		this.options.players = this.getSelectablePlayers();
	}

	private setTimelineResources() {
		this.calendarOptions.resourceAreaHeaderContent = this.translate.instant('Scout');
		this.calendarOptions.resourceAreaHeaderClassNames = 'timeline-resource-title';
		const scouts = this.isScoutingAdmin
			? this.scoutCustomers
			: this.scoutCustomers.filter(({ id }) => id === this.currentCustomer.id);
		const resources = (scouts || []).map(scout => {
			return {
				id: scout.id,
				title: scout.firstName + ' ' + scout.lastName
			};
		});
		this.calendarOptions.resources = resources;
	}

	private renderGames() {
		let filtered = this.games;
		if (this.filters.player && this.filters.player.length > 0)
			filtered = this.games.filter(({ gameReports }) => {
				const ids = gameReports.map(({ playerScoutingId }) => playerScoutingId);
				return this.filters.player.some(id => ids.includes(id));
			});
		if (this.filters.scout?.length > 0)
			filtered = this.games.filter(
				game =>
					this.filters.scout.includes(game.author) ||
					(game.assignedTo?.length > 0 && game.assignedTo.some(scout => this.filters.scout.includes(scout)))
			);
		this.calendarOptions.events = this.toEvents(filtered);
		this.setTimelineResources();
	}

	private getSelectablePlayers() {
		const players =
			this.hasScoutingGamePermission || !this.games
				? this.players
				: (this.players || []).filter(player =>
						this.games.some(({ gameReports }) =>
							gameReports.map(({ playerScoutingId }) => playerScoutingId).includes(player.id)
						)
				  );
		return players ? players.map(player => ({ label: player.displayName, value: player.id })) : [];
	}

	private toEvents(scoutingGames: ScoutingGame[]): EventInput[] {
		return scoutingGames.map(game => ({
			id: getId(game),
			title: this.getGameTitleLabel(game),
			backgroundColor: '#FF4343',
			borderColor: '#FF4343',
			editable: false,
			start: game.start,
			extendedProps: {
				sourceEvent: game
			},
			resourceIds: game?.assignedTo
		}));
	}

	private getGameTitleLabel(game: ScoutingGame): string {
		return game.title
			? game.title
			: `${game.homeTeam || ''}${!game.homeTeam && !!game.awayTeam ? ' - ' : ''}${game.awayTeam || ''}`;
	}

	openCellInfoDialog(cellInfo: MoreLinkArg) {
		this.cellInfo = cellInfo;

		const dialogRef: DynamicDialogRef = this.dialogService.open(CalendarDetailDialogComponent, {
			data: {
				cellInfo: this.cellInfo,
				players: this.players,
				customers: this.scoutCustomers
			},
			header: moment(this.cellInfo.date, 'MM/DD/YYYY hh:mm').format('dddd DD MMMM YYYY'),
			width: '70%',
			height: '80vh'
		});

		dialogRef.onClose.pipe(take(1)).subscribe((event: Event | null) => {
			if (event) {
				this.selectEvent({ event: { extendedProps: { sourceEvent: event } } });
			} else {
				this.cellInfo = null;
			}
		});
	}

	async close(viewToGo?: ScoutingViewType) {
		if (this.scoutingGame?.sourceSection === 'scoutingProfile') {
			this.onRedirectEmitter({ playerId: (this.scoutingGame?.playersToPredisposeReports || [])[0]?.id, tabIndex: 3 });
			this.scoutingGame = null;
		} else {
			this.calendarOptions.initialDate = this.updatedDate;
			this.calendarOptions.initialView = this.currentView.type;
			this.scoutingGame = null;
			this.changeView(viewToGo ? viewToGo : ScoutingViewType.Calendar);
		}
	}
	private editGame(game: ScoutingGame) {
		this.mode = 'edit';
		this.scoutingGame = this.getScoutingGameInit(game);
		this.lastScoutingViewType = this.scoutingViewType;
		this.changeView(ScoutingViewType.EventDetail);
	}

	createGame({ date }: { date: Date }) {
		this.lastScoutingViewType = this.scoutingViewType;
		this.mode = 'add';
		this.scoutingGame = this.getScoutingGameInit(undefined, date);
		this.changeView(ScoutingViewType.EventDetail);
	}

	confirmDeleteEvent() {
		if (this.scoutingGame.game && getId(this.scoutingGame.game) && this.mode === 'edit') {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.delete'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => this.deleteEvent(this.scoutingGame.game)
			});
		}
	}

	private getScoutingGameInit(selectedGame: ScoutingGame, date?: Date): ScoutingGameInit {
		const currentUser: ScoutingGameEssentialCustomer = {
			id: this.currentCustomer.id,
			firstName: this.currentCustomer.firstName,
			lastName: this.currentCustomer.lastName
		};
		return {
			game: selectedGame ? selectedGame : this.scoutingGameService.getEmptyNew(date),
			hasScoutingGamePermission: this.hasScoutingGamePermission,
			isAdminOrUniqueScout:
				!getId(selectedGame) || (selectedGame as ScoutingGame & { isAdminOrUniqueScout: boolean }).isAdminOrUniqueScout,
			isScoutingAdmin: this.isScoutingAdmin,
			customer: currentUser,
			customers: this.scoutCustomers.map(({ id, firstName, lastName }) => ({ id, firstName, lastName })),
			settings: {
				activeGameReportTemplateId: this.club.scoutingSettings.activeGameReportTemplateId,
				activeGameReportTemplateVersion: this.club.scoutingSettings.activeGameReportTemplateVersion,
				profileCreation: this.club.scoutingSettings.profileCreation
			},
			existingScoutingPlayers: this.players
				.filter(({ archived }) => !archived)
				.map((item: PlayerScouting) => {
					delete item?.gameReports;
					delete (item as any)?.reportDataAvg;
					return item;
				}),
			playersToPredisposeReports: [],
			sourceSection: 'calendar',
			teamGender: this.currentTeam.gender as TeamGender
		};
	}

	downloadResourceDailyTimelineReport() {
		const report: TimelineDailyViewPDF = {
			header: {
				title: this.translate.instant(`navigator.scouting`).toUpperCase(),
				subTitle: 'SCOUT VIEW'
			},
			metadata: {
				createdLabel: `${this.translate.instant('general.createdOn')} ${moment(new Date()).format(
					`${getMomentFormatFromStorage()} hh:mm`
				)}`
			},
			calendar: {
				events: (this.calendarOptions.events as any).map(event => ({
					...event,
					start: this.toServer.convert(event.start),
					end: this.toServer.convert(event.start)
				})),
				resources: this.calendarOptions.resources,
				locale: this.calendarOptions.locale,
				locales: this.calendarOptions.locales,
				initialDate: this.toServer.convert(this.updatedDate)
			},
			list: []
		};
		(this.calendarOptions.resources as any).map(({ id, title }) => {
			const resourceEvents = (this.calendarOptions.events as any).filter(({ resourceIds }) => resourceIds.includes(id));
			const mappedEvents = resourceEvents.map(event => ({
				...event,
				start: moment(event.start).format('HH:mm'),
				end: moment(event.end).format('HH:mm')
			}));
			report.list.push({ resourceName: title, events: mappedEvents });
		});
		this.reportService.getReport(getPDFv2Path('calendar', 'calendar_daily_timeline', false), report);
	}
}

import {
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	OnDestroy,
	OnInit,
	Output,
	ViewChild,
	ViewEncapsulation
} from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, FormatterInput, MoreLinkArg, ViewApi } from '@fullcalendar/core';
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
import { AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { PermissionsService } from '@iterpro/shared/data-access/permissions';
import {
	ClubApi,
	Customer,
	CustomerTeamSettings,
	emptyTeamPerformanceReport,
	Event,
	EventApi,
	InjuryApi,
	LoopBackAuth,
	MedicalEvent,
	MedicalTreatment,
	MedicalTreatmentApi,
	Player,
	PlayerApi,
	PlayerGameReport,
	PlayerGameReportApi,
	PlayerTrainingReport,
	PlayerTrainingReportApi,
	ResultWithQueueMessage,
	Staff,
	Team,
	TeamApi,
	TeamGroup,
	TeamSeason,
	TeamSeasonApi,
	Test,
	TestApi,
	TestInstanceApi,
	TimelineDailyViewPDF
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	AzureStoragePipe,
	BlockUiInterceptorService,
	CalendarService,
	CanComponentDeactivate,
	DEFAULT_PERSON_IMAGE_BASE64,
	EditModeService,
	ErrorService,
	EventToHtmlService,
	InjuryService,
	ReportService,
	ToLocalEquivalentService,
	ToServerEquivalentService,
	copyValue,
	getMomentFormatFromStorage,
	getPDFv2Path,
	handleQueuePlayerRecalculationAlerts,
	sortByDate,
	sortByName,
	getTeamSettings
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { cloneDeep, flatten, isEqual, uniq } from 'lodash';
import { isArray } from 'mathjs';
import * as moment from 'moment';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as Papa from 'papaparse';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable, Observer, forkJoin, of } from 'rxjs';
import { finalize, first, map, switchMap, take } from 'rxjs/operators';
import Tooltip from 'tooltip.js';
import { RootStoreState } from '../../+state/root-store.state';
import { CalendarDetailDialogComponent } from '../../shared/calendar-detail-dailog/calendar-detail-dialog';
import { EventViewerComponent, SaveEventViewerEmitter } from './event-viewer/event-viewer.component';
import { EventPaletteService } from './services/event-palette.service';
import { PlanningService } from './services/planning.service';

const calendarPlugins = [
	momentPlugin,
	dayGridPlugin,
	interactionPlugin,
	listPlugin,
	timegridPlugin,
	resourceTimelinePlugin
];

export interface CalendarEventMouseOver {
	element: HTMLElement;
	event: Event;
}

enum PlanningViewType {
	Calendar = 1,
	Plan = 2,
	EventDetail = 3
}

@UntilDestroy()
@Component({
	templateUrl: './planning.component.html',
	styleUrls: ['./planning.component.css'],
	providers: [EventApi, CalendarService],
	encapsulation: ViewEncapsulation.None
})
export class PlanningComponent implements CanComponentDeactivate, OnInit, OnDestroy {
	@Output() csvUploadEmitter: EventEmitter<any> = new EventEmitter<any>();

	isNationalClub$: Observable<boolean>;

	// TODO: check this better implementation of full-calendar [events], maybe it will solve issue 2821
	// https://stackoverflow.com/questions/56667429/loading-events-on-init-with-fullcalendar-4-and-angular-8
	events: Event[];
	areEventsSynchronizable: boolean;
	hasNext = false;
	hasPrev = false;
	event: Event;
	newEvent = false;
	defaultView = 'dayGridMonth';
	currentView: Pick<ViewApi, 'type' | 'title'> = { type: this.defaultView, title: '' };
	defaultDate: Date = new Date();

	updatedDate: Date = new Date(); // variable to update p-calender on change events.

	testList: Test[];
	confirmDeleteFlag: boolean;
	players: Player[];

	planningViewType: PlanningViewType = PlanningViewType.Calendar;
	planningViewTypes = PlanningViewType;

	@ViewChild(EventViewerComponent, { static: false }) child: EventViewerComponent;
	@ViewChild('inputjson', { static: true }) myInput: ElementRef;
	@ViewChild(FullCalendarComponent, { static: false }) calendar: FullCalendarComponent;

	@BlockUI('full-calendar') blockCalendarUI: NgBlockUI;
	@BlockUI('general') blockGeneralUI: NgBlockUI;
	@BlockUI('event-view') blockEventUI: NgBlockUI;
	cellInfo: MoreLinkArg;

	private fileReader: FileReader;
	private dateParams: Date;
	private idParam: string;

	private uploadedEvents: Event[];
	private sortedEvents: Event[];
	private sortedEventsIndex = 0;

	private eventsCalendar: EventInput[];

	private calendarDateRange: { start: Date; end: Date };

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

	// This is a workaround to make "eventLimitClick" work because fullCalendar lose "this" context in the callback
	readonly createOpenCellInfoDialogFn = this.openCellInfoDialog.bind(this);
	currentUser: Customer;
	currentTeam: Team;
	currentTeamSettings: CustomerTeamSettings;
	additionalInfo: Map<string, any> = new Map<string, any>();
	tooltip: Tooltip;
	firstLoad = true;
	calendarOptions: CalendarOptions = {
		plugins: calendarPlugins,
		dayMaxEventRows: 4,
		moreLinkClick: this.createOpenCellInfoDialogFn,
		aspectRatio: 2.3,
		height: 'auto',
		initialDate: this.defaultDate,
		initialView: this.defaultView,
		eventTimeFormat: 'H:mm',
		allDaySlot: true,
		editable: true,
		headerToolbar: this.header,
		slotLabelFormat: this.slotLabelFormat,
		slotEventOverlap: true,
		nowIndicator: true,
		timeZone: 'local',
		eventDisplay: 'block',
		// nextDayThreshold: '00:00:00',
		locales: [esLocale, frLocale, deLocale, itLocale, jpLocale, ptLocale, trLocale, ruLocale],
		locale: this.getFullCalendarTranslation(this.auth.getCurrentUserData().currentLanguage),
		dateClick: this.handleDayClick.bind(this),
		eventClick: this.handleEventClick.bind(this),
		eventMouseEnter: this.showEventTooltip.bind(this),
		eventMouseLeave: this.disposeEventTooltip.bind(this),
		eventDrop: this.handleEventDrop.bind(this),
		eventResize: this.handleEventResize.bind(this),
		datesSet: this.datesRender.bind(this),
		schedulerLicenseKey: environment.SCHEDULER_LICENSE_KEY,
		resourceAreaWidth: '150px',
		resourceLabelContent: (info: { resource: any }) => {
			return {
				html: `<div class="fc-cell-text"> <img class="customer-pic" src="${info.resource.extendedProps.downloadUrl}"/> ${info.resource.title}</div>`
			};
		},
		resourceOrder: 'title'
	};
	activePlayersFilter: Player[] = [];
	staff: Staff[] = [];
	activeStaffFilter: Staff[] = [];
	activeAuthorsFilters: Customer[] = [];
	customers: Customer[] = [];
	groups: TeamGroup[] = [];
	activeGroupsFilters: TeamGroup[] = [];
	activeFormatFilters: string[] = [];
	allTeams: Team[];
	prefilledPlayerIds: string[] = [];

	constructor(
		private store$: Store<RootStoreState>,
		public editService: EditModeService,
		private error: ErrorService,
		private eventApi: EventApi,
		private gd: CalendarService,
		private auth: LoopBackAuth,
		private teamSeasonApi: TeamSeasonApi,
		private notificationService: AlertService,
		private confirmationService: ConfirmationService,
		private translate: TranslateService,
		private reportService: ReportService,
		private eventService: EventToHtmlService,
		private route: ActivatedRoute,
		private testApi: TestApi,
		private teamApi: TeamApi,
		private testInstanceApi: TestInstanceApi,
		private currentTeamService: CurrentTeamService,
		private planningService: PlanningService,
		private injuryApi: InjuryApi,
		private playerApi: PlayerApi,
		private injuryService: InjuryService,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private eventPaletteService: EventPaletteService,
		private authService: PermissionsService,
		private toLocal: ToLocalEquivalentService,
		private toServer: ToServerEquivalentService,
		private clubApi: ClubApi,
		private azurePipe: AzureStoragePipe,
		private medicalTreatmentApi: MedicalTreatmentApi,
		private readonly dialogService: DialogService,
		private readonly playerGameReportApi: PlayerGameReportApi,
		private readonly playerTrainingReportApi: PlayerTrainingReportApi
	) {}

	@HostListener('window:beforeunload')
	canDeactivate() {
		if (this.editService.editMode === false) {
			return true;
		}

		return new Observable((observer: Observer<boolean>) => {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.editGuard'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.editService.editMode = false;
					observer.next(true);
					observer.complete();
				},
				reject: () => {
					observer.next(false);
					observer.complete();
				}
			});
		});
	}

	ngOnDestroy() {
		this.disposeEventTooltip();
	}

	ngOnInit() {
		this.isNationalClub$ = this.store$.select(AuthSelectors.selectIsNationalClub);
		this.currentUser = this.auth.getCurrentUserData();
		this.currentTeam = this.currentTeamService.getCurrentTeam();
		this.currentTeamSettings = getTeamSettings(this.currentUser.teamSettings, this.currentTeam.id);
		forkJoin([
			this.clubApi.getTeams(this.currentUser.clubId),
			this.loadPlayers(),
			this.loadStaff(),
			this.loadCustomers(),
			this.loadGroups(),
			this.getTests()
		])
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: ([teams, players, staff, customers, groups, tests]) => {
					this.allTeams = teams;
					this.players = players;
					this.staff = staff;
					this.customers = customers;
					this.groups = groups;
					this.testList = sortByName(tests, 'name');
				},
				error: (error: Error) => this.error.handleError(error)
			});
		let dayViewDateParam = undefined; // if this is setted, it opens the day view of the date
		this.route.paramMap.pipe(untilDestroyed(this)).subscribe((params: ParamMap) => {
			if (params.keys.length > 0) {
				dayViewDateParam = params['params'].dayViewDate ? new Date(params['params'].dayViewDate) : undefined;
				this.idParam = params['params'].id;
				this.dateParams =
					dayViewDateParam ||
					params['params'].start ||
					(moment().isBefore(this.currentTeamService.getCurrentSeason().inseasonEnd)
						? moment().toDate()
						: this.currentTeamService.getCurrentSeason().inseasonEnd);
			} else {
				this.dateParams = null;
			}
			this.gd.downloadCalendar(this.auth.getCurrentUserData().currentTeamId);
			this.defaultDate = dayViewDateParam
				? dayViewDateParam
				: this.dateParams
					? moment(this.dateParams).toDate()
					: new Date();
			this.updatedDate = this.defaultDate; // setting the default value for p-calendar
			if (dayViewDateParam) {
				this.calendarOptions.initialDate = dayViewDateParam;
				this.calendarOptions.initialView = 'timeGridDay';
			}
		});
		this.translate.getTranslation(this.translate.currentLang).subscribe(x => {
			this.calendar.options.buttonText = {
				today: this.translate.instant('today'),
				month: this.translate.instant('month'),
				week: this.translate.instant('week'),
				day: this.translate.instant('day'),
				list: this.translate.instant('list'),
				resourceTimelineDay: this.translate.instant('general.player')
			};
			this.calendar.options.allDayText = this.translate.instant('all-day');
		});
	}

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

	/**
	 * Link the <full-calendar> which is month/year picker, with <full-calendar> full calendar
	 * opens the month view.
	 * calendar is a variable for accessing the full-calendar component(full calendar) from html
	 */
	gotoDate(date: Date) {
		if (this.calendar) {
			const calendarApi = this.calendar.getApi();
			calendarApi.gotoDate(date); // call a method on the Calendar object
		}
	}

	downloadReport() {
		if (this.currentView.type === 'resourceTimelineDay') {
			this.downloadResourceDailyTimelineReport();
			return;
		}
		const dates = {};
		[...this.eventsCalendar]
			.sort((a, b) => a.extendedProps.sourceEvent.start - b.extendedProps.sourceEvent.start)
			.forEach(event => {
				const date = moment(event.extendedProps.sourceEvent.start);
				const key = date.format('dddd DD MMMM');
				if (!dates[key]) dates[key] = [];
				dates[key].push(event);
			});

		const datesArr = Object.keys(dates).map(keyDate => ({
			title: keyDate,
			date: keyDate,
			events: dates[keyDate].map(event => ({
				...event,
				start: moment(event.start).format('HH:mm'),
				end: moment(event.end).format('HH:mm')
			}))
		}));

		const data = {
			title: this.currentView.title,
			dates: datesArr
		};
		this.reportService.getReport(
			'planning_list_1.45.1',
			data,
			this.auth.getCurrentUserData().position,
			null,
			`Planning - Agenda ${this.currentView.title}`
		);
	}

	private downloadResourceDailyTimelineReport() {
		const report: TimelineDailyViewPDF = {
			header: {
				title: this.translate.instant(`navigator.planning`).toUpperCase(),
				subTitle: 'PLAYER VIEW'
			},
			metadata: {
				createdLabel: `${this.translate.instant('general.createdOn')} ${moment(new Date()).format(`${getMomentFormatFromStorage()} hh:mm`)}`
			},
			calendar: {
				// @ts-ignore
				events: this.calendarOptions.events.map(event => ({
					...event,
					start: this.toServer.convert(event.start),
					end: this.toServer.convert(event.end)
				})),
				resources: this.calendarOptions.resources,
				locale: this.calendarOptions.locale,
				locales: this.calendarOptions.locales as [],
				initialDate: this.toServer.convert(this.updatedDate)
			},
			list: []
		};
		// @ts-ignore
		this.calendarOptions.resources.map(({ id, title, downloadUrl }) => {
			// @ts-ignore
			const resourceEvents = this.calendarOptions.events.filter(({ resourceIds }) => resourceIds.includes(id));
			const mappedEvents = resourceEvents.map(event => ({
				...event,
				start: moment(event.start).format('HH:mm'),
				end: moment(event.end).format('HH:mm')
			}));
			report.list.push({ resourceName: title, resourceDownloadUrl: downloadUrl, events: mappedEvents });
		});
		this.reportService.getReport(getPDFv2Path('calendar', 'calendar_daily_timeline', false), report);
	}

	updateActiveFormatFilters(list: string[]) {
		this.activeFormatFilters = list;
		this.loadFilteredEvents();
	}

	updatePlayerFilters(list: Player[]) {
		this.activePlayersFilter = list;
		this.loadFilteredEvents();
	}

	private setTimelineResources(players: Player[] = []) {
		if (!players || players.length === 0) return;
		this.calendarOptions.resourceAreaHeaderContent = this.translate.instant('Players');
		this.calendarOptions.resourceAreaHeaderClassNames = 'timeline-resource-title';
		const resources = this.players
			.filter(
				({ archived, archivedDate }) =>
					!archived ||
					(archived &&
						moment(archivedDate).startOf('day').isAfter(moment(this.calendarDateRange.start).startOf('day').toDate()))
			)
			.map(({ id: playerId }) => {
				const player = players.find(({ id }) => id === playerId);
				if (player) {
					return {
						id: player.id,
						title: player.displayName,
						downloadUrl:
							player?.downloadUrl && this.azurePipe.transform(player.downloadUrl)
								? this.azurePipe.transform(player.downloadUrl)
								: DEFAULT_PERSON_IMAGE_BASE64
					};
				}
			});
		this.calendarOptions.resources = resources.filter(res => !!res);
	}

	updateStaffFilters(list: Staff[]) {
		this.activeStaffFilter = list;
		this.loadFilteredEvents();
	}

	updateAuthorsFilters(list: Customer[]) {
		this.activeAuthorsFilters = list;
		this.loadFilteredEvents();
	}

	updateGroupsFilters(list: TeamGroup[]) {
		this.activeGroupsFilters = list;
		this.loadFilteredEvents();
	}

	private loadFilteredEvents() {
		this.calendarOptions.events = this.getFilteredEvents();
		this.setTimelineResources(this.activePlayersFilter);
	}

	prev() {
		this.showSortedEvent(-1);
	}
	next() {
		this.showSortedEvent(1);
	}

	handleEventClick({ event }: { event: any }) {
		this.disposeEventTooltip();

		if (this.isForbiddenToAccess(event)) {
			this.notificationService.notify('error', 'alert.authGuard.title', 'noPermissions');
			return false;
		} else {
			this.event = copyValue(event.extendedProps.sourceEvent);
			this.updateSortedIndex();
			this.editService.editMode = false;
			this.changeView(PlanningViewType.EventDetail);
			this.defaultDate = event.start;
		}
	}

	private isForbiddenToAccess(event): boolean {
		return (
			event.extendedProps.sourceEvent.format === 'medical' &&
			!(
				this.authService.canUserAccessToModule('infirmary', this.currentTeam).response ||
				this.authService.canUserAccessToModule('maintenance', this.currentTeam).response
			)
		);
	}

	handleDayClick({ date: eventDate, resource }) {
		this.prefilledPlayerIds = [];
		const season = this.getSeasonForDate(eventDate);
		if (season) {
			const newEvent: Event = new Event({
				title: '',
				start: eventDate,
				end: moment(eventDate).add(1, 'hours').toDate(),
				format: 'general',
				duration: 60,
				type: this.gd.getGD(eventDate),
				author: this.auth.getCurrentUserData().firstName + ' ' + this.auth.getCurrentUserData().lastName,
				allDay: false,
				teamSeasonId: season.id,
				playerIds: [],
				teamReport: emptyTeamPerformanceReport()
			});
			this.defaultDate = eventDate;
			this.editService.editMode = true;
			this.prefilledPlayerIds = resource ? [resource.id] : [];
			this.saveEvent({ event: newEvent, notify: false });
		} else {
			this.notificationService.notify('warn', 'Planning', 'seasons.dateOutside');
		}
	}

	private getSeasonForDate(date: Date): TeamSeason {
		return this.currentTeamService
			.getCurrentTeam()
			.teamSeasons.find(x => moment(date).isBetween(x.offseason, x.inseasonEnd, 'day', '[]'));
	}

	handleEventDrop(eventSel) {
		this.updateScheduleEvent(eventSel);
	}

	handleEventResize(eventSel) {
		this.updateScheduleEvent(eventSel);
	}

	datesRender({ view }: { view: ViewApi }) {
		this.adjustCalendarHeight(view);
		this.currentView = { type: view.type, title: view.title };
		if (!isEqual(this.calendarDateRange, { start: view.currentStart, end: view.currentEnd })) {
			this.calendarDateRange = { start: view.currentStart, end: view.currentEnd };
			this.loadEvents(this.calendarDateRange);
		}
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

	handleDeleteEvent(event: Event, relatedInstance?: boolean, type?: string) {
		this.delete(event, relatedInstance, type);
		this.closePanel();
	}

	handleResyncEvent(event: Event) {
		event.wyscoutSynced = false;
		this.blockEventUI.start();
		this.blockUiInterceptorService
			.disableOnce(this.eventApi.syncEvent(this.event.id))
			.pipe(
				first(),
				untilDestroyed(this),
				finalize(() => this.blockUiInterceptorService.enableInterceptor())
			)
			.subscribe({
				next: (result: ResultWithQueueMessage) => {
					const updated = result.result;
					// this.event = { ...updated };
					if (updated) {
						this.handleEventClick({ event: { start: this.updatedDate, extendedProps: { sourceEvent: updated } } });
					}
					this.blockEventUI.stop();
					this.notificationService.notify('success', 'navigator.planning', 'alert.eventResynced', false);
					if (!environment.production) {
						handleQueuePlayerRecalculationAlerts(this.players, result, this.notificationService);
					}
				},
				error: (error: any) => {
					this.blockEventUI.stop();
					if (error.code === 'WYSCOUT_NOT_SYNCED') this.notificationService.notify('warn', 'Warning', error.message);
					else this.error.handleError(error);
				},
				complete: () => console.debug('Sync Event Completed')
			});
	}

	closePanel(event?) {
		this.calendarOptions.initialDate = this.defaultDate;
		this.calendarOptions.initialView = this.currentView.type;
		this.event = copyValue(event);
		this.changeView(PlanningViewType.Calendar);
		this.newEvent = false;
	}

	changeView(viewType: PlanningViewType) {
		this.planningViewType = viewType;
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

	disposeEventTooltip() {
		if (this.tooltip) {
			this.tooltip.dispose();
		}
	}

	showEventTooltip(event: any) {
		if (this.players) {
			const mouseOverEvent: CalendarEventMouseOver = {
				event: event.event.extendedProps.sourceEvent,
				element: event.el
			};
			this.renderTooltipEvent(mouseOverEvent);
		}

		const observable$ = !this.additionalInfo.has(event.event.extendedProps.sourceEvent)
			? this.planningService.getAdditionalInfo(event.event.extendedProps.sourceEvent)
			: of(this.additionalInfo.get(event.event.extendedProps.sourceEvent));

		this.blockUiInterceptorService
			.disableOnce(observable$)
			.pipe(
				first(),
				untilDestroyed(this),
				finalize(() => this.blockUiInterceptorService.enableInterceptor())
			)
			.subscribe({
				next: (eventAdditionalInfo: Event) => {
					this.additionalInfo.set(event.event.extendedProps.sourceEvent.id, eventAdditionalInfo);
					this.updateTooltip(event.event.extendedProps.sourceEvent, eventAdditionalInfo);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private renderTooltipEvent({ element, event }: CalendarEventMouseOver) {
		const content = this.eventService.toHtml(event, this.players, this.customers);
		this.tooltip = new Tooltip(element, {
			placement: 'top',
			html: true,
			title: content,
			container: 'body'
		});
	}

	private updateTooltip(event: Event, additionalInfo: Event) {
		if (this.tooltip) {
			const content = this.eventService.toHtml(
				{
					...event,
					...additionalInfo
				},
				this.players,
				this.customers
			);
			if (content) this.tooltip.updateTitleContent(content);
		}
	}

	confirmDeleteInstance() {
		this.confirmDeleteFlag = true;
	}

	discard() {
		this.confirmDeleteFlag = false;
	}

	onLoadingEvents(loading: boolean) {
		if (!this.blockGeneralUI.isActive) {
			loading
				? this.blockCalendarUI.start(this.translate.instant('spinner.planning.calendar'))
				: this.blockCalendarUI.stop();
		}
	}

	saveEvent(eventEmitted: SaveEventViewerEmitter) {
		const eventToSave: any = eventEmitted.event;
		eventToSave.teamId = this.auth.getCurrentUserData().currentTeamId;
		if (eventToSave.format === 'medical' && eventToSave.medicalType === 'treatment') {
			const isMultipleTreatments = eventToSave?.medicalTreatments?.length > 1;
			const instanceCategory = isMultipleTreatments ? null : eventToSave?.medicalTreatments?.[0]?.treatmentType;
			eventToSave.title = this.injuryService.getMedicalEventTitle(
				isMultipleTreatments,
				instanceCategory,
				'treatment',
				eventToSave.title
			);
		} else {
			if (
				!eventToSave.title ||
				eventToSave.title === '' ||
				eventToSave.title === 'clubGame' ||
				eventToSave.title === 'game' ||
				eventToSave.title === 'friendly'
			) {
				if (eventToSave.format === 'clubGame') {
					const homeTeam =
						eventToSave.clubGameHomeTeam.length > 0
							? eventToSave.clubGameHomeTeam
							: this.translate.instant('event.team.home');
					const awayTeam =
						eventToSave.clubGameAwayTeam.length > 0
							? eventToSave.clubGameAwayTeam
							: this.translate.instant('event.team.away');
					eventToSave.title = homeTeam + ' - ' + awayTeam;
				} else {
					eventToSave.title =
						eventToSave.format === 'game' || eventToSave.format === 'friendly'
							? eventToSave.opponent
							: eventToSave.format;
				}
			}
		}
		eventToSave.playerIds = uniq(eventToSave.playerIds);
		eventToSave.staffIds = uniq(eventToSave.staffIds);

		eventToSave.lastUpdateDate = new Date();
		if (eventToSave.allDay) {
			eventToSave.start = this.toServer.convert(eventToSave.start);
			eventToSave.end = this.toServer.convert(eventToSave.end);
		}
		if (
			eventEmitted.isNewAndDuplicate &&
			(eventToSave.format === 'game' || eventToSave.format === 'friendly' || eventToSave.format === 'training')
		) {
			this.createEvent(eventToSave, eventEmitted);
		} else {
			if (eventToSave.format === 'game' || eventToSave.format === 'friendly') {
				this.updateTrainingOrMatchEvent(eventToSave, 'game', eventEmitted.notify, eventEmitted?.playerReports);
			} else if (eventToSave.format === 'training') {
				this.updateTrainingOrMatchEvent(eventToSave, 'training', eventEmitted.notify, eventEmitted?.playerReports);
			} else {
				if (!eventToSave.id) {
					if (eventEmitted?.playerIdsApplyTo?.length > 0) {
						eventEmitted.playerIdsApplyTo.map(playerId => {
							const event = cloneDeep({ ...eventToSave, playerIds: [playerId] });
							this.createEvent(event, eventEmitted);
						});
					} else {
						this.createEvent(eventToSave, eventEmitted);
					}
				} else {
					this.updateEvent(eventToSave, eventEmitted);
				}
			}
		}
	}

	/**
	 * Called when 'Download Empty Csv' button is clicked.
	 * Allowing user to download an empty CSV file.
	 */
	downloadEmptyCsv() {
		const headerObj = {};
		const eventProperties = Object.getOwnPropertyNames(Event.getModelDefinition().properties);

		// leaving first column of header empty for numbering etc.
		headerObj['No.'] = '';

		// Adding all other properties to header.
		eventProperties.forEach(prop => {
			headerObj[prop] = '';
		});

		const results = Papa.unparse([headerObj], {});
		const fileName = 'Event_' + moment().format(getMomentFormatFromStorage()) + '_empty.csv';

		const contentDispositionHeader = 'Content-Disposition: attachment; filename=' + fileName;
		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	// TODO @frdicarlo/@pserena please add more docs to it.
	/**
	 * Purpose : Creating event object for each file uploaded event.
	 * Pre-requisite => the date format in CSV file should be as "DD/MM/YYYY HH:mm"
	 *  =>In event object creation, teamId is required field for validation process on server.
	 * 	=>playerIds/_playerMatchStats/_sessionPlayers are required fields(non null) during event object so that
	 * 	  participants (players list) get displayed in event view.
	 *  =>The true and false in CSV can be both "true"/"false" or true/false
	 */
	fileChanged(e) {
		this.uploadedEvents = [];
		this.fileReader = new FileReader();

		// Reading from uploaded file.
		this.fileReader.onload = ev => {
			const csvRead = this.fileReader.result;
			const resultsCsv: Papa.ParseResult<any> = Papa.parse(csvRead.toString(), {
				header: true,
				skipEmptyLines: true
			});

			// array of all the events in uploaded file
			const csvData = resultsCsv.data;
			// saving all new events that are read from file
			this.uploadedEvents = csvData.map(
				(csvDataItem, index) =>
					new Event({
						csvGps: null,
						csvPlayer: null,
						csvTeam: null,
						wyscoutSynced: csvDataItem.wyscoutSynced === 'true',
						title: csvDataItem.title || `Event ${index + 1} (From CSV upload)`,
						wyscoutId: csvDataItem.wyscoutId ? parseInt(csvDataItem.wyscoutId, 10) : null,
						allDay: csvDataItem.allDay === 'true',
						start: moment(csvDataItem.start, 'DD/MM/YYYY HH:mm').toDate(), // converted into boolean value => true/false as the value is read as string from file => "true"/"false"
						end: csvDataItem.end ? moment(csvDataItem.end, 'DD/MM/YYYY HH:mm').toDate() : null,
						author: csvDataItem.author,
						duration: csvDataItem.duration ? parseInt(csvDataItem.duration, 10) : null, // converted into number as the value is read as string from file => "5" "4" "3" etc
						description: csvDataItem.description ? csvDataItem.description : null,
						format: (csvDataItem.format || 'general').toLowerCase(),
						subformat: csvDataItem.subformat ? csvDataItem.subformat.toLowerCase() : null,
						subformatDetails: csvDataItem.subformatDetails ? csvDataItem.subformatDetails.toLowerCase() : '',
						type: csvDataItem.type.toLowerCase(),
						where: csvDataItem.where ? csvDataItem.where : null,
						result: csvDataItem.result ? csvDataItem.result : null,
						resultFlag: csvDataItem.resultFlag === 'true',
						workload: csvDataItem.workload ? parseInt(csvDataItem.workload, 10) : null,
						intensity: csvDataItem.intensity ? parseInt(csvDataItem.intensity, 10) : null,
						theme: csvDataItem.theme ? csvDataItem.theme.toLowerCase() : null,
						subtheme: csvDataItem.subtheme ? csvDataItem.subtheme.toLowerCase() : null,
						home: csvDataItem.home === 'true',
						friendly: csvDataItem.friendly === 'true',
						destination: csvDataItem.destination ? csvDataItem.destination : null,
						recoveryStrategy: [],
						nutritionalPre: [],
						nutritionalDuring: [],
						nutritionalPost: [],
						opponent: csvDataItem.opponent ? csvDataItem.opponent : null,
						gpsSessionLoaded: csvDataItem.gpsSessionLoaded === 'true',
						playersSessionLoaded: csvDataItem.playersSessionLoaded === 'true',
						lastUpdateDate: csvDataItem.lastUpdateDate
							? moment(csvDataItem.lastUpdateDate, 'DD/MM/YYYY HH:mm').toDate()
							: null,
						lastUpdateAuthor: csvDataItem.lastUpdateAuthor ? csvDataItem.lastUpdateAuthor : null,
						individual: csvDataItem.individual === 'true',
						testModel: csvDataItem.testModel ? csvDataItem.testModel : null,
						teamId: this.currentTeamService.getCurrentTeam().id, // teamId is required field for validation process
						teamSeasonId: this.currentTeamService.getCurrentSeason().id,
						playerIds: [],
						staffIds: [],
						_sessionPlayers: [],
						_sessionImport: [],
						_drillsExecuted: [],
						_drills: [],
						_attachments: [],
						_playerMatchStats: []
					})
			);

			if (this.myInput) this.myInput.nativeElement.value = '';
			this.csvUploadEmitter.emit();
		};

		// Updating DB for newly uploaded events after file read option complete.
		this.fileReader.onloadend = () => this.updateDbForUplodedEvents();

		// Error handling for file reader
		this.fileReader.onerror = ev => {
			// TODO: alert user with a message?
			// eslint-disable-next-line no-console
			console.error(ev);
		};
		// Reading first file uploaded.
		this.fileReader.readAsText(e.target.files[0]);
	}

	openCellInfoDialog(cellInfo: MoreLinkArg) {
		this.cellInfo = cellInfo;

		const dialogRef: DynamicDialogRef = this.dialogService.open(CalendarDetailDialogComponent, {
			data: {
				cellInfo: this.cellInfo,
				players: this.players,
				customers: this.customers
			},
			header: moment(this.cellInfo.date, 'MM/DD/YYYY hh:mm').format('dddd DD MMMM YYYY'),
			width: '70%',
			height: '80vh'
		});

		dialogRef.onClose.pipe(take(1)).subscribe((event: Event | null) => {
			if (event) {
				this.handleEventClick({ event: { extendedProps: { sourceEvent: event } } });
			} else {
				this.cellInfo = null;
			}
		});
	}

	syncCalendar() {
		const { start, end } = this.calendarDateRange;
		this.getEventsFrom(() => this.planningService.syncDateRangeEvents(start, end))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => this.notificationService.notify('success', 'navigator.planning', 'period.synced', false),
				error: (error: Error) => {
					this.blockCalendarUI.stop();
					this.error.handleError(error);
				}
			});
	}

	get saveDisabled(): boolean {
		const isValidDate = date => !!date && !isNaN(date) && date instanceof Date;
		return !(this.child && isValidDate(this.child.startDate) && isValidDate(this.child.endDate));
	}

	private getEventsFrom(eventRequestfn: () => Observable<Event[]>) {
		if (!this.firstLoad) {
			this.blockCalendarUI.start(this.translate.instant('spinner.planning.calendar'));
		}
		return this.blockUiInterceptorService.disableOnce(eventRequestfn()).pipe(
			map((events: Event[]) => {
				this.blockCalendarUI.stop();
				this.events = events;
				this.areEventsSynchronizable = (this.events || []).some(a => a.wyscoutId || a.instatId);
				this.eventsCalendar = this.events.map(x => this.eventToCalendarEvent(x));
				this.loadFilteredEvents();
				this.updateSortedEvents();
				return events;
			})
		);
	}

	private loadPlayers(): Observable<Player[]> {
		const season = this.currentTeamService.getCurrentSeason();
		return this.teamSeasonApi.getPlayers(season.id, {
			fields: ['_id', 'id', 'displayName', 'downloadUrl', 'archived', 'archivedDate']
		});
	}

	private loadStaff(): Observable<Staff[]> {
		const season = this.currentTeamService.getCurrentSeason();
		return this.teamSeasonApi.getStaffs(season.id, { fields: ['_id', 'id', 'firstName', 'lastName'] });
	}

	private loadCustomers(): Observable<Customer[]> {
		const { clubId } = this.currentTeamService.getCurrentTeam();
		return this.clubApi.getCustomers(clubId, { fields: ['_id', 'id', 'firstName', 'lastName', 'downloadUrl'] });
	}

	private loadGroups(): Observable<TeamGroup[]> {
		const season = this.currentTeamService.getCurrentSeason();
		return this.teamSeasonApi.getGroups(season.id);
	}

	/**
	 * This is handler called on change of week or month buttons of full-calendar.
	 * @param event takes the date of the full-calendar view and simply get the events from the server
	 */

	// Note for Adriano: consider using a ngRx storage service that knows *where* to call the events remotely
	// instead of calling it everytime, cause now even with filtering call that for refetching
	private loadEvents({ start, end }: { start: Date; end: Date }) {
		const obs$ = this.idParam ? this.eventApi.findById(this.idParam) : of(true);
		obs$
			.pipe(
				switchMap((event: Event) => {
					if (this.dateParams || event.start) {
						start = moment(event.start || this.dateParams)
							.startOf('month')
							.toDate();
						end = moment(event.start || this.dateParams)
							.endOf('month')
							.toDate();
						this.gotoDate(end);
						this.dateParams = null;
					}
					return this.getEventsFrom(() => this.planningService.getEventList(start, end));
				})
			)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.firstLoad = false;
					this.blockCalendarUI.stop();
					if (this.idParam) {
						const event = this.events.find(({ id }) => id === this.idParam);
						if (event) {
							this.handleEventClick({ event: { start, extendedProps: { sourceEvent: event } } });
						}
						this.idParam = null;
						this.dateParams = null;
					}
					this.setTimelineResources(this.players);
					this.updatedDate = moment(start).toDate();
				},
				error: (error: Error) => {
					this.blockCalendarUI.stop();
					this.error.handleError(error);
				}
			});
	}

	private getTests() {
		return this.testApi.find({
			where: {
				teamId: { inq: [this.auth.getCurrentUserData().currentTeamId, 'GLOBAL'] }
			},
			fields: ['id', 'name', 'medical']
		});
	}
	private getFilteredEvents(): EventInput[] {
		const config: { field: string; canFilters: boolean; collection: any[] }[] = [
			{ field: 'format', canFilters: this.activeFormatFilters.length > 0, collection: this.activeFormatFilters },
			{
				field: 'playerIds',
				canFilters: this.activePlayersFilter.length > 0,
				collection: this.activePlayersFilter.map(({ id }) => id)
			},
			{
				field: 'staffIds',
				canFilters: this.activeStaffFilter.length > 0,
				collection: this.activeStaffFilter.map(({ id }) => id)
			},
			{
				field: 'author',
				canFilters: this.activeAuthorsFilters.length > 0,
				collection: this.activeAuthorsFilters.map(({ firstName, lastName }) => `${firstName} ${lastName}`)
			},
			{
				field: 'playerIds',
				canFilters: this.activeGroupsFilters.length > 0,
				collection: flatten(this.activeGroupsFilters.map(({ players }) => players))
			}
		];
		if (config.some(({ canFilters }) => canFilters)) {
			let filteredResult = cloneDeep(this.eventsCalendar);
			config
				.filter(({ canFilters }) => canFilters)
				.forEach(({ field, collection }) => {
					filteredResult = this.filterEventsByField(field, collection, filteredResult);
				});
			return filteredResult;
		}
		return this.eventsCalendar;
	}

	private filterEventsByField(field: string, collection: any[], filteredItems: EventInput[]): EventInput[] {
		return filteredItems.filter(({ extendedProps }) =>
			isArray(extendedProps.sourceEvent[field])
				? extendedProps.sourceEvent[field].some(element => collection.includes(element))
				: collection.includes(extendedProps.sourceEvent[field])
		);
	}

	private updateSortedEvents() {
		this.sortedEvents = sortByDate([...this.events], 'start');
	}

	private updateSortedIndex() {
		const i = this.sortedEvents.findIndex(e => e.id === this.event.id);
		this.sortedEventsIndex = i;
		this.hasPrev = i > 0;
		this.hasNext = i >= 0 && i < this.sortedEvents.length - 1;
	}

	private showSortedEvent(inc) {
		const index = this.sortedEventsIndex + inc;
		if (index > -1 && index < this.sortedEvents.length) {
			const event = this.sortedEvents[index];
			this.handleEventClick({ event: { extendedProps: { sourceEvent: event } } });
		}
	}

	private updateScheduleEvent(eventSel) {
		eventSel.event.extendedProps.sourceEvent.start = eventSel.event.start;
		eventSel.event.extendedProps.sourceEvent.end = eventSel.event.end;
		this.saveEvent({ event: eventSel.event.extendedProps.sourceEvent, notify: false });
	}

	private updateMedicalTreatments(event: MedicalEvent, eventEmitted: SaveEventViewerEmitter) {
		const isFromApplyTo = eventEmitted?.playerIdsApplyTo?.length > 0;
		this.handleDeleteTreatments(eventEmitted?.treatmentsIdsToDelete);
		if (event.medicalTreatments && event.medicalTreatments.length > 0 && event?.playerIds.length > 0) {
			const items: MedicalTreatment[] = event.medicalTreatments.map(treatment => ({
				...treatment,
				playerId: event.playerIds[0],
				date: event.start,
				eventId: event.id,
				id: eventEmitted.isNewAndDuplicate ? undefined : treatment?.id
			}));
			const obs$: Observable<MedicalTreatment>[] = items.map((item: MedicalTreatment) =>
				this.medicalTreatmentApi.patchOrCreate(item)
			);
			forkJoin(obs$)
				.pipe(first())
				.subscribe({
					next: (result: any) => {
						if (!isFromApplyTo) {
							(this.event as MedicalEvent) = {
								...this.event,
								medicalTreatments: result
							};
						}
						this.notificationService.notify('success', 'navigator.planning', 'alert.recordUpdated', false);
					},
					error: (err: Error) => {
						this.error.handleError(err);
					}
				});
		} else {
			(this.event as MedicalEvent) = { ...this.event, medicalTreatments: event.medicalTreatments };
		}
	}

	private handleDeleteTreatments(treatmentsIdsToDelete: string[] = []) {
		const deleteObs$: Observable<MedicalTreatment>[] = (treatmentsIdsToDelete || []).map(id =>
			this.medicalTreatmentApi.deleteById(id)
		);
		if (deleteObs$?.length > 0) {
			forkJoin(deleteObs$)
				.pipe(first())
				.subscribe({
					next: () => {
						((this.event as any).medicalTreatments || []).filter(({ id }) => !treatmentsIdsToDelete.includes(id));
					},
					error: (err: Error) => {
						this.error.handleError(err);
					}
				});
		}
	}

	private getPlayerReportApi(): PlayerGameReportApi | PlayerTrainingReportApi {
		return this.event.format === 'training' ? this.playerTrainingReportApi : this.playerGameReportApi;
	}

	private updateTrainingOrMatchEvent(
		event,
		type: 'training' | 'game',
		notify: boolean,
		playerReports: { toUpsert: PlayerGameReport[] | PlayerTrainingReport[]; toDeleteIds: string[] }
	) {
		this.blockEventUI.start();
		let obs$ =
			type === 'training'
				? [this.eventApi.saveEventTraining(event, notify)]
				: [this.eventApi.saveEventMatch(event, notify)];
		const reportApi = this.getPlayerReportApi();
		if (playerReports?.toUpsert && playerReports?.toUpsert.length > 0) {
			obs$ = obs$.concat(playerReports?.toUpsert.map(report => reportApi.patchOrCreate(report)));
		}
		if (playerReports?.toDeleteIds && playerReports?.toDeleteIds.length > 0) {
			obs$ = obs$.concat(playerReports?.toDeleteIds.map(id => reportApi.deleteById(id)));
		}
		forkJoin(obs$)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (results: any[]) => {
					const result = results[0] as ResultWithQueueMessage;
					this.blockEventUI.stop();
					const index: number = this.findEventIndexById(result.result.id);
					const indexCal: number = this.findEventCalIndexById(result.result.id);
					if (indexCal >= 0) {
						this.eventsCalendar[index] = this.eventToCalendarEvent(result.result);
					}
					this.events[index] = result.result;
					this.updateCalendar(event);
					if (this.newEvent) this.closePanel(event);
					this.notificationService.notify('success', 'navigator.planning', 'alert.recordUpdated', false);
					if (!environment.production) {
						handleQueuePlayerRecalculationAlerts(this.players, result, this.notificationService);
					}
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private eventToCalendarEvent(ev: Event): EventInput {
		ev.start = ev.allDay ? this.toLocal.convert(ev.start) : ev.start;
		ev.end = ev.allDay
			? moment(this.toLocal.convert(ev.end)).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).toDate()
			: ev.end;
		const eCal: EventInput = {
			backgroundColor: this.eventPaletteService.getEventColor(ev),
			borderColor: this.eventPaletteService.getEventColor(ev),
			allDay: ev.allDay,
			start: moment(ev.start, 'MM/DD/YYYY HH:mm').toDate(),
			end: moment(ev.end, 'MM/DD/YYYY HH:mm').toDate(),
			id: ev.id,
			title: ev.format === 'assessment' || ev.format === 'medical' ? this.getMedicalEventTitle(ev.title) : ev.title,
			textColor: 'white',
			editable:
				ev.format !== 'training' && ev.format !== 'game' && ev.format !== 'medical' && ev.wyscoutSynced !== true,
			extendedProps: {
				sourceEvent: { ...ev, author: this.planningService.getCustomerName(ev.author, this.customers) },
				testInstance: ev.testInstance
			},
			resourceIds: ev?.playerIds
		};
		return eCal;
	}

	private getMedicalEventTitle(title: string): string {
		const splitted = title.split(':');
		return splitted.length > 1 ? splitted[1] : splitted[0];
	}

	private createEvent(event, eventEmitted: SaveEventViewerEmitter) {
		const isFromApplyTo = eventEmitted?.playerIdsApplyTo?.length > 0;
		const clonedEvent = cloneDeep(event);
		delete event?.medicalTreatments;
		delete event?.preventionExams;
		delete event?.injuryExams;
		this.eventApi
			.saveEvent(event, eventEmitted.notify)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (result: ResultWithQueueMessage) => {
					const updated = result.result;
					this.newEvent = true;
					this.events.push(updated);
					const eCal: any = this.eventToCalendarEvent(updated);
					this.eventsCalendar.push(eCal);
					this.loadFilteredEvents();
					this.updateSortedEvents();
					this.updateCalendar(updated);
					if (!isFromApplyTo) {
						this.event = updated;
					}
					this.updateSortedIndex();
					this.changeView(PlanningViewType.EventDetail);
					if (result.result.testModel) this.createTestInstance(updated);
					this.notificationService.notify('success', 'navigator.planning', 'alert.recordCreated', false);
					if (!environment.production) {
						handleQueuePlayerRecalculationAlerts(this.players, result, this.notificationService);
					}
					if (updated.format === 'medical') {
						this.updateMedicalTreatments({ ...clonedEvent, id: updated.id }, eventEmitted);
					}
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}
	// Updating DB for newly file uploaded events
	private updateDbForUplodedEvents() {
		this.eventApi
			.createManyEvents(this.uploadedEvents)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (events: Event[]) => {
					// Notify user that uploaded events are created successfully
					this.notificationService.notify('success', 'navigator.planning', 'alert.recordCreated', false);
					// Update UI as well after upload file action success.

					for (const event of events) {
						const eCal = this.eventToCalendarEvent(event);
						this.events.push(event);
						this.eventsCalendar.push(eCal);
					}
					this.loadFilteredEvents();
					this.updateSortedEvents();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private updateEvent(event, eventEmitted: SaveEventViewerEmitter) {
		const index: number = this.findEventIndexById(event.id);
		const clonedEvent = cloneDeep(event);
		delete event?.medicalTreatments;
		delete event?.preventionExams;
		delete event?.injuryExams;
		if (index >= 0) {
			this.eventApi
				.saveEvent(event, eventEmitted.notify)
				.pipe(untilDestroyed(this))
				.subscribe({
					next: (result: ResultWithQueueMessage) => {
						const updated = result.result;
						const indexCal: number = this.findEventCalIndexById(event.id);
						if (indexCal >= 0) {
							this.eventsCalendar[index] = this.eventToCalendarEvent(updated);
						}
						this.events[index] = cloneDeep(updated);
						this.event = updated;
						this.updateCalendar(event);
						if (updated.testModel && !(event.extendedProps && event.extendedProps.testInstance))
							this.createTestInstance(updated);
						if (this.newEvent) this.closePanel(event);
						this.notificationService.notify('success', 'navigator.planning', 'alert.recordUpdated', false);
						if (!environment.production) {
							handleQueuePlayerRecalculationAlerts(this.players, result, this.notificationService);
						}
						if (updated.format === 'medical') {
							this.updateMedicalTreatments({ ...clonedEvent, id: updated.id }, eventEmitted);
						}
					},
					error: (error: Error) => this.error.handleError(error)
				});
		}
	}

	private createTestInstance(event) {
		this.eventApi
			.createTestInstance(event.id, {
				teamId: event.teamId,
				testId: event.testModel,
				date: moment(event.start).startOf('day').toDate()
			})
			.pipe(untilDestroyed(this))
			.subscribe({
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private updateCalendar(event) {
		if (event.format === 'game' || event.format === 'friendly') {
			this.gd.downloadCalendar(this.auth.getCurrentUserData().currentTeamId);
		}
	}

	private delete(event: any, relatedInstance?: boolean, type?: string) {
		const eventId = event.id;
		const obs = [this.eventApi.deleteEvent(eventId)];
		if (relatedInstance)
			if (type === 'assessment' && event.testInstance && event.testInstance.id) {
				obs.push(this.testInstanceApi.deleteTestInstance(event.testInstance.id));
			} else if (type === 'medical') {
				if (event.medicalType === 'treatment') {
					obs.push(...(event.medicalTreatments || []).map(({ id }) => this.medicalTreatmentApi.deleteById(id)));
				} else if (event.medicalType === 'exam') {
					obs.push(
						...(event.preventionExams || []).map(({ id }) =>
							this.playerApi.destroyByIdPreventionExams(event.playerIds[0], id)
						)
					);
					obs.push(
						...(event.injuryExams || []).map(({ id, injuryId }) => this.injuryApi.destroyByIdInjuryExams(injuryId, id))
					);
				}
			}
		forkJoin(obs)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (result: ResultWithQueueMessage[]) => {
					this.notificationService.notify('success', 'navigator.planning', 'alert.recordDeleted', false);
					if (!environment.production) {
						for (const item of result) {
							handleQueuePlayerRecalculationAlerts(this.players, item, this.notificationService);
						}
					}
					const index = this.findEventIndexById(eventId);
					if (index >= 0) this.events.splice(index, 1);
					const indexCal = this.findEventCalIndexById(eventId);
					if (indexCal >= 0) this.eventsCalendar.splice(indexCal, 1);
					this.calendarOptions = cloneDeep({
						...this.calendarOptions,
						events: this.eventsCalendar
					});
					this.confirmDeleteFlag = false;
				},
				error: (error: Error) => {
					this.error.handleError(error);
				}
			});
	}

	private findEventIndexById(id: string) {
		let index = -1;
		for (let i = 0; i < this.events.length; i++) {
			if (id === this.events[i].id) {
				index = i;
				break;
			}
		}
		return index;
	}

	private findEventCalIndexById(id: string) {
		let index = -1;
		for (let i = 0; i < this.eventsCalendar.length; i++) {
			if (id === this.eventsCalendar[i].id) {
				index = i;
				break;
			}
		}
		return index;
	}

	getMonthCalendarView(): string {
		if (this.currentView.type === 'dayGridWeek') return 'date';
		else return 'month';
	}
}

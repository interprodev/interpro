import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { PermissionsService } from '@iterpro/shared/data-access/permissions';
import {
	CalendarEventMouseOver, ClubApi,
	Customer,
	Event,
	EventApi,
	InjuryApi,
	LoopBackAuth,
	MedicalEvent,
	MedicalFieldType,
	MedicalTreatment,
	MedicalTreatmentApi,
	Player,
	PlayerApi,
	ResultWithQueueMessage,
	Team,
	TeamSeason,
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
	DEFAULT_PERSON_IMAGE_BASE64,
	EditModeService,
	ErrorService,
	EventToHtmlService,
	InjuryService,
	ReportService,
	ToServerEquivalentService,
	copyValue,
	getMomentFormatFromStorage,
	getPDFv2Path,
	handleQueuePlayerRecalculationAlerts
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, isEqual, sortBy, uniq } from 'lodash';
import * as moment from 'moment';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { SelectItem } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable, forkJoin, of } from 'rxjs';
import { finalize, first, map, take } from 'rxjs/operators';
import Tooltip from 'tooltip.js';
import { MedicalRecordsViewType } from '../../../prevention/prevention.component';
import {
	EventViewerComponent,
	SaveEventViewerEmitter
} from '../../../../../manager/planning/event-viewer/event-viewer.component';
import { EventPaletteService } from '../../../../../manager/planning/services/event-palette.service';
import { PlanningService } from '../../../../../manager/planning/services/planning.service';
import { CalendarDetailDialogComponent } from '../../../../../shared/calendar-detail-dailog/calendar-detail-dialog';

@UntilDestroy()
@Component({
	selector: 'iterpro-maintenance-calendar',
	templateUrl: './maintenance-calendar.component.html',
	styleUrls: ['./maintenance-calendar.component.css'],
	encapsulation: ViewEncapsulation.None
})
export class MaintenanceCalendarComponent implements OnInit, OnChanges {
	@Input() players: Player[] = [];
	@Input() customers: Customer[] = [];
	@Output() changeViewType: EventEmitter<MedicalRecordsViewType> = new EventEmitter<MedicalRecordsViewType>();

	@ViewChild(EventViewerComponent, { static: false }) child: EventViewerComponent;
	@ViewChild(FullCalendarComponent, { static: false }) calendar: FullCalendarComponent;

	// This is a workaround to make "eventLimitClick" work because fullCalendar lose "this" context in the callback
	readonly createOpenCellInfoDialogFn = this.openCellInfoDialog.bind(this);
	cellInfo: MoreLinkArg;

	public plugins = [momentPlugin, dayGridPlugin, interactionPlugin, listPlugin, timegridPlugin, resourceTimelinePlugin];
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
	public defaultView = 'dayGridMonth';
	public defaultDate: Date = new Date();
	public currentView: Pick<ViewApi, 'type' | 'title'> = { type: this.defaultView, title: '' };
	public events: Event[] = [];
	newEvent = false;
	public options = {
		players: [],
		author: []
	};
	eventTypeOptions: SelectItem[] = [
		{
			label: 'medical.infirmary.exam.exam',
			value: 'exam'
		},
		{
			label: 'prevention.treatments.physiotherapy',
			value: 'physiotherapy'
		},
		{
			label: 'prevention.treatments.sec',
			value: 'SeC'
		},
		{
			label: 'prevention.treatments.medicationSupplements',
			value: 'medicationSupplements'
		},
		{
			label: 'assessment',
			value: 'assessment'
		},
		{
			label: 'Others',
			value: 'other'
		}
	];
	public filters = {
		player: [],
		author: [],
		types: []
	};
	public hasNext = false;
	public hasPrev = false;
	public event: Event;
	public testList: Test[];
	public updatedDate: Date;

	private additionalInfo: Map<string, any> = new Map<string, any>();
	private tooltip: Tooltip;
	private eventsCalendar: EventInput[];
	private sortedEvents: Event[];
	private sortedEventsIndex = 0;
	private calendarDateRange: { start: Date; end: Date };
	@BlockUI('general') blockCalendarUI: NgBlockUI;
	firstLoad = true;
	medicalRecordsViewType: MedicalRecordsViewType = MedicalRecordsViewType.Calendar;
	medicalRecordsViewTypes = MedicalRecordsViewType;
	allTeams: Team[];
	prefilledPlayerIds: string[] = [];

	calendarOptions: CalendarOptions = {
		dayMaxEventRows: 4,
		moreLinkClick: this.createOpenCellInfoDialogFn,
		plugins: this.plugins,
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
		locales: [esLocale, frLocale, deLocale, itLocale, jpLocale, ptLocale, trLocale, ruLocale],
		locale: this.getFullCalendarTranslation(this.auth.getCurrentUserData().currentLanguage),
		dateClick: this.handleDayClick.bind(this),
		eventClick: this.select.bind(this),
		eventMouseEnter: this.showEventTooltip.bind(this),
		eventMouseLeave: this.disposeEventTooltip.bind(this),
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
	currentTeam: Team;
	confirmDeleteFlag: boolean;

	constructor(
		private injuryService: InjuryService,
		public editService: EditModeService,
		public auth: LoopBackAuth,
		private planningService: PlanningService,
		private eventApi: EventApi,
		private error: ErrorService,
		private eventService: EventToHtmlService,
		private eventPaletteService: EventPaletteService,
		private translate: TranslateService,
		private gd: CalendarService,
		private injuryApi: InjuryApi,
		private playerApi: PlayerApi,
		private medicalTreatmentApi: MedicalTreatmentApi,
		private testApi: TestApi,
		private clubApi: ClubApi,
		private notificationService: AlertService,
		private reportService: ReportService,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private authService: PermissionsService,
		private currentTeamService: CurrentTeamService,
		private azurePipe: AzureStoragePipe,
		private toServer: ToServerEquivalentService,
		private testInstanceApi: TestInstanceApi,
		private readonly dialogService: DialogService
	) {}

	ngOnInit() {
		this.updatedDate = this.defaultDate;
		this.getTests();
		this.currentTeam = this.currentTeamService.getCurrentTeam();
		this.clubApi.getTeams(this.currentTeam.clubId).subscribe({
			next: (teams: Team[]) => (this.allTeams = teams),
			error: (error: Error) => this.error.handleError(error)
		});
		this.translate.getTranslation(this.translate.currentLang).subscribe(x => {
			if (this.calendar) {
				this.calendar.options.buttonText = {
					today: this.translate.instant('today'),
					month: this.translate.instant('month'),
					week: this.translate.instant('week'),
					day: this.translate.instant('day'),
					list: this.translate.instant('list'),
					resourceTimelineDay: this.translate.instant('general.player')
				};
				this.calendar.options.allDayText = this.translate.instant('all-day');
			}
			this.eventTypeOptions = this.eventTypeOptions.map(({ label, value }) => ({
				label: this.translate.instant(label),
				value
			}));
		});
	}

	ngOnChanges() {
		this.options.players = this.getSelectablePlayers(this.players);
		this.options.author = this.getSelectableAuthors(this.customers);
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

	datesRender({ view }: { view: ViewApi }) {
		this.adjustCalendarHeight(view);
		this.currentView = { type: view.type, title: view.title };
		if (!isEqual(this.calendarDateRange, { start: view.currentStart, end: view.currentEnd })) {
			this.calendarDateRange = { start: view.currentStart, end: view.currentEnd };
			this.load(this.calendarDateRange);
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

	handleDayClick({ date: eventDate, resource }) {
		this.prefilledPlayerIds = [];
		const season = this.getSeasonForDate(eventDate);
		if (season) {
			const newEvent: Event = new Event({
				title: this.injuryService.getMedicalEventTitle(false, undefined, 'treatment'),
				start: eventDate,
				end: moment(eventDate).add(30, 'minutes').toDate(),
				format: 'medical',
				duration: 30,
				type: this.gd.getGD(eventDate),
				author: this.auth.getCurrentUserId(),
				allDay: false,
				teamSeasonId: season.id,
				teamId: this.currentTeamService.getCurrentTeam().id,
				playerIds: [],
				medicalType: 'treatment'
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

	select({ event }: { event: any }) {
		if (this.isForbiddenToAccess(event)) {
			return false;
		} else {
			this.event = cloneDeep(event.extendedProps.sourceEvent);
			this.updateSortedIndex();
			// this.editService.editMode = false;
			this.defaultDate = event.start;
			this.changeView(MedicalRecordsViewType.EventDetail);
		}
	}

	private isForbiddenToAccess(event): boolean {
		return (
			event.extendedProps.sourceEvent.format !== 'medical' &&
			!this.authService.canUserAccessToModule('planning', this.currentTeam).response
		);
	}

	changeView(viewType: MedicalRecordsViewType) {
		this.medicalRecordsViewType = viewType;
		this.changeViewType.emit(viewType);
	}

	closePanel(event?) {
		this.calendarOptions.initialDate = this.defaultDate;
		this.calendarOptions.initialView = this.currentView.type;
		this.event = copyValue(event);
		this.changeView(MedicalRecordsViewType.Calendar);
		this.newEvent = false;
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
				this.select({ event: { extendedProps: { sourceEvent: event } } });
			} else {
				this.cellInfo = null;
			}
		});
	}

	handleDeleteEvent(event: Event, relatedInstance?: boolean, type?: string) {
		this.delete(event, relatedInstance, type);
		this.closePanel();
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

		const obs = !this.additionalInfo.has(event.event.extendedProps.sourceEvent.id)
			? this.blockUiInterceptorService.disableOnce(
					this.planningService.getAdditionalInfo(event.event.extendedProps.sourceEvent)
				)
			: of(this.additionalInfo.get(event.event.extendedProps.sourceEvent.id));
		obs
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

	prev() {
		this.showSortedEvent(-1);
	}

	next() {
		this.showSortedEvent(1);
	}

	updateEvents() {
		this.renderEvents();
	}

	private renderEvents() {
		let filtered = this.eventsCalendar;
		if (this.filters.player && this.filters.player.length > 0)
			filtered = filtered.filter(event =>
				this.filters.player.some(id => event.extendedProps.sourceEvent.playerIds.includes(id))
			);
		if (this.filters.author && this.filters.author.length > 0)
			filtered = filtered.filter(event => this.filters.author.includes(event.extendedProps.sourceEvent.author));
		if (this.filters.types && this.filters.types.length > 0) {
			const obs$ = filtered.map(event => this.getEventDetailsObservable(event.extendedProps.sourceEvent));
			forkJoin(obs$)
				.pipe(
					untilDestroyed(this),
					first(),
					map((events: Event[]) => {
						return events.map(event => this.eventToCalendarEvent(event));
					})
				)
				.subscribe({
					next: (events: EventInput[]) => {
						filtered = events.filter(eventDetail => {
							const extractTypes = this.getExtractTypes(eventDetail.extendedProps.sourceEvent);
							return this.filters.types.find(value => {
								return (
									extractTypes.includes(value) ||
									(this.filters.types.includes('other') &&
										!extractTypes.includes('medicationSupplements') &&
										!extractTypes.includes('physiotherapy') &&
										!extractTypes.includes('SeC'))
								);
							});
						});
						this.calendarOptions.events = filtered;
						this.setTimelineResources(this.players);
					},
					error: (error: Error) => this.error.handleError(error)
				});
		} else {
			this.calendarOptions.events = filtered;
			this.setTimelineResources(this.players);
		}
	}
	/*
									filtered = events.filter(eventDetail => {
									const extractTypes = this.getExtractTypes(eventDetail.extendedProps.sourceEvent);
									return this.filters.types.find(value => {
										return (
											extractTypes.includes(value) ||
											(this.filters.types.includes('other') &&
												!extractTypes.includes('medicationSupplements') &&
												!extractTypes.includes('physiotherapy') &&
												!extractTypes.includes('SeC'))
										);
									});
								});
								this.calendarOptions.events = filtered;
								this.setTimelineResources(this.players);
	 */

	private setTimelineResources(players: Player[]) {
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
				const { id, displayName, downloadUrl } = (players || []).find(({ id }) => id === playerId);
				return {
					id,
					title: displayName,
					downloadUrl:
						downloadUrl && this.azurePipe.transform(downloadUrl)
							? this.azurePipe.transform(downloadUrl)
							: DEFAULT_PERSON_IMAGE_BASE64
				};
			});
		this.calendarOptions.resources = resources.filter(res => !!res);
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
			this.select({ event: { extendedProps: { sourceEvent: event } } });
		}
	}

	private renderTooltipEvent({ element, event }: CalendarEventMouseOver) {
		const content = this.eventService.toHtml(event, this.players, this.customers);
		// eslint-disable-next-line no-unused-expressions, @typescript-eslint/no-unused-expressions
		this.tooltip = new Tooltip(element, {
			placement: 'top',
			html: true,
			title: content
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
			this.tooltip.updateTitleContent(content);
		}
	}

	private getTests() {
		return this.testApi
			.find({
				where: {
					teamId: { inq: [this.auth.getCurrentUserData().currentTeamId, 'GLOBAL'] }
				},
				fields: ['id', 'name', 'medical']
			})
			.subscribe({
				next: (tests: Test[]) => (this.testList = sortBy(tests, 'name')),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private load({ start, end }: { start: Date; end: Date }) {
		if (!this.firstLoad) this.blockCalendarUI.start(this.translate.instant('spinner.planning.calendar'));
		this.blockUiInterceptorService
			.disableOnce(this.planningService.getEventList(start, end).pipe(first(), untilDestroyed(this)))
			.subscribe({
				next: (events: Event[]) => {
					this.firstLoad = false;
					this.events = events;
					this.eventsCalendar = events.map(event => this.eventToCalendarEvent(event));
					this.updateSortedEvents();
					this.renderEvents();
					this.updatedDate = moment(start).toDate();
					this.blockCalendarUI.stop();
				},
				error: (error: Error) => {
					this.blockCalendarUI.stop();
					this.error.handleError(error);
				}
			});
	}

	private getEventDetailsObservable(event: Event): Observable<Event> {
		if (event.format !== 'medical') {
			return of({ ...event, formatType: event.format === 'assessment' ? 'assessment' : 'other' });
		} else {
			return this.planningService.getAdditionalInfo(event);
		}
	}

	private updateSortedEvents() {
		this.sortedEvents = sortBy(this.events, 'start');
	}

	private eventToCalendarEvent(ev: Event): EventInput {
		// ev.start = ev.allDay ? this.toLocal.convert(ev.start) : ev.start;
		// ev.end = ev.allDay ? this.toLocal.convert(ev.end) : ev.end;
		const eCal: EventInput = {
			backgroundColor: this.eventPaletteService.getEventColor(ev),
			borderColor: this.eventPaletteService.getEventColor(ev),
			allDay: ev.allDay,
			start: moment(ev.start, 'MM/DD/YYYY HH:mm').toDate(),
			end: moment(ev.end, 'MM/DD/YYYY HH:mm').toDate(),
			id: ev.id,
			title: ev.title,
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

	// private openCellInfoDialog(cellInfo: CellInfo) {
	// 	this.cellInfo = cellInfo;
	// }

	private getSelectablePlayers(players: Player[] = []): SelectItem[] {
		return players.map(player => ({ label: player.displayName, value: player.id }));
	}

	private getSelectableAuthors(customers: Customer[] = []): SelectItem[] {
		return customers.map(({ firstName, lastName }) => ({
			label: `${firstName} ${lastName}`,
			value: `${firstName} ${lastName}`
		}));
	}

	private getExtractTypes(event: MedicalEvent): string[] {
		if ((event.medicalType as MedicalFieldType) === 'exam') {
			return ['exam'];
		} else {
			return (event.medicalTreatments || []).map(treatment => treatment.treatmentType);
		}
	}

	confirmDeleteInstance() {
		this.confirmDeleteFlag = true;
	}

	discard() {
		this.confirmDeleteFlag = false;
	}

	saveEvent(eventEmitted: SaveEventViewerEmitter) {
		const eventToSave = eventEmitted.event;
		eventToSave.teamId = this.auth.getCurrentUserData().currentTeamId;
		const isMultipleTreatments = eventToSave?.medicalTreatments?.length > 1;
		const instanceCategory = isMultipleTreatments ? null : eventToSave?.medicalTreatments?.[0]?.treatmentType;
		eventToSave.title = this.injuryService.getMedicalEventTitle(
			isMultipleTreatments,
			instanceCategory,
			'treatment',
			eventToSave.title
		);
		eventToSave.playerIds = uniq(eventToSave.playerIds);
		eventToSave.staffIds = uniq(eventToSave.staffIds);
		eventToSave.lastUpdateDate = new Date();
		if (eventEmitted.isNewAndDuplicate) {
			if (eventEmitted?.playerIdsApplyTo?.length > 0) {
				eventEmitted.playerIdsApplyTo.map(playerId => {
					const event = cloneDeep({ ...eventToSave, playerIds: [playerId] });
					this.createEvent(event, eventEmitted);
				});
			}
		} else {
			if (!eventToSave.id) {
				this.createEvent(eventToSave, eventEmitted);
			} else {
				this.updateEvent(eventToSave, eventEmitted);
			}
		}
	}
	private createEvent(event, eventEmitted: SaveEventViewerEmitter) {
		const isFromApplyTo = eventEmitted?.playerIdsApplyTo?.length > 0;
		const clonedEvent = cloneDeep(event);
		delete event?.medicalTreatments;
		delete event?.preventionExams;
		delete event?.injuryExams;
		this.eventApi
			.saveEvent(event, eventEmitted.notify)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (result: ResultWithQueueMessage) => {
					const updated = result.result;
					this.newEvent = true;
					this.events.push(updated);
					const eCal: EventInput = this.eventToCalendarEvent(updated);
					this.eventsCalendar.push(eCal);
					this.updateSortedEvents();
					if (!isFromApplyTo) {
						this.event = updated;
					}
					this.updateSortedIndex();
					this.changeView(MedicalRecordsViewType.EventDetail);
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

	private updateEvent(event, eventEmitted: SaveEventViewerEmitter) {
		const clonedEvent = cloneDeep(event);
		const index: number = this.findEventIndexById(event.id);
		delete event?.medicalTreatments;
		delete event?.preventionExams;
		delete event?.injuryExams;
		if (index >= 0) {
			this.eventApi
				.saveEvent(event, eventEmitted.notify)
				.pipe(first(), untilDestroyed(this))
				.subscribe(
					(result: ResultWithQueueMessage) => {
						const updated = result.result;
						this.events[index] = updated;
						this.eventsCalendar = this.events.map(event => this.eventToCalendarEvent(event));
						this.renderEvents();
						if (updated.testModel && !event.extendedProps.testInstance) this.createTestInstance(updated);
						if (this.newEvent) this.closePanel(event);
						this.notificationService.notify('success', 'navigator.planning', 'alert.recordUpdated', false);
						if (!environment.production) {
							handleQueuePlayerRecalculationAlerts(this.players, result, this.notificationService);
						}
						if (updated.format === 'medical') {
							this.updateMedicalTreatments({ ...clonedEvent, id: updated.id }, eventEmitted);
						}
					},
					(error: Error) => this.error.handleError(error)
				);
		}
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
				id: eventEmitted?.isNewAndDuplicate ? undefined : treatment?.id
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
						((this.event as MedicalEvent).medicalTreatments || []).filter(
							({ id }) => !treatmentsIdsToDelete.includes(id)
						);
					},
					error: (err: Error) => {
						this.error.handleError(err);
					}
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
			.subscribe(
				(x: any) => {},
				(error: Error) => this.error.handleError(error)
			);
	}

	private findEventIndexById(id: string): number {
		return this.events.findIndex(event => id === event.id);
	}

	isMedicalAssessment(event: Event): boolean {
		return event.format === 'assessment' && this.testList.find(({ id }) => event.testModel === id).medical;
	}

	downloadReport() {
		if (this.currentView.type === 'resourceTimelineDay') {
			this.downloadResourceDailyTimelineReport();
			return;
		}
		const dates = {};
		// @ts-ignore
		this.calendarOptions.events.forEach(event => {
			const date = moment(event.extendedProps.sourceEvent.start);
			const key = date.format('dddd DD MMMM');
			if (!dates[key]) dates[key] = [];
			dates[key].push(event);
		});

		const datesArr = Object.keys(dates)
			.sort()
			.map(keyDate => ({
				title: keyDate,
				date: keyDate,
				events: sortBy(dates[keyDate], 'start').map(event => {
					const player = this.players.find(({ id }) => id === event.extendedProps.sourceEvent.playerIds[0]);
					return {
						...event,
						start: moment(event.start).format('HH:mm'),
						end: moment(event.end).format('HH:mm'),
						player: event.extendedProps.sourceEvent.format === 'medical' ? (player ? player.displayName : null) : null,
						author: this.planningService.getCustomerName(event.author, this.customers),
						location: null // this.getMedicalLocation(event)
					};
				})
			}));

		const data = {
			title: this.currentView.title,
			dates: datesArr
		};
		this.reportService.getReport('planning_list_maintenance', data);
	}

	gotoDate(date: Date) {
		if (this.calendar) {
			const calendarApi = this.calendar.getApi();
			calendarApi.gotoDate(date); // call a method on the Calendar object
		}
	}

	downloadResourceDailyTimelineReport() {
		const report: TimelineDailyViewPDF = {
			header: {
				title: this.translate.instant(`navigator.medicalRecords2`).toUpperCase(),
				subTitle: 'PLAYER VIEW'
			},
			metadata: {
				createdLabel: `${this.translate.instant('general.createdOn')} ${moment(new Date()).format(
					`${getMomentFormatFromStorage()} hh:mm`
				)}`
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
				locales: this.calendarOptions.locales,
				initialDate: this.toServer.convert(this.updatedDate)
			},
			list: []
		};
		// @ts-ignore
		this.calendarOptions.resources.map(({ id, title }) => {
			// @ts-ignore
			const resourceEvents = this.calendarOptions.events.filter(({ resourceIds }) => resourceIds.includes(id));
			const mappedEvents = resourceEvents.map(event => ({
				...event,
				start: moment(event.start).format('HH:mm'),
				end: moment(event.end).format('HH:mm')
			}));
			report.list.push({ resourceName: title, events: mappedEvents });
		});
		this.reportService.getReport(getPDFv2Path('calendar', 'calendar_daily_timeline', false), report);
	}

	private delete(event: MedicalEvent, relatedInstance?: boolean, type?: string) {
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
}

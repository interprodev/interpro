import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Customer, Event, EventApi, Injury, MedicalTreatment, Player } from '@iterpro/shared/data-access/sdk';
import { BodyChartComponent } from '@iterpro/shared/ui/components';
import {
	ANATOMICAL_DETAILS,
	ANATOMICAL_DETAILS_LATIN,
	AlertService,
	ConstantService,
	ErrorService,
	INJURY_STATUSES,
	INJURY_STATUSES_LABELS,
	InjuryStatusColor,
	InjuryStatusLabel,
	OSICS,
	OsicsService,
	ReportService,
	TINY_EDITOR_OPTIONS,
	ToServerEquivalentService,
	convertInjuryFields,
	getMomentFormatFromStorage,
	getPDFv2Path,
	injuryCategories,
	injuryIssues,
	injuryMechanism,
	injuryOccurrence,
	injurySeverity,
	injurySystems,
	parseHtmlStringToText,
	sortByName,
	EditModeService
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { cloneDeep, sortBy } from 'lodash';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { ConfirmationService, MenuItem, SelectItem } from 'primeng/api';
import { map } from 'rxjs/operators';
import { DetailsReportService, InjuryDetailReportPDF } from './injury-details-report.service';
import { Router } from '@angular/router';

@UntilDestroy()
@Component({
	selector: 'iterpro-injury-details',
	templateUrl: './injury-details.component.html',
	styleUrls: ['./injury-details.component.css']
})
export class InjuryDetailsComponent implements OnInit, OnChanges {
	daysFromEnd: number;
	daysFromReturn: number;
	injuryDuration: number;
	daysFromInjury: number;
	newDateBigger: boolean;
	@Input() customers: Customer[];
	@Input() player: Player;
	@Input() injury: Injury;
	@Input() injuryMedicalTreatments: MedicalTreatment[];
	@Input() editFlag: boolean;
	@Input() updateDate: boolean;
	@Input() newInj: boolean;

	@Output() updateDateChange: EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output() deleteEmitter: EventEmitter<Injury> = new EventEmitter<Injury>();
	@Output() discardEmitter: EventEmitter<Injury> = new EventEmitter<Injury>();
	@Output() saveEmitter: EventEmitter<[Injury, boolean, boolean]> = new EventEmitter<[Injury, boolean, boolean]>();
	// @Output() injuryDateChanged: EventEmitter<[Injury, boolean]> = new EventEmitter<[Injury, boolean]>();

	@ViewChild('bodyChart', { static: false }) bodyChart: BodyChartComponent;

	issue: SelectItem[] = [];
	system: SelectItem[] = [];
	reinjury: SelectItem[] = [];
	category: SelectItem[] = [];
	contact: SelectItem[] = [];
	mechanism: SelectItem[] = [];
	occurrence: SelectItem[] = [];
	severity: SelectItem[] = [];
	statusList: SelectItem[] = [];
	locationOptions: SelectItem[] = [];
	typeOptions: SelectItem[] = [];
	anatomicalDetails: SelectItem[] = [];

	editItems: MenuItem[];
	saveItems: MenuItem[];

	durationArr: any[];
	changeInjuryDateFlag = false;
	temp: Injury;
	currentStatus: any;
	today: Date;
	oldDate: Date;
	time: moment.Moment;
	hour: number;
	minute: number;
	displayOSIICS = false;
	osiicsList: OSICS[] = [];
	protected readonly tinyEditorInit = TINY_EDITOR_OPTIONS;
	events: Event[];
	eventsItems: SelectItem[];

	// private updateDateFlag: boolean = false;

	constructor(
		private router: Router,
		private notificationService: AlertService,
		private confirmationService: ConfirmationService,
		private editService: EditModeService,
		private reportService: ReportService,
		private translate: TranslateService,
		private preventionConstantService: ConstantService,
		private detailsReportService: DetailsReportService,
		private osicsService: OsicsService,
		private eventApi: EventApi,
		private errorService: ErrorService,
		private toServer: ToServerEquivalentService
	) {}

	ngOnInit() {
		this.today = new Date();
		this.editService.editMode = false;
		this.getDropdownList();
		this.getOsicsList();
	}

	ngOnChanges(changes: SimpleChanges) {
		this.changeInjuryDateFlag = false;
		if (changes['injury'] && changes['injury'].currentValue && changes['injury'].firstChange !== true) {
			this.injury = convertInjuryFields(this.injury);
			this.temp = !this.newInj ? cloneDeep(changes['injury'].currentValue) : null;
			this.oldDate = !this.newInj ? this.temp.date : null;
			this.getPhaseDuration(changes['injury'].currentValue);
			this.currentStatus = changes['injury'].currentValue.currentStatus;
			this.getDurations();
			this.getEvents();
		}
	}

	private getEvents() {
		const startCondition = { start: { lte: this.toServer.convert(moment().endOf('day').toDate()) } };
		// this.newInj || !this.injury.date
		// 	? { start: { lte: this.toServer.convert(moment().endOf('day').toDate()) } }
		// 	: {
		// 			and: [
		// 				{ start: { gte: this.toServer.convert(moment(this.injury.date).startOf('day').toDate()) } },
		// 				{ start: { lte: this.toServer.convert(moment(this.injury.date).endOf('day').toDate()) } }
		// 			]
		// 	  };
		const where = {
			teamId: this.player.teamId,
			format: { in: ['training', 'game', 'clubGame'] },
			...startCondition
		};
		this.eventApi
			.find({
				where,
				fields: ['id', 'start', 'title', 'format', 'playerIds', '_playerMatchStats']
			})
			.pipe(
				map((events: Event[]) => {
					this.events = sortBy(
						events.filter(event => this.isInEvent(event, this.player)),
						'start'
					).reverse();
					const filtered = this.events.filter(
						({ start }) =>
							(this.injury.date && moment(start).isSame(moment(this.injury.date), 'day')) ||
							((!this.injury.date || this.newInj) && moment(start).isAfter(moment().subtract(1, 'year'), 'day'))
					);
					this.toSelectItems(filtered);
				}),
				untilDestroyed(this)
			)
			.subscribe({
				error: (error: Error) => this.errorService.handleError(error)
			});
	}

	private isInEvent({ playerIds, _playerMatchStats }: Event, { id }: Player): boolean {
		return (
			playerIds.includes(id) ||
			_playerMatchStats
				.filter(({ enabled }) => enabled)
				.map(({ playerId }) => playerId)
				.includes(id)
		);
	}

	onEventSelected({ value }) {
		const event = this.events.find(({ id }) => id === value);
		this.injury.date = event.start;
	}

	onClear() {
		this.toSelectItems(this.events);
	}

	private filterEventsByInjuryDate() {
		const filtered = this.events.filter(({ start }) => moment(start).isSame(this.injury.date, 'day'));
		this.toSelectItems(filtered);
	}

	private toSelectItems(events: Event[]) {
		this.eventsItems = events.map(({ id, title, start }) => ({
			value: id,
			label: `${moment(start).format(getMomentFormatFromStorage())} - ${title}`
		}));
	}

	getDurations() {
		this.daysFromInjury = moment(this.today).add(1, 'day').diff(this.injury.date, 'day');
		if (this.injury.endDate)
			this.injuryDuration = moment(this.injury.endDate).add(1, 'day').diff(this.injury.date, 'day');
		if (this.injury.expectedReturn)
			this.daysFromReturn = moment(this.injury.expectedReturn).add(1, 'day').diff(this.today, 'day');
		if (this.injury.endDate) this.daysFromEnd = moment(this.today).add(1, 'day').diff(this.injury.endDate, 'day');
	}

	// This is called when 'clear' button of calender "Expected Recovery" is clicked
	onClearDate(e) {
		this.daysFromReturn = 0;
	}

	private getPhaseDuration(injury) {
		this.durationArr = [];
		let diff;
		for (const i in injury.statusHistory) {
			const i2: number = parseInt(i, 10) + 1;
			diff =
				i2 !== injury.statusHistory.length
					? moment(injury.statusHistory[i2].date).diff(moment(injury.statusHistory[i].date), 'days') + ' days'
					: moment().diff(moment(injury.statusHistory[i].date), 'days') + ' days';
			this.durationArr.push(diff);
		}
	}

	isNotEditable(injury) {
		return (
			injury && (injury.currentStatus === 'medical.infirmary.details.statusList.healed' || this.editFlag === false)
		);
	}

	confirmDelete(e: Injury) {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.delete'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				this.delete();
			}
		});
	}

	confirmEdit(e: Injury) {
		if (!this.injury.issue) {
			this.notificationService.notify('warn', 'medical.infirmary', 'alert.injuryIssueRequired', false);
		} else if (!this.injury.location) {
			this.notificationService.notify('warn', 'medical.infirmary', 'alert.injuryLocationRequired', false);
		} else {
			if (this.injury.id) {
				if (this.changeInjuryDateFlag === false) {
					this.confirmationService.confirm({
						message: this.translate.instant('confirm.edit'),
						header: this.translate.instant('confirm.title'),
						icon: 'fa fa-question-circle',
						accept: () => {
							this.onSaveTrigger(false, this.newDateBigger);
						}
					});
				} else {
					this.confirmationService.confirm({
						message: this.translate.instant('confirm.injuryHistoryLoss'),
						header: this.translate.instant('confirm.title'),
						icon: 'fa fa-question-circle',
						accept: () => {
							this.onSaveTrigger(true, this.newDateBigger);
						}
					});
				}
			} else {
				this.onSaveTrigger();
			}
		}
	}

	onEditTrigger() {
		if (this.injury.currentStatus !== 'medical.infirmary.details.statusList.healed') {
			this.editFlag = true;
			this.editService.editMode = true;
		} else {
			this.notificationService.notify('warn', 'medical.infirmary', 'alert.injuryEditForbidden', false);
		}
	}

	private onSaveTrigger(val?: boolean, newDate?: boolean) {
		this.saveEmitter.emit([this.injury, val, newDate]);
	}

	private delete() {
		this.deleteEmitter.emit(this.injury);
		this.injury = null;
	}

	onDiscardTrigger() {
		this.injury = cloneDeep(this.temp);
		this.editService.editMode = false;
		this.changeInjuryDateFlag = false;
		this.discardEmitter.emit(this.injury);
	}

	/**
	 * Redirecting to Medical > Prevention > Selecetd Player (Passed injury.playerId)
	 * @param injury : Injury details of selected player.
	 */
	getPreventionLink(injury: Injury) {
		const url = '/medical/maintenance';
		let params = {};
		if (injury) {
			params = {
				id: injury.playerId
			};
		}

		return [url, params];
	}

	onHandleStatusChange(e) {
		if (e.value === 'medical.infirmary.details.statusList.healed') this.confirmHealed(e);
		else {
			this.currentStatus = e.value;
			this.updateDate = true;
			this.updateDateChange.emit(this.updateDate);
		}
	}

	confirmHealed(e) {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.healed'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				this.injury.endDate = moment().toDate();
				this.getDurations();
				this.updateDate = true;
				this.updateDateChange.emit(this.updateDate);
			},
			reject: () => {
				this.injury.currentStatus = this.currentStatus;
			}
		});
	}

	private getDropdownList() {
		this.locationOptions = this.preventionConstantService
			.getLocations()
			.map(x => ({ label: this.translate.instant(x.label), value: x.value }));
		this.locationOptions = sortByName(this.locationOptions, 'label');
		this.typeOptions = this.preventionConstantService
			.getTypes()
			.map(x => ({ label: this.translate.instant(x.label), value: x.value }));
		this.typeOptions = sortByName(this.typeOptions, 'label');

		this.issue = injuryIssues.map(x => ({ label: this.translate.instant(x.label), value: x.value }));
		this.system = injurySystems.map(x => ({ label: this.translate.instant(x.label), value: x.value }));
		this.category = injuryCategories.map(x => ({ label: this.translate.instant(x.label), value: x.value }));
		this.mechanism = injuryMechanism.map(x => ({ label: this.translate.instant(x.label), value: x.value }));
		this.occurrence = injuryOccurrence.map(x => ({ label: this.translate.instant(x.label), value: x.value }));
		this.severity = injurySeverity.map(x => ({ label: this.translate.instant(x.label), value: x.value }));
		this.statusList = INJURY_STATUSES.map(({ label }) => ({ label: this.translate.instant(label), value: label }));

		this.reinjury.push(
			{
				label: this.translate.instant('medical.infirmary.details.reInjury.yes'),
				value: 'medical.infirmary.details.reInjury.yes'
			},
			{
				label: this.translate.instant('medical.infirmary.details.reInjury.no'),
				value: 'medical.infirmary.details.reInjury.no'
			}
		);

		this.contact.push(
			{
				label: this.translate.instant('medical.infirmary.details.contact.yes'),
				value: 'medical.infirmary.details.contact.yes'
			},
			{
				label: this.translate.instant('medical.infirmary.details.contact.no'),
				value: 'medical.infirmary.details.contact.no'
			}
		);

		// For english and german language, use english version of anatomical details and for others use latin file.
		let anatomicalDetails =
			this.translate.currentLang === 'en-US' || this.translate.currentLang === 'de-DE'
				? ANATOMICAL_DETAILS
				: ANATOMICAL_DETAILS_LATIN;
		anatomicalDetails = sortByName(anatomicalDetails, 'label');
		// remove duplicates
		this.anatomicalDetails = Array.from(anatomicalDetails.reduce((m, t) => m.set(t.value, t), new Map()).values());
	}

	getBackgroundColor(status: InjuryStatusLabel) {
		const color: InjuryStatusColor = INJURY_STATUSES.find(({ label }) => label === status)?.color;
		return { 'background-color': color };
	}

	getReport() {
		const bodyChartStyle = this.bodyChart.getCurrentStyle('report');
		const bodyChartLegend = this.bodyChart.getLegendConfiguration();
		const data: InjuryDetailReportPDF = this.detailsReportService.getReportData(
			this.customers,
			this.player,
			this.injury,
			this.injuryMedicalTreatments,
			this.durationArr,
			bodyChartStyle,
			bodyChartLegend
		);
		this.reportService.getReport(
			getPDFv2Path('infirmary', 'injury_details_new', false),
			Object.assign(data),
			'positions.HoM',
			null,
			`${this.player.displayName} - Injury Report`
		);
	}

	changeInjuryDate(e: Date): void {
		this.changeInjuryDateFlag = true;
		this.newDateBigger = moment(e) < moment(this.oldDate);
		this.filterEventsByInjuryDate();
		this.getDurations();
	}

	getDisabledClass(status: InjuryStatusLabel): string | null {
		return status === INJURY_STATUSES_LABELS.Healed ? 'disabled' : null;
	}

	getTime(): string {
		return moment(this.injury.date).format('HH:mm');
	}

	onTimeChanged(time: string) {
		this.injury.date = moment(this.injury.date)
			.set('hour', parseInt(time.split(':')[0], 10))
			.set('minute', parseInt(time.split(':')[1], 10))
			.toDate();
	}

	/**
	 * On click of Download csv button player data get downloaded in csv format.
	 */
	downloadCsv() {
		const details = [];
		const singleObj = {};
		let injuryType = '';
		let injurySystem = '';

		// Handling Type of injury that can be more that one value(Array) selected by user.
		for (let i = 0; i < (this.injury.type ? this.injury.type.length : 0); i++) {
			injuryType += this.injury.type[i].split('.').reverse()[0];

			if (i !== this.injury.type.length - 1) injuryType += ' , ';
		}

		// Handling System of injury that can be more that one value(Array) selected by user.
		for (let i = 0; i < (this.injury.system ? this.injury.system.length : 0); i++) {
			injurySystem += this.injury.system[i].split('.').reverse()[0];

			if (i !== this.injury.system.length - 1) injurySystem += ' , ';
		}

		singleObj['displayName'] = this.player.displayName;
		singleObj['issue'] = this.injury.issue ? this.injury.issue.split('.').reverse()[0] : this.injury.issue;
		singleObj['type'] = injuryType === '' ? this.injury.type : injuryType;
		singleObj['date'] = moment(this.injury.date).format(getMomentFormatFromStorage());
		singleObj['admissionDate'] = this.injury.admissionDate
			? moment(this.injury.admissionDate).format(getMomentFormatFromStorage())
			: null;
		singleObj['osics'] = this.injury.osics;
		singleObj['osicsDiagnosis'] = this.osicsService.getOSICSDiagnosis(this.injury.osics);
		singleObj['expectedReturn'] = this.injury.expectedReturn
			? moment(this.injury.expectedReturn).format(getMomentFormatFromStorage())
			: null;
		singleObj['endDate'] = this.injury.endDate
			? moment(this.injury.endDate).format(getMomentFormatFromStorage())
			: null;
		singleObj['system'] = injurySystem === '' ? this.injury.system : injurySystem;
		singleObj['location'] = this.injury.location.split('.').reverse()[0];
		singleObj['anatomicalDetails'] = this.injury.anatomicalDetails;
		singleObj['reinjury'] = this.injury.reinjury;
		singleObj['category'] = this.injury.category ? this.injury.category.split('.').reverse()[0] : this.injury.category;
		singleObj['mechanism'] = this.injury.mechanism
			? this.injury.mechanism.split('.').reverse()[0]
			: this.injury.mechanism;
		singleObj['occurrence'] = this.injury.occurrence
			? this.injury.occurrence.split('.').reverse()[0]
			: this.injury.occurrence;
		singleObj['severity'] = this.injury.severity ? this.injury.severity.split('.').reverse()[0] : this.injury.severity;
		singleObj['diagnosis'] = parseHtmlStringToText(this.injury.diagnosis);
		singleObj['notes'] = parseHtmlStringToText(this.injury.notes);
		singleObj['currentStatus'] = this.injury.currentStatus
			? this.injury.currentStatus.split('.').reverse()[0]
			: this.injury.currentStatus;
		singleObj['surgery'] = this.injury.surgery;
		singleObj['treatmentInstructions'] = parseHtmlStringToText(this.injury.treatInstruction);
		singleObj['daysFromInjury'] = this.daysFromInjury;
		singleObj['daysFromReturn'] = this.daysFromReturn;
		singleObj['daysInCurrentStatus'] = moment(this.today).diff(
			moment(
				this.injury.statusHistory && this.injury.statusHistory.length > 0
					? this.injury.statusHistory[this.injury.statusHistory.length - 1].date
					: this.today
			),
			'day'
		);

		details.push(singleObj);
		const results = Papa.unparse(details, {});
		const fileName = `Injury Details - ${this.player.displayName} - ${moment(this.injury.date).format(
			getMomentFormatFromStorage()
		)} - ${this.injury.location.split('.').reverse()[0]}.csv`;

		const blob = new Blob([results], { type: 'text/csv;charset=utf-8' });
		saveAs(blob, fileName);
	}

	// Tooptip for currentstatus(Therapy/Rehab/Reconditioning/Return to play/Return to game/healed) dropdown
	getCurrentStatusTooltip() {
		return `${this.currentStatus}.tooltip`;
	}

	showOSICSDialog() {
		this.displayOSIICS = true;
	}

	onSaveOsiics(event: any) {
		this.injury = {
			...this.injury,
			osics: event?.code
		};
		this.displayOSIICS = false;
	}

	onDiscardOsiics() {
		this.displayOSIICS = false;
	}

	private getOsicsList() {
		this.osiicsList = this.osicsService.getOSICSList();
	}

	onChangeLocation({ value: location }: SelectItem) {
		this.injury = { ...this.injury, location };
	}

	//#region Redirect To Planning
	async goToPlanning() {
		const { eventId } = this.injury;
		if (eventId) {
			const event = this.events.find(({ id }) => id === eventId);
			const { start } = event;
			await this.router.navigate(['/manager/planning', { id: eventId, start }]);
		}
	}

	//endregion
}

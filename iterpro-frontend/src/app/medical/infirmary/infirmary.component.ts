import { Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import {
	ClubApi,
	Customer,
	SearchPlayerDropdownElement,
	Injury,
	InjuryApi,
	LoopBackAuth,
	MedicalTreatment,
	MedicalTreatmentApi,
	Player
} from '@iterpro/shared/data-access/sdk';
import {
	ANATOMICAL_DETAILS,
	AlertService,
	CanComponentDeactivate,
	EditModeService,
	ErrorService,
	OsicsService,
	getMomentFormatFromStorage,
	isActiveAtDate,
	parseHtmlStringToText
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { flatten, last, sortBy } from 'lodash';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { Observable, Observer, Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { InfirmaryService } from './infirmary.service';
import { InjuredListComponent } from './injured-list/injured-list.component';


@UntilDestroy()
@Component({
	selector: 'iterpro-infirmary',
	templateUrl: './infirmary.component.html',
	styleUrls: ['./infirmary.component.css']
})
export class InfirmaryComponent implements CanComponentDeactivate, OnInit {

	selectedPlayer: Player;
	route$: Subscription;
	idParam: string;
	editExFlag = false;

	players: Player[];
	activeInjuries: Injury[] = [];
	allInjuries: Injury[] = [];
	addInjuryTrigger: boolean;

	@Output() csvUploadEmitter: EventEmitter<any> = new EventEmitter<any>();
	@ViewChild('inputjson', { static: false }) myInput: ElementRef;
	@ViewChild(InjuredListComponent, { static: false }) injuredListComponent: InjuredListComponent;
	fileReader: FileReader;
	searchDropdownElements: SearchPlayerDropdownElement[];
	isNew: boolean;
	selectedInjuryId: string;
	medicalTreatments: MedicalTreatment[];
	showListViewFilters: boolean;
	allPlayers: Player[];
	allInjuriesFromAllPlayers: Injury[];
	customers: Customer[];
	viewTypes: MenuItem[] = [
		{
			id: 'cardView',
			label: 'admin.squads.cardView',
			icon: 'fas fa-square-kanban',
			command: () => this.activeViewType = this.viewTypes[0]
		},
		{
			id: 'listView',
			label: 'admin.squads.tableView',
			icon: 'fas fa-list',
			command: () => this.activeViewType = this.viewTypes[1]
		},
		{
			id: 'reportView',
			label: 'medical.infirmary.tabs.report',
			icon: 'fas fa-id-card',
			command: () => this.activeViewType = this.viewTypes[2]
		}
	];
	activeViewType: MenuItem = this.viewTypes[0];

	constructor(
		private error: ErrorService,
		private confirmationService: ConfirmationService,
		public editService: EditModeService,
		private notificationService: AlertService,
		private translate: TranslateService,
		private route: ActivatedRoute,
		private injuryApi: InjuryApi,
		private infirmaryService: InfirmaryService,
		private osicsService: OsicsService,
		private medicalTreatmentApi: MedicalTreatmentApi,
		private clubApi: ClubApi,
		private auth: LoopBackAuth
	) {}

	@HostListener('window:beforeunload')
	canDeactivate() {
		if (this.editService.editMode === false && this.editExFlag === false) {
			return true;
		}

		return new Observable((observer: Observer<boolean>) => {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.editGuard'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.editService.editMode = false;
					this.editExFlag = false;
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

	ngOnInit() {
		this.route$ = this.route.paramMap.pipe(untilDestroyed(this)).subscribe((params: ParamMap) => {
			if (params['params']) {
				this.idParam = params['params'].id;
			} else {
				this.idParam = null;
			}
			params['params'] = null;
			this.addInjuryTrigger = false;
			this.getPlayers();
			this.getCustomers();
		});
	}

	private loadInjuriesMedicalTreatments(injuryIds: string[] = []) {
		this.medicalTreatments = [];
		const medicalRequest$ = this.medicalTreatmentApi.find({
			where: {
				injuryId: { inq: injuryIds }
			}
		});
		medicalRequest$.pipe(first(), untilDestroyed(this)).subscribe({
			next: (result: MedicalTreatment[]) => {
				this.medicalTreatments = result;
			},
			error: (error: Error) => this.error.handleError(error)
		});
	}

	private getPlayers() {
		this.infirmaryService.getPlayersObs().subscribe({
			next: (players: Player[]) => {
				const allInjuriesIdsFromActivePlayers: string[] = flatten(
					players.map(({ injuries }) => injuries.map(({ id }) => id))
				);
				this.loadInjuriesMedicalTreatments(allInjuriesIdsFromActivePlayers);
				players.forEach(player => {
					(player.injuries || []).forEach(injury => {
						injury.player = player;
					});
				});
				this.players = players.filter(player => isActiveAtDate(player, new Date()));
				this.searchDropdownElements = this.players.map(player => ({
					player,
					isTeam: false,
					team: null
				}));
				this.allPlayers = players;
				this.allInjuriesFromAllPlayers = flatten(this.allPlayers.map(({ injuries }) => injuries));
				this.activeInjuries = [];
				this.allInjuries = [];
				this.players.forEach(player => {
					this.getActiveInjuriesFromPlayer(player);
				});
				if (this.idParam) this.onSelectInjury(this.idParam);
			},
			error: (error: Error) => this.error.handleError(error)
		});
	}

	private getCustomers() {
		this.clubApi
			.getCustomers(this.auth.getCurrentUserData().clubId, { fields: ['firstName', 'lastName', 'id'] })
			.pipe(
				map(customers => (this.customers = customers)),
				untilDestroyed(this)
			)
			.subscribe({
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private getActiveInjuriesFromPlayer(player: Player) {
		player.injuries.forEach(injury => {
			if (injury.currentStatus !== 'medical.infirmary.details.statusList.healed') this.activeInjuries.push(injury);
			this.allInjuries.push(injury);
		});
	}

	onNewInjuryInserted() {
		this.isNew = false;
		this.notificationService.notify('success', 'medical.infirmary', 'alert.recordCreated', false);
		this.getPlayers();
	}

	onInjurySaved() {
		this.notificationService.notify('success', 'medical.infirmary', 'alert.recordUpdated', false);
		this.getPlayers();
	}

	onInjuryDeleted() {
		this.selectedPlayer = null;
		this.selectedInjuryId = null;
		this.notificationService.notify('success', 'medical.infirmary', 'alert.recordDeleted', false);
		this.getPlayers();
	}

	onNewInjuryDiscarded() {
		this.selectedPlayer = null;
		this.selectedInjuryId = null;
		this.isNew = false;
	}

	onAddInjury(player: Player) {
		this.selectedInjuryId = null;
		this.selectedPlayer = player;
		this.isNew = true;
	}

	onSelectInjury(injuryId: string) {
		this.idParam = null;
		const select = this.allInjuries.find(({ id }) => id === injuryId);
		this.selectedInjuryId = injuryId;
		this.selectedPlayer = select?.player;
	}

	triggerAddInjury() {
		this.addInjuryTrigger = !this.addInjuryTrigger;
		this.editService.editMode = this.addInjuryTrigger;
	}

	onSelectPlayerForNewInjury(playerId: string) {
		this.addInjuryTrigger = false;
		const player = this.players.find(({ id }) => id === playerId);
		this.onAddInjury(player);
	}

	onAddInjuryFromDetail() {
		this.onAddInjury({ ...this.selectedPlayer });
	}

	confirm(item: any) {
		if (!this.selectedInjuryId) {
			this.getPlayers();
		} else if (this.activeInjuries?.length > 0) {
			this.onSelectInjury(sortBy(this.activeInjuries, 'date')[0].id);
		}
	}

	editExamFlag(item: boolean) {
		this.editExFlag = item;
	}

	downloadEmptyCsv() {
		this.infirmaryService.downloadEmptyCSV();
	}

	onFileChange(element: any) {
		this.fileReader = new FileReader();
		this.fileReader.onload = () => this.handleFileLoad();
		this.fileReader.onerror = event => console.error(event);
		this.fileReader.readAsText(element.target.files[0]);
	}

	private handleFileLoad() {
		const csvRead = this.fileReader.result;
		const resultsCsv = Papa.parse(csvRead.toString(), {
			header: true,
			skipEmptyLines: true
		});

		const csvData = resultsCsv.data;
		const totalRowsLen = csvData.length;

		const uploadedInjuries = csvData.map(injuryCSV =>
			this.infirmaryService.getNewInjuryFromCSV(injuryCSV, this.players)
		);
		const uploadedRowsLen = uploadedInjuries.length;

		if (uploadedRowsLen > 0) {
			this.fileReader.onloadend = () => this.createInjuriesFromCSV(uploadedRowsLen, totalRowsLen, uploadedInjuries);
		} else {
			this.notificationService.notify('error', 'CSV Error', 'alert.csv.error', false);
		}

		this.myInput.nativeElement.value = '';
		this.csvUploadEmitter.emit();
	}

	private createInjuriesFromCSV(uploadedRowsLen: number, totalRowsLen: number, uploadedInjuries: Injury[]) {
		this.injuryApi
			.createMany(uploadedInjuries)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (injuries: Injury[]) => {
					if (totalRowsLen !== 0 && uploadedRowsLen === totalRowsLen) {
						this.notificationService.notify('success', 'medical.infirmary', 'alert.recordCreated', false);
					} else {
						this.notificationService.notify('error', 'CSV Error', 'alert.csv.error', false);
					}
					this.getPlayers();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	onSelectPlayerFromDropdown(value: SearchPlayerDropdownElement) {
		this.selectedInjuryId = null;
		this.selectedPlayer = value.player as Player;
	}

	downloadAllActiveInjuries() {
		this.downloadCSV(this.allInjuries, 'All Injuries List');
	}

	downloadActiveInjuries() {
		this.downloadCSV(this.activeInjuries, 'Active Injuries List');
	}

	downloadAllActiveInjuriesAllPlayers() {
		this.downloadCSV(this.allInjuriesFromAllPlayers, 'All Injuries From All Players List');
	}

	private getDetailLabel(detail): string {
		// This is the fix for IT-4918
		// because the software try to search in a list of anatomical location the value ‘General’
		const item = ANATOMICAL_DETAILS.find(({ value }) => value === detail)?.label;
		if (!item) {
			return detail;
		}
		return item;
	}

	private downloadCSV(injuries: Injury[], name: string) {
		const details = injuries.map(injury => {
			const injuryType = (injury.type || []).map(type => this.translate.instant(type)).join(', ');
			const injurySystem = (injury.system || []).map(system => this.translate.instant(system)).join(', ');
			const anatomicalDetails = (injury.anatomicalDetails || []).map(detail => this.getDetailLabel(detail)).join(', ');
			const lastAssessment = last(sortBy(injury._injuryAssessments, 'date'));

			const injuryRow = {
				displayName: this.allPlayers.find(({ id }) => injury.playerId === id).displayName,
				issue: injury.issue ? this.translate.instant(injury.issue) : injury.issue,
				type: injuryType === '' ? injury.type : injuryType,
				date: moment(injury.date).format(getMomentFormatFromStorage()),
				admissionDate: injury.admissionDate ? moment(injury.admissionDate).format(getMomentFormatFromStorage()) : null,
				osics: injury.osics,
				osicsDiagnosis: this.osicsService.getOSICSDiagnosis(injury.osics),
				expectedReturn: injury.expectedReturn
					? moment(injury.expectedReturn).format(getMomentFormatFromStorage())
					: null,
				endDate: injury.endDate ? moment(injury.endDate).format(getMomentFormatFromStorage()) : null,
				system: injurySystem === '' ? injury.system : injurySystem,
				location: injury.location ? this.translate.instant(injury.location) : null,
				anatomicalDetails: anatomicalDetails || injury.anatomicalDetails,
				reinjury: injury.reinjury
					? this.translate.instant(`medical.infirmary.details.reInjury.${injury.reinjury ? 'yes' : 'no'}`)
					: null,
				category: injury.category ? this.translate.instant(injury.category) : null,
				mechanism: injury.mechanism ? this.translate.instant(injury.mechanism) : null,
				occurrence: injury.occurrence ? this.translate.instant(injury.occurrence) : null,
				severity: injury.severity ? this.translate.instant(injury.severity) : null,
				diagnosis: parseHtmlStringToText(injury.diagnosis),
				notes: parseHtmlStringToText(injury.notes),
				currentStatus: injury.currentStatus ? this.translate.instant(injury.currentStatus) : null,
				surgery: injury.surgery,
				treatmentInstructions: parseHtmlStringToText(injury.treatInstruction),
				daysFromInjury: moment().add(1, 'day').diff(injury.date, 'day'),
				daysFromReturn: moment(injury.expectedReturn).add(1, 'day').diff(moment().toDate(), 'day'),
				daysInCurrentStatus: moment().diff(
					moment(
						injury.statusHistory && injury.statusHistory.length > 0
							? injury.statusHistory[injury.statusHistory.length - 1].date
							: moment().toDate()
					),
					'day'
				),
				lastAssessmentDate: lastAssessment?.date
					? moment(lastAssessment.date).format(getMomentFormatFromStorage())
					: null,
				lastAssessmentROM: lastAssessment?.rom ? this.translate.instant(lastAssessment.rom) : null,
				lastAssessmentStrength: lastAssessment?.strength ? this.translate.instant(lastAssessment.strength) : null,
				lastAssessmentStability: lastAssessment?.stability ? this.translate.instant(lastAssessment.stability) : null,
				lastAssessmentSwelling: lastAssessment?.swelling ? this.translate.instant(lastAssessment.swelling) : null,
				lastAssessmentPain: lastAssessment?.pain || null,
				lastAssessmentFunctionality: lastAssessment?.functionality || null,
				lastAssessmentNotes: lastAssessment?.notes || null,
				lastAssessmentNext: lastAssessment?.next
					? moment(lastAssessment.next).format(getMomentFormatFromStorage())
					: null,
				lastAssessmentHighPriority: lastAssessment?.highPriority || null,
				lastAssessmentAvailable: lastAssessment?.available ? this.translate.instant(lastAssessment.available) : null,
				lastAssessmentExpectation: lastAssessment?.expectation
					? moment(lastAssessment.expectation).format(getMomentFormatFromStorage())
					: null,
				lastAssessmentFurther: lastAssessment?.further || null
			};
			return injuryRow;
		});

		const results = Papa.unparse(details, {});
		const blob = new Blob([results], { type: 'text/csv;charset=utf-8' });
		saveAs(blob, `${name}.csv`);
	}

	downloadInjuredListPDF() {
		this.injuredListComponent.getListReportPDF();
	}

	protected readonly close = close;
}

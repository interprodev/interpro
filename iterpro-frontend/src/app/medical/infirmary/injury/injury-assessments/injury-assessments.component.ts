import {
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	SimpleChanges,
	ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import {
	Attachment,
	AzureStorageApi,
	Customer,
	Injury,
	InjuryApi,
	InjuryAssessment,
	InjuryExam,
	LoopBackAuth,
	NotificationApi
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	AzureStorageService,
	EditModeService,
	ErrorService,
	InjuryService,
	sortByDate
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { sortBy } from 'lodash';
import * as moment from 'moment';
import { ConfirmationService, MenuItem, SelectItem } from 'primeng/api';
import { Observable, forkJoin, of } from 'rxjs';
import { exhaustMap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'iterpro-injury-assessments',
	templateUrl: './injury-assessments.component.html',
	styleUrls: ['./injury-assessments.component.css']
})
export class InjuryAssessmentComponent implements OnInit, OnChanges, OnDestroy {
	new: boolean;
	@ViewChild('inputTreatment', { static: false }) myInput: ElementRef;

	time: moment.Moment;
	tempExam: InjuryExam;

	// INPUTS
	@Input() injury: Injury;
	@Input() items: MenuItem[];
	@Input() editFlagAss: boolean;
	@Input() customers: Customer[];

	// OUTPUTS
	@Output() deleteClicked: EventEmitter<any> = new EventEmitter<any>();
	@Output() saveClicked: EventEmitter<any> = new EventEmitter<any>();
	@Output() editClicked: EventEmitter<boolean> = new EventEmitter<any>();

	assessments!: InjuryAssessment[];

	today: Date;
	tomorrow: Date;
	exams: InjuryExam[];
	selectedExam: InjuryExam;
	assessment: InjuryAssessment;
	editFlag = false;
	levelItem: SelectItem[] = [];
	swellingItem: SelectItem[] = [];
	downloadUrl: string;
	attach: Attachment;
	selectedRow: number;
	available: any = 'yes';
	teamId: string;

	hour: any;
	minute: any;
	selectedExamToDelete: any;
	confirmDeleteFlag: boolean;

	private attachedFile: File;
	currentUserId: string;

	constructor(
		private auth: LoopBackAuth,
		private error: ErrorService,
		private authService: LoopBackAuth,
		private injuryApi: InjuryApi,
		private notificationService: AlertService,
		private confirmationService: ConfirmationService,
		private editService: EditModeService,
		private azureStorageApi: AzureStorageApi,
		private translate: TranslateService,
		private notificationsApi: NotificationApi,
		private injuryService: InjuryService,
		private azureStorageService: AzureStorageService,
		private readonly router: Router
	) {
		this.today = moment().toDate();
		this.tomorrow = moment().add(24, 'hour').toDate();
	}

	ngOnDestroy() {
		this.attachedFile = undefined;
	}

	ngOnInit() {
		this.editFlag = false;
		this.editFlagAss = false;
		this.editService.editMode = false;
		this.teamId = this.authService.getCurrentUserData().currentTeamId;
		this.currentUserId = this.authService.getCurrentUserId();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['injury']) {
			if (changes['injury'].currentValue) {
				this.injury = changes['injury'].currentValue;
				this.assessment = null;
				this.getAssessmentList(this.injury);
				this.injury._injuryExams = sortByDate(this.injury._injuryExams, 'date').reverse();
			} else {
				this.assessment = null;
			}
		}
	}

	private getAssessmentList(injury: Injury) {
		this.assessments = sortBy(injury._injuryAssessments, 'date').reverse();
	}

	confirmAddNewAssessment(assessment: InjuryAssessment) {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.edit'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				this.addNewAssessment(assessment);
			}
		});
	}

	checkAvailable(assessment: InjuryAssessment) {
		this.assessment.further = assessment.available === 'no';
	}

	private addNewAssessment(assessment: InjuryAssessment) {
		this.assessments.push(assessment);
	}

	/**
	 * Redirecting to Medical > Prevention > Selected Player (Passed injury.playerId)
	 * @param injury : Injury details of selected player.
	 */
	goToInjuryPrevention(): void {
		const url = '/medical/maintenance';
		this.router.navigate([url, { id: this.injury.playerId }]);
	}

	/**
	 * Step to confirm delete assessment [Event Emitter]
	 * @param assessment
	 */
	confirmDeleteAssessment(assessment: InjuryAssessment): void {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.delete'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				this.deleteAssessment(assessment);
			}
		});
	}

	/**
	 * Actually deleting assessment
	 * @param assessment
	 */
	deleteAssessment(assessment: InjuryAssessment): void {
		this.injuryApi
			.destroyByIdInjuryAssessments(this.injury.id, assessment.id)
			.pipe(untilDestroyed(this))
			.subscribe(
				(ass: InjuryAssessment) => {
					this.deleteClicked.emit(ass);
					const index = this.injury._injuryAssessments.findIndex(({ id }) => id === assessment.id);
					if (index > -1) {
						if (this.injury._injuryAssessments.length === 1) {
							this.injury._injuryAssessments = [];
						} else {
							this.injury._injuryAssessments.splice(index, 1);
						}
						this.injury._injuryAssessments = this.injury._injuryAssessments.slice();
					}
					this.getAssessmentList(this.injury);
				},
				(error: Error) => this.error.handleError(error),
				() => this.notificationService.notify('success', 'medical.infirmary', 'alert.recordDeleted', false)
			);
	}

	/**
	 * Confirm dialog to save the assessment
	 * @param assessment */
	confirmSaveAssessment(assessment: InjuryAssessment) {
		if (assessment.id) {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.edit'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => this.saveAssessment(assessment)
			});
		} else {
			this.saveAssessment(assessment); // NEW ASSESSMENT
		}
	}

	/**
	 * Actually save the assessment
	 * @param assessment
	 */
	private saveAssessment(assessment: InjuryAssessment) {
		let obs: Observable<InjuryAssessment>;
		const index: number = this.injury._injuryAssessments.findIndex(({ id }) => id === assessment.id);
		if (assessment.id) {
			obs = this.injuryApi.updateByIdInjuryAssessments(this.injury.id, assessment.id, assessment);
		} else {
			obs = this.injuryApi.createInjuryAssessments(this.injury.id, assessment);
		}

		obs.pipe(untilDestroyed(this)).subscribe(
			(ass: InjuryAssessment) => {
				if (index >= 0) {
					this.injury._injuryAssessments[index] = ass;
					this.injury._injuryAssessments = this.injury._injuryAssessments.slice();
				} else {
					this.injury._injuryAssessments = [...this.injury._injuryAssessments, ass];
				}

				this.getAssessmentList(this.injury);
				this.notificationService.notify('success', 'Assessments', 'Assessments saved!', false);

				this.notificationsApi
					.checkForInjuryAvailability(this.injury.id, this.authService.getCurrentUserData().currentTeamId)
					.pipe(untilDestroyed(this))
					.subscribe({
						error: (error: Error) => this.error.handleError(error)
					});

				this.saveClicked.emit(ass);
			},
			(error: Error) => this.error.handleError(error)
		);
	}

	/**** EXAMS FUNCTIONS ****/
	selectFile(file: File) {
		this.attachedFile = file;
	}

	attachmentError(error: string) {
		this.notificationService.notify('error', 'medical.infirmary', error, false);
	}

	private onUpload(downloadUrl: string, publicId: string, name: string): Attachment {
		const author = this.auth.getCurrentUserData();
		const attach: Attachment = new Attachment({
			name,
			url: publicId,
			downloadUrl,
			date: this.selectedExam.date,
			authorId: author.id
		});
		this.selectedExam.attachment = attach;
		return attach;
	}

	addExam() {
		if (this.injury.currentStatus !== 'medical.infirmary.details.statusList.healed') {
			this.new = true;
			this.selectedExam = new InjuryExam();
			this.injuryApi
				.createInjuryExams(this.injury.id, {
					date: moment().toDate()
				})
				.pipe(untilDestroyed(this))
				.subscribe(
					(inst: InjuryExam) => {
						this.injury._injuryExams = [inst, ...this.injury._injuryExams];
						this.editExam(inst);
					},
					(error: Error) => this.error.handleError(error)
				);
		} else {
			this.notificationService.notify('warn', 'medical.infirmary', 'alert.injuryEditForbidden', false);
		}
	}

	editExam(exam: InjuryExam) {
		if (this.injury.currentStatus !== 'medical.infirmary.details.statusList.healed') {
			this.tempExam = { ...exam };
			this.selectedExam = exam;
			this.hour = moment(exam.date).get('hour');
			this.minute = moment(exam.date).get('minute');
			this.editFlag = true;
			this.editClicked.emit(this.editFlag);
		} else {
			this.notificationService.notify('warn', 'medical.infirmary', 'alert.injuryEditForbidden', false);
		}
	}

	deleteExam(alsoEvent?: boolean, exam?: InjuryExam) {
		let $obs: Array<Observable<any>> = [of(true)];
		if (!this.selectedExamToDelete) this.selectedExamToDelete = exam;
		if (alsoEvent && this.selectedExamToDelete.eventId)
			$obs = [...$obs, this.injuryService.deleteEvent(this.selectedExamToDelete.eventId)];
		if (this.selectedExamToDelete.attachment)
			$obs = [
				...$obs,
				this.azureStorageApi.removeFile(
					this.authService.getCurrentUserData().clubId,
					this.selectedExamToDelete.attachment.url
				)
			];

		forkJoin($obs)
			.pipe(
				exhaustMap(() => this.injuryApi.destroyByIdInjuryExams(this.injury.id, this.selectedExamToDelete.id)),
				untilDestroyed(this)
			)
			.subscribe(
				(res: InjuryExam) => {
					this.injury._injuryExams = this.injury._injuryExams.filter(({ id }) => id !== this.selectedExamToDelete.id);
					this.deleteClicked.emit(res);
					this.selectedExam = null;
					this.editFlag = false;
					this.discardDeleteExam();
					this.editClicked.emit(this.editFlag);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	discardExam(row?: InjuryExam, index?: number) {
		this.attachedFile = undefined;
		if (this.new === true) {
			this.deleteExam(false, row);
			this.editFlag = false;
			this.editFlagAss = false;
			this.editService.editMode = false;
			this.new = false;
			this.editClicked.emit(this.editFlag);
		} else {
			if (index) {
				this.injury._injuryExams[index] = { ...this.tempExam };
				this.injury._injuryExams = [...this.injury._injuryExams];
			}
			this.selectedExam = null;
			this.editFlag = false;
			if (this.editFlagAss === false) this.editService.editMode = false;
			this.editClicked.emit(this.editFlag);
		}
	}

	async confirmSave(instance: InjuryExam, index: number) {
		const hasChanges = this.hasChanged(instance);
		if (!hasChanges) {
			this.discardExam(instance, index);
			return;
		}
		if (this.attachedFile) {
			try {
				const resUpload = await this.azureStorageService.uploadBrowserFileToAzureStore(this.attachedFile);
				const attachment = this.onUpload(resUpload, resUpload, this.attachedFile.name);
				this.attachedFile = undefined;
				instance.attachment = attachment;
			} catch (error) {
				this.error.handleError(error);
			}
		}
		if (instance.complete !== this.tempExam.complete) {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.edit'),
				header: 'IterPRO',
				accept: () => this.saveExam(instance, index, hasChanges)
			});
		} else {
			this.saveExam(instance, index, hasChanges);
		}
	}

	saveExam(instance: InjuryExam, index: number, notify: boolean) {
		this.injuryApi
			.updateByIdInjuryExams(this.injury.id, instance.id, instance)
			.pipe(untilDestroyed(this))
			.subscribe(
				(inst: InjuryExam) => {
					if (inst.eventId) this.updateEvent(inst, index, notify);
					else this.createEvent(inst, index, notify);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	onSavedExam(inst: InjuryExam, index: number) {
		this.injury._injuryExams[index] = { ...inst };
		this.injury._injuryExams = [...this.injury._injuryExams];
		this.editFlag = false;
		this.new = false;
		if (this.editFlagAss === false) this.editService.editMode = false;
		this.editClicked.emit(this.editFlag);
		this.saveClicked.emit(this.injury);
	}

	private hasChanged(instance: InjuryExam): boolean {
		return JSON.stringify(instance) !== JSON.stringify(this.tempExam);
	}

	createEvent(inst: InjuryExam, index: number, notify: boolean) {
		this.injuryService
			.createEventAndUpdateInstance(inst, this.injury, 'exam', notify)
			.pipe(untilDestroyed(this))
			.subscribe(
				(inst2: any) => {
					this.onSavedExam(inst2, index);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	updateEvent(inst: InjuryExam, index: number, notify: boolean) {
		this.injuryService
			.updateEvent(inst, 'exam', this.injury, notify)
			.pipe(untilDestroyed(this))
			.subscribe(
				(res: any) => {
					this.onSavedExam(inst, index);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	getExamDate(exam: InjuryExam): Date {
		return moment(exam.date).toDate();
	}

	linkDate() {
		this.selectedExam.date = moment(this.selectedExam.date)
			.set({
				hour: this.hour,
				minute: this.minute
			})
			.toDate();
	}

	confirmDeleteExam(rowData: InjuryExam) {
		this.selectedExamToDelete = rowData;
		this.confirmDeleteFlag = true;
	}

	discardDeleteExam() {
		this.selectedExamToDelete = null;
		this.confirmDeleteFlag = false;
	}

	getCompleteClass(rowData: InjuryExam): any {
		if (moment(rowData.date).isBefore(moment())) {
			if (!rowData.complete) return { class: 'fa-times', color: 'red' };
			else return { class: 'fa-check', color: 'green' };
		} else {
			if (!rowData.complete) return { class: 'fa-clock', color: 'unset' };
			else return { class: 'fa-check', color: 'green' };
		}
	}

	getCompleteTitle(rowData: InjuryExam): string {
		if (moment(rowData.date).isBefore(moment())) {
			if (!rowData.complete) return 'Not complete';
			else return 'Complete';
		} else {
			if (!rowData.complete) return 'Pending';
			else return 'Complete';
		}
	}

	isFuture(rowData: InjuryExam): boolean {
		return moment(rowData.date).isAfter(moment());
	}

	getTime(date: Date): string {
		return moment(date).format('HH:mm');
	}

	onTimeChanged(time: string) {
		this.injury.date = moment(this.selectedExam.date)
			.set('hour', parseInt(time.split(':')[0], 10))
			.set('minute', parseInt(time.split(':')[1], 10))
			.toDate();
	}
}

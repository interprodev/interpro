import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import {
	Attachment,
	AzureStorageApi,
	ClubApi,
	Customer,
	Injury,
	LoopBackAuth,
	MedicalPreventionPlayer,
	PlayerApi,
	PreventionExam,
	TestInstance
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	AzureStorageService,
	EditModeService,
	ErrorService,
	InjuryService,
	ReportService,
	copyValue,
	getMomentFormatFromStorage,
	sortByDate
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import * as moment from 'moment';
import { ConfirmationService } from 'primeng/api';
import { Observable, forkJoin, of } from 'rxjs';
import { exhaustMap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'iterpro-prevention-assessment',
	templateUrl: './prevention-assessment.component.html',
	styleUrls: ['./prevention-assessment.component.css']
})
export class PreventionAssessmentComponent implements OnInit, OnDestroy, OnChanges {
	@Input() player: MedicalPreventionPlayer;
	@Input() tests: TestInstance[];
	@Input() injuries: Injury[];

	@Output() examAddedEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() examDeletedEmitter: EventEmitter<any> = new EventEmitter<any>();

	exams: PreventionExam[] = [];
	new: boolean;
	selected: any;
	temp: PreventionExam;
	hour: number;
	minute: number;
	teamId: any;
	time: moment.Moment;
	selectedExamToDelete: any;
	confirmDeleteFlag: boolean;
	private attachedFile: File;
	customers: Customer[];

	constructor(
		private clubApi: ClubApi,
		private translate: TranslateService,
		private reportService: ReportService,
		private error: ErrorService,
		private playerApi: PlayerApi,
		public editService: EditModeService,
		private confirmation: ConfirmationService,
		private azureStorageApi: AzureStorageApi,
		private azureStorageService: AzureStorageService,
		private auth: LoopBackAuth,
		private injuryService: InjuryService,
		private notificationService: AlertService
	) {}

	ngOnInit() {
		this.teamId = this.auth.getCurrentUserData().currentTeamId;
		this.getCustomers();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['player']) {
			if (this.player) {
				this.loadPlayer();
			}
		}
	}

	private getCustomers() {
		this.clubApi
			.getCustomers(this.auth.getCurrentUserData().clubId, { fields: ['id', 'firstName', 'lastName'] })
			.subscribe({
				next: (customers: Customer[]) => (this.customers = customers),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	ngOnDestroy() {
		this.attachedFile = undefined;
	}

	loadPlayer() {
		if (this.injuries) {
			this.loadExams();
		}
	}

	getCompleteClass(rowData) {
		if (moment(rowData.date).isBefore(moment())) {
			if (!rowData.complete) return { class: 'fa-times', color: 'red' };
			else return { class: 'fa-check', color: 'green' };
		} else {
			if (!rowData.complete) return { class: 'fa-clock', color: 'unset' };
			else return { class: 'fa-check', color: 'green' };
		}
	}

	getCompleteTitle(rowData) {
		if (moment(rowData.date).isBefore(moment())) {
			if (!rowData.complete) return 'Not complete';
			else return 'Complete';
		} else {
			if (!rowData.complete) return 'Pending';
			else return 'Complete';
		}
	}

	getTestLink(rowData) {
		let url;
		if (rowData.medical === true) url = '/medical/examination';
		else url = '/performance/assessments';
		const params = {
			id: rowData.id,
			testId: rowData.testId
		};
		return [url, params];
	}

	getLinkTitle(rowData) {
		if (rowData.medical === true) return 'prevention.assessments.test.linkMed';
		else return 'prevention.assessments.test.linkAss';
	}

	downloadReport() {
		const t = this.translate.instant.bind(this.translate);

		const exams = {
			title: t('prevention.assessments.medicalEvaluation'),
			headers: [
				t('medical.infirmary.exam.date'),
				t('medical.infirmary.exam.hour'),
				t('medical.infirmary.exam.exam'),
				t('medical.infirmary.report.description'),
				t('prevention.treatments.complete')
			],
			values: this.exams.map(exam => {
				const date = moment(exam.date);
				const completeClass = this.getCompleteClass(exam);
				return [
					date.format(getMomentFormatFromStorage()),
					date.format('HH:mm'),
					exam.exam,
					exam.description,
					`<i class="fas ${completeClass.class}" style="color:${completeClass.color}"></i>`
				];
			})
		};

		const tests = {
			title: t('prevention.assessments.functionalTests'),
			headers: [t('medical.infirmary.exam.date'), t('prevention.assessment.test'), t('prevention.assessment.purpose')],
			values: this.tests.map(test => [
				moment(test.date).format(getMomentFormatFromStorage()),
				t(test.name),
				test['purpose'].map(p => t(p)).join(', ')
			])
		};

		const data = {
			player: this.player.displayName,
			image: this.player.downloadUrl,
			info: [
				{
					label: t('profile.overview.nationality'),
					value: t(this.player.nationality)
				},
				{ label: t('Weight'), value: this.player.weight },
				{ label: t('Height'), value: this.player.height }
			],
			exams,
			tests
		};

		this.reportService
			.getImage(data.image)
			.pipe(untilDestroyed(this))
			.subscribe(image => {
				this.reportService.getReport('maintenance_assessment', { ...data, image }, 'positions.HoM');
			});
	}

	addExam() {
		this.new = true;
		this.selected = new PreventionExam();
		this.playerApi
			.createPreventionExams(this.player.id, {
				date: moment().toDate()
			})
			.pipe(untilDestroyed(this))
			.subscribe(
				(result: PreventionExam) => {
					this.player._preventionExams = [...this.player._preventionExams, result];
					this.loadExams();
					this.edit(result);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	edit(treatment: PreventionExam) {
		this.temp = copyValue(treatment);
		this.selected = treatment;
		this.hour = moment(this.selected.date).get('hour');
		this.minute = moment(this.selected.date).get('minute');
		this.editService.editMode = true;
	}

	async confirmSave(instance: PreventionExam, index: number) {
		const hasChanges = this.hasChanged(instance);
		if (!hasChanges) {
			this.discard(instance, index);
			return;
		}
		const author = this.auth.getCurrentUserData();
		instance.history = this.getExamHistory(instance.history, author.id).history;
		if (!!this.attachedFile) {
			try {
				const resUpload = await this.azureStorageService.uploadBrowserFileToAzureStore(this.attachedFile);
				const attachment = this.onUpload(resUpload, resUpload, this.attachedFile.name);
				this.attachedFile = undefined;
				instance.attachment = attachment;
			} catch (error) {
				this.error.handleError(error);
			}
		}
		if (instance.complete !== this.temp.complete) {
			this.confirmation.confirm({
				message: this.translate.instant('confirm.edit'),
				header: 'IterPRO',
				accept: () => {
					this.save(instance, index, hasChanges);
				},
				reject: () => {}
			});
		} else {
			this.save(instance, index, hasChanges);
		}
	}

	private getExamHistory(examHistory: any[], authorId: string): { history: { updatedAt: Date; author: string }[] } {
		const tempHistory = cloneDeep(examHistory || []);
		tempHistory.unshift({
			updatedAt: moment().toDate(),
			author: authorId
		});
		return {
			history: tempHistory
		};
	}

	save(instance: PreventionExam, index: number, notify: boolean) {
		instance.date = moment(instance.date).toDate();
		this.playerApi
			.updateByIdPreventionExams(this.player.id, instance.id, instance)
			.pipe(untilDestroyed(this))
			.subscribe(
				(inst: PreventionExam) => {
					if (inst.eventId) this.updateEvent(inst, index, notify);
					else this.createEvent(inst, index, notify);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	private hasChanged(instance: PreventionExam): boolean {
		return JSON.stringify(instance) !== JSON.stringify(this.temp);
	}
	createEvent(inst: PreventionExam, index: number, notify: boolean) {
		this.injuryService
			.createEventAndUpdateInstance(inst, null, 'exam', notify, this.player)
			.pipe(untilDestroyed(this))
			.subscribe(
				(inst2: any) => {
					this.onSavedInst(inst2, index);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	updateEvent(inst: PreventionExam, index: number, notify: boolean) {
		this.injuryService
			.updateEvent(inst, 'exam', null, notify, this.player)
			.pipe(untilDestroyed(this))
			.subscribe(
				(res: any) => {
					this.onSavedInst(inst, index);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	onSavedInst(inst, index) {
		this.player._preventionExams.filter(x => x.id === inst.id)[0] = copyValue(inst);
		this.player._preventionExams = [...this.player._preventionExams];
		this.player._preventionExams.filter(x => x.id === inst.id)[0].date = inst.date;
		this.loadExams();
		this.editService.editMode = false;
		this.new = false;
		this.examAddedEmitter.emit(this.player._preventionExams);
	}

	discard(row, index) {
		this.attachedFile = undefined;
		if (this.new === true) {
			this.delete(false, row);
		} else {
			this.player._preventionExams.filter(x => x.category === row.category)[index] = copyValue(this.temp);
			this.player._preventionExams = [...this.player._preventionExams];
			this.loadExams();
			this.selected = null;
			this.editService.editMode = false;
		}
		this.new = false;
	}

	delete(alsoEvent?: boolean, row?) {
		let $obs: Array<Observable<any>> = [of(true)];
		if (!this.selectedExamToDelete) this.selectedExamToDelete = row;
		if (alsoEvent && this.selectedExamToDelete.eventId)
			$obs = [...$obs, this.injuryService.deleteEvent(this.selectedExamToDelete.eventId)];
		if (this.selectedExamToDelete.attachment)
			$obs = [
				...$obs,
				this.azureStorageApi.removeFile(this.auth.getCurrentUserData().clubId, this.selectedExamToDelete.attachment.url)
			];
		forkJoin($obs)
			.pipe(
				exhaustMap(() => this.playerApi.destroyByIdPreventionExams(this.player.id, this.selectedExamToDelete.id)),
				untilDestroyed(this)
			)
			.subscribe(
				(result: PreventionExam) => {
					this.player._preventionExams = this.player._preventionExams.filter(
						x => x.id !== this.selectedExamToDelete.id
					);
					this.loadExams();
					this.selected = null;
					this.editService.editMode = false;
					this.discardDelete();
					this.examDeletedEmitter.emit(this.player._preventionExams);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	isFuture(rowData) {
		return moment(rowData.date).isAfter(moment());
	}

	selectFile(file: File) {
		this.attachedFile = file;
	}

	attachmentError(error: string) {
		this.notificationService.notify('error', 'medical.infirmary', error, false);
	}

	private onUpload(downloadUrl: string, publicId: string, name: string) {
		const author = this.auth.getCurrentUserData();
		const attach: Attachment = new Attachment({
			name,
			url: publicId,
			downloadUrl,
			date: this.selected.date,
			authorId: author.id
		});
		this.selected.attachment = attach;
		return attach;
	}

	getTime(event): string {
		return moment(event).format('HH:mm');
	}

	onTimeChanged(time: string) {
		this.selected.date = moment(this.selected.date)
			.set('hour', parseInt(time.split(':')[0], 10))
			.set('minute', parseInt(time.split(':')[1], 10))
			.toDate();
	}

	loadExams() {
		const arr = [].concat(...this.injuries.map(inj => inj._injuryExams));
		this.exams = [...this.player._preventionExams, ...arr];
		this.exams = sortByDate(this.exams, 'date').reverse();
	}

	confirmDelete(rowData) {
		this.selectedExamToDelete = rowData;
		this.confirmDeleteFlag = true;
	}

	discardDelete() {
		this.selectedExamToDelete = null;
		this.confirmDeleteFlag = false;
	}

	downloadFile(attachment: Attachment) {
		this.azureStorageService.downloadFile(attachment);
	}
}

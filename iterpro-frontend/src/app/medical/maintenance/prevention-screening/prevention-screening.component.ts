import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Anamnesys, Attachment, Club, ClubApi, LoopBackAuth, MedicalPreventionPlayer, PlayerApi } from '@iterpro/shared/data-access/sdk';
import { EditorDialogComponent } from '@iterpro/shared/ui/components';
import { EditModeService, ErrorService, ReportService, getMomentFormatFromStorage, sortByName } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog/dynamicdialog-ref';
import { v4 as uuid } from 'uuid';

@UntilDestroy()
@Component({
	selector: 'iterpro-prevention-screening',
	templateUrl: './prevention-screening.component.html'
})
export class PreventionScreeningComponent implements OnChanges {
	@Input() player: MedicalPreventionPlayer;
	@Output() save: EventEmitter<Anamnesys[]> = new EventEmitter<Anamnesys[]>();
	anamnesys: Anamnesys[];
	tempAnamnesys: Anamnesys[];
	uploadDialogVisibility: boolean;
	customerTeamSettings: SelectItem[] = [];
	private clubId: string;
	constructor(
		private clubApi: ClubApi,
		private auth: LoopBackAuth,
		private error: ErrorService,
		public editService: EditModeService,
		private playerApi: PlayerApi,
		private reportService: ReportService,
		private dialogService: DialogService,
		private translateService: TranslateService,
		private currentTeamService: CurrentTeamService
	) {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.player) {
			this.loadPlayer();
		}
	}

	private loadPlayer() {
		this.anamnesys = this.player.anamnesys;
		this.clubId = this.currentTeamService.getCurrentTeam().clubId;
		this.getUsersData();
		this.tempAnamnesys = cloneDeep(this.anamnesys);
	}

	private getUsersData() {
		const currentTeamId = this.auth.getCurrentUserData().currentTeamId;
		this.clubApi
			.findOne({
				where: { id: this.auth.getCurrentUserData().clubId },
				include: [
					{
						relation: 'customers',
						scope: {
							include: {
								relation: 'teamSettings'
							}
						}
					}
				]
			})
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (club: Club) => {
					club.customers = club.customers.filter(({ teamSettings }) => teamSettings.find(({ teamId }) => teamId === currentTeamId));
					this.customerTeamSettings = club.customers.map(x => ({
						label: x.firstName + ' ' + x.lastName,
						value: x.firstName + ' ' + x.lastName
					}));
					this.customerTeamSettings = sortByName(this.customerTeamSettings, 'label');
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	saveAttachments(attachments: Attachment[], rowData) {
		rowData._attachments = attachments;
	}

	addAnamnesys() {
		this.editService.editMode = true;
		const author = this.auth.getCurrentUserData();
		const authorName = `${author.firstName} ${author.lastName}`;
		const anamnesy: Anamnesys = {
			id: uuid(),
			author: authorName,
			authorId: author.id,
			cloudUrl: null,
			date: moment().startOf('day').toDate(),
			expirationDate: null,
			form: undefined,
			_attachments: []
		};
		this.anamnesys.unshift(anamnesy);
	}

	editAnamnesys() {
		this.editService.editMode = true;
	}

	deleteAnamnesys(rowData: any, rowIndex: any) {
		this.anamnesys.splice(rowIndex, 1);
	}

	onSave() {
		this.save.emit(this.anamnesys);
	}

	onDiscard() {
		this.anamnesys = cloneDeep(this.tempAnamnesys);
		this.editService.editMode = false;
	}

	openDialogNote(anamnesys: Anamnesys) {
		const ref = this.createEditorDialog(anamnesys.notes);
		ref.onClose.subscribe((notes: string) => {
			if (notes) {
				this.onSaveNote(anamnesys, notes);
			}
		});
	}

	private createEditorDialog(content: string): DynamicDialogRef {
		return this.dialogService.open(EditorDialogComponent, {
			data: { editable: this.editService.editMode, content: content },
			width: '50%',
			header: this.translateService.instant('prevention.treatments.note'),
			closable: true
		});
	}

	private onSaveNote(anamnesys: Anamnesys, notes: string) {
		anamnesys.notes = notes;
	}

	downloadReport() {
		const t = this.translateService.instant.bind(this.translateService);
		const exams = {
			title: t('clinicalRecords'),
			headers: [
				t('medical.infirmary.report.author'),
				t('profile.document.issuedDate'),
				t('profile.idCard.idCardExpireDate'),
				t('profile.archive.notes'),
				t('admin.contracts.document')
			],
			values: this.anamnesys.map(anamnesy => {
				const issueDate: string = anamnesy.date ? moment(anamnesy.date).format(getMomentFormatFromStorage()) : '-';
				const expirationDate: string = anamnesy.expirationDate ? moment(anamnesy.expirationDate).format(getMomentFormatFromStorage()) : '-';
				return [
					anamnesy.author,
					issueDate,
					expirationDate,
					anamnesy.notes,
					anamnesy._attachments && anamnesy._attachments.length > 0 ? `<i class="fas fa-check" style="color:green"></i>` : null
				];
			})
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
			exams
		};

		this.reportService
			.getImage(data.image)
			.pipe(untilDestroyed(this))
			.subscribe(image => {
				this.reportService.getReport('prevention_screening', { ...data, image }, 'positions.HoM');
			});
	}
}

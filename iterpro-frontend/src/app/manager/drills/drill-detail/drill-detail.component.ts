import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
	Attachment,
	AzureStorageApi,
	Customer,
	Drill,
	DrillApi,
	LoopBackAuth,
	TeamApi
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	AzureStoragePipe,
	DrillsMapping,
	EditModeService,
	ErrorService,
	ReportService,
	TINY_EDITOR_OPTIONS,
	getExtensionOfFileFromUrl,
	megaBytesToBytes
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, sortBy } from 'lodash';
import * as moment from 'moment/moment';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { of } from 'rxjs';
import { catchError, first } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

type ShareCustomerType = {
	displayName: string;
	id: string;
};

@UntilDestroy()
@Component({
	selector: 'iterpro-drill-detail',
	templateUrl: './drill-detail.component.html',
	styleUrls: ['./drill-detail.component.scss']
})
export class DrillDetailComponent implements OnChanges {
	/** Services */
	readonly #router = inject(Router);

	@Input() customers: Customer[] = [];
	@Input() currentDrill: Drill;
	@Input() isLoading: boolean;
	@Input() radarData: any;
	@Input() radarOptions: any;
	@Input() customersOptions!: SelectItem[];
	@Input() drillsNumber: number;
	@Input({ required: true }) drillsMapping!: DrillsMapping;
	@Input({ required: true }) drills!: Drill[];
	@Output() closeClicked: EventEmitter<void> = new EventEmitter<void>();
	@Output() loadDrills: EventEmitter<{ selectedDrill: string }> = new EventEmitter<{ selectedDrill: string }>();

	drillAttachments: Attachment[] = [];
	coachingPoint = '';
	tinyEditorInit = TINY_EDITOR_OPTIONS;
	sharedWithOptions: ShareCustomerType[] = [];
	selectedSharedWith: ShareCustomerType[] = [];

	constructor(
		private teamApi: TeamApi,
		private drillApi: DrillApi,
		private error: ErrorService,
		public editService: EditModeService,
		private authService: LoopBackAuth,
		private translate: TranslateService,
		private reportService: ReportService,
		private azureUrlPipe: AzureStoragePipe,
		private azureStorageApi: AzureStorageApi,
		private notificationService: AlertService,
		private confirmationService: ConfirmationService
	) {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['currentDrill']) {
			this.drillAttachments = this.currentDrill._attachments ? [...this.currentDrill._attachments] : [];
			this.loadCoachingPoints();
		}

		if (changes['customers']) {
			this.sharedWithOptions = sortBy(
				this.customers.map(({ firstName, lastName, id }) => ({
					displayName: `${firstName} ${lastName}`,
					id
				})),
				'displayName'
			);
		}

		if (this.customers && this.currentDrill && this.currentDrill.sharedWithIds) {
			this.selectedSharedWith = this.currentDrill.sharedWithIds
				.map(sharedId => {
					const customer: Customer = this.customers.find(({ id }) => id === sharedId);
					return {
						displayName: `${customer?.firstName} ${customer?.lastName}`,
						id: sharedId
					};
				})
				.sort((a, b) => a.displayName.localeCompare(b.displayName));
		}
	}

	private loadCoachingPoints() {
		// Handling of: If we found some empty strings in array then do not display them with bullet.
		if (this.currentDrill.coachingPoint) {
			let temp = '';
			this.currentDrill.coachingPoint.forEach(item => {
				if (item.trim() !== '') temp += '• ' + item;

				if (temp) temp += '\r\n';
			});

			this.coachingPoint = temp.trim();
		} else {
			this.coachingPoint = '';
		}
	}

	//region Reports

	async downloadReport() {
		const t = this.translate.instant.bind(this.translate);
		const ageGroup = this.currentDrill.ageGroup
			? this.getLabel(this.drillsMapping.ageGroups, this.currentDrill.ageGroup)
			: this.currentDrill.ageGroup.length
				? this.drillsMapping.ageGroups[0].value
				: '';
		const coachingPoint = (this.currentDrill.coachingPoint || []).map(s => `• ${s}`).join('<br>');
		const data = [
			{ label: t('drills.name'), value: this.currentDrill.name },
			{ label: t('drills.theme'), value: this.getLabel(this.drillsMapping.themes, this.currentDrill.theme) },
			{ label: t('drills.goal'), value: '' },
			{
				label: '&nbsp;&nbsp;• ' + t('drills.technicalGoal'),
				value: this.getLabels(this.drillsMapping.technicalGoals, this.currentDrill.technicalGoals)
			},
			{
				label: '&nbsp;&nbsp;• ' + t('drills.tacticalGoals'),
				value: this.getLabels(this.drillsMapping.tacticalGoals, this.currentDrill.tacticalGoals)
			},
			{
				label: '&nbsp;&nbsp;• ' + t('drills.physicalGoal'),
				value: this.getLabels(this.drillsMapping.physicalGoals, this.currentDrill.physicalGoals)
			},
			{ label: t('drills.ageGroup'), value: ageGroup },
			{
				label: t('drills.pitchSize'),
				value: `${t('drills.pitchSize.width')} ${this.currentDrill.pitchSizeX || '-'} m / ${t('drills.pitchSize.length')} ${
					this.currentDrill.pitchSizeY || '-'
				} m`
			},
			{ label: t('drills.nPlayers'), value: this.currentDrill.players },
			{ label: t('drills.duration'), value: `${this.currentDrill.duration || '-'} min` },
			{ label: t('drills.rules'), value: this.currentDrill.rules },
			{ label: t('drills.coachingPoint'), value: coachingPoint },
			{ label: t('drills.description'), value: this.currentDrill.description }
		];

		const images = await Promise.all(
			this.currentDrill._attachments
				.sort((a, b) => Number(this.isAttachmentPinned(b.id)) - Number(this.isAttachmentPinned(a.id)))
				.filter((att: Attachment) => {
					const ext = (getExtensionOfFileFromUrl(att.name) || '').toLowerCase();
					return ext === 'jpg' || ext === 'png' || ext === 'jpeg';
				})
				.map(async att => this.getUrlFromType(att))
		);

		this.reportService.getReport('drill', {
			title: data[0].value,
			// image: this.downloadUrl,
			images,
			data
		});
	}

	private async getUrlFromType(attachment: Attachment): Promise<string> {
		const ext = (getExtensionOfFileFromUrl(attachment.name) || '').toLowerCase();
		if (ext === 'jpg' || ext === 'png' || ext === 'jpeg') {
			return this.azureUrlPipe.transform(attachment.downloadUrl);
		}
	}

	private isAttachmentPinned(attachmentId: string): boolean {
		return !!this.currentDrill.pinnedAttachmentId && this.currentDrill.pinnedAttachmentId === attachmentId;
	}

	getLabels(list, items): string {
		if (!items) return '-';
		return items.map(item => this.getLabel(list, item)).join(', ');
	}

	getLabel(list, item): string {
		const opt = list.find(({ value }) => value === item);
		return opt ? opt.label : '';
	}

	//endregion

	//region Actions
	edit() {
		this.editService.editMode = true;
	}

	discard() {
		if (this.currentDrill) {
			if (!this.currentDrill.id) {
				// is a new drill
				this.closeClicked.emit();
			} else {
				this.drillAttachments = [...this.currentDrill._attachments];
			}
		}
		this.editService.editMode = false;
	}

	confirmDelete() {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.delete'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				this.delete();
			},
			reject: () => {}
		});
	}

	delete() {
		this.drillApi
			.deleteById<Drill>(this.currentDrill.id)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (deleted: Drill) => {
					this.currentDrill = null;
					this.loadDrills.emit();
					this.closeClicked.emit();
					this.notificationService.notify('success', 'drills', 'alert.recordDeleted', false);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	confirmEdit() {
		if (this.currentDrill.id) {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.edit'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.save();
				},
				reject: () => {}
			});
		} else {
			this.save();
		}
	}
	duplicateDrill() {
		this.currentDrill = cloneDeep(this.currentDrill);
		this.currentDrill.id = undefined;
		this.currentDrill.name = this.currentDrill.name + '(1)';
		this.save();
	}

	save() {
		const attachments = this.drillAttachments.map(x => {
			if (!x.id) x.id = uuid();
			return x;
		});

		const ids = attachments.map(({ id }) => id);

		const toRemove = this.currentDrill._attachments.filter(({ id }) => ids.indexOf(id) < 0);
		const { clubId } = this.authService.getCurrentUserData();
		toRemove.forEach(item => {
			this.azureStorageApi
				.removeFile(clubId, item.url)
				.pipe(first(), untilDestroyed(this))
				.subscribe({ error: (error: Error) => this.error.handleError(error) });
		});

		this.currentDrill._attachments = attachments;

		delete this.currentDrill['attachment'];
		delete this.currentDrill['attachments'];

		// Removing the empty array values from coachingPoint so that no empty values saved to DB.
		// Removing bullets from data if added.
		if (this.currentDrill.coachingPoint) {
			this.currentDrill.coachingPoint = this.currentDrill.coachingPoint.filter(e => e);
			this.currentDrill.coachingPoint.forEach(item => {
				if (item.trim() !== '' && item.includes('• ')) {
					const index = this.currentDrill.coachingPoint.indexOf(item);
					this.currentDrill.coachingPoint[index] = item.replace('• ', '');
				}
			});
		}
		// This 3 lines adding last update details, used this control to check if we are in edit mode
		if (this.currentDrill.id) {
			const currentUser = this.authService.getCurrentUserData();
			this.currentDrill.lastUpdateAuthorId = currentUser?.id;
			this.currentDrill.lastUpdateDate = moment().toDate();
		}

		/** Set the identifier (unique for club) */
		this.currentDrill.identifier =
			(this.currentDrill?.teamId || this.authService.getCurrentUserData().currentTeamId) + this.currentDrill.name;

		/** Updating the drill */
		if (this.currentDrill.id) {
			this.drillApi
				.updateAttributes(this.currentDrill.id, this.currentDrill)
				.pipe(untilDestroyed(this))
				.subscribe({
					next: (updated: Drill) => {
						this.loadDrills.emit({ selectedDrill: this.currentDrill.id });
						this.editService.editMode = false;
						this.notificationService.notify('success', 'drills', 'alert.recordUpdated', false);
					},
					error: (error: Error) => this.error.handleError(error)
				});
		} else {
			/** Creating the drill */
			const drillsNames: string[] = this.drills.map(({ name }) => name.toLowerCase());

			/** If the drill name already exists: interrupt creation */
			if (drillsNames.includes(this.currentDrill.name.toLowerCase())) {
				const errorMessage: string = this.translate.instant('drills.errors.nameAlreadyTaken');
				this.error.handleError(errorMessage);
				return;
			}

			/** Creating the drill */
			this.currentDrill.author = this.authService.getCurrentUserData();
			this.currentDrill.creationDate = moment().toDate();
			this.currentDrill.teamId = this.authService.getCurrentUserData().currentTeamId;
			this.teamApi
				.createDrills(this.authService.getCurrentUserData().currentTeamId, this.currentDrill)
				.pipe(
					untilDestroyed(this),
					catchError((error: Error) => {
						this.error.handleError(error);
						return of(null);
					})
				)
				.subscribe((created: Drill) => {
					this.loadDrills.emit({ selectedDrill: created.id });
					this.editService.editMode = false;
					this.notificationService.notify('success', 'drills', 'alert.recordCreated', false);
				});
		}
	}
	//endregion

	//region FileUploader
	uploadError(message: string) {
		this.notificationService.notify('error', 'drills', message, false);
	}

	updateAttachmentList(attachments: Attachment[]) {
		this.drillAttachments = attachments;
	}

	updatePinnedAttachment(pinnedAttachmentId: string) {
		this.drillApi
			.patchAttributes(this.currentDrill.id, {
				pinnedAttachmentId: pinnedAttachmentId
			})
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (updated: Drill) => {
					this.currentDrill.pinnedAttachmentId = pinnedAttachmentId;
					const alertDetail = !pinnedAttachmentId ? 'attachment.unpin.success' : 'attachment.pin.success';
					this.notificationService.notify('success', 'drills', alertDetail, false);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	// Deleting the current uploaded attachment(Image or video)
	deleteUploadedFileAt(index: number) {
		const attachments = [...this.drillAttachments];
		attachments.splice(index, 1);
		this.drillAttachments = attachments;
	}
	//endregion

	updateSharedWithIds(event: any): void {
		this.selectedSharedWith = (event.value as string[])
			.map(id => this.sharedWithOptions.find(c => c.id === id))
			.sort((a, b) => a.displayName.localeCompare(b.displayName));
	}

	megaBytesToBytes(megaBytesSize: number): number {
		return megaBytesToBytes(megaBytesSize);
	}
}

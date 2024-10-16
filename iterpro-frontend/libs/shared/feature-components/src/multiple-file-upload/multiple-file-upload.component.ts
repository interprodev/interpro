import { CommonModule, DatePipe } from '@angular/common';
import {
	ChangeDetectorRef,
	Component,
	EventEmitter,
	inject,
	Input,
	OnChanges,
	OnInit,
	Output,
	QueryList,
	SimpleChanges,
	ViewChildren
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Attachment,
	AttachmentFileRepository,
	AzureStorageApi,
	ClubApi,
	CollectionToSection,
	Customer,
	LoopBackAuth,
	Player,
	Staff,
	TeamSeason,
	TeamSeasonApi
} from '@iterpro/shared/data-access/sdk';
import { IconButtonComponent, IconModalPreviewComponent } from '@iterpro/shared/ui/components';
import { ArrayFromNumberPipe, CustomerNamePipe, FileTypePipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	AzureStoragePipe,
	AzureStorageService,
	ErrorService,
	FormatDateUserSettingPipe,
	getExtensionFromFileName
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { cloneDeep, flatten, sortBy, uniqBy } from 'lodash';
import * as moment from 'moment';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { CloudUploadComponent, CloudUploadResult } from '../cloud/cloud-upload/cloud-upload.component';
import { SectionTooltipPipe } from './pipes/section-tooltip.pipe';
import { ExtendedAttachment, Filters } from './models/file-upload.type';
import { TableValuesPipe } from './pipes/table-values.pipe';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		TranslateModule,
		PrimeNgModule,
		FormatDateUserSettingPipe,
		CustomerNamePipe,
		ArrayFromNumberPipe,
		AzureStoragePipe,
		IconModalPreviewComponent,
		CloudUploadComponent,
		IconButtonComponent,
		FileTypePipe,
		SectionTooltipPipe,
		TableValuesPipe
	],
	selector: 'iterpro-multiple-file-upload',
	templateUrl: './multiple-file-upload.component.html',
	styleUrls: ['./multiple-file-upload.component.scss'],
	providers: [AzureStoragePipe, CustomerNamePipe]
})
export class MultipleFileUploadComponent implements OnInit, OnChanges {
	@Input() isDialog: boolean = true;
	@Input() isFileRepository!: boolean;
	@Input() visible!: boolean;
	@Input({ required: true }) attachmentModel: any;
	@Input() editMode!: boolean;
	@Input() accept = '*';
	@Input() oneForRowMode!: boolean; // this flag allows you to put the widget upload component in the table, to see a real use see iterpro-prevention-screening component
	@Input() prefilledPlayerIds!: string[]; // this flag allows you to put the widget upload component in the table, to see a real use see iterpro-prevention-screening component
	@Output() save: EventEmitter<AttachmentFileRepository[]> = new EventEmitter<AttachmentFileRepository[]>();
	@Output() discard: EventEmitter<void> = new EventEmitter<void>();
	attachments!: ExtendedAttachment[];
	private clubId!: string;
	@ViewChildren(CloudUploadComponent) cloudUploadsComps!: QueryList<CloudUploadComponent>;
	sharedWithOptions!: SelectItemGroup[];
	customers: Customer[] = [];
	isLoading!: boolean;
	#customerNamePipe = inject(CustomerNamePipe);
	//region Filters
	filters: Filters = {
		authorsOptions: [],
		selectedAuthorIds: [],
		sectionOptions: [],
		selectedSections: [],
		datePeriod: [],
		fileTypesOptions: [],
		selectedFileTypes: []
	};
	//endregion
	constructor(
		private clubApi: ClubApi,
		private datePipe: DatePipe,
		private auth: LoopBackAuth,
		private error: ErrorService,
		private chRef: ChangeDetectorRef,
		private translate: TranslateService,
		private teamSeasonApi: TeamSeasonApi,
		private azureStorageApi: AzureStorageApi,
		private notificationService: AlertService,
		private currentTeamService: CurrentTeamService,
		private azureStorageService: AzureStorageService
	) {
		this.loadPlayersAndStaff();
	}

	ngOnInit() {
		this.loadAttachments();
		this.clubId = this.currentTeamService.getCurrentTeam().clubId;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['editMode']) {
			this.loadPlayersAndStaff();
		}
		if (changes['attachmentModel']) {
			this.loadAttachments();
		}
	}

	private loadAttachments() {
		if (this.oneForRowMode) {
			if (!this.attachmentModel || this.attachmentModel.length === 0) {
				const newAttachment = this.getNewAttachment();
				this.attachments = [newAttachment];
			} else {
				this.attachments = [this.attachmentModel[0]];
			}
		} else {
			this.attachments = !this.attachmentModel ? [] : [...this.toAttachmentSharedWithForGroups(this.attachmentModel)];
		}
		if (this.isFileRepository) {
			this.filters.sectionOptions = this.getSectionOptions(this.attachments);
		}
		this.filters.fileTypesOptions = this.getFileTypeOptions(this.attachments);
		if (this.prefilledPlayerIds && this.prefilledPlayerIds.length > 0) {
			this.add(this.prefilledPlayerIds);
		}
	}

	private toAttachmentSharedWithForGroups(attachments: AttachmentFileRepository[]): ExtendedAttachment[] {
		return attachments.map(item => {
			return {
				...item,
				sharedWith: [...(item?.sharedPlayerIds || []), ...(item?.sharedStaffIds || [])],
				sections: (item?.redirects || []).map(({ label }) => label)
			};
		});
	}

	private loadPlayersAndStaff() {
		this.isLoading = true;
		const { id } = this.currentTeamService.getCurrentSeason() as TeamSeason;
		const obs$: any = [
			this.teamSeasonApi.getPlayers(id, {
				fields: ['id', 'displayName', 'downloadUrl', 'archived']
			}),
			this.teamSeasonApi.getStaffs(id, {
				fields: ['id', 'firstName', 'lastName', 'downloadUrl', 'archived', 'customerId']
			}),
			this.clubApi.getCustomers(this.currentTeamService.getCurrentTeam().clubId, {
				fields: ['_id', 'id', 'firstName', 'lastName']
			})
		];

		forkJoin(obs$)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: ([players, staffs, customers]: any) => {
					this.customers = customers;
					this.filters.authorsOptions = this.getAuthorsOptions(this.attachments);
					if (players.some((p: Player) => !p.id)) {
						this.notificationService.notify('error', 'navigator.tactics', 'alert.playerError', false);
					}
					if (staffs.some((s: Staff) => !s.id)) {
						this.notificationService.notify('error', 'navigator.tactics', 'alert.playerError', false);
					}
					this.sharedWithOptions = [
						{
							label: this.translate.instant('admin.squads.element.players'),
							value: 'players',
							items: this.getActivePlayersOptions(players)
						},
						{
							label: this.translate.instant('admin.squads.element.staff'),
							value: 'staffs',
							items: this.getActiveStaffsOptions(staffs)
						}
					];
					this.isLoading = false;
				},
				error: (error: Error) => this.handleError.bind(this)
			});
	}

	private getActivePlayersOptions(players: Player[]): SelectItem[] {
		return sortBy(
			players.filter(player => !player.archived),
			'displayName'
		).map(player => ({
			label: player.displayName,
			value: player.id,
			disabled: !this.editMode
		}));
	}

	private getActiveStaffsOptions(staffs: Staff[]): SelectItem[] {
		return sortBy(
			staffs.filter(staff => !staff.archived),
			'lastName'
		).map(staff => ({
			label: `${staff.firstName} ${staff.lastName}`,
			value: staff.id,
			disabled: !this.editMode
		}));
	}

	add(prefilledPlayerIds?: string[]) {
		const attachments = cloneDeep(this.attachments);
		const newAttachment: ExtendedAttachment = this.getNewAttachment(prefilledPlayerIds);
		attachments.push(newAttachment);
		this.attachments = attachments;
	}

	private getNewAttachment(prefilledPlayerIds?: string[]): ExtendedAttachment {
		const author = this.auth.getCurrentUserData();
		return {
			date: moment().toDate(),
			name: null,
			url: null,
			downloadUrl: null,
			streamingUrl: null,
			externalUrl: '',
			authorId: author.id,
			sharedPlayerIds: [],
			sharedStaffIds: [],
			sharedPlayers: [],
			sharedStaffs: [],
			sharedWith: prefilledPlayerIds || [],
			id: uuid()
		} as unknown as ExtendedAttachment;
	}

	delete(selectedDownloadUrl: string, rowIndex: number) {
		if (!selectedDownloadUrl) {
			this.attachments.splice(rowIndex, 1);
			this.attachments = [...this.attachments];
			this.chRef.detectChanges();
		} else {
			this.azureStorageApi
				.removeFile(this.clubId, selectedDownloadUrl)
				.pipe(first(), untilDestroyed(this))
				.subscribe({
					next: () => {
						this.attachments = this.attachments.filter(({ downloadUrl }) => downloadUrl !== selectedDownloadUrl);
						this.chRef.detectChanges();
					},
					error: (error: Error) => this.error.handleError(error)
				});
		}
	}

	private getOptionsIdsByGroup(group: 'players' | 'staffs'): string[] {
		return this.sharedWithOptions
			.filter(({ value }) => value === group)
			.map(({ items }) => items.map(({ value }) => value))[0];
	}

	onSave() {
		const playerOptionsIds = this.getOptionsIdsByGroup('players');
		const staffOptionsIds = this.getOptionsIdsByGroup('staffs');
		const results: Attachment[] = this.attachments.map((item: ExtendedAttachment) => {
			const attachment: Attachment = {
				...item,
				sharedPlayerIds: item.sharedWith.filter((id: string) => playerOptionsIds.includes(id)),
				sharedStaffIds: item.sharedWith.filter((id: string) => staffOptionsIds.includes(id))
			};
			delete (attachment as any).sharedWith;
			return attachment;
		});
		this.save.emit(results);
	}

	onDiscard() {
		this.discard.emit();
	}

	private onUploadDocument(i: number, url: string, publicId: string, originalFilename: string) {
		this.attachments[i].name = originalFilename;
		this.attachments[i].url = publicId;
		this.attachments[i].downloadUrl = url;
		if (this.oneForRowMode) this.onSave();
	}

	onUpload(event: CloudUploadResult, i: number) {
		return this.onUploadDocument(i, event.downloadUrl, event.profilePhotoUrl, event.profilePhotoName);
	}

	downloadFile(attachment: Attachment) {
		this.azureStorageService.downloadFile(attachment);
	}

	cannotSave(): boolean {
		if (!this.cloudUploadsComps) return false;
		return this.cloudUploadsComps.some(({ uploading }) => uploading) || this.attachments.some(this.hasInvalidFields);
	}

	private hasInvalidFields(attachment: Attachment): boolean {
		return !attachment.name || !attachment.downloadUrl;
	}

	private handleError(error: any) {
		this.error.handleError(error);
		return [];
	}

	private getAuthorsOptions(attachments: ExtendedAttachment[]): SelectItem[] {
		return uniqBy(
			(attachments || [])
				.filter(({ authorId }) => authorId)
				.map(({ authorId }) => ({
					value: authorId,
					label: this.#customerNamePipe.transform(authorId, this.customers)
				})),
			'value'
		);
	}

	private getSectionOptions(attachments: ExtendedAttachment[]): SelectItem[] {
		return uniqBy(
			flatten(
				attachments.map(({ redirects }) =>
					(redirects || []).map((redirect: CollectionToSection) => ({
						value: redirect.label,
						label: this.translate.instant(redirect.label)
					}))
				)
			),
			'value'
		);
	}

	private getFileTypeOptions(attachments: ExtendedAttachment[]): SelectItem[] {
		return uniqBy(
			attachments
				.filter(({ name }) => name && getExtensionFromFileName(name))
				.map(({ name }) => ({
					value: getExtensionFromFileName(name)?.toUpperCase(),
					label: getExtensionFromFileName(name)?.toUpperCase()
				})),
			'value'
		);
	}

	resetFilters() {
		this.filters = {
			...this.filters,
			selectedAuthorIds: [],
			selectedSections: [],
			datePeriod: [],
			selectedFileTypes: []
		};
	}

	redirectTo(redirectUrl: string) {
		window.open('/#' + redirectUrl, '_blank');
	}

	filterChange(eventValue: any, field: string) {
		this.filters = { ...this.filters, [field]: eventValue };
	}
}

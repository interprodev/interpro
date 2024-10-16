import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import {
	Attachment,
	Customer,
	Event,
	LoopBackAuth,
	Player,
	Staff,
	Stage,
	VideoAsset,
	VideoAssetApi,
	VideoCategory,
	VideoToSave,
	VideoToSaveAction
} from '@iterpro/shared/data-access/sdk';
import { MultipleCloudUploadComponent } from '@iterpro/shared/feature-components';
import {
	CalendarService,
	VideoService,
	getId,
	getMomentFormatFromStorage,
	sortByDateDesc,
	isStagingEnvironmentAndProdResource,
	AzureStorageService,
	ErrorService
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { minBy, sortBy } from 'lodash';
import * as moment from 'moment';
import { ConfirmationService, SelectItem, SelectItemGroup } from 'primeng/api';
import { VideoGuard } from '../../../services/video.guard';
import { VideoForm, VideoGalleryViewType } from './models/video-form.type';
import { first } from 'rxjs/operators';

@Component({
	selector: 'iterpro-video-form',
	templateUrl: './video-form.component.html',
	styleUrls: ['./video-form.component.css']
})
export class VideoFormComponent implements OnInit, OnChanges {
	// all player of all seasons of the team: a fallback if event is undefined (it should never happen)
	@Input({ required: true }) linkedEventId: string;
	@Input({ required: true }) players: Player[];
	@Input({ required: true }) staffs: Staff[];
	@Input({ required: true }) events: Event[] = [];
	@Input({ required: true }) isEditVideo: VideoAsset;
	@Input({ required: true }) category: VideoCategory;
	@Input({ required: true }) customers: Array<Partial<Customer>>;
	@Input({ required: false }) prefilledTitle: string;
	@Input({ required: false }) prefilledPlayerIds: string[];
	@Output() changeCategory: EventEmitter<VideoCategory> = new EventEmitter<VideoCategory>();
	@Output() discardClicked: EventEmitter<void> = new EventEmitter<void>();
	@Output() videoDeleted: EventEmitter<void> = new EventEmitter<void>();
	@ViewChild(MultipleCloudUploadComponent, { static: false }) multipleCloudUploadEl: MultipleCloudUploadComponent;

	eventDropDownItems: Event[];
	playerOptions: Player[] = [];
	anyPlayerAtEvent = true;
	matchStaffs: Staff[] = [];
	staffsAtMatch = true;

	videoForm: FormGroup<VideoForm>;
	isOnSaving = false;
	submitted = false;
	stages: Stage[] = [
		{
			label: this.translate.instant('sidebar.preparation'),
			type: 'preparation'
		},
		{ label: this.translate.instant('sidebar.analysis'), type: 'analysis' }
	];
	categories: SelectItem[] = [];
	videoLoaded = false;
	videoFileAttachment: Attachment;
	basicVideoAsset: VideoAsset;
	videoGalleryViewType: VideoGalleryViewType = VideoGalleryViewType.Upload;
	videoGalleryViewTypes = VideoGalleryViewType;
	allSharedWithOptions: SelectItemGroup[] = [];
	private id: string;

	// convenience getter for easy access to form fields
	get formControls() {
		return this.videoForm.controls;
	}
	constructor(
		private formBuilder: FormBuilder,
		private translate: TranslateService,
		private auth: LoopBackAuth,
		private videoService: VideoService,
		private azureStorageService: AzureStorageService,
		private videoAssetApi: VideoAssetApi,
		public videoGuard: VideoGuard,
		private confirmationService: ConfirmationService,
		private calendar: CalendarService,
		private errorService: ErrorService
	) {
		const categories: SelectItem[] = [];
		for (const key of Object.keys(VideoCategory)) {
			categories.push({
				label: this.translate.instant('videogallery.category.' + VideoCategory[key].toLowerCase()),
				value: key
			});
		}
		this.categories = categories;
	}

	ngOnInit() {
		this.loadForm();
	}

	private loadForm() {
		this.isOnSaving = false;
		this.videoGuard.service.editMode = true;
		this.videoForm = this.formBuilder.group({
			title: new FormControl({ value: '', disabled: !!this.prefilledPlayerIds }, { validators: [this.isValidTitle()] }),
			event: [this.linkedEventId, this.isValidEvent()],
			category: [this.category as VideoCategory, Validators.required],
			stage: ['', this.isValidStage()],
			subtitle: '',
			players: [],
			staffs: [],
			sharedWithPeople: [],
			tags: ''
		});
		const shareablePlayers = this.loadActivePlayers(this.players);
		const shareableStaffs = this.loadActiveStaffs(this.staffs);
		this.allSharedWithOptions = this.getSharedWithPeopleOptions(shareablePlayers, shareableStaffs);
		!this.isEditVideo ? this.initCreateForm() : this.initEditableForm(this.isEditVideo);
		this.handleClosestEvent();
		this.updateBasicVideoAsset();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['events'] && !changes['events'].firstChange) {
			this.handleClosestEvent();
		}
	}

	private handleClosestEvent() {
		const { closestEventId } = this.fillEventDropDown(sortByDateDesc(this.events, 'start'));
		if (!this.isEditVideo && closestEventId) {
			this.videoForm.patchValue({ event: this.linkedEventId || closestEventId });
			this.setFormMatchPlayers({ value: closestEventId });
		}
	}

	onChangeCategory(category: VideoCategory) {
		if (category === VideoCategory.OTHERS) {
			this.loadEventPlayers(null);
			this.loadEventStaffs(null);
		}
		this.videoForm.patchValue({
			players: [],
			staffs: [],
			event: null
		});
		this.changeCategory.emit(category);
		this.updateBasicVideoAsset();
	}

	private fillEventDropDown(events: Event[]): { closestEventId: string } {
		let dropDownItems = [];
		if (events && events.length) {
			const today = new Date();
			const closestEvent = minBy(events, event => Math.abs(today.getTime() - event.start.getTime()));
			if (this.isTrainingCategorySelected()) {
				dropDownItems = events.map((event: Event) => ({
					label: this.trainingEventLabel(event),
					value: event.id
				}));
			} else if (this.isGamesCategorySelected()) {
				dropDownItems = events.map((event: Event) => ({
					label: this.gameEventLabel(event),
					value: event.id
				}));
			}
			this.eventDropDownItems = dropDownItems;
			return { closestEventId: closestEvent?.id };
		}
		return { closestEventId: null };
	}

	private trainingEventLabel(event: Event): string {
		if (!event) return;
		let label =
			moment(event.start).format(`${getMomentFormatFromStorage()} hh:mm`) + ' ' + this.calendar.getGD(event.start);
		if (event.format === 'training' && event.theme !== 'field') {
			label += ` - ${event.theme ? this.translate.instant('event.theme.' + event.theme) : ''}`;
		}
		return label;
	}

	private initCreateForm() {
		this.videoForm.reset();
		this.id = '';
		this.videoForm.patchValue({
			category: this.category,
			event: this.linkedEventId,
			subtitle: this.prefilledTitle || ''
		});
		this.loadEventPlayers(this.linkedEventId);
		this.loadEventStaffs(this.linkedEventId);
	}

	private initEditableForm(editableItem: VideoAsset) {
		this.id = getId(editableItem);
		this.videoFileAttachment = editableItem._videoFile;
		this.videoLoaded = !!this.videoFileAttachment;
		this.loadEventPlayers(editableItem.linkedId);
		this.loadEventStaffs(editableItem.linkedId);
		const stageIndex = editableItem.tacticType !== 'analysis' ? 0 : 1;
		if (!editableItem.sharedPlayerIds) {
			editableItem.sharedPlayerIds = [];
		}

		const staffs = (editableItem?.staffs || []).map(staff => ({
			displayName: `${staff.firstName} ${staff.lastName}`,
			id: staff.id
		}));
		if (!editableItem.sharedStaffIds) {
			editableItem.sharedStaffIds = [];
		}

		this.videoForm.patchValue({
			title: editableItem.title || '',
			event: editableItem.linkedId,
			category: editableItem.category as VideoCategory,
			stage: this.stages[stageIndex].type,
			subtitle: editableItem.subtitle || '',
			tags: editableItem.tags.join(', '),
			players: editableItem?.playerIds || [],
			sharedWithPeople: [...editableItem.sharedPlayerIds, ...editableItem.sharedStaffIds],
			staffs
		});
	}

	isGamesCategorySelected(): boolean {
		return this.isCategorySelected(VideoCategory.GAMES);
	}

	isOthersCategorySelected(): boolean {
		return this.isCategorySelected(VideoCategory.OTHERS);
	}

	isTrainingCategorySelected(): boolean {
		return this.isCategorySelected(VideoCategory.TRAINING);
	}

	private isCategorySelected(category: VideoCategory) {
		return !!this.videoForm && !!this.formControls.category.value && this.formControls.category.value === category;
	}

	setFormMatchPlayers({ value }: { value: string }) {
		this.loadEventPlayers(value);
		this.loadEventStaffs(value);
		this.videoForm.patchValue({
			players: this.prefilledPlayerIds || [],
			staffs: []
		});
		this.updateBasicVideoAsset();
	}

	onDiscard() {
		this.discardClicked.emit();
	}

	onSubmit() {
		this.submitted = true;
		// stop here if form is invalid
		if (this.videoForm.invalid) return;
		this.isOnSaving = true;
		if (!this.linkedEventId) {
			this.videoGuard.service.editMode = false;
		}
		this.multipleCloudUploadEl.handleUpload();
	}

	deleteVideo() {
		this.confirmationService.confirm({
			message: this.translate.instant('videogallery.form.confirmDelete'),
			header: this.translate.instant('warning'),
			accept: () => {
				this.deleteEventVideo(this.isEditVideo);
			}
		});
	}

	async deleteEventVideo(videoAsset: VideoAsset) {
		if (!this.linkedEventId) {
			this.videoGuard.service.editMode = false;
		}
		if (!isStagingEnvironmentAndProdResource(videoAsset._videoFile.downloadUrl)) {
			await this.azureStorageService.deleteFileFromAzureStore(videoAsset._videoFile.downloadUrl);
		}
		this.videoAssetApi
			.deleteById(getId(videoAsset))
			.pipe(first())
			.subscribe({
				next: () => {
					this.videoDeleted.emit();
					this.videoService.forceReload();
				},
				error: (error: Error) => this.errorService.handleError(error)
			});
	}

	removeVideo() {
		this.videoFileAttachment = undefined;
		this.videoLoaded = false;
	}

	private loadActivePlayers(players: Player[]): { displayName: string; id: string }[] {
		return sortBy(
			players.filter(player => !player.archived),
			'displayName'
		).map(player => ({
			displayName: player.displayName,
			id: player.id
		}));
	}

	private loadActiveStaffs(staffs: Staff[]): { displayName: string; id: string }[] {
		return sortBy(
			(staffs || []).filter(staff => !staff.archived),
			'lastName'
		).map(staff => ({
			displayName: `${staff.firstName} ${staff.lastName}`,
			id: staff.id
		}));
	}

	private loadEventPlayers(idEvent: string) {
		const event = this.events.find(({ id }) => idEvent === id);
		this.anyPlayerAtEvent = event ? event.playerIds.length > 0 : true;
		const players = event?.players?.length > 0 ? event.players : this.players;
		this.playerOptions = sortBy(players, 'displayName');
	}

	private loadEventStaffs(idEvent: string) {
		const event = this.events.find(({ id }) => idEvent === id);
		this.staffsAtMatch = event ? event?.staffIds?.length > 0 : true;
		const staffs = event ? (event.staff ? event.staff : []) : this.staffs;
		this.matchStaffs = sortBy(staffs, 'lastName');
	}

	getBasicVideoAsset(): VideoToSave {
		const videoFormValues = this.videoForm.value;
		const videoAuthorId = this.isEditVideo?.authorId;
		const { firstName, lastName, downloadUrl, id, currentTeamId } = this.auth.getCurrentUserData();
		const currentUser = { firstName, lastName, downloadUrl, id };
		const event = this.events.find(m => m.id === videoFormValues.event);
		const playerIds = videoFormValues.players ? videoFormValues.players : [];
		const staffs = videoFormValues.staffs ? videoFormValues.staffs : [];
		const playerOptionsIds = this.getOptionsIdsByGroup('players');
		const staffOptionsIds = this.getOptionsIdsByGroup('staffs');
		const sharedWithPlayers = (videoFormValues?.sharedWithPeople || []).filter((id: string) =>
			playerOptionsIds.includes(id)
		);
		const sharedWithStaffs = (videoFormValues?.sharedWithPeople || []).filter((id: string) =>
			staffOptionsIds.includes(id)
		);
		const tags = this.videoService.extractTags(videoFormValues.tags);

		const title =
			this.isOthersCategorySelected() && !!videoFormValues.title && videoFormValues.title.length > 0
				? videoFormValues.title
				: this.isGamesCategorySelected()
					? this.gameEventLabel(event)
					: this.trainingEventLabel(event);

		const action = this.id.length > 0 ? VideoToSaveAction.UPDATE : VideoToSaveAction.SAVE;
		const linkedObjectDefinition = this.getLinkedObjectDefinition(videoFormValues.category, event);
		const idObject = action === VideoToSaveAction.SAVE ? {} : { id: this.id };

		const videoAsset = <VideoAsset>{
			...linkedObjectDefinition,
			title,
			subtitle: videoFormValues.subtitle,
			tags,
			notesThreads: this.isEditVideo ? this.isEditVideo.notesThreads : [],
			category: videoFormValues.category,
			tacticType: videoFormValues.stage,
			creationDate: new Date(),
			playerIds,
			sharedPlayerIds: sharedWithPlayers || [],
			staffIds: staffs ? staffs.map(staff => staff.id) : [],
			sharedStaffIds: sharedWithStaffs || [],
			authorId: videoAuthorId ? videoAuthorId : currentUser.id,
			teamId: currentTeamId,
			...idObject
		};
		return { videoAsset, event, action };
	}

	updateBasicVideoAsset() {
		this.basicVideoAsset = this.getBasicVideoAsset().videoAsset;
	}

	private getLinkedObjectDefinition(
		category: VideoCategory,
		linkedObject: any
	): { linkedId: string; linkedModel: string } | {} {
		return !!linkedObject && category !== VideoCategory.OTHERS
			? { linkedId: linkedObject.id, linkedModel: 'Event' }
			: {};
	}

	private gameEventLabel(event: Event): string {
		if (!event) return null;
		return event.opponent
			? event.opponent + ' '
			: '' + moment(event.start).format(getMomentFormatFromStorage()) + ' (' + (event.home ? 'H' : 'A') + ')';
	}

	private isValidTitle(): (c: AbstractControl) => ValidationErrors | null {
		return ({ value }: AbstractControl): ValidationErrors | null =>
			this.isOthersCategorySelected() && !value ? { title: true } : null;
	}

	private isValidEvent(): (c: AbstractControl) => ValidationErrors | null {
		return ({ value }: AbstractControl): ValidationErrors | null =>
			!this.isOthersCategorySelected() && !value ? { event: true } : null;
	}

	private isValidStage(): (c: AbstractControl) => ValidationErrors | null {
		return ({ value }: AbstractControl): ValidationErrors | null =>
			this.isGamesCategorySelected() && !value ? { stage: true } : null;
	}

	private getSharedWithPeopleOptions(
		players: { displayName: string; id: string }[],
		staff: { displayName: string; id: string }[]
	): SelectItemGroup[] {
		return [
			{
				label: this.translate.instant('admin.squads.element.players'),
				value: 'players',
				items: players.map(player => ({
					label: player.displayName,
					value: player.id
				}))
			},
			{
				label: this.translate.instant('admin.squads.element.staff'),
				value: 'staffs',
				items: staff.map(staff => ({
					label: staff.displayName,
					value: staff.id
				}))
			}
		];
	}

	private getOptionsIdsByGroup(group: 'players' | 'staffs'): string[] {
		return this.allSharedWithOptions
			.filter(({ value }) => value === group)
			.map(({ items }) => items.map(({ value }) => value))[0];
	}
}

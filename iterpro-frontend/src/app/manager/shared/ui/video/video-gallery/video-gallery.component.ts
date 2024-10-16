import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	ClubApi,
	Customer,
	Event,
	EventApi,
	LoopBackAuth,
	NotificationApi,
	Player,
	PlayerNotificationApi,
	SelectedVideo,
	Staff,
	VideoAsset,
	VideoAssetApi,
	VideoCategory,
	VideoGallery
} from '@iterpro/shared/data-access/sdk';
import {
	EditModeService,
	ErrorService,
	VideoService,
	getId,
	sortByDateDesc,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { cloneDeep, differenceWith, isEqual } from 'lodash';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { Observable, forkJoin, of, pipe } from 'rxjs';
import { first, map, pluck, switchMap } from 'rxjs/operators';
import { VideoGuard } from '../../../services/video.guard';
import { FilterStatus, GalleryNavigation } from '../models/video-gallery.model';

@UntilDestroy()
@Component({
	selector: 'iterpro-video-gallery',
	templateUrl: './video-gallery.component.html',
	styles: [
		`
			.video-lists > div,
			.video-lists h3 {
				margin-left: 14px;
				margin-right: 14px;
			}
			.video-lists h3 {
				margin-top: 24px;
			}
		`
	]
})
export class VideoGalleryComponent {
	temp: VideoAsset;
	filterFocus: string;
	categoryToAddVideo: VideoCategory;

	@Input()
	set videos(videos: VideoAsset[]) {
		if (videos) {
			if (this.customers) {
				this.initGallery(videos, this.customers);
			} else {
				this.isLoading = true;
				this.clubApi
					.getCustomers(this.auth.getCurrentUserData().clubId, {
						fields: ['firstName', 'lastName', 'downloadUrl', 'id']
					})
					.pipe(first())
					.subscribe({
						next: (customers: Array<Partial<Customer>>) => {
							this.isLoading = false;
							this.customers = customers;
							this.initGallery(videos, this.customers);
						},
						error: (error: Error) => this.handleError(error)
					});
			}
		}
	}

	@Input({ required: true }) players: Player[] = []; // selectable players and staffs to create a new video clip
	@Input({ required: false }) staffs: Staff[] = [];
	@Input({ required: false }) linkedId: string;
	@Input({ required: false }) isNewFromRedirect: boolean;
	@Input({ required: true }) categories: string[] = []; // list of categories to show, if empty shows all the categories

	@Output() close: EventEmitter<boolean | void> = new EventEmitter();

	availableVideos: VideoAsset[]; // selectable matches to create a new video clip
	availableEvents: Event[] = [];
	customers: Array<Partial<Customer>>; // team users
	isLoading = true;
	gallery: VideoGallery = this.videoService.createEmptyVideoGallery();
	// sharedWithMe: VideoGallery = { SHAREDWITHME: [] };
	showForm = false;
	selectedVideo: VideoAsset = undefined; // video item to show in the player
	filterStatus: Record<string, FilterStatus> = {};
	showFilters: Record<string, boolean> = {}; // FILTERS:
	tagFilters: SelectItem[] = []; // tag

	// will be initialized with all the filter functions piped together
	private videoFilterFn: (items: VideoAsset[]) => VideoAsset[];

	constructor(
		private videoService: VideoService,
		private videoAssetApi: VideoAssetApi,
		private playerNotificationApi: PlayerNotificationApi,
		private notificationApi: NotificationApi,
		private clubApi: ClubApi,
		private auth: LoopBackAuth,
		private currentTeamService: CurrentTeamService,
		private videoGuard: VideoGuard,
		private error: ErrorService,
		private editService: EditModeService,
		private eventApi: EventApi,
		private activatedRoute: ActivatedRoute
	) {}

	private initGallery(videos: VideoAsset[], customers: Array<Partial<Customer>>) {
		this.editService.editMode = false;
		this.showForm = false;
		this.availableVideos = videos;
		this.gallery = this.videoService.videos2gallery(videos);
		this.gallery.SHAREDWITHME = this.getSharedWithMeVideos(videos);
		this.updateTags(videos);
		const id =
			this.activatedRoute.snapshot.paramMap.get('videoId') ||
			(this.selectedVideo ? getId(this.selectedVideo) : undefined);
		if (id) {
			// @ts-ignore
			this.selectedVideo = videos.find(({ _id }) => _id === id);
		}
		if (this.isNewFromRedirect && this.linkedId) {
			this.createVideoClip(VideoCategory[this.categories[0]]);
		}
	}

	private getSharedWithMeVideos(videos: VideoAsset[]): VideoAsset[] {
		const me = this.staffs && this.staffs.find(({ customerId }) => customerId === this.auth.getCurrentUserId());
		return me ? videos.filter(({ sharedStaffIds }) => (sharedStaffIds || []).includes(me.id)) : [];
	}

	onChangeCategory(category: VideoCategory) {
		this.loadCategoryEvents(category, false);
	}

	private loadCategoryEvents(category: VideoCategory, showLoader: boolean = true) {
		let observable$: Observable<any>;
		this.availableEvents = [];
		const { currentTeamId } = this.auth.getCurrentUserData();
		if (category === VideoCategory.GAMES) {
			observable$ = this.eventApi.find({
				where: {
					teamId: currentTeamId,
					format: { in: ['game', 'friendly'] }
				},
				fields: ['id', 'home', 'opponent', 'start', 'playerIds', '_playerMatchStats', 'format'],
				include: [{ relation: 'players', scope: { fields: ['displayName', 'id'] } }]
			});
		} else if (category === VideoCategory.TRAINING) {
			const currentTeam = this.currentTeamService.getCurrentTeam();
			const currentSeason = this.currentTeamService.extractSeason(currentTeam.teamSeasons);
			const startDate = moment(currentSeason.offseason).startOf('day').toDate();
			const endDate = moment(currentSeason.inseasonEnd).startOf('day').toDate();

			observable$ = this.eventApi.getEventsOnlySessionImport(currentTeamId, [], false, startDate, endDate).pipe(
				pluck('events'),
				map(events => {
					const trainingEvents = events.filter(({ format }) => format === 'training');
					trainingEvents.forEach(event => {
						event.players = (event.playerIds || []).map(id => (this.players || []).find(player => player.id === id));
						event.staffs = (event.staffIds || []).map(id => (this.staffs || []).find(staff => staff.id === id));
					});
					return trainingEvents;
				})
			);
		}
		if (observable$) {
			this.isLoading = showLoader;
			observable$.pipe(first()).subscribe({
				next: (events: Event[]) => {
					this.availableEvents = events;
					this.isLoading = false;
				},
				error: (error: Error) => {
					this.handleError(error);
				}
			});
		}
	}

	nextVideo() {
		this.selectedVideo = this.getVideo(GalleryNavigation.NEXT);
		this.onSelect();
	}
	previousVideo() {
		this.selectedVideo = this.getVideo(GalleryNavigation.PREVIOUS);
		this.onSelect();
	}

	closeGallery(redirect?: boolean) {
		this.showForm ? this.closeForm() : this.close.emit(redirect);
	}

	backToGallery() {
		this.selectedVideo = undefined;
		this.onSelect();
	}

	toggleFilters(category: string) {
		this.showFilters[category] = !this.showFilters[category];
		if (this.showFilters[category]) {
			this.filterFocus = category;
		}
	}

	selectVideo($event: SelectedVideo) {
		const VideoAsset = $event.item;
		if (!this.selectedVideo || VideoAsset.category !== this.selectedVideo.category) {
			this.loadCategoryEvents(VideoAsset.category as VideoCategory);
		}
		this.selectedVideo = $event.item;
		this.onSelect();
	}

	editVideoClip(VideoAsset: VideoAsset) {
		this.selectedVideo = VideoAsset;
		this.onSelect();
		this.categoryToAddVideo = undefined;
		this.showForm = true;
	}

	createVideoClip(category: VideoCategory) {
		this.selectedVideo = undefined;
		this.temp = undefined;
		this.categoryToAddVideo = category;
		this.loadCategoryEvents(category, false);
		this.showForm = true;
	}

	onSelect() {
		this.temp = cloneDeep(this.selectedVideo);
	}

	onDiscardClicked() {
		this.showForm = false;
		this.editService.editMode = false;
		if (this.isNewFromRedirect) {
			this.closeGallery(true);
		}
	}

	onUpdateComments(VideoAsset: VideoAsset) {
		const { notesThreads } = VideoAsset;
		const { currentTeamId } = this.auth.getCurrentUserData();
		const videoId = getId(VideoAsset);
		const toUpdate = notesThreads.length > this.temp.notesThreads.length;
		const authorIds = differenceWith(notesThreads, this.temp.notesThreads, isEqual).map(({ userId }) => userId);
		this.videoAssetApi
			.patchAttributes(videoId, { notesThreads })
			.pipe(
				switchMap(() => {
					if (toUpdate) {
						const playerNotifications$ =
							(VideoAsset.sharedPlayerIds || []).length > 0
								? this.playerNotificationApi.checkVideoCommentsNotifications(
										videoId,
										VideoAsset.linkedId || '',
										VideoAsset.sharedPlayerIds
									)
								: of(true);
						const staffNotifications$ =
							(VideoAsset.sharedStaffIds || []).length > 0
								? this.notificationApi.checkForVideoCommentNotification(
										videoId,
										VideoAsset.sharedStaffIds,
										authorIds,
										currentTeamId
									)
								: of(true);
						return forkJoin([playerNotifications$, staffNotifications$]);
					} else {
						return of(true);
					}
				}),
				first(),
				untilDestroyed(this)
			)
			.subscribe({
				next: () => {
					this.onSelect();
					this.updateTags([VideoAsset]);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	getFilterStatus(category: string): FilterStatus {
		if (!this.filterStatus[category]) {
			this.filterStatus[category] = {
				text: '',
				home: true,
				away: true,
				tags: [],
				players: [],
				// staffs: [],
				opponents: [],
				dates: []
			};
		}
		return this.filterStatus[category];
	}

	filterGallery(filterStatus: FilterStatus, categoryGallery: { key: string; value: VideoAsset[] }) {
		this.filterFocus = categoryGallery.key;
		this.filterStatus[categoryGallery.key] = filterStatus;
		if (!this.videoFilterFn) {
			this.videoFilterFn = this.filterVideoFunctionFactory();
		}
		const videosFilteredByCategory: VideoAsset[] =
			categoryGallery.key === 'SHAREDWITHME'
				? this.getSharedWithMeVideos(this.availableVideos)
				: this.availableVideos.filter(({ category }) => category === categoryGallery.key);
		const filteredVideos: VideoAsset[] = this.videoFilterFn(videosFilteredByCategory);
		categoryGallery.value = sortByDateDesc(filteredVideos, 'creationDate');
	}

	getCategoryValue(categoryKey: string) {
		return VideoCategory[categoryKey].toLowerCase();
	}

	// isActiveCategory(categoryKey: string): boolean {
	// 	return this.categories.length > 0 ? this.categories.indexOf(categoryKey) > -1 : categoryKey !== 'SHAREDWITHME';
	// }

	private getVideo(index: GalleryNavigation): VideoAsset {
		const galleryType = this.gallery[this.selectedVideo.category];
		const selectedId = getId(this.selectedVideo);
		const newIndex = galleryType.findIndex((item: VideoAsset) => getId(item) === selectedId) + index;
		return newIndex > -1 && newIndex < galleryType.length ? galleryType[newIndex] : undefined;
	}

	async handleDeletedVideo() {
		this.isLoading = true;
		this.showForm = false;
		this.selectedVideo = undefined;
		this.onSelect();
		this.isLoading = false;
	}

	private closeForm() {
		this.videoGuard
			.canDeactivate()
			.pipe(first())
			.subscribe({
				next: (confirm: boolean) => {
					this.showForm = !confirm;
				}
			});
	}

	private filterByHomeAway = (videos: VideoAsset[]) =>
		videos.filter(video =>
			!this.filterStatus[this.filterFocus === 'SHAREDWITHME' ? 'SHAREDWITHME' : video.category]
				? true
				: this.filterCategoryByHomeAway(
						video,
						this.filterStatus[this.filterFocus === 'SHAREDWITHME' ? 'SHAREDWITHME' : video.category]
					)
		);
	private filterCategoryByHomeAway = (video: VideoAsset, { home, away }: FilterStatus) =>
		home === away || (video.linkedObject as Event).home === home || (video.linkedObject as Event).home === away;

	private filterByTag = (videos: VideoAsset[]) =>
		videos.filter(video =>
			!this.filterStatus[this.filterFocus === 'SHAREDWITHME' ? 'SHAREDWITHME' : video.category]
				? true
				: this.filterCategoryByTag(
						video,
						this.filterStatus[this.filterFocus === 'SHAREDWITHME' ? 'SHAREDWITHME' : video.category]
					)
		);
	private filterCategoryByTag = (video: VideoAsset, { tags }: FilterStatus) =>
		tags.length > 0
			? tags.some((tag: string) => (tag.length > 0 ? video.tags.indexOf(tag) > -1 : video.tags.length === 0))
			: true;

	// private filterByStaff = (videos: VideoAsset[]) =>
	// 	videos.filter(video =>
	// 		!this.filterStatus[this.filterFocus === 'SHAREDWITHME' ? 'SHAREDWITHME' : video.category]
	// 			? true
	// 			: this.filterCategoryByStaff(
	// 					video,
	// 					this.filterStatus[this.filterFocus === 'SHAREDWITHME' ? 'SHAREDWITHME' : video.category]
	// 				)
	// 	);
	private filterByPlayer = (videos: VideoAsset[]) =>
		videos.filter(video =>
			!this.filterStatus[this.filterFocus === 'SHAREDWITHME' ? 'SHAREDWITHME' : video.category]
				? true
				: this.filterCategoryByPlayer(
						video,
						this.filterStatus[this.filterFocus === 'SHAREDWITHME' ? 'SHAREDWITHME' : video.category]
					)
		);
	private filterCategoryByPlayer = (video: VideoAsset, { players }: FilterStatus) =>
		players.length > 0
			? players.some((playerId: string) =>
					playerId.length > 0 ? video.playerIds.indexOf(playerId) > -1 : video.playerIds.length === 0
				)
			: true;

	// private filterCategoryByStaff = (video: VideoAsset, { staffs }: FilterStatus) =>
	// 	staffs.length > 0
	// 		? staffs.some((staffId: string) =>
	// 				staffId.length > 0 ? video.staffIds.indexOf(staffId) > -1 : video.staffIds.length === 0
	// 			)
	// 		: true;

	private filterByOpponent = (videos: VideoAsset[]) =>
		videos.filter(video =>
			!this.filterStatus[this.filterFocus === 'SHAREDWITHME' ? 'SHAREDWITHME' : video.category]
				? true
				: this.filterCategoryByOpponent(
						video,
						this.filterStatus[this.filterFocus === 'SHAREDWITHME' ? 'SHAREDWITHME' : video.category]
					)
		);

	private filterCategoryByOpponent = (video: VideoAsset, { opponents }: FilterStatus) =>
		opponents.length > 0
			? opponents.map(({ opponent }) => opponent).indexOf((video.linkedObject as Event).opponent) > -1
			: true;

	private filterByDate = (videos: VideoAsset[]) =>
		videos.filter(video =>
			!this.filterStatus[this.filterFocus === 'SHAREDWITHME' ? 'SHAREDWITHME' : video.category]
				? true
				: this.filterCategoryByDate(
						video,
						this.filterStatus[this.filterFocus === 'SHAREDWITHME' ? 'SHAREDWITHME' : video.category]
					)
		);

	private filterCategoryByDate = (video: VideoAsset, { dates }: FilterStatus) =>
		dates.length > 0
			? dates.map(({ formattedDate }) => formattedDate).indexOf(this.videoService.formatDate(video)) > -1
			: true;

	private filterByText = (videos: VideoAsset[]) =>
		videos.filter(video =>
			!this.filterStatus[this.filterFocus === 'SHAREDWITHME' ? 'SHAREDWITHME' : video.category]
				? true
				: this.filterCategoryByText(
						video,
						this.filterStatus[this.filterFocus === 'SHAREDWITHME' ? 'SHAREDWITHME' : video.category].text.toLowerCase()
					)
		);

	private filterCategoryByText = (video: VideoAsset, text: string) =>
		text.length > 0
			? video.title.toLowerCase().includes(text) ||
				(video.subtitle || '').toLowerCase().includes(text) ||
				video.tags.some((tag: string) => tag.toLowerCase() === text)
			: true;

	// Pipe all the filter functions
	private filterVideoFunctionFactory = (): ((items: VideoAsset[]) => VideoAsset[]) =>
		pipe(
			this.filterByText,
			this.filterByHomeAway,
			this.filterByTag,
			this.filterByPlayer,
			// this.filterByStaff,
			this.filterByOpponent,
			this.filterByDate
		);

	private scroll(key: string) {
		const element = document.getElementById('video-category-' + key);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	}

	private updateTags(videos: VideoAsset[]) {
		this.tagFilters = sortByName(
			this.videoService.getUniqueTags(
				videos,
				this.tagFilters.filter(({ value }) => value.length > 0)
			),
			'value'
		);
	}

	private handleError(error: Error) {
		this.isLoading = false;
		this.error.handleError(error);
	}

	// Utility function to preserve original property order when | keyValue is used in template
	originalOrder = (a: KeyValue<VideoCategory, VideoAsset[]>, b: KeyValue<VideoCategory, VideoAsset[]>): number => 0;

	mapTo(category: VideoGallery) {
		const videos = Object.values(category)[0];
		return {
			key: Object.keys(category)[0],
			value: sortByDateDesc(videos, 'creationDate')
		};
	}
}

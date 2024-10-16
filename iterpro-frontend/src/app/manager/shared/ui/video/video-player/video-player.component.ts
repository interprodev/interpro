import { Component, EventEmitter, Input, NgZone, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Attachment, Customer, Player, Staff, VideoAssetApi, VideoAsset } from '@iterpro/shared/data-access/sdk';
import { AlertService, ErrorService, getId, sortByName } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { VgApiService } from '@videogular/ngx-videogular/core';
import { saveAs } from 'file-saver';
import { SelectItem } from 'primeng/api';
import { first } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'iterpro-video-player',
	templateUrl: './video-player.component.html',
	styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit, OnChanges {
	@Input({ required: true }) video: VideoAsset;
	@Input({ required: true }) players: Player[];
	@Input({ required: true }) staffs: Staff[];
	@Input({ required: true }) tags: SelectItem[] = [];
	@Input({ required: true }) customers: Array<Partial<Customer>>;

	videoTags: string[] = [];
	videoPlayers: Player[] = [];
	videoStaffs: Staff[] = [];
	sharedPeople: string[] = [];

	@Output()
	close: EventEmitter<any> = new EventEmitter<any>();
	// comments emitter is used when add/edit/remove comments
	@Output() comments: EventEmitter<VideoAsset> = new EventEmitter<VideoAsset>();
	@Output() edit: EventEmitter<VideoAsset> = new EventEmitter<VideoAsset>();
	@Output() next: EventEmitter<any> = new EventEmitter<any>();
	@Output() previous: EventEmitter<any> = new EventEmitter<any>();

	// workaround needed to navigate between different videos
	// when reload is set to true the videocomponent is destroyed and recreated after 10ms.
	reloading = false;
	source: string = '';
	// doesn't show the big play button in the middle of video till the video is not ready
	ready: boolean = false;

	uploadDialogVisibility: boolean;

	constructor(
		private zone: NgZone,
		private router: Router,
		private error: ErrorService,
		private alertService: AlertService,
		private videoAssetApi: VideoAssetApi
	) {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['video'] || changes['tags'] || changes['players'] || changes['staffs']) {
			this.initVideo();
		}
	}

	ngOnInit() {
		this.initVideo();
	}

	onVideoPlayerReady(videoApi: VgApiService) {
		videoApi
			.getDefaultMedia()
			.subscriptions.canPlay.pipe(first())
			.subscribe(() => {
				this.ready = true;
			});
	}

	closePlayer() {
		this.close.emit();
	}

	editVideo() {
		this.edit.emit(this.video);
	}

	downloadVideo() {
		// @ts-ignore
		const videoEl: HTMLSourceElement = document.getElementById('myvideo');
		saveAs(videoEl.src, this.video._videoFile.name);
	}

	updateComments(comments) {
		this.video.notesThreads = comments;
		this.comments.emit(this.video);
	}

	videoHasTag(tag: string) {
		return this.video.tags.indexOf(tag) > -1;
	}

	videoHasPlayerTagged(player: Player) {
		return this.video.playerIds.indexOf(player.id) > -1;
	}

	videoHasStaffTagged(staff: Staff) {
		return (this.video.staffIds || []).indexOf(staff.id) > -1;
	}

	previousVideo() {
		this.previous.emit();
		this.reloadResources();
	}

	nextVideo() {
		this.next.emit();
		this.reloadResources();
	}

	getNumberOfComments() {
		return (
			this.video.notesThreads.length +
			this.video.notesThreads.reduce(
				(flatten, { notesThreads }) => (!!notesThreads ? flatten + notesThreads.length : flatten),
				0
			)
		);
	}

	goToPlanning() {
		const { id, start } = this.video.linkedObject;
		this.router.navigate(['/manager/planning', { id, start }]);
	}

	getLinkParams() {
		return { id: this.video.linkedId };
	}
	isInTactics() {
		return window.location.hash.toLowerCase().indexOf('manager/tactics') > -1;
	}
	// force to update the video player and it's source
	private reloadResources() {
		this.reloading = true;
		// TODO: setTimeOut is bad but it works. Find a more elegant way to do the same task
		// if you wonder why is bad: the callback is outside the angular scope, hence the need to use NgZone to make the change detection happen
		setTimeout(() => {
			this.zone.run(() => {
				this.reloading = false;
				this.initVideo();
			});
		}, 10);
	}

	private initVideo() {
		this.source = this.video._videoFile.downloadUrl;
		const videoPlayers = (this.video.playerIds || []).map(playerId =>
			this.players.find(player => player.id === playerId)
		);
		const videoStaffs = (this.video.staffIds || []).map(staffId => this.staffs.find(staff => staff.id === staffId));
		this.videoPlayers = this.initVideoPlayers(videoPlayers || this.players);
		this.videoStaffs = this.initVideoStaffs(videoStaffs || this.staffs);
		this.sharedPeople = this.initVideoSharedPeople();
		this.videoTags = this.initVideoTags(this.tags);
	}

	private initVideoTags(tags: SelectItem[]) {
		return tags
			.map(tag => tag.value)
			.filter((tag: string) => this.videoHasTag(tag))
			.sort();
	}

	private initVideoSharedPeople(): string[] {
		const sharedPlayers = (this.video.sharedPlayerIds || [])
			.map(sharedId => (this.players || []).filter(({ id }) => id === sharedId).find(({ id }) => id === sharedId))
			.map(({ displayName }) => displayName);
		const sharedStaff = (this.video.sharedStaffIds || [])
			.map(sharedId => (this.staffs || []).filter(({ id }) => id === sharedId).find(({ id }) => id === sharedId))
			.map(item => item?.firstName + ' ' + item?.lastName); // not destructuring to avoid undefined
		return [...sharedPlayers, ...sharedStaff];
	}

	private initVideoPlayers(players: Player[]) {
		const calledPlayers = players.filter((player: Player) => this.videoHasPlayerTagged(player));
		return sortByName(calledPlayers, 'displayName');
	}

	private initVideoStaffs(staffs: Staff[]) {
		const calledStaffs = staffs.filter((staff: Staff) => this.videoHasStaffTagged(staff));
		return sortByName(calledStaffs, 'lastName');
	}

	saveAttachments(event: Attachment[]) {
		this.uploadDialogVisibility = false;
		this.video._attachments = event;
		const id = getId(this.video);
		this.videoAssetApi
			.patchAttributes(id, { id: id, _attachments: this.video._attachments })
			.pipe(untilDestroyed(this))
			.subscribe({
				next: () => {
					this.alertService.notify('success', 'videogallery.form.label.video', 'alert.recordUpdated', false);
				},
				error: err => {
					this.error.handleError(err);
				}
			});
	}
}

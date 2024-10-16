import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Attachment,
	AzureStorageApi,
	Customer,
	ExtendedPlayerScouting,
	LoopBackAuth,
	Player,
	VideoAsset,
	VideoAssetApi,
	VideoInfo
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	AzureStoragePipe,
	EditModeService,
	ErrorService,
	VideoService,
	getId
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { VgApiService } from '@videogular/ngx-videogular/core';
import { ConfirmationService } from 'primeng/api';
import { Observable, forkJoin } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { CloudUploadComponent } from '../../cloud/cloud-upload/cloud-upload.component';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { VideoViewerComponent } from '@iterpro/shared/ui/components';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [
		CommonModule,
		TranslateModule,
		FormsModule,
		CloudUploadComponent,
		AzureStoragePipe,
		InputTextModule,
		ButtonModule,
		VideoViewerComponent
	],
	providers: [VideoService],
	selector: 'iterpro-player-videogallery',
	templateUrl: './player-video-gallery.component.html',
	styleUrls: ['./player-video-gallery.component.scss']
})
export class PlayerVideoGalleryComponent implements OnInit, OnChanges {
	@Input({required: true}) player!: Player | ExtendedPlayerScouting;
	@Input({required: true}) customers: Customer[] = [];
	@Input({required: true}) type!: 'Player' | 'PlayerScouting';
	videoUploading!: boolean;
	videoLoaded!: boolean;
	videos!: VideoAsset[];
	currentNewVideoInfo: { attachment?: Attachment; videoInfo?: VideoInfo } | null = null;
	videosToSave: { attachment: Attachment; videoInfo?: VideoInfo }[] = [];
	private teamId: string;

	constructor(
		private auth: LoopBackAuth,
		private error: ErrorService,
		public editService: EditModeService,
		private videoService: VideoService,
		private alertService: AlertService,
		private translate: TranslateService,
		private videoAssetApi: VideoAssetApi,
		private azureStorageApi: AzureStorageApi,
		private currentTeamService: CurrentTeamService,
		private confirmationService: ConfirmationService
	) {
		this.addVideo = this.addVideo.bind(this);
		this.teamId = this.currentTeamService.getCurrentTeam().id;
	}

	ngOnInit(): void {
		this.loadVideos();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['player'] && changes['player'].currentValue) {
			this.loadVideos();
		}
	}

	private loadVideos() {
		this.videoAssetApi
			.getPlayerVideos(getId(this.player), this.type)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (videos: VideoAsset[]) => {
					this.videos = videos;
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	startUploadVideo = () => {
		this.videoUploading = true;
	};

	addVideo = (url: string, id: string, filename: string) => {
		const author = this.auth.getCurrentUserData();
		const attachment: Attachment = this.createAttachment(url, id, filename, author.id);
		this.videosToSave.push({ attachment });
		this.currentNewVideoInfo = { ...this.currentNewVideoInfo, attachment };
	};

	onPlayerReady(videoApi: VgApiService) {
		if (!videoApi) return;
		videoApi.pause();
		videoApi
			.getDefaultMedia()
			.subscriptions.canPlay.pipe(
				first(),
				switchMap(() => this.videoService.getThumbnail(videoApi.getDefaultMedia().elem))
			)
			.subscribe((thumbnailUrl: string) => {
				this.videoLoaded = true;
				this.currentNewVideoInfo = { videoInfo: { thumbnailUrl, duration: videoApi.duration } };
				this.videoUploading = false;
			});
	}

	removeVideo(data: Attachment) {
		if (!data?.id) {
			this.videosToSave = this.videosToSave.filter(({ attachment }) => attachment.url !== data.url);
			this.currentNewVideoInfo = null;
			this.videoLoaded = false;
			this.videoUploading = false;
		} else {
			this.confirmDelete(data);
		}
	}

	private confirmDelete(data: Attachment) {
		const videoAssetItem = this.videos.find(({ _videoFile }) => _videoFile.id === data.id);
		if (!getId(videoAssetItem)) return;
		const obs$ = [
			this.azureStorageApi.removeFile(this.currentTeamService.getCurrentTeam().clubId, data.url),
			this.videoAssetApi.deleteById(getId(videoAssetItem))
		];
		if (videoAssetItem?._thumb?.id)
			obs$.push(
				this.azureStorageApi.removeFile(this.currentTeamService.getCurrentTeam().clubId, videoAssetItem._thumb.url)
			);
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.delete'),
			header: 'IterPRO',
			accept: () => {
				forkJoin(obs$).subscribe({
					next: () => {
						this.videos = this.videos.filter(video => getId(video) !== getId(videoAssetItem));
					},
					error: (error: Error) => this.error.handleError(error)
				});
			}
		});
	}

	// Handling uploaded file size error
	onVideoSizeError = () => {
		this.videoLoaded = false;
		this.videoUploading = false;
		this.alertService.notify(
			'error',
			this.translate.instant('navigator.videogallery'),
			'attributes.videoTooBig',
			false
		);
	};

	private createAttachment = (url: string, id: string, filename: string, authorId: string) =>
		new Attachment({
			date: new Date(),
			name: filename,
			url: id,
			downloadUrl: url,
			externalUrl: '',
			authorId: authorId
		});

	private createVideoAsset(attachment: Attachment, videoInfo: VideoInfo): VideoAsset {
		const author = this.auth.getCurrentUserData();
		const thumbnailUrl = videoInfo?.thumbnailUrl;
		const thumb = thumbnailUrl
			? this.createAttachment(thumbnailUrl, thumbnailUrl, 'thumb_' + attachment.name, author.id)
			: null;
		return new VideoAsset({
			creationDate: new Date(),
			title: attachment.name,
			linkedId: getId(this.player),
			linkedModel: this.type,
			category: this.type === 'PlayerScouting' ? 'SCOUTING' : 'PLAYER',
			authorId: author.id,
			_thumb: thumb ? { ...thumb, id: uuid() } : null,
			_videoFile: { ...attachment, id: uuid() },
			teamId: this.teamId,
			playerIds: [],
			sharedPlayerIds: [],
			staffIds: [],
			sharedStaffIds: [],
			notesThreads: []
		});
	}

	//#region CRUD
	onEdit() {
		this.editService.editMode = true;
	}

	saveEntry() {
		if (this.videosToSave?.length === 0) this.onDiscard();
		const videoAsset = (this.videosToSave || []).map(video =>
			this.createVideoAsset(video.attachment, video.videoInfo as VideoInfo)
		);
		const obs$: Observable<VideoAsset>[] = (videoAsset || []).map(videoAsset => this.videoAssetApi.upsert(videoAsset));
		forkJoin(obs$).subscribe({
			next: (result: VideoAsset[]) => {
				this.videos = [...this.videos, ...result];
				this.videosToSave = [];
				this.editService.editMode = false;
			},
			error: (error: Error) => this.error.handleError(error)
		});
	}

	onDiscard() {
		this.videosToSave = [];
		this.editService.editMode = false;
	}
	//endregion
}

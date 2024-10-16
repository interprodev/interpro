import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import {
	Attachment,
	LoopBackAuth,
	MultiFileUpload,
	NotificationApi,
	PlayerNotificationApi,
	UploadStatus,
	VideoAsset,
	VideoAssetApi
} from '@iterpro/shared/data-access/sdk';
import { IconModalPreviewComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	AzureStoragePipe,
	AzureStorageService,
	getId,
	VideoService
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { cloneDeep, differenceWith, isEqual } from 'lodash';
import * as moment from 'moment';
import { ConfirmationService } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { Subscription, forkJoin, of } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { CloudUploadQueueService } from '../cloud-upload-queue.service';
import { FilterByFieldPipe } from '@iterpro/shared/ui/pipes';

@Component({
	standalone: true,
	imports: [
		CommonModule,
		TranslateModule,
		PrimeNgModule,
		IconModalPreviewComponent,
		AzureStoragePipe,
		FilterByFieldPipe
	],
	selector: 'iterpro-multiple-cloud-upload',
	templateUrl: './multiple-cloud-upload.component.html',
	styleUrls: ['./multiple-cloud-upload.component.scss']
})
export class MultipleCloudUploadComponent implements OnInit {
	basicVideoAsset!: VideoAsset;
	selectedFiles: any[] = [];
	queueFiles!: MultiFileUpload[];
	uploadStatuses = UploadStatus;
	existingVideoAttachment!: Attachment | undefined;
	@Input() limitToOne = false;
	@Input() existingVideo!: VideoAsset | undefined;
	@Input()
	set setBasicVideoAsset(asset: VideoAsset) {
		if (asset) {
			this.basicVideoAsset = asset;
		}
	}
	@ViewChild(FileUpload, { static: false }) fileUploadEl!: FileUpload;
	queueSubscription$!: Subscription;

	constructor(
		private auth: LoopBackAuth,
		private alertService: AlertService,
		private videoService: VideoService,
		private videoAssetApi: VideoAssetApi,
		private notificationApi: NotificationApi,
		private confirmationService: ConfirmationService,
		private azureStorageService: AzureStorageService,
		private playerNotificationApi: PlayerNotificationApi,
		private cloudUploadQueueService: CloudUploadQueueService
	) {}

	async ngOnInit() {
		this.existingVideoAttachment = cloneDeep(this.existingVideo?._videoFile);
		this.readFileQueue();
		if (!this.cloudUploadQueueService.isAlreadyInstantiated()) {
			await this.listenToSuccess();
		}
	}

	async handleUpload() {
		const existingVideoDeleted = this.existingVideo?._videoFile && !this.existingVideoAttachment;
		if (existingVideoDeleted) {
			await this.azureStorageService.deleteFileFromAzureStore(this.existingVideo?._videoFile.downloadUrl);
		}
		if (this.selectedFiles.length > 0) {
			// click on save with selected files to upload
			this.fileUploadEl.upload();
		} else {
			// click on save without changing the file
			const videoAsset = new VideoAsset(this.basicVideoAsset);
			videoAsset._videoFile = this.existingVideo?._videoFile;
			videoAsset._thumb = this.existingVideo?._thumb;
			this.updateMatchVideos(videoAsset, undefined);
		}
	}

	// Callback to invoke when files are selected.
	onSelect(event: any) {
		if (this.existingVideoAttachment) {
			this.existingVideoAttachment = undefined;
		}
	}

	private readFileQueue() {
		this.queueSubscription$ = this.cloudUploadQueueService.queue.subscribe((files: MultiFileUpload[]) => {
			this.queueFiles = files;
		});
	}

	private async listenToSuccess() {
		this.cloudUploadQueueService.instantiate();
		const isNew = !this.existingVideo;
		this.cloudUploadQueueService.uploadCompleted.subscribe({
			next: async (files: MultiFileUpload[]) => {
				if (files.length > 0) {
					this.alertService.notify('success', 'navigator.videogallery', 'alert.allVideosUploaded', true);
					await this.handleSavedVideos(files, isNew);
				}
			}
		});
	}

	// Callback to invoke in custom upload mode to upload the files manually.
	async uploadHandler() {
		for (const file of this.selectedFiles) {
			await this.cloudUploadQueueService.addToQueue(file, this.basicVideoAsset);
			this.selectedFiles = this.getFilesNotAlreadyInQueue();
		}
	}

	// Callback to invoke if file upload fails.
	onUploadError(event: any) {
		console.error('onUploadError: ', event);
	}

	//#region FileUtils

	private getFilesNotAlreadyInQueue(): any {
		return this.selectedFiles.filter(({ file }) => file);
	}

	isFileInQueue(file: File): boolean {
		return this.findFileInQueue(file) !== undefined;
	}

	getUploadProgress(file: File): number {
		return this.findFileInQueue(file) ? this.findFileInQueue(file)?.progress || 0 : 0;
	}

	getFileDuration(file: File): string | null {
		return this.findFileInQueue(file) ? this.getDuration(this.findFileInQueue(file)?.duration) : null;
	}

	getUploadStatus(file: File): UploadStatus {
		return this.findFileInQueue(file)
			? this.findFileInQueue(file)?.status || UploadStatus.NotInQueue
			: UploadStatus.NotInQueue;
	}

	getFileUrl(file: File): string | undefined {
		return this.findFileInQueue(file) ? this.findFileInQueue(file)?.url : undefined;
	}

	private findFileInQueue(fileItem: File): MultiFileUpload | undefined {
		return this.queueFiles && this.queueFiles.length > 0
			? this.queueFiles.find(({ file }) => file === fileItem)
			: undefined;
	}

	getUploadStatusLabel(file: File): string {
		const status = this.getUploadStatus(file);
		switch (status) {
			case UploadStatus.Uploading:
				return 'in upload';
			case UploadStatus.Done:
				return 'upload completed, on saving';
			case UploadStatus.NotStarted:
				return 'waiting for start';
			case UploadStatus.Error:
				return 'error';
			case UploadStatus.VideoSaved:
				return 'video saved';
			default:
				console.warn('status not supported');
				return '';
		}
	}

	bytesToMegaBytes(bytes: number): string {
		const stringBytes = String(bytes);
		const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		let l = 0,
			n = parseInt(stringBytes, 10) || 0;
		while (n >= 1024 && ++l) {
			n = n / 1024;
		}
		return n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l];
	}

	getDuration(duration: number | undefined): string {
		return duration ? moment.utc(moment.duration(duration, 'seconds').asMilliseconds()).format('HH:mm:ss') : '';
	}

	//endregion

	private async handleSavedVideos(files: MultiFileUpload[], isNew: boolean) {
		const author = this.auth.getCurrentUserData();
		files.forEach((file: MultiFileUpload) => {
			const attachment: Attachment = this.createAttachment(file.url, file.url, file.name, author.id);
			const videoAsset = new VideoAsset(file.basicVideoAsset);
			const thumbAttachment = this.createAttachment(
				file.thumbnailUrl,
				file.thumbnailUrl,
				'thumb_' + file.name,
				author.id
			);
			videoAsset._videoFile = attachment;
			videoAsset._thumb = thumbAttachment;
			videoAsset.duration = file.duration;
			if (!isNew) {
				this.updateMatchVideos(videoAsset, file);
			} else {
				this.addNewMatchVideo(videoAsset, file);
			}
		});
		this.queueSubscription$.unsubscribe();
	}

	//#region API calls

	private addNewMatchVideo(videoAsset: VideoAsset, file: MultiFileUpload) {
		const { currentTeamId } = this.auth.getCurrentUserData();
		let tempVideoId: string | null = null;
		this.videoAssetApi
			.upsert(videoAsset)
			.pipe(
				switchMap((savedVideoAsset: any) => {
					const videoId = getId(savedVideoAsset);
					tempVideoId = videoId;
					const sharedIds = savedVideoAsset.sharedPlayerIds || [];
					const staffIds = savedVideoAsset.sharedStaffIds || [];
					const playerNotifications$ =
						sharedIds.length > 0
							? this.playerNotificationApi.checkVideoSharingNotifications(
									videoId,
									videoAsset.linkedId || '',
									sharedIds,
									[]
								)
							: of(true);
					const staffNotifications$ =
						staffIds.length > 0
							? this.notificationApi.checkForVideoSharingNotification(videoId, staffIds, currentTeamId)
							: of(true);
					return forkJoin([playerNotifications$, staffNotifications$, videoId]);
				}),
				first()
			)
			.subscribe({
				next: () => {
					if (tempVideoId) file.saved(tempVideoId);
					this.videoService.forceReload();
					this.alertService.notify('success', 'navigator.videogallery', 'alert.allVideosSaved');
				},
				error: (error: Error) => {
					console.error('there was an error saving the video: ', error);
					this.alertService.notify('error', 'navigator.videogallery', 'alert.errorWhileSavingVideo');
				}
			});
	}

	private updateMatchVideos(videoAsset: VideoAsset, file?: MultiFileUpload) {
		const videoId = getId(this.existingVideo);
		delete (videoAsset as any)['_id'];
		const { currentTeamId } = this.auth.getCurrentUserData();
		this.videoAssetApi
			.patchAttributes(videoId, videoAsset)
			.pipe(
				switchMap(({ sharedPlayerIds, sharedStaffIds }: VideoAsset) => {
					const oldVideo = cloneDeep(this.existingVideo);
					const oldSharedPlayerIds = oldVideo && oldVideo.sharedPlayerIds ? oldVideo.sharedPlayerIds : sharedPlayerIds;
					const newSharedPlayerIds = differenceWith(videoAsset.sharedPlayerIds, oldSharedPlayerIds, isEqual) || [];
					const playerNotifications$ =
						newSharedPlayerIds.length > 0
							? this.playerNotificationApi.checkVideoSharingNotifications(
									videoId,
									videoAsset.linkedId || '',
									newSharedPlayerIds
								)
							: of(true);
					const oldSharedStaffIds = oldVideo && oldVideo.sharedStaffIds ? oldVideo.sharedStaffIds : sharedStaffIds;
					const newSharedStaffIds = differenceWith(videoAsset.sharedStaffIds, oldSharedStaffIds, isEqual) || [];
					const staffNotifications$ =
						newSharedStaffIds.length > 0
							? this.notificationApi.checkForVideoSharingNotification(videoId, newSharedStaffIds, currentTeamId)
							: of(true);
					return forkJoin([playerNotifications$, staffNotifications$]);
				}),
				first()
			)
			.subscribe({
				next: () => {
					if (file && videoId) file.saved(videoId);
					this.videoService.forceReload();
					this.alertService.notify('success', 'navigator.videogallery', 'alert.videoUploaded');
				},
				error: (error: Error) => {
					console.error('there was an error saving the video: ', error);
					this.alertService.notify('error', 'navigator.videogallery', 'alert.errorWhileSavingVideo');
				}
			});
	}

	removeFile(event: any, index: number, file: any) {
		this.confirmationService.confirm({
			message: 'Are you sure you want to remove the selected file?',
			header: 'Confirm',
			icon: 'fa-solid fa-triangle-exclamation',
			accept: () => {
				this.fileUploadEl.remove(event, index);
				this.selectedFiles = this.selectedFiles.filter(item => item !== file);
				this.alertService.notify('success', 'navigator.videogallery', 'alert.fileRemoved');
			}
		});
	}

	//endregion

	private createAttachment = (url: string, id: string, filename: string, authorId: string): Attachment =>
		new Attachment({
			date: moment().toDate(),
			name: filename,
			url: id,
			downloadUrl: url,
			externalUrl: '',
			id: uuid(),
			authorId
		});
}

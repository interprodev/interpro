import { Injectable } from '@angular/core';
import { MultiFileUpload, VideoAsset } from '@iterpro/shared/data-access/sdk';
import { AzureStorageService, ImageService } from '@iterpro/shared/utils/common-utils';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class CloudUploadQueueService {
	private isUploading!: boolean;
	private allFilesUploaded: Subject<MultiFileUpload[]> = new Subject<MultiFileUpload[]>();
	private files: MultiFileUpload[] = [];
	private uploadQueue: BehaviorSubject<MultiFileUpload[]> = new BehaviorSubject([] as MultiFileUpload[]);
	private instantiated!: boolean;

	constructor(private readonly imageService: ImageService, private readonly azureStorageService: AzureStorageService) {
		this.files = [];
	}

	public instantiate() {
		this.instantiated = true;
	}

	public get queue() {
		return this.uploadQueue.asObservable();
	}

	public get uploadCompleted() {
		return this.allFilesUploaded.asObservable();
	}

	async addToQueue(file: File, basicVideoAsset: VideoAsset) {
		this.files = this.files.filter(f => !f.isUploadDone);
		const queuedUploadFile = new MultiFileUpload(file, basicVideoAsset);
		await queuedUploadFile.setThumbnailBase64AndDuration(file);
		this.files.push(queuedUploadFile);
		this.uploadQueue.next(this.files);
		await this.checkAndUploadNextFile();
	}

	private async checkAndUploadNextFile() {
		if (this.isUploading) return;

		const firstChoice = this.files.find(f => f.isWaitingForUpload);
		if (firstChoice) {
			await this.upload(firstChoice);
		} else {
			if (this.files.every(f => f.isUploadDone || f.isVideoSaved)) {
				this.allFilesUploaded.next(this.files.filter(file => file.isUploadDone));
			}
		}
	}

	private async upload(queuedUploadFile: MultiFileUpload) {
		this.isUploading = true;
		queuedUploadFile.updateProgress(30);
		const uploadFile = this.azureStorageService.uploadBrowserFileToAzureStore(queuedUploadFile.file);
		const uploadThumbnail = this.imageService.uploadThumbnail(queuedUploadFile.thumbnailBase64, 'test.jpeg');
		Promise.all([uploadFile, uploadThumbnail])
			.then(values => {
				queuedUploadFile.completed(values[0], values[1]);
				this.uploadQueue.next(this.files);
				// console.info("next one!");
				this.isUploading = false;
				this.checkAndUploadNextFile();
			})
			.catch(error => queuedUploadFile.failed());
	}

	public isAlreadyInstantiated(): boolean {
		return this.instantiated;
	}
}

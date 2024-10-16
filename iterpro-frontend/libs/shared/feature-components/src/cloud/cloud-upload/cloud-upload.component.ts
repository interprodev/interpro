import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AlertService, AzureStorageService, ImageResizerService, ImageService, bytesToMegaBytes } from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ImageCroppedEvent, ImageCropperModule } from 'ngx-image-cropper';
import {
	FileProgressEvent,
	FileSelectEvent,
	FileUploadErrorEvent,
	FileUploadHandlerEvent
} from 'primeng/fileupload';
import { v4 as uuid } from 'uuid';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, ImageCropperModule, TranslateModule],
	selector: 'iterpro-cloud-upload',
	templateUrl: './cloud-upload.component.html',
	styleUrls: ['./cloud-upload.component.scss']
})
export class CloudUploadComponent implements OnInit {
	@Input() crop = false;
	@Input() area = false;
	@Input() spinner = true;
	@Input() label!: string;
	@Input() areaLabel!: string;
	@Input() accept = 'video/*,image/*';
	@Input() tooltip!: string;
	@Input() style: any = { width: '100%' };
	@Input() sizeLimit = true;
	@Input() maxFileSize = 25000000; // bytes
	@Input() icon = false;
	@Input() sizeError: (value?: any) => void = this.defaultSizeError.bind(this);
	@Output() onStartEmitter: EventEmitter<void> = new EventEmitter<void>();
	@Output() completedEmitter: EventEmitter<CloudUploadResult> = new EventEmitter<CloudUploadResult>();
	@ViewChild('fileinput', { static: false }) myInput: any;

	cropping = false;
	uploading = false;
	imageBase64Source = '';
	progress = 0;

	private selectedFile!: File;
	private imageBase64Cropped: string | null | undefined = undefined;

	constructor(
		private translate: TranslateService,
		private azureUploadService: AzureStorageService,
		private imageDownloadService: ImageService,
		private alert: AlertService,
		private imageResizer: ImageResizerService
	) {}

	ngOnInit() {
		if (this.tooltip) this.tooltip = this.translate.instant(this.tooltip);
	}

	error(event: FileUploadErrorEvent) {
		// TODO Matteo Handle error
	}

	private complete(event: CloudUploadResult) {
		this.uploading = false;
		this.cropping = false;
		this.completedEmitter.emit(event);
		this.myInput.clear();
	}

	select(e: FileSelectEvent) {
		if ((!e.currentFiles || e.currentFiles?.length === 0) && (!e.files || e.files.length === 0)) return;
		const file = e.currentFiles[0] || (e.files as File[])[0];
		if (!file) return;
		if (this.crop) {
			this.cropFile(file);
		} else {
			this.selectFile(file);
		}
	}

	updateCrop(event: ImageCroppedEvent) {
		this.imageBase64Cropped = event.base64;
	}

	updateProgress(e: FileProgressEvent) {
		this.progress = e.progress;
	}

	private async beforeSend() {
		if (this.selectedFile.type.includes('image')) {
			this.selectedFile = await this.reduceSizeToMaxAllowed(this.selectedFile);
		}

		this.onStartEmitter.emit();
		this.uploading = true;
	}

	areaClick() {
		if (!this.uploading) this.forceInputChoose();
	}

	dragOver(e: any) {
		e.preventDefault();
	}

	drop(e: any) {
		if (!this.uploading) {
			this.select(e.dataTransfer);
			if (!this.crop) this.myInput.upload();
		}
		e.preventDefault();
	}

	async uploadHandler(e: FileUploadHandlerEvent) {
		if (this.crop && this.imageBase64Cropped) {
			this.selectedFile = this.imageDownloadService.dataURItoFilename(this.imageBase64Cropped, uuid());
		}
		if (!this.uploading) {
			await this.beforeSend();
		}
		try {
			if (this.selectedFile) {
				this.imageBase64Cropped = null;
				this.uploading = !this.sizeLimit || this.selectedFile.size <= this.maxFileSize;
				if (this.uploading) {
					this.onStartEmitter.emit();
					const resUpload = await this.azureUploadService.uploadBrowserFileToAzureStore(this.selectedFile);
					this.complete({downloadUrl: resUpload, profilePhotoUrl: resUpload, profilePhotoName: this.selectedFile.name});
				} else {
					this.sizeError();
				}
			}
		} catch (error) {
			console.error('error', error);
			// TODO Matteo Handle error
		} finally {
			this.uploading = false;
		}
	}

	private selectFile(file: File) {
		this.selectedFile = file;
		this.myInput.files.push(this.selectedFile);
	}

	private cropFile(file: File) {
		this.selectedFile = file;
		const myReader: FileReader = new FileReader();
		myReader.onloadend = (loadEvent: any) => {
			this.cropping = true;
			this.imageBase64Source = loadEvent.target.result;
		};
		myReader.readAsDataURL(file);
	}

	public forceInputChoose() {
		this.myInput.clear();
		this.myInput.basicFileInput.nativeElement.click();
	}

	private async reduceSizeToMaxAllowed(file: File) {
		return file.size <= this.maxFileSize ? file : this.imageResizer.reduceSizeToRatio(file);
	}

	private defaultSizeError() {
		this.alert.notify('warn', 'Upload', 'alert.maxUploadSize', undefined, bytesToMegaBytes(this.maxFileSize));
	}

	getBackgroundColor(progress: number): string {
		if (progress < 60) return 'red';
		else if (progress < 75) return 'yellow';
		else return 'green';
	}
}

export interface CloudUploadResult {
	downloadUrl: string;
	profilePhotoUrl: string;
	profilePhotoName: string;
}

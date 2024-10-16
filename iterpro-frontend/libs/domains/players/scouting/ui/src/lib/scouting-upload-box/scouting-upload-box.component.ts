import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Attachment, LoopBackAuth } from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AzureStoragePipe,
	AzureStorageService,
	getExtensionFromFileName,
	getTypeFromExtension,
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { CloudUploadComponent } from '@iterpro/shared/feature-components';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, AzureStoragePipe, TranslateModule, CloudUploadComponent],
	selector: 'iterpro-cloud-upload-box',
	templateUrl: './scouting-upload-box.component.html',
	styleUrls: ['./scouting-upload-box.component.scss']
})
export class ScoutingUploadBoxComponent {
	@Input() label = '';
	@Input() editable = false;
	@Input() attachment!: Attachment | null;
	@Input() accept = 'video/*,image/*';
	@Input() maxFileSize = 2000000000;

	@Output() upload: EventEmitter<Attachment | null> = new EventEmitter<Attachment | null>();
	isUploading = false;

	readonly #auth = inject(LoopBackAuth);
	readonly #azureStorageService = inject(AzureStorageService);

	startUploadAttachment = () => {
		this.isUploading = true;
	};

	addAttachment = (downloadUrl: string, url: string, name: string) => {
		this.isUploading = false;
		this.emit(this.createAttachment(downloadUrl, url, name));
	};

	deleteAttachment() {
		this.emit(null);
	}

	private emit(attachment: Attachment | null) {
		this.attachment = attachment;
		this.upload.emit(attachment);
	}

	private createAttachment(downloadUrl: string, url: string, name: string) {
		const author = this.#auth.getCurrentUserData();
		return new Attachment({
			name,
			downloadUrl,
			url,
			date: new Date(),
			authorId: author.id
		});
	}

	onDownloadAttachment(attachment: Attachment) {
		this.#azureStorageService.downloadFile(attachment);
	}

	isSupportedMediaForPreview(): boolean {
		if (this.attachment) {
			const extension = getExtensionFromFileName(this.attachment.name);
			const mediaType = getTypeFromExtension(extension);
			return mediaType === 'image' || mediaType === 'video' || extension === 'pdf';
		}

		return false;
	}
}

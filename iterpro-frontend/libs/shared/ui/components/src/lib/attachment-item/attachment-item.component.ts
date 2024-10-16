import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	AzureStoragePipe,
	AzureStorageService,
	getExtensionFromFileName,
	getTypeFromExtension
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { Attachment } from '@iterpro/shared/data-access/sdk';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { IconModalPreviewComponent } from '../icon-modal-preview/icon-modal-preview.component';

@Component({
	selector: 'iterpro-attachment-item',
	standalone: true,
	imports: [CommonModule, AzureStoragePipe, IconButtonComponent, IconModalPreviewComponent, TranslateModule],
	templateUrl: './attachment-item.component.html'
})
export class AttachmentItemComponent {
	@Input({ required: true }) attachment!: Attachment;
	@Input({ required: false }) sharedWithTooltip!: string | null;
	@Input({ required: false }) showEditButton!: boolean;
	@Input({ required: false }) showDeleteButton!: boolean;
	@Output() deleteClicked: EventEmitter<void> = new EventEmitter<void>();
	@Output() editClicked: EventEmitter<void> = new EventEmitter<void>();
	readonly #azureStorageService = inject(AzureStorageService);

	isSupportedMediaForPreview(attachment: Attachment): boolean {
		if (attachment) {
			const extension = getExtensionFromFileName(attachment.name);
			const mediaType = getTypeFromExtension(extension);
			return mediaType === 'image' || mediaType === 'video' || extension === 'pdf';
		}
		return false;
	}

	onDownloadAttachment(attachment: Attachment) {
		this.#azureStorageService.downloadFile(attachment);
	}
}

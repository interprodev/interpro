import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ExtendedAttachment } from '@iterpro/shared/data-access/sdk';
import { AzureStoragePipe, AzureStorageService, getExtensionFromFileName } from '@iterpro/shared/utils/common-utils';
import { IconModalPreviewComponent } from '../icon-modal-preview/icon-modal-preview.component';
import { ImgModalPreviewComponent } from '../img-modal-preview/img-modal-preview.component';

@Component({
	standalone: true,
	imports: [NgIf, ImgModalPreviewComponent, IconModalPreviewComponent, AzureStoragePipe],
	selector: 'iterpro-attachment',
	templateUrl: './attachment.component.html',
	styleUrls: ['./attachment.component.css']
})
export class AttachmentComponent implements OnInit {
	@Input() attachment!: ExtendedAttachment;
	@Input() preview = false;
	@Output() uploadCompleted: EventEmitter<ExtendedAttachment[]> = new EventEmitter();

	extension = '';
	trustedUrl: SafeUrl = '';
	uploading = true;

	readonly #sanitization = inject(DomSanitizer);
	readonly #azureStorageService = inject(AzureStorageService);

	ngOnInit() {
		this.extension = getExtensionFromFileName(this.attachment.name) || '';
		this.trustedUrl = this.#sanitization.bypassSecurityTrustUrl(this.attachment.url);
		console.log('attachment', this.attachment);
	}

	sanitized(url: string): SafeUrl {
		return this.#sanitization.bypassSecurityTrustUrl(url);
	}

	pdfUrl() {
		return 'http://docs.google.com/gview?url=' + this.attachment.url + '&embedded=true';
	}

	hasExt(target: string): boolean {
		return this.extension === target;
	}

	downloadFile(attachment: ExtendedAttachment) {
		this.#azureStorageService.downloadFile({
			...attachment,
			downloadUrl: attachment.url
		});
	}
}

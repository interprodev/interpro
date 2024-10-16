import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Attachment, LoopBackAuth } from '@iterpro/shared/data-access/sdk';
import { IconModalPreviewComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AzureStoragePipe,
	AzureStorageService,
	EditModeService,
	FormatDateUserSettingPipe,
	bytesToMegaBytes,
	getExtensionOfFileFromUrl
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { v4 as uuid } from 'uuid';
import { CloudUploadComponent } from '../cloud/cloud-upload/cloud-upload.component';

@Component({
	standalone: true,
	imports: [
		CommonModule,
		PrimeNgModule,
		FormsModule,
		TranslateModule,
		CloudUploadComponent,
		IconModalPreviewComponent,
		FormatDateUserSettingPipe,
		AzureStoragePipe
	],
	selector: 'iterpro-fileuploader',
	templateUrl: './file-uploader.component.html',
	styleUrls: ['file-uploader.component.scss']
})
export class FileUploaderComponent implements OnInit, OnChanges {
	@Input() maxFileSize = 25000000; // bytes
	@Input() attachments!: Attachment[]; // selected;
	@Input() pinnedAttachmentId!: string | undefined;
	@Input() showPinnedLogic!: boolean;
	@Input() editMode = false;
	@Output() delete: EventEmitter<number> = new EventEmitter<number>();
	@Output() uploadError: EventEmitter<string> = new EventEmitter<string>();
	@Output() update: EventEmitter<Attachment[]> = new EventEmitter<Attachment[]>();
	@Output() updatePinnedAttachment: EventEmitter<string | null> = new EventEmitter<string | null>();
	@Output() reorder: EventEmitter<Attachment[]> = new EventEmitter<Attachment[]>();

	downloadUrl: string | null = null;
	fileExtension: string | null = null;
	fileName: string | null = null;
	uploading = false;

	constructor(
		private auth: LoopBackAuth,
		private editService: EditModeService,
		private translate: TranslateService,
		private elRef: ElementRef,
		private azureStorageService: AzureStorageService
	) {}

	isEditable() {
		// return this.editService.editMode;
		return this.editMode !== null ? this.editMode : this.editService.editMode;
	}
	ngOnInit() {
		if (!this.attachments) {
			this.attachments = [];
		}
		if (!Array.isArray(this.attachments)) {
			this.attachments = [this.attachments];
		}
		if (this.attachments.length > 0) {
			this.selectAttachment(this.pinnedAttachmentId);
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['attachments']) {
			if (!!this.attachments && this.attachments.length > 0) {
				this.selectAttachment(this.pinnedAttachmentId);
			} else {
				this.downloadUrl = null; // Getting type of file(Image can be png/jpg/jpeg and Video can be mp4)
				this.fileExtension = null;
				this.fileName = null;
			}
		}
	}

	// Handling video upload
	start() {
		this.uploading = true;
	}

	// output
	onUpload = (url: string, publicId: any, originalFilename: string) => {
		const author = this.auth.getCurrentUserData();
		const attachment = new Attachment({
			id: uuid(),
			name: originalFilename,
			url: publicId,
			downloadUrl: url,
			date: new Date(),
			authorId: author.id
		});

		const attachments = [attachment, ...this.attachments];

		this.showAttachmentPreview(attachment);
		this.update.emit(attachments);
	};

	// Handling uploaded file size error
	onSizeError = () => {
		const value = bytesToMegaBytes(this.maxFileSize) + 'MB';
		this.uploadError.emit(this.translate.instant('alert.maxUploadSize', { value }));
	};

	// Deleting the current uploded attachment(Image or video)
	deleteUploadedFile(index: number) {
		this.delete.emit(index);
	}

	changePreview(attachment: Attachment) {
		const attachments = this.attachments.filter(item => item.id !== attachment.id);
		attachments.unshift(attachment);
		this.reorder.emit(attachments);
	}

	downloadFile(attachment: Attachment) {
		this.azureStorageService.downloadFile(attachment);
	}

	private selectAttachment(attachmentId?: string) {
		const attachmentToSelect = !attachmentId
			? this.attachments[0]
			: this.attachments.find(({ id }) => id === attachmentId);
		this.putThePinnedFirst();
		this.showAttachmentPreview(attachmentToSelect as Attachment);
	}

	private putThePinnedFirst() {
		this.attachments = this.attachments.sort((a, b) => Number(this.isPinned(b.id)) - Number(this.isPinned(a.id)));
	}

	private showAttachmentPreview({ downloadUrl, name }: Attachment) {
		this.downloadUrl = downloadUrl;
		this.fileName = name;
		// Getting type of file(Image can be png/jpg/jpeg and Video can be mp4)
		this.fileExtension = getExtensionOfFileFromUrl(name);
		if (this.fileExtension === 'mp4') {
			const player = this.elRef.nativeElement.querySelector('#videoMain');
			if (player) {
				this.downloadUrl = this.azureStorageService.getUrlWithSignature(this.downloadUrl);
				player.src = this.downloadUrl;
				player.load();
			}
		}
	}

	pinFile(attachmentId: string) {
		if (this.isPinned(attachmentId)) {
			this.pinnedAttachmentId = undefined;
			this.selectAttachment();
			this.updatePinnedAttachment.emit(null);
		} else {
			this.pinnedAttachmentId = attachmentId;
			this.selectAttachment(attachmentId);
			this.updatePinnedAttachment.emit(attachmentId);
		}
	}

	isPinned(attachmentId: string): boolean {
		return !!this.pinnedAttachmentId && this.pinnedAttachmentId === attachmentId;
	}
}

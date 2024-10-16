import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Comment, CommentAttachment, Customer, FileAttachment, LoopBackAuth } from '@iterpro/shared/data-access/sdk';
import { AzureStoragePipe, AzureStorageService, getAttachments } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import * as moment from 'moment';
import { DialogModule } from 'primeng/dialog';
import { AttachmentComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { InputTextareaModule } from 'primeng/inputtextarea';

@Component({
	standalone: true,
	imports: [CommonModule, AzureStoragePipe, TranslateModule, FormsModule, DialogModule, AttachmentComponent, PrimeNgModule, InputTextareaModule],
	selector: 'iterpro-comment-input',
	templateUrl: './comment-input.component.html',
	styleUrls: ['./comment-input.component.css']
})
export class CommentInputComponent implements OnChanges {
	@Input() placeholder: string;
	@Input() editMode: boolean;
	@Output() onAdd: EventEmitter<Comment> = new EventEmitter<Comment>();
	@ViewChild('fileInput', { static: true }) fileInput: ElementRef;

	uploading = false;
	showUploadDialog = false;
	fileAttachments: FileAttachment[] = [];
	content = '';
	uploadContent = '';
	private first = true;
	customer: Customer;

	constructor(private readonly userService: LoopBackAuth, private readonly azureUploadService: AzureStorageService) {
		this.customer = userService.getCurrentUserData();
	}

	ngOnChanges(changes) {
		this.customer = this.userService.getCurrentUserData();
	}

	async add() {
		if (this.uploading) return;
		this.uploading = true;
		const attachmentsPromises: Array<Promise<CommentAttachment>> = this.fileAttachments.map(
			async ({ attachment, file }) => {
				const url = await this.azureUploadService.uploadBrowserFileToAzureStore(file);
				return { ...attachment, url };
			}
		);
		const attachments: CommentAttachment[] = await Promise.all(attachmentsPromises);
		const customer = this.userService.getCurrentUserData();
		if (!customer) return;
		const comment: Comment = {
			user: `${customer.firstName} ${customer.lastName}`,
			userId: customer.id,
			img: customer.downloadUrl,
			time: moment().toDate(),
			content: this.showUploadDialog ? this.uploadContent : this.content,
			attachments
		};
		this.uploading = false;
		this.showUploadDialog = false;
		this.onAdd.emit(comment);
		this.content = '';
		this.cleanUpload();
	}

	hideDialog() {
		this.showUploadDialog = false;
	}

	cleanUpload() {
		this.first = true;
		this.uploading = false;
		this.uploadContent = '';
		this.fileAttachments = [];
	}

	disposeUpload() {
		this.hideDialog();
		this.cleanUpload();
	}

	triggerFileInput() {
		this.showUploadDialog = true;
		this.fileInput.nativeElement.click();
	}

	async addAttachment(e) {
		this.uploading = true;
		if (this.first) {
			this.uploadContent = this.content;
			this.first = false;
		}
		const attachments = await getAttachments(e);
		this.fileAttachments = [...this.fileAttachments, ...attachments];
		this.uploading = false;
	}
}

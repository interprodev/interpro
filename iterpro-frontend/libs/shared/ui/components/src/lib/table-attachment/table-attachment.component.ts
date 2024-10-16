import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Attachment, AzureStorageApi, LoopBackAuth, Team } from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AzureStoragePipe, AzureStorageService, getPreview } from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';
import { first } from 'rxjs/operators';
import { IconModalPreviewComponent } from '../icon-modal-preview/icon-modal-preview.component';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, TranslateModule, IconModalPreviewComponent, AzureStoragePipe],
	selector: 'iterpro-table-attachment',
	templateUrl: './table-attachment.component.html'
})
export class TableAttachmentComponent implements OnInit, OnDestroy {
	@Input() editable = false;
	@Input() deletable = false;
	@Input() attachment: Attachment | null = null;
	@Input() accept = 'video/*,image/*';
	@Input() maxFileSize = 2000000000;

	@Output() file: EventEmitter<File> = new EventEmitter<File>();
	@Output() attachmentDeleted: EventEmitter<Attachment | null> = new EventEmitter<Attachment | null>();
	@Output() attachmentError: EventEmitter<string> = new EventEmitter<string>();

	@ViewChild('fileinput', { static: true })
	fileInputChild: any;
	team!: Team;
	filePreview!: string;

	constructor(
		private auth: LoopBackAuth,
		private translate: TranslateService,
		private azureStorageApi: AzureStorageApi,
		private currentTeamService: CurrentTeamService,
		private confirmationService: ConfirmationService,
		private azureStorageService: AzureStorageService
	) {}

	ngOnInit() {
		this.team = this.currentTeamService.getCurrentTeam();
	}

	ngOnDestroy() {
		this.fileInputChild.clear();
	}

	forceInputChoose() {
		this.fileInputChild.clear();
		this.fileInputChild.basicFileInput.nativeElement.click();
	}

	async select({ files }: { files: File[] }) {
		if (files && files.length > 0) {
			const chosenFile = files[0];
			if (chosenFile.size < this.maxFileSize) {
				this.filePreview = await getPreview(chosenFile);
				this.file.emit(chosenFile);
			} else {
				this.sizeError();
			}
		}
	}

	genericError(error: any) {
		if (typeof error === 'string') {
			this.attachmentError.emit(error);
		} else if (error.message) {
			this.attachmentError.emit(error.message);
		}
	}

	downloadFile(attachment: Attachment) {
		this.azureStorageService.downloadFile(attachment);
	}

	private sizeError() {
		this.attachmentError.emit('attributes.videoTooBig');
	}

	delete(attachment: Attachment) {
		if (!attachment.url) {
			this.attachment = null;
			this.attachmentDeleted.emit(null);
			return;
		}

		this.confirmationService.confirm({
			message: this.translate.instant('confirm.deleteAttachment'),
			header: 'Iterpro',
			accept: () => {
				this.onDeleteAttachment(attachment);
			}
		});
	}

	private onDeleteAttachment(attachment: Attachment) {
		this.azureStorageApi
			.removeFile(this.auth.getCurrentUserData().clubId, attachment.url)
			.pipe(first())
			.subscribe({
				next: () => {
					this.attachment = null;
					this.attachmentDeleted.emit(this.attachment);
				}
			});
	}
}

import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Attachment, AzureStorageApi } from '@iterpro/shared/data-access/sdk';
import { AzureStoragePipe, ErrorService } from '@iterpro/shared/utils/common-utils';
import {
	AttachmentItemComponent,
	IconButtonComponent,
	IconModalPreviewComponent,
	VideoViewerComponent
} from '@iterpro/shared/ui/components';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationService, SelectItemGroup } from 'primeng/api';
import { SharedWithTooltipPipe } from '@iterpro/shared/ui/pipes';

@Component({
	selector: 'iterpro-performance-report-attachments',
	standalone: true,
	imports: [
		IconModalPreviewComponent,
		AzureStoragePipe,
		IconButtonComponent,
		TranslateModule,
		VideoViewerComponent,
		AttachmentItemComponent,
		SharedWithTooltipPipe
	],
	templateUrl: './performance-report-attachments.component.html'
})
export class PerformanceReportAttachmentsComponent {
	@Input({ required: true }) clubId!: string;
	@Input({ required: true }) attachments!: Attachment[];
	@Input({ required: true }) isLoading!: boolean;
	@Input({ required: true }) editable!: boolean;
	@Input({ required: false }) showDeleteAttachment!: boolean;
	@Input({ required: false }) showEditAttachment!: boolean;
	@Input({ required: true }) attachmentType!: 'documents' | 'videos';
	@Input({ required: false }) sharedWithOptions!: SelectItemGroup[];

	@Output() deleteAttachment: EventEmitter<Attachment> = new EventEmitter<Attachment>();
	@Output() editAttachment: EventEmitter<void> = new EventEmitter<void>();

	readonly #azureStorageApi = inject(AzureStorageApi);
	readonly #translateService = inject(TranslateService);
	readonly #confirmationService = inject(ConfirmationService);
	readonly #errorService = inject(ErrorService);

	removeAttachment(data: Attachment) {
		this.#confirmationService.confirm({
			message: this.#translateService.instant('confirm.delete'),
			header: 'IterPRO',
			accept: () => {
				this.#azureStorageApi.removeFile(this.clubId, data.url).subscribe({
					next: () => this.deleteAttachment.emit(data),
					error: (error: Error) => this.#errorService.handleError(error)
				});
			}
		});
	}
}

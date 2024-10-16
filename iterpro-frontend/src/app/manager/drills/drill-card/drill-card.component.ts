import { Component, Input, OnInit, inject } from '@angular/core';
import { Attachment, Customer, Drill } from '@iterpro/shared/data-access/sdk';
import { AzureStoragePipe, getTypeFromFileName } from '@iterpro/shared/utils/common-utils';

@Component({
	selector: 'iterpro-drill-card',
	templateUrl: './drill-card.component.html',
	styleUrls: ['./drill-card.component.scss']
})
export class DrillCardComponent implements OnInit {
	@Input() isLoading: boolean;
	@Input() customers: Customer[];
	@Input() item: Drill;
	drillImage: string;

	readonly #azurePipe = inject(AzureStoragePipe);

	ngOnInit(): void {
		const attachmentImage = this.findFirstImageUrl();
		this.drillImage = attachmentImage ? this.#azurePipe.transform(attachmentImage.downloadUrl) : undefined;
	}

	private findFirstImageUrl(): Attachment {
		if (!this.item?._attachments || this.item?._attachments.length === 0) return undefined;
		if (this.item.pinnedAttachmentId) {
			const pinnedAttachment = this.item._attachments.find(({ id }) => id === this.item.pinnedAttachmentId);
			if (this.isImage(pinnedAttachment.name)) {
				return pinnedAttachment;
			}
		}
		const image = this.item._attachments.find(({ name }) => this.isImage(name));
		return image;
	}

	isImage(fileName: string): boolean {
		return getTypeFromFileName(fileName) === 'image';
	}
}

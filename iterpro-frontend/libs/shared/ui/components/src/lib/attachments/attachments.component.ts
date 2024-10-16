import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Attachment } from '@iterpro/shared/data-access/sdk';
import { AttachmentItemComponent } from '../attachment-item/attachment-item.component';
import { TranslateModule } from '@ngx-translate/core';
import { SelectItemGroup } from 'primeng/api';
import { SharedWithTooltipPipe } from '@iterpro/shared/ui/pipes';
@Component({
	standalone: true,
	imports: [AttachmentItemComponent, TranslateModule, SharedWithTooltipPipe],
	selector: 'iterpro-attachments',
	templateUrl: './attachments.component.html'
})
export class AttachmentsComponent {
	@Input({ required: true }) attachments: Attachment[] = [];
	@Input({ required: true }) showEditButton!: boolean;
	@Input({ required: true }) showDeleteButton!: boolean;
	@Input({ required: false }) sharedWithOptions!: SelectItemGroup[];
	@Output() editAttachmentClicked: EventEmitter<Attachment> = new EventEmitter<Attachment>();
}

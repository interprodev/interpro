import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import { Attachment, PlayerReportHistory, ScoutingGameReportAttachmentType } from '@iterpro/shared/data-access/sdk';
import { FormatDateUserSettingPipe, TINY_EDITOR_OPTIONS } from '@iterpro/shared/utils/common-utils';
import { v4 as uuid } from 'uuid';
import {
	IconButtonComponent,
	PictureComponent,
	PlayerFlagComponent,
	PlayerProviderWidgetComponent,
	TacticBoardComponent
} from '@iterpro/shared/ui/components';
import { TranslateModule } from '@ngx-translate/core';
import { PerformanceReportHistoryComponent } from '../performance-report-history/performance-report-history.component';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { PerformanceReportAttachmentsHeaderComponent } from '../performance-report-attachments-header/performance-report-attachments-header.component';
import { PerformanceReportAttachmentsComponent } from '../performance-report-attachments/performance-report-attachments.component';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { MarkedPipe } from '@iterpro/shared/ui/pipes';
import { FormsModule } from '@angular/forms';
import { CloudUploadComponent } from '@iterpro/shared/feature-components';

@Component({
	selector: 'iterpro-player-performance-report',
	standalone: true,
	imports: [
		IconButtonComponent,
		TranslateModule,
		PerformanceReportHistoryComponent,
		PlayerProviderWidgetComponent,
		PictureComponent,
		DatePipe,
		PlayerFlagComponent,
		TacticBoardComponent,
		FormatDateUserSettingPipe,
		PrimeNgModule,
		PerformanceReportAttachmentsHeaderComponent,
		PerformanceReportAttachmentsComponent,
		EditorComponent,
		MarkedPipe,
		FormsModule,
		CloudUploadComponent,
		NgTemplateOutlet
	],
	templateUrl: './player-performance-report.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerPerformanceReportComponent {
	@Input({ required: true }) clubId!: string;
	@Input({ required: true }) editMode!: boolean;
	@Input({ required: true }) editable!: boolean;
	@Input({ required: false }) deletable = true;
	@Input({ required: true }) wyscoutId!: number;
	@Input({ required: false }) instatId!: number;
	@Input({ required: true }) photoUrl!: string;
	@Input({ required: true }) position!: string;
	@Input({ required: true }) birthDate!: Date;
	@Input({ required: true }) nationality!: string;
	@Input({ required: true }) weight!: number;
	@Input({ required: true }) height!: number;
	@Input({ required: true }) foot!: string;
	@Input({ required: true }) displayName!: string;
	@Input({ required: true }) showRedirectIcon!: boolean;
	@Input({ required: true }) authorOptions!: SelectItem[];
	@Input({ required: false }) showSharedWith!: boolean;
	@Input({ required: false }) globalHistory!: PlayerReportHistory;
	@Input({ required: false }) reportDataHistory!: PlayerReportHistory;
	@Input({ required: false }) notesHistory!: PlayerReportHistory;
	@Input({ required: true }) currentUserId!: string;
	@Input({ required: true }) notes!: string;
	@Input({ required: false }) customVideosTemplate = false;
	@Input({ required: false }) videoAttachments!: Attachment[];
	@Input({ required: false }) customDocumentClickEvent = false;
	@Input({ required: true }) docAttachments!: Attachment[];
	@Input({ required: false }) showEditAttachment!: boolean;
	@Input({ required: false }) showDeleteAttachment!: boolean;
	@Input({ required: false }) sharedWithOptions!: SelectItemGroup[];
	@Input({ required: true }) redirectTooltip!: string;
	@Output() deleteClicked: EventEmitter<void> = new EventEmitter<void>();
	@Output() redirectClicked: EventEmitter<void> = new EventEmitter<void>();
	@Output() addAttachment: EventEmitter<{ attachment: Attachment; type: ScoutingGameReportAttachmentType }> =
		new EventEmitter<{ attachment: Attachment; type: ScoutingGameReportAttachmentType }>();
	@Output() deleteAttachment: EventEmitter<{ attachment: Attachment; type: ScoutingGameReportAttachmentType }> =
		new EventEmitter<{ attachment: Attachment; type: ScoutingGameReportAttachmentType }>();
	@Output() editDocumentClicked: EventEmitter<void> = new EventEmitter<void>();
	@Output() reportNotesChanged: EventEmitter<string> = new EventEmitter<string>();
	@Output() addVideoClicked: EventEmitter<void> = new EventEmitter<void>();
	@Output() addDocumentClicked: EventEmitter<void> = new EventEmitter<void>();
	isLoadingVideos = false;
	isLoadingDocs = false;
	protected readonly tinyEditorInit = TINY_EDITOR_OPTIONS;

	addAttachmentCompleted = (downloadUrl: string, url: string, name: string, type: ScoutingGameReportAttachmentType) => {
		const attachment = this.createAttachment(downloadUrl, url, name);
		this.addAttachment.emit({ attachment, type });
		type === '_videos' ? (this.isLoadingVideos = false) : (this.isLoadingDocs = false);
	};

	private createAttachment(downloadUrl: string, url: string, name: string): Attachment {
		return new Attachment({
			id: uuid(),
			name,
			downloadUrl,
			url,
			date: new Date(),
			authorId: this.currentUserId
		});
	}
}

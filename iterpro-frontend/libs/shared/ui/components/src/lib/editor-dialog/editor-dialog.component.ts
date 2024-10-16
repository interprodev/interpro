import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MarkedPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TINY_EDITOR_OPTIONS } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextareaModule } from 'primeng/inputtextarea';

@Component({
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		TranslateModule,
		MarkedPipe,
		PrimeNgModule,
		EditorComponent,
		InputTextareaModule
	],
	selector: 'iterpro-editor-dialog',
	templateUrl: './editor-dialog.component.html',
})
export class EditorDialogComponent {
	@Input() content!: string;
	@Input() editable!: boolean;
	@Input() noMarkdown?: boolean; // pass it as true to use a classic textarea
	protected readonly tinyEditorInit = TINY_EDITOR_OPTIONS;

	constructor(private readonly ref: DynamicDialogRef, private readonly config: DynamicDialogConfig) {
		if (this.config.data) {
			this.noMarkdown = this.config.data.noMarkdown;
			this.content = this.config.data.content;
			this.editable = this.config.data.editable;
		}
	}

	onConfirm() {
		this.ref.close(this.content);
	}

	onDiscard() {
		this.ref.close();
	}
}

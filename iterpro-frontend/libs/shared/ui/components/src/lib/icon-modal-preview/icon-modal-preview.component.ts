import { NgIf } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
	getExtensionFromFileName,
	getTypeFromExtension,
	getTypeFromFileName
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { TooltipModule } from 'primeng/tooltip';
import { ModalPreviewComponent } from '../modal-preview/modal-preview.component';

@Component({
	standalone: true,
	imports: [NgIf, TranslateModule, ModalPreviewComponent, TooltipModule, PdfViewerModule],
	selector: 'iterpro-icon-modal-preview',
	templateUrl: './icon-modal-preview.component.html',
	styleUrls: ['./icon-modal-preview.component.scss']
})
export class IconModalPreviewComponent implements OnChanges {
	@Input() url: string | undefined = '';
	@Input() name: string | undefined = '';
	@Input() extension = '';

	ngOnChanges(changes: SimpleChanges) {
		if (
			!!changes['name'] &&
			!!changes['name'].currentValue &&
			(!changes['extension'] || changes['extension'].currentValue === '')
		) {
			this.extension = getExtensionFromFileName(changes['name'].currentValue) || '';
		}
	}

	isImage(): boolean {
		return this.name ? getTypeFromFileName(this.name) === 'image' : false;
	}

	isPdf(): boolean {
		return this.extension === 'pdf';
	}

	isVideo(): boolean {
		return getTypeFromExtension(this.extension) === 'video';
	}
}

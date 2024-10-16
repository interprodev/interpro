import { Component, Input } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { ModalPreviewComponent } from '../modal-preview/modal-preview.component';

@Component({
	standalone: true,
	imports: [ModalPreviewComponent],
	selector: 'iterpro-img-modal-preview',
	template: `
		<iterpro-modal-preview>
			<img handler class="m-thumb" [src]="thumb" />
			<img content class="m-fullsize" [src]="full" />
		</iterpro-modal-preview>
	`,
	styles: [
		`
			.m-thumb {
				display: block;
				width: 100%;
				max-width: 300px;
				cursor: pointer;
			}
			.m-fullsize {
				display: block;
				width: 100%;
				height: 100%;
				max-width: 100%;
				max-height: 100%;
				object-fit: scale-down;
			}
		`
	]
})
export class ImgModalPreviewComponent {
	@Input() thumb: SafeUrl | undefined = undefined;
	@Input() full: SafeUrl | undefined = undefined;
}

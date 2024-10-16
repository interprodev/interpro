import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Customer, VideoAsset } from '@iterpro/shared/data-access/sdk';

@Component({
	selector: 'iterpro-video-list-item',
	templateUrl: './video-list-item.component.html'
})
export class VideoListItemComponent {
	@Input({ required: true }) item: VideoAsset;
	@Input({ required: true }) customers: Partial<Customer[]>;
	@Output() select: EventEmitter<VideoAsset> = new EventEmitter();
	@Input() paddingBase = 'tw-p-4';

	play() {
		this.select.emit(this.item);
	}
}

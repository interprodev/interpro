import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Customer, SelectedVideo, VideoAsset } from '@iterpro/shared/data-access/sdk';

@Component({
	selector: 'iterpro-video-list',
	templateUrl: './video-list.component.html',
	styleUrls: ['./video-list.component.css']
})
export class VideoListComponent {
	@Input() readonly columnsToDisplay: number = 4;
	@Input({ required: true }) customers: Partial<Customer[]>;
	@Input({ required: true })
	set items(items: VideoAsset[]) {
		if (items) {
			this.#allItemsBackup = items;
			this.loadVideos();
		}
	}
	@Output() select: EventEmitter<SelectedVideo> = new EventEmitter();

	#allItemsBackup: VideoAsset[] = [];
	displayedItems: VideoAsset[] = [];
	loading: boolean = false;
	currentIndex: number = 0;
	@ViewChild('list', { static: false }) elem: ElementRef;

	private loadVideos() {
		this.loading = true;
		const startIndex = this.currentIndex;
		const endIndex = Math.min(startIndex + this.columnsToDisplay, this.#allItemsBackup.length);
		this.displayedItems = this.#allItemsBackup.slice(startIndex, endIndex);
		setTimeout(() => (this.loading = false), 300);
	}

	scrollForward() {
		if (this.currentIndex + this.columnsToDisplay < this.#allItemsBackup.length) {
			this.currentIndex += this.columnsToDisplay;
			this.loadVideos();
		}
	}

	scrollBackward() {
		if (this.currentIndex - this.columnsToDisplay >= 0) {
			this.currentIndex -= this.columnsToDisplay;
			this.loadVideos();
		}
	}

	isScrollForwardDisabled(): boolean {
		return this.currentIndex + this.columnsToDisplay >= this.#allItemsBackup.length;
	}

	isScrollBackwardDisabled(): boolean {
		return this.currentIndex - this.columnsToDisplay < 0;
	}

	selectItem(item: VideoAsset) {
		this.select.emit({ item });
	}
}

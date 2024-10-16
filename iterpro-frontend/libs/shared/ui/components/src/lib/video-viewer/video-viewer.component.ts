import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VgApiService, VgCoreModule } from '@videogular/ngx-videogular/core';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';
import { VgBufferingModule } from '@videogular/ngx-videogular/buffering';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';

@Component({
	selector: 'iterpro-video-viewer',
	standalone: true,
	imports: [CommonModule, VgCoreModule, VgOverlayPlayModule, VgBufferingModule, VgControlsModule],
	templateUrl: './video-viewer.component.html',
	styleUrl: './video-viewer.component.scss'
})
export class VideoViewerComponent {
	@Input({required: true}) videoUrl!: string;
	@Input({required: true}) videoLoaded!: boolean;
	@Output() playerReady: EventEmitter<VgApiService> = new EventEmitter<VgApiService>();

	onPlayerReady(videoApi: VgApiService) {
		this.playerReady.emit(videoApi);
	}
}

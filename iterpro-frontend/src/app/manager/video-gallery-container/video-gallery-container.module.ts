import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { VideoService, unsavedChangesGuard } from '@iterpro/shared/utils/common-utils';
import { VideoModule } from '../shared/ui/video/video.module';
import { VideoGalleryContainerComponent } from './video-gallery-container.component';

const routes: Route[] = [
	{
		path: '',
		component: VideoGalleryContainerComponent,
		canDeactivate: [unsavedChangesGuard]
	}
];

@NgModule({
	imports: [CommonModule, RouterModule.forChild(routes), VideoModule],
	declarations: [VideoGalleryContainerComponent],
	providers: [VideoService]
})
export class VideoGalleryContainerModule {}

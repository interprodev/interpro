import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MultipleCloudUploadComponent, MultipleFileUploadComponent } from '@iterpro/shared/feature-components';
import { PictureComponent, RedirectIconComponent } from '@iterpro/shared/ui/components';
import { IterproAutofocusDirective, LazyLoadImagesDirective } from '@iterpro/shared/ui/directives';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AzureStoragePipe, FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { VgBufferingModule } from '@videogular/ngx-videogular/buffering';
import { VerticalCommentThreadedComponent } from '../../../../shared/comment/vertical-comment-threaded/vertical-comment-threaded.component';
import { VideoFormComponent } from './video-form/video-form.component';
import { VideoGalleryFilterComponent } from './video-gallery-filter/video-gallery-filter.component';
import { VideoGalleryComponent } from './video-gallery/video-gallery.component';
import { VideoListItemComponent } from './video-list-item/video-list-item.component';
import { VideoListComponent } from './video-list/video-list.component';
import { VideoPlayerComponent } from './video-player/video-player.component';
import { VgCoreModule } from '@videogular/ngx-videogular/core';
import { ArrayFromNumberPipe, CustomerFieldPipe, CustomerNamePipe, DurationLabelPipe } from '@iterpro/shared/ui/pipes';

@NgModule({
	imports: [
		CommonModule,
		PrimeNgModule,
		RouterModule,
		FormsModule,
		ReactiveFormsModule,
		RouterModule,
		TranslateModule,
		VgBufferingModule,
		MultipleCloudUploadComponent,
		MultipleFileUploadComponent,
		RedirectIconComponent,
		VerticalCommentThreadedComponent,
		AzureStoragePipe,
		FormatDateUserSettingPipe,
		LazyLoadImagesDirective,
		VgCoreModule,
		CustomerNamePipe,
		DurationLabelPipe,
		ArrayFromNumberPipe,
		PictureComponent,
		CustomerFieldPipe,
		IterproAutofocusDirective
	],
	declarations: [
		VideoFormComponent,
		VideoGalleryComponent,
		VideoGalleryFilterComponent,
		VideoListComponent,
		VideoListItemComponent,
		VideoPlayerComponent
	],
	exports: [VideoGalleryComponent, VideoFormComponent, VideoListItemComponent]
})
export class VideoModule {}

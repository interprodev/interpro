import { FormControl } from '@angular/forms';
import { VideoCategory } from '@iterpro/shared/data-access/sdk';
import { SelectItem } from 'primeng/api';

export type VideoForm = {
	title: FormControl<string>;
	event: FormControl<string>;
	category: FormControl<VideoCategory>;
	stage: FormControl<string>;
	subtitle: FormControl<string>;
	players: FormControl<string[]>;
	staffs: FormControl<{ displayName: string; id: string }[]>;
	sharedWithPeople: FormControl<string[]>;
	tags: FormControl<string>;
};

export enum VideoGalleryViewType {
	Visualization = 1,
	Upload = 2
}

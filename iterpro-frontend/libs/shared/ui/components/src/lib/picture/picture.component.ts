import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { AzureStoragePipe, DEFAULT_PERSON_IMAGE_BASE64, isBase64Image } from '@iterpro/shared/utils/common-utils';

@Component({
	standalone: true,
	imports: [AzureStoragePipe],
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'iterpro-picture',
	template: `<img
		[class]="baseClass() + (additionalClass() ? ' ' + additionalClass() : '')"
		[src]="image()"
		[alt]="alt()"
		(error)="errorHandler()"
	/>`,
	styles: [
		`
			img {
				object-fit: cover;
			}
		`
	]
})
export class PictureComponent {
	readonly #azureUrlPipe = inject(AzureStoragePipe);
	baseClass = input<string>('tw-h-full tw-w-full');
	additionalClass = input<string>();
	alt = input<string>();
	photoUrl = input.required<string>();
	type = input<UserPictureType>('person');
	image = computed(() => {
		const defaultImage = this.getDefaultImage();
		if (!this.photoUrl()) {
			return defaultImage;
		}
		if (this.photoUrl() && isBase64Image(this.photoUrl())) {
			return this.photoUrl();
		}
		return this.#azureUrlPipe.transform(this.photoUrl()) || defaultImage;
	});

	errorHandler(): void {
		const defaultImage = this.getDefaultImage();
		this.image = computed(() => defaultImage);
	}

	private getDefaultImage(): string {
		switch (this.type()) {
			case 'person':
				return DEFAULT_PERSON_IMAGE_BASE64;
			case 'team':
				return 'assets/img/default_crest.png';
			default:
				console.error('Invalid type for UserPictureComponent: ', this.type());
				return '';
		}
	}
}
type UserPictureType = 'person' | 'team';

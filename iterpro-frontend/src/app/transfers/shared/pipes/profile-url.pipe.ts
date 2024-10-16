import { Pipe, PipeTransform, inject } from '@angular/core';
import { Player } from '@iterpro/shared/data-access/sdk';
import { AzureStoragePipe, isBase64Image } from '@iterpro/shared/utils/common-utils';

@Pipe({
	name: 'profileUrl'
})
export class ProfileUrlPipe implements PipeTransform {
	readonly #azureUrlPipe = inject(AzureStoragePipe);

	transform(value: Player): string {
		if (!value?.downloadUrl) {
			return '';
		}

		if (value && value.downloadUrl && isBase64Image(value.downloadUrl)) {
			return value.downloadUrl;
		}

		return this.#azureUrlPipe.transform(value.downloadUrl);
	}
}

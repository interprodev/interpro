import { Pipe, PipeTransform } from '@angular/core';
import { Notification } from '@iterpro/shared/data-access/sdk';
import { AzureStoragePipe, isBase64Image } from '@iterpro/shared/utils/common-utils';

@Pipe({
	standalone: true,
	name: 'notificationImage'
})
export class NotificationImagePipe implements PipeTransform {
	constructor(private readonly azureUrlPipe: AzureStoragePipe) {}

	transform({ img }: Notification): string | null {
		if (img && isBase64Image(img)) return img;
		else {
			const urlAzure = this.azureUrlPipe.transform(img);
			return urlAzure || null;
		}
	}
}

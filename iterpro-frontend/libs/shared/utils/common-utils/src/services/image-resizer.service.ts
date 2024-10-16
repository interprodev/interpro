import { Injectable, inject } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { ImageService } from './image.service';

@Injectable({
	providedIn: 'root'
})
export class ImageResizerService {
	readonly #imageDownloadService = inject(ImageService);

	async reduceSizeToRatio(file: File, ratio = 0.66, quality = 0.7): Promise<File> {
		const promise: Promise<File> = new Promise<File>((resolve, reject) => {
			try {
				const myReader: FileReader = new FileReader();
				myReader.onloadend = (loadEvent: any) => {
					const image = new Image();
					image.onload = () => {
						const oldWidth = image.width;
						const oldHeight = image.height;
						const newWidth = Math.floor(oldWidth * ratio);
						const newHeight = Math.floor((oldHeight / oldWidth) * newWidth);
						const canvas = document.createElement('canvas');
						canvas.width = newWidth;
						canvas.height = newHeight;
						const ctx = canvas.getContext('2d');
						if (ctx) ctx.drawImage(image, 0, 0, newWidth, newHeight);
						return resolve(
							this.#imageDownloadService.dataURItoFilename(canvas.toDataURL('image/jpeg', quality), uuid())
						);
					};
					image.src = loadEvent.target.result;
				};
				myReader.readAsDataURL(file);
			} catch (e) {
				reject(e);
			}
		});

		return promise;
	}
}

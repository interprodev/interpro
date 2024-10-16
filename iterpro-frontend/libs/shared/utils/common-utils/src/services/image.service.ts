import { Injectable, inject } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { AzureStorageService } from './azure-storage.service';
import { ErrorService } from './error.service';

@Injectable({
	providedIn: 'root'
})
export class ImageService {
	readonly #errorService = inject(ErrorService);
	readonly #azureUploadService = inject(AzureStorageService);

	getBase64ImageFromURL(url: string) {
		return new Observable((observer: Observer<string>) => {
			// create an image object
			const img = new Image();
			img.crossOrigin = 'Anonymous';
			img.src = url;
			if (!img.complete) {
				// This will call another method that will create image from url
				img.onload = () => {
					observer.next(this.getBase64Image(img));
					observer.complete();
				};
				img.onerror = err => {
					observer.error(err);
				};
			} else {
				observer.next(this.getBase64Image(img));
				observer.complete();
			}
		});
	}

	getBase64Image(img: HTMLImageElement): string {
		// We create a HTML canvas object that will create a 2d image
		const canvas = document.createElement('canvas');
		canvas.width = img.width;
		canvas.height = img.height;
		const ctx = canvas.getContext('2d');
		// This will draw image
		ctx?.drawImage(img, 0, 0);
		// Convert the drawn image to Data URL
		return canvas.toDataURL('image/jpeg');
	}

	dataURItoFilename(base64String: string, filename: string): File {
		const dataURI = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
		const byteString = window.atob(dataURI);
		const arrayBuffer = new ArrayBuffer(byteString.length);
		const int8Array = new Uint8Array(arrayBuffer);
		for (let i = 0; i < byteString.length; i++) {
			int8Array[i] = byteString.charCodeAt(i);
		}
		const blob = new Blob([int8Array], { type: 'image/jpeg' });
		// call method that creates a blob from dataUri
		return new File([blob], filename, { type: 'image/jpeg' });
	}

	async uploadThumbnail(base64: string, filename: string): Promise<string> {
		let url = '';
		try {
			const tempImage = this.dataURItoFilename(base64, filename);
			url = await this.#azureUploadService.uploadBrowserFileToAzureStore(tempImage);
		} catch (error) {
			this.#errorService.handleError(error as Error);
		}
		return url;
	}
}

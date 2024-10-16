import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@iterpro/config';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class JsonLoaderService {
	private readonly fallbackBaseUrl: string = './assets';
	private readonly extension: string = '.json';
	readonly #httpClient: HttpClient = inject(HttpClient);

	public loadJson(fileName: string, path = ''): Observable<object> {
		const pathToFileName = this.parsePath(path) + this.parseFileName(fileName);

		return this.#httpClient.get(`${environment.CDN_URL}${pathToFileName}`).pipe(
			catchError(error => {
				// Handling Error
				console.error('Failed to load', fileName);
				console.error(error);
				console.error('Falling back to local files');

				return this.#httpClient.get(`${this.fallbackBaseUrl}${pathToFileName}`);
			})
		);
	}

	private parseFileName(fileName: string): string {
		const extension = this.verifyExtension(fileName);
		return `${this.parsePath(fileName)}${extension}`;
	}

	private parsePath(path: string): string {
		return `${this.verifyPath(path)}${path}`;
	}

	private verifyPath(path: string): string {
		return path.length > 0 && path.charAt(0) === '/' ? '' : '/';
	}

	private verifyExtension(fileName: string): string {
		return fileName.lastIndexOf(this.extension) === fileName.length - this.extension.length ? '' : this.extension;
	}
}

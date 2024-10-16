import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@iterpro/config';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import {
	TRANSLATIONS_FILE_SUFFIX,
	TRANSLATIONS_FOLDER,
	TRANSLATIONS_FOLDER_FALLBACK
} from '../../constants/i18n/translations.constants';
import { SERVER_TIMEOUT } from '../../constants/server.constants';

export class TranslateFallbackHttpLoader implements TranslateLoader {
	readonly #httpClientService: HttpClient = inject(HttpClient);

	public getTranslation(lang: string): Observable<object> {
		return this.#httpClientService
			.get(`${environment.CDN_URL}${TRANSLATIONS_FOLDER}${lang}${TRANSLATIONS_FILE_SUFFIX}`)
			.pipe(
				timeout(SERVER_TIMEOUT),
				catchError(error => {
					console.error('Translation: Failed to get translations from ' + TRANSLATIONS_FOLDER, error);
					console.error('Translation: Falling back to local files ' + TRANSLATIONS_FOLDER_FALLBACK);

					return this.#httpClientService.get(`${TRANSLATIONS_FOLDER_FALLBACK}${'en-GB'}${TRANSLATIONS_FILE_SUFFIX}`);
				})
			);
	}
}

export const createTranslateLoader = (): TranslateLoader => new TranslateFallbackHttpLoader();

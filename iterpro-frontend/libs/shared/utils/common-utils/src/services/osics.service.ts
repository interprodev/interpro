import { Injectable, inject } from '@angular/core';
import { ErrorService } from './error.service';
import { JsonLoaderService } from './json-loader.service';

export interface OSICS {
	code: string;
	diagnosis: string;
	bodyPart: string;
	tissue: string;
	pathology: string;
	system: string;
}

@Injectable({
	providedIn: 'root'
})
export class OsicsService {
	private osics: OSICS[] = [];

	readonly #jsonLoaderService: JsonLoaderService = inject(JsonLoaderService);
	readonly #errorService: ErrorService = inject(ErrorService);

	public initOSICSList(): void {
		this.#jsonLoaderService.loadJson('osics', 'json').subscribe({
			next: res => (this.osics = <OSICS[]>res),
			error: (error: Error) => this.#errorService.handleError(error)
		});
	}

	public getOSICSList(): OSICS[] {
		return this.osics;
	}

	public getOSICSDiagnosis(value: string): string | null | undefined {
		return value ? this.osics.find(({ code }) => code === value)?.diagnosis : null;
	}
}

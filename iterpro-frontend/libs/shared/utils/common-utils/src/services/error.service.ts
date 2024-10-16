import { ErrorHandler, Injectable, inject } from '@angular/core';
import { AlertService } from './alert.service';

@Injectable({
	providedIn: 'root'
})
export class ErrorService implements ErrorHandler {
	readonly #alertService: AlertService = inject(AlertService);

	handleError(error: Error | string): void {
		console.error('ErrorService', error);
		const message = typeof error === 'string' ? error : error.message;
		this.#alertService.notify('error', 'error', message, false);
	}
}

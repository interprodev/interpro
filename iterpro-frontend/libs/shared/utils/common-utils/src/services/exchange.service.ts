import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class ExchangeService {
	private readonly baseURL = 'api.frankfurter.app';
	readonly #httpClient = inject(HttpClient);

	exchange(to: string, from = 'EUR') {
		return this.#httpClient.get(`https://${this.baseURL}/latest?from=${from}&to=${to}`);
	}
}

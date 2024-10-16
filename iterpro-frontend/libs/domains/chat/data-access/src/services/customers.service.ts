import { Injectable, inject } from '@angular/core';
import { ChatApi } from '@iterpro/shared/data-access/sdk';
import { AzureStoragePipe } from '@iterpro/shared/utils/common-utils';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Contact } from '../models/contact.model';

@Injectable({ providedIn: 'root' })
export class CustomersService {
	readonly #azureStoragePipe = inject(AzureStoragePipe);
	readonly #chatApi = inject(ChatApi);

	getCustomersPlayers(): Observable<Contact[]> {
		return this.#chatApi.getPlayers().pipe(
			map(players =>
				players.map(
					(p: any): Contact => ({
						id: p.id,
						email: p.email ? [p.email] : null,
						name: p.displayName,
						photoUrl: this.#azureStoragePipe.transform(p.downloadUrl),
						locale: p.nationality || null,
						role: 'player'
					})
				)
			)
		);
	}

	getCustomers(): Observable<Contact[]> {
		return this.#chatApi.getStaffs().pipe(
			map(customers =>
				customers.map(
					(c: any): Contact => ({
						id: c.id,
						email: c.email ? [c.email] : null,
						name: `${c.firstName} ${c.lastName}`,
						photoUrl: this.#azureStoragePipe.transform(c.downloadUrl),
						locale: c.nationality || null,
						role: 'staff'
					})
				)
			)
		);
	}
}

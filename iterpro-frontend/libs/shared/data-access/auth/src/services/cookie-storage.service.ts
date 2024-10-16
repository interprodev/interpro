import { Injectable, inject } from '@angular/core';
import { InternalStorage, SDKToken } from '@iterpro/shared/data-access/sdk';

@Injectable({
	providedIn: 'root'
})
export class CookieStorageService {
	readonly #cookieService = inject(InternalStorage);
	private prefix = '$LoopBackSDK$';

	public toCookie(token: SDKToken | any) {
		const expires = this.expirationDate(token);
		this.persist('id', token.id, expires);
		this.persist('user', token.user, expires);
		this.persist('userId', token.userId, expires);
		this.persist('created', token.created, expires);
		this.persist('ttl', token.ttl, expires);
		this.persist('rememberMe', token.rememberMe, expires);
		this.persist('modules', token['enabledModules'], expires);
	}

	public removeCookie(token: SDKToken = new SDKToken()): void {
		Object.keys(token).forEach((prop: string) => this.#cookieService.remove(`${this.prefix}${prop}`));
	}

	private persist(prop: string, value: any, expires: Date | null = null): void {
		try {
			const key = `${this.prefix}${prop}`;
			const data = typeof value === 'object' ? JSON.stringify(value) : value;
			this.#cookieService.set(key, data, expires as Date);
		} catch (err) {
			throw new Error('Cannot access local/session storage:');
		}
	}

	private expirationDate(token: SDKToken): Date | null {
		let expires = null;

		if (token.rememberMe) {
			const today = new Date();
			expires = new Date(today.getTime() + token.ttl * 1000);
		}

		return expires;
	}
}

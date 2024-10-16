import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class StorageService {
	private store: any = {};

	load(key) {
		try {
			const item = window.localStorage.getItem(key);
			return item ? JSON.parse(item) : {};
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error('Local storage error', e);
			return this.store[key] || {};
		}
	}

	save(key, data) {
		try {
			window.localStorage.setItem(key, JSON.stringify(data));
		} catch (e) {
			this.store[key] = data;
			// eslint-disable-next-line no-console
			console.error('Local storage error', e);
		}
	}
}

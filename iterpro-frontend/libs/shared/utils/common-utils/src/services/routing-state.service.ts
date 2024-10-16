import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class RoutingStateService {
	readonly #router = inject(Router);
	private history: string[] = [];

	public saveHistory(): void {
		this.#router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((navigationEnd: any) => {
			this.history.push(navigationEnd.url);
		});
	}

	public getHistory(): string[] {
		return this.history;
	}

	// NOTE: deprecated
	comeFromAdministration(): boolean {
		let wasInAdministration = false;
		let wasInHome = false;
		const reverseHystory = [...this.history].reverse();

		reverseHystory.some(url => {
			wasInHome = url.indexOf('home') > -1;
			wasInAdministration = url.indexOf('administration') > -1;
			return wasInHome || wasInAdministration;
		});

		return wasInAdministration;
	}
}

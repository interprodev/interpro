import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Observable } from 'rxjs';
/**
 * Service to disable the BlockUI interceptor.
 *
 * Use it to manually manage the loading spinning wheel
 * (eg: components with custom loading spinner)
 *
 */
@Injectable({
	providedIn: 'root'
})
export class BlockUiInterceptorService {
	private _enabled = true;

	public get enabled() {
		return this._enabled;
	}

	constructor(router: Router) {
		// enable blockUiInterceptor on route change
		router.events.subscribe(event => {
			if (event instanceof NavigationStart) {
				this._enabled = true;
				// maybe should close the blockUI
			}
		});
	}

	disableInterceptor() {
		this._enabled = false;
	}

	enableInterceptor() {
		this._enabled = true;
	}

	disableOnce(observable: Observable<any>): Observable<any> {
		this._enabled = false;
		return observable;
	}
}

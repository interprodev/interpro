import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { messages } from '../constants/loader-messages';
import { BlockUiInterceptorService } from '../services/block-ui-interceptor.service';

/**
 * The BlockUI interceptor automatically show a spinning wheel when an http request is done.
 * To disable this feature and manually manage the BlockUI spinning wheel check the BlockUiInterceptorService
 * Rerquest of assets and notifications are ignored
 *
 */
@Injectable({
	providedIn: 'root'
})
export class BlockUIInterceptor implements HttpInterceptor {
	@BlockUI('general') blockUI!: NgBlockUI;

	enabled = true;

	constructor(
		private blockUiInterceptorService: BlockUiInterceptorService,
		private translate: TranslateService,
		private router: Router
	) {}

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		return this.blockUIEnabled(request)
			? this.handleRequest(request, next, this.router.routerState.snapshot.url)
			: next.handle(request);
	}

	private handleRequest(request: HttpRequest<any>, next: HttpHandler, url: string): Observable<HttpEvent<any>> {
		const message = (messages as any)[url.split(';')[0]] || 'emptyString';
		this.blockUI.start(this.translate.instant(message));
		return next.handle(request).pipe(
			finalize(() => {
				this.blockUI.stop();
			})
		);
	}

	private blockUIEnabled(request: HttpRequest<any>) {
		return this.blockUiInterceptorService.enabled && this.hasHttpUrl(request) && !this.requestNotifications(request);
	}

	private hasHttpUrl(request: HttpRequest<any>) {
		return request.url.toLowerCase().indexOf('http') === 0;
	}
	private requestNotifications(request: HttpRequest<any>) {
		return request.url.toLowerCase().indexOf('api/notifications') > -1;
	}
}

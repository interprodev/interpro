import {
	HttpErrorResponse,
	HttpEvent,
	HttpHandler,
	HttpInterceptor,
	HttpRequest,
	HttpResponse
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthActions, AuthState } from '../+state';

@Injectable({
	providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {
	readonly #store$ = inject(Store<AuthState>);

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		return next.handle(request).pipe(
			tap(
				(event: HttpEvent<any>) => {
					if (event instanceof HttpResponse) {
						// do stuff with response if you want
					}
				},
				(err: any) => {
					if (err instanceof HttpErrorResponse) {
						if (err.status === 401) {
							this.#store$.dispatch(AuthActions.clearAuth());
						}
					}
				}
			)
		);
	}

	private _hasTokenExpired(error: any): boolean {
		return error.error.error.message === 'Auth token has expired';
	}
}

import { APP_INITIALIZER, NgModule } from '@angular/core';
import { environment } from '@iterpro/config';
import { AuthActions, AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import { LoopBackConfig } from '@iterpro/shared/data-access/sdk';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';

@NgModule({
	providers: [
		{
			provide: APP_INITIALIZER,
			multi: true,
			deps: [Store, Actions],
			useFactory: (authStore: Store<AuthState>, actions$: Actions) => {
				return () => {
					return new Promise((resolve, reject) => {
						/** Set Loopback Base URL */
						LoopBackConfig.setBaseURL(`${environment.BASE_URL}`);
						LoopBackConfig.setApiVersion('api');

						/**
						 * Load Current User if there's a token in the store
						 * Otherwise it would be null and __anonymous__ and initialization should be resolved
						 **/
						authStore
							.select(AuthSelectors.selectToken)
							.pipe(take(1))
							.subscribe(token => {
								if (!!token) {
									authStore.dispatch(AuthActions.loadCurrentUser());
								} else {
									authStore.dispatch(AuthActions.performLogout({}));
									resolve(true);
								}
							});

						/** Check when loading is completed */
						actions$
							.pipe(ofType(AuthActions.loadCurrentUserSuccess, AuthActions.loadCurrentUserFailure), take(1))
							.subscribe(() => resolve(true));
					});
				};
			}
		}
	]
})
export class InitializerModule {}

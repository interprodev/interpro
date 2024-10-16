import { inject } from '@angular/core';
import { LoopBackAuth } from '@iterpro/shared/data-access/sdk';
import { Store } from '@ngrx/store';
import { AuthActions, AuthState } from '../+state';

export const authGuard = (): boolean => {
	const auth = inject(LoopBackAuth);
	const store$ = inject(Store<AuthState>);
	const token = auth.getToken();
	const hasValidToken = token && token.id && auth.getCurrentUserData();

	if (!hasValidToken) {
		store$.dispatch(AuthActions.clearAuth());
		return false;
	}

	return true;
};

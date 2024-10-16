import { inject } from '@angular/core';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

export const chatGuard = (): Observable<boolean> => {
	const store$ = inject(Store<AuthState>);
	return store$.select(AuthSelectors.selectCanAccessChat);
};

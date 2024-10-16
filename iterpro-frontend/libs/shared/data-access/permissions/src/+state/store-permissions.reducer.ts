import { Action, createReducer, on } from '@ngrx/store';
import * as PermissionsActions from './store-permissions.actions';
import { PermissionsState, initialState } from './store-permissions.state';

const permissionsReducer = createReducer(
	initialState,
	on(
		PermissionsActions.routeRequested,
		(state: PermissionsState, { canAccess, error }): PermissionsState => ({ ...state, canAccess, error })
	)
);

export function reducer(state: PermissionsState | undefined, action: Action) {
	return permissionsReducer(state, action);
}

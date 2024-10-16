import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { AuthResponse, PermissionError } from '../interfaces/store-permissions.interfaces';
import { PermissionsState, permissionsStoreFeatureKey } from './store-permissions.state';

// GETTERS
const getCanAccess = (state: PermissionsState): boolean => state.canAccess;
const getError = (state: PermissionsState): PermissionError => state.error;

// SELECTORS
export const selectState: MemoizedSelector<object, PermissionsState> =
	createFeatureSelector<PermissionsState>(permissionsStoreFeatureKey);
export const selectCanAccess: MemoizedSelector<object, boolean> = createSelector(selectState, getCanAccess);
export const selectError: MemoizedSelector<object, PermissionError> = createSelector(selectState, getError);
export const selectPermission: MemoizedSelector<object, AuthResponse> = createSelector(
	selectCanAccess,
	selectError,
	(response, error) => ({ response, error })
);

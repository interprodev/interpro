import { createAction, props } from '@ngrx/store';
import { PermissionError } from '../interfaces/store-permissions.interfaces';

export const routeRequested = createAction(
	'[Permissions] Route Requested',
	props<{ canAccess: boolean; error: PermissionError }>()
);

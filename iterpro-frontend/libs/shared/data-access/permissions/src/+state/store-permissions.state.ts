import { PermissionError } from '../interfaces/store-permissions.interfaces';

export const permissionsStoreFeatureKey = 'permissionsStore';

export interface PermissionsState {
	canAccess: boolean;
	error: PermissionError;
}

export const initialState: PermissionsState = { canAccess: false, error: 'noCurrentTeam' };

import { RouterReducerState } from '@ngrx/router-store';

export const routeStoreFeatureKey = 'router';

export interface RouteState {
	readonly router: RouterReducerState<any>;
}

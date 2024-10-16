import { getRouterSelectors, RouterReducerState } from '@ngrx/router-store';
import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { RouteState, routeStoreFeatureKey } from './route-store.state';

export const selectRouter = createFeatureSelector<RouteState, RouterReducerState<any>>(routeStoreFeatureKey);

const {
	// 	selectQueryParams, // select the current route query params
	// 	selectQueryParam, // factory function to select a query param
	// 	selectRouteParams, // select the current route params
	// 	selectRouteParam, // factory function to select a route param
	// 	selectRouteData, // select the current route data
	selectUrl // select the current url
} = getRouterSelectors(selectRouter);

export const selectRouteUrl: MemoizedSelector<object, string> = createSelector(selectUrl, value =>
	!!value ? value : ''
);

// export const selectRouteId = selectRouteParam('id');
// export const selectStatus = selectQueryParam('status');

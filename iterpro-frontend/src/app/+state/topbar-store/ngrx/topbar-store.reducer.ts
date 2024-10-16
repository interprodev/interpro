import { Action, createReducer, on } from '@ngrx/store';
import * as TopbarStoreActions from './topbar-store.actions';
import { TopbarState, initialState } from './topbar-store.state';

export { TopbarState, initialState, topbarStoreFeatureKey } from './topbar-store.state';

const topbarStoreReducer = createReducer(
	initialState,
	on(TopbarStoreActions.setTopbarStatus, (state, { visible }): TopbarState => ({ ...state, visible }))
);

export function reducer(state: TopbarState | undefined, action: Action) {
	return topbarStoreReducer(state, action);
}

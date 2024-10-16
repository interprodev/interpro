import { Action, createReducer, on } from '@ngrx/store';
import * as SeasonStoreActions from './season-store.actions';
import { State, adapter, initialState } from './season-store.state';
export { State, initialState, seasonStoresFeatureKey } from './season-store.state';

const seasonStoreReducer = createReducer(
	initialState,
	on(SeasonStoreActions.initSeasonStores, (state, { seasonStores, current }) =>
		adapter.setAll(seasonStores, { ...state, current, selected: current })
	),
	on(SeasonStoreActions.performSeasonSelection, (state, { selected }) => ({ ...state, selected })),
	on(SeasonStoreActions.resetSeasonSelection, state => ({ ...state, selected: undefined }))
);

export function reducer(state: State | undefined, action: Action) {
	return seasonStoreReducer(state, action);
}

export const { selectAll } = adapter.getSelectors();

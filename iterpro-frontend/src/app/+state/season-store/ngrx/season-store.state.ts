import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { SeasonStore } from './season-store.model';

export const seasonStoresFeatureKey = 'seasonStores';

export interface State extends EntityState<SeasonStore> {
	// additional entities state properties
	selected: SeasonStore;
	current: SeasonStore;
}
export const adapter: EntityAdapter<SeasonStore> = createEntityAdapter<SeasonStore>();

export const initialState: State = adapter.getInitialState({
	// additional entity state properties
	selected: undefined,
	current: undefined
});

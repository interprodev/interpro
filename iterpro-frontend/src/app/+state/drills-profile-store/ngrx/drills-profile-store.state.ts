import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';

export const drillsProfileStoreFeatureKey = 'drillsProfileStore';

export interface DrillsProfileStore {
	id: string;
	num_splits: number;
	perc: {
		metric0: number;
		metric1: number;
		metric2: number;
		metric3: number;
		metric4: number;
		metric5: number;
	};
	abs: {
		metric0: number;
		metric1: number;
		metric2: number;
		metric3: number;
		metric4: number;
		metric5: number;
	};
}

export interface State extends EntityState<DrillsProfileStore> {
	isLoading: boolean;
	selectedDrillId: string;
	selectedDrillsProfile: DrillsProfileStore;
	readonly error: string;
}

export const adapter: EntityAdapter<DrillsProfileStore> = createEntityAdapter<DrillsProfileStore>();

export const initialState: State = adapter.getInitialState({
	isLoading: false,
	selectedDrillId: null,
	selectedDrillsProfile: null,
	error: null
});

import { Action, createAction, createReducer, on } from '@ngrx/store';
import * as DrillsProfileStoreActions from './drills-profile-store.actions';
import { State, initialState, adapter } from './drills-profile-store.state';
export { initialState, drillsProfileStoreFeatureKey, State } from './drills-profile-store.state';

const drillsProfileStoreReducer = createReducer(
	initialState,
	on(DrillsProfileStoreActions.selectedDrill, (state, { selectedDrillId }) => ({
		...state,
		selectedDrillId
	})),
	on(DrillsProfileStoreActions.performChartDataFromServer, state => ({ ...state, isLoading: true })),
	on(
		DrillsProfileStoreActions.performChartDataFailure,
		(state, { error }): State => ({ ...state, error, isLoading: false })
	),
	on(DrillsProfileStoreActions.performChartDataSuccess, (state, { chartData }) =>
		adapter.addOne(chartData, { ...state, selectedDrillsProfile: chartData, isLoading: false })
	),
  on(DrillsProfileStoreActions.addNewDrillClicked, (state) => ({
    ...state,
    selectedDrillsProfile: initialState.selectedDrillsProfile
  })),
	on(DrillsProfileStoreActions.clearState, () => initialState)
);

export function reducer(state: State | undefined, action: Action) {
	return drillsProfileStoreReducer(state, action);
}

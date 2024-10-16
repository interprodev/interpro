import { createAction, props } from '@ngrx/store';
import { DrillsProfileStore } from './drills-profile-store.state';

export const selectedDrill = createAction('[DrillsProfileStore] Selected Drill', props<{ selectedDrillId: string }>());

export const performChartDataFromServer = createAction(
	'[DrillsProfileStore] Get Charta Data from Server',
	props<{ selectedDrillId: string }>()
);

export const performChartDataSuccess = createAction(
	'[DrillsProfileStore] Chart Data Received',
	props<{ chartData: DrillsProfileStore }>()
);

export const performChartDataFailure = createAction('[DrillsProfileStore] Chart Data Failed', props<{ error: any }>());

export const addNewDrillClicked = createAction('[DrillsProfileStore] Add New Clicked');
export const clearState = createAction('[DrillsProfileStore] State Cleared');

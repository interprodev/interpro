import { createAction, props } from '@ngrx/store';
import { CashFlowData } from './cash-flow-store.state';
import { ClubSeason } from '@iterpro/shared/data-access/sdk';

export const loadCashFlowStores = createAction('[CashFlowStore] Load CashFlowStores');

export const loadCashFlowStoresSuccess = createAction(
	'[CashFlowStore] Load CashFlowStores Success',
	props<{ data: any }>()
);

export const loadCashFlowStoresFailure = createAction(
	'[CashFlowStore] Load CashFlowStores Failure',
	props<{ error: any }>()
);

export const clearState = createAction('[CashFlowStore] State Cleared');

export const getCashFlowData = createAction(
	'[CashFlowStore] Getting Cash Flow data',
	props<{ national: boolean; international: boolean; achieved: boolean }>()
);

export const onCashFlowDataAlreadyPresent = createAction(
	'[CashFlowStore] On Cash Flow data already present',
	props<{ data: CashFlowData }>()
);

export const performCashFlowDataSuccess = createAction(
	'[CashFlowStore] Getting Cash Flow data Success',
	props<{ data: CashFlowData; clubSeasonsToShow: ClubSeason[]; clubSeasons: ClubSeason[] }>()
);

export const performCashFlowDataFailure = createAction(
	'[CashFlowStore] Getting Cash Flow data Failure',
	props<{ error: any }>()
);

export const performCashFlowFromServer = createAction(
	'[CashFlowStore] Getting Cash Flow data from server',
	props<{ national: boolean; international: boolean; achieved: boolean }>()
);

export const downloadCSV = createAction('[CashFlowStore] Download Cash Flow data csv');

export const downloadPDF = createAction('[CashFlowStore] Download Cash Flow data PDF');

export const updateOperatingCashFlow = createAction(
	'[CashFlowStore] Updating Operating Cash Flow',
	props<{ value: number; index: number }>()
);

export const toggleEditMode = createAction('[CashFlowStore] Toggle Edit Mode', props<{ edit: boolean }>());

export const save = createAction('[CashFlowStore] Save');

export const performSaveSuccess = createAction(
	'[CashFlowStore] Save Operational Cash Flow Success',
	props<{ clubSeasons: ClubSeason[] }>()
);

export const performSaveFailure = createAction(
	'[CashFlowStore] Save Operational Cash Flow Failure',
	props<{ error: any }>()
);

import { Action, createReducer, on } from '@ngrx/store';
import { cloneDeep, sortBy } from 'lodash';
import * as CashFlowStoreActions from './cash-flow-store.actions';
import { State, adapter, initialState } from './cash-flow-store.state';

const cashFlowStoreReducer = createReducer(
	initialState,

	on(CashFlowStoreActions.loadCashFlowStores, state => state),
	on(CashFlowStoreActions.loadCashFlowStoresSuccess, (state, action) => state),
	on(CashFlowStoreActions.loadCashFlowStoresFailure, (state, action) => state),
	on(CashFlowStoreActions.getCashFlowData, (state, { national, international, achieved }) => ({
		...state,
		selectedCombination: {
			national,
			international,
			achieved
		}
	})),
	on(CashFlowStoreActions.onCashFlowDataAlreadyPresent, (state, { data }) => ({
		...state,
		selectedCashFlowData: data,
		isLoading: false
	})),
	on(CashFlowStoreActions.performCashFlowDataSuccess, (state, { data, clubSeasonsToShow, clubSeasons }) =>
		adapter.addOne(data, {
			...state,
			selectedCashFlowData: data,
			clubSeasonsToShow,
			clubSeasons: sortBy(clubSeasons, 'start'),
			isLoading: false
		})
	),
	on(
		CashFlowStoreActions.performCashFlowDataFailure,
		(state, { error }): State => ({ ...state, error, isLoading: false })
	),
	on(CashFlowStoreActions.performCashFlowFromServer, state => ({ ...state, isLoading: true })),
	on(CashFlowStoreActions.clearState, () => initialState),
	on(CashFlowStoreActions.updateOperatingCashFlow, (state, { value, index }) => {
		const clubSeasons = cloneDeep(state.clubSeasons);
		clubSeasons[index].operatingCashFlow = value;
		return { ...state, clubSeasons };
	}),
	on(CashFlowStoreActions.toggleEditMode, (state, { edit }) => {
		return edit
			? { ...state, tempSeasons: state.clubSeasons }
			: { ...state, clubSeasons: state.tempSeasons, tempSeasons: [] };
	}),
	on(CashFlowStoreActions.performSaveSuccess, (state, { clubSeasons }) => ({
		...state,
		tempSeasons: [],
		clubSeasons: sortBy(clubSeasons, 'start'),
		clubSeasonsToShow: sortBy(clubSeasons, 'start')
	}))
);

export function reducer(state: State | undefined, action: Action) {
	return cashFlowStoreReducer(state, action);
}

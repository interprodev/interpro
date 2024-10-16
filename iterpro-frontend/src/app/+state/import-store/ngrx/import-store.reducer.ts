import { Action, createReducer, on } from '@ngrx/store';
import { WizardPhase } from '../interfaces/import-store.interfaces';
import * as ImportStoreActions from './import-store.actions';
import { ImportState, adapter, initialState } from './import-store.state';
export { ImportState, importStoresFeatureKey, initialState } from './import-store.state';

const importStoreReducer = createReducer(
	initialState,
	on(
		ImportStoreActions.initProvider,
		(state, { provider }): ImportState => ({
			...initialState,
			provider
		})
	),
	on(
		ImportStoreActions.teamConfigurationChecked,
		(state, { messages, configurationProblem }): ImportState => ({
			...state,
			configurationProblem,
			messages
		})
	),
	on(
		ImportStoreActions.updateMessages,
		(state, { messages }): ImportState => ({
			...state,
			messages: [...state.messages, ...messages]
		})
	),
	on(
		ImportStoreActions.initializeTable,
		(state, { info }): ImportState => ({
			...adapter.setAll(info.importStores, state),
			nextEnabled: true,
			currentTeamGameSplitSession: info.currentTeamGameSplitSession,
			currentTeamSplitSession: info.currentTeamSplitSession
		})
	),
	on(
		ImportStoreActions.updateImportStores,
		ImportStoreActions.importGpsSession,
		ImportStoreActions.importProviderSession,
		ImportStoreActions.importPlayersStats,
		ImportStoreActions.importTeamStats,
		(state, action): ImportState => adapter.updateMany(action.importStores, state)
	),
	on(
		ImportStoreActions.clearImportStores,
		ImportStoreActions.noImportedSessionFound,
		(state): ImportState => ({
			...adapter.removeAll(state),
			...initialState,
			provider: state.provider,
			configurationProblem: state.configurationProblem
		})
	),
	on(
		ImportStoreActions.changePhase,
		(state, { phase }): ImportState => ({
			...state,
			phase,
			messages: [],
			maxNavigablePhase: phase > state.maxNavigablePhase ? phase : state.maxNavigablePhase
		})
	),
	on(
		ImportStoreActions.nextPhase,
		(state): ImportState => ({
			...state,
			phase: Math.min(state.phase + 1, WizardPhase.COMPLETED),
			messages: [],
			maxNavigablePhase: Math.min(
				state.phase + 1 > state.maxNavigablePhase ? state.phase + 1 : state.maxNavigablePhase,
				WizardPhase.COMPLETED
			)
		})
	),
	on(
		ImportStoreActions.previousPhase,
		(state): ImportState => ({
			...state,
			phase: Math.max(state.phase - 1, WizardPhase.SELECT)
		})
	),
	on(
		ImportStoreActions.loadAvailableDrills,
		(state, { drills }): ImportState => ({ ...state, availableDrills: drills })
	),
	on(
		ImportStoreActions.updateSplitToDrillAssociations,
		(state, { splitAssociations }): ImportState => ({
			...state,
			splitAssociations
		})
	),
	on(
		ImportStoreActions.importTableError,
		(state, { errors }): ImportState => ({
			...state,
			importTableErrors: errors,
			importTableErrorsDialogVisible: true
		})
	),
	on(
		ImportStoreActions.clickCloseImportTableErrorDialogButton,
		(state): ImportState => ({
			...state,
			importTableErrorsDialogVisible: false
		})
	),
	on(
		ImportStoreActions.startSessionImport,
		ImportStoreActions.startStatsImport,
		(state): ImportState => ({
			...state,
			nextEnabled: false,
			upload: true
		})
	),
	on(
		ImportStoreActions.endSessionImport,
		(state, { messages }): ImportState => ({
			...state,
			phase: WizardPhase.COMPLETED,
			messages,
			maxNavigablePhase: WizardPhase.INVALID
		})
	)
);

export function reducer(state: ImportState | undefined, action: Action) {
	return importStoreReducer(state, action);
}

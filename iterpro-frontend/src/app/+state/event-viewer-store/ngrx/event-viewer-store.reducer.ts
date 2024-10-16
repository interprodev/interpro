import { Action, createReducer, on } from '@ngrx/store';
import * as EventViewerStoreActions from './event-viewer-store.actions';
import { State, initialState } from './event-viewer-store.state';

const eventViewerStoreReducer = createReducer(
	initialState,
	on(
		EventViewerStoreActions.inputEventChanged,
		(state, { format, medicalType, matchWyscoutId, matchInstatId }): State => ({
			...state,
			format,
			medicalType,
			matchWyscoutId,
			matchInstatId
		})
	),
	on(
		EventViewerStoreActions.eventFormatChanged,
		(state, { format, medicalType }): State => ({
			...state,
			format,
			medicalType
		})
	),
	on(
		EventViewerStoreActions.eventDateUpdated,
		(state, { date }): State => ({
			...state,
			date
		})
	),
	on(
		EventViewerStoreActions.availableFormatsInitialized,
		(state, { availableFormats }): State => ({
			...state,
			availableFormats
		})
	),
	on(
		EventViewerStoreActions.competitionsInitialized,
		(state, { competitions, seasonId }): State => ({
			...state,
			competitions,
			seasonId
		})
	),
	on(
		EventViewerStoreActions.secondaryTeamEventSelected,
		(state, { thirdpartyClubGameDetails, thirdpartyClubGameLinkedPlayerStats }): State => ({
			...state,
			thirdpartyClubGameDetails,
			thirdpartyClubGameLinkedPlayerStats
		})
	),
	on(
		EventViewerStoreActions.componentDestroyed,
		(): State => ({
			...initialState
		})
	)
);

export function reducer(state: State | undefined, action: Action) {
	return eventViewerStoreReducer(state, action);
}

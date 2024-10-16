import { Action, createReducer, on } from '@ngrx/store';
import * as ScoutingGameActions from './scouting-player-games-store.actions';
import { State, adapter, initialState } from './scouting-player-games-store.state';

export { State, initialState, scoutingGamesFeatureKey } from './scouting-player-games-store.state';

const scoutingGameReducer = createReducer(
	initialState,
	on(
		ScoutingGameActions.initScoutingGames,
		(state, { playerInfo, customers, settings }): State => ({
			...state,
			playerInfo,
			customers,
			settings,
			loading: true
		})
	),
	on(
		ScoutingGameActions.initScoutingGamesSuccess,
		(state, { games, currentTeamId }): State => ({
			...(!!games ? adapter.setAll(games, state) : state),
			currentTeamId,
			loading: false
		})
	),
	on(
		ScoutingGameActions.initScoutingGamesError,
		ScoutingGameActions.performDeleteScoutingGamesError,
		ScoutingGameActions.performDeleteScoutingGameReportsError,
		(state, { error }): State => ({ ...state, error, loading: false })
	),
	on(ScoutingGameActions.addScoutingGame, (state, action): State => adapter.addOne(action.scoutingGame, state)),
	on(ScoutingGameActions.upsertScoutingGame, (state, action): State => adapter.upsertOne(action.scoutingGame, state)),
	on(
		ScoutingGameActions.performDeleteScoutingGames,
		ScoutingGameActions.performDeleteScoutingGameReports,
		(state): State => ({
			...state,
			loading: true
		})
	),
	on(
		ScoutingGameActions.deleteScoutingGames,
		ScoutingGameActions.deleteScoutingGameReports,
		(state, action): State => ({
			...adapter.removeMany(action.ids, state),
			loading: false
		})
	),
	on(ScoutingGameActions.clearScoutingGames, (state): State => ({ ...adapter.removeAll(state), ...initialState }))
);

export function reducer(state: State | undefined, action: Action) {
	return scoutingGameReducer(state, action);
}

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

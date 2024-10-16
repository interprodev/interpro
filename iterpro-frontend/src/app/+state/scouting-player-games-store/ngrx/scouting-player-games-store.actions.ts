import { Customer, ScoutingGame, ScoutingGameWithReport, ScoutingSettings } from '@iterpro/shared/data-access/sdk';
import { createAction, props } from '@ngrx/store';
import { PlayerScoutingInfo } from '../interfaces/scouting-player-games-store.interfaces';

export const initScoutingGames = createAction(
	'[ScoutingGame/API] Init ScoutingGames',
	props<{
		playerInfo: PlayerScoutingInfo;
		settings: ScoutingSettings;
		customers: Customer[];
	}>()
);

export const initScoutingGamesError = createAction(
	'[ScoutingGame/API] Init ScoutingGames Error',
	props<{ error: Error }>()
);
export const initScoutingGamesSuccess = createAction(
	'[ScoutingGame/API] Load ScoutingGames',
	props<{ games: ScoutingGameWithReport[]; currentTeamId: string }>()
);

export const addScoutingGame = createAction(
	'[ScoutingGame/API] Add ScoutingGame',
	props<{ scoutingGame: ScoutingGameWithReport }>()
);

export const upsertScoutingGame = createAction(
	'[ScoutingGame/API] Upsert ScoutingGame',
	props<{ scoutingGame: ScoutingGameWithReport }>()
);

export const performDeleteScoutingGames = createAction(
	'[ScoutingGame/API] Perform Delete ScoutingGames',
	props<{ scoutingGames: ScoutingGame[] }>()
);

export const performDeleteScoutingGameReports = createAction(
	'[ScoutingGame/API] Perform Delete ScoutingGame Reports',
	props<{ gameWithReports: ScoutingGameWithReport[] }>()
);

export const performDeleteScoutingGamesError = createAction(
	'[ScoutingGame/API] Perform Delete ScoutingGames Error',
	props<{ error: Error }>()
);
export const performDeleteScoutingGameReportsError = createAction(
	'[ScoutingGame/API] Perform Delete ScoutingGame Reports Error',
	props<{ error: Error }>()
);

export const deleteScoutingGames = createAction('[ScoutingGame/API] Delete ScoutingGames', props<{ ids: string[] }>());
export const deleteScoutingGameReports = createAction(
	'[ScoutingGame/API] Delete ScoutingGame Reports',
	props<{ ids: string[] }>()
);

export const clearScoutingGames = createAction('[ScoutingGame/API] Clear ScoutingGames');

/*
export const addScoutingGames = createAction(
	'[ScoutingGame/API] Add ScoutingGames',
	props<{ scoutingGames: ScoutingGame[] }>()
);

export const upsertScoutingGames = createAction(
	'[ScoutingGame/API] Upsert ScoutingGames',
	props<{ scoutingGames: ScoutingGame[] }>()
);

export const updateScoutingGame = createAction(
	'[ScoutingGame/API] Update ScoutingGame',
	props<{ scoutingGame: Update<ScoutingGame> }>()
);

export const updateScoutingGames = createAction(
	'[ScoutingGame/API] Update ScoutingGames',
	props<{ scoutingGames: Update<ScoutingGame>[] }>()
);

export const deleteScoutingGames = createAction(
	'[ScoutingGame/API] Delete ScoutingGames',
	props<{ ids: string[] }>()
);

*/

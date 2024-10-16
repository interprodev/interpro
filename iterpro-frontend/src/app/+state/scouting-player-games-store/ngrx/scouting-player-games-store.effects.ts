import { Injectable } from '@angular/core';
import {
	LoopBackAuth,
	PlayerScoutingApi,
	ScoutingGameApi,
	ScoutingGameReportApi
} from '@iterpro/shared/data-access/sdk';
import { ErrorService, getId } from '@iterpro/shared/utils/common-utils';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import * as ScoutingGameActions from './scouting-player-games-store.actions';

@Injectable()
export class ScoutingGameEffects {
	initScoutingPlayerGamesEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(ScoutingGameActions.initScoutingGames),
			switchMap(({ playerInfo }) => {
				const playerId = playerInfo.id;
				const { currentTeamId } = this.authService.getCurrentUserData();
				return this.playerApi.getPlayerGames(playerId, currentTeamId).pipe(
					map(games => ScoutingGameActions.initScoutingGamesSuccess({ games, currentTeamId })),
					catchError(error => of(ScoutingGameActions.initScoutingGamesError({ error })))
				);
			})
		)
	);

	scoutingGamesErrorEffect$: Observable<void> = createEffect(
		() =>
			this.actions$.pipe(
				ofType(ScoutingGameActions.initScoutingGamesError, ScoutingGameActions.performDeleteScoutingGamesError),
				map(({ error }) => void this.errorService.handleError(error))
			),
		{ dispatch: false, resubscribeOnError: false }
	);

	performDeleteScoutingGameEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(ScoutingGameActions.performDeleteScoutingGames),
			switchMap(({ scoutingGames }) => {
				const ids$: Array<Observable<string>> = scoutingGames.map(game =>
					this.scoutingGamesApi.deleteById(getId(game))
				);
				return forkJoin<Observable<string>[]>(ids$).pipe(
					map(() => ScoutingGameActions.deleteScoutingGames({ ids: scoutingGames.map(game => getId(game)) })),
					catchError(error => of(ScoutingGameActions.performDeleteScoutingGamesError({ error })))
				);
			})
		)
	);

	performDeleteScoutingGameReportsEffect$: Observable<Action> = createEffect(() =>
		this.actions$.pipe(
			ofType(ScoutingGameActions.performDeleteScoutingGameReports),
			switchMap(({ gameWithReports }) => {
				const ids$: Array<Observable<string>> = gameWithReports.map(item =>
					this.scoutingGameReportsApi.deleteById(getId(item))
				);
				return forkJoin<Observable<string>[]>(ids$).pipe(
					map(() => ScoutingGameActions.deleteScoutingGameReports({ ids: gameWithReports.map(item => getId(item)) })),
					catchError(error => of(ScoutingGameActions.performDeleteScoutingGameReportsError({ error })))
				);
			})
		)
	);

	constructor(
		private actions$: Actions,
		private scoutingGameReportsApi: ScoutingGameReportApi,
		private scoutingGamesApi: ScoutingGameApi,
		private playerApi: PlayerScoutingApi,
		private errorService: ErrorService,
		private authService: LoopBackAuth
	) {}
}

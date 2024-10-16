import { Injectable } from '@angular/core';
import { Formation, ThirdPartyGameDetail } from '@iterpro/shared/data-access/sdk';
import { BlockUiInterceptorService, ScoutingEventService } from '@iterpro/shared/utils/common-utils';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { forkJoin, of } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import * as StoreMatchLineUpAction from './store-line-up.actions';

@Injectable()
export class StoreMatchLineUpEffects {
	loadPlayerMatchStats$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(StoreMatchLineUpAction.loadStoreMatchLineUps),
			filter(({ thirdPartyProviderMatchId }) => thirdPartyProviderMatchId > 0),
			switchMap(({ thirdPartyProviderMatchId, thirdPartyProviderMatch }) =>
				this.blockUiInterceptorService
					.disableOnce(this.service.getThirdPartyGameDetail(thirdPartyProviderMatchId, thirdPartyProviderMatch))
					.pipe(
						map((gameDetail: ThirdPartyGameDetail) => this.getPlayersThirdPartyIds(gameDetail)),
						// filter(({ playersThirdPartyIds }) => playersThirdPartyIds.length > 0),
						switchMap(({ playersThirdPartyIds, substitutions, gameDetail }) => {
							if (playersThirdPartyIds && playersThirdPartyIds.length > 0) {
								return forkJoin([
									of(gameDetail),
									this.blockUiInterceptorService.disableOnce(
										this.service.getGamePlayerStats(
											thirdPartyProviderMatchId,
											thirdPartyProviderMatch,
											playersThirdPartyIds,
											substitutions
										)
									)
								]);
							}
							return forkJoin([of(gameDetail), of({})]);
						}),
						map(([gameDetail, thirdPartyPlayersStats]) =>
							StoreMatchLineUpAction.loadStoreMatchLineUpsSuccess({
								thirdPartyPlayersStats,
								gameDetail: gameDetail as ThirdPartyGameDetail
							})
						),
						catchError(error => of(StoreMatchLineUpAction.loadStoreMatchLineUpsFailure({ error })))
					)
			),
			catchError(error => of(StoreMatchLineUpAction.loadStoreMatchLineUpsFailure({ error })))
		);
	});

	private getPlayersThirdPartyIds(gameDetail: ThirdPartyGameDetail): {
		playersThirdPartyIds: number[];
		substitutions: { [key: number]: any[] };
		gameDetail: ThirdPartyGameDetail | null;
	} {
		if (!gameDetail) {
			return {
				playersThirdPartyIds: [],
				substitutions: {},
				gameDetail: null
			};
		}
		const teamsThirdPartyIds = Object.keys(gameDetail.teamsData);
		let playersThirdPartyIds: any[] = [];
		const substitutions: { [key: number]: any[] } = {};
		let formation: Formation;
		teamsThirdPartyIds
			.filter(teamsThirdPartyId => gameDetail.teamsData[teamsThirdPartyId].hasFormation)
			.forEach(teamsThirdPartyId => {
				formation = gameDetail.teamsData[teamsThirdPartyId].formation;
				substitutions[teamsThirdPartyId] = formation.substitutions;
				playersThirdPartyIds = playersThirdPartyIds.concat(
					[...formation.lineup, ...formation.bench].map(({ playerId, player }) => ({
						playerId: Number(playerId),
						teamsThirdPartyId: Number(teamsThirdPartyId),
						playerName: player.shortName
					}))
				);
			});
		return { playersThirdPartyIds, substitutions, gameDetail };
	}

	constructor(
		private actions$: Actions,
		private service: ScoutingEventService,
		private blockUiInterceptorService: BlockUiInterceptorService
	) {}
}

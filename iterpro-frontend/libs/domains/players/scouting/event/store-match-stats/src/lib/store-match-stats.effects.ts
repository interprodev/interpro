import { Injectable } from '@angular/core';
import { BlockUiInterceptorService, ScoutingEventService } from '@iterpro/shared/utils/common-utils';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import * as StoreMatchStatsAction from './store-match-stats.actions';

@Injectable()
export class StoreMatchStatsEffects {
	loadMatchStats$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(StoreMatchStatsAction.loadStoreMatchStats),
			filter(({ thirdPartyProviderMatchId }) => thirdPartyProviderMatchId > 0),
			switchMap(({ thirdPartyProviderMatchId, thirdPartyProviderMatch }) =>
				this.blockUiInterceptorService
					.disableOnce(this.service.getStandingsMatchStats(Number(thirdPartyProviderMatchId), thirdPartyProviderMatch))
					.pipe(
						map(response =>
							StoreMatchStatsAction.loadStoreMatchStatsSuccess({ home: response?.home, away: response?.away })
						),
						catchError(error => of(StoreMatchStatsAction.loadStoreMatchStatsFailure({ error })))
					)
			),
			catchError(error => of(StoreMatchStatsAction.loadStoreMatchStatsFailure({ error })))
		);
	});

	constructor(
		private actions$: Actions,
		private service: ScoutingEventService,
		private blockUiInterceptorService: BlockUiInterceptorService
	) {}
}

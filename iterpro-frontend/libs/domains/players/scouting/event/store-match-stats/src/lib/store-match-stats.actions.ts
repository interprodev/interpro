import { ProviderType } from '@iterpro/shared/data-access/sdk';
import { createAction, props } from '@ngrx/store';

export const loadStoreMatchStats = createAction(
	'[Scouting Event - StoreMatchStats] Load StoreMatchStats',
	props<{ thirdPartyProviderMatchId: number; thirdPartyProviderMatch: ProviderType }>()
);

export const loadStoreMatchStatsSuccess = createAction(
	'[Scouting Event - StoreMatchStats] Load StoreMatchStats Success',
	props<{ home: any; away: any }>()
);

export const loadStoreMatchStatsFailure = createAction(
	'[Scouting Event - StoreMatchStats] Load StoreMatchStats Failure',
	props<{ error: any }>()
);

export const resetStoreMatchStats = createAction('[Scouting Event - StoreMatchStats] Reset StoreMatchStats');
export const destroyStoreMatchStats = createAction('[Scouting Event - StoreMatchStats] Destroy StoreMatchStats');

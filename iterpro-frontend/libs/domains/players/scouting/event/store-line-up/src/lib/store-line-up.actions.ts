import { ProviderType, ThirdPartyGameDetail } from '@iterpro/shared/data-access/sdk';
import { createAction, props } from '@ngrx/store';

export const loadStoreMatchLineUps = createAction(
	'[Scouting Event - StoreMatchLineUp] Load StoreMatchLineUps',
	props<{ thirdPartyProviderMatchId: number; thirdPartyProviderMatch: ProviderType }>()
);

export const loadStoreMatchLineUpsSuccess = createAction(
	'[Scouting Event - StoreMatchLineUp] Load StoreMatchLineUps Success',
	props<{ thirdPartyPlayersStats: any; gameDetail: ThirdPartyGameDetail }>()
);

export const loadStoreMatchLineUpsFailure = createAction(
	'[Scouting Event - StoreMatchLineUp] Load StoreMatchLineUps Failure',
	props<{ error: any }>()
);

export const resetStoreMatchLineUps = createAction('[Scouting Event - StoreMatchLineUp] Reset StoreMatchLineUps');
export const destroyStoreLineUp = createAction('[Scouting Event - StoreMatchLineUp] Destroy StoreMatchLineUp');

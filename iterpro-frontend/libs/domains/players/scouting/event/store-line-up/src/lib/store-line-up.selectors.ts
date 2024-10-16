import { ThirdPartyClubGame } from '@iterpro/shared/data-access/sdk';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromStoreMatchLineUp from './store-line-up.reducer';
import { normalizePlayers } from '@iterpro/shared/utils/common-utils';

export const selectStoreMatchLineUpState = createFeatureSelector<fromStoreMatchLineUp.State>(
	fromStoreMatchLineUp.storeMatchLineUpFeatureKey
);

const getError = (state: fromStoreMatchLineUp.State): any => state.error;
const getFormation = (state: fromStoreMatchLineUp.State): ThirdPartyClubGame | undefined => state.formation;
const getCompetitionName = (state: fromStoreMatchLineUp.State): string | undefined => state.competitionName;
const getIsLoading = (state: fromStoreMatchLineUp.State): boolean => state.isLoading;
const getProviderStatsAvailable = (state: fromStoreMatchLineUp.State): boolean => state.hasProviderStatsAvailable;

export const selectError = createSelector(selectStoreMatchLineUpState, getError);
export const selectFormation = createSelector(selectStoreMatchLineUpState, getFormation);
export const selectFormationNormalized = createSelector(selectFormation, formation => {
	const normalizedPlayers = normalizePlayers('football', formation?.home?.players || [], formation?.away?.players || []);
	return {
		home: {
			...formation?.home,
			players: normalizedPlayers.home
		},
		away: {
			...formation?.away,
			players: normalizedPlayers.away
		}
	}
});
export const selectCompetitionName = createSelector(selectStoreMatchLineUpState, getCompetitionName);
export const selectIsLineUpLoading = createSelector(selectStoreMatchLineUpState, getIsLoading);
export const selectHasProviderStatsAvailable = createSelector(selectStoreMatchLineUpState, getProviderStatsAvailable);

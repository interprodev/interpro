import {
	ParsedMatchStat,
	TeamGender,
	ThirdPartyGameTeamStats,
	ThirdPartyTeamDataDetail
} from '@iterpro/shared/data-access/sdk';
import { MemoizedSelector, createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromStoreMatchStats from './store-match-stats.reducer';

export const selectStoreMatchStatsState = createFeatureSelector<fromStoreMatchStats.State>(
	fromStoreMatchStats.storeMatchStatsFeatureKey
);

const getError = (state: fromStoreMatchStats.State): any => state.error;
const getParsedStats = (state: fromStoreMatchStats.State): ParsedMatchStat[] | undefined => state.parsedStats;
const getIsLoading = (state: fromStoreMatchStats.State): boolean => state.isLoading;
const getHomeTeamStats = (state: fromStoreMatchStats.State): ThirdPartyGameTeamStats | undefined => state.homeTeamStats;
const getAwayTeamStats = (state: fromStoreMatchStats.State): ThirdPartyGameTeamStats | undefined => state.awayTeamStats;
const getHomeTeamData = (state: fromStoreMatchStats.State): ThirdPartyTeamDataDetail | undefined => state.homeTeamData;
const getAwayTeamData = (state: fromStoreMatchStats.State): ThirdPartyTeamDataDetail | undefined => state.awayTeamData;
const getHomeTeamCrest = (state: fromStoreMatchStats.State): string | undefined => state.homeTeamCrest;
const getAwayTeamCrest = (state: fromStoreMatchStats.State): string | undefined => state.awayTeamCrest;
const getHomeTeamGender = (state: fromStoreMatchStats.State): TeamGender | undefined => state.homeGender;
const getAwayTeamGender = (state: fromStoreMatchStats.State): TeamGender | undefined => state.awayGender;

export const selectError: MemoizedSelector<object, any> = createSelector(selectStoreMatchStatsState, getError);
export const selectHomeTeamStats = createSelector(selectStoreMatchStatsState, getHomeTeamStats);
export const selectAwayTeamStats = createSelector(selectStoreMatchStatsState, getAwayTeamStats);
export const selectHomeTeamData = createSelector(selectStoreMatchStatsState, getHomeTeamData);
export const selectAwayTeamData = createSelector(selectStoreMatchStatsState, getAwayTeamData);

export const selectThirdPartyGameStats = createSelector(
	selectHomeTeamStats,
	selectAwayTeamStats,
	(homeTeamStats, awayTeamStats) => [homeTeamStats, awayTeamStats] || []
);

export const selectIsMatchStatsLoading: MemoizedSelector<object, boolean> = createSelector(
	selectStoreMatchStatsState,
	getIsLoading
);

export const selectParsedStats = createSelector(selectStoreMatchStatsState, getParsedStats);
export const selectHomeTeamCrest = createSelector(selectStoreMatchStatsState, getHomeTeamCrest);
export const selectAwayTeamCrest = createSelector(selectStoreMatchStatsState, getAwayTeamCrest);
export const selectHomeTeamGender = createSelector(selectStoreMatchStatsState, getHomeTeamGender);
export const selectAwayTeamGender = createSelector(selectStoreMatchStatsState, getAwayTeamGender);

import {
	ParsedMatchStat,
	TeamGender,
	ThirdPartyGameTeamStats,
	ThirdPartyTeamDataDetail
} from '@iterpro/shared/data-access/sdk';
import { gameStatsConfig } from '@iterpro/shared/utils/common-utils';
import { createReducer, on } from '@ngrx/store';
import * as StoreMatchStatsActions from './store-match-stats.actions';
import { destroyStoreMatchStats } from './store-match-stats.actions';

export const storeMatchStatsFeatureKey = 'scoutingEvent_storeMatchStats';

export interface State {
	isLoading: boolean;
	error?: any;
	homeGender?: TeamGender;
	awayGender?: TeamGender;
	homeTeamStats?: ThirdPartyGameTeamStats;
	awayTeamStats?: ThirdPartyGameTeamStats;
	homeTeamData?: ThirdPartyTeamDataDetail;
	awayTeamData?: ThirdPartyTeamDataDetail;
	homeTeamCrest?: string;
	awayTeamCrest?: string;
	parsedStats?: ParsedMatchStat[];
}

export const initialState: State = {
	isLoading: false,
	error: undefined,
	homeGender: undefined,
	awayGender: undefined,
	homeTeamStats: undefined,
	awayTeamStats: undefined,
	homeTeamData: undefined,
	awayTeamData: undefined,
	homeTeamCrest: undefined,
	awayTeamCrest: undefined,
	parsedStats: undefined
};

export const reducer = createReducer(
	initialState,
	on(
		StoreMatchStatsActions.loadStoreMatchStats,
		(state, { thirdPartyProviderMatchId }): State => ({
			...state,
			isLoading: thirdPartyProviderMatchId > 0
		})
	),
	on(
		StoreMatchStatsActions.loadStoreMatchStatsSuccess,
		(state, { home, away }): State => ({
			...state,
			homeGender: home?.gender,
			awayGender: away?.gender,
			homeTeamStats: home?.teamStats,
			awayTeamStats: away?.teamStats,
			homeTeamData: home?.teamData,
			awayTeamData: away?.teamData,
			homeTeamCrest: home?.imageDataURL,
			awayTeamCrest: away?.imageDataURL,
			parsedStats: home && away ? parseStats(home.teamStats, away.teamStats) : undefined,
			isLoading: false
		})
	),
	on(
		StoreMatchStatsActions.loadStoreMatchStatsFailure,
		(state, { error }): State => ({ ...state, isLoading: false, error })
	),
	on(StoreMatchStatsActions.resetStoreMatchStats, destroyStoreMatchStats, (): State => initialState)
);

function parseStats(homeStats: ThirdPartyGameTeamStats, awayStats: ThirdPartyGameTeamStats): ParsedMatchStat[] {
	return gameStatsConfig.map(item => {
		const home = homeStats ? +Number((homeStats as any)[item.type][item.value]).toFixed(1) : undefined;
		const away = awayStats ? +Number((awayStats as any)[item.type][item.value]).toFixed(1) : undefined;
		let homePercentage = home ? 100 : 0;
		let awayPercentage = away ? 100 : 0;
		if (home && away) {
			if (home > away) {
				awayPercentage = (100 * away) / home;
			} else if (away > home) {
				homePercentage = (100 * home) / away;
			}
		}
		const parsedStat: ParsedMatchStat = {
			away,
			awayPercentage,
			home,
			homePercentage,
			label: item.label
		};
		return parsedStat;
	});
}

import {
	ThirdPartyClubGame,
	ThirdPartyClubGameTeam,
	ThirdPartyGameDetail,
	ThirdPartyLinkedPlayer
} from '@iterpro/shared/data-access/sdk';
import { capitalize, getSportParameters } from '@iterpro/shared/utils/common-utils';
import { createReducer, on } from '@ngrx/store';
import * as StoreMatchLineUpActions from './store-line-up.actions';
import { destroyStoreLineUp } from './store-line-up.actions';

export const storeMatchLineUpFeatureKey = 'scoutingEvent_storeMatchLineUp';

export interface State {
	isLoading: boolean;
	error?: any;
	thirdPartyPlayersStats?: any;
	competitionName?: string;
	formation?: ThirdPartyClubGame;
	hasProviderStatsAvailable: boolean;
}

export const initialState: State = {
	isLoading: false,
	thirdPartyPlayersStats: undefined,
	competitionName: undefined,
	formation: undefined,
	hasProviderStatsAvailable: false
};

export const reducer = createReducer(
	initialState,
	on(
		StoreMatchLineUpActions.loadStoreMatchLineUps,
		(state): State => ({
			...state,
			isLoading: true,
			thirdPartyPlayersStats: []
		})
	),
	on(
		StoreMatchLineUpActions.loadStoreMatchLineUpsSuccess,
		(state, { thirdPartyPlayersStats, gameDetail }): State => ({
			...state,
			thirdPartyPlayersStats,
			competitionName: gameDetail?.competition?.name,
			formation: thirdPartyPlayersStats && gameDetail ? getFormation(thirdPartyPlayersStats, gameDetail) : undefined,
			isLoading: false,
			hasProviderStatsAvailable: gameDetail?.hasDataAvailable
		})
	),
	on(
		StoreMatchLineUpActions.loadStoreMatchLineUpsFailure,
		(state, { error }): State => ({ ...state, error, isLoading: false })
	),
	on(StoreMatchLineUpActions.resetStoreMatchLineUps, destroyStoreLineUp, (): State => initialState)
);

function getFormation(playersStats: any[], details: ThirdPartyGameDetail): ThirdPartyClubGame {
	const gameDetails: ThirdPartyClubGame = { home: undefined, away: undefined };
	if (!!details && playersStats.length > 0) {
		const teamIds = Object.keys(details.teamsData);
		const positions = getSportParameters('football').positionsByRole;
		const labelArray = details.label.split(',');

		const teamNames = labelArray.length > 0 ? labelArray[0].split(' - ').map(teamName => teamName.trim()) : [];
		let team: ThirdPartyClubGameTeam;

		teamIds.forEach(id => {
			const { side, formation, imageDataURL, hasFormation } = details.teamsData[id];
			const playersInGame = hasFormation ? [...formation.lineup, ...formation.bench] : [];
			const players: ThirdPartyLinkedPlayer[] = playersInGame.map(playerStats => {
				const position = positions[playerStats.player.role.code2];
				return {
					playerStats: {
						...playerStats,
						...playersStats.find(stats => stats.playerId === playerStats.playerId),
						position
					},
					wyscoutId: playerStats.playerId,
					instatId: playerStats.playerId,
					downloadUrl: playerStats.player.imageDataURL
				};
			});
			const name = teamNames.length > 1 ? (side === 'home' ? teamNames[0] : teamNames[1]) : capitalize(side) + ' team';
			team = { name, imageDataURL, players };
			gameDetails[side] = team;
		});
	}
	return gameDetails;
}

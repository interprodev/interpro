import { ThirdPartyLinkedPlayer } from '@iterpro/shared/data-access/sdk';
import { getPositionCategories, sports, SportType } from '@iterpro/shared/utils/common-utils';
import { sortBy } from 'lodash';
import { CheckboxChangeEvent } from 'primeng/checkbox';

export function normalizePlayers(sportType: SportType = 'football', homePlayers: ThirdPartyLinkedPlayer[], awayPlayers: ThirdPartyLinkedPlayer[]): { home: ThirdPartyLinkedPlayer[], away: ThirdPartyLinkedPlayer[] } {
	const positions =  getPositionCategories(sportType);
	const homeNormalized: ThirdPartyLinkedPlayer[] = [];
	const awayNormalized: ThirdPartyLinkedPlayer[] = [];

	positions.forEach(position => {
		const homePlayersInPosition = homePlayers.filter(({ playerStats }) => playerStats.position === position
			|| sports[sportType].positionsByRole[playerStats.position] === position);
		const awayPlayersInPosition = awayPlayers.filter(({ playerStats }) => playerStats.position === position
			|| sports[sportType].positionsByRole[playerStats.position] === position);
		const maxPlayersInPosition = Math.max(homePlayersInPosition.length, awayPlayersInPosition.length);

		while (homePlayersInPosition.length < maxPlayersInPosition) {
			homePlayersInPosition.push(createEmptyPlayer(position));
		}

		while (awayPlayersInPosition.length < maxPlayersInPosition) {
			awayPlayersInPosition.push(createEmptyPlayer(position));
		}

		homeNormalized.push(...homePlayersInPosition);
		awayNormalized.push(...awayPlayersInPosition);
	});
	return { home: sortBy(homeNormalized, (player: ThirdPartyLinkedPlayer) => player.playerStats.playerName), away: sortBy(awayNormalized, (player: ThirdPartyLinkedPlayer) => player.playerStats.playerName) };
}

function createEmptyPlayer(position: string): ThirdPartyLinkedPlayer {
	return {
		// @ts-ignore
		playerStats: {
			// @ts-ignore
			playerName: null,
			position
		}
	}
}

export function resetPlayerStatsFields(player: ThirdPartyLinkedPlayer) {
	// @ts-ignore
	player.playerStats.minutesPlayed = null;
	// @ts-ignore
	player.playerStats.substituteInMinute = null;
	// @ts-ignore
	player.playerStats.substituteOutMinute = null;
	// @ts-ignore
	player.playerStats.yellowCard = null;
	// @ts-ignore
	player.playerStats.redCard = null;
	// @ts-ignore
	player.playerStats.score = null;
	// @ts-ignore
	player.playerStats.assists = null;
	// @ts-ignore
	player.playerStats.conversion = null;
	// @ts-ignore
	player.playerStats.startingRoster = null;
	// @ts-ignore
	player.playerStats.scoreSet1 = null;
	// @ts-ignore
	player.playerStats.scoreSet2 = null;
	// @ts-ignore
	player.playerStats.scoreSet3 = null;
	// @ts-ignore
	player.playerStats.scoreSet4 = null;
	// @ts-ignore
	player.playerStats.scoreSet5 = null;
}

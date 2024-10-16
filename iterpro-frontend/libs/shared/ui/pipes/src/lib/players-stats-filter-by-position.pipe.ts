import { Pipe, PipeTransform } from '@angular/core';
import { ThirdPartyLinkedPlayer } from '@iterpro/shared/data-access/sdk';
import { sports, SportType } from '@iterpro/shared/utils/common-utils';

@Pipe({
	standalone: true,
	name: 'playersStatsFilterByPosition'
})
export class PlayersStatsFilterByPositionPipe implements PipeTransform {
	transform(players: ThirdPartyLinkedPlayer[] = [], role: string, sportType: SportType): ThirdPartyLinkedPlayer[] {
		const filtered = players.filter(({ playerStats }) => playerStats.position === role
			|| sports[sportType].positionsByRole[playerStats.position] === role);
		return role.length > 0
			? filtered
			: this.noPosition(players);
	}

	private noPosition(players: ThirdPartyLinkedPlayer[]): ThirdPartyLinkedPlayer[] {
		return players.filter(({ playerStats }) => !playerStats.position || playerStats.position.length === 0);
	}
}

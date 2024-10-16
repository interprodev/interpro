import { Pipe, PipeTransform } from '@angular/core';
import { PlayerMatchStat, ThirdPartyClubGameInterface } from '@iterpro/shared/data-access/sdk';

@Pipe({ name: 'playersStatsEnabled', standalone: true, pure: false })
export class PlayersStatsEnabledPipe implements PipeTransform {

	transform(stats: ThirdPartyClubGameInterface, side: 'home' | 'away'): PlayerMatchStat[] {
		return (stats[side].players || []).filter(({ playerStats }) => playerStats?.enabled).map(({ playerStats }) => playerStats);
	}
}

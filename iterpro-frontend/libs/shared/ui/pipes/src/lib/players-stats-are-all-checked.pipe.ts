import { Pipe, PipeTransform } from '@angular/core';
import {ThirdPartyLinkedPlayer } from '@iterpro/shared/data-access/sdk';

@Pipe({ name: 'playersStatsAreAllChecked', standalone: true, pure: false })
export class PlayersStatsAreAllCheckedPipe implements PipeTransform {

	transform(players: ThirdPartyLinkedPlayer[]): boolean {
		return players.every(({ playerStats }) => playerStats?.enabled);
	}
}

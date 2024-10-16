import { Pipe } from '@angular/core';
import { ThirdPartyLinkedPlayer } from '@iterpro/shared/data-access/sdk';

@Pipe({
	name: 'playerIsSelectedForGame'
})
export class PlayerIsSelectedForGamePipe {
	transform(playerId: string, players: ThirdPartyLinkedPlayer[]): boolean {
		return (players || []).some(({ playerStats }) => playerStats.playerId === playerId && playerStats.enabled);
	}
}

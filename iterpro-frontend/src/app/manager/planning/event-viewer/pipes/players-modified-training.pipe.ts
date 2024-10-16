import { Pipe } from '@angular/core';
import { PlayerWithHealthStatus } from '../event-viewer.component';

@Pipe({
	name: 'playersModifiedTraining'
})
export class PlayersModifiedTrainingPipe {
	transform(players: PlayerWithHealthStatus[]): PlayerWithHealthStatus[] {
		return (players || []).filter(({ modified }) => modified);
	}
}

import { Pipe, PipeTransform, inject } from '@angular/core';
import { Player } from '@iterpro/shared/data-access/sdk';
import { AvailabiltyService } from '@iterpro/shared/utils/common-utils';
import {
	arrowDown,
	arrowUp,
	getInjuryIcon,
	noScores,
	playerBeCareful,
	playerInjured,
	playerNotAvailable
} from '../player-card-tactic.util';

@Pipe({
	standalone: true,
	name: 'playerCardTacticStatus'
})
export class PlayerCardTacticStatusPipe implements PipeTransform {
	readonly #availabilityService = inject(AvailabiltyService);

	transform(player: Player, injuryMapObj: Map<string, any>): string {
		if (playerNotAvailable(injuryMapObj, player)) return 'fa-ambulance';
		else if (playerBeCareful(injuryMapObj, player)) return 'fa-exclamation-triangle';
		else if (playerInjured(injuryMapObj, player)) return getInjuryIcon(injuryMapObj, player);
		else if (arrowUp(player, this.#availabilityService)) return 'fa-long-arrow-up';
		else if (arrowDown(player, this.#availabilityService)) return 'fa-long-arrow-down';
		else if (noScores(player)) return '';
		else return 'fa-minus';
	}
}

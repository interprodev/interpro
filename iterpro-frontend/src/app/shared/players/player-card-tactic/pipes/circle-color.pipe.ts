import { Pipe, PipeTransform, inject } from '@angular/core';
import { Player } from '@iterpro/shared/data-access/sdk';
import { AvailabiltyService } from '@iterpro/shared/utils/common-utils';
import { getCircleColor } from '../player-card-tactic.util';

@Pipe({
	standalone: true,
	name: 'playerCardTacticCircleColor'
})
export class PlayerCardTacticCircleColorPipe implements PipeTransform {
	readonly #availabilityService = inject(AvailabiltyService);

	transform(player: Player): string {
		return getCircleColor(player, this.#availabilityService);
	}
}

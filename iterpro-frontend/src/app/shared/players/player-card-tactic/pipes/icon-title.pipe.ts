import { Pipe, PipeTransform, inject } from '@angular/core';
import { Player } from '@iterpro/shared/data-access/sdk';
import { AvailabiltyService, ConstantService, getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment';
import {
	arrowDown,
	arrowUp,
	getCircleColor,
	playerAvailabilityWithReturn,
	playerBeCareful,
	playerInjured,
	playerNotAvailable
} from '../player-card-tactic.util';

@Pipe({
	standalone: true,
	name: 'playerCardTacticIconTitle'
})
export class PlayerCardTacticIconTitlePipe implements PipeTransform {
	readonly #translateService = inject(TranslateService);
	readonly #availabilityService = inject(AvailabiltyService);
	readonly #preventionConstantService = inject(ConstantService);

	transform(player: Player, injuryMapObj: Map<string, any>): string {
		if (playerNotAvailable(injuryMapObj, player)) {
			const exp = playerAvailabilityWithReturn(injuryMapObj, player);
			if (exp)
				return this.#translateService.instant('playerCard.tooltip.notAvailableFurther', { value: player.displayName });
			else
				return this.#translateService.instant('playerCard.tooltip.notAvailableExpected', {
					value: player.displayName,
					value1: moment(exp).format(getMomentFormatFromStorage())
				});
		} else if (playerBeCareful(injuryMapObj, player))
			return this.#translateService.instant('playerCard.tooltip.beCareful', {
				value: player.displayName
			});
		else if (playerInjured(injuryMapObj, player)) {
			const value2 = this.#translateService.instant(
				(
					this.#preventionConstantService
						.getLocations()
						.find(x => x.value === injuryMapObj.get(player.displayName).injury.location) || {
						label: 'emptyString'
					}
				).label
			);
			const status = injuryMapObj.get(player.displayName).injury.currentStatus;
			const value3 = status ? this.#translateService.instant(status) : undefined;
			return this.#translateService.instant('playerCard.tooltip.injured', {
				value1: player.displayName,
				value2,
				value3
			});
		} else if (arrowUp(player, this.#availabilityService))
			return this.#translateService.instant('playerCard.tooltip.improving', {
				value: player.displayName
			});
		else if (arrowDown(player, this.#availabilityService))
			return this.#translateService.instant('playerCard.tooltip.decreasing', {
				value: player.displayName
			});
		else {
			const color = getCircleColor(player, this.#availabilityService);
			if (color === '#FF4343')
				return this.#translateService.instant('playerCard.tooltip.notAvailable', {
					value: player.displayName
				});
			else if (color === 'red')
				return this.#translateService.instant('playerCard.tooltip.low', {
					value: player.displayName
				});
			else if (color === 'yellow')
				return this.#translateService.instant('playerCard.tooltip.average', {
					value: player.displayName
				});
			else if (color === 'green')
				return this.#translateService.instant('playerCard.tooltip.optimal', {
					value: player.displayName
				});
			else return '';
		}
	}
}

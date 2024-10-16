import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { PlayerScouting } from '@iterpro/shared/data-access/sdk';
import { getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';

@Component({
	selector: 'iterpro-scouting-player-header',
	templateUrl: './scouting-player-header.component.html',
	styleUrls: ['./scouting-player-header.component.css']
})
export class ScoutingPlayerHeaderComponent implements OnChanges {
	@Input({ required: true }) player: PlayerScouting;
	@Input({ required: true }) sportType: string;

	birthDate: string | null = null;

	ngOnChanges(changes: SimpleChanges) {
		if (changes['player']) {
			this.birthDate = moment(this.player.birthDate).format(getMomentFormatFromStorage());
		}
	}
}

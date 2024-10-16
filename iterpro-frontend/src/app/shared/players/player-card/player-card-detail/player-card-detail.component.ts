import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ExtendedPlayerScouting } from '@iterpro/shared/data-access/sdk';
import { getCorrectTextColorUtil } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';

@Component({
	standalone: true,
	imports: [CommonModule, TranslateModule],
	selector: 'iterpro-player-card-detail',
	templateUrl: './player-card-detail.component.html',
	styleUrls: ['./player-card-detail.component.css']
})
export class PlayerCardDetailComponent {
	@Input({required: true}) player: ExtendedPlayerScouting;
	@Input() tipssMode: boolean;

	getCorrectTextColor(color: string): string {
		return getCorrectTextColorUtil(this.getHex(color));
	}

	private getHex(color: string): string {
		switch (color) {
			case 'red':
				return '#ff0000';
			case 'yellow':
				return '#ffff00';
			case 'green':
				return '#008000';
			default:
				return color;
		}
	}
}

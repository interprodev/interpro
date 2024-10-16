import { Component, Input } from '@angular/core';
import { Player } from '@iterpro/shared/data-access/sdk';

@Component({
	selector: 'iterpro-player-pic',
	templateUrl: './player-pic.component.html',
	styleUrls: ['./player-pic.component.css']
})
export class PlayerPicComponent {
	@Input() player: Player;

	playerPic() {
		return this.player.downloadUrl;
	}

	getLangClass(lang) {
		if (lang) {
			return 'flag-icon-' + lang.toLowerCase();
		} else {
			return '';
		}
	}
}

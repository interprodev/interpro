import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Player, TacticsPlayerData } from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AzureStoragePipe } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { PlayerCardTacticCircleColorPipe } from './pipes/circle-color.pipe';
import { PlayerCardTacticIconTitlePipe } from './pipes/icon-title.pipe';
import { PlayerCardTacticStatusPipe } from './pipes/status.pipe';
import { PlayerTacticClassPipe } from './pipes/tactic-class.pipe';

@Component({
	standalone: true,
	imports: [
		CommonModule,
		PrimeNgModule,
		AzureStoragePipe,
		PlayerCardTacticIconTitlePipe,
		PlayerCardTacticStatusPipe,
		PlayerCardTacticCircleColorPipe,
		PlayerTacticClassPipe
	],
	selector: 'iterpro-player-card-tactic',
	templateUrl: './player-card-tactic.component.html',
	styleUrls: ['./player-card-tactic.component.css']
})
export class PlayerCardTacticComponent implements OnChanges {
	@Input() playerList: Player[];
	@Input() tactic: TacticsPlayerData;
	@Input() x: number;
	@Input() y: number;
	@Input() isSelected = false;
	@Input() disabled = false;
	@Input() highlighted = false;
	@Input() azureImg = true;
	@Input() injuryMapObj: Map<string, any>;
	@Output() showDialogEmitter: EventEmitter<any> = new EventEmitter<any>();

	backgroundUrlImage: string;
	position = '-';
	player: Player;
	coordinates!: { x: number; y: number };

	constructor(
		private readonly translate: TranslateService,
		private readonly sanitizer: DomSanitizer,
		private readonly azureUrlPipe: AzureStoragePipe
	) {}

	ngOnChanges(changes: SimpleChanges) {
		if ((changes['tactic'] && changes['tactic'].currentValue) || changes['playerList']) {
			this.player =
				this.playerList.find(({ id }) => id === this.tactic.playerId) ||
				new Player({
					injuries: [],
					goScores: [],
					id: null,
					displayName: '[Player deleted]'
				});
			this.backgroundUrlImage = this.azureUrlPipe.transform(this.player.downloadUrl);
			this.position = this.player.position ? this.translate.instant(this.player.position + '.short') : '-';
			if (!this.player.id) this.disabled = true;
		}

		if (changes['x'] || changes['y']) this.coordinates = { x: this.x, y: this.y };
	}

	changeBackground() {
		const imgUrl = this.player.downloadUrl
			? this.azureUrlPipe.transform(this.player.downloadUrl)
			: 'assets/img/default_icon.png';
		return this.sanitizer.bypassSecurityTrustStyle('url("' + encodeURI(imgUrl) + '")');
	}

	showDialog(player: Player, clickEvent?) {
		if (player.id) this.showDialogEmitter.emit({ player, clickEvent });
		else clickEvent.preventDefault();
	}
}

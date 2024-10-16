import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Player, PlayerScouting, ScoutingLineup, ScoutingLineupPlayerData } from '@iterpro/shared/data-access/sdk';
import { AzureStoragePipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';

@Component({
	standalone: true,
	imports: [CommonModule, TranslateModule, AzureStoragePipe],
	selector: 'iterpro-player-card-image',
	templateUrl: './player-card-image.component.html',
	styleUrls: ['./player-card-image.component.scss']
})
export class PlayerCardImageComponent implements OnInit, OnChanges {
	@Input() player: Player;
	@Input() tactic: ScoutingLineupPlayerData;
	@Input() x: number;
	@Input() y: number;
	@Input() isSelected = false;
	@Input() disabled = false;
	@Input() highlighted = false;
	@Input() azureImg = true;
	@Input() scoutingPlayers: PlayerScouting[] = [];
	@Input() index: number;
	@Input() editable = true;
	@Input() scenario: ScoutingLineup;
	@Input() showBadge = true;

	@Output() showShortlist: EventEmitter<Player> = new EventEmitter<Player>();

	backgroundUrlImage: string;
	position: string;
	age: number;

	constructor(private translate: TranslateService, private azureUrlPipe: AzureStoragePipe) {
		this.translate.getTranslation(this.translate.currentLang).subscribe(() => (this.translate = translate));
	}

	ngOnInit() {}

	ngOnChanges(changes: SimpleChanges) {
		if ((changes['tactic'] && this.tactic) || changes['player']) {
			if (this.player) {
				this.backgroundUrlImage = this.azureUrlPipe.transform(this.player.downloadUrl);
				this.position = this.player.position ? this.translate.instant(this.player.position + '.short') : '';
				this.age = moment().diff(moment(this.player.birthDate), 'year');
			}
		}
	}

	getClass(): string {
		let playerClass = 'player-card';
		const rowClass: string = this.x !== undefined ? 'player-row-' + String(this.x) : '';
		const colClass: string = this.y !== undefined ? 'player-col-' + String(this.y) : '';

		if (rowClass !== '' && colClass !== '') {
			playerClass = `${playerClass} on-field-player-card ${rowClass} ${colClass}`;
		}
		if (this.isSelected) {
			playerClass = `${playerClass} player-card-selected`;
		}
		if (this.disabled) {
			playerClass = `${playerClass} player-card-disabled`;
		}
		if (this.highlighted) {
			playerClass = `${playerClass} player-card-highlighted`;
		}

		return playerClass;
	}

	getLangClass(lang: string): string {
		if (lang) {
			return 'flag-icon-' + lang.toLowerCase();
		} else {
			return '';
		}
	}

	onShowShortlist(player: Player) {
		this.showShortlist.emit(player);
	}

	getMappedPlayersNumber(tactic: ScoutingLineupPlayerData): number {
		return (tactic.mappings || []).length;
	}
}

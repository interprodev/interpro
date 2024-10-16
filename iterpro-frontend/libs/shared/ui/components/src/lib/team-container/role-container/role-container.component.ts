import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlayerMatchStat, ThirdPartyLinkedPlayer } from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AzureStoragePipe,
	getSportParameters,
	resetPlayerStatsFields,
	SportType
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { CheckboxChangeEvent } from 'primeng/checkbox';
import { PictureComponent } from '@iterpro/shared/ui/components';
import { PlayersStatsFilterByPositionPipe } from '@iterpro/shared/ui/pipes';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, FormsModule, AzureStoragePipe, TranslateModule, PictureComponent, PlayersStatsFilterByPositionPipe],
	selector: 'iterpro-role-container',
	templateUrl: './role-container.component.html',
	styleUrls: ['./role-container.component.scss']
})
export class RoleContainerComponent implements OnInit {
	@Input({required: true}) players: ThirdPartyLinkedPlayer[] = [];
	@Input({required: true}) role!: string;
	@Input({required: true}) editable = false;
	@Input({required: true}) selectable = false;
	@Input({required: true}) displayEmptyPlayers = false;
	@Input({required: true}) sportType: SportType = 'football';
	@Input({required: true}) hasMultipleGameSets: boolean = false;
	@Input({required: true}) hasTwoGameSets: boolean = false;
	@Input({required: true}) sets: string[] = [];
	maxNumberOnField!: number;

	ngOnInit() {
		this.maxNumberOnField = getSportParameters(this.sportType).lineup;
	}

	setEnabledPlayer(event: CheckboxChangeEvent, player: ThirdPartyLinkedPlayer) {
		if (!event.checked) {
			resetPlayerStatsFields(player);
		}
	}

	maxPlayersOnFieldForVolley(stat: PlayerMatchStat): boolean {
		return (
			this.players.map(({playerStats}) => playerStats).filter(({ startingRoster }) => startingRoster).length >= this.maxNumberOnField &&
			stat &&
			!stat.startingRoster
		);
	}
}

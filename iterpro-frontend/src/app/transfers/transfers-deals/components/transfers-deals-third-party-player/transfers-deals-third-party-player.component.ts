import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AlreadyImportedPlayer, WyscoutPlayerSearchResult } from '@iterpro/shared/data-access/sdk';

@Component({
	selector: 'iterpro-transfers-deals-third-party-player',
	template: `
		<div>
			<i
				style="margin-left: 1em; font-size: 1.2em; color: rgb(221, 221, 221)"
				(click)="thirdPartyPlayerSearchDialogVisible = !thirdPartyPlayerSearchDialogVisible"
				class="fas fa-search-plus"
				[pTooltip]="'wysearch.title' | translate"
			></i>

			<!-- Third party player search -->
			<iterpro-third-party-player-search
				*ngIf="thirdPartyPlayerSearchDialogVisible"
				[alreadyImportedPlayers]="alreadyImportedPlayers"
				(discardEmitter)="thirdPartyPlayerSearchDialogVisible = false"
				(selectPlayersEmitter)="selectPlayers($event)"
			/>
		</div>
	`
})
export class TransfersDealsThirdPartyPlayerComponent {
	thirdPartyPlayerSearchDialogVisible: boolean = false;
	@Input({required: true}) alreadyImportedPlayers: AlreadyImportedPlayer[] = [];
	@Output() thirdPartyPlayerSelected: EventEmitter<WyscoutPlayerSearchResult[]> = new EventEmitter<WyscoutPlayerSearchResult[]>();

	selectPlayers(event: WyscoutPlayerSearchResult[]) {
		this.thirdPartyPlayerSearchDialogVisible = false;
		this.thirdPartyPlayerSelected.emit(event);
	}
}

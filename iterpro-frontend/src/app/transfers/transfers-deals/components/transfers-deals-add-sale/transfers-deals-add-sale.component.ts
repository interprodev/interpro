import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ClubTransfer, Player, TransferContract, TransferWindowItem } from '@iterpro/shared/data-access/sdk';
import { getActiveTransferContract } from '@iterpro/shared/utils/common-utils';
import { orderBy } from 'lodash';
import { SelectItemGroup } from 'primeng/api';
import { ClubTransferPersonType } from 'src/app/transfers/shared/interfaces/transfers.interface';

@Component({
	selector: 'iterpro-transfers-deals-add-sale',
	templateUrl: './transfers-deals-add-sale.component.html'
})
export class TransfersDealsAddSaleComponent {
	/** Inputs & Outputs */
	@Input({ required: true }) transferWindow: TransferWindowItem;
	@Input({ required: true }) set teams(teams: { name: string; players: Player[] }[]) {
		this.teamPlayerOptions = this.setTeamPlayerOptions(teams);
	}

	@Output() addSale = new EventEmitter<ClubTransfer[]>();

	/** Data */
	teamPlayerOptions: SelectItemGroup[] = [];
	selectedPlayer: Player | null = null;

	addDeal(): void {
		const activeInwardContract: TransferContract = getActiveTransferContract(this.selectedPlayer, 'inward');
		const personType: ClubTransferPersonType = 'Player';

		const clubTransfer: ClubTransfer = new ClubTransfer({
			personId: this.selectedPlayer.id,
			personType,
			isPurchase: false,
			clubId: this.selectedPlayer.clubId,
			offer: activeInwardContract?.amount,
			currentStatus: 'transferable',
			transferWindowId: this.transferWindow.transferWindowId,
			clubSeasonId: this.transferWindow.clubSeasonId
		});

		this.addSale.emit([clubTransfer]);
	}

	private setTeamPlayerOptions(teams: { name: string; players: Player[] }[]): SelectItemGroup[] {
		return teams
			? teams
					.filter(t => t.players.length > 0)
					.map(team => {
						return {
							label: team.name,
							value: team.name,
							items: orderBy(team.players, 'displayName').map(player => ({
								label: player.displayName,
								value: player
							}))
						};
					})
			: [];
	}
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ClubSeason, TransferWindowItem } from '@iterpro/shared/data-access/sdk';
import { sortByName } from '@iterpro/shared/utils/common-utils';
import { SelectItemGroup } from 'primeng/api';

@Component({
	selector: 'iterpro-transfers-window-selection',
	template: `
		<form class="pflex-flex pflex-gap-2 pflex-align-items-center pflex-w-auto">
			<label for="transfer-window" class="pflex-block pflex-text-sm pflex-opacity-70"> {{ 'transfer.windows.window' | translate }}: </label>
			<p-dropdown
				class="pflex-blockpflex-text-sm"
				id="transfer-window"
				name="transfer-window"
				[group]="true"
				[title]="'transfers.dealsBoard.addTransfer' | translate"
				[options]="clubSeasonsWindows"
				[(ngModel)]="transferWindow"
				[placeholder]="'dropdown.placeholder' | translate"
				(onChange)="selectTransferWindow($event.value)"
			/>
		</form>
	`
})
export class TransfersWindowSelectionComponent {
	/** Input & Output */
	@Input({ required: true }) set clubSeasons(seasons: ClubSeason[]) {
		this.clubSeasonsWindows = this.setSeasonsOptions(seasons);
		this.transferWindow = this.clubSeasonsWindows[0].items[0].value as TransferWindowItem;
		this.changeTransferWindow.emit(this.transferWindow);
	}
	@Input({ required: true }) transferWindow: TransferWindowItem | null = null;
	@Output() changeTransferWindow = new EventEmitter<TransferWindowItem>();

	/** Data */
	clubSeasonsWindows: SelectItemGroup[] = [];

	selectTransferWindow(transferWindow: TransferWindowItem): void {
		this.changeTransferWindow.emit(transferWindow);
	}

	private setSeasonsOptions(clubSeasons: ClubSeason[]): SelectItemGroup[] {
		return clubSeasons
			? [
					...sortByName(
						clubSeasons
							.filter(({ _transferWindows, id }) => id && _transferWindows.find(({ name, id: transferId }) => name && transferId))
							.map(
								({ name, _transferWindows, id: clubSeasonId }): SelectItemGroup => ({
									label: name,
									value: _transferWindows,
									items: _transferWindows.map(({ name: transferWindowName, id: transferWindowId, budget }) => ({
										label: transferWindowName + ' ' + name,
										value: {
											transferWindowId,
											clubSeasonId,
											budget
										}
									}))
								})
							),
						'label'
					).reverse(),
					{
						label: 'Others',
						value: 'unlinked',
						items: [
							{
								label: 'Not linked',
								value: {
									transferWindowId: null,
									clubSeasonId: null,
									budget: null
								}
							}
						]
					}
			  ]
			: [];
	}
}

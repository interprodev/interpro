import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import {
	AlreadyImportedPlayer,
	ClubTransfer,
	PlayerScouting, PlayerTransfer,
	Team,
	TransferWindowItem, WyscoutApi, WyscoutPlayerSearchResult, WyscoutPlayerSearchResultAdditionalInfo
} from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import { assign, orderBy } from 'lodash';
import { untilDestroyed } from '@ngneat/until-destroy';
import { ClubTransferPersonType } from '../../../shared/interfaces/transfers.interface';
import { ErrorService } from '@iterpro/shared/utils/common-utils';

type PlayerScoutingSelection = {
	id: string /** "NEW" if is a new player */;
	displayName: string;
	downloadUrl: string;
	clubId: string | undefined;
};

@Component({
	selector: 'iterpro-transfers-deals-add-purchase',
	templateUrl: './transfers-deals-add-purchase.component.html'
})
export class TransfersDealsAddPurchaseComponent {
	/** Services */
	readonly #translateService = inject(TranslateService);
	readonly #wyscoutApi = inject(WyscoutApi);
	readonly #errorService = inject(ErrorService);

	/** Inputs & Outputs */
	@Input({ required: true }) set scoutingPlayers(players: PlayerScouting[]) {
		this.playersOptions = this.setPlayerOptions(players);
	}
	@Input({ required: true }) alreadyImportedPlayers: AlreadyImportedPlayer[];
	@Input({ required: true }) transferWindow: TransferWindowItem;
	@Input({ required: true }) currentTeam: Team;

	@Output() addPurchase = new EventEmitter<ClubTransfer[]>();

	/** Data */
	playersOptions: PlayerScoutingSelection[] = [];
	selectedPlayer: PlayerScoutingSelection | null = null;

	addDeal(): void {
		const isNewPlayerSelected = this.selectedPlayer.id === 'NEW';

		const clubTransfer: ClubTransfer = new ClubTransfer({
			offer: 0,
			isPurchase: true,
			teamId: this.currentTeam.id,
			personType: 'PlayerScouting',
			currentStatus: 'recommended',
			transferWindowId: this.transferWindow.transferWindowId,
			clubSeasonId: this.transferWindow.clubSeasonId,
			clubId: isNewPlayerSelected ? this.currentTeam.clubId : this.selectedPlayer.clubId,
			personId: isNewPlayerSelected ? undefined : this.selectedPlayer.id
		});

		this.addPurchase.emit([clubTransfer]);
	}

	private setPlayerOptions(players: PlayerScouting[]): PlayerScoutingSelection[] {
		return [
			/** New Player Item */
			{
				id: 'NEW',
				displayName: this.#translateService.instant('scouting.newplayer.title'),
				downloadUrl: null,
				clubId: undefined
			},
			/** Scouting Player Items */
			...orderBy(players, 'displayName').map(player => ({
				id: player.id,
				displayName: player.displayName,
				downloadUrl: player.downloadUrl,
				clubId: player.clubId
			}))
		];
	}

	onSelectThirdPartySearchDialog(providerPlayers: WyscoutPlayerSearchResult[]) {
		if (providerPlayers.some(({ hasAdditionalInfo }) => !hasAdditionalInfo)) {
			this.#wyscoutApi
				.playerSearchAdditionalInfo(providerPlayers.map(({ wyId }) => wyId))
				.pipe(untilDestroyed(this))
				.subscribe(
					{
						next: (res: { players: WyscoutPlayerSearchResultAdditionalInfo[] }) => {
							res.players.forEach((player: WyscoutPlayerSearchResultAdditionalInfo) => {
								const i = providerPlayers.findIndex(({ wyId }) => wyId === player.wyscoutId);
								assign(providerPlayers[i], player);
							});
							this.wrapPlayerFromWyscout(providerPlayers as WyscoutPlayerSearchResultAdditionalInfo[]);
						},
						error: (error: Error) => this.#errorService.handleError(error)
					}
				);
		} else {
			this.wrapPlayerFromWyscout(providerPlayers as WyscoutPlayerSearchResultAdditionalInfo[]);
		}
	}

	wrapPlayerFromWyscout(providerPlayers: WyscoutPlayerSearchResultAdditionalInfo[]) {
		let dealsToAdd: ClubTransfer[] = [];
		const personType: ClubTransferPersonType = 'PlayerScouting';
		providerPlayers.forEach(wyPl => {
			const playerTransfer = new PlayerTransfer({
				wyscoutId: wyPl.wyId,
				archived: false,
				clubId: this.currentTeam.clubId,
				teamId: this.currentTeam.id,
				downloadUrl: wyPl.img,
				name: wyPl.firstName,
				lastName: wyPl.lastName,
				displayName: wyPl.shortName,
				birthDate: wyPl.birthDate,
				nationality: wyPl.birthArea.alpha2code,
				altNationality: wyPl.passportArea ? wyPl.passportArea.alpha2code : null,
				foot: wyPl.foot,
				gender: wyPl.gender,
				height: wyPl.height,
				weight: wyPl.weight,
				position: wyPl.role.code2,
				value: wyPl.transferValue,
				valueField: 'value',
				federalMembership: [],
				address: {
					street: '',
					city: '',
					zipCode: '',
					state: '',
					nation: ''
				},
				domicile: {
					street: '',
					city: '',
					zipCode: '',
					state: '',
					nation: ''
				}
			});
			dealsToAdd = [
				...dealsToAdd,
				{
					personId: undefined,
					personType,
					isPurchase: true,
					clubId: this.currentTeam.clubId,
					offer: 0,
					currentStatus: 'recommended',
					transferWindowId: this.transferWindow.transferWindowId,
					clubSeasonId: this.transferWindow.clubSeasonId,
					teamId: this.currentTeam.id,
					// @ts-ignore
					// the tempWyscoutPlayer is not a property of ClubTransfer, but it used to pass the Player to the 'after save' hook, that will create the PlayerTransfer with these info
					tempWyscoutPlayerTransfer: playerTransfer
				}
			];
		});
		this.addPurchase.emit(dealsToAdd);
	}
}

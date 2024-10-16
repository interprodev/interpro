import { Injectable, inject } from '@angular/core';
import { Club, ClubApi, ClubTransfer, ClubTransferApi, TransferContract, TransferWindowItem } from '@iterpro/shared/data-access/sdk';
import {
	ProviderIntegrationService,
	employmentContractPipeline,
	getActiveTransferContract,
	transferContractPipeline
} from '@iterpro/shared/utils/common-utils';
import { Observable, map, of } from 'rxjs';
import { TransfersBreakdown } from '../interfaces/transfers.interface';

@Injectable({ providedIn: 'root' })
export class TransfersService {
	readonly #clubTransferApi = inject(ClubTransferApi);
	readonly #providerIntegrationService = inject(ProviderIntegrationService);
	readonly #clubApi = inject(ClubApi);

	getTransfers(club: Club, transferWindow: TransferWindowItem): Observable<ClubTransfer[]> {
		const filterPipeline = this.getClubTransferFilterPipeline(club, transferWindow);
		return this.#clubTransferApi.find<ClubTransfer>(filterPipeline);
	}

	getTransferBalance(clubId: string, transferWindowId: string | null, transfersIds: string[] = []): Observable<TransfersBreakdown> {
		return this.#clubApi.getTransfersBalance(clubId, transferWindowId, transfersIds);
	}

	getClubNameByTransfer(transfer: ClubTransfer): Observable<string> {
		const activeTransferContract: TransferContract = getActiveTransferContract(transfer.player, 'inward');
		if (!activeTransferContract || !activeTransferContract.club) {
			return of('-');
		}

		return this.#providerIntegrationService
			.searchTeam(activeTransferContract.club, true)
			.pipe(map(data => (data && data[0] ? data[0].officialName : '-')));
	}

	private getClubTransferFilterPipeline(club: Club, transferWindow: TransferWindowItem): any {
		/** Loopback pipeline */
		return {
			where: {
				clubId: club.id,
				transferWindowId: transferWindow.transferWindowId || null,
				clubSeasonId: transferWindow.clubSeasonId || null
			},
			fields: {
				_player: 0
			},
			include: [
				{
					relation: 'player',
					scope: {
						include: [
							{
								relation: 'transferContracts',
								scope: {
									where: {
										status: true
									},
									...transferContractPipeline
								}
							},
							{
								relation: 'employmentContracts',
								scope: {
									where: {
										status: true
									},
									...employmentContractPipeline
								}
							}
						]
					}
				}
			]
		};
	}
}

import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { ClubTransfer, TransferContract } from '@iterpro/shared/data-access/sdk';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import { getActiveTransferContract } from '@iterpro/shared/utils/common-utils';

@Pipe({
	name: 'purchaseCost'
})
export class PurchaseCostPipe implements PipeTransform {
	readonly #shortNumberPipe = inject(ShortNumberPipe);
	readonly #currency = inject(CurrentTeamService).getCurrency();

	transform(value: ClubTransfer, ...args: any[]): any {
		const activeInwardContract: TransferContract = getActiveTransferContract(value.player, 'inward');
		if (!value.isPurchase) {
			if (activeInwardContract && activeInwardContract.amount)
				return `${this.#currency}${this.#shortNumberPipe.transform(
					Number(activeInwardContract && activeInwardContract.amount),
					true
				)}`;
			else return '-';
		}
	}
}

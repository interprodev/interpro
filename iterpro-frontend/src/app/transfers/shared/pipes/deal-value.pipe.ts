import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { ClubTransfer, TransferContract } from '@iterpro/shared/data-access/sdk';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import { getActiveTransferContract } from '@iterpro/shared/utils/common-utils';

@Pipe({
	name: 'dealValue'
})
export class DealValuePipe implements PipeTransform {
	readonly #shortNumberPipe = inject(ShortNumberPipe);
	readonly #currency = inject(CurrentTeamService).getCurrency();

	transform(value: ClubTransfer): any {
		const transferContract: TransferContract = getActiveTransferContract(
			value.player,
			value.isPurchase ? 'inward' : 'outward'
		);
		if (!transferContract) return '-';
		if (transferContract.personStatus === 'freeTransfer') {
			return `${this.#currency}0`;
		}
		if (!transferContract.amount) return '-';

		return `${this.#currency}${this.#shortNumberPipe.transform(Number(transferContract.amount), true)}`;
	}
}

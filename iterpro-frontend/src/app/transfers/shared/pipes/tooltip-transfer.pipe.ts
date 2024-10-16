import { Pipe, PipeTransform } from '@angular/core';
import { ClubTransfer, TransferContract } from '@iterpro/shared/data-access/sdk';
import { getActiveTransferContract } from '@iterpro/shared/utils/common-utils';

@Pipe({
	name: 'tooltipTransfer'
})
export class TooltipTransferPipe implements PipeTransform {
	transform(value: ClubTransfer): string | null {
		const activeInwardContract: TransferContract = getActiveTransferContract(value.player, 'inward');
		const activeOutwardContract: TransferContract = getActiveTransferContract(value.player, 'outward');

		if (value.isPurchase) {
			if (activeInwardContract && activeInwardContract.notes) return activeInwardContract.notes;
		} else {
			if (activeOutwardContract && activeOutwardContract.notes) return activeOutwardContract.notes;
		}

		return null;
	}
}

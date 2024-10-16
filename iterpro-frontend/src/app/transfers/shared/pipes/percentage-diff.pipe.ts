import { Pipe, PipeTransform } from '@angular/core';
import { ClubTransfer, TransferContract } from '@iterpro/shared/data-access/sdk';
import { getActiveTransferContract } from '@iterpro/shared/utils/common-utils';

@Pipe({
	name: 'percentageDiff'
})
export class PercentageDiffPipe implements PipeTransform {
	transform(value: ClubTransfer): string {
		const activeInwardContract: TransferContract = getActiveTransferContract(value.player, 'inward');
		const activeOutwardContract: TransferContract = getActiveTransferContract(value.player, 'outward');

		if (!activeInwardContract || !activeOutwardContract) return '-';
		if (this.isNotNumber(activeInwardContract.amount)) return '-';

		return (((activeOutwardContract.amount || 0) / activeInwardContract.amount) * 100).toFixed(0) + '%';
	}

	private isNotNumber = (n: number) => !n || n === 0;
}

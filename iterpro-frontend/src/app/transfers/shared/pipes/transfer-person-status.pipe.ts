import { Pipe, PipeTransform } from '@angular/core';
import { PlayerTransfer, TransferContract, TransferTypeString } from '@iterpro/shared/data-access/sdk';
import { getActiveTransferContract } from '@iterpro/shared/utils/common-utils';

@Pipe({
	name: 'transferPersonStatus'
})
export class TransferPersonStatusPipe implements PipeTransform {
	transform(value: PlayerTransfer, type: TransferTypeString): string {
		const transferContract: TransferContract = getActiveTransferContract(value, type);
		return transferContract?.personStatus || '-';
	}
}

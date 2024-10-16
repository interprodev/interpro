import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { ClubTransfer, EmploymentContract } from '@iterpro/shared/data-access/sdk';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import { getActiveEmploymentContract, getTotalElementsAmountForSeasonNew } from '@iterpro/shared/utils/common-utils';
import { SaleStatusLabel } from '../../transfers-deals/models/transfers-deals.types';

@Pipe({
	name: 'salaryBreakdown'
})
export class SalaryBreakdownPipe implements PipeTransform {
	readonly #shortNumberPipe = inject(ShortNumberPipe);
	readonly #currency = inject(CurrentTeamService).getCurrency();

	transform(value: ClubTransfer[], saleStatus: SaleStatusLabel): string {
		if (!value) return '-';

		const sum = value
			.filter(({ currentStatus }) => currentStatus === saleStatus)
			.reduce((acc, { player }) => {
				const activeEmploymentContract: EmploymentContract = getActiveEmploymentContract(player);

				if (!activeEmploymentContract) return 0;

				const amount = getTotalElementsAmountForSeasonNew(activeEmploymentContract, activeEmploymentContract.basicWages, false, null);

				return acc + amount;
			}, 0);

		return `${this.#currency}${this.#shortNumberPipe.transform(Number(sum), true)}`;
	}
}

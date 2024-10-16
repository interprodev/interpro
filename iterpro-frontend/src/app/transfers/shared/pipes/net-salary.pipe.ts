import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { EmploymentContract, Player } from '@iterpro/shared/data-access/sdk';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import { getActiveEmploymentContract, getTotalElementsAmountForSeasonNew } from '@iterpro/shared/utils/common-utils';

@Pipe({
	name: 'netSalary',
	standalone: true
})
export class NetSalaryPipe implements PipeTransform {
	readonly #shortNumberPipe = inject(ShortNumberPipe);
	readonly #currency = inject(CurrentTeamService).getCurrency();

	transform(value: Player): string {
		const activeEmploymentContract: EmploymentContract | undefined = getActiveEmploymentContract(value);

		if (!activeEmploymentContract) return '-';

		const amount = getTotalElementsAmountForSeasonNew(activeEmploymentContract, activeEmploymentContract.basicWages, false, undefined);

		return `${this.#currency}${this.#shortNumberPipe.transform(Number(amount), true)}`;
	}
}

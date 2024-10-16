import { Pipe, PipeTransform } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { Customer } from '@iterpro/shared/data-access/sdk';
import { sortBy } from 'lodash';

@Pipe({
	standalone: true,
	name: 'customersToSelectItems'
})
export class CustomersToSelectItemsPipe implements PipeTransform {
	transform(customers: Customer[]): SelectItem[] {
		return sortBy(
			(customers || []).map(({ id, firstName, lastName }) => ({
				label: `${firstName} ${lastName}`,
				value: id
			})),
			'label'
		);
	}
}

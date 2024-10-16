import { Pipe, PipeTransform } from '@angular/core';
import { Customer } from '@iterpro/shared/data-access/sdk';

@Pipe({
	standalone: true,
	name: 'customerName'
})
export class CustomerNamePipe implements PipeTransform {
	// customerId can be customer id or customer name (for planning events author was saved as customer name instead of id)
	transform(customerId: string, customers: Customer[]): string {
		if (!customerId) return '';
		const customer: Customer | undefined = (customers || []).find(
			({ id, firstName, lastName }) => id === customerId || `${firstName} ${lastName}` === customerId
		);
		return customer ? `${customer.firstName} ${customer.lastName}` : 'deleted user';
	}
}

import { Pipe, PipeTransform } from '@angular/core';
import { SelectItem } from 'primeng/api';

@Pipe({
	standalone: true,
	name: 'customerNameSelectItems'
})
export class CustomerNameSelectItemPipe implements PipeTransform {
	transform(customerId: string, customers: SelectItem[]): string {
		return customers.find(({ value }) => value === customerId)?.label || customerId;
	}
}

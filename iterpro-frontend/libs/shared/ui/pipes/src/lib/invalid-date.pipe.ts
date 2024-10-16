import { Pipe, PipeTransform } from '@angular/core';
import { isValidDate } from '@iterpro/shared/utils/common-utils';

@Pipe({
	standalone: true,
	name: 'invalidDate'
})
export class InvalidDatePipe implements PipeTransform {
	transform(date: any): boolean {
		return !isValidDate(date);
	}
}

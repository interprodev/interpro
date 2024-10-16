import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
	name: 'expirationPipe'
})
export class ScreeningExpirationPipe implements PipeTransform {
	transform(expiryDate: Date): string {
		/**
		 *
		 * a green dot for an expiry date that is 31 days or longer after the current day - Es. 01/02/2023 - 01/01/2023
		 * a yellow dot for an expiry date that is 30 to 0 days after the current day
		 * a red dot for an expiry date that is before the current day
		 */

		const currentDate = moment();
		const isAfter31days: boolean = moment(expiryDate).subtract(31, 'days').isAfter(currentDate);
		const isWithin30days: boolean = moment(expiryDate).isAfter(currentDate) && !isAfter31days;
		const isBefore: boolean = moment(expiryDate).isBefore(currentDate);

		if (isAfter31days) return 'green';
		if (isWithin30days) return 'yellow';
		if (isBefore) return 'red';
	}
}

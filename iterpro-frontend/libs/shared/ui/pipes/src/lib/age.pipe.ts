import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
	standalone: true,
	name: 'age'
})
export class AgePipe implements PipeTransform {
	transform(value: Date): string | null {
		if (value && (value instanceof Date || typeof value === 'number')) {
			return moment().diff(moment(value), 'years').toString();
		}

		return null;
	}
}

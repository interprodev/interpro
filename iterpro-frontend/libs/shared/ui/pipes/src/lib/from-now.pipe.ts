import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
	name: 'fromNow',
	standalone: true,
})
export class FromNowPipe implements PipeTransform {
	transform(value): string | undefined {
		if (value && (value instanceof Date || typeof value === 'number')) {
			return moment(value).fromNow();
		}
		return value;
	}
}

import { Pipe, PipeTransform } from '@angular/core';
import { orderBy, sortBy } from 'lodash';

/**
 * USAGE EXAPLES
 *
 * ngFor="let c of oneDimArray | sortBy:'asc'"
 * ngFor="let c of arrayOfObjects | sortBy:'asc':'propertyName'"
 **/

@Pipe({
	standalone: true,
	name: 'sortBy'
})
export class SortPipe implements PipeTransform {
	transform(value: any[], order: boolean | 'asc' | 'desc' = false, column = ''): any[] {
		// no array
		if (!value || !order) return value;
		// sort 1d array
		if (!column || column === '') return sortBy(value);
		// array with only one item
		if (value.length <= 1) return value;

		return orderBy(value, [column], [order]);
	}
}

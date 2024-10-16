import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	standalone: true,
	name: 'filterByIncludes'
})
export class FilterByIncludesPipe implements PipeTransform {
	transform(items: Array<any>, itemsIncluded: Array<any>, field: any): Array<any> {
		if (!items) return [];
		return items.filter(x => itemsIncluded.includes(x[field]));
	}
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	standalone: true,
	name: 'filterByField'
})
export class FilterByFieldPipe implements PipeTransform {
	transform(items: Array<any>, field: string, value: any): Array<any> {
		if (!items) return [];
		return items.filter(x => field in x && x[field] === value);
	}
}

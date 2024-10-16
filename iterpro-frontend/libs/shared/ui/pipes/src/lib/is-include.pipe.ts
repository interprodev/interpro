import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	standalone: true,
	name: 'isInclude'
})
export class IsIncludePipe implements PipeTransform {
	transform(item: any, items: Array<any>): boolean {
		return (items || []).includes(item);
	}
}

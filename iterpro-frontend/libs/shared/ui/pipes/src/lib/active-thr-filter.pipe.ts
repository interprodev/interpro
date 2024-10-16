import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'activeThrFilter',
	standalone: true
})
export class ActiveThrFilterPipe implements PipeTransform {
	transform(items: Array<any>, activeMetrics: Array<any>): Array<any> {
		return items.filter(item => (activeMetrics || []).includes(item.name.replace(/\./g, '_')));
	}
}

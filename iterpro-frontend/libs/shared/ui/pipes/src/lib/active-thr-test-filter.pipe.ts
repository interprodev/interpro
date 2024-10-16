import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	standalone: true,
	name: 'activeThrTestFilter'
})
export class ActiveThrTestFilterPipe implements PipeTransform {
	transform(items: Array<any>, activeMetrics: Array<any>): Array<any> {
		return items.filter(item =>
			activeMetrics.map(x => `${x.testName}_${x.metricName}`).includes(`${item.name}_${item.metric}`)
		);
	}
}

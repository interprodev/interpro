import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
	standalone: true,
	name: 'durationLabel'
})
export class DurationLabelPipe implements PipeTransform {
	transform(duration: number): string | undefined {
		return moment.utc(moment.duration(duration, 'seconds').asMilliseconds()).format('HH:mm:ss');
	}
}

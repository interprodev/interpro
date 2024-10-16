import * as momentLib from 'moment';
import 'moment-duration-format';
import { extendMoment } from 'moment-range';
const moment = extendMoment(momentLib);

export function calcSleepDuration(startTime: string, endTime: string): string {
	let duration = moment(endTime, 'HH:mm').diff(moment(startTime, 'HH:mm'));
	if (duration < 0) {
		duration =
			moment('24:00:', 'HH:mm').diff(moment(startTime, 'HH:mm')) +
			moment(endTime, 'HH:mm').diff(moment('00:00', 'HH:mm'));
	}
	return (moment.duration(duration) as any).format('h:mm', null, {
		forceLength: true,
		trim: false
	});
}

import { Pipe, PipeTransform } from '@angular/core';
import { EventApi } from '@fullcalendar/core';
import { Event } from '@iterpro/shared/data-access/sdk';

import moment from 'moment';

@Pipe({
	standalone: true,
	name: 'calendarDetailEventLabel'
})
export class CalendarDetailEventPipe implements PipeTransform {
	transform(event: EventApi): string {
		const customEvent: Event = event.extendedProps.sourceEvent;
		return moment(customEvent.start, 'MM/DD/YYYY hh:mm').format('HH:mm') + ' ' + customEvent.title;
	}
}

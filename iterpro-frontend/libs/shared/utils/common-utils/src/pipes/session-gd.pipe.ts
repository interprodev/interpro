import { Pipe, PipeTransform, inject } from '@angular/core';
import { Event } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { CalendarService } from '../services/calendar.service';
import { getMomentFormatFromStorage } from '../utils/dates/date-format.util';

@Pipe({
	standalone: true,
	name: 'sessionGD'
})
export class SessionGDPipe implements PipeTransform {
	readonly #calendarService = inject(CalendarService);
	readonly #translateService = inject(TranslateService);

	transform(session: Event): string | null {
		if (session) {
			let label = `${moment(session.start).format(
				`${getMomentFormatFromStorage()} hh:mm`
			)} ${this.#calendarService.getGD(session.start)}`;

			if (session.format === 'training' && session.theme !== 'field') {
				label += `${session.theme ? ' - ' + this.#translateService.instant('event.theme.' + session.theme) : ''}`;
			}

			return label;
		}

		return null;
	}
}

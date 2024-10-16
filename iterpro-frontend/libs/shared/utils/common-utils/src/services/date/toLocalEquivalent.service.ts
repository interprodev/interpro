import { Injectable } from '@angular/core';
import * as moment from 'moment';

@Injectable({
	providedIn: 'root'
})
export class ToLocalEquivalentService {
	convert(serverDate: Date): Date {
		const dateParsed = moment(serverDate).toDate();
		const convertedDate: Date = moment(dateParsed).add(dateParsed.getTimezoneOffset(), 'minutes').toDate();
		return convertedDate;
	}
}

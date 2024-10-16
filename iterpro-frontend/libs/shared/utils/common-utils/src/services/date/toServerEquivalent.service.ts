import { Injectable } from '@angular/core';
import * as momentTz from 'moment';

@Injectable({
	providedIn: 'root'
})
export class ToServerEquivalentService {
	convert(browserDate: Date): Date {
		const convertedDate: Date = momentTz(browserDate).subtract(browserDate.getTimezoneOffset(), 'minutes').toDate();
		return convertedDate;
	}
}

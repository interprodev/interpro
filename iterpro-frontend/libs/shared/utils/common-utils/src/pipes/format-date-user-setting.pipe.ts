import { DatePipe } from '@angular/common';
import { Inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { getDateFormatConfig, getFormatFromStorage } from '../utils/dates/date-format.util';

@Pipe({
	standalone: true,
	name: 'formatDateBySetting'
})
export class FormatDateUserSettingPipe implements PipeTransform {
	constructor(@Inject(LOCALE_ID) private locale: string) {}
	transform(value: any, timePart?: string): any {
		if (!value || isNaN(new Date(value).getTime())) {
			return '-';
		}
		let format = getDateFormatConfig(getFormatFromStorage()).angularDatePipe;
		if (timePart) {
			format = `${format} ${timePart}`;
		}
		const datePipe = new DatePipe(this.locale);
		return datePipe.transform(value, format);
	}
}

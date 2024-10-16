import { Injectable } from '@angular/core';
import { EtlDateType, EtlDurationType } from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment';
import * as timezone from 'moment-timezone';

@Injectable({
	providedIn: 'root'
})
export class EtlDateDurationService {
	getDateFromEtlFormat(fieldValue: string, type: EtlDateType, timezoneName: string, baseDate = null): Date {
		let date: Date | null = null;
		const timezoneOffset = timezone.tz(timezoneName).format('Z');
		const timezoneOffsetMinutes = moment.duration(timezoneOffset, 'hours').asMinutes();

		switch (type) {
			case EtlDateType.MICROSOFT_TIME: {
				const days = parseInt(fieldValue, 10);
				const unixTime = (days - 25569) * 86400;
				date = moment.unix(unixTime).subtract(timezoneOffsetMinutes, 'minutes').toDate();
				break;
			}
			case EtlDateType.MICROSOFT_TIME_FLOAT: {
				const daysFloat: number = parseFloat(fieldValue);
				const unixTimeFloat = (daysFloat - 25569) * 86400;
				date = moment.unix(unixTimeFloat).subtract(timezoneOffsetMinutes, 'minutes').toDate();
				break;
			}
			case EtlDateType.DDMMYYYY: {
				date = moment.utc(fieldValue, 'DD/MM/YYYY').subtract(timezoneOffsetMinutes, 'minutes').toDate();
				break;
			}
			case EtlDateType.DDMMYY: {
				date = moment.utc(fieldValue, 'DD/MM/YY').subtract(timezoneOffsetMinutes, 'minutes').toDate();
				break;
			}
			case EtlDateType.YYYYMMDDHHMMSS: {
				date = moment.utc(fieldValue).subtract(timezoneOffsetMinutes, 'minutes').toDate();
				break;
			}
			case EtlDateType.HHMMSS_NODATE: {
				const seconds = moment.duration(fieldValue).asSeconds();
				if (seconds && seconds !== 0) date = moment(baseDate).add(seconds, 'seconds').toDate();
				break;
			}
			case EtlDateType.DDMMYYYYHHMMSS: {
				const secs = moment.duration(moment.utc(fieldValue, 'DD/MM/YYYY HH:mm:SS').format('HH:mm:SS')).asSeconds();
				if (secs && secs !== 0) date = moment(baseDate).add(secs, 'seconds').toDate();
				break;
			}
			case EtlDateType.MMDDYYYY: {
				date = moment.utc(fieldValue, 'MM/DD/YYYY').subtract(timezoneOffsetMinutes, 'minutes').toDate();
				break;
			}
			case null:
			case undefined:
				date = baseDate;
				break;
		}

		const baseDateString = moment(baseDate).format('DD/MM/YYYY');

		return !!date && this.isValidDate(date) ? date : moment(baseDateString, 'DD/MM/YYYY').utc().toDate();
	}

	isValidDate(d: Date) {
		return d?.toString() !== 'Invalid Date';
	}

	getDurationFromEtlFormat(fieldValue: string, type: EtlDurationType): number {
		let minutes: number;
		switch (type) {
			case EtlDurationType.SECONDS: {
				const seconds: number = parseInt(fieldValue, 10);
				minutes = seconds / 60;
				break;
			}
			case EtlDurationType.MINUTESFLOAT: {
				minutes = parseFloat(fieldValue);
				break;
			}
			case EtlDurationType.HHMMSS: {
				minutes = moment.duration(fieldValue).asSeconds() / 60;
				break;
			}
			case EtlDurationType.MMSS: {
				minutes = moment.duration(fieldValue).asSeconds() / 60;
				break;
			}
			case EtlDurationType.EXCELDECIMALSECONDS: {
				const decimalValueSeconds: number = parseFloat(fieldValue);
				const secondsValue = decimalValueSeconds * 86400;
				minutes = secondsValue / 60;
				break;
			}
			case EtlDurationType.MINUTES:
			default: {
				minutes = parseInt(fieldValue, 10);
				break;
			}
		}
		return minutes;
	}

	adjustDateWithStartTime(baseDate: Date, splitStartTime: Date): Date {
		const seconds = moment.duration(moment.utc(splitStartTime, 'DD/MM/YYYY HH:mm:SS').format('HH:mm:SS')).asSeconds();
		if (seconds && seconds !== 0) baseDate = moment(baseDate).add(seconds, 'seconds').toDate();
		return baseDate;
	}
}

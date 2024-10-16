import { EtlDateType, EtlDurationType } from './etlDuration';

export enum RawMetricType {
	number = 'number',
	duration = 'duration',
	date = 'date',
	string = 'string'
}

export enum RawMetricFormat {
	seconds = 'seconds',
	minutes = 'minutes',
	minutesFloat = 'minutesFloat',
	hhmmss = 'hhmmss',
	mmss = 'mmss',
	decimalExcelSeconds = 'decimalExcelSeconds',
	microsoftTime = 'microsoftTime',
	microsoftTimeFloat = 'microsoftTimeFloat',
	unixTime = 'unixTime',
	ddmmyyyy = 'ddmmyyyy',
	ddmmyy = 'ddmmyy',
	yyyyddhhmmss = 'yyyyddhhmmss',
	mmddyyyy = 'mmddyyyy'
}

export class RawMetric {
	name: string | null = null;
	label: string | null = null;
	type: RawMetricType | null = null;
	format: RawMetricFormat | null = null;
}

export const getEtlDurationTypeFromDurationFormat = (format: RawMetricFormat): EtlDurationType | null => {
	switch (format) {
		case 'hhmmss': {
			return EtlDurationType.HHMMSS;
		}
		case 'mmss': {
			return EtlDurationType.MMSS;
		}
		case 'seconds': {
			return EtlDurationType.SECONDS;
		}
		case 'minutes': {
			return EtlDurationType.MINUTES;
		}
		case 'minutesFloat': {
			return EtlDurationType.MINUTESFLOAT;
		}
		case 'decimalExcelSeconds': {
			return EtlDurationType.EXCELDECIMALSECONDS;
		}

		default:
			return null;
	}
};

export const getEtlDateTypeFromDateFormat = (format: RawMetricFormat): EtlDateType | null => {
	switch (format) {
		case 'microsoftTime': {
			return EtlDateType.MICROSOFT_TIME;
		}
		case 'microsoftTimeFloat': {
			return EtlDateType.MICROSOFT_TIME_FLOAT;
		}
		case 'unixTime': {
			return EtlDateType.UNIX_TIME;
		}
		case 'ddmmyyyy': {
			return EtlDateType.DDMMYYYY;
		}
		case 'ddmmyy': {
			return EtlDateType.DDMMYY;
		}
		case 'hhmmss': {
			return EtlDateType.HHMMSS_NODATE;
		}
		case 'yyyyddhhmmss': {
			return EtlDateType.YYYYMMDDHHMMSS;
		}
		case 'mmddyyyy': {
			return EtlDateType.MMDDYYYY;
		}

		default:
			return null;
	}
};

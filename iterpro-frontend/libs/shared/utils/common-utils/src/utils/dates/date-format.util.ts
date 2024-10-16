import { LocaleSettings } from 'primeng/calendar';

export enum UserDateFormatSetting {
	EuropeanFormat = 1,
	AmericanFormat = 2,
	GermanFormat = 3,
	ISO8601Format = 4
}

export interface DateFormatConfig {
	primengConfig: Partial<LocaleSettings>;
	primengInputMask: string; // for primeng inputMask
	angularDatePipe: string; // for angular date pipe
}

export const getBackendFormat = (): string => {
	return getDateFormatConfig(UserDateFormatSetting.EuropeanFormat).angularDatePipe.toUpperCase();
};

export const getDateFormatConfig = (setting: UserDateFormatSetting): DateFormatConfig => {
	let config: DateFormatConfig;
	const europeanConfig: DateFormatConfig = {
		primengConfig: { dateFormat: 'dd/mm/yy' },
		primengInputMask: '99/99/99',
		angularDatePipe: 'dd/MM/yyyy'
	};

	switch (setting) {
		case UserDateFormatSetting.EuropeanFormat:
			config = europeanConfig;
			break;
		case UserDateFormatSetting.AmericanFormat:
			config = {
				primengConfig: { dateFormat: 'mm/dd/yy' },
				primengInputMask: '99/99/99',
				angularDatePipe: 'MM/dd/yy'
			};
			break;
		case UserDateFormatSetting.GermanFormat:
			config = {
				primengConfig: { dateFormat: 'dd.mm.yy' },
				primengInputMask: '99.99.99',
				angularDatePipe: 'dd.MM.yy'
			};
			break;
		case UserDateFormatSetting.ISO8601Format:
			config = {
				primengConfig: { dateFormat: 'yy-mm-dd' },
				primengInputMask: '99-99-99',
				angularDatePipe: 'yyyy-MM-dd'
			};
			break;
		default:
			console.error('Date format not supported');
			config = europeanConfig;
			break;
	}

	return config;
};

export const getFormatFromStorage = (): UserDateFormatSetting => {
	const value = localStorage.getItem('currentDateFormat');
	const format = value ? JSON.parse(value) : {};
	return format ? (Number(format) as UserDateFormatSetting) : UserDateFormatSetting.EuropeanFormat;
};

export const getMomentFormatFromStorage = (): string => {
	const userDateFormat: UserDateFormatSetting = getFormatFromStorage();
	const format: DateFormatConfig = getDateFormatConfig(userDateFormat);
	return (format.primengConfig.dateFormat as string).toUpperCase();
};

import * as moment from 'moment';
import { getMomentFormatFromStorage } from './date-format.util';

export const sortByDateDesc = (array: any[], field: string, format = getMomentFormatFromStorage()) =>
	array.sort((a, b) => moment(b[field], format).toDate().getTime() - moment(a[field], format).toDate().getTime());

export const sortByDate = (array: any[], field: string, format = getMomentFormatFromStorage()) =>
	array.sort((a, b) => moment(a[field], format).toDate().getTime() - moment(b[field], format).toDate().getTime());

export const today = (date?) => moment(date).startOf('day').toDate();

export const diffDays = (date1, date2) => moment(date1).diff(moment(date2), 'day');

export const isValidDate = date => !!date && !isNaN(date) && date instanceof Date;

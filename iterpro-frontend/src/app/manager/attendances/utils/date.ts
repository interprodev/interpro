import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { DecimalPipe } from '@angular/common';

const moment = extendMoment(Moment);

export const getMonths = () => [
	{ label: 'months.january', value: 1 },
	{ label: 'months.february', value: 2 },
	{ label: 'months.march', value: 3 },
	{ label: 'months.april', value: 4 },
	{ label: 'months.may', value: 5 },
	{ label: 'months.june', value: 6 },
	{ label: 'months.july', value: 7 },
	{ label: 'months.august', value: 8 },
	{ label: 'months.september', value: 9 },
	{ label: 'months.october', value: 10 },
	{ label: 'months.november', value: 11 },
	{ label: 'months.december', value: 12 }
];

export const getYears = () => {
	const years = [];
	const currentYear = moment().get('year');
	const currentYearNumber = Number(currentYear);
	for (let j = 2015; j <= currentYearNumber; j++) {
		years.push({ label: j.toFixed(0), value: j });
	}
	return years.reverse();
};

export const getMonth = (data: Date) => moment(data).get('month') + 1;

export const getCurrentYear = () => moment().get('year');

export const getDatesOfMonth = (year: number, month: number): [Date, Date] => {
	const monthDig = new DecimalPipe('en-US').transform(month, '2.0-0');
	const dateString = `01/${monthDig}/${year}`;
	const dateStart: Date = moment(dateString, 'DD/MM/YYYY').toDate();
	const from = moment(dateStart).startOf('month').toDate();
	const to = moment(from).endOf('month').toDate();
	return [from, to];
};

export const getDays = (from: Date, to: Date) => Array.from(moment.range(moment(from), moment(to)).by('days'));

export const getDaysNumbers = (from: Date, to: Date) => {
	const days: number[] = [];
	if (!from || !to) return days;
	const start = Math.max(0, from.getDate() - 1);
	const length = moment(to).diff(moment(from), 'days');
	let i = 0;
	for (; i <= length; i++) {
		days.push(start + i);
	}
	return days;
};

import * as moment from 'moment';

export const getAgeString = (date: Date): string => {
	if (!date) return '';
	const today = moment();
	const birthdate = moment(date);
	const years = today.diff(birthdate, 'years');
	return `${years || ''}`;
};


export function getAge(date: Date): number {
	return moment().diff(date, 'years');
}

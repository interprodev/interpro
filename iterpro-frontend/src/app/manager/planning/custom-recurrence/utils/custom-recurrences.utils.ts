export type weekdays = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export const WEEKLY_DAYS: { key: weekdays; label: string; index: number }[] = [
	{
		key: 'monday',
		label: 'M',
		index: 1 // this index is for getDay() --> 'monday'
	},
	{
		key: 'tuesday',
		label: 'T',
		index: 2
	},
	{
		key: 'wednesday',
		label: 'W',
		index: 3
	},
	{
		key: 'thursday',
		label: 'T',
		index: 4
	},
	{
		key: 'friday',
		label: 'F',
		index: 5
	},
	{
		key: 'saturday',
		label: 'S',
		index: 6
	},
	{
		key: 'sunday',
		label: 'S',
		index: 0
	}
];

export function getDayLabelFromDate(selectedDate: Date): weekdays {
	return WEEKLY_DAYS.find(({ index }) => index === selectedDate.getDay()).key;
}

export function getWordFromNumberUtil(weekNumber: number): string {
	const words = ['first', 'second', 'third', 'fourth', 'fifth'];
	return words[weekNumber - 1];
}

export function getWeekOfMonth(momentDate): number {
	const firstDayOfMonth = momentDate.clone().startOf('month');
	const firstDayOfWeek = firstDayOfMonth.clone().startOf('week');

	const offset = firstDayOfMonth.diff(firstDayOfWeek, 'days');

	return Math.ceil((momentDate.date() + offset) / 7);
}

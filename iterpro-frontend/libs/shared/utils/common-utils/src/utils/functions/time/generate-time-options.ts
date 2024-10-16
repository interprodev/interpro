import { SelectItem } from 'primeng/api';

export function generateTimeOptions(minTime: string, stepMinutes: number): SelectItem[] {
	const [startHour, startMinute] = minTime ? minTime.split(':').map(Number) : [0, 0];
	const totalMinutesInDay = 24 * 60;
	const startTotalMinutes = startHour * 60 + startMinute;
	const options: SelectItem[] = [];

	for (let i = startTotalMinutes; i < totalMinutesInDay; i += stepMinutes) {
		const hour = Math.floor(i / 60) % 24;
		const minute = i % 60;
		const formattedHour = hour < 10 ? '0' + hour : '' + hour;
		const formattedMinute = minute < 10 ? '0' + minute : '' + minute;
		options.push({ label: `${formattedHour}:${formattedMinute}`, value: `${formattedHour}:${formattedMinute}` });
	}
	return options;
}


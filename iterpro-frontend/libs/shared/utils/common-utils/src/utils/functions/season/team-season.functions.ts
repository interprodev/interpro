import * as moment from 'moment/moment';
import { TeamSeason } from '@iterpro/shared/data-access/sdk';

export function getDefaultTeamSeasonDate(baseDate: Date): Pick<TeamSeason, 'offseason' | 'preseason' | 'inseasonStart' | 'inseasonEnd'> {
	const baseYear = baseDate && moment(baseDate).year() < 7 ? moment(baseDate).year() - 1 : moment(baseDate).year();
	return {
		offseason: moment({
			year: baseYear,
			month: 6,
			day: 1
		}).toDate(),
		preseason: moment({
			year: baseYear,
			month: 6,
			day: 10
		}).toDate(),
		inseasonStart: moment({
			year: baseYear,
			month: 7,
			day: 15
		}).toDate(),
		inseasonEnd: moment({
			year: baseYear + 1,
			month: 5,
			day: 30
		}).toDate()
	};
}

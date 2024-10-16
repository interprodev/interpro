import { Injectable, inject } from '@angular/core';
import { Event, EventApi } from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment';
import { map } from 'rxjs/operators';
import { sortByDate } from '../utils/dates/date.util';

@Injectable({ providedIn: 'root' })
export class CalendarService {
	readonly #eventMatchApi: EventApi = inject(EventApi);
	private startingDate: moment.Moment | null = null;
	gdCalendar: Event[] = [];

	downloadCalendar(teamId: string): void {
		this.gdCalendar = [];
		this.#eventMatchApi
			.find<Event>({
				where: {
					teamId,
					format: { in: ['game', 'friendly'] }
				},
				fields: ['id', 'start']
			})
			.pipe(map((res: Event[]) => sortByDate(res, 'start').reverse()))
			.subscribe(events => (this.gdCalendar = events));
	}

	getGD(date: Date): string {
		const closests = this.getClosestGames(date);
		return this.getGameDay(closests, date);
	}

	getClosestGames(date: Date): [Event, Event] {
		const prevGame = this.gdCalendar.filter(({ start }) => moment(start).isSameOrBefore(moment(date)));
		const nextGame = this.gdCalendar.filter(({ start }) => moment(start).isSameOrAfter(moment(date)));
		return [prevGame[0], nextGame[nextGame.length - 1]];
	}

	getGameDay(matches: Event[], date: Date): string {
		this.startingDate = this.getStartingDate(date);

		// previous undefined -> set sport year beginning
		if (!matches[0]) {
			matches[0] = new Event();
			matches[0].start = this.startingDate.toDate();
		}
		// next undefined -> set sport year end
		if (!matches[1]) {
			matches[1] = new Event();
			matches[1].start = this.startingDate.add(364, 'days').toDate();
		}

		const _date = moment(date).startOf('day');
		const _start1 = moment(matches[0].start).startOf('day');
		const _start2 = moment(matches[1].start).startOf('day');

		// SPECIAL CASE 1: date is a GD
		if (_date.isSame(_start1, 'days') || _date.isSame(_start2, 'days')) {
			return 'GD';
		}

		const _diff1 = _date.diff(_start1, 'days');
		const _diff2 = _start2.diff(_date, 'days');
		const _diffMatches = _start2.diff(_start1, 'days') - 1;

		// SPECIAL CASE 2:  2 days between 2 matches
		if (_diffMatches === 2) {
			if (_diff1 === 1) {
				if (_diff2 === 1) return 'GD+1-1';
				else return 'GD+1-2';
			} else if (_diff2 === 1) return 'GD+2-1';
			else return 'GD+1-1';
		}

		// NORMAL CASE
		if (_diffMatches <= 7) return 'GD+' + _diff1.toString() + '-' + _diff2.toString();
		else {
			if (_diff1 <= 2) return 'GD+' + _diff1.toString();
			if (_diff2 <= 7) return 'GD-' + _diff2.toString();
			return 'Gen';
		}
	}

	private getStartingDate(date: Date): moment.Moment {
		return moment(date).month() < 6
			? moment('01/07', 'DD-MM').set('years', moment(date).subtract(1, 'years').get('years'))
			: (this.startingDate = moment('01/07', 'DD-MM').set('years', moment(date).get('years')));
	}
}

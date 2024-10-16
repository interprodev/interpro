const moment = require('moment');

const dateUtils = (module.exports = {
	getGD: function (date, matches) {
		const closests = dateUtils.getClosestGames(date, matches);
		return dateUtils.getGameDay(closests, date);
	},

	getClosestGames: function (date, matches) {
		const prevGame = matches.filter(({ start, eventStart }) =>
			moment(start || eventStart).isSameOrBefore(moment(date))
		);
		const nextGame = matches.filter(({ start, eventStart }) => moment(start || eventStart).isSameOrAfter(moment(date)));
		return [prevGame[0], nextGame[nextGame.length - 1]];
	},

	getGameDay: function (matches, date) {
		const startingDate = dateUtils.getStartingDate(date);

		// previous undefined -> set sport year beginning
		if (!matches[0]) {
			matches[0] = {
				start: startingDate.toDate()
			};
		}
		// next undefined -> set sport year end
		if (!matches[1]) {
			matches[1] = {
				start: startingDate.add(364, 'days').toDate()
			};
		}

		const _date = moment(date).startOf('day');
		const _start1 = moment(matches[0].start || matches[0].eventStart).startOf('day');
		const _start2 = moment(matches[1].start || matches[1].eventStart).startOf('day');

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
	},

	getStartingDate: function (date) {
		return moment(date).month() < 6
			? moment('01/07', 'DD-MM').set('years', moment(date).subtract(1, 'years').get('years'))
			: moment('01/07', 'DD-MM').set('years', moment(date).get('years'));
	}
});

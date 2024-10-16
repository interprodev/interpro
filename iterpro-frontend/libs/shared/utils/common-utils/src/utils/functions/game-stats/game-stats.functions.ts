import { Goal, MatchProviderStats, StatsResult } from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment';
import { gameStatsConfig } from '../../../constants/scouting/game-stats.constants';
import { sortByDate } from '../../dates/date.util';

export const toDisplayScorers = (scorers: any[], t: (key: string) => string) => {
	const toDisplayMinutes = (minutes: number) => (minutes ? ` ${minutes}'` : '');
	return scorers
		.map(
			s =>
				`${s.player.shortName} ${toDisplayMinutes(s.minute)}${
					s.type === 'own' ? ' (' + t('dashboard.details.own') + ')' : ''
				}${s.type === 'penalty' ? ' (' + t('dashboard.details.penalty') + ')' : ''}`
		)
		.join(', ');
};

export const getStats = (selected: MatchProviderStats): StatsResult[] => {
	return gameStatsConfig.map(item => {
		if (!selected) {
			return {
				item,
				home: null,
				homePerc: 0,
				away: null,
				awayPerc: 0
			};
		} else {
			const home =
				selected.home && selected.home.teamStats
					? +Number(selected.home.teamStats[item.type][item.value]).toFixed(1)
					: null;
			const away =
				selected.away && selected.away.teamStats
					? +Number(selected.away.teamStats[item.type][item.value]).toFixed(1)
					: null;
			let homePerc = home ? 100 : 0;
			let awayPerc = away ? 100 : 0;
			if (home && away) {
				if (home > away) {
					awayPerc = (100 * away) / home;
				} else if (away > home) {
					homePerc = (100 * home) / away;
				}
			}

			return {
				item,
				home,
				homePerc,
				away,
				awayPerc
			};
		}
	});
};

export const getScore = (data: any) =>
	data.match &&
	data.home &&
	data.home.teamData &&
	data.away &&
	data.away.teamData &&
	moment().isBefore(moment(data.match.dateutc), 'second')
		? ['-', '-']
		: [data.home.teamData.score, data.away.teamData.score];

export const getScorers = ({ goals = [] }: { goals: Goal[] }, { wyId }: { wyId: number }, own = false): Goal[] => {
	const teamGoals: Goal[] = goals.filter(
		({ teamId, player, type }) =>
			[teamId, player.currentTeamId, player.currentNationalTeamId].includes(wyId) &&
			((!own && type !== 'own') || (own && type === 'own'))
	);
	return sortByDate(teamGoals, 'minute');
};

const axiosRetry = require('axios-retry');
const axiosLib = require('axios');
const { baseURL, lang, lang_id, format, fallbackResponsesForDebug } = require('../../../config/instat.config.json');
const mockResponses = require('../../../config/instatSampleData.json');
const { ForbiddenError, UnprocessableEntityError } = require('../../../common/modules/error');

let instatBaseApi;

/**
 * Instat original API client
 *
 * Parameters:
 * id=**** - user’s personal id in InStat API
 * key=**** - user’s personal key to InStat API
 * tpl=** - feed template of data delivery
 * season_id=** - season of data delivery
 * tournament_id=** - tournament of data delivery
 * team_id=** - team of data delivery
 * player_id=** - player of data delivery
 * match_id=****** - match of data delivery
 * date_start=****-**-** - beginning date of data delivery in YYYY-MM-DD format*
 * date_end=****-**-** - ending date of data delivery in YYYY-MM-DD format*
 * analyzed=* - allows to pull analyzed or non-analyzed matches, =1 stands for for analyzed matches, =0 - for non-analyzed matches
 * team_type=* - type of team for data delivery, =1 for club, =2 for National Team
 * lang_id=* - language of data delivery, e.g. lang=1 stand for English
 * seasons=*,*,* - seasons of data delivery, each * stands for season id
 * from_ts=****-**-**T**:** - beginning date of data delivery for delta feeds in YYYY-MM-DDTHH:MM, where HH:MM is GMT
 * to_ts=****-**-**T**:** - ending date of data delivery for delta feeds in YYYY-MM-DDTHH:MM, where HH:MM is GMT
 * start_ms=* - starting time for match markers, =0 stands for footage game clock includes seconds before the first half kick-off pass, =1 - footage game clock start the first half kick-off pass
 * format=*** - format of data delivery, may be =xml, =json, =csv or =ts

 */
module.exports = {
	/** This template delivers all players of the selected team with their ids */
	getTeamPlayers: team_id =>
		fetch(5, {
			team_id
		}),
	/** Basic player info */
	getPlayerBasicInfo: player_id => fetch(11, { player_id }),
	/** Basic team info */
	getTeamBasicInfo: team_id => fetch(12, { team_id }),
	/** All teams of the tournament with ids */
	getTeamsByTournament: (tournament_id, season_id, date_start, date_end) =>
		fetch(32, {
			tournament_id,
			season_id,
			date_start,
			date_end
		}),
	/** This template gives you the fixtures and results of the competition and also delivers all ids of the matches */
	getMatches: (tournament_id, season_id, team_id, date_start, date_end) =>
		fetch(35, {
			tournament_id,
			season_id,
			team_id,
			date_start,
			date_end
		}),
	/** Match log where the sequence of actions with the ball is coded with X,Y coordinates */
	getMarkers: (match_id, start_ms = 0) =>
		fetch(36, {
			match_id,
			start_ms
		}),
	/** Basic match info */
	getMatchInfo: match_id => fetch(37, { match_id }),
	/** Team's squad in the season, a player must play at least one game in a selected season */
	getPlayers: (team_id, season_id) =>
		fetch(37, {
			team_id,
			season_id
		}),
	/** This template delivers match lineups */
	getMatchLineups: match_id => fetch(39, { match_id }),
	/** Match stats for each player in lineups */
	getStatPlayers: match_id => fetch(40, { match_id }),
	/** Players play-by-play, or summary, stats */
	getPlayersByOne: (player_id, tournament_id, season_id, date_start, date_end) =>
		fetch(41, {
			player_id,
			tournament_id,
			season_id,
			date_start,
			date_end
		}),
	/** This template delivers team stats in the match */
	getMatchTeamStats: match_id => fetch(42, { match_id }),
	/** Teams play-by-play stats, or summary, stats */
	getStatTeamsByOne: (team_id, tournament_id, season_id, date_start, date_end) =>
		fetch(43, {
			team_id,
			tournament_id,
			season_id,
			date_start,
			date_end
		}),
	/** General tournament standings */
	getStandings: (tournament_id, season_id, group_id) =>
		fetch(46, {
			group_id,
			season_id,
			tournament_id
		}),
	/** Player aggregate stats based on a selected tournament and season */
	getPlayerStatsAggregated: (player_id, tournament_id, season_id) =>
		fetch(61, {
			player_id,
			tournament_id,
			season_id
		}),
	/** Team aggregate stats based on a selected tournament and season */
	getTeamStatsAggregated: (team_id, tournament_id, season_id, date_start, date_end) =>
		fetch(62, {
			team_id,
			tournament_id,
			season_id,
			date_end,
			date_start
		}),
	/** Basic seasons info */
	getSeasonsBasicInfo: (...seasonIds) => {
		const strSeasonsIds = seasonIds.map(String);
		const seasons = strSeasonsIds.slice(0, -1).join(',') + ',' + strSeasonsIds.slice(-1);
		return fetch(209, { seasons });
	},
	/** Template delivers info about available seasons and number of analysed matches in the tournament */
	getTournamentInfo: tournament_id => fetch(225, { tournament_id }),
	// getTournamentBasicInfo: async tournament_id => {
	// 	// tpl 230 is still unavailable for us
	// 	// const response = await fetch(230, { tournaments: tournament_id });
	// 	const mappedTournaments = instatCompetitions.competitions.map(competition => ({
	// 		...competition,
	// 		country_id: 233,
	// 		country_name: 'Switzerland'
	// 	}));
	// 	// if (response.error) {
	// 	// fallback response
	// 	return { 'data': { 'code': 'tournaments_info', 'tournament': [mappedTournaments.find(({ instatId }) => instatId === tournament_id)] } };
	// 	// } else return response;
	// },

	getTournamentBasicInfo: tournament_id => fetch(230, { tournaments: tournament_id }),
	getCompetitionTeamsAggregatedStats: (tournament_id, season_id) => fetch(286, { tournament_id, season_id }),
	/** Tournament standings with home matches only */
	getStandingHome: (tournament_id, season_id) => fetch(48, { tournament_id, season_id }),
	/** Tournament standings with away matches only */
	getStandingAway: (tournament_id, season_id) => fetch(49, { tournament_id, season_id }),
	/** Instat API that are not covered by free of charge plan or not used by Iterpro */
	/** Fitness markers of the match */
	getFitness: match_id => fetch(-1, { match_id }),
	/** Team players' aggregate stats based on a selected tournament and season */
	getPlayerStatsAggregatedByTeam: (team_id, tournament_id, season_id) =>
		fetch(-1, {
			team_id,
			tournament_id,
			season_id
		}),
	/** Player’s career at clubs or National Team */
	getPlayerCareer: (player_id, team_type) =>
		fetch(-1, {
			player_id,
			team_type
		}),
	/** Match fitness stats for each player in lineups */
	getPlayersStatFitness: match_id =>
		fetch(-1, {
			match_id
		}),
	/** Player's aggregate, or summary, fitness stats */
	getPlayersFitnessAggregated: (player_id, tournament_id, season_id) =>
		fetch(-1, {
			player_id,
			tournament_id,
			season_id
		}),
	/** (not used) Match info delta feed* */
	getMatchInfoDeltaFeed: (from_ts, to_ts) =>
		fetch(-1, {
			from_ts,
			to_ts
		}),
	/** Tournament info delta feed* */
	getTournamentInfoDeltaFeed: (from_ts, to_ts) =>
		fetch(-1, {
			from_ts,
			to_ts
		}),
	/** Tournament info delta feed* */
	getPlayerInfoDeltaFeed: (from_ts, to_ts) =>
		fetch(-1, {
			from_ts,
			to_ts
		}),
	/** Players aggregate stats delta feed* */
	getPlayerInfoAggregatedDeltaFeed: (tournament_id, season_id, from_ts, to_ts) =>
		fetch(-1, {
			tournament_id,
			season_id,
			from_ts,
			to_ts
		}),
	/** Players aggregate stats delta feed* */
	getTeamStatsAggregatedsDeltaFeed: (tournament_id, season_id, from_ts, to_ts) =>
		fetch(-1, {
			tournament_id,
			season_id,
			from_ts,
			to_ts
		}),
	/** Number of broken down seasons in each season of a tournament */
	getSeasonsOfTournament: tournament_id =>
		fetch(209, {
			tournament_id
		}),
	/** Team info delta feed* */
	getTeamInfoDeltaFeed: (from_ts, to_ts) =>
		fetch(-1, {
			from_ts,
			to_ts
		}),
	/** Tournament table delta feed* */
	getStandingsDeltaFeed: (season_id, from_ts, to_ts) =>
		fetch(-1, {
			season_id,
			from_ts,
			to_ts
		}),
	/** Aggregate stats of all players in a tournament */
	getStatPlayersAggregatedAll: (tournament_id, season_id) =>
		fetch(-1, {
			tournament_id,
			season_id
		}),
	/** Aggregate stats of all teams in a tournament */
	getStatTeamsAggregatedAll: (tournament_id, season_id) =>
		fetch(-1, {
			tournament_id,
			season_id
		})
};

/**
 * Fetch response from Instat API and parses the received data
 * @param {*} tpl
 * @param {*} queryArgs
 * @returns
 */
async function fetch(tpl, queryArgs) {
	try {
		if (!tpl) throw new Error('Missing tpl!');
		if (tpl === -1)
			throw new ForbiddenError(
				'It seems that your current Instat plan does not allow to use this feed. Contact your support.',
				'Instat API'
			);
		if (instatBaseApi == null) instatBaseApi = getBaseApi(baseURL);
		const apiQuery = {
			id: process.env.INSTAT_CLIENTID,
			key: process.env.INSTAT_KEY,
			lang_id,
			lang,
			format,
			...queryArgs
		};
		// convert query object to url params
		const validQuery = Object.entries(apiQuery).filter(([, value]) => value != null);
		let url = `/feed.php?tpl=${tpl}&` + validQuery.reduce((acc, [key, value]) => acc + `${key}=${value}&`, '');
		url = url.slice(0, url.length - 1); // remove last & character
		console.debug('Obtaining response from instat url\n %s', url);
		const response = await instatBaseApi.get(url);
		const { data } = response;
		// extract data
		// Check if response has data key.
		return {
			data,
			error: data !== null && data !== '' ? null : 'Received no data from Instat. It may be not available yet.'
		};
	} catch (error) {
		// Attempting to format error
		const { data: errorMsg } = error;
		let errorResponse;
		if (errorMsg === 'Invalid key2') {
			errorResponse = {
				data: null,
				error: 'Invalid Instat key. Your Instat account may have been deactivated. Contact support.'
			};
		} else if (error.isAxiosError) {
			const {
				response: { data: errorData }
			} = error;
			errorResponse = {
				data: null,
				error: errorData
			};
		} else {
			errorResponse = {
				data: null,
				error
			};
		}
		// Since the amount of denied data, in a debug situation it could be useful to obtain data anyway
		if (fallbackResponsesForDebug && mockResponses[tpl]) {
			console.error(`Instat feed ${tpl} returning error '${errorResponse.error}', using fallback`);
			return mockResponses[tpl];
		} else {
			switch (errorResponse.error) {
				case 'Access denied': {
					throw new ForbiddenError(
						`It seems that your current Instat plan does not support using feed ${tpl} with the provided arguments. Contact support.`
					);
				}
				case 'Invalid request1': {
					throw new UnprocessableEntityError(
						'It seems that Instat is experiencing a technical difficulty. Please, try again later.'
					);
				}
				case 'Invalid key2': {
					return {
						data: null,
						error: 'Invalid Instat key. Your Instat account may have been deactivated. Contact support.'
					};
				}
				default: {
					return errorResponse;
				}
			}
		}
	}
}

const getBaseApi = baseURL => {
	const BaseAPI = axiosLib.create({ baseURL });
	const retryCondition = error => {
		if (error.response.data === 'Invalid request1') {
			return true;
		}
		const cond = axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response.status === 429;
		console.debug(`path: ${error.request.path}`);
		console.debug(`status: ${error.response.status}`);
		if (error.response.status === 404) console.error(error.response.data);
		return [404, 400, 500].includes(error.response.status) ? false : cond;
	};
	axiosRetry(BaseAPI, {
		retries: 20,
		retryDelay: axiosRetry.exponentialDelay,
		retryCondition
	});
	return BaseAPI;
};

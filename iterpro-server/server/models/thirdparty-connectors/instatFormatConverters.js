const Promise = require('bluebird');
const moment = require('moment');
const wyscout = require('./wyscout');
const { toNumberProps } = require('../../../utils/object');
const wyscoutConfig = require('../../../config/wyscout.config.json');
const { areas: wyscoutAreas } = require('../../../config/wyscoutAreas.json');
const {
	availableSeasonsIds,
	playerStatisticsIds,
	// separated in order to avoid key duplication (since the kpi may be requested both from total/avg and percentage
	teamStatisticsIds,
	teamStatisticsPercentIds,
	// the fields that normally are returned by wyscout
	teamSeasonalDataTotalFields,
	teamSeasonalDataAvgFields,
	teamSeasonalDataPercentFields,
	/** kpi couples (total field - quantity field) in order to manually calculate percent kpis */
	teamSeasonalDataPercManualFields
} = require('../../../config/instat.config.json');
const instatApi = require('./instatApi');

/**
 * Converts Instat data format to Wyscout's one
 */
const converters = (module.exports = {
	// GENERAL
	/** convers Instat country in wyscout's area */
	area: instatCountryName => wyscoutAreas.find(({ name }) => name === instatCountryName),
	date: instatDate => moment(instatDate).format('MMMM DD, YYYY [at] hh:mm:ss A'),
	dateUTC: instatDate => moment(instatDate).utc().format('MMMM DD, YYYY hh:mm:ss'),
	gender: (instatGenderName = 'male') => {
		switch (instatGenderName.toLowerCase()) {
			case 'f':
			case 'female': {
				return 'female';
			}
			case 'male':
			case 'm':
			default: {
				return 'male';
			}
		}
	},
	/**
	 * emulates Wyscout pagination, with a single page with all elements
	 * and the original info injected as array property
	 */
	mockPagination: (field, collection) => {
		const { length } = collection;
		const basePage = {
			meta: {
				total_items: length,
				page_size: length,
				page_current: 1,
				page_count: 1,
				availableFilters: {
					fetches: [],
					filters: [],
					sorts: [],
					searches: [],
					advsearches: []
				},
				appliedFilters: {
					fetch: [],
					filter: [],
					search: '',
					advsearch: [],
					sort: [],
					limit: length,
					page: 1
				}
			}
		};
		basePage[field] = collection;
		return basePage;
	},
	// COMPETITION
	/** converts Instat tournament basic info in wyscout's equivalent */
	competitionBasicInfo: apiResponse => {
		const { data = {} } = apiResponse;
		const { tournament: [tournamentInfo] = [] } = data.data;
		const { id: instId, name, country_name } = tournamentInfo;

		return {
			instId,
			name,
			area: converters.area(country_name),
			format: 'Domestic league',
			type: 'club',
			category: 'default',
			gender: 'male',
			divisionLevel: 1
		};
	},
	/**
	 * Extracts match lineup fields and name them as Wyscout's convention
	 * */
	matchLineup: instatMatchLineupObject => {
		const { first_team, second_team } = instatMatchLineupObject;
		// first team lineup
		const [{ lineup: firstTeamLineup }] = first_team;
		const [{ main: team1MainLineup }] = firstTeamLineup;
		const [{ player: team1Lineup, start_tactic: team1StartTactic }] = team1MainLineup;
		// second team lineup
		const [{ lineup: secondTeamLineup }] = second_team;
		const [{ main: team2MainLineup }] = secondTeamLineup;
		const [{ player: team2Lineup, start_tactic: team2StartTactic }] = team2MainLineup;
		return {
			team1Lineup,
			team2Lineup,
			team1StartTactic,
			team2StartTactic
		};
	},
	matchStatus: function (matchOrStatusId) {
		if (typeof matchOrStatusId === 'object') {
			return moment(matchOrStatusId.match_date).isSameOrBefore(moment()) ? 'Played' : 'Fixture';
		} else {
			switch (matchOrStatusId) {
				case '5':
				case 5: {
					return 'Played';
				}
				default: {
					return 'Fixture';
				}
			}
		}
	},
	/** converts Instat match lineups object in wyscout's equivalent */
	matchLineupsApiResponse: apiResponse => {
		const {
			data: {
				first_team: { id: firstTeamId, lineup: firstTeamLineup },
				second_team: { id: secondTeamId, lineup: secondTeamLineup }
			}
		} = apiResponse;
		const response = {};
		response[String(firstTeamId)] = converters.matchTeamLineup(firstTeamLineup);
		response[String(secondTeamId)] = converters.matchTeamLineup(secondTeamLineup);
		return response;
	},
	/**
	 * convers Instat single team lineup in wyscout's equivalent
	 *
	 * Notice that Instat does not supports multiple tacticts for same half
	 * nor it distinguish between tactic in first half or second half
	 */
	matchTeamLineup: teamLineup => {
		const {
			main: { starting_tactic, ending_tactic, player }
		} = teamLineup;
		const baseResponse = {
			'1H': {
				// starting tactic of Instat, 0 is a key, not an array index
				0: {}
			},
			'2H': {
				// ending tactic of Instat, 0 is a key, not an array index
				0: {}
			}
		};
		baseResponse['1H']['0'][starting_tactic] = {
			scheme: starting_tactic,
			matchPeriod: '1H',
			players: {}
		};
		baseResponse['2H']['0'][ending_tactic] = {
			scheme: ending_tactic,
			matchPeriod: '2H',
			players: {}
		};

		// add 1H main lineup players
		player
			.filter(({ starting_lineup }) => starting_lineup === '1')
			.map(({ id: playerId, starting_position_name }) => {
				baseResponse['1H']['0'][starting_tactic].players[playerId] = {
					playerId,
					position: converters.playerRole(starting_position_name)
				};
			});

		// add 2H main lineup players
		player
			.filter(({ ending_lineup }) => ending_lineup === '1')
			.map(({ id: playerId, ending_position_name }) => {
				baseResponse['2H']['0'][ending_tactic].players[playerId] = {
					playerId,
					position: converters.playerRole(ending_position_name)
				};
			});
		return baseResponse;
	},
	// PLAYER
	/** convers Instat player height in wyscout's equivalent */
	height: height => (height == null ? null : Number(height)),
	/** convers Instat player weight in wyscout's equivalent */
	weight: weight => (weight == null ? null : Number(weight)),
	/** convers Instat foot value in wyscout's equivalent */
	foot: foot_name => String(foot_name).toLowerCase(),
	/** convers Instat role in wyscout's equivalent */
	playerRole: instatPlayerRoleName => {
		const { playerPositions } = wyscoutConfig;
		const position1_name =
			instatPlayerRoleName && typeof instatPlayerRoleName === 'object'
				? instatPlayerRoleName.position1_name
				: instatPlayerRoleName;
		switch (position1_name) {
			case 'Attacking midfielder - Central':
				return playerPositions.find(({ code2 }) => code2 === 'CAM');
			case 'Attacking midfielder - Left':
				return playerPositions.find(({ code2 }) => code2 === 'LAM');
			case 'Attacking midfielder - Right':
				return playerPositions.find(({ code2 }) => code2 === 'RAM');
			case 'Defender - Central':
				return playerPositions.find(({ code2 }) => code2 === 'CBC');
			case 'Defender - Left':
				return playerPositions.find(({ code2 }) => code2 === 'LB');
			case 'Defender - Left central':
				return playerPositions.find(({ code2 }) => code2 === 'CBL');
			case 'Defender - Right':
				return playerPositions.find(({ code2 }) => code2 === 'RB');
			case 'Defender - Right central':
				return playerPositions.find(({ code2 }) => code2 === 'CBR');
			case 'Defensive midfielder - Central':
				return playerPositions.find(({ code2 }) => code2 === 'DCM');
			case 'Defensive midfielder - Left central':
				return playerPositions.find(({ code2 }) => code2 === 'DLM');
			case 'Defensive midfielder - Right central':
				return playerPositions.find(({ code2 }) => code2 === 'DRM');
			case 'Forward - Central':
				return playerPositions.find(({ code2 }) => code2 === 'S');
			case 'Forward - Left central':
				return playerPositions.find(({ code2 }) => code2 === 'LF');
			case 'Forward - Right central':
				return playerPositions.find(({ code2 }) => code2 === 'RF');
			case 'Goalkeeper':
				return playerPositions.find(({ code2 }) => code2 === 'GK');
			case 'Midfielder - Left':
				return playerPositions.find(({ code2 }) => code2 === 'LW');
			case 'Midfielder - Left central':
				return playerPositions.find(({ code2 }) => code2 === 'LCM');
			case 'Midfielder - Right':
				return playerPositions.find(({ code2 }) => code2 === 'RW');
			case 'Midfielder - Right central':
				return playerPositions.find(({ code2 }) => code2 === 'RCM');
			// not found in wyscout
			case 'Substitute player':
				return {
					code2: 'SBP',
					label: 'Substitute'
				};
			default: {
				return { code2: '', label: '' };
			}
		}
	},
	/** convers Instat player info response in wyscout's equivalent */
	playerBasicInfoApiResponse: instatApiResponse =>
		parseApiResponseAndConvert(instatApiResponse, converters.playerBasicInfoObject),
	/** convers Instat player info object in wyscout's equivalent */
	playerBasicInfoObject: instatPlayer => {
		const {
			id: instId,
			birthday: birthDate,
			club_team_id,
			club_team_name: currentTeamName,
			country1_name,
			country2_name,
			national_team_id,
			firstname: firstName,
			foot_name,
			gender_name,
			height,
			lastname: lastName,
			position1_name,
			weight,
			photo: imageDataURL
		} = instatPlayer;
		return {
			instId: Number(instId),
			birthDate: moment(birthDate, 'YYYY-MM-DD').toDate(),
			currentNationalTeamId: Number(national_team_id),
			currentTeamId: Number(club_team_id),
			currentTeamName,
			firstName,
			foot: converters.foot(foot_name),
			gender: converters.gender(gender_name),
			height: converters.height(height),
			lastName,
			middleName: '',
			birthArea: converters.area(country1_name),
			passportArea: converters.area(country2_name || country1_name),
			role: converters.playerRole(position1_name),
			shortName: `${firstName} ${lastName}`,
			status: 'active',
			weight: converters.weight(weight),
			imageDataURL,
			country1_name,
			country2_name
		};
	},
	playerCareer: async instatPlayerData => {
		const { data = {} } = instatPlayerData;
		const { player = {} } = data;
		// eslint-disable-next-line prefer-const
		let { career = [], id } = player;
		const infoTeamCache = [];
		const seasonInfoCache = [];
		const competitionInfoCache = [];

		// if the available seasons are not all, limit in career
		career = career.filter(({ season_id }) => availableSeasonsIds.includes(season_id));

		return {
			career: await Promise.map(career, async item => {
				const { season_id: seasonId, tournament_id: competitionId, team_id: teamId } = toNumberProps(item);
				const playerId = Number(id);
				const seasonPlayerStatistics = await instatApi
					.getPlayerStatsAggregated(playerId, competitionId, seasonId)
					.then(converters.playerStatsAggregatedBySeason);
				// teams info
				const team =
					infoTeamCache.find(({ instId }) => instId === teamId) ||
					(await instatApi.getTeamBasicInfo(teamId).then(converters.teamBasicInfo));
				if (!infoTeamCache.includes(team)) infoTeamCache.push(team);
				// seasons info
				const season =
					seasonInfoCache.find(({ instId }) => instId === seasonId) ||
					(await instatApi.getSeasonsBasicInfo(seasonId).then(res => converters.seasonInfo(res, competitionId)));
				if (!seasonInfoCache.includes(season)) seasonInfoCache.push(season);
				// competition info
				const competition =
					competitionInfoCache.find(({ instId }) => instId === competitionId) ||
					(await instatApi.getTournamentBasicInfo(competitionId).then(converters.competitionBasicInfo));
				if (!competitionInfoCache.includes(competition)) competitionInfoCache.push(competition);

				return {
					playerId,
					seasonId,
					competitionId,
					teamId,
					team,
					season,
					competition,
					...seasonPlayerStatistics
				};
			})
		};
	},
	playerStatsAggregatedBySeason: (playerInstatResponse, shirtNumber) => {
		const { data = {} } = playerInstatResponse;
		const { row = [] } = data;
		const fields = ['goal', 'penalties', 'appearances', 'yellowCard', 'redCards', 'minutesPlayed'];
		const statistics = Object.fromEntries(
			fields.map(statName => [statName, getStatisticsAsNumbers(teamStatisticsIds[statName], row).total])
		);
		return {
			shirtNumber, // TODO provide shirtNumber
			...statistics
		};
	},
	playerMatchStats: playerInstatStats => {
		return Object.fromEntries(
			Object.entries(playerInstatStats)
				.filter(([key]) => Object.keys(playerStatisticsIds).includes(key))
				.map(([field]) => {
					const res = playerInstatStats.find(({ id }) => id === String(playerStatisticsIds[field]));
					const { value } = res || {};
					return [field, value == null ? 0 : Number(value)];
				})
		);
	},
	playerTacticalInfo:
		teamInstatId =>
		({
			instId: _id,
			shortName,
			firstName,
			middleName,
			lastName,
			height,
			weight,
			birthDate,
			currentTeamId,
			currentNationalTeamId
		}) => ({
			instId: _id,
			shortName,
			firstName,
			middleName,
			lastName,
			height,
			weight,
			birthDate,
			playerKey: 'instatId',
			instatSecondaryTeamId: teamInstatId === currentTeamId ? currentNationalTeamId : currentTeamId
		}),
	// TEAM
	teamType: type => type.toLowerCase(),
	infoTeamResponse: instatApiResponse => parseApiResponseAndConvert(instatApiResponse, converters.teamBasicInfo),
	teamBasicInfo: infoTeam => {
		const {
			id: instId,
			country_name,
			photo: imageDataURL = wyscout.getIterproAvatarBase64(),
			name,
			short_name,
			gender_name,
			type
		} = infoTeam;
		return {
			instId: Number(instId),
			name: short_name || name,
			officialName: name,
			imageDataURL,
			category: 'default',
			area: country_name ? converters.area(country_name) : null,
			gender: gender_name ? converters.gender(gender_name) : null,
			type: type ? converters.teamType(type) : 'club'
		};
	},
	teamStatistics: statistics => {
		const totalStatistics = {
			...Object.fromEntries(
				teamSeasonalDataTotalFields.map(statName => [
					statName,
					getStatisticsAsNumbers(teamStatisticsIds[statName], statistics).total
				])
			),
			// compound
			lateralPasses: combineTotal(statistics, 'passesToTheLeft180Degrees', 'passesToTheRight180Degrees'),
			successfulLateralPasses: combineTotal(
				statistics,
				'successfulPassesToTheLeft180Degrees',
				'successfulPassesToTheRight180Degrees'
			),
			verticalPasses: combineTotal(statistics, 'passesForward180Degrees', 'passesBack180Degrees'),
			successfulVerticalPasses: combineTotal(
				statistics,
				'passesForwardAccurate180Degrees',
				'passesBackAccurate180Degrees'
			),
			pressingDuelsWon: combineTotal(statistics, 'teamPressing', 'passesAccurateForwards')
		};
		const avgStatistics = Object.fromEntries(
			teamSeasonalDataAvgFields.map(statName => [
				statName,
				getStatisticsAsNumbers(teamStatisticsIds[statName], statistics).avg
			])
		);
		const percentStatistics = {
			...Object.fromEntries(
				teamSeasonalDataPercentFields.map(statName => [
					statName,
					getStatisticsAsNumbers(teamStatisticsPercentIds[statName], statistics).total
				])
			),
			// manualy calculated
			...Object.fromEntries(
				teamSeasonalDataPercManualFields.map(({ field: percentField, total: totalField }) => [
					percentField,
					getPercentage(statistics, totalField, percentField)
				])
			),
			goalConversion: getPercentage(statistics, 'shots', 'goals'),
			win: null
		};
		return {
			totalStatistics,
			avgStatistics,
			percentStatistics
		};
	},
	/** receives `getTeamStatsAggregated` (tpl 62) response */
	teamStatsForMatch: (instatResponse, teamId, matchId) => {
		let response = {
			teamId,
			total: {
				matches: 1
			},
			average: {},
			percent: {},
			matchId
		};
		if (instatResponse !== '') {
			// instat may returns '' if the stats are not available yet
			const { data = {} } = instatResponse;
			const { team = {} } = data;
			// const teamStatistics = team[String(teamId)] || [];
			const { param: teamStatistics = [] } = team.find(({ id }) => Number(id) === teamId) || {};

			const {
				totalStatistics,
				avgStatistics: average,
				percentStatistics: percent
			} = converters.teamStatistics(teamStatistics);

			response = {
				teamId,
				total: {
					matches: 1,
					...totalStatistics
				},
				average,
				percent,
				matchId
			};
		}

		return response;
	},
	secondaryTeamInfo: ({ data: { instId, currentTeamId, currentTeamName, currentNationalTeamId: nationalTeamId } }) => ({
		instId,
		currentTeamId,
		currentTeamName,
		nationalTeamId
	}),
	/** converts response with a single seasonId */
	seasonsInfoApiResponse: (apiResponse, competitionId) => {
		if (apiResponse.data && apiResponse.data.season && apiResponse.data.season.length) {
			const [instatSeason] = apiResponse.data.season;
			return converters.seasonInfo(instatSeason, competitionId);
		} else {
			return objectNotFoundError;
		}
	},
	seasonInfo: ({ id, name, date_from: startDate, date_to: endDate }, competitionId) => ({
		instId: Number(id),
		name,
		startDate,
		endDate,
		active: moment(endDate).isBefore(moment()),
		competitionId
	}),
	seasonStandingsApiResponse: apiResponse => parseApiResponseAndConvert(apiResponse, converters.seasonStandingTeam),
	seasonStandings: async (apiResponse, competitionId, seasonId) => {
		const { data = {} } = apiResponse;
		const { row = [] } = data;
		const teamCacheArray = [];
		const competitionResponse = await instatApi.getTournamentBasicInfo(competitionId);
		const competition = converters.competitionBasicInfo(competitionResponse);
		const teams = await Promise.map(row, async item => {
			const { team_id: teamId } = toNumberProps(item);

			let teamFullInfo = teamCacheArray.find(({ instId }) => instId === teamId);
			if (!teamFullInfo) {
				const response = await instatApi.getTeamBasicInfo(teamId);
				teamFullInfo = converters.teamBasicInfo(response.data.data.row[0]);
				teamCacheArray.push(teamFullInfo);
			}
			return {
				...converters.seasonStandingTeam(item),
				team: teamFullInfo
			};
		});
		return {
			competitionId,
			seasonId,
			competition,
			teams
		};
	},
	seasonStandingTeam: instatSeasonStandingTeam => {
		const {
			team_id: teamId,
			draw: totalDraws,
			lost: totalLosses,
			goals_for: totalGoalsFor,
			goals_against: totalGoalsAgainst,
			points: totalPoints,
			won: totalWins,
			total: totalPlayed
		} = pickNumericFields(instatSeasonStandingTeam);

		return {
			teamId,
			totalDraws,
			totalLosses,
			totalGoalsAgainst,
			totalGoalsFor,
			totalWins,
			totalPlayed,
			totalPoints
		};
	},
	matchWinner: instatMatch => {
		let winner = 0;
		if (!isNaN(Number(instatMatch.team1_score)) && !isNaN(Number(instatMatch.team2_score))) {
			winner =
				Number(instatMatch.team1_score) > Number(instatMatch.team2_score)
					? Number(instatMatch.team1_id)
					: Number(instatMatch.team2_id);
		}
		return winner;
	},
	getScore: instatMatch =>
		instatMatch.score ? instatMatch.score.split(':') : [instatMatch.team1_score, instatMatch.team2_score],
	scoutingMatch: instatMatch => {
		const date = converters.date(instatMatch.match_date);
		const score = converters.getScore(instatMatch);

		const result = score.join(' - ');

		const status = converters.matchStatus(instatMatch.status_id);
		let winner = 0;
		if (status !== 'Fixture' && score[0] !== score[1]) {
			winner = Number(score[0]) > Number(score[1]) ? instatMatch.team1_id : instatMatch.team2_id;
		}
		const label = instatMatch.match_name
			? `${instatMatch.match_name}`
			: `${instatMatch.team1_name} - ${instatMatch.team2_name}`;

		const parsed = {
			instId: Number(instatMatch.id),
			id: instatMatch.id, // to remove
			competition: instatMatch.tournament_name,
			competitionId: Number(instatMatch.tournament_id),
			date,
			dateutc: instatMatch.match_date,
			duration: instatMatch.duration,
			gameweek: Number(instatMatch.round_id),
			hasDataAvailable: instatMatch.available_events === 'true',
			label: `${label}, ${result}`,
			result,
			referees: [],
			roundId: Number(instatMatch.round_id),
			seasonId: Number(instatMatch.season_id),
			status,
			teamsData: null,
			venue: instatMatch.stadium_name,
			winner: Number(winner),
			thirdPartyProviderHomeTeamId: Number(instatMatch.team1_id),
			thirdPartyProviderAwayTeamId: Number(instatMatch.team2_id),
			homeTeam: instatMatch.team1_name,
			awayTeam: instatMatch.team2_name
		};
		return parsed;
	}
});

const objectNotFoundError = {
	error: {
		code: 404,
		message: 'Not Found: Object not found'
	}
};

/** Check for data.row field inside the response and converts each element using the `provided` function */
const parseApiResponseAndConvert = (instatApiResponse, converter) => {
	const { data } = instatApiResponse;
	if (data && data.row && data.row.lenght > 0) {
		return converter(data.row[0]);
	} else {
		return objectNotFoundError;
	}
};

/** returns a copy of the object with all numeric properties */
const pickNumericFields = src =>
	Object.fromEntries(
		Object.entries(src)
			.filter(([, value]) => !isNaN(Number(value)))
			.map(([key, value]) => [key, Number(value)])
	);

const getStatisticsAsNumbers = (instatStatisticId, statistics) => {
	// introducing support for team statistics and player statistics different formats
	const result = statistics.find(
		stat => String(stat.param_id) === String(instatStatisticId) || String(stat.id) === String(instatStatisticId)
	);
	const {
		value,
		value_sum: total,
		value_avg: avg
	} = result
		? { value: Number(result.value), value_sum: Number(result.value), value_avg: Number(result.value) }
		: { value: 0, value_sum: 0, value_avg: 0 };
	return {
		total: total || value,
		avg
	};
};
/** sums the total value of two or more Instat metrics */
const combineTotal = (statistics, ...wyscoutFields) =>
	wyscoutFields.reduce((acc, val) => acc + getStatisticsAsNumbers(teamStatisticsIds[val], statistics).total, 0);

/** create percentage using the first kpi as total and the second as quantity */
const getPercentage = (statistics, totalField, quantityField) => {
	const { total = 0 } = getStatisticsAsNumbers(teamStatisticsIds[totalField], statistics);
	const { total: quantity = 0 } = getStatisticsAsNumbers(teamStatisticsIds[quantityField], statistics);
	return total === 0 ? 0 : parseFloat(((total / 100) * quantity).toFixed(2));
};

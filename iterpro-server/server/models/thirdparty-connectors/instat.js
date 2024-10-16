const moment = require('moment');
const { countBy, sortBy, uniqBy, max } = require('lodash');
const { v4: uuid } = require('uuid');
const Promise = require('bluebird');
const {
	concurrency,
	playerStatisticsIds,
	availableSeasonsIds,
	startDateLimit,
	endDateLimit,
	actionIds
} = require('../../../config/instat.config.json');
const wyscout = require('./wyscout');
const instatApi = require('./instatApi');
const instatCompetitions = require('../../../config/instatCompetitions.json');
const instatFormatConverters = require('./instatFormatConverters');
const { UnprocessableEntityError, InternalError, ForbiddenError } = require('../../../common/modules/error');
const { addElements, containsElements, notEmptyPredicate } = require('../../../utils/array');
const stringUtils = require('../../../utils/string');
const { getIterproAvatarBase64 } = wyscout;
const { areas: wyscoutAreas } = require('../../../config/wyscoutAreas.json');
const asyncRedis = require('async-redis');
const CACHE_TTL = 43200;

/**
 * Instat API client and specifications.
 *
 * DEV SPECIFICATIONS
 *
 * id (clientId) is your personal id in API
 * key is your personal key to API
 * tpl=32 stands for the template of data delivery
 * season_id=24 stands for season 19/20
 * tournament_id=78 Swiss Super League
 * Date is in the format of YYYY-MM-DD
 * Queries are limited to the period of 2019-08-01 to 2020-08-05
 * lang_id=1 delivers data in English
 * Format may be =xml, =json, =csv or =tsv
 */

const instatWrappedApi = (module.exports = {
	getStandingsLeaderboard: async function (tournamentId, seasonId) {
		try {
			const [
				{ data: standingsResponse, error: standingsError },
				{ data: competitionResponse, error: competitionError }
			] = await Promise.all([
				instatApi.getStandings(tournamentId, seasonId),
				instatApi.getTournamentBasicInfo(tournamentId)
			]);
			if (standingsError) throw standingsError;
			if (competitionError) throw competitionError;
			return {
				competition: competitionResponse.data.tournament[0],
				teams: await Promise.all(standingsResponse.data.row.map(team => wrapLeaderboardTeam(team)))
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	},
	getStandingsMatchList: async function (teamId, tournamentId, seasonId) {
		try {
			const { data: resultMatchesResponse, error } = await instatApi.getMatches(null, seasonId, teamId, null, null);
			if (error) throw error;
			const matches = await Promise.all(
				resultMatchesResponse.data.row
					.filter(({ tournament_id }) => String(tournament_id) === String(tournamentId))
					.map(match => wrapMatchForStandingsList(match, teamId))
			);
			return sortBy(matches, 'gameweek');
		} catch (e) {
			console.error(e);
			throw e;
		}
	},
	getStandingsMatchStats: async function (matchId) {
		try {
			const [
				{ data: matchResponse, error: matchError },
				{ data: statsResponse, error: statsError },
				{ data: eventsResponse, error: eventsError }
			] = await Promise.all([
				instatApi.getMatchInfo(matchId),
				instatApi.getMatchTeamStats(matchId),
				instatApi.getMarkers(matchId)
			]);
			if (matchError) throw matchError;
			if (statsError) throw statsError;
			if (eventsError) throw eventsError;
			return await wrapMatchForStatsDetails(matchResponse.data.match_info[0], statsResponse, eventsResponse.data.row);
		} catch (e) {
			console.error(e);
			return { home: null, away: null };
		}
	},

	getPlayers: async function (team, currentSeason, players, req) {
		try {
			if (!currentSeason) throw UnprocessableEntityError('Current season undefined!');
			let competitionsToSearch = [];
			const teamInstatId = process.env.INSTAT_CLIENTID; // TODO check

			if (containsElements(currentSeason.competitionInfo)) {
				competitionsToSearch = addElements(
					competitionsToSearch,
					currentSeason.competitionInfo.filter(notEmptyPredicate).map(({ competition }) => competition)
				);
			}
			const { instatNationalLeague, instatNationalCup, instatTournamentQualifiers, instatTournamentFinalStages } =
				currentSeason;
			competitionsToSearch = addElements(
				competitionsToSearch,
				instatNationalLeague,
				instatNationalCup,
				instatTournamentQualifiers,
				instatTournamentFinalStages
			);
			const filteredCompetitionsToSearchPlayers = competitionsToSearch.map(competition =>
				instatWrappedApi.getCompetitionPlayers(competition, req)
			);

			const teamToSearch = instatCompetitions.teams.map(({ instatId }) =>
				instatWrappedApi.getSquadSeasonPlayers(instatId)
			);

			const players$ = [...teamToSearch, ...filteredCompetitionsToSearchPlayers];
			const playersFromAPI = await Promise.all(players$).then(players => uniqBy(players.flat(), 'instId'));
			const ids = playersFromAPI.map(({ instId }) => instId);
			const myPlayers = players
				.filter(({ instatId }) => !ids.includes(instatId))
				.map(instatFormatConverters.playerBasicInfoObject);
			const responsePlayers = [...playersFromAPI, ...myPlayers].map(
				instatFormatConverters.playerTacticalInfo(teamInstatId)
			);
			return sortBy(responsePlayers, el => el.shortName);
		} catch (error) {
			console.error(`[INSTAT] ERROR while retrieving players for team ${team.id}`);
			throw error;
		}
	},
	/** not callable, since the career api is not available */
	getPlayerCareer: async playerId => {
		const playerInstatResponse = await instatApi.getPlayerCareer(playerId);
		return instatFormatConverters.playerCareer(playerInstatResponse);
	},
	getIterproAvatarBase64,
	/** clones wyscout `dashboard` response with instat data */
	dashboardAPI: async (_teamId, instatTeamId, instatCompetitionId, instatSeasonId, dateStart, dateEnd) => {
		const response = {};
		const resultMatchesResponse = await instatApi.getMatches(
			instatCompetitionId,
			instatSeasonId,
			instatTeamId,
			dateStart,
			dateEnd
		);
		// eslint-disable-next-line prefer-const
		let { data: resultMatches, error: resultMatchesError } = resultMatchesResponse;
		if (resultMatchesError) throw new InternalError(resultMatchesError, 'Instat API');
		const {
			data: { row: rawMatches }
		} = resultMatches;
		resultMatches = await Promise.map(
			rawMatches,
			match => instatWrappedApi.getSingleMatch(Number(match.id), Number(match.tournament_id), Number(match.season_id)),
			{ concurrency: 2 }
		);
		// season standings
		const { data: rawResultStandingsResponse, error: resultStandingsError } = await instatApi.getStandings(
			instatCompetitionId,
			instatSeasonId
		);
		if (resultStandingsError) throw new InternalError(resultStandingsError, 'Instat API');
		const resultStandings = await instatFormatConverters.seasonStandings(
			rawResultStandingsResponse,
			instatCompetitionId,
			instatSeasonId
		);
		const allTeams = [];
		if (resultStandings && resultStandings.teams && resultStandings.teams.length) {
			// const filteredStandingTeams = resultStandings.teams.filter(({ groupName }) => groupName === '');
			// if (filteredStandingTeams.length > 0) {
			// 	resultStandings.teams = filteredStandingTeams;
			// }
			const promiseArray = (resultStandings.teams || [])
				.filter(({ team }) => team)
				.map(({ teamId }) => instatWrappedApi.getTeamWithImage(teamId).then(({ data }) => data));
			const res = await Promise.all(promiseArray);

			for (const stand of resultStandings.teams) {
				if (stand.team) {
					const img = res.find(({ instId }) => instId === stand.teamId);
					stand.team.imageDataURL = img && img.imageDataURL ? img.imageDataURL : null;
					allTeams.push(stand.team);
				} else {
					stand.team = {
						instId: Number(stand.teamId),
						name: stand.teamId,
						imageDataURL: instatWrappedApi.getIterproAvatarBase64()
					};
					allTeams.push(stand.team);
				}
			}
		}
		resultMatches = resultMatches.filter(
			matchObject =>
				matchObject && matchObject.teamsData && Object.keys(matchObject.teamsData).map(Number).includes(instatTeamId)
		);
		for (const singleMatch of resultMatches) {
			singleMatch.matchId = Number(singleMatch.matchId);
			singleMatch.instId = singleMatch.matchId;
			if (singleMatch.match) {
				// copy those properties inside singleMatch.match
				['label', 'date', 'dateutc', 'status', 'duration'].map(key => (singleMatch[key] = singleMatch.match[key]));
				// copy those properties inside singleMatch.match and cast them as Number
				['winner', 'competitionId', 'seasonId', 'roundId', 'gameweek'].map(
					key => (singleMatch[key] = Number(singleMatch.match[key]))
				);
				if (singleMatch.match.teamsData) {
					const teamsIds = Object.keys(singleMatch.match.teamsData);
					if (teamsIds && teamsIds.length > 1) {
						const [team1, team2] = teamsIds;
						singleMatch.team1 = Number(team1);
						singleMatch.team2 = Number(team2);
					}
				}
				singleMatch.matchInfo = singleMatch.match;
				delete singleMatch.match;
			}
		}
		// get last match played (example format: 2018-05-20 18:00:00)
		const playedMatches = resultMatches.filter(({ status }) => status === 'Played');
		playedMatches.sort(
			({ date: d1Date }, { date: d2Date }) =>
				moment(d2Date, 'YYYY-MM-DD HH:mm:ss').toDate().getTime() -
				moment(d1Date, 'YYYY-MM-DD HH:mm:ss').toDate().getTime()
		);
		const [firstMatch] = playedMatches;
		if (firstMatch) {
			response.firstTeamStats = [null, null];
			response.firstMatch = firstMatch;
		}
		return {
			...response,
			leaderboard: resultStandings,
			teams: allTeams,
			competition: resultStandings.competition,
			matches: resultMatches
		};
	},
	dashboardSingleTeamStatAPI: async function (instatMatchId, instatTeamId1, instatTeamId2) {
		try {
			const response = {
				teamStats: []
			};
			// const match = await instatWrappedApi.getSingleMatch(instatMatchId);
			const results = await Promise.all([
				instatWrappedApi.getTeamStatsForMatch(instatTeamId1, instatMatchId),
				instatWrappedApi.getTeamStatsForMatch(instatTeamId2, instatMatchId)
			]);
			for (const stats of results) {
				if (stats) response.teamStats.push({ ...stats, matchId: Number(instatMatchId) });
				else console.warn('No data for match %s', instatMatchId);
			}
			return response;
		} catch (e) {
			console.error(e);
			throw e;
		}
	},

	getStatPlayers: async function (matchId) {
		const [matchInfoResponse, matchLineUpResponse, statPlayersResponse] = await Promise.all([
			instatApi.getMatchInfo(matchId),
			instatApi.getMatchLineups(matchId),
			instatApi.getStatPlayers(matchId)
		]);
		const { data: matchInfo, error: matchInfoError } = matchInfoResponse;
		const { data: matchLineup, error: matchLineupError } = matchLineUpResponse;
		const { data: playerStats, error: playerStatsError } = statPlayersResponse;
		// log Instat API Errors
		if (!matchInfo) {
			console.warn(`No info for match ${matchId} (reason: ${String(matchInfoError)})`);
		}
		if (!playerStats) {
			console.warn(`No stats for players at match ${matchId} (reason: ${String(playerStatsError)})`);
		}
		if (!matchLineup) {
			console.warn(`No lineup info for match ${matchId} (reason: ${String(matchLineupError)})`);
		}

		const score = instatFormatConverters.getScore(matchInfo.data.match_info[0]);

		const info = instatFormatConverters.scoutingMatch(matchInfo.data.match_info[0]);

		const teamLineUps =
			matchLineup && matchLineup.data ? [matchLineup.data.first_team[0], matchLineup.data.second_team[0]] : [];

		info.hasDataAvailable =
			!!playerStats && !!playerStats.data && playerStats.data.team.some(({ player }) => player.length > 0);
		//  playerStats.data.team
		const teamDataArray = [info.thirdPartyProviderHomeTeamId, info.thirdPartyProviderAwayTeamId].map(
			(teamId, index) => {
				const team = info.hasDataAvailable
					? playerStats.data.team.find(({ id }) => id === String(teamId)) || { player: [] }
					: { player: [] };
				const teamData = index < teamLineUps.length ? teamLineUps[index] : undefined;
				const teamPlayers = teamData ? teamData.lineup[0].main[0].player : [];

				let formation = null;
				if (teamPlayers.length > 0 && team.player.length > 0) {
					const lineup = teamPlayers.filter(({ starting_lineup }) => starting_lineup === '1');
					const bench = teamPlayers.filter(
						({ starting_lineup, ending_lineup }) => starting_lineup === '0' && ending_lineup === '1'
					);
					const substitutions = bench.map(player => {
						const playerIn = Number(player.id);
						const playerOut = lineup.find(
							({ ending_position_id }) => ending_position_id === player.starting_position_id
						);
						return { minute: null, playerIn, playerOut: playerOut ? Number(playerOut.id) : null };
					});

					formation = {
						lineup: instatWrappedApi.extractTeamFormationStats(lineup, team.player, playerStatisticsIds),
						bench: instatWrappedApi.extractTeamFormationStats(bench, team.player, playerStatisticsIds),
						substitutions
					};
				}

				const data = {
					coachId: !!teamData && !!teamData.coach[0] && teamData.coach[0].id ? teamData.coach[0].id : null,
					teamName: index === 0 ? info.homeTeam : info.awayTeam,
					hasFormation: formation ? 1 : 0,
					formation,
					side: index === 0 ? 'home' : 'away',
					score: index < score.length ? Number(score[index]) : null,
					teamId,
					imageDataURL: null
				};

				return { [teamId]: data };
			}
		);
		info.teamsData = teamDataArray.reduce((accumulator, element) => ({ ...accumulator, ...element }), {});

		return info;
	},

	extractStatsData: (playerStats, dictionary) => {
		return Object.keys(dictionary).reduce((accumulator, key) => {
			const metric = playerStats.param.find(metric => metric.id === String(dictionary[key]));
			return {
				...accumulator,
				[key]: metric ? Number((metric.value - 0).toFixed()) : '0'
			};
		}, {});
	},
	extractPlayerStats: (players, data, dictionary) => {
		return players.map(player => {
			const playerId = Number(player.id || player.playerId);
			const playerStats = data.find(({ id }) => String(id) === String(playerId));
			const stats = instatWrappedApi.extractStatsData(playerStats, dictionary);
			return {
				playerId,
				playerName: player.playerName ? player.playerName : `${player.firstname} ${player.lastname}`,
				...stats,
				yellowCard: stats.yellowCards === 1,
				doubleYellowCard: stats.yellowCards > 1,
				redCard: stats.redCards > 0
			};
		});
	},
	extractTeamFormationStats: (players, data, dictionary) => {
		return players.map(instatPlayer => {
			const playerId = Number(instatPlayer.id || instatPlayer.playerId);
			const playerStats = data.find(({ id }) => String(id) === String(playerId));
			const stats = instatWrappedApi.extractStatsData(playerStats, dictionary);
			return {
				instId: Number(playerId),
				playerId,
				player: {
					...instatPlayer,
					instId: Number(playerId),
					shortName: instatPlayer.playerName
						? instatPlayer.playerName
						: `${instatPlayer.firstname} ${instatPlayer.lastname}`,
					role: instatFormatConverters.playerRole(instatPlayer.starting_position_name),
					birthDate: instatPlayer.birthday,
					birthArea: { alpha2code: instatPlayer.country1_name },
					passport: instatPlayer.country2_name ? instatPlayer.country2_name : null,
					img: '',
					transferValue: null,
					foot: null,
					gender: null,
					height: null,
					weight: null
				},
				shirtNumber: instatPlayer.num || playerStats.number,
				...stats
			};
		});
	},

	getSingleMatch: async function (matchId, tournamentId, seasonId, details = []) {
		try {
			if (!seasonId && availableSeasonsIds.length > 0) [seasonId] = availableSeasonsIds;
			const { data: matchBasicInfo, error: matchInfoError } = await instatApi.getMatchInfo(matchId);
			if (matchBasicInfo.data && matchBasicInfo.data.match_info && matchBasicInfo.data.match_info.length) {
				tournamentId = matchBasicInfo.data.match_info[0].tournament_id || tournamentId;
				seasonId = matchBasicInfo.data.match_info[0].season_id || seasonId;
			} else {
				console.warn(`No info for match ${matchId} (reason: ${String(matchInfoError)})`);
			}
			const [
				{
					data: { data: fixturesData }
				},
				{ data: matchLineupResponse, error: matchLineupError },
				{ data: playerStats, error: playerStatsError }
			] = await Promise.all([
				instatApi.getMatches(Number(tournamentId), Number(seasonId)),
				instatApi.getMatchLineups(matchId),
				instatApi.getStatPlayers(matchId)
			]);
			const fixtures = fixturesData && fixturesData.row ? fixturesData.row : fixturesData;
			const match = fixtures.find(({ id: match_id }) => String(match_id) === String(matchId));
			const {
				round_id,
				tournament_id: competitionId,
				match_name,
				match_date: dateutc,
				team1_score,
				team1_id,
				team2_score,
				team2_id
			} = match || matchBasicInfo.data.match_info[0];
			const roundId = isNaN(Number(round_id)) ? Number(round_id) : null;
			// log Instat API Errors
			if (!playerStats) {
				console.warn(`No stats for match ${matchId} (reason: ${String(playerStatsError)})`);
			}
			if (!matchLineupResponse) {
				console.warn(`No lineup info for match ${matchId} (reason: ${String(matchLineupError)})`);
			}
			const { data: matchLineup } = matchLineupResponse;
			const stats = playerStats && playerStats.data.team ? playerStats.data.team : playerStats;
			const [matchInfo] = matchBasicInfo ? matchBasicInfo.data.match_info : [null];
			const [team1Score, team2Score] = matchInfo && matchInfo.score ? String(matchInfo.score).split(':') : [null, null];
			const teamsData = {
				[String(team1_id)]: {
					teamId: Number(team1_id),
					score: null,
					hasFormation: null,
					formation: {
						lineup: null
					}
				},
				[String(team2_id)]: {
					teamId: Number(team2_id),
					score: null,
					hasFormation: null,
					formation: {
						lineup: null
					},
					side: null
				}
			};
			if (matchLineup) {
				const { team1Lineup, team2Lineup, team1StartTactic, team2StartTactic } =
					instatFormatConverters.matchLineup(matchLineup);
				const team1PlayersStats = stats.find(({ id }) => id === team1_id);
				const team2PlayersStats = stats.find(({ id }) => id === team2_id);
				if (team1Lineup && Array.isArray(team1Lineup) && team1PlayersStats && team1PlayersStats.player) {
					const { player: team1PlayerStats = [] } = team1PlayersStats;
					const { team1_id: teamId } = match;
					teamsData[String(teamId)] = {
						teamId,
						side: 'home',
						score: team1Score,
						hasFormation: team1Lineup.length && team1StartTactic ? 1 : 0,
						formation: {
							lineup: await Promise.map(
								team1Lineup,
								player =>
									instatWrappedApi.mapInstatMatchInfoSinglePlayerData(
										player,
										team1PlayerStats.find(({ id }) => id === player.id),
										details
									),
								{ concurrency: 2 }
							)
						}
					};
				} else {
					console.debug(`Unable to find player statistics for team ${team1_id}`);
					teamsData[team1_id] = null;
				}
				if (team2Lineup && Array.isArray(team2Lineup) && team2PlayersStats && team2PlayersStats.player) {
					const { player: team2PlayerStats = [] } = team2PlayersStats;
					const { team2_id: teamId } = match;
					teamsData[teamId] = {
						teamId,
						side: 'away',
						score: team2Score,
						hasFormation: team2Lineup.length > 0 && team2StartTactic != null ? 1 : 0,
						formation: {
							lineup: await Promise.map(team2Lineup, player =>
								instatWrappedApi.mapInstatMatchInfoSinglePlayerData(
									player,
									team2PlayerStats.find(({ id }) => id === player.id),
									details
								)
							)
						}
					};
				} else {
					console.debug(`Unable to find player statistics for team ${team2_id}`);
					teamsData[team2_id] = null;
				}
			}
			const status = instatFormatConverters.matchStatus(match || matchBasicInfo.data.match_info[0]);
			const date = instatFormatConverters.date(dateutc);
			const label = `${match_name}, ${team1Score} - ${team2Score}`;
			const winner = status !== 'Fixture' ? (team1_score > team2_score ? team1_id : team2_id) : 0;
			const { duration } = matchInfo ? matchInfo : { duration: null };
			return {
				matchId: Number(matchId),
				date,
				dateutc,
				label,
				status,
				roundId,
				competitionId,
				teamsData,
				match: {
					matchId: Number(matchId),
					seasonId,
					winner,
					competitionId,
					roundId,
					duration,
					status,
					date,
					label,
					dateutc: dateutc,
					teamsData
				}
			};
		} catch (error) {
			return error;
		}
	},
	singleTeamStatAPI: async function (instatMatchId) {
		let response;
		try {
			response = await instatWrappedApi.getSingleMatch(instatMatchId);
			const teamsInstIds = Object.keys(response.teamsData);
			const promiseArray = teamsInstIds.map(instId =>
				instatWrappedApi.getTeamWithImage(instId).then(({ data }) => data)
			);
			const images = await Promise.all(promiseArray);
			teamsInstIds.forEach(instId => {
				const image = images.find(img => img.instId === Number(instId));
				if (image && image.imageDataURL) {
					response.teamsData[instId].imageDataURL = image.imageDataURL;
				}
			});
		} catch (e) {
			console.error('[instatWrappedApi.singleTeamStat] Failed request singleTeamStat');
		}
		return response;
	},
	getMatchesForSeasonWrapper: async (seasonId, competitionId) => {
		if (!seasonId && availableSeasonsIds.length > 0) [seasonId] = availableSeasonsIds;
		const response = await instatApi.getMatches(competitionId, seasonId);
		let { data: fixturesData } = response;
		const { error } = response;
		if (fixturesData && fixturesData.row) {
			fixturesData = fixturesData.row;
		} else {
			return {
				data: null,
				error
			};
		}
		const matches = await Promise.map(
			fixturesData,
			async match => {
				const {
					id: matchId,
					round_id,
					tournament_id: competitionId,
					match_name,
					match_date: dateutc,
					status_id,
					team1_id,
					team2_id
				} = match;
				const roundId = isNaN(Number(round_id)) ? null : Number(round_id);
				let [
					// eslint-disable-next-line prefer-const
					{ data: matchInfo, error: matchInfoError },
					// eslint-disable-next-line prefer-const
					{ data: matchLineup, error: matchLineupError },
					// eslint-disable-next-line prefer-const
					{ data: playerStats, error: playerStatsError }
				] = await Promise.all([
					instatApi.getMatchInfo(matchId),
					instatApi.getMatchLineups(matchId),
					instatApi.getStatPlayers(matchId)
				]);
				// log Instat API Errors
				if (!playerStats) console.warn(`No stats for match ${matchId} (reason: ${String(playerStatsError)})`);
				if (!matchInfo) console.warn(`No info for match ${matchId} (reason: ${String(matchInfoError)})`);
				if (!matchLineupError)
					console.warn(`No lineup info for match ${matchId} (reason: ${String(matchLineupError)})`);
				// Extracting only useful data for playerStats from Instat structure...
				if (playerStats && playerStats.team) playerStats = playerStats.team;
				if (matchInfo) [matchInfo] = matchInfo.match_info;
				let team1Score = null;
				let team2Score = null;
				if (matchInfo && matchInfo.score) {
					[team1Score, team2Score] = String(matchInfo.score).split(':');
				}
				const teamsData = {};
				if (matchLineup) {
					const { team1Lineup, team2Lineup, team1StartTactic, team2StartTactic } =
						instatFormatConverters.matchLineup(matchLineup);
					const { player: team1PlayerStats = [] } = playerStats.find(({ id }) => id === team1_id);
					const { player: team2PlayerStats = [] } = playerStats.find(({ id }) => id === team2_id);
					if (team1Lineup && Array.isArray(team1Lineup)) {
						const { team1_id: teamId } = match;
						teamsData[String(teamId)] = {
							teamId,
							side: 'home',
							score: team1Score,
							hasFormation: team1Lineup.length && team1StartTactic ? 1 : 0,
							formation: {
								lineup: await Promise.map(
									team1Lineup,
									player =>
										instatWrappedApi.mapInstatMatchInfoSinglePlayerData(
											player,
											team1PlayerStats.find(({ id }) => id === player.id)
										),
									{ concurrency: 2 }
								)
							}
						};
					}
					if (team2Lineup && Array.isArray(team2Lineup)) {
						const { team2_id: teamId } = match;
						teamsData[teamId] = {
							teamId,
							side: 'away',
							score: team2Score,
							hasFormation: team2Lineup.length > 0 && team2StartTactic != null ? 1 : 0,
							formation: {
								lineup: await Promise.map(
									team2Lineup,
									player =>
										instatWrappedApi.mapInstatMatchInfoSinglePlayerData(
											player,
											team2PlayerStats.find(({ id }) => id === player.id)
										),
									{ concurrency: 2 }
								)
							}
						};
					}
				}
				const status = instatFormatConverters.matchStatus(status_id);
				const date = instatFormatConverters.date(dateutc);
				const label = `${match_name}, ${team1Score} - ${team2Score}`;
				const winner = instatFormatConverters.winner(match);
				const { duration } = matchInfo ? matchInfo : { duration: null };
				return {
					matchId: Number(matchId),
					date,
					dateutc,
					label,
					status,
					roundId,
					competitionId,
					teamsData,
					match: {
						matchId: Number(matchId),
						seasonId,
						winner,
						competitionId,
						roundId,
						duration,
						status,
						date,
						label,
						dateutc: dateutc,
						teamsData
					}
				};
			},
			{ concurrency }
		);
		return {
			data: {
				matches
			},
			error: null
		};
	},
	getMatchesForSeason: async (seasonId, tournament_id) => {
		if (!seasonId && availableSeasonsIds.length > 0) [seasonId] = availableSeasonsIds;
		return await instatWrappedApi.getMatchesForSeasonWrapper(seasonId, tournament_id);
	},
	getTeamWithImage: async instatTeamId => {
		const { data, error } = await instatApi.getTeamBasicInfo(instatTeamId);
		if (data && data.data && data.data.row && data.data.row.length > 0) {
			const [{ id: instId, short_name: name, name: officialName, team_type_id, gender_id, photo: imageDataURL }] =
				data.data.row;
			const infoTeam = {
				instId: Number(instId),
				name,
				officialName,
				type: Number(team_type_id) === 1 ? 'club' : '-',
				category: 'default',
				gender: Number(gender_id) === 1 ? 'male' : 'female',
				imageDataURL
			};
			return {
				data: infoTeam
			};
		} else {
			return {
				data: null,
				error
			};
		}
	},
	singleTeamStatWithPlayersAPI: async function (instatMatchId) {
		let response;
		try {
			response = await instatWrappedApi.getSingleMatchWithPlayers(instatMatchId);
			const teamsInstIds = Object.keys(response.teamsData);
			const promiseArray = teamsInstIds.map(instId =>
				instatWrappedApi.getTeamWithImage(instId).then(({ data }) => data)
			);
			const teams = await Promise.all(promiseArray);
			let team;
			teamsInstIds.forEach(id => {
				team = teams.find(({ instId }) => instId === Number(id));
				if (team && team.imageDataURL) {
					response.teamsData[id].imageDataURL = team.imageDataURL;
				}
			});
		} catch (error) {
			console.error('[instatWrappedApi.singleTeamStatWithPlayers] Failed request singleTeamStatWithPlayers');
			return null;
		}
		return response;
	},
	getSingleMatchWithPlayers: async (instatMatchId, competitionId, seasonId) => {
		try {
			const response = await instatWrappedApi.getStatPlayers(instatMatchId);
			if (!response) {
				throw 'Received empty data';
			}
			return response;
		} catch (error) {
			return error;
		}
	},
	mapInstatMatchInfoSinglePlayerData: async (player, stats, details = []) => {
		const { id: playerId, num: shirtNumber } = player;
		if (!stats || !stats.param) {
			console.warn(`Statistics not found for player ${playerId}`);
		}
		const { param: instatStats = null } = stats;
		const output = {
			playerId: Number(playerId),
			shirtNumber: Number(shirtNumber)
		};
		await Promise.all(
			[...Object.keys(playerStatisticsIds), 'ownGoals'].map(async field => {
				if (instatStats == null) return null;
				const res = instatStats.find(({ id }) => id === String(playerStatisticsIds[field]));
				const { value = 0 } = res || {};
				output[field] = Number(value);
				// if player details are requested, fetch them now
				if (details.includes('player')) {
					output['player'] = await instatApi
						.getPlayerBasicInfo(playerId)
						.then(playerInfo => instatFormatConverters.playerBasicInfoApiResponse(playerInfo));
				}
			})
		);
		return output;
	},
	getTeamStatsForMatch: async (teamInstId, matchId) => {
		try {
			const { data: response, error } = await instatApi.getMatchTeamStats(matchId);
			if (!response || !response.data || error) throw error || 'Received empty data';
			// convert to wyscout's format
			const convertedResponse = instatFormatConverters.teamStatsForMatch(response, teamInstId, matchId);
			return convertedResponse;
		} catch (error) {
			console.error('[instat.getTeamStatsForMatch]', error);
			return error;
		}
	},
	getTeamStatsForMatchSeasonalData: async function (teamInstId, competitionInstId, seasonId, matchId) {
		if (!seasonId && availableSeasonsIds.length > 0) [seasonId] = availableSeasonsIds;
		try {
			const data = await instatWrappedApi
				.getTeamStatsForMatch(teamInstId, competitionInstId, seasonId, matchId)
				.then(({ data }) => data)
				.catch(error => {
					console.error(error);
					return null;
				});
			if (!data) throw 'Received empty data';
			return data;
		} catch (error) {
			console.error('[instat.getTeamStatsForMatch]', error);
			return error;
		}
	},
	getPlayerTransfers: async function () {
		return {};
	},
	getPlayerActiveTransfer: async function (instatId) {
		try {
			const response = await instatWrappedApi.getPlayerTransfers(instatId);
			let transferData = null;
			if (response && response.transfer && response.transfer.length > 0) {
				transferData = response.transfer.find(
					({ active, endDate }) => active === true || active === 1 || endDate === '0000-00-00'
				);
			}
			return transferData;
		} catch (error) {
			return error;
		}
	},
	getTeamData: async function (teamId) {
		try {
			const { data, error } = await instatWrappedApi.getTeamWithImage(teamId);
			if (data) {
				const { instId, name, officialName, type, category, gender } = data;
				return {
					instId,
					name,
					officialName,
					type,
					category,
					gender,
					area: wyscoutAreas.find(({ name }) => name === 'Switzerland')
				};
			} else {
				return {
					data: null,
					error
				};
			}
		} catch (error) {
			return error;
		}
	},
	playerSearchFiltersAPI: async function () {
		const rawCompetitionData = await Promise.map(
			instatCompetitions.competitions,
			({ instatId }) => instatApi.getTournamentBasicInfo(instatId),
			{ concurrency }
		);
		const competitionData = rawCompetitionData
			.map(rawCompetitionData => {
				if (rawCompetitionData.data && rawCompetitionData.data.tournament) {
					return instatFormatConverters.competitionBasicInfo(rawCompetitionData);
				} else {
					return null;
				}
			})
			.filter(data => !!data);
		return { competitions: competitionData.sort(), positions: ['FW', 'MD', 'DF', 'GK'] };
	},
	playerSearchAdditionalInfoAPI: async function (playerInstatIds) {
		return ForbiddenError('Your current Instat plan does not provide this functionality. Contact your support.');
	},
	getPlayerImage: async instatPlayerId => {
		const {
			data: { data },
			error
		} = await instatApi.getPlayerBasicInfo(instatPlayerId);

		const { photo } = data && data.row.length > 0 ? data.row[0] : { photo: null };
		return {
			data: photo,
			error
		};
	},
	seasonsForCompetitions: async (_teamId, competitionsIds, date) => {
		try {
			return await Promise.all(
				competitionsIds.map(async competitionId => {
					competitionId = competitionId - 0; // if is a string convert to number
					// custom competitions "Other Teams"
					if (competitionId < 0) {
						return {
							compId: competitionId,
							seasons: [
								{ id: availableSeasonsIds[0], name: '2021-2022', startDate: startDateLimit, endDate: endDateLimit }
							]
						};
					}

					const [
						{ data: availableSeasons, error: availableSeasonError },
						{ data: allSeasons, error: allSeasonsError }
					] = await Promise.all([
						instatApi.getTournamentInfo(competitionId),
						instatApi.getSeasonsOfTournament(competitionId)
					]);
					if (allSeasonsError) throw allSeasonsError;
					if (availableSeasonError) throw availableSeasonError;
					if (allSeasons && allSeasons.data) {
						const seasonsForComp = allSeasons.data.season.filter(({ id }) =>
							availableSeasons.data.season.map(season => season.id).includes(Number(id))
						);
						return {
							compId: competitionId,
							seasons: seasonsForComp
								.filter(
									({ date_from, date_to }) =>
										!date || moment(date).isBetween(moment(date_from), moment(date_to), 'days', '[]')
								)
								.map(season => ({
									...season,
									id: Number(season.id),
									startDate: season.date_from,
									endDate: season.date_to
								}))
						};
					} else {
						// console.log(data);
						return { compId: competitionId, seasons: [] };
					}
				})
			);
		} catch (e) {
			console.error(e);
			return e;
		}
	},
	getCurrentSeasonMatchesAPI: async function (playerId, competitionId, seasonId, from, to) {
		if (!seasonId && availableSeasonsIds.length > 0) [seasonId] = availableSeasonsIds;
		try {
			const [responsePast, responseFuture] = await Promise.all([
				instatWrappedApi.getMatchesForPlayer(playerId, competitionId, seasonId),
				instatWrappedApi.getPlayerFixtures(playerId)
			]);
			let matches = [];
			if ((responsePast.data && responsePast.data.matches) || (responseFuture.data && responseFuture.data.matches)) {
				matches = filterAndMap(responsePast, matches, from, to);
				matches = filterAndMap(responseFuture, matches, from, to, true);
			}
			return matches;
		} catch (error) {
			return error;
		}
	},
	/** getMatchesForPlayer */
	getMatchesForPlayer: async (playerId, competitionId, seasonId, dateStart, dateEnd) => {
		if (!seasonId && availableSeasonsIds.length > 0) [seasonId] = availableSeasonsIds;
		const { data: matches, error = 'Unable to fetch matches' } = await instatApi.getPlayerMatchesStats(
			playerId,
			competitionId,
			seasonId,
			dateStart,
			dateEnd
		);
		if (!(matches && matches.match)) {
			console.error('Unable to fetch matches (reason: %s)', error);
			return { data: null, error };
		}
		const match = matches && matches.match ? matches.match : null;
		const outputData = match.map(match => {
			const { round_id: roundId, title, score, id: matchId, date } = match;
			const output = {
				competitionId,
				roundId,
				seasonId,
				status: 'Played',
				matchId,
				date,
				dateutc: date, // TODO fix
				label: `${title}, ${score.replace(':', '1')}`
			};
			output.instId = playerId;
			return output;
		});
		return { data: outputData, error: null };
	},
	/** getPlayerFixtures */
	getPlayerFixtures: async (playerId, competitionId) => {
		// return WYSCOUTAPI.getRequest(`/players/${playerId}/fixtures`);
		const { data, error } = await instatApi.getPlayerMatchesStats(playerId);
		// download fixtures for matches
		const { data: allFixtures, error: allFixturesError } = await instatApi.getMatches(competitionId);
		if (data && allFixtures) {
			const { match: instatMatches } = data;
			// map match in wyscout format
			const mappedMatches = instatMatches.map(match => {
				const matchFixturesData = allFixtures.find(({ match_id }) => match_id === match.id);
				const { id: matchId, title, score, date } = match;
				const [score1, score2] = String(score).split(':');
				const scoreLabel = score1 && score2 ? `, ${score1} - ${score2}` : ' ';
				return {
					matchId,
					label: `${title}${scoreLabel}`,
					// 'date': '2021-09-19 15:00:00',
					date: moment(date).format('YYYY-MM-DD HH:mm:ss'),
					// 'dateutc': '2021-09-19 13:00:00',
					dateutc: moment(date).utc().format('YYYY-MM-DD HH:mm:ss'),
					status: 'Fixture',
					competitionId,
					seasonId: matchFixturesData.season_id,
					roundId: matchFixturesData.round_id
				};
			});
			return {
				data: mappedMatches
			};
		} else {
			return {
				data,
				error: error || allFixturesError
			};
		}
	},
	/** searchTeamAPI */
	searchTeamAPI: async (team, byId, competitionId) => {
		let result;
		if (byId) {
			result = await instatApi.getTeamBasicInfo(team);
			if (result.data && result.data.data && result.data.data.row && result.data.data.row.length) {
				const responseTeam = instatFormatConverters.teamBasicInfo(result.data.data.row[0]);
				return responseTeam;
			}
		} else {
			result = await instatApi.getTeamsByTournament(competitionId);
			if (result.data && result.data.row) {
				const found = result.data.row.find(({ name }) => {
					return String(name).toLowerCase().includes(String(team).toLowerCase());
				});
				if (found) {
					const rawInfo = await instatApi.getTeamBasicInfo(found.id);
					if (rawInfo && rawInfo.data && rawInfo.data.row && rawInfo.data.row.length) {
						const responseTeam = instatFormatConverters.teamBasicInfo(rawInfo.data.row[0]);
						return responseTeam;
					} else {
						const responseTeam = instatFormatConverters.teamBasicInfo(found);
						return responseTeam;
					}
				}
			}
		}
		return [{ officialName: team, instId: team }];
	},
	/** getMatchPlayerStats */
	getMatchPlayerStats: async (playerInstId, instatMatchId) => {
		// if (!seasonId && availableSeasonsIds.length > 0) [seasonId] = availableSeasonsIds;
		const {
			data: { data: match },
			error
		} = await instatApi.getStatPlayers(instatMatchId);
		if (error || !match) return 'Received empty data';
		const player = match.team
			.map(({ player }) => player)
			.flat()
			.find(({ id }) => String(id) === String(playerInstId));
		return player || 'Received empty data';
	},
	/**
	 * getPlayerStatForMatch
	 * */
	getPlayerStatForMatch: async (playerId, instatMatchId, competitionId, seasonId) => {
		if (!seasonId && availableSeasonsIds.length > 0) [seasonId] = availableSeasonsIds;
		const { data, error } = await instatApi.getPlayersByOne(playerId, competitionId, seasonId);
		const { data: dataMatch } = data;
		const matchStats = (dataMatch.match || []).find(({ id }) => String(id) === String(instatMatchId)) || {};
		// lookup in both teams, since we don't have the teamId and the player entry will be unique
		if (matchStats && matchStats.team) {
			const players = matchStats.team.map(({ player }) => player).flat();
			const playerStats = players.find(({ id }) => String(id) === String(playerId));
			return {
				data: instatFormatConverters.playerMatchStats(playerStats),
				error
			};
		} else {
			return {
				data: null,
				error: 'Not Found'
			};
		}
	},

	getSecondaryTeamInfo: async function (_teamId, playerIds) {
		const responses = await Promise.map(
			playerIds || [],
			async plId => {
				return instatWrappedApi.getSecondaryTeamInfoDataAPI(_teamId, plId);
			},
			{ concurrency: 5 }
		);

		const parsed = responses.filter(item => !!item).map(result => instatFormatConverters.secondaryTeamInfo(result));
		return parsed;
	},

	getSecondaryTeamInfoDataAPI: async function (_teamId, playerId) {
		try {
			const rawResults = await instatWrappedApi.getPlayerTeamInfo(playerId);
			const mapped = rawResults.map(result => instatFormatConverters.secondaryTeamInfo(result));
			return mapped;
		} catch (error) {
			return null;
		}
	},

	/** getPlayerTeamInfo  */
	getPlayerTeamInfo: async playerId => {
		const { data: instatPlayerInfo, error } = await instatApi.getPlayerBasicInfo(playerId);
		if (!instatPlayerInfo) {
			console.error(error);
			return {
				data: null,
				error
			};
		}
		const playerInfo = instatFormatConverters.playerBasicInfoObject(instatPlayerInfo.data.row[0]);
		return { data: playerInfo };
	},
	syncSingleClubEventWithInstat: async function (Event, eventInstance, lineup) {
		// get basic match from instat
		const instatEvent = await Event.app.models.Instat.getSingleMatch(eventInstance.instatId);
		if (instatEvent.status === 'Played') {
			const lineupStats = lineup.filter(({ id }) =>
				eventInstance._playerMatchStats.map(({ playerId }) => playerId).includes(String(id))
			);
			const playersStats = await instatWrappedApi.getClubMatchPlayersStatsAll(
				Event,
				lineupStats,
				eventInstance.instatId
			);
			const updatedMatch = await instatWrappedApi.updateMatchWithInstatData(
				Event,
				eventInstance,
				instatEvent,
				null,
				lineup,
				null,
				playersStats
			);
			if (!!updatedMatch && !!updatedMatch._playerStats) {
				eventInstance = await instatWrappedApi.updateEventWithInstatData(
					eventInstance,
					lineup,
					null,
					instatEvent,
					updatedMatch,
					playersStats
				);
			} else {
				throw new InstatException();
			}
		}
		return eventInstance;
	},
	getClubMatchPlayersStatsAll: (Event, players, matchInstId) =>
		Promise.map(
			players.map(({ instatId }) => instatId),
			playerInstId => Event.app.models.Instat.getMatchPlayerStats(playerInstId, matchInstId),
			{ concurrency: 2 }
		).then(response => response.filter(({ stack }) => !stack)),

	syncSingleEventWithInstat: async function (Event, eventInstance, instatId, lineup) {
		// get basic match from instat
		const instatEvent = await Event.app.models.Instat.getSingleMatch(eventInstance.instatId);
		const { status, hasDataAvailable, teamsData } = instatEvent;
		if (status === 'Played' && hasDataAvailable) {
			const basicTeamData = teamsData[instatId];
			// get advanced data from instat
			const [teamStats, playersStats] = await Promise.all([
				instatWrappedApi.getMatchTeamData(Event, instatEvent, basicTeamData),
				instatWrappedApi.getMatchPlayersStatsAll(Event, basicTeamData, eventInstance.instatId)
			]);

			// update match and event
			const updatedMatch = await instatWrappedApi.updateMatchWithInstatData(
				Event,
				eventInstance,
				instatEvent,
				basicTeamData,
				lineup,
				teamStats,
				playersStats
			);
			if (!!updatedMatch && !!updatedMatch._playerStats) {
				eventInstance = await instatWrappedApi.updateEventWithInstatData(
					eventInstance,
					lineup,
					basicTeamData,
					instatEvent,
					updatedMatch,
					playersStats
				);
			}
		}
		return eventInstance;
	},
	getMatchTeamData: (Event, instatEvent, basicTeamData) =>
		Event.app.models.Instat.getTeamStatsForMatch(
			basicTeamData.teamId,
			instatEvent.competitionId,
			instatEvent.seasonId,
			instatEvent.roundId,
			instatEvent.gameweek
		),
	getMatchPlayersStatsAll: async function (Event, basicTeamData, matchInstId) {
		const playersInstIds = [...basicTeamData.formation.lineup, ...basicTeamData.formation.bench].map(x => x.playerId);
		return Promise.map(
			playersInstIds,
			playerInstId => Event.app.models.Instat.getMatchPlayerStats(playerInstId, matchInstId),
			{ concurrency: 2 }
		);
	},
	updateMatchWithInstatData: (Event, eventInstance, instatEvent, basicTeamData, players, teamStats, playerStats) =>
		Event.app.models.Match.updateMatchWithInstatData(
			eventInstance,
			instatEvent,
			basicTeamData,
			players,
			teamStats,
			playerStats
		),
	updateEventWithInstatData: async function (event, players, basicTeamData, instatEvent, updatedMatch) {
		// resync playerMatchStats with updated match
		event._playerMatchStats = [];
		// players are the seasonal ones
		for (const player of players) {
			let newPlayerMatchStat = getEmptyMatchPlayerStat(player);
			const playerStat = updatedMatch._playerStats.find(stat => String(stat.playerId) === String(player.id));
			if (playerStat) {
				newPlayerMatchStat = wrapPlayerMatchStats(newPlayerMatchStat, playerStat, player, basicTeamData);
				// update rpeTl in the gps sessions
				const gpsSessionIndex = event._sessionPlayers.findIndex(
					session => session.mainSession && String(session.playerId) === playerStat.playerId
				);
				if (gpsSessionIndex !== -1) {
					event._sessionPlayers[gpsSessionIndex].rpeTl =
						(event._sessionPlayers[gpsSessionIndex].rpe || 0) * (playerStat.minutesPlayed || 0);
				}
			}
			event._playerMatchStats = [...event._playerMatchStats, newPlayerMatchStat];
		}

		// general match info
		event.instatSynced = instatEvent.hasDataAvailable;
		event.start = moment.utc(instatEvent.dateutc).toDate();
		event.end = moment.utc(instatEvent.dateutc).add(90, 'minutes').toDate();
		event.duration = getMaxGameDuration(instatEvent._playerMatchStats);
		event.title = instatEvent.label;
		event.description = instatEvent.label;
		event.where = instatEvent.venue;
		event.home = basicTeamData && basicTeamData.side === 'home';
		event.result = instatEvent.label.split(',')[1];
		event.resultFlag = instatEvent.winner === 0 ? null : basicTeamData && instatEvent.winner === basicTeamData.teamId;
		event.playerIds = event._playerMatchStats.map(x => x.playerId);

		const updatedEvent = await Event.upsert(event);
		return updatedEvent;
	},
	getTeamHistory: async (instatId, competitionId, seasonId) => {
		if (!seasonId && availableSeasonsIds.length > 0) [seasonId] = availableSeasonsIds;
		try {
			let allSeasons = await instatApi.getTeamBasicInfo(competitionId).then((data, error) => ({
				data: data ? data.season : [],
				error
			}));
			allSeasons = allSeasons.filter(({ id }) => availableSeasonsIds.includes(id));
			const allSeasonalData = await Promise.map(allSeasons, ({ id }) =>
				instatApi.getAggregatedTeamStats(instatId, competitionId, id)
			);
			const career = allSeasonalData
				.filter(({ data }) => data != null)
				.map(async seasonData => {
					const response = {};
					const { data: fixtures } = await instatApi.getMatches(competitionId, seasonData.id, instatId);
					if (fixtures) response.matchTotal = fixtures.length;
					return {
						teamId: instatId,
						seasonId,
						competitionId
					};
				});
			return Promise.all(career);
		} catch (error) {
			console.error('[INSTAT ERROR]', error);
			return [];
		}
	},
	getSquadSeasonPlayers: async teamId => {
		try {
			const instatTeamPlayers = await instatApi.getTeamPlayers(teamId).then(data => data?.data?.row);
			if (!instatTeamPlayers || instatTeamPlayers?.length === 0) {
				return [];
			}
			const allRawPlayersBasicInfo = await Promise.map(
				instatTeamPlayers,
				player =>
					instatApi
						.getPlayerBasicInfo(player.id)
						.then(response => response.data.data.row[0])
						.catch(error => console.error(error)),
				{ concurrency }
			);
			return allRawPlayersBasicInfo.filter(x => x).map(player => instatFormatConverters.playerBasicInfoObject(player));
		} catch (error) {
			console.error('[INSTAT ERROR]', error);
			return [];
		}
	},
	gamePlayerStatsAPI: async function (matchId, players, substitutions) {
		try {
			const statPlayersResponse = await instatApi.getStatPlayers(matchId);

			const { data: playerStats, error: playerStatsError } = statPlayersResponse;
			// log Instat API Errors

			if (!playerStats) {
				console.warn(`No stats for players at match ${matchId} (reason: ${String(playerStatsError)})`);
			}

			const teamData = playerStats.data.team.reduce((array, { player }) => [...array, ...player], []);

			const stats = instatWrappedApi.extractPlayerStats(players, teamData, playerStatisticsIds);

			return stats;
		} catch (e) {
			console.error('[instatWrappedApi.gamePlayerStats] Failed request gamePlayerStats');
			console.error(e);
		}
		return [];
	},
	squadSeasonPlayersAPI: async function (squadIds, seasonId) {
		if (!seasonId && availableSeasonsIds.length > 0) [seasonId] = availableSeasonsIds;
		try {
			const response = await Promise.map(
				squadIds,
				async teamId => {
					const players = await instatWrappedApi.getSquadSeasonPlayers(teamId, seasonId);
					return { teamId, players };
				},
				{ concurrency: 2 }
			);
			return response.filter(({ stack }) => !stack);
		} catch (error) {
			console.error(error);
			return [];
		}
	},
	instatCompetitionTeamsAPI: async function (tournamentId, seasonId) {
		if (!seasonId && availableSeasonsIds.length > 0) [seasonId] = availableSeasonsIds;
		const teams = await instatApi.getTeamsByTournament(tournamentId, seasonId).then(({ data: teamsResponse }) =>
			teamsResponse.data && teamsResponse.data.row
				? teamsResponse.data.row.map(r => ({
						instId: r.id,
						name: r.name,
						short_name: r.short_name
				  }))
				: []
		);
		return { teams: teams };
	},
	careerTransfers: async function (instatPlayerId) {
		const careerData = [];
		const transfersData = [];
		return {
			instatId: instatPlayerId,
			career: careerData && careerData.length > 0 ? careerData : [],
			transfers: transfersData && transfersData.length > 0 ? transfersData : [],
			error: 'It seems that Instat does not support this information'
		};
	},
	getSeasonsForCompetition: async (competitionsIds, asyncClient) => {
		const cacheKeySeasons = `Instat_seasons`;
		let seasons = await asyncClient.get(cacheKeySeasons);
		if (!seasons) {
			seasons = uniqBy(
				(
					await Promise.map(
						competitionsIds,
						async id => {
							const { data: seasonsOfTournamentData, error } = await instatApi
								.getSeasonsOfTournament(id)
								.catch(error => {
									console.error(error);
									return {
										data: null,
										error
									};
								});
							if (error) {
								// console.error('Error when accessing the seasons for Instat tournament %d', tournamentId);
								console.error(error);
								return {
									data: null,
									error
								};
							} else {
								const {
									data: { season = [] }
								} = seasonsOfTournamentData;
								if (!season.length) {
									console.error(`Available seasons for tournament ${id} is an empty list`);
									return {
										data: null,
										error: `Available seasons for tournament ${id} is an empty list`
									};
								}
								const filteredSeasons = season.filter(item => availableSeasonsIds.includes(Number(item.id))) || [
									{ id: null }
								];
								return filteredSeasons;
							}
						},
						{ concurrency }
					)
				).flat(),
				'id'
			);
			if (seasons) {
				asyncClient.set(cacheKeySeasons, JSON.stringify(seasons));
				asyncClient.expire(cacheKeySeasons, CACHE_TTL);
			}
		}
		return seasons || [];
	},
	getTeamsForCompetition: async (competitionsIds, seasons, asyncClient) => {
		const cacheKeyTeams = `Instat_teams`;
		let competitions = JSON.parse(await asyncClient.get(cacheKeyTeams));
		if (!competitions) {
			const response = (
				await Promise.map(competitionsIds, async tournamentId => {
					try {
						const data = await Promise.all(
							seasons.map(({ id }) => instatApi.getTeamsByTournament(tournamentId, Number(id)))
						);
						return data;
					} catch (e) {
						console.error(e);
						return { data: null, error: e };
					}
				})
			).flat();

			if (response.every(({ error }) => String(error).includes('Access denied'))) {
				throw new ForbiddenError(
					'It seems that your current Instat plan does not allow to search in the current year. Contact your support.',
					'Instat API'
				);
			}
			// remove all forbidden competitions
			competitions = uniqBy(
				response
					.filter(({ error }) => !error)
					.map(({ data }) => data.data.row)
					.flat(),
				'id'
			);

			asyncClient.set(cacheKeyTeams, JSON.stringify(competitions));
			asyncClient.expire(cacheKeyTeams, CACHE_TTL);
		}
		return competitions;
	},
	/** get all teams from all competitions, supports subset of competitions ids */
	getAllCompetitionsTeams: async (ids, req) => {
		try {
			const competitionsIds = instatCompetitions
				.map(({ instatId }) => instatId)
				.filter(id => (ids && ids.length > 0 ? ids.includes(id) : true));
			const asyncClient = asyncRedis.decorate(Object.create(req.app.redisClient));
			const seasons = await instatWrappedApi.getSeasonsForCompetition(competitionsIds, asyncClient);
			const competitions = await instatWrappedApi.getTeamsForCompetition(competitionsIds, seasons, asyncClient);
			return Array.from(new Set(competitions));
		} catch (e) {
			console.error(e);
			return [];
		}
	},
	teamSearchAPI: async (query, competitionIds, req) => {
		// const response = await WYSCOUTAPI.getRequest('/search?query=' + query + '&objType=team', { encode: true });
		// Our "search" will be a lookup for all tournaments in order to find a team
		const foundTeamsId = await instatWrappedApi
			.getAllCompetitionsTeams(competitionIds, req)
			.then(allTeams =>
				(allTeams || [])
					.filter(({ name: teamName }) => String(teamName).toLowerCase().includes(String(query).toLowerCase()))
					.map(({ id }) => id)
			)
			.catch(error => {
				console.error(error);
				return [];
			});
		return Promise.map(foundTeamsId, instatWrappedApi.getTeamWithImage, { concurrency }).then(results =>
			results
				.map(({ data }) => data)
				.map(({ officialName, instId, imageDataURL }) => ({
					name: officialName,
					instatId: instId,
					crest: imageDataURL
				}))
		);
	},
	getCompetitionPlayers: async (competitionId, req) => {
		// get all teams and convert them for wyscout, we need them later
		const allRawTeams = await instatWrappedApi.getAllCompetitionsTeams([competitionId], req);
		const allTeams = allRawTeams.map(team => instatFormatConverters.teamBasicInfo(team));
		// extracting a unique list of teams Ids in order to retrieve all their players
		const allTeamsIds = allTeams.map(({ instId }) => instId);
		// all players -> (instatId, instatClubId)
		const allRawTeamsPlayers = await Promise.map(allTeamsIds, instatApi.getTeamPlayers, { concurrency });
		const allTeamsPlayers = allRawTeamsPlayers.reduce((acc, { data: val }) => {
			if (val.data.row && val.data.row.length > 0) {
				return Array.from(new Set(acc.concat(val.data.row)));
			} else {
				return acc;
			}
		}, []);
		const allPlayers = allTeamsPlayers.map(({ id: instId, club_team_id }) => ({
			instId: Number(instId),
			club_team_id: Number(club_team_id)
		}));
		// instat player full info, converted in wyscout format
		const allRawPlayersBasicInfo = await Promise.map(
			allTeamsPlayers,
			player =>
				instatApi.getPlayerBasicInfo(player.id).catch(error => {
					console.error(error);
					return {
						data: {
							data: {
								row: [player]
							}
						},
						error
					};
				}),
			{ concurrency }
		);
		const allPlayersBasicInfo = allRawPlayersBasicInfo
			.map(playerBasicInfo => {
				if (
					playerBasicInfo.data &&
					playerBasicInfo.data.data &&
					playerBasicInfo.data.data.row.length &&
					playerBasicInfo.data.data.row.length > 0
				) {
					const [instatPlayerInfo] = playerBasicInfo.data.data.row;
					return instatFormatConverters.playerBasicInfoObject(instatPlayerInfo);
				} else return null;
			})
			.filter(playerBasicInfo => !!playerBasicInfo);
		// return all players with currentTeam details
		return allPlayers.map(({ instId: playerInstatId, club_team_id }) => {
			const playerInfo = allPlayersBasicInfo.find(({ instId }) => instId === playerInstatId) || {};
			const currentTeam = allTeams.find(({ instId }) => instId === Number(club_team_id));
			return {
				instatId: playerInstatId,
				instatTeamId: club_team_id,
				...playerInfo,
				currentTeam
			};
		});
	},
	searchPlayersByQuery: async (query, req) => {
		const strQuery = String(query).toLowerCase();
		// get all teams
		const allTeams = await instatWrappedApi.getAllCompetitionsTeams([], req);
		const allTeamsIds = allTeams.map(({ id }) => id);
		// get all players for each team
		const allTeamsPlayersResponse = await Promise.map(
			allTeamsIds,
			teamId =>
				instatApi.getTeamPlayers(teamId).catch(error => ({
					data: null,
					error
				})),
			{ concurrency }
		);
		const allTeamsPlayers = Array.from(
			new Set(
				allTeamsPlayersResponse
					.filter(({ error }) => error == null)
					.reduce((acc, val) => acc.concat(val.data.data.row), [])
			)
		);
		const rawPlayers = allTeamsPlayers.filter(({ firstname, lastname }) =>
			strQuery
				.split(' ')
				.every(word => String(firstname).toLowerCase().includes(word) || String(lastname).toLowerCase().includes(word))
		);
		const playersBasicInfos = await Promise.map(rawPlayers, rawPlayerInfo =>
			instatApi
				.getPlayerBasicInfo(rawPlayerInfo.id)
				.then(response => {
					return {
						data: response.data.data.row[0],
						error: null
					};
				})
				.catch(error => {
					console.error(error);
					return {
						data: rawPlayerInfo,
						error
					};
				})
		);
		const extractedPlayersBasicInfo = playersBasicInfos.map(({ data: basicInfo }) => basicInfo);
		return extractedPlayersBasicInfo.map(rawPlayer => instatFormatConverters.playerBasicInfoObject(rawPlayer));
	},
	searchPlayersAPI: async function (query, nationalities, competitionIds, ageMin, ageMax, positions, gender, req) {
		if (query) {
			const players = await instatWrappedApi.searchPlayersByQuery(query, req);
			const playersByGender = gender ? players.filter(({ gender: pGender }) => pGender === gender) : players;
			// Get all teams together in order to optimize queries
			const allTeamsId = playersByGender.map(({ currentTeamId }) => currentTeamId).filter(notEmptyPredicate);
			const allTeamsInfo = await Promise.map(allTeamsId, instatWrappedApi.getTeamData, { concurrency });
			for (const p of playersByGender) {
				if (p.currentTeamId) p.currentTeam = allTeamsInfo.find(({ instId }) => instId === p.currentTeamId);
			}
			return { players: playersByGender };
		} else if (competitionIds && competitionIds.length > 0) {
			let players = await Promise.map(competitionIds, instatWrappedApi.getCompetitionPlayers, { concurrency });
			players = players.flat();
			if (positions && positions.length > 0)
				players = players.filter(
					({ role, role: { code2 } }) => !role || stringUtils.arrayLowercaseIncludes(positions, code2)
				);
			if (nationalities && nationalities.length > 0)
				// instat doesn't have birthArea, but only passport area
				players = players.filter(
					({ passportArea, passportArea: { alpha2code } }) =>
						!passportArea || !alpha2code || stringUtils.arrayLowercaseIncludes(nationalities, alpha2code)
				);
			if (ageMin && ageMax) {
				const dateMin = moment().subtract(ageMax, 'years');
				const dateMax = moment().subtract(ageMin, 'years');
				players = players.filter(
					({ birthDate }) => !birthDate || moment(birthDate, 'YYYY-MM-DD').isBetween(dateMin, dateMax)
				);
			}
			return { players };
		} else {
			return {
				players: []
			};
		}
	},
	playerImage: async thirdPartyIds =>
		Promise.map(
			thirdPartyIds,
			thirdPartyId =>
				instatWrappedApi.getPlayerImage(thirdPartyId).then(({ data: image }) => ({ thirdPartyId, image })),
			{ concurrency: 2 }
		)
			.catch(error => {
				console.error(error);
				return [];
			})
			.filter(({ stack }) => !stack),
	getSeasonalData: async function (competitionId) {
		const response = await instatApi.getTournamentInfo(competitionId);
		let seasonsIds = [];
		if (response.data && response.data.season && response.data.season.length > 0) {
			seasonsIds = response.data.season.map(season => season.id);
			// keep only supported seasons
			seasonsIds = seasonsIds.filter(seasonId => availableSeasonsIds.includes(seasonId));
		}
		// get seasons info
		const seasons = seasonsIds.map(seasonId => instatWrappedApi.getSeasonInfo(seasonId, competitionId));
		return {
			competitionId,
			seasons
		};
	},
	getSeasonInfo: async function (seasonId, competitionId) {
		if (!seasonId && availableSeasonsIds.length > 0) [seasonId] = availableSeasonsIds;
		const instatInfo = await instatApi
			.getSeasonsOfTournament(competitionId)
			.then(({ data }) =>
				data && data.season && data.season.length > 0 ? data.season.find(({ id }) => Number(id) === seasonId) : null
			);
		return instatFormatConverters.seasonInfo(instatInfo, competitionId);
	},
	getStandingsForSeason: async (tournamentId, seasonId) => {
		if (!seasonId && availableSeasonsIds.length > 0) [seasonId] = availableSeasonsIds;
		const response = await instatApi.getStandings(tournamentId, seasonId);
		const { teams = [] } = await instatFormatConverters.seasonStandings(response);
		return {
			teams
		};
	},
	matchesForSeasonAPI: async function (seasonId, competitionId, date = new Date()) {
		const fromDate = moment(date).subtract(2, 'days').format('YYYY-MM-DD');
		const toDate = moment(date).add(2, 'days').format('YYYY-MM-DD');
		try {
			const response = await instatApi.getMatches(
				competitionId,
				seasonId > 0 ? seasonId : null,
				undefined,
				fromDate,
				toDate
			);
			const { data = {} } = response;
			const rows = data?.data ? data.data.row : [];
			return rows.map(row => {
				const match = instatFormatConverters.scoutingMatch(row);
				return { goals: [], matchId: Number(match.id), match };
			});
			//	return Promise.map(rows, row => instatWrappedApi.getSingleMatch(row.id), { concurrency: 2 });
		} catch (error) {
			console.error(error);
			return [];
		}
	},
	getTeamsCompetitions: async function (team_id) {
		try {
			const { data, error } = await instatApi.getMatches(null, null, team_id, null, null);
			if (error) throw error;
			const matches = data.data.row;
			const competitions = uniqBy(matches, 'tournament_id').map(({ tournament_id, tournament_name }) => ({
				label: tournament_name,
				value: Number(tournament_id)
			}));
			return competitions;
		} catch (e) {
			console.error(e);
			throw e;
		}
	},
	matchesForTeamAPI: async function (team_id, date = new Date()) {
		const fromDate = moment(date).subtract(2, 'days').format('YYYY-MM-DD');
		const toDate = moment(date).add(2, 'days').format('YYYY-MM-DD');
		try {
			const response = await instatApi.getMatches(undefined, undefined, team_id, fromDate, toDate);
			const { data = {} } = response;
			const rows = data.data ? data.data.row : [];
			return rows.map(row => {
				const match = instatFormatConverters.scoutingMatch(row);
				return { goals: [], matchId: Number(match.id), match };
			});
		} catch (error) {
			console.error(error);
			return [];
		}
	}
});

const filterAndMap = function (response, matches, from, to, future) {
	const filtered = response.data.matches.filter(({ date }) => moment(date).isBetween(moment(from), moment(to)));
	const countObj = countBy(filtered.map(({ label }) => label.split(', ')[0].split(' - ')[0]));
	const currentTeam = Object.keys(countObj).reduce((a, b) => (countObj[a] > countObj[b] ? a : b), '');
	if (future) {
		filtered.forEach(match => (match.label = match.label.split(',')[0]));
	}
	return matches.concat(
		filtered.map(x => {
			const home = x.label.split(', ')[0].split(' - ')[0];
			const away = x.label.split(', ')[0].split(' - ')[1];
			return {
				date: x.date,
				label: `${x.label}`,
				played: x.status === 'Played',
				matchId: x.matchId,
				team: !currentTeam || home === currentTeam ? home : away,
				opponent: !currentTeam || home === currentTeam ? away : home,
				home: currentTeam ? home === currentTeam : null,
				result: future ? null : x.label.split(', ')[1],
				location: home
			};
		})
	);
};

class InstatException {
	constructor() {
		this.statusCode = 400;
		this.code = 'INSTAT_NOT_SYNCED';
		this.name = 'InstatException';
		this.message =
			'It seems that this event is not complete yet on Instat. Please check again tomorrow or contact Instat.';
	}
}

async function wrapMatchForStandingsList(match, teamId) {
	const opponentId = Number(match.team1_id) === Number(teamId) ? Number(match.team2_id) : Number(match.team1_id);
	const opponent = await instatWrappedApi.getTeamWithImage(opponentId).then(({ data }) => data);
	const winnerId =
		Number(match.team1_score) === Number(match.team2_score)
			? 0
			: Number(match.team1_score) > Number(match.team2_score)
			? Number(match.team1_id)
			: Number(match.team2_id);
	return {
		instId: Number(match.id),
		matchInfo: {
			...match,
			dateutc: match.match_date
		},
		team1: Number(match.team1_id),
		team2: Number(match.team2_id),
		gameweek: Number(match.round_id),
		side: Number(match.team1_id) === Number(teamId) ? 'home' : 'away',
		crest: opponent ? opponent.imageDataURL : null,
		label: Number(match.team1_id) === Number(teamId) ? match.team2_name : match.team1_name,
		result: moment(match.match_date).isAfter(moment()) ? `-` : `${match.team1_score} - ${match.team2_score}`,
		played: match.status_name === 'Breakdown completed' ? 'Played' : match.status_name,
		winner: winnerId !== 0 ? (winnerId === opponentId ? -1 : 1) : 0
	};
}

async function wrapLeaderboardTeam(team) {
	const teamWithImage = await instatWrappedApi.getTeamWithImage(team.team_id).then(({ data }) => data);
	return {
		team: teamWithImage,
		name: team.team_name,
		teamId: Number(team.team_id),
		totalPlayed: Number(team.total),
		totalWins: Number(team.won),
		totalDraws: Number(team.draw),
		totalLosses: Number(team.lost),
		totalGoalsFor: Number(team.goals_for),
		totalGoalsAgainst: Number(team.goals_against),
		totalPoints: Number(team.points)
	};
}

async function wrapMatchForStatsDetails(match, stats, events) {
	const homeTeam = Number(match.team1_id);
	const awayTeam = Number(match.team2_id);
	const goals = events
		.filter(({ action_id }) => action_id === actionIds.goals || action_id === actionIds.ownGoals)
		.map(goal => wrapGoal(goal));
	const teams = await Promise.all([
		instatWrappedApi.getTeamWithImage(homeTeam).then(({ data }) => data),
		instatWrappedApi.getTeamWithImage(awayTeam).then(({ data }) => data)
	]);

	const wrapped = {
		home: {
			instId: homeTeam,
			imageDataURL: teams[0].imageDataURL,
			teamData: {
				score: Number(match.score.split(':')[0])
			},
			teamStats: instatFormatConverters.teamStatsForMatch(stats, homeTeam, match.id)
		},
		away: {
			instId: awayTeam,
			imageDataURL: teams[1].imageDataURL,
			teamData: {
				score: Number(match.score.split(':')[1])
			},
			teamStats: instatFormatConverters.teamStatsForMatch(stats, awayTeam, match.id)
		},
		match: {
			instId: Number(match.id),
			date: moment(match.match_date).toDate(),
			dateutc: match.match_date,
			gameweek: Number(match.round_id),
			competition: {
				name: match.tournament_name
			},
			goals,
			...match
		}
	};
	return wrapped;
}

function wrapGoal(goal) {
	return {
		minute: Math.round(Number(goal.second) / 60),
		period: goal.half === '1' ? 'FirstHalf' : 'SecondHalf',
		player: {
			instId: Number(goal.player_id),
			currentTeamId:
				goal.action_id === actionIds.ownGoals ? Number(goal.opponent_team_id) : Number(goal.possession_team_id),
			shortName: goal.player_name
		},
		playerId: Number(goal.player_id),
		teamId: goal.action_id === actionIds.ownGoals ? Number(goal.opponent_team_id) : Number(goal.possession_team_id),
		type: goal.action_id === actionIds.ownGoals ? 'own' : goal.standart_id === actionIds.penalty ? 'penalty' : 'goal'
	};
}

function getEmptyMatchPlayerStat(player) {
	return {
		id: uuid(),
		playerId: player.id,
		playerName: player.displayName,
		enabled: false,
		minutesPlayed: null,
		yellowCard: null,
		redCard: null,
		substituteInMinute: null,
		substituteOutMinute: null,
		score: null,
		assists: null,
		penalties: null,
		gkCleanSheets: null,
		fouls: null,
		successfulPasses: null,
		recoveries: null,
		gkSaves: null,
		goals: null,
		penaltiesConversion: null,
		yellowCards: null,
		redCards: null,
		directRedCards: null
	};
}

function wrapPlayerMatchStats(stat, playerStat, player, basicTeamData) {
	return {
		...stat,
		enabled: playerStat.minutesOnField > 0,
		score: playerStat.minutesOnField > 0 ? playerStat.goals : null,
		assists: playerStat.minutesOnField > 0 ? playerStat.assists : null,
		penalties: playerStat.minutesOnField > 0 ? playerStat.penalties : null,
		gkCleanSheets: playerStat.minutesOnField > 0 ? playerStat.gkCleanSheets : null,
		fouls: playerStat.minutesOnField > 0 ? playerStat.fouls : null,
		successfulPasses: playerStat.minutesOnField > 0 ? playerStat.successfulPasses : null,
		recoveries: playerStat.minutesOnField > 0 ? playerStat.recoveries : null,
		gkSaves: playerStat.minutesOnField > 0 ? playerStat.gkSaves : null,
		goals: playerStat.minutesOnField > 0 ? playerStat.goals : null,
		penaltiesConversion: playerStat.minutesOnField > 0 ? playerStat.penaltiesConversion : null,
		yellowCard: playerStat.yellowCards > 0,
		redCard: playerStat.redCards > 0,
		yellowCards: playerStat.yellowCards,
		redCards: playerStat.redCards,
		directRedCards: playerStat.directRedCards,
		minutesPlayed: playerStat.minutesOnField,
		...getSubstitutionsInfo(basicTeamData, player)
	};
}

function getSubstitutionsInfo(basicTeamData, player) {
	if (basicTeamData && basicTeamData.formation && basicTeamData.formation.substitutions) {
		const substitutionIn = basicTeamData.formation.substitutions.find(x => x.playerIn === player.wyscoutId);
		const substitutionOut = basicTeamData.formation.substitutions.find(x => x.playerOut === player.wyscoutId);
		return {
			substituteInMinute: substitutionIn ? Number(substitutionIn.minute) : null,
			substituteOutMinute: substitutionOut ? Number(substitutionOut.minute) : null
		};
	}
	return null;
}

function getMaxGameDuration(stats) {
	return max((stats || []).map(({ minutesPlayed = 0 }) => Number(minutesPlayed))) || 90;
}

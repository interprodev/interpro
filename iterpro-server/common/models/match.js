const { ObjectID } = require('mongodb');
const moment = require('moment');
const { v4: uuid } = require('uuid');
const { flatten, isEmpty } = require('lodash');
const tacticalInfoProvider = require('../../server/models/thirdparty-connectors/tacticalInfoProvider');

module.exports = function (Match) {
	Match.updateMatchWithWyscoutData = async function (
		event,
		wyscoutEvent,
		basicTeamData,
		players,
		teamStats,
		playersStats
	) {
		return Match.updateMatchWithProviderData(
			event,
			wyscoutEvent,
			basicTeamData,
			players,
			teamStats,
			playersStats,
			'wyscout'
		);
	};

	Match.updateMatchWithInstatData = async function (
		event,
		instatEvent,
		basicTeamData,
		players,
		teamStats,
		playersStats
	) {
		return Match.updateMatchWithProviderData(
			event,
			instatEvent,
			basicTeamData,
			players,
			teamStats,
			playersStats,
			'instat'
		);
	};

	Match.updateMatchWithProviderData = async function (
		event,
		providerEvent,
		basicTeamData,
		players,
		teamStats,
		playersStats,
		provider = 'wyscout'
	) {
		try {
			// const provider = 'wyscout';
			const providerIdField = tacticalInfoProvider.getProviderField(provider, 'id'); // now is 'wyscoutId'
			let match = await Match.findOne({ where: { eventId: ObjectID(event.id) } });
			if (!match) {
				console.warn(
					`Associated match undefined for ${event.id} providerid: ${event[providerIdField]}. Creating one...`
				);
				match = await Match.updateRelatedMatch(event);
			}
			const { dateutc, result, winner } = tacticalInfoProvider.parseProviderEventObject(provider, providerEvent);
			match.date = moment.utc(dateutc).toDate();
			match.opponent = event.opponent;
			match.home = basicTeamData && basicTeamData.side === 'home';
			match.result = result;
			match.resultFlag = winner === 0 ? null : basicTeamData && winner === basicTeamData.teamId;
			match._teamStat = updateTeamStats(match, teamStats);
			match._playerStats = updatePlayersStats(match, players, playersStats);
			return Match.upsert(match);
		} catch (e) {
			console.error(e);
			return e;
		}
	};

	Match.updateRelatedMatch = async function (event) {
		console.log(`[MATCH] Game event ${event.id} updating: update related match...`);
		const [allTeamSeasons, matchLinked] = await Promise.all([
			Match.app.models.TeamSeason.getDataSource()
				.connector.collection(Match.app.models.TeamSeason.modelName)
				.find({ teamId: ObjectID(event.teamId) })
				.toArray(),
			Match.findOne({ where: { eventId: event.id } })
		]);

		const playerIds = getSeasonOrCompetitionLineup(allTeamSeasons, event);
		const activePlayers = await Match.app.models.Player.find({
			where: {
				id: { inq: playerIds },
				archived: false
			},
			fields: ['id']
		});

		const match = {
			...matchLinked?.__data,
			date: event.start,
			result: event.result,
			opponent: event.opponent,
			home: event.home,
			teamId: event.teamId,
			eventId: event.id,
			teamSeasonId: event.teamSeasonId,
			_offensive:
				hasNotTacticalPhase(matchLinked?._offensive) && !isEmpty(activePlayers)
					? getTacticalPhase(activePlayers)
					: matchLinked?._offensive,
			_defensive:
				hasNotTacticalPhase(matchLinked?._defensive) && !isEmpty(activePlayers)
					? getTacticalPhase(activePlayers)
					: matchLinked?._defensive,
			_playerStats: getUpdatedPlayerStats(matchLinked?._playerStats, event, activePlayers),
			_teamStat: matchLinked?._teamStat || {}
		};

		return await Match.upsert(match);
	};

	Match.importPlayerStatsFromCSV = async function (matchId, playersStats, username) {
		try {
			console.log(`[MATCH] Updating match ${matchId} with imported players stats...`);
			const match = await Match.findById(matchId);
			const updated = await match.updateAttribute('_playerStats', playersStats);
			const event = await Match.app.models.Event.updatePlayersStatsFromMatch(updated.eventId, playersStats, username);
			return {
				match: updated,
				event: {
					name: `Session ${moment(event.start).format('DD/MM/YYYY HH:mm')}`,
					start: event.start,
					eventId: event.id
				}
			};
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Match.importTeamStatsFromCSV = async function (matchId, teamStats, username) {
		try {
			console.log(`[MATCH] Updating match ${matchId} with imported team stats...`);
			const match = await Match.findById(matchId);
			const updated = await match.updateAttribute('_teamStat', teamStats);
			const event = await Match.app.models.Event.findById(updated.eventId);
			return {
				match: updated,
				event: {
					name: `Session ${moment(event.start).format('DD/MM/YYYY HH:mm')}`,
					start: event.start,
					eventId: event.id
				}
			};
		} catch (error) {
			console.error(error);
			throw error;
		}
	};
};

function getTacticalPhase(activePlayers) {
	return activePlayers.length === 0
		? {}
		: {
				tactic: '4-4-2',
				transition: '',
				organization: '',
				setPieces: '',
				_players: activePlayers
					.filter(({ id }) => id)
					.map(({ id }, index) => ({
						playerId: id.toString(),
						orderingIndex: index,
						organization: '',
						transition: ''
					}))
		  };
}

function getSeasonOrCompetitionLineup(teamSeasons, event) {
	const teamSeason = teamSeasons.find(({ offseason, inseasonEnd }) =>
		moment(event.start).isBetween(moment(offseason), moment(inseasonEnd))
	);
	let playerIds = teamSeason && teamSeason.playerIds ? teamSeason.playerIds : [];
	if (teamSeason && !isEmpty(teamSeason.competitionInfo) && event.subformat) {
		const competition = teamSeason.competitionInfo.find(
			competition => competition.toString() === event.subformat.toString()
		);
		if (competition && !isEmpty(competition.lineup)) playerIds = competition.lineup;
	}
	return flatten(playerIds).map(id => ObjectID(id));
}

function updatePlayersStats(match, players, playersStats) {
	match._playerStats = [];
	// fetch provider from match object
	const provider = tacticalInfoProvider.extractProvider(match);
	const providerIdField = tacticalInfoProvider.getProviderField(provider, 'id');
	if (!isEmpty(playersStats)) {
		for (const providerStat of playersStats) {
			const player = players.find(player => player[providerIdField] === providerStat.playerId);
			if (player) {
				const statToAdd = {
					playerId: ObjectID(player.id),
					playerName: player.displayName
				};
				for (const key in providerStat.total) {
					statToAdd[key] = providerStat.total[key];
				}
				match._playerStats.push(statToAdd);
			}
		}
	}
	return match._playerStats;
}

function updateTeamStats(match, teamStats) {
	if (teamStats) {
		if (!match._teamStat) match._teamStat = {};
		for (const key in teamStats.total) {
			match._teamStat[key] = teamStats.total[key];
		}
		for (const key in teamStats.average) {
			match._teamStat[`${key}_avg`] = teamStats.average[key];
		}
		for (const key in teamStats.percent) {
			match._teamStat[`${key}_percent`] = teamStats.total[key];
		}
	}
	return match._teamStat;
}

function hasNotTacticalPhase(phase) {
	return !phase?._players || phase?._players.length === 0;
}

function getUpdatedPlayerStats(
	_playerStats,
	{ playerIds, _playerMatchStats, instatSynced, wyscoutSynced },
	activePlayers
) {
	if (!_playerStats) _playerStats = [];
	for (const { playerId: statPlayerId } of _playerStats) {
		const player = playerIds.find(id => String(id) === String(statPlayerId));
		if (!player) {
			const index = _playerStats.findIndex(({ playerId }) => String(playerId) === String(statPlayerId));
			if (index > -1) {
				_playerStats.splice(index, 1);
			}
		}
	}
	for (const playerId of playerIds) {
		const playerStatIndex = _playerStats.findIndex(
			({ playerId: statPlayerId }) => String(statPlayerId) === String(playerId)
		);
		const playerMatchStat = _playerMatchStats.find(
			({ playerId: statPlayerId }) => String(statPlayerId) === String(playerId)
		);
		if (playerStatIndex === -1) {
			const player = activePlayers.find(({ id }) => String(id) === String(playerId));
			if (player) {
				const newPlayerStat = {
					id: uuid(),
					playerId,
					playerName: player.displayName,
					minutesOnField: !(instatSynced || wyscoutSynced) ? playerMatchStat?.minutesPlayed : null
				};
				_playerStats.push(newPlayerStat);
			}
		} else {
			_playerStats[playerStatIndex] = {
				..._playerStats[playerStatIndex].__data,
				minutesOnField: !(instatSynced || wyscoutSynced) ? playerMatchStat?.minutesPlayed : null
			};
		}
	}
	return _playerStats;
}

const ObjectID = require('mongodb').ObjectID;
const { v4: uuid } = require('uuid');
const moment = require('moment');
const utils = require('./shared');
const axiosLib = require('axios');
const axiosRetry = require('axios-retry');
const https = require('https');
const { InternalError } = require('../../../common/modules/error');
const _ = require('lodash');
const { baseURL, aggregationRules } = require('../../../config/sonra.config.json');
const { retries } = require('../../../config/axiosRetry.config.json');
const SonraAPI = axiosLib.create({
	baseURL,
	httpsAgent: new https.Agent({
		rejectUnauthorized: false
	})
});
axiosRetry(SonraAPI, { retries, retryDelay: axiosRetry.exponentialDelay });

const ENTIRE_SESSION = 'Entire Session';
const IMPORT_SUFFIX = 'SESSION';

module.exports = {
	getSessions: async function (team, date, gdType, players) {
		try {
			const rawSessions = await getFullSession(team, date);
			const sessionsToReturn = rawSessions.map(session => getSessionImport(session, players, team, gdType));
			return sessionsToReturn.filter(({ sessionPlayerData }) => sessionPlayerData.length);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}
};

async function getFullSession({ thirdPartyCredentials }, date) {
	try {
		const bodyObj = JSON.stringify({
			ThirdPartyApiId: thirdPartyCredentials.sonraThirdPartyId,
			sessionDate: moment(date).startOf('day').format('YYYY-MM-DD')
		});
		const response =
			(await SonraAPI.post('/GetFullSession', bodyObj, {
				headers: { 'Content-type': 'application/json' }
			})) || [];
		if (response.data === '') return [];
		if (!Array.isArray(response.data)) response.data = [response.data];
		return response.data;
	} catch (error) {
		throw InternalError(error);
	}
}

function getSessionImport({ sessionDetails, sessionPlayers, sessionName }, players, team, gdType) {
	if (!sessionDetails) return null;
	const { startTime, sessionDate, sessionType } = sessionDetails;
	const nameSession = `${moment(startTime).format('DD/MM/YYYY HH:mm')} ${sessionType || IMPORT_SUFFIX}`;
	const identifier = `${String(team.id)}_${nameSession}`;
	const date = moment(sessionDate).toDate();
	return {
		_id: uuid(),
		teamId: ObjectID(team.id),
		date,
		nameSession,
		identifier,
		gdType,
		sessionPlayerData: getSessionPlayerData(sessionPlayers, date, players, team, sessionType === 'Match Day')
	};
}

function getSessionPlayerData(sessionPlayers, date, players, team, isGame) {
	const fullSessionName = getFullSessionName(team, isGame);
	const sessionsPlayerData = sessionPlayers.map(({ playerDetails, drills }) => {
		const iterproPlayer = getIterproPlayer(players, playerDetails);
		if (!iterproPlayer) return [];
		const [fullSession, currentDrills] = getPartitionedSessions(drills, fullSessionName);
		const aggregated = getAggregatedMainSession(currentDrills.length ? currentDrills : fullSession, isGame);
		// NOTE: if fullSession is not enabled, aggregated session will be the main one
		const toAdd = !fullSession.length
			? [mapSessionPlayerData(aggregated, team, date, iterproPlayer, !fullSession.length)]
			: [];
		return [
			...toAdd,
			...fullSession.map(session => mapSessionPlayerData(session, team, date, iterproPlayer, !!fullSession.length)),
			...currentDrills.map(drill => mapSessionPlayerData(drill, team, date, iterproPlayer, false))
		];
	});
	return _.sortBy(
		_.flatten(sessionsPlayerData).filter(x => x),
		'splitName'
	);
}

function getIterproPlayer(players, playerDetails) {
	const { displayName, customPlayerId } = playerDetails;
	return players.find(
		({ sonraId }) => sonraId && (String(sonraId) === displayName || String(sonraId) === customPlayerId)
	);
}

function getPartitionedSessions(drills, fullSessionName) {
	const actualSessions = drills.filter(({ drillName }) => !drillName.includes(ENTIRE_SESSION));
	return _.partition(
		actualSessions,
		({ drillName }) => drillName.toLowerCase().trim() === fullSessionName.toLowerCase().trim()
	);
}

function getAggregatedMainSession(drills, isGame) {
	const drillKpis = drills.map(({ drillKpi }) => drillKpi);
	return {
		...drills[0],
		drillName: isGame ? 'Net Full Match' : 'Net Full Session',
		drillKpi: Object.entries(aggregationRules).reduce(
			(acc, [metric, rule]) => ({
				...acc,
				[metric]: getAggregatedValue(drillKpis, metric, rule)
			}),
			{}
		)
	};
}

// I use the metric rule as a lodash function, for calculating the aggregated value of that metric, for each drill
function getAggregatedValue(drillKpis, metric, rule) {
	const aggregated = _[rule](drillKpis.map(element => element[metric]));
	return aggregated !== undefined && isNaN(aggregated) ? undefined : aggregated;
}

function mapSessionPlayerData(drill, team, date, { displayName: playerName, id: playerId }, isMain = false) {
	let session = {
		_id: uuid(),
		teamId: ObjectID(team.id),
		date,
		playerId: ObjectID(playerId),
		playerName,
		splitStartTime: moment(drill.startTime).toDate(),
		splitEndTime: moment(drill.endTime).toDate(),
		splitName: getSplitName(drill, team),
		mainSession: isMain || getMainSession(drill, team),
		complete: false,
		dirty: false,
		rpe: null,
		rpeTl: null,
		...Object.entries(drill.drillKpi).reduce(
			(acc, [metric, value]) => ({
				...acc,
				[`_${metric}`]: value
			}),
			{}
		)
	};

	// gpsprovidermappings
	session = {
		...session,
		...utils.mapDefaultMetrics(session, team),
		duration: drill.drillKpi.totalTime / 60
	};

	// const foundAlready = sessionPlayers.find(
	// 	({ playerName, splitName }) =>
	// 		playerName === newSession.playerName && splitName === newSession.splitName
	// );
	// if (!foundAlready) sessionPlayers.push(newSession);
	return session;
}

function getFullSessionName({ thirdPartyCredentials }, isGame) {
	return isGame ? thirdPartyCredentials.sonraGameName : thirdPartyCredentials.sonraDrillName;
}

function getSplitName({ drillName }, { thirdPartyCredentials, mainSplitName, mainGameName }) {
	const split = thirdPartyCredentials.sonraDrillName.toLowerCase().trim();
	const game = thirdPartyCredentials.sonraGameName.toLowerCase().trim();
	switch (drillName.toLowerCase().trim()) {
		case split:
		case 'net full training':
			return mainSplitName;
		case game:
		case 'net full match':
			return mainGameName;
		default:
			return drillName;
	}
}

function getMainSession({ drillName }, { thirdPartyCredentials }) {
	return (
		// drillName === 'Net Full Session' ||
		drillName.toLowerCase().trim() === thirdPartyCredentials.sonraDrillName.toLowerCase().trim() ||
		drillName.toLowerCase().trim() === thirdPartyCredentials.sonraGameName.toLowerCase().trim()
	);
}

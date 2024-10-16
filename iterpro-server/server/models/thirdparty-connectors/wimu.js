const { InternalError, AuthorizationError } = require('../../../common/modules/error');
const axiosLib = require('axios');
const axiosRetry = require('axios-retry');
const { sortBy, flatten, omit } = require('lodash');
const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const { v4: uuid } = require('uuid');
const { retries, timeout } = require('../../../config/axiosRetry.config.json');
const { baseURL, ignore, metricsCategories } = require('../../../config/wimu.config.json');
const utils = require('./shared');

let wimuAPI;

const IMPORT_SUFFIX = 'SESSION';

module.exports = {
	getSessions: async function (team, date, gdType, players) {
		console.log(`[WIMU] Getting GPS sessions for team ${team.id} and date ${date}`);
		setBaseUrl();
		try {
			const token = await getToken(team);
			const sessions = await getSessionsForDate(token, team.wimuId, date);
			const sessionsToReturn = [];
			for (const session of sessions) {
				const drillData = flatten(
					await Promise.all(session.sessionTasks.map(drill => getDrillData(token, session.id, drill)))
				);
				const sessionImport = getSessionImport(session, drillData, players, team, gdType);
				sessionsToReturn.push(sessionImport);
			}
			return sessionsToReturn.filter(({ sessionPlayerData }) => sessionPlayerData.length);
		} catch (error) {
			console.error(error);
			throw error;
		}
	},

	getPlayers: async function (team) {
		console.log(`[WIMU] Getting players for team ${team.id}`);
		setBaseUrl();
		try {
			const token = await getToken(team);
			const response = await getRequest(`/players?team=${team.wimuId}&sort=name,asc`, { token });
			const players = response.data || [];
			return sortBy(
				players.map(player => ({
					_id: player.id,
					playerKey: 'wimuId',
					firstName: player.name,
					shortName: `${player.name} ${player.lastName}`,
					middleName: '',
					lastName: player.lastName,
					height: player.height,
					weight: player.weight,
					birthDate: player.birthday
				})),
				({ shortName }) => shortName
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}
};

function getSessionImport(session, drillData, players, team, gdType) {
	if (!session) return null;
	const { start, name } = session;
	const nameSession = `${moment(start).format('DD/MM/YYYY HH:mm')} ${name || IMPORT_SUFFIX}`;
	const identifier = `${String(team.id)}_${nameSession}`;
	const date = moment(start).toDate();
	return {
		_id: uuid(),
		teamId: ObjectID(team.id),
		date,
		nameSession,
		identifier,
		gdType,
		sessionPlayerData: getSessionPlayerData(drillData, date, players, team, name === 'Match Day')
	};
}

function getSessionPlayerData(drillData, date, players, team, isGame) {
	const sessionsPlayerData = drillData.map(drill => {
		const iterproPlayer = getIterproPlayer(players, drill.player);
		if (!iterproPlayer) return [];
		return mapSessionPlayerData(drill, team, date, iterproPlayer);
	});
	return sortBy(
		flatten(sessionsPlayerData).filter(x => x),
		'splitName'
	);
}

function getIterproPlayer(players, playerId) {
	return players.find(({ wimuId }) => wimuId && String(wimuId) === String(playerId));
}

function mapSessionPlayerData(drill, team, date, { displayName: playerName, id: playerId }) {
	const metrics = metricsCategories.reduce((acc, category) => {
		const omitted = omit(drill[category], ignore);
		const categorized = Object.entries(omitted).reduce(
			(acc, [key, values]) => ({ ...acc, [`${category}_${key}`]: values }),
			{}
		);
		return { ...acc, ...categorized };
	}, {});
	let session = {
		_id: uuid(),
		teamId: ObjectID(team.id),
		date,
		playerId: ObjectID(playerId),
		playerName,
		splitStartTime: moment(drill.start).toDate(),
		splitEndTime: moment(drill.end).toDate(),
		splitName: getSplitName(drill, team),
		mainSession: getMainSession(drill, team),
		complete: false,
		dirty: false,
		rpe: null,
		rpeTl: null,
		...metrics
	};

	// gpsprovidermappings
	session = {
		...session,
		...utils.mapDefaultMetrics(session, team)
	};

	return session;
}

function getSplitName({ task }, { mainSplitName, mainGameName }) {
	switch (task.toLowerCase().trim()) {
		case mainSplitName:
		case 'Session':
			return mainSplitName;
		case mainGameName:
		case 'Game':
			return mainGameName;
		default:
			return task;
	}
}

function getMainSession({ task }, { mainSplitName, mainGameName }) {
	return (
		task.toLowerCase().trim() === mainSplitName.toLowerCase().trim() ||
		task.toLowerCase().trim() === mainGameName.toLowerCase().trim()
	);
}

async function getSessionsForDate(token, wimuId, date) {
	const startTimestamp = moment(date).startOf('day').valueOf();
	const endTimestamp = moment(date).endOf('day').valueOf();
	const response = await getRequest(
		`/sessions?team=${wimuId}&start=${startTimestamp}&end=${endTimestamp}&sort=start,desc&limit=5`,
		{
			token
		}
	);
	return response.data || [];
}

async function getDrillData(token, sessionId, drill) {
	const response = await getRequest(`/informs?session=${sessionId}&task=${drill}`, { token });
	return response.data || [];
}

async function getToken(team) {
	const { wimuUsername: username, wimuPassword: password } = getCredentials(team);
	const response = await wimuAPI.post('/login', { username, password });
	if (response.data.Token === 'Invalid') throw AuthorizationError('Wrong Wimu API Credentials');
	return response.data.Authorization;
}

async function getRequest(url, { token, encode }) {
	return await wimuAPI.get(encode ? encodeURI(url) : url, {
		headers: { Authorization: `${token}`, 'Content-type': 'application/json' }
	});
}

// async function postRequest(url, body, { token, encode }) {
// 	return await wimuAPI.post(encode ? encodeURI(url) : url, body, {
// 		headers: { Authorization: `${token}`, 'Content-type': 'application/json' }
// 	});
// }

function getCredentials({ thirdPartyCredentials }) {
	if (!thirdPartyCredentials || !thirdPartyCredentials?.wimuUsername || !thirdPartyCredentials?.wimuPassword)
		throw InternalError('Wimu credentials not set');
	return thirdPartyCredentials;
}

function setBaseUrl() {
	wimuAPI = axiosLib.create({ baseURL });
	axiosRetry(wimuAPI, { timeout, retries, retryDelay: axiosRetry.exponentialDelay });
}

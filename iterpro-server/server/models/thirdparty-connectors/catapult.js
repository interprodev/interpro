const axiosLib = require('axios');
const axiosRetry = require('axios-retry');
const { isEmpty, sortBy } = require('lodash');
const { ObjectID } = require('mongodb');
const moment = require('moment');
const { v4: uuid } = require('uuid');

const { mapDefaultMetrics } = require('./shared');
const { timeout } = require('../../../config/axiosRetry.config.json');
const { InternalError } = require('../../../common/modules/error');

let catapultAPI;

module.exports = {
	getSessions: async function (team, date, gdType, players) {
		console.log(`[CATAPULT] Getting GPS sessions for team ${team.id} and date ${date}`);
		setBaseUrl(team);
		let sessionsToReturn = [];
		try {
			const token = getToken(team);
			const metricsToKeep = team._gpsProviderMapping.rawMetrics.map(({ name }) => name);
			const allRawSessions = await getTeamRawSessions(date, token);
			const rawSessions = allRawSessions.filter(
				({ owner }) => owner.name === team.thirdPartyCredentials?.catapultTeamName
			);
			for (const { start_time, id, tags } of rawSessions) {
				const isGame = tags.includes(team.thirdPartyCredentials?.catapultGameTag);
				const sessionDate = moment.unix(start_time).utc().toDate();
				const nameSession = `${moment(sessionDate).format('DD/MM/YYYY HH:mm')} - ${isGame ? 'GAME' : 'SESSION'}`;
				const sessionImport = {
					_id: uuid(),
					teamId: ObjectID(team.id),
					date: moment(sessionDate).toDate(),
					identifier: `${String(team.id)}_${nameSession}`,
					nameSession,
					gdType
				};
				const sessionPlayerData = [];
				/* NOTE:
					I always request the annotations stats (= the man split manually done by the user).
					I also request the aggregated data (= computed by Catapult)
					If the user has a Full Activity Name set, then the annotations stats are set as the main splits. Otherwise the aggregated ones will be the main ones.
					Also, if the annotations stats are empty (even if the Full Activty Name is set), then the aggregated ones will be the main.
				*/
				const annotationsSessions = await getAnnotationsStats(String(id), token);
				const aggregatedSessions = await getAggregatedStats(String(id), token);
				const drillSessions = await getDrillStats(String(id), token);

				if (isEmpty(annotationsSessions)) {
					aggregatedSessions.forEach(session => {
						session.period_name = isGame ? String(team.mainGameName) : String(team.mainSplitName);
					});
				} else {
					annotationsSessions.forEach(session => {
						session.period_name = isGame ? String(team.mainGameName) : String(team.mainSplitName);
					});
					aggregatedSessions.forEach(session => {
						session.period_name = isGame ? 'Net Full Game' : 'Net Full Training';
					});
				}

				for (const session of [...annotationsSessions, ...aggregatedSessions, ...drillSessions]) {
					const linkedPlayer = players.find(({ catapultId }) => String(catapultId) === String(session.athlete_id));
					if (linkedPlayer) {
						let sessionPlayer = {
							_id: uuid(),
							playerId: ObjectID(linkedPlayer.id),
							playerName: linkedPlayer.displayName,
							teamId: ObjectID(team.id),
							date: sessionImport.date,
							complete: false,
							dirty: false,
							mainSession: false,
							splitStartTime: moment.unix(session.start_time).utc().toDate(),
							splitEndTime: moment.unix(session.end_time).utc().toDate(),
							splitName: session.period_name,
							rpe: null,
							rpeTl: null
						};

						if (sessionPlayer.splitName === team.mainSplitName || sessionPlayer.splitName === team.mainGameName) {
							sessionPlayer.mainSession = true;
						}
						sessionPlayer.duration = moment(sessionPlayer.splitEndTime).diff(sessionPlayer.splitStartTime, 'minutes');

						// catapult metrics
						delete session.errors;
						for (const metricKey in session) {
							if (metricsToKeep.includes(metricKey)) sessionPlayer[metricKey] = session[metricKey];
						}

						// default metrics mapping
						sessionPlayer = {
							...sessionPlayer,
							...mapDefaultMetrics(sessionPlayer, team)
						};

						const foundAlready = sessionPlayerData.find(
							({ playerName, splitName }) =>
								playerName === sessionPlayer.playerName && splitName === sessionPlayer.splitName
						);
						if (!foundAlready) sessionPlayerData.push(sessionPlayer);
					}
				}
				sessionImport.sessionPlayerData = sessionPlayerData;
				sessionsToReturn.push(sessionImport);
			}
			sessionsToReturn = sessionsToReturn.filter(({ sessionPlayerData }) => !isEmpty(sessionPlayerData));
			return sessionsToReturn;
		} catch (error) {
			console.error(error);
			if (error.response.status === 401)
				throw InternalError('Authentication Error: check if Catapult Auth Token is correct');
			else throw InternalError(error);
		}
	},

	getPlayers: async function (team) {
		console.log(`[CATAPULT] Getting players for team ${team.id}`);
		setBaseUrl(team);
		const token = getToken(team);
		try {
			const response = await getRequest('/athletes', { token });
			const players = response.data || [];
			return sortBy(
				players.map(({ id, first_name, last_name }) => ({
					_id: id,
					playerKey: 'catapultId',
					firstName: first_name,
					shortName: `${first_name} ${last_name}`,
					middleName: '',
					lastName: last_name,
					height: '',
					weight: '',
					birthDate: ''
				})),
				el => el.shortName
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}
};

async function getTeamRawSessions(date, token) {
	const dateFrom = moment(date).startOf('day').utc().unix();
	const dateTo = moment(date).endOf('day').utc().unix();
	const response = await getRequest(`/activities?startTime=${dateFrom}&endTime=${dateTo}&sort=start_time`, { token });
	return response.data || [];
}

// we group by period, the by athlete for obtaining the individual drill data for each player
async function getDrillStats(activityId, token) {
	const body = {
		filters: [
			{
				name: 'activity_id',
				comparison: '=',
				values: [activityId]
			}
		],
		sorting: ['start_time'],
		group_by: ['period', 'athlete']
	};
	return await getStats(body, token);
}

// we group by athlete for obtaining the aggregated data of each drill, on the entire activity
async function getAggregatedStats(activityId, token) {
	const body = {
		filters: [
			{
				name: 'activity_id',
				comparison: '=',
				values: [activityId]
			}
		],
		group_by: ['athlete'],
		source: 'cached_stats'
	};
	return await getStats(body, token);
}

// we request the annotations stats
async function getAnnotationsStats(activityId, token) {
	const body = {
		filters: [
			{
				name: 'activity_id',
				comparison: '=',
				values: [activityId]
			}
		],
		group_by: ['athlete'],
		source: 'annotation_stats'
	};
	return await getStats(body, token);
}

async function getStats(body, token) {
	try {
		const response = await postRequest('/stats', body, { token });
		return response.data || [];
	} catch (error) {
		console.error(error);
		return [];
	}
}

async function getRequest(url, { token, encode }) {
	return await catapultAPI.get(encode ? encodeURI(url) : url, {
		headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
	});
}

async function postRequest(url, body, { token, encode }) {
	return await catapultAPI.post(encode ? encodeURI(url) : url, body, {
		headers: { Authorization: `Bearer ${token}`, 'Content-type': 'application/json' }
	});
}

function getToken({ thirdPartyCredentials }) {
	if (!thirdPartyCredentials) throw InternalError('Catapult credentials not set');
	if (!thirdPartyCredentials.catapultLongLivedToken) throw InternalError('Catapult auth token not found');
	return thirdPartyCredentials.catapultLongLivedToken;
}

function setBaseUrl({ thirdPartyCredentials }) {
	const baseURL = thirdPartyCredentials?.catapultBaseUrl || baseURL;
	catapultAPI = axiosLib.create({ baseURL });
	axiosRetry(catapultAPI, { timeout, retries: 3, retryDelay: axiosRetry.exponentialDelay });
}

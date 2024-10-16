const { ObjectID } = require('mongodb');
const moment = require('moment');
const { v4: uuid } = require('uuid');
const axiosRetry = require('axios-retry');
const axiosLib = require('axios');
const { isEmpty, sortBy } = require('lodash');
const qs = require('qs');
const { retries, timeout } = require('../../../config/axiosRetry.config.json');
const { baseURL } = require('../../../config/fieldwiz.config.json');
const utils = require('./shared');

let FieldwizApi = axiosLib.create({ baseURL });
axiosRetry(FieldwizApi, { timeout, retries, retryDelay: axiosRetry.exponentialDelay });

const fieldwiz = (module.exports = {
	setBaseUrl: function (team) {
		const baseURL = team.thirdPartyCredentials ? team.thirdPartyCredentials.fieldwizBaseUrl : null;

		if (baseURL) {
			FieldwizApi = axiosLib.create({ baseURL });
			axiosRetry(FieldwizApi, { timeout, retries, retryDelay: axiosRetry.exponentialDelay });
		} else {
			throw Error('[Fieldwiz.setBaseUrl] No Base URL provided!');
		}
	},

	getRequest: async function (url, { token, encode, team }) {
		if (team && !token) {
			token = await fieldwiz.getToken(team);
		}
		return await FieldwizApi.get(encode ? encodeURI(url) : url, {
			headers: { Authorization: 'Bearer ' + token, 'Content-type': 'application/json' }
		});
	},
	postRequest: async function (url, body, { token, encode }) {
		return await FieldwizApi.post(encode ? encodeURI(url) : url, body, {
			headers: { Authorization: 'Bearer ' + token, 'Content-type': 'application/json' }
		});
	},
	getSessions: async function (team, date, gdType, players) {
		let sessionsToReturn = [];
		try {
			const token = await fieldwiz.getToken(team);
			const rawSessions = await fieldwizActivities(date, token);
			const importSuffix = ' SESSION';
			const teamId = ObjectID(team.id.toString());
			let sessImportStartString, sessionImport, nameSession;
			for (const activity of rawSessions) {
				sessImportStartString = activity.date + ' ' + activity.startTime;
				nameSession = moment(sessImportStartString, 'DD/MM/YYYY HH:mm').format('DD/MM/YYYY HH:mm:ss') + importSuffix;
				sessionImport = {
					_id: uuid(),
					gdType,
					fieldwizId: activity.uuid,
					teamId,
					date: moment(activity.date).toDate(),
					nameSession,
					// identifier da settare sul client
					identifier: teamId.toString() + '_' + nameSession
				};
				const timeframes = await fieldwizTimeframes(activity.id, token);
				const sessionPlayerData = [];
				let linkedPlayer, newPlayerSession, metricsObj, foundAlready;
				for (const timeFrame of timeframes) {
					linkedPlayer = players.find(({ fieldwizId }) => fieldwizId === timeFrame.athlete);
					if (linkedPlayer) {
						newPlayerSession = createFieldwizPlayerSession(sessionImport.date, linkedPlayer, timeFrame, teamId);
						// FIXME: non abbiamo una sessione di test con i timeframes quindi questa parte è ipotizzata
						const splitName = timeFrame.params.splitName;
						newPlayerSession.mainSession = splitName === team.thirdPartyCredentials.fieldiwzSplitName;
						newPlayerSession.splitName = newPlayerSession.mainSession ? team.mainSplitName : splitName;

						foundAlready = sessionPlayerData.find(
							({ playerName, splitName }) =>
								playerName === newPlayerSession.playerName && splitName === newPlayerSession.splitName
						);
						if (!foundAlready) {
							metricsObj = await fieldwizComputedData(timeFrame.id, token);
							for (const kpiKey in metricsObj) {
								console.log(kpiKey, '->', metricsObj[kpiKey]);
								newPlayerSession[kpiKey] = metricsObj[kpiKey];
							}
							// gpsprovidermappings
							newPlayerSession = {
								...newPlayerSession,
								...utils.mapDefaultMetrics(newPlayerSession, team)
							};
							sessionPlayerData.push(newPlayerSession);
						}
					}
				}
				sessionImport.sessionPlayerData = sessionPlayerData;
				sessionsToReturn.push(sessionImport);
			}
			sessionsToReturn = sessionsToReturn.filter(({ sessionPlayerData }) => !isEmpty(sessionPlayerData));
		} catch (error) {
			console.error(error);
			sessionsToReturn = [];
		}

		return sessionsToReturn;
	},

	getPlayers: async function (team) {
		try {
			const response = await fieldwiz.getRequest('/api/athletes/', { team });
			const players = response.data ? response.data : [];

			return sortBy(
				players.map(({ athlete_profile }) => ({
					_id: players.id,
					playerKey: 'fieldwizId',
					firstName: athlete_profile.first_name,
					shortName: `${athlete_profile.first_name} ${athlete_profile.last_name}`,
					middleName: '',
					lastName: athlete_profile.last_name,
					height: athlete_profile.height,
					weight: athlete_profile.weight,
					birthDate: athlete_profile.birth_date
				})),
				el => el.shortName
			);
		} catch (error) {
			console.error(`[FIELDWIZ] ERROR while retrieving players for team ${team.id}`);
			throw error;
		}
	},

	getToken: async function (team) {
		fieldwiz.setBaseUrl(team);
		const username =
			team.thirdPartyCredentials && team.thirdPartyCredentials.fieldwizUsername
				? team.thirdPartyCredentials.fieldwizUsername
				: null;
		const password =
			team.thirdPartyCredentials && team.thirdPartyCredentials.fieldwizPassword
				? team.thirdPartyCredentials.fieldwizPassword
				: null;
		const clientId =
			team.thirdPartyCredentials && team.thirdPartyCredentials.fieldwizClientId
				? team.thirdPartyCredentials.fieldwizClientId
				: null;
		const clientSecret =
			team.thirdPartyCredentials && team.thirdPartyCredentials.fieldwizClientSecret
				? team.thirdPartyCredentials.fieldwizClientSecret
				: null;
		if (username && password && clientId && clientSecret) {
			try {
				const body = qs.stringify({
					username,
					password,
					client_id: clientId,
					client_secret: clientSecret,
					scope: 'all',
					grant_type: 'password'
				});
				const response = await FieldwizApi.post('/oauth2/token/', body, {
					headers: { 'Content-type': 'application/x-www-form-urlencoded' }
				});
				return response.data && response.data.access_token ? response.data.access_token : null;
			} catch (error) {
				console.error(error);
				return null;
			}
		}
	}
});

async function fieldwizActivities(date, token) {
	const url = '/api/activities/';
	try {
		const response = await fieldwiz.getRequest(url, { token });
		const sessionData = response.data ? response.data : null;
		if (sessionData) {
			const dateFrom = moment(date).startOf('day');
			const dateTo = moment(date).endOf('day');
			return sessionData.filter(({ date }) => moment(date).isBetween(dateFrom, dateTo));
		}
	} catch (error) {
		console.error(error);
	}
	return [];
}

async function fieldwizTimeframes(activityId, token) {
	return getSimpleRequest('/api/timeframes?&activity=' + activityId, token);
}

function createFieldwizPlayerSession(date, linkedPlayer, timeFrame, teamId) {
	const splitStartTime = moment(timeFrame.start_time).toDate();
	const splitEndTime = moment(timeFrame.end_time).toDate();
	const playerSession = {
		_id: uuid(),
		dirty: false,
		date,
		playerId: ObjectID(linkedPlayer.id.toString()),
		playerName: linkedPlayer.displayName,
		splitStartTime,
		splitEndTime,
		duration: moment(splitEndTime).diff(splitStartTime, 'minutes'),
		rpe: null,
		rpeTl: null,
		complete: false,
		teamId
	};
	return playerSession;
}

async function fieldwizComputedData(timeframeId, token) {
	return getSimpleRequest('/api/timeframes/' + timeframeId + '/computed/', token);
}

async function getSimpleRequest(url, token) {
	try {
		const response = await fieldwiz.getRequest(url, { token });
		return response.data ? response.data : [];
	} catch (error) {
		console.error(error);
	}
	return [];
}

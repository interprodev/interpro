const ObjectID = require('mongodb').ObjectID;
const { v4: uuid } = require('uuid');
const moment = require('moment');
const qs = require('qs');
const utils = require('./shared');
const axiosLib = require('axios');
const axiosRetry = require('axios-retry');
const https = require('https');
const { sortBy } = require('lodash');
const { baseURL } = require('../../../config/statsport.config.json');
const { retries } = require('../../../config/axiosRetry.config.json');

const StatsportAPI = axiosLib.create({
	baseURL,
	httpsAgent: new https.Agent({
		rejectUnauthorized: false
	})
});
axiosRetry(StatsportAPI, { retries, retryDelay: axiosRetry.exponentialDelay });

module.exports = {
	getSessions: async function (team, date, gdType, players) {
		// const statsportIdPlayers = players.filter(y => y.statsportId).map(x => x.statsportId);
		if (team.statsportId) {
			let sessionsToReturn = [];
			try {
				const importSuffix = ' SESSION';
				const rawSessions = await statsportTeamSessions(team, date);
				const rawDrills = await statsportTeamDrills(team, date);
				for (const keySess in rawSessions) {
					let sessData = rawSessions[keySess];
					sessData = sessData && sessData.length > 0 ? sessData[0] : {};
					const sessDetails = sessData['Session Details'];
					const sessionImport = {};
					sessionImport.gdType = gdType;
					// identifier da settare sul client
					sessionImport.teamId = ObjectID(team.id.toString());
					sessionImport._id = uuid();
					sessionImport.date = moment(sessDetails.sessionDate, 'DD/MM/YYYY').toDate();

					const sessImportStartString = sessDetails.sessionDate + ' ' + sessDetails.startTime;
					sessionImport.nameSession =
						moment(sessImportStartString, 'DD/MM/YYYY HH:mm').format('DD/MM/YYYY HH:mm') + importSuffix;
					sessionImport.identifier = sessionImport.teamId
						.toString()
						.concat('_')
						.concat(sessionImport.nameSession.toString());

					const drillsKey = keySess + ' ' + 'Drills';
					const drillsForSessions = rawDrills[drillsKey];

					const drillsPlayers =
						drillsForSessions && 'Session drills' in drillsForSessions ? drillsForSessions['Session drills'] : [];
					const sessionPs = [];
					for (const sp of drillsPlayers) {
						const plDetails = 'Player details' in sp ? sp['Player details'] : null;
						let linkedPlayer = null;
						if (plDetails) {
							linkedPlayer = players.find(
								x => x.statsportId === plDetails.displayName || x.statsportId === plDetails.customPlayerId
							);
							if (linkedPlayer) {
								const drillDetails = sp['Drill Details'];
								let newSessionP = {};
								newSessionP.dirty = false;
								newSessionP.mainSession = false;
								newSessionP.date = sessionImport.date;
								newSessionP.playerId = ObjectID(linkedPlayer.id.toString());
								newSessionP.playerName = linkedPlayer.displayName;
								const splitStartString = sessDetails.sessionDate + ' ' + drillDetails.startTime;
								const splitEndString = sessDetails.sessionDate + ' ' + drillDetails.endTime;

								newSessionP.splitStartTime = moment(splitStartString, 'DD/MM/YYYY HH:mm').toDate();
								newSessionP.splitEndTime = moment(splitEndString, 'DD/MM/YYYY HH:mm').toDate();
								let splitName = drillDetails.drillName;
								if (splitName === team.thirdPartyCredentials.statsportDrillName) {
									// main session
									splitName = team.mainSplitName;
									newSessionP.mainSession = true;
								}
								newSessionP.splitName = splitName;
								newSessionP.duration = moment(newSessionP.splitEndTime).diff(newSessionP.splitStartTime, 'minutes');
								newSessionP.rpe = null;
								newSessionP.rpeTl = null;
								newSessionP.complete = false;
								newSessionP._id = uuid();
								newSessionP.teamId = ObjectID(team.id.toString());
								// statsports fields
								const drillKpis = sp['Drill KPI'];
								for (const kpiKey in drillKpis) {
									newSessionP[kpiKey] = drillKpis[kpiKey];
								}

								// gpsprovidermappings
								newSessionP = {
									...newSessionP,
									...utils.mapDefaultMetrics(newSessionP, team)
								};

								const foundAlready = sessionPs.find(
									({ playerName, splitName }) =>
										playerName === newSessionP.playerName && splitName === newSessionP.splitName
								);
								if (!foundAlready) sessionPs.push(newSessionP);
							}
						}
					}
					sessionImport.sessionPlayerData = sessionPs;
					sessionsToReturn.push(sessionImport);
				}
				sessionsToReturn = sessionsToReturn.filter(x => x.sessionPlayerData && x.sessionPlayerData.length > 0);
				return sessionsToReturn;
			} catch (error) {
				console.error(error);
				return [];
			}
		}
		return [];
	},

	getPlayers: async function (team) {
		try {
			if (team.statsportId) {
				const bodyObj = qs.stringify({
					accessKey: team.thirdPartyCredentials.statsportAccessKey,
					secretKey: team.thirdPartyCredentials.statsportSecretKey,
					teamId: team.statsportId
				});

				const response = await StatsportAPI.post('/player.php', bodyObj, {});
				const players =
					response.data.response && response.data.response.status === 'success' ? response.data['Player details'] : [];
				return sortBy(
					players.map(x => ({
						_id: x.displayName,
						playerKey: 'statsportId',
						firstName: x.firstName,
						shortName: x.firstName + ' ' + x.lastName,
						middleName: '',
						lastName: x.lastName,
						height: '',
						weight: '',
						birthDate: ''
					})),
					el => el.shortName
				);
			} else {
				throw Error('No Statsport ID provided!');
			}
		} catch (error) {
			console.error(`[STATSPORT] ERROR while retrieving players for team ${team.id}`);
			throw error;
		}
	}
};

async function statsportTeamSessions(team, date) {
	const bodyObj = qs.stringify({
		accessKey: team.thirdPartyCredentials.statsportAccessKey,
		secretKey: team.thirdPartyCredentials.statsportSecretKey,
		teamId: team.statsportId,
		sessionId: moment(date).startOf('day').format('DD/MM/YYYY')
	});
	try {
		const response = await StatsportAPI.post('/session.php', bodyObj, {});
		const sessionData = response.data.response && response.data.response.status === 'success' ? response.data : null;
		if (sessionData) {
			delete sessionData['response'];
			return sessionData;
		}
		return [];
	} catch (error) {
		console.error(error);
		return [];
	}
}

async function statsportTeamDrills(team, date) {
	const bodyObj = qs.stringify({
		accessKey: team.thirdPartyCredentials.statsportAccessKey,
		secretKey: team.thirdPartyCredentials.statsportSecretKey,
		teamId: team.statsportId,
		sessionId: moment(date).startOf('day').format('DD/MM/YYYY')
	});
	try {
		const response = await StatsportAPI.post('/drill.php', bodyObj, {});
		const drillData = response.data.response && response.data.response.status === 'success' ? response.data : null;
		if (drillData) {
			delete drillData['response'];
			return drillData;
		}
		return [];
	} catch (error) {
		console.error(error);
		return [];
	}
}

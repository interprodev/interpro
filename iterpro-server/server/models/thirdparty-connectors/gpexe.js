const ObjectID = require('mongodb').ObjectID;
const { v4: uuid } = require('uuid');
const { flatten, sortBy, omit } = require('lodash');
const moment = require('moment-timezone');
const qs = require('qs');
const axiosLib = require('axios');
const axiosRetry = require('axios-retry');
const utils = require('./shared');
const { UnprocessableEntityError, NotFoundError } = require('../../../common/modules/error');
const { retries, timeout } = require('../../../config/axiosRetry.config.json');
const { fallbackBaseURL } = require('../../../config/gpexe.config.json');
let GpexeAPI = axiosLib.create({ baseURL: fallbackBaseURL });
axiosRetry(GpexeAPI, { timeout, retries, retryDelay: axiosRetry.exponentialDelay });

let timezone = null;

const gpexe = (module.exports = {
	setBaseUrl: function (team) {
		const baseURL = team.thirdPartyCredentials?.gpexeBaseUrl || null;
		if (baseURL) {
			GpexeAPI = axiosLib.create({ baseURL });
			axiosRetry(GpexeAPI, { timeout, retries, retryDelay: axiosRetry.exponentialDelay });
		} else {
			throw Error('[GPEXE]: No Base URL provided!');
		}
	},

	getSessions: async function (team, date, gdType, players, seasons) {
		console.time('sessionsGpexe');
		try {
			gpexe.setBaseUrl(team);
			const seasonSelected = utils.seasonAtDate(seasons, date);
			const selectedGpexeId = getGpexeId(team, seasonSelected);
			const token = await gpexe.getToken(team);

			console.log(`[GPEXE] Getting sessions for team ${team.gpexeId} and date ${moment(date).format('DD/MM/YYYY')}`);
			const teamSessions = await gpexeTeamSessions(selectedGpexeId, date, token);

			// all the main team sessions
			const gpexeCategories = getGpexeCategories(team, seasonSelected);
			const gpexeGameCategories = getGpexeGameCategories(team, seasonSelected);
			const mainTrainingSessions = teamSessions
				.filter(({ category_name }) => gpexeCategories.includes(category_name.toLowerCase()))
				.map(session => ({
					...session,
					splitName: team.mainSplitName
				}));
			const mainGameSessions = teamSessions
				.filter(({ category_name }) => gpexeGameCategories.includes(category_name.toLowerCase()))
				.map(session => ({
					...session,
					splitName: team.mainGameName
				}));
			const mainSessions = sortBy([...mainTrainingSessions, ...mainGameSessions], 'start_timestamp');
			console.log(`[GPEXE] Found ${mainSessions.length} team sessions`);

			// create a Session Import Data for each main team session
			const sessionsImportDataPromise = mainSessions.map(mainSession =>
				getSessionImportData(mainSession, teamSessions, players, team, seasonSelected, gdType, token)
			);
			const sessionsImportData = await Promise.all(sessionsImportDataPromise);

			return sessionsImportData.filter(({ sessionPlayerData }) => sessionPlayerData && sessionPlayerData.length > 0);
		} catch (e) {
			console.error(e);
			throw e;
		} finally {
			timezone = null;
			console.timeEnd('sessionsGpexe');
		}
	},

	getToken: async function (team) {
		if (team.thirdPartyCredentials) {
			const username = team.thirdPartyCredentials.gpexeUsername;
			const password = team.thirdPartyCredentials.gpexePassword;
			if (username && password) {
				const bodyObj = qs.stringify({ username, password });
				const response = await GpexeAPI.post('/api-token-auth/', bodyObj, {
					headers: { 'Content-type': 'application/x-www-form-urlencoded' }
				});
				const token = response.data?.token || null;
				console.debug('[GPEXE] Token: ' + token);
				if (!token) {
					throw UnprocessableEntityError(
						'[GPEXE] ERROR No token received: wrong credentials. Please check with your Iterpro Account Manager'
					);
				}
				return token;
			} else {
				throw UnprocessableEntityError(
					'[GPEXE] ERROR No username or password provided. Please check with your Iterpro Account Manager'
				);
			}
		} else {
			throw UnprocessableEntityError(
				'[GPEXE] ERROR No credentials set for this team. Please check with your Iterpro Account Manager'
			);
		}
	},

	getPlayers: async function (team, { thirdPartyCredentials }) {
		try {
			console.log(`[GPEXE] Getting players for team ${team.id}`);
			gpexe.setBaseUrl(team);
			const token = await gpexe.getToken(team);
			const gpexeId = thirdPartyCredentials?.gpexeId || team.gpexeId;
			const response = await GpexeAPI.get(`/api/athlete?team=${gpexeId}`, {
				headers: { Authorization: 'Token ' + token, 'Content-type': 'application/x-www-form-urlencoded' }
			});
			const players = response.data || [];
			return sortBy(
				players.map(players => ({
					_id: players.id,
					playerKey: 'gpexeId',
					firstName: players.first_name,
					shortName: players.name,
					middleName: '',
					lastName: players.last_name,
					height: players.height,
					weight: players.weight,
					birthDate: players.birthdate
				})),
				el => el.shortName
			);
		} catch (error) {
			console.error(`[GPEXE] ERROR while retrieving players for team ${team.id}`);
			throw error;
		}
	}
});

// wrap data from gpexe into Session Import Data
async function getSessionImportData(mainSession, teamSessions, players, team, season, gdType, token) {
	const sessionImport = {
		_id: uuid(),
		teamId: ObjectID(String(team.id)),
		gpexeId: mainSession.id,
		nameSession: mainSession.name,
		gdType
	};

	const templateId = getGpexeTemplateId(team, season);
	const categoriesLink = getGpexeCategoriesLink(team, season);
	const childCategory = categoriesLink.find(({ father }) => father === mainSession.category_name)
		? categoriesLink.find(({ father }) => father === mainSession.category_name).child
		: [];

	// get the child (aka "drills") sessions for each team session
	const drillSessions = teamSessions.filter(session => isDrillSession(session, mainSession, childCategory));

	console.log(
		`[GPEXE] Doing team session ${mainSession.id}, with ${drillSessions.length} drill sessions [${drillSessions
			.map(({ id }) => id)
			.join(', ')}]`
	);

	const templateData$ = [getTemplateForMain(mainSession.id, templateId, token)];

	const sameSessions = await getSameSessions(mainSession.id, templateId, childCategory, token);
	if (sameSessions.length > 0) {
		templateData$.push(
			...sameSessions.map(sameSession => getTemplateDataForDrill(sameSession.teamsession, sameSession, token))
		);
	}

	const playersData = flatten(await Promise.all(templateData$));

	if (!timezone) timezone = await getSessionTimezone(flatten(playersData)[0].templateData.players, token);

	const sessionPlayers = flatten(
		playersData.map(data => getSessionsPlayerData(data, timezone, sessionImport, players, team, mainSession.splitName))
	);

	sessionImport.date = moment(mainSession.start_timestamp).subtract(timezone, 'minutes').toDate();
	sessionImport.sessionPlayerData = sessionPlayers;

	return sessionImport;
}

// get template data for main session
async function getTemplateForMain(sessionId, templateId, token) {
	console.log(`[GPEXE] Getting template data for team session ${sessionId}`);
	const session$ = gpexeTeamSession(sessionId, null, token);
	const templateData$ = gpexeTeamSessionTemplateData(sessionId, templateId, null, token);
	const [session, templateData] = await Promise.all([session$, templateData$]);
	const sessionPlayers = [templateData];
	for (let i = 0; i < session.drills_count; i++) {
		const drillSessions = await gpexeTeamSession(sessionId, i, token);
		if (drillSessions) {
			const drillTemplateData = await gpexeTeamSessionTemplateData(drillSessions.id, templateId, null, token);
			drillTemplateData.drill = i;
			sessionPlayers.push(drillTemplateData);
		}
	}
	return sessionPlayers.map(x => ({ session: session, templateData: x, isChild: false }));
}

// get template data for a drill session
async function getTemplateDataForDrill(sessionId, templateData, token) {
	console.log(`[GPEXE] Getting template data for drill session ${sessionId}`);
	const session = await gpexeTeamSession(sessionId, templateData.drill_index, token);
	return [{ session, templateData, isChild: true }];
}

async function getSameSessions(sessionId, templateId, childCategory, token) {
	console.log(`[GPEXE] Getting same time sessions for team session ${sessionId}`);
	const sameTimeSessions = await getSameTimeTemplateDate(sessionId, templateId, token);
	return sortBy(
		sameTimeSessions.filter(
			({ teamsession, category_name, drill_index }) =>
				teamsession !== sessionId && category_name == childCategory && drill_index != null
		),
		'drill_index'
	);
}

// get timezone - needed for session player data
// timezone is only inserted in the athlete track of a session
async function getSessionTimezone(data, token) {
	console.log(`[GPEXE] Getting timezone`);
	const playerObj = Object.values(data)[0];
	const moreAthlete = await gpexeAthleteSessionMore(playerObj.athlete_session_id, token);
	const trackInfo = moreAthlete.track_id ? await gpexeTrack(moreAthlete.track_id, token) : null;
	const timezone = trackInfo?.timezone || null;
	const timezoneOffset = moment.tz(timezone).format('Z');
	const timezoneOffsetMinutes = moment.duration(timezoneOffset, 'hours').asMinutes();
	return timezoneOffsetMinutes;
}

// create Session Player Data collection
function getSessionsPlayerData({ session, templateData, isChild }, timezone, sessionImport, players, team, splitName) {
	const activePlayerStats = Object.values(templateData.players).filter(stat =>
		players.map(({ gpexeId }) => gpexeId).includes(stat.athlete.id)
	);
	const sessionPlayers = activePlayerStats.map(stat =>
		getSingleSessionPlayerData(stat, session, templateData, isChild, timezone, sessionImport, players, team, splitName)
	);
	return sessionPlayers;
}

// wrap player data from gpexe into Session Player Data
function getSingleSessionPlayerData(
	templateDataForPlayer,
	session,
	templateData,
	isChild,
	timezone,
	sessionImport,
	players,
	team,
	splitName
) {
	const player = players.find(({ gpexeId }) => gpexeId === templateDataForPlayer.athlete.id);
	const templateMetrics = omit(
		Object.entries(templateDataForPlayer).reduce((acc, [label, { value }]) => ({ ...acc, [label]: value || null }), {}),
		['athlete', 'athlete_session_id']
	);
	const stats = {
		gpexeId: templateDataForPlayer.athlete_session_id,
		...templateMetrics
	};
	if (player) {
		const id = uuid();
		let sessionPlayerData = {
			...stats,
			id: id,
			_id: id,
			teamId: sessionImport.teamId,
			playerId: ObjectID(String(player.id)),
			playerName: player.displayName,
			dirty: false,
			mainSession: false,
			complete: false,
			date: moment(session.start_timestamp).subtract(timezone, 'minutes').toDate(),
			splitStartTime: moment(session.start_timestamp).subtract(timezone, 'minutes').toDate(),
			splitEndTime: moment(session.end_timestamp).subtract(timezone, 'minutes').toDate(),
			total_distance: templateMetrics.total_distance ? +Number(templateMetrics.total_distance).toFixed(2) : null,
			equivalent_distance: templateMetrics.equivalent_distance
				? +Number(templateMetrics.equivalent_distance).toFixed(2)
				: null,
			average_time: templateMetrics.average_time ? +Number(templateMetrics.average_time).toFixed(2) : null,
			total_seconds: templateMetrics.total_seconds ? +Number(templateMetrics.total_seconds).toFixed(2) : null,
			average_v: templateMetrics.average_v ? +Number(templateMetrics.average_v).toFixed(2) : null,
			average_hr: templateMetrics.average_hr ? +Number(templateMetrics.average_hr).toFixed(2) : null,
			total_energy: templateMetrics.total_energy ? +Number(templateMetrics.total_energy).toFixed(2) : null,
			aerobic_energy: templateMetrics.aerobic_energy ? +Number(templateMetrics.aerobic_energy).toFixed(2) : null,
			anaerobic_energy: templateMetrics.anaerobic_energy ? +Number(templateMetrics.anaerobic_energy).toFixed(2) : null,
			recovery_average_time: templateMetrics.recovery_average_time
				? +Number(templateMetrics.recovery_average_time).toFixed(2)
				: null,
			recovery_average_power: templateMetrics.recovery_average_power
				? +Number(templateMetrics.recovery_average_power).toFixed(2)
				: null,
			average_satprsum: templateMetrics.average_satprsum ? +Number(templateMetrics.average_satprsum).toFixed(2) : null,
			average_hdop: templateMetrics.average_hdop ? +Number(templateMetrics.average_hdop).toFixed(2) : null,
			power_events: templateMetrics.power_events ? +Number(templateMetrics.power_events).toFixed(2) : null,
			equivalent_distance_index: templateMetrics.equivalent_distance_index
				? +Number(templateMetrics.equivalent_distance_index * 100).toFixed(2)
				: null,
			anaerobic_index: templateMetrics.anaerobic_index ? +Number(templateMetrics.anaerobic_index).toFixed(2) : null,
			power_events_total_time: templateMetrics.power_events_total_time
				? +Number(templateMetrics.power_events_total_time).toFixed(2)
				: null,
			power_events_avg_time: templateMetrics.power_events_avg_time
				? +Number(templateMetrics.power_events_avg_time).toFixed(2)
				: null,
			max_v: templateMetrics.max_v ? +Number(templateMetrics.max_v).toFixed(2) : null,
			rpe_duration: templateMetrics.rpe_duration ? +Number(templateMetrics.rpe_duration).toFixed(2) : null,
			rpe: templateMetrics.rpe ? +Number(templateMetrics.rpe).toFixed(2) : null,
			// NOTE: temp fix because the Gpexe API returns this value in m/s while on their platform is km/h. Once they fix it, remove the formula
			max_SPEED: templateMetrics.max_values_speed ? +(Number(templateMetrics.max_values_speed) * 3.6).toFixed(2) : null,
			max_ACC: templateMetrics.max_values_acc ? +Number(templateMetrics.max_values_acc).toFixed(2) : null,
			max_DEC: templateMetrics.max_values_dec ? +Number(templateMetrics.max_values_dec).toFixed(2) : null,
			max_HR: templateMetrics.max_values_cardio ? +Number(templateMetrics.max_values_cardio).toFixed(2) : null,
			average_p: templateMetrics.average_p ? +Number(templateMetrics.average_p).toFixed(2) : null,
			average_power_aer: templateMetrics.average_power_aer
				? +Number(templateMetrics.average_power_aer).toFixed(2)
				: null,
			max_POWER: templateMetrics.max_values_power ? +Number(templateMetrics.max_values_power).toFixed(2) : null,
			active_muscle_load: templateMetrics.active_muscle_load
				? +Number(templateMetrics.active_muscle_load).toFixed(2)
				: null,
			average_active_muscle_power: templateMetrics.average_active_muscle_power
				? +Number(templateMetrics.average_active_muscle_power).toFixed(2)
				: null,
			eccentric_index: templateMetrics.eccentric_index ? +Number(templateMetrics.eccentric_index).toFixed(2) : null,
			walk_time: templateMetrics.walk_time ? +Number(templateMetrics.walk_time).toFixed(2) : null,
			run_distance: templateMetrics.run_distance ? +Number(templateMetrics.run_distance).toFixed(2) : null,
			directional_distance_left: templateMetrics.directional_distance_left
				? +Number(templateMetrics.directional_distance_left).toFixed(2)
				: null,
			directional_distance_right: templateMetrics.directional_distance_right
				? +Number(templateMetrics.directional_distance_right).toFixed(2)
				: null,
			run_energy: templateMetrics.run_energy ? +Number(templateMetrics.run_energy).toFixed(2) : null,
			walk_distance: templateMetrics.walk_distance ? +Number(templateMetrics.walk_distance).toFixed(2) : null,
			walk_energy: templateMetrics.walk_energy ? +Number(templateMetrics.walk_energy).toFixed(2) : null,
			directional_distance_forward: templateMetrics.directional_distance_forward
				? +Number(templateMetrics.directional_distance_forward).toFixed(2)
				: null,
			run_time: templateMetrics.run_time ? +Number(templateMetrics.run_time).toFixed(2) : null,
			directional_distance_backward: templateMetrics.directional_distance_backward
				? +Number(templateMetrics.directional_distance_backward).toFixed(2)
				: null,
			speed_event_count: templateMetrics.speed_events ? +Number(templateMetrics.speed_events).toFixed(2) : null,
			acc_event_count: templateMetrics.acceleration_events
				? +Number(templateMetrics.acceleration_events).toFixed(2)
				: null,
			dec_event_count: templateMetrics.deceleration_events
				? +Number(templateMetrics.deceleration_events).toFixed(2)
				: null,
			event_impacts_count: templateMetrics.event_impacts_count
				? +Number(templateMetrics.event_impacts_count).toFixed(2)
				: null,
			event_jumps_count: templateMetrics.event_jumps_count
				? +Number(templateMetrics.event_jumps_count).toFixed(2)
				: null,
			external_work: templateMetrics.external_work ? +Number(templateMetrics.external_work).toFixed(2) : null,
			ext_work_over: templateMetrics.ext_work_over ? +Number(templateMetrics.ext_work_over).toFixed(2) : null,
			ext_work_over_neg: templateMetrics.ext_work_over_neg
				? +Number(templateMetrics.ext_work_over_neg).toFixed(2)
				: null,
			average_external_power: templateMetrics.average_external_power
				? +Number(templateMetrics.average_external_power).toFixed(2)
				: null,
			ext_work_over_zone0_neg: templateMetrics.ext_work_over_zone0_neg
				? +Number(templateMetrics.ext_work_over_zone0_neg).toFixed(2)
				: null,
			ext_work_over_zone1_neg: templateMetrics.ext_work_over_zone1_neg
				? +Number(templateMetrics.ext_work_over_zone1_neg).toFixed(2)
				: null,
			ext_work_over_zone2_neg: templateMetrics.ext_work_over_zone2_neg
				? +Number(templateMetrics.ext_work_over_zone2_neg).toFixed(2)
				: null,
			ext_work_over_zone0: templateMetrics.ext_work_over_zone0
				? +Number(templateMetrics.ext_work_over_zone0).toFixed(2)
				: null,
			ext_work_over_zone1: templateMetrics.ext_work_over_zone1
				? +Number(templateMetrics.ext_work_over_zone1).toFixed(2)
				: null,
			ext_work_over_zone2: templateMetrics.ext_work_over_zone2
				? +Number(templateMetrics.ext_work_over_zone2).toFixed(2)
				: null,
			tot_mechanical_events: templateMetrics.tot_mechanical_events
				? +Number(templateMetrics.tot_mechanical_events).toFixed(2)
				: null,
			tot_burst_events: templateMetrics.tot_burst_events ? +Number(templateMetrics.tot_burst_events).toFixed(2) : null,
			tot_brake_events: templateMetrics.tot_brake_events ? +Number(templateMetrics.tot_brake_events).toFixed(2) : null,
			relative_speed_events: templateMetrics.relative_speed_events
				? +Number(templateMetrics.relative_speed_events).toFixed(2)
				: null,
			relative_speed: templateMetrics.relative_speed ? +Number(templateMetrics.relative_speed).toFixed(2) : null,
			// rpe: null,
			rpeTl: null
		};
		sessionPlayerData.total_time = sessionPlayerData.average_time
			? +Number(sessionPlayerData.average_time / 60).toFixed(2)
			: null;
		sessionPlayerData.duration = sessionPlayerData.total_time
			? sessionPlayerData.total_time
			: moment(sessionPlayerData.splitEndTime).diff(moment(sessionPlayerData.splitStartTime), 'minutes');

		// repeated fields - otherwise very long code
		const iterproMetrics = [
			'cardio',
			'power',
			'speed',
			'acceleration',
			'deceleration',
			'impactintensity',
			'jumpheight',
			'relativespeed'
		];
		const gpexeMetrics = [
			'heartrate',
			'power',
			'speed',
			'acceleration',
			'deceleration',
			'impactintensity',
			'jumpheight',
			'relativespeed'
		];
		const numbers = [0, 1, 2, 3, 4, 5, 6];
		const kpis = ['distance', 'power', 'energy', 'time', 'events'];
		iterproMetrics.forEach((metric, index) => {
			const stat = gpexeMetrics[index];
			numbers.forEach(number => {
				kpis.forEach(kpi => {
					const metricName = `${metric}_interval_ccd_zone_${number}_${kpi}`;
					const statMetric = `athletesession${stat}zone_${kpi}_${number}`;
					const sensorValue = templateMetrics[statMetric] || null;
					sessionPlayerData[metricName] = sensorValue ? +Number(sensorValue).toFixed(2) : null;
				});
			});
		});

		if (!isChild) {
			sessionPlayerData.mainSession = true;
			sessionImport.nameSession = `${moment(sessionPlayerData.splitStartTime).format('DD/MM/YYYY HH:mm')} ${
				session.category_name
			}`;
			sessionImport.identifier = `${String(sessionImport.teamId)}_${String(sessionImport.nameSession)}`;
		}
		sessionPlayerData.splitName = templateData.tags?.length > 0 ? templateData.tags[0] : splitName;

		// calculate the default metrics for each Session Player Data
		sessionPlayerData = {
			...sessionPlayerData,
			...utils.mapDefaultMetrics(sessionPlayerData, team)
		};

		return sessionPlayerData;
	}
}

// ----- ENDPOINT WRAPPERS -----
async function gpexeTeamSessions(teamId, date, token) {
	const dateFrom = moment(date).startOf('day').format('YYYY-MM-DD HH:mm');
	const dateTo = moment(dateFrom).add(1, 'days').format('YYYY-MM-DD HH:mm');
	const urlSessions = `/api/team_session?team=${teamId}&start_timestamp_gte=${dateFrom}&end_timestamp_lt=${dateTo}`;
	try {
		console.debug(urlSessions);
		const response = await GpexeAPI.get(urlSessions, {
			timeout: 6000000,
			headers: { Authorization: 'Token ' + token, 'Content-type': 'application/x-www-form-urlencoded' }
		});
		return response.data || [];
	} catch (error) {
		console.error(`[GPEXE] ERROR while retrieving team sessions for team ${teamId} and date ${date}`);
		throw error;
	}
}

async function gpexeTeamSession(sessionId, drill, token) {
	const drillParam = `${drill !== null && drill !== undefined ? `?drill=${drill}` : ''}`;
	const urlSessions = `/api/team_session/${sessionId}${drillParam}`;
	try {
		console.debug(urlSessions);
		const response = await GpexeAPI.get(urlSessions, {
			timeout: 6000000,
			headers: { Authorization: 'Token ' + token, 'Content-type': 'application/x-www-form-urlencoded' }
		});
		return response.data || [];
	} catch (error) {
		console.error(`[GPEXE] ERROR while retrieving ${drillParam ? `drill ${drill} for` : ``} team session ${sessionId}`);
		throw error;
	}
}

async function gpexeTeamSessionTemplateData(sessionId, templateId, drill, token) {
	const drillParam = `${drill !== null && drill !== undefined ? `&drill=${drill}` : ''}`;
	const exportParam = `${templateId ? `&export_template=${templateId}` : ''}`;
	const urlSessions = `/api/team_session/${sessionId}/details?format=json${drillParam}${exportParam}`;
	try {
		console.debug(urlSessions);
		const response = await GpexeAPI.get(urlSessions, {
			timeout: 6000000,
			headers: { Authorization: 'Token ' + token, 'Content-type': 'application/x-www-form-urlencoded' }
		});
		return response?.data || null;
	} catch (error) {
		console.error(
			`[GPEXE] ERROR while retrieving template data for team session ${sessionId} ${
				drillParam ? `and drill ${drill} ` : ``
			} ${exportParam ? `with template ${templateId} ` : ``}`
		);
		throw error;
	}
}

async function getSameTimeTemplateDate(sessionId, templateId, token) {
	const exportParam = `${templateId ? `&export_template=${templateId}` : ''}`;
	const urlSessions = `/api/team_session/${sessionId}/details?sameTime&format=json${exportParam}`;
	try {
		console.debug(urlSessions);
		const response = await GpexeAPI.get(urlSessions, {
			timeout: 6000000,
			headers: { Authorization: 'Token ' + token, 'Content-type': 'application/x-www-form-urlencoded' }
		});
		return response?.data || null;
	} catch (error) {
		console.error(
			`[GPEXE] ERROR while retrieving sameTime template data for team session ${sessionId} ${
				exportParam ? `with template ${templateId} ` : ``
			}`
		);
		throw error;
	}
}

async function gpexeAthleteSessionMore(sessionId, token) {
	const urlSessions = `/api/athlete_session/${sessionId}/more`;
	try {
		console.debug(urlSessions);
		const response = await GpexeAPI.get(urlSessions, {
			timeout: 6000000,
			headers: { Authorization: 'Token ' + token, 'Content-type': 'application/x-www-form-urlencoded' }
		});
		return response.data || [];
	} catch (error) {
		console.error(`[GPEXE] ERROR while retrieving advanced metrics for player session ${sessionId}`);
		throw error;
	}
}

async function gpexeTrack(trackId, token) {
	const urlSessions = `/api/track/${trackId}`;
	try {
		console.debug(urlSessions);
		const response = await GpexeAPI.get(urlSessions, {
			timeout: 6000000,
			headers: { Authorization: 'Token ' + token, 'Content-type': 'application/x-www-form-urlencoded' }
		});
		return response.data || null;
	} catch (error) {
		console.error(`[GPEXE] ERROR while retrieving track ${trackId}`);
		throw error;
	}
}

// ----- UTILS -----

function getGpexeId(team, season) {
	const id = season?.thirdPartyCredentials?.gpexeId || team.gpexeId;
	if (!id) {
		throw NotFoundError('No Gpexe ID set for this team.');
	}
	return id;
}

function getGpexeCategories(team, season) {
	const categories = season?.thirdPartyCredentials?.gpexeCategories || team.thirdPartyCredentials.gpexeCategories || [];
	return categories.map(x => x.toLowerCase());
}

function getGpexeGameCategories(team, season) {
	const categories =
		season?.thirdPartyCredentials?.gpexeGameCategories || team.thirdPartyCredentials.gpexeGameCategories || [];
	return categories.map(x => x.toLowerCase());
}

function getGpexeCategoriesLink(team, season) {
	const categoriesLink =
		season?.thirdPartyCredentials?.gpexeSessionCategoriesLink ||
		team.thirdPartyCredentials.gpexeSessionCategoriesLink ||
		[];
	return categoriesLink;
}

function getGpexeTemplateId(team, season) {
	const templateId = season?.thirdPartyCredentials?.gpexeTemplateId || team.thirdPartyCredentials.gpexeTemplateId;
	if (!templateId) {
		throw NotFoundError('No Gpexe Template ID set for this team.');
	}
	return templateId;
}

function isDrillSession(candidate, main, category) {
	return (
		candidate.teamsession !== main.id &&
		candidate.category_name === category &&
		candidate.tags.length > 0 &&
		moment(candidate.start_timestamp).isAfter(moment(main.start_timestamp), 'minute', '[]') &&
		moment(candidate.end_timestamp).isBefore(moment(main.end_timestamp), 'minute', '[]')
	);
}

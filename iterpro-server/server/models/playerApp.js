const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const { v4: uuid } = require('uuid');
const { last, omit, pick, sortBy, partition, mapValues } = require('lodash');
const {
	AuthorizationError,
	BadRequestError,
	InternalError,
	NotFoundError,
	ForbiddenError,
	UnprocessableEntityError
} = require('../../common/modules/error');
const { convert } = require('html-to-text');
const tacticalInfoProvider = require('./thirdparty-connectors/tacticalInfoProvider');
const playerAttributes = [
	{
		value: 'one_to_one_att',
		label: 'profile.attributes.one_to_one',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.one_to_oneAttacking.tooltip'
	},
	{
		value: 'one_to_one_def',
		label: 'profile.attributes.one_to_one',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.one_to_oneDefending.tooltip'
	},
	{
		value: 'determination',
		label: 'profile.attributes.determination',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.determination.tooltip'
	},
	{
		value: 'finishing',
		label: 'profile.attributes.finishing',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.finishing.tooltip'
	},
	{
		value: 'first_touch',
		label: 'profile.attributes.first_touch',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.first_touch.tooltip'
	},
	{
		value: 'heading',
		label: 'profile.attributes.heading',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.heading.tooltip'
	},
	{
		value: 'passing',
		label: 'profile.attributes.passing',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.passing.tooltip'
	},
	{
		value: 'long_throws',
		label: 'profile.attributes.long_throws',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.long_throws.tooltip'
	},
	{
		value: 'marking',
		label: 'profile.attributes.marking',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.marking.tooltip'
	},
	{
		value: 'tackling',
		label: 'profile.attributes.tackling',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.tackling.tooltip'
	},
	{
		value: 'headings',
		label: 'profile.attributes.heading',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.heading.tooltip'
	},
	{
		value: 'anticipation',
		label: 'profile.attributes.anticipation',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.anticipation.tooltip'
	},
	{
		value: 'positioning',
		label: 'profile.attributes.positioning',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.positioning.tooltip'
	},
	{
		value: 'bravery',
		label: 'profile.attributes.bravery',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.bravery.tooltip'
	},
	{
		value: 'leadership',
		label: 'profile.attributes.leadership',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.leadership.tooltip'
	},
	{
		value: 'teamwork',
		label: 'profile.attributes.teamwork',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.teamwork.tooltip'
	},
	{
		value: 'concentration',
		label: 'profile.attributes.concentration',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.concentration.tooltip'
	},
	{
		value: 'flair',
		label: 'profile.attributes.flair',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.flair.tooltip'
	}
];

const CACHE_TTL = 43200;

const { CURRENCY_SYMBOLS: currenciesSymbols } = require('../../common/constants/commonConstants');
const sportsConstants = require('../../common/constants/sports-constants');
const medicalEventUtils = require('../../common/modules/medical-event-utils');
const { getPlayerValue, getPlayerPastValues } = require('../shared/financial-utils');
const { getBonusText, getSingleConditionSimplified } = require('../shared/bonus-string-builder');
const { translateNotification, getLanguage, translate } = require('../shared/translate-utils');
const { getCustomerName } = require('../shared/common-utils');
const { getEventPlayerReport } = require('../shared/player-report.utils');

module.exports = function (PlayerApp) {
	PlayerApp.getToken = async function (req) {
		const token = await PlayerApp.app.models.AccessToken.getDataSource()
			.connector.collection(PlayerApp.app.models.AccessToken.modelName)
			.findOne({ _id: req.headers['authorization'] });
		if (!token) {
			throw AuthorizationError('Auth token not provided');
		}
		return token;
	};

	PlayerApp.simpleLogin = async function (usernameOrEmail, password) {
		try {
			console.log(`[PLAYERAPP] Requested mobile app simple login from ${usernameOrEmail}`);
			const responseToken = await PlayerApp.app.models.CustomerPlayer.loginWithUsernameOrEmail(
				usernameOrEmail,
				password
			);

			if (!responseToken?.userId) throw AuthorizationError('Empty auth token');
			const customer = await PlayerApp.app.models.CustomerPlayer.findById(responseToken.userId);
			if (!customer) {
				console.error('User not found');
				throw InternalError('Invalid credentials');
			}
			const club = await PlayerApp.app.models.Club.findById(customer.clubId);
			if (!club.active) {
				throw new ForbiddenError('The associated Club has been deactivated! Please contact support');
			}

			await customer.updateAttribute('mobileLatestLogin', moment().toDate());

			return {
				token: responseToken.id,
				customerId: customer.id
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.loginPlayer = async function (username, password) {
		try {
			console.log(`[PLAYERAPP] Requested mobile app login from ${username}`);
			const response = { error: null };

			const accessToken = await PlayerApp.app.models.CustomerPlayer.loginWithUsernameOrEmail(username, password);

			if (!accessToken) {
				throw AuthorizationError('Invalid credentials');
			}

			const customer = await PlayerApp.app.models.CustomerPlayer.findById(accessToken.userId);
			if (!customer) {
				console.error('User not found');
				throw InternalError('Invalid credentials');
			}
			const club = await PlayerApp.app.models.Club.findById(customer.clubId);
			if (!club.active) {
				throw new ForbiddenError('The associated Club has been deactivated! Please contact support');
			}
			await customer.updateAttribute('mobileLatestLogin', moment().toDate());
			const player = await PlayerApp.app.models.Player.findOne({
				where: { id: customer.playerId.toString() },
				include: [
					{
						relation: 'injuries',
						scope: {
							fields: [
								'createdBy',
								'issue',
								'date',
								'endDate',
								'admissionDate',
								'system',
								'location',
								'anatomicalDetails',
								'type',
								'reinjury',
								'category',
								'contact',
								'mechanism',
								'occurrence',
								'severity',
								'expectedReturn',
								'diagnosis',
								'notes',
								'surgery',
								'surgeryNotes',
								'treatInstruction',
								'currentStatus',
								'chronicInjuryId',
								'osics'
								// 'statusHistory'
							]
						}
					}
				],
				fields: [
					'id',
					'firstName',
					'lastName',
					'displayName',
					'email',
					'mobilePhone',
					'phone',
					'otherMobile',
					'address',
					'domicile',
					'nationality',
					'birthDate',
					'position',
					'height',
					'weight',
					'position2',
					'position3',
					'downloadUrl',
					'feeFrom',
					'feeTo',
					'wageFrom',
					'wageTo',
					'teamId',
					'injuries',
					'_chronicInjuries',
					'anamnesys'
				]
			});

			const agents = await PlayerApp.app.models.Agent.find({
				where: { teamId: ObjectID(player.teamId), archived: false },
				fields: [
					'id',
					'firstName',
					'lastName',
					'assistedIds',
					'email',
					'mobilePhone',
					'phone',
					'otherMobile',
					'assistedIds'
				]
			});
			player.agents = agents
				.filter(agent => agent.assistedIds.map(x => x.toString()).includes(player.id.toString()))
				.map(x => ({
					name: `${x.firstName} ${x.lastName}`,
					email: x.email,
					phone: x.mobilePhone
				}));

			const staff = await PlayerApp.app.models.Staff.find({
				where: { teamId: ObjectID(player.teamId), archived: false },
				fields: [
					'id',
					'firstName',
					'lastName',
					'email',
					'mobilePhone',
					'phone',
					'otherMobile',
					'address',
					'domicile',
					'downloadUrl',
					'position'
				]
			});
			player.staff = staff.map(x => ({
				name: `${x.firstName} ${x.lastName}`,
				email: x.email,
				phone: x.phone,
				mobilePhone: x.mobilePhone,
				otherMobile: x.otherMobile,
				downloadUrl: x.downloadUrl,
				position: x.position
			}));

			const imageToken = await PlayerApp.app.models.Storage.getToken(customer.clubId.toString());
			response.imageToken = imageToken && imageToken.signature ? imageToken.signature : null;
			// response.player = {
			// 	...player,
			// 	latestMedicalRecord: getLatestMedicalRecords(player.anamnesys)
			// };
			response.player = player;
			response.player.latestMedicalRecord = getLatestMedicalRecords(player.anamnesys);
			response.token = accessToken.id;
			response.tokenTtl = accessToken.ttl;
			response.tokenCreated = accessToken.created;
			response.customerId = customer.id.toString();
			response.isTempPassword = customer.isTempPassword;
			response.customer = customer;
			response.sport = club.sportType;
			response.lineup = sportsConstants[club.sportType].lineup;
			response.bench = sportsConstants[club.sportType].bench;
			delete response.customer.password;
			delete response.customer.eventReminders;
			const dateWellness = moment().startOf('day').toDate();
			const todayStart = moment().startOf('day').toDate();
			const todayEnd = moment().endOf('day').toDate();
			const wellnessExist = await PlayerApp.app.models.Wellness.findOne({
				where: {
					playerId: String(player.id),
					date: dateWellness
				}
			});
			response.wellnessToDo = !wellnessExist;
			try {
				const filter = {
					teamId: ObjectID(player.teamId),
					format: { $in: ['game', 'training'] },
					start: { $gte: todayStart, $lte: todayEnd }
				};
				let evs = await PlayerApp.app.models.Event.getDataSource()
					.connector.collection(PlayerApp.app.models.Event.modelName)
					.find(filter)
					.toArray();
				evs = evs.filter(({ playerIds }) => playerIds.find(id => String(id) === String(player.id)));
				const eventsRpeToDo = [];
				let rpeToDo = false;
				if (evs && evs.length > 0) {
					for (const ev of evs) {
						const foundRpeMissingSession =
							ev._sessionPlayers && ev._sessionPlayers.length > 0
								? ev._sessionPlayers.some(
										({ mainSession, playerId, rpe }) => mainSession && String(playerId) === String(player.id) && !rpe
								  )
								: false;
						if (foundRpeMissingSession) {
							rpeToDo = true;
							eventsRpeToDo.push(ev);
						}
					}
				}
				response.rpeToDo = rpeToDo;
				response.eventsRpeToDo = eventsRpeToDo;
				return response;
			} catch (error) {
				throw InternalError('Error refreshing data');
			}
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.resetPassword = async function (usernameOrEmail) {
		try {
			console.log(`[PLAYERAPP] Requested password reset from ${usernameOrEmail}`);
			return await PlayerApp.app.models.CustomerPlayer.resetPasswordRequest(usernameOrEmail);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.changePassword = async function (oldPassword, newPassword, req) {
		const token = await PlayerApp.getToken(req);
		console.log(`[PLAYERAPP] Requested password change from ${token.userId}`);
		const customer = await PlayerApp.app.models.CustomerPlayer.findById(token.userId);
		if (!customer) throw InternalError('User not found');

		await PlayerApp.app.models.CustomerPlayer.checkPasswordSecurity(newPassword);
		try {
			await customer.changePassword(oldPassword, newPassword);
		} catch (e) {
			throw InternalError(e.message);
		}
		await PlayerApp.app.models.CustomerPlayer.postChangePassword(token.userId);

		try {
			return await PlayerApp.simpleLogin(customer.email || customer.username, newPassword);
		} catch (e) {
			throw InternalError('Invalid credentials');
		}
	};

	PlayerApp.submitWellnessSurvey = async function (
		playerId,
		wellness_sleep,
		wellness_stress,
		wellness_fatigue,
		wellness_soreness,
		wellness_mood,
		sleep_start,
		sleep_end,
		sleep_hours,
		locations
	) {
		const response = {};
		const pl = await PlayerApp.app.models.Player.findById(playerId);
		if (pl) {
			const dateWellness = moment().utc().startOf('day').toDate();
			const wellnessExist = await PlayerApp.app.models.Wellness.findOne({
				where: {
					playerId: pl.id,
					date: dateWellness
				}
			});

			if (wellnessExist) {
				throw BadRequestError('Already Submitted Wellness for this day');
			} else {
				// console.log(pl.id);
				const res = await PlayerApp.app.models.Wellness.create({
					date: dateWellness,
					playerId: pl.id,
					wellness_sleep,
					wellness_stress,
					wellness_fatigue,
					wellness_soreness,
					wellness_mood,
					sleep_start,
					sleep_end,
					sleep_hours,
					locations
				});
				if (res) {
					response.wellness = res;
					return response;
				} else {
					throw InternalError('Error submitting wellness');
				}
			}
		} else {
			throw InternalError('Error getting player');
		}
	};

	PlayerApp.getSessionsForDay = async function (playerId) {
		const todayStart = moment().startOf('day').toDate();
		const todayEnd = moment().endOf('day').toDate();
		const eventCollection = PlayerApp.app.models.Event.getDataSource().connector.collection(
			PlayerApp.app.models.Event.modelName
		);
		const playerCollection = PlayerApp.app.models.Player.getDataSource().connector.collection(
			PlayerApp.app.models.Player.modelName
		);

		const pl = await playerCollection.findOne({ _id: ObjectID(playerId) });
		if (pl) {
			const filter = {
				teamId: ObjectID(pl.teamId),
				format: { $in: ['game', 'training'] },
				start: { $gte: todayStart, $lte: todayEnd }
			};
			try {
				let evs = await eventCollection.find(filter).toArray();
				evs = evs.filter(x => x.playerIds.find(y => y.toString() === playerId.toString()));
				const eventsRpeToDo = [];
				if (evs && evs.length > 0) {
					for (const ev of evs) {
						const foundRpeMissingSession =
							ev._sessionPlayers && ev._sessionPlayers.length > 0
								? ev._sessionPlayers.find(x => x.mainSession && x.playerId.toString() === playerId.toString() && !x.rpe)
									? true
									: false
								: false;
						if (foundRpeMissingSession) {
							eventsRpeToDo.push(ev);
						}
					}
				}
				return eventsRpeToDo.map(x => ({
					label: x.title,
					value: x._id.toString(),
					description: x.description,
					title: x.title,
					start: x.start,
					end: x.end,
					location: x.where
				}));
			} catch (error) {
				throw InternalError('Error finding sessions');
			}
		} else {
			throw NotFoundError('No player for current parameters');
		}
	};

	PlayerApp.submitRpe = async function (playerId, sessionId, rpe) {
		console.log(`[PLAYER APP.submitRpe] Submitting RPE for player ${playerId} and event ${sessionId}...`);
		const eventCollection = PlayerApp.app.models.Event.getDataSource().connector.collection(
			PlayerApp.app.models.Event.modelName
		);

		const playerCollection = PlayerApp.app.models.Player.getDataSource().connector.collection(
			PlayerApp.app.models.Player.modelName
		);

		const player = await playerCollection.findOne({ _id: ObjectID(playerId) });
		if (player) {
			try {
				const event = await eventCollection.findOne(
					{ _id: ObjectID(sessionId) },
					{ _id: 1, _sessionPlayers: 1, duration: 1 }
				);
				if (event._sessionPlayers) {
					let session = event._sessionPlayers.find(sess => sess.playerId.toString() === playerId && sess.mainSession);
					if (session) {
						session.rpe = rpe;
						session.rpeTl = rpe * event.duration;
						session = await PlayerApp.app.models.SessionPlayerData.calculateWorkload(session);
					}
					await eventCollection.updateOne(
						{
							_id: event._id,
							_sessionPlayers: { $elemMatch: { playerId: ObjectID(playerId), mainSession: true } }
						},
						{
							$set: {
								'_sessionPlayers.$': session
							}
						}
					);
					return true;
				}
				throw InternalError('Error finding sessions');
			} catch (err) {
				throw InternalError('Error finding sessions');
			}
		} else {
			throw NotFoundError('No player for current parameters');
		}
	};

	PlayerApp.getPlayerEvents = async function (start, end, req) {
		try {
			const token = await PlayerApp.getToken(req);
			const { userId } = token;
			if (!userId) {
				throw ForbiddenError('Not allowed. Token missing');
			}
			console.log(`[PLAYER APP] Getting events for customer player ${userId}`);
			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findById(userId);
			if (!customerPlayer) throw InternalError('User not found');

			const player = await PlayerApp.app.models.Player.findById(customerPlayer.playerId, {
				fields: ['teamId', 'id']
			});
			if (!player) throw InternalError('Linked player not found');

			const pipeline = getPlayerEventsPipeline(player.teamId, player.id, start, end);
			const events = await PlayerApp.app.models.Event.getDataSource()
				.connector.collection(PlayerApp.app.models.Event.modelName)
				.aggregate(pipeline)
				.toArray();
			events.forEach(event => {
				event.color = getColorForFormatSubformatTheme(event.format, event.subformat, event.theme);
				if (!event.end) event.end = moment(event.start).add(60, 'minute').toDate();
			});
			return sortBy(events, 'start');
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.getEventDetails = async function (eventId, req) {
		try {
			const token = await PlayerApp.getToken(req);
			const { userId } = token;
			if (!userId) {
				throw ForbiddenError('Not allowed. Token missing');
			}

			console.log(`[PLAYER APP] Getting full event ${eventId} for customer player ${userId}`);
			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findById(userId);
			if (!customerPlayer) throw InternalError('User not found');

			const player = await PlayerApp.app.models.Player.findById(customerPlayer.playerId, {
				fields: ['teamId', 'id', '_id', '_preventionExams']
			});
			if (!player) throw InternalError('Linked player not found');
			const pipeline = getFullEventPipeline(eventId);
			const [
				{
					videos,
					// match: [match],
					team: [team],
					// season: [season],
					...event
				}
			] = await PlayerApp.app.models.Event.getDataSource()
				.connector.collection(PlayerApp.app.models.Event.modelName)
				.aggregate(pipeline)
				.toArray();

			if (!event) throw InternalError('Event not found');

			// const seasonPlayers = await PlayerApp.app.models.Player.find({
			// 	where: { _id: { inq: season.playerIds } },
			// 	fields: ['id', 'downloadUrl', 'nationality', 'displayName']
			// });

			let gameStats;
			let statistics = [];
			let opponentStatistics = [];

			event.reminder = (customerPlayer.eventReminders || []).find(
				({ eventId }) => String(eventId) === String(event._id)
			);
			if (event.format === 'game' || event.format === 'clubGame' || event.format === 'training') {
				// Team report
				if (event?.teamReport) {
					event.teamReport = {
						...event.teamReport,
						notes: event.teamReport.notesShareWithPlayers ? event.teamReport?.notes : null,
						documents: event._attachments.filter(({ sharedPlayerIds }) =>
							sharedPlayerIds.map(String).includes(String(player.id))
						)
					};
				}
				// Player report
				const playerReport = await getEventPlayerReport(PlayerApp, eventId, player.id);
				if (playerReport) {
					event.playerReport = {
						...playerReport,
						reportData: playerReport.reportDataShareWithPlayer ? playerReport.reportData : null,
						notes: playerReport.notesShareWithPlayer ? playerReport.notes : null,
						_videos: (playerReport._videos || []).filter(({ sharedPlayerIds }) =>
							sharedPlayerIds.map(String).includes(String(player.id))
						)
					};
				}
			}
			event._attachments = (event._attachments || []).filter(({ sharedPlayerIds }) =>
				sharedPlayerIds.map(String).includes(String(player.id))
			);
			event.author = await getCustomerName(PlayerApp, event.author);
			if (event.format === 'medical') {
				switch (event.medicalType) {
					case 'exam':
						event['preventionExams'] = await medicalEventUtils.getMedicalExamsForEvent(
							PlayerApp,
							event,
							'_preventionExams'
						);
						if (event?.injuryId) {
							event['injuryExams'] = await medicalEventUtils.getMedicalExamsForEvent(PlayerApp, event, '_injuryExams');
							event.injury = await PlayerApp.app.models.Injury.findById(event.injuryId);
							const injuryLocation = event?.injury?.location;
							event.medicalLocations = [injuryLocation];
						}
						break;
					case 'treatment': {
						const medicalTreatments = await PlayerApp.app.models.MedicalTreatment.find({
							where: { eventId: ObjectID(event._id) }
						});
						const mapped = await medicalEventUtils.getEventMedicalTreatmentsMapped(PlayerApp, medicalTreatments, event);
						event['medicalTreatments'] = mapped?.medicalTreatments;
						event['medicalLocations'] = mapped?.eventMedicalLocations;
						break;
					}
					default:
						console.log('medical field is not supported:', event.medicalType);
				}
			}

			if (event.format === 'game' || event.format === 'training') {
				const session = (event._sessionPlayers || []).find(
					({ playerId, mainSession }) => String(playerId) === String(player.id) && mainSession
				);
				if (session?.rpe) event.rpe = session.rpe;

				if (event.format === 'training') {
					const drillsTeam = await PlayerApp.app.models.Drill.find({ where: { teamId: ObjectID(event.teamId) } });
					event._drills = (event._drills || []).filter(({ sharedPlayerIds }) =>
						(sharedPlayerIds || []).map(String).includes(String(player.id))
					);
					for (const drill of event._drills || []) {
						drill._attachments = [];
						drill.rules = null;
						drill.description = null;
						drill.duration = drill?.durationMin; // only for andrea CAA-104
						if (drill.drillsId) {
							const foundDrill = drillsTeam.find(({ id }) => String(id) === String(drill.drillsId));
							drill._attachments = foundDrill?._attachments || [];
							drill.rules = foundDrill?.rules || null;
							drill.description = foundDrill?.description || null;
						}
					}
				}

				if (event.format === 'game') {
					event.competition = event.subformat === 'internationalCup' ? event.subformatDetails : event.subformat;
					const providerIdField = team.providerTeam === 'Wyscout' ? 'wyscoutId' : 'instatId';
					const service = team.providerTeam === 'Wyscout' ? PlayerApp.app.models.Wyscout : PlayerApp.app.models.Instat;

					if (event[providerIdField]) {
						gameStats = await service.getStandingsMatchStats(event[providerIdField], req);
					}

					statistics = event._playerMatchStats || [];
					opponentStatistics = event._opponentPlayerMatchStats || [];
				}
			}

			// delete event.playerIds;
			delete event._sessionPlayers;
			delete event._playerMatchStats;
			delete event._opponentPlayerMatchStats;

			return {
				event,
				videos,
				// lineup,
				gameStats,
				statistics,
				opponentStatistics
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.getPlayerTodayStatus = async function (playerId, req) {
		const response = {};
		const atCollection = PlayerApp.app.models.AccessToken.getDataSource().connector.collection(
			PlayerApp.app.models.AccessToken.modelName
		);
		const dateWellness = moment().startOf('day').toDate();
		const customer = await PlayerApp.app.models.CustomerPlayer.findOne({ where: { playerId: ObjectID(playerId) } });
		const imageToken = await PlayerApp.app.models.Storage.getToken(customer.clubId.toString());
		const club = await PlayerApp.app.models.Club.findById(customer.clubId);
		response.imageToken = imageToken && imageToken.signature ? imageToken.signature : null;
		const todayStart = moment().startOf('day').toDate();
		const todayEnd = moment().endOf('day').toDate();
		const eventCollection = PlayerApp.app.models.Event.getDataSource().connector.collection(
			PlayerApp.app.models.Event.modelName
		);
		const wellnessExist = await PlayerApp.app.models.Wellness.findOne({
			where: {
				playerId,
				date: dateWellness
			}
		});
		response.wellnessToDo = !wellnessExist;
		const tokenId = req.headers['authorization'];
		const token = await atCollection.findOne({ _id: tokenId });
		token.created = new Date();
		token.ttl = 60 * 60 * 24 * 30;
		await atCollection.save(token);
		response.token = token._id;
		response.tokenTtl = token.ttl;
		response.tokenCreated = token.created;
		response.customerId = customer.id.toString();
		response.isTempPassword = customer.isTempPassword;
		response.customer = customer;
		response.sport = club.sportType;
		response.lineup = sportsConstants[club.sportType].lineup;
		response.bench = sportsConstants[club.sportType].bench;
		delete response.customer.password;
		delete response.customer.eventReminders;
		const player = await PlayerApp.app.models.Player.findOne({
			where: { id: customer.playerId.toString() },
			include: [
				{
					relation: 'injuries',
					scope: {
						fields: [
							'createdBy',
							'issue',
							'date',
							'endDate',
							'admissionDate',
							'system',
							'location',
							'anatomicalDetails',
							'type',
							'reinjury',
							'category',
							'contact',
							'mechanism',
							'occurrence',
							'severity',
							'expectedReturn',
							'diagnosis',
							'notes',
							'surgery',
							'surgeryNotes',
							'treatInstruction',
							'currentStatus',
							'chronicInjuryId',
							'osics'
							// 'statusHistory'
						]
					}
				}
			],
			fields: [
				'id',
				'firstName',
				'lastName',
				'displayName',
				'email',
				'mobilePhone',
				'phone',
				'otherMobile',
				'address',
				'domicile',
				'nationality',
				'birthDate',
				'position',
				'height',
				'weight',
				'position2',
				'position3',
				'downloadUrl',
				'feeFrom',
				'feeTo',
				'wageFrom',
				'wageTo',
				'teamId',
				'injuries',
				'_chronicInjuries',
				'anamnesys'
			]
		});
		if (player) {
			const agents = await PlayerApp.app.models.Agent.find({
				where: { teamId: ObjectID(player.teamId), archived: false },
				fields: ['id', 'firstName', 'lastName', 'assistedIds', 'email', 'mobilePhone', 'assistedIds']
			});
			player.agents = agents
				.filter(agent => agent.assistedIds.map(x => x.toString()).includes(player.id.toString()))
				.map(x => ({
					name: `${x.firstName} ${x.lastName}`,
					email: x.email,
					phone: x.mobilePhone
				}));

			const staff = await PlayerApp.app.models.Staff.find({
				where: { teamId: ObjectID(player.teamId), archived: false },
				fields: [
					'id',
					'firstName',
					'lastName',
					'email',
					'mobilePhone',
					'phone',
					'otherMobile',
					'downloadUrl',
					'position',
					'archived'
				]
			});
			player.staff = staff.map(x => ({
				name: `${x.firstName} ${x.lastName}`,
				email: x.email,
				phone: x.phone,
				mobilePhone: x.mobilePhone,
				otherMobile: x.otherMobile,
				downloadUrl: x.downloadUrl,
				position: x.position
			}));

			// response.player = {
			// 	...player,
			// 	latestMedicalRecord: getLatestMedicalRecords(player.anamnesys)
			// };
			response.player = player;
			response.player.latestMedicalRecord = getLatestMedicalRecords(player.anamnesys);
			const filter = {
				teamId: ObjectID(player.teamId),
				format: { $in: ['game', 'training'] },
				start: { $gte: todayStart, $lte: todayEnd }
			};
			try {
				let evs = await eventCollection.find(filter).toArray();
				evs = evs.filter(x => x.playerIds.find(y => y.toString() === playerId.toString()));
				const eventsRpeToDo = [];
				let rpeToDo = false;
				if (evs && evs.length > 0) {
					for (const ev of evs) {
						const foundRpeMissingSession =
							ev._sessionPlayers && ev._sessionPlayers.length > 0
								? ev._sessionPlayers.find(x => x.mainSession && x.playerId.toString() === playerId.toString() && !x.rpe)
									? true
									: false
								: false;
						if (foundRpeMissingSession) {
							rpeToDo = true;
							eventsRpeToDo.push(ev);
						}
					}
				}
				response.rpeToDo = rpeToDo;
				response.eventsRpeToDo = eventsRpeToDo;
				return response;
			} catch (error) {
				console.log(error);
				throw InternalError('Error refreshing data');
			}
		} else {
			throw NotFoundError('No player for current parameters');
		}
	};

	PlayerApp.getNotifications = async function (playerId, start, limit, read, teamIds, startDate, endDate, req) {
		try {
			const lang = getLanguage(req.headers['accept-language']);
			start = start && typeof start == 'number' ? start : 0;
			limit = limit && typeof limit == 'number' ? limit : 99;
			const customer = await PlayerApp.app.models.CustomerPlayer.findOne({ where: { playerId: ObjectID(playerId) } });
			const queryParams = { customerId: ObjectID(customer.id) };
			if (read !== undefined) {
				queryParams.read = read;
			}
			if (teamIds) {
				queryParams.teamId = { inq: teamIds };
			}
			if (startDate || endDate) {
				if (startDate && endDate) {
					queryParams.date = {
						between: [moment(startDate).startOf('day').toDate(), moment(endDate).endOf('day').toDate()]
					};
				} else if (startDate) {
					queryParams.date = { gte: moment(startDate).startOf('day').toDate() };
				} else if (endDate) {
					queryParams.date = { lte: moment(endDate).endOf('day').toDate() };
				}
			}
			let playerNotifications = await PlayerApp.app.models.PlayerNotification.find({
				skip: start,
				limit: limit,
				order: 'date DESC',
				where: queryParams
			});
			playerNotifications = playerNotifications || [];
			for (const nn of playerNotifications) {
				nn.message = convert(translateNotification(nn.message, lang));
			}
			return { notifications: playerNotifications };
		} catch (err) {
			console.error(err);
			throw BadRequestError('Wrong customer id');
		}
	};

	PlayerApp.setNotificationAsRead = async function (playerId, notificationId) {
		try {
			await PlayerApp.app.models.PlayerNotification.updateAll({ id: notificationId }, { read: true });
			return true;
		} catch (err) {
			throw BadRequestError('Wrong notification id');
		}
	};

	PlayerApp.setAllNotificationsAsRead = async function (playerId) {
		try {
			const customer = await PlayerApp.app.models.CustomerPlayer.findOne({ where: { playerId: ObjectID(playerId) } });
			await PlayerApp.app.models.PlayerNotification.updateAll({ customerId: ObjectID(customer.id) }, { read: true });
			return true;
		} catch (err) {
			throw BadRequestError('Wrong notification id');
		}
	};

	PlayerApp.toggleNotifications = async function (notificationId, read) {
		try {
			await PlayerApp.app.models.PlayerNotification.updateAll({ id: notificationId }, { read });
			return true;
		} catch (err) {
			console.error(err);
			throw BadRequestError('Wrong notification id');
		}
	};

	PlayerApp.toggleAllNotifications = async function (req, read) {
		try {
			const token = await PlayerApp.getToken(req);
			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findOne({
				where: { id: token.userId }
			});
			if (!customerPlayer) {
				throw InternalError('User not found');
			}
			await PlayerApp.app.models.PlayerNotification.updateAll({ customerId: ObjectID(customerPlayer.id) }, { read });
			return true;
		} catch (err) {
			console.error(err);
			throw BadRequestError('Wrong notification id');
		}
	};
	PlayerApp.getNotificationsBadge = async function (req) {
		try {
			const token = await PlayerApp.getToken(req);
			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findOne({
				where: { id: token.userId }
			});
			if (!customerPlayer) {
				throw InternalError('User not found');
			}
			const count = await PlayerApp.app.models.PlayerNotification.count({
				customerId: ObjectID(customerPlayer.id),
				read: false
			});
			return { count };
		} catch (err) {
			console.error(err);
			throw err;
		}
	};

	PlayerApp.updateNotificationSettings = async function (
		playerId,
		notificationEvents,
		notificationSurveys,
		notificationVideoShared,
		notificationVideoComments
	) {
		try {
			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findOne({
				where: { playerId: ObjectID(playerId) }
			});
			customerPlayer.notificationEvents = notificationEvents ? notificationEvents : false;
			customerPlayer.notificationSurveys = notificationSurveys ? notificationSurveys : false;
			customerPlayer.notificationVideoShared = notificationVideoShared ? notificationVideoShared : false;
			customerPlayer.notificationVideoComments = notificationVideoComments ? notificationVideoComments : false;
			await customerPlayer.save();
			return true;
		} catch (err) {
			throw BadRequestError('Wrong player id');
		}
	};

	PlayerApp.getMe = async function (req) {
		try {
			const token = await PlayerApp.getToken(req);
			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findOne({
				where: { id: token.userId }
			});
			if (!customerPlayer) {
				throw InternalError('User not found');
			}
			delete customerPlayer?.password;
			delete customerPlayer?.eventReminders;
			return customerPlayer;
		} catch (error) {
			console.error(error);
			throw InternalError('Error while getting personal information');
		}
	};

	PlayerApp.updateMe = async function (req) {
		try {
			const token = await PlayerApp.getToken(req);
			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findOne({
				where: { id: token.userId }
			});
			if (!customerPlayer) {
				throw InternalError('User not found');
			}
			const { body: config } = req;
			if (!config) {
				throw UnprocessableEntityError('Data not provided');
			}
			customerPlayer.currentLanguage = config?.currentLanguage;
			customerPlayer.currentDateFormat = config?.currentDateFormat;
			await customerPlayer.save();
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.getPlayerVideos = async function (categories, req) {
		try {
			const token = await PlayerApp.getToken(req);
			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findById(token.userId);
			if (!customerPlayer) throw InternalError('User not found!');

			const playerLinked = await PlayerApp.app.models.Player.findById(customerPlayer.playerId);

			const videoCollection = PlayerApp.app.models.VideoAsset.getDataSource().connector.collection(
				PlayerApp.app.models.VideoAsset.modelName
			);

			const pipelineVideos = getPipelineVideos(playerLinked.id, playerLinked.teamId, categories || []);

			const results = await videoCollection.aggregate(pipelineVideos).toArray();
			for (const result of results) {
				if (result.linkedModel) {
					result.linkedObject = await PlayerApp.app.models[result.linkedModel].findOne({
						where: { _id: ObjectID(result.linkedId) }
					});
				}
			}
			return results;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.videoMatchCommentEdit = async function (
		playerId,
		matchId,
		videoId,
		commentId,
		commentParentId,
		commentBody,
		read
	) {
		try {
			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findOne({ where: { playerId: playerId } });
			const customersForClub = await PlayerApp.app.models.Customer.find({ where: { clubId: customerPlayer.clubId } });
			let video = await PlayerApp.app.models.VideoAsset.findById(videoId);

			if (!commentParentId) {
				const foundComm = video.notesThreads.find(x => x.id.toString() === commentId);
				if (foundComm) {
					foundComm.content = commentBody;
					foundComm.time = moment().toDate();
					foundComm.read = read;
				}
			} else {
				const foundFather = video.notesThreads.find(x => x.id.toString() === commentParentId);
				if (foundFather) {
					foundFather.notesThreads = foundFather.notesThreads ? foundFather.notesThreads : [];
					const foundCommChild = foundFather.notesThreads.find(x => x.id.toString() === commentId);
					if (foundCommChild) {
						foundCommChild.content = commentBody;
						foundCommChild.time = moment().toDate();
						foundCommChild.read = read;
					}
				}
			}
			video = await video.save();
			for (const not of video.notesThreads) {
				if (!not.playerId && not.userId) {
					const c = customersForClub.find(x => x.id.toString() === not.userId);
					not.img = c && c.downloadUrl ? c.downloadUrl : null;
				}
			}
			return video.notesThreads;
		} catch (error) {
			throw BadRequestError();
		}
	};

	PlayerApp.getComments = async function (req) {
		try {
			const { videoId } = req.params;
			const video = await PlayerApp.app.models.VideoAsset.findById(videoId);
			if (!video) {
				throw NotFoundError('Video not found');
			}
			video.notesThreads = sortByTime(video.notesThreads || [], 'time').reverse();
			return video.notesThreads;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.createComment = async function (req) {
		try {
			const { matchId, videoId } = req.params;
			const { content } = req.body;
			const token = await PlayerApp.getToken(req);

			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findById(token.userId);
			if (!customerPlayer) {
				throw InternalError('User not found');
			}

			const [player, video] = await Promise.all([
				PlayerApp.app.models.Player.findById(customerPlayer.playerId, {
					name: 1,
					lastName: 1,
					downloadUrl: 1
				}),
				PlayerApp.app.models.VideoAsset.findById(videoId)
			]);

			if (!player) {
				throw NotFoundError('Player not found');
			}
			if (!video) {
				throw NotFoundError('Video not found');
			}

			if (!video.notesThreads) video.notesThreads = [];

			const attachments = await PlayerApp.uploadFiles(req, player.clubId);

			const newComment = {
				id: uuid(),
				user: `${player.name} ${player.lastName}`,
				userId: String(customerPlayer.id),
				time: moment().toDate(),
				content,
				img: player.downloadUrl,
				attachments,
				notesThreads: []
			};
			video.notesThreads.push(newComment);
			await video.save();

			// for (const note of saved.notesThreads) {
			// 	if (!note.playerId && note.userId) {
			// 		const customer = customersForClub.find(({ id }) => id.toString() === note.userId);
			// 		note.img = customer && customer.downloadUrl ? customer.downloadUrl : null;
			// 	}
			// }

			const otherPlayersIds = video.sharedPlayerIds.filter(id => String(id) !== String(customerPlayer.playerId));
			await Promise.all([
				PlayerApp.app.models.PlayerNotification.checkVideoCommentsNotificationsFromPlayerApp(
					customerPlayer.playerId,
					matchId,
					videoId
				),
				PlayerApp.app.models.PlayerNotification.checkVideoCommentsNotifications(videoId, matchId, otherPlayersIds, {
					playerId: customerPlayer.playerId
				})
			]);
			return newComment;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.updateComment = async function (req) {
		try {
			const { commentId, videoId } = req.params;
			const { content } = req.body;
			const token = await PlayerApp.getToken(req);

			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findById(token.userId);
			if (!customerPlayer) {
				throw InternalError('User not found');
			}

			const [player, video] = await Promise.all([
				PlayerApp.app.models.Player.findById(customerPlayer.playerId, {
					name: 1,
					lastName: 1,
					downloadUrl: 1
				}),
				PlayerApp.app.models.VideoAsset.findById(videoId)
			]);

			if (!player) {
				throw NotFoundError('Player not found');
			}
			if (!video) {
				throw NotFoundError('Video not found');
			}

			if (!video.notesThreads) video.notesThreads = [];

			const index = video.notesThreads.findIndex(({ id }) => String(id) === commentId);
			const comment = video.notesThreads[index];
			if (!comment) {
				throw NotFoundError('Comment not found');
			}
			if (String(comment.userId) !== String(token.userId)) {
				throw AuthorizationError('You are not the comment author');
			}
			if (req.files.length > 0) {
				const attachments = await PlayerApp.uploadFiles(req, player.clubId);
				comment.attachments = attachments;
			}
			comment.content = content;
			comment.updatedTime = moment().toDate();

			video.notesThreads[index] = comment;
			await video.save();
			return comment;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.deleteComment = async function (req) {
		try {
			const { commentId, videoId } = req.params;
			const token = await PlayerApp.getToken(req);

			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findById(token.userId);
			if (!customerPlayer) {
				throw InternalError('User not found');
			}

			const [player, video] = await Promise.all([
				PlayerApp.app.models.Player.findById(customerPlayer.playerId, {
					name: 1,
					lastName: 1,
					downloadUrl: 1
				}),
				PlayerApp.app.models.VideoAsset.findById(videoId)
			]);

			if (!player) {
				throw NotFoundError('Player not found');
			}
			if (!video) {
				throw NotFoundError('Video not found');
			}

			if (!video.notesThreads) video.notesThreads = [];

			const index = video.notesThreads.findIndex(({ id }) => String(id) === commentId);
			const comment = video.notesThreads[index];
			if (!comment) {
				throw NotFoundError('Comment not found');
			}
			if (String(comment.userId) !== String(token.userId)) {
				throw AuthorizationError('You are not the comment author');
			}

			await PlayerApp.deleteFiles(comment, player.clubId);

			video.notesThreads.splice(index, 1);
			await video.save();
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.getReplies = async function (req) {
		try {
			const { videoId, commentId } = req.params;
			const video = await PlayerApp.app.models.VideoAsset.findById(videoId);
			if (!video) {
				throw NotFoundError('Video not found');
			}
			if (!video.notesThreads) video.notesThreads = [];
			const index = video.notesThreads.findIndex(({ id }) => String(id) === commentId);
			const comment = video.notesThreads[index];
			if (!comment) {
				throw NotFoundError('Comment not found');
			}
			const replies = sortByTime(comment.notesThreads || [], 'time').reverse();
			return replies;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.createReply = async function (req) {
		try {
			const { commentId, matchId, videoId } = req.params;
			const { content } = req.body;
			const token = await PlayerApp.getToken(req);

			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findById(token.userId);
			if (!customerPlayer) {
				throw InternalError('User not found');
			}
			const [player, video] = await Promise.all([
				PlayerApp.app.models.Player.findById(customerPlayer.playerId, {
					name: 1,
					lastName: 1,
					downloadUrl: 1
				}),
				PlayerApp.app.models.VideoAsset.findById(videoId)
			]);
			if (!player) {
				throw NotFoundError('Player not found');
			}
			if (!video) {
				throw NotFoundError('Video not found');
			}
			if (!video.notesThreads) video.notesThreads = [];

			const index = video.notesThreads.findIndex(({ id }) => id.toString() === commentId);
			const parent = video.notesThreads[index];
			if (!parent) {
				throw NotFoundError('Comment not found');
			}
			const attachments = await PlayerApp.uploadFiles(req, player.clubId);
			const reply = {
				id: uuid(),
				user: `${player.name} ${player.lastName}`,
				userId: String(customerPlayer.id),
				time: moment().toDate(),
				content,
				img: customerPlayer.downloadUrl,
				attachments
			};
			if (!video.notesThreads[index].notesThreads) video.notesThreads[index].notesThreads = [];
			video.notesThreads[index].notesThreads.push(reply);
			await video.save();

			const otherPlayersIds = video.sharedPlayerIds.filter(id => String(id) !== String(customerPlayer.playerId));
			await Promise.all([
				PlayerApp.app.models.PlayerNotification.checkVideoCommentsNotificationsFromPlayerApp(
					customerPlayer.playerId,
					matchId,
					videoId
				),
				PlayerApp.app.models.PlayerNotification.checkVideoCommentsNotifications(videoId, matchId, otherPlayersIds, {
					playerId: customerPlayer.playerId
				})
			]);

			return reply;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.updateReply = async function (req) {
		try {
			const { commentId, videoId, replyId } = req.params;
			const { content } = req.body;

			const token = await PlayerApp.getToken(req);

			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findById(token.userId);
			if (!customerPlayer) {
				throw InternalError('User not found');
			}

			const [player, video] = await Promise.all([
				PlayerApp.app.models.Player.findById(customerPlayer.playerId, {
					name: 1,
					lastName: 1,
					downloadUrl: 1
				}),
				PlayerApp.app.models.VideoAsset.findById(videoId)
			]);

			if (!player) {
				throw NotFoundError('Player not found');
			}
			if (!video) {
				throw NotFoundError('Video not found');
			}

			if (!video.notesThreads) video.notesThreads = [];

			const index = video.notesThreads.findIndex(({ id }) => String(id) === commentId);
			const comment = video.notesThreads[index];
			if (!comment) {
				throw NotFoundError('Comment not found');
			}
			if (!video.notesThreads[index].notesThreads) video.notesThreads[index].notesThreads = [];
			const replyIndex = comment.notesThreads.findIndex(({ id }) => String(id) === replyId);
			const reply = video.notesThreads[index].notesThreads[replyIndex];
			if (!reply) {
				throw NotFoundError('Reply not found');
			}
			if (String(reply.userId) !== String(token.userId)) {
				throw AuthorizationError('You are not the reply author');
			}
			if (req.files.length > 0) {
				const attachments = await PlayerApp.uploadFiles(req, player.clubId);
				reply.attachments = attachments;
			}
			reply.content = content;
			reply.updatedTime = moment().toDate();
			video.notesThreads[index].notesThreads[replyIndex] = reply;
			await video.save();
			return reply;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.deleteReply = async function (req) {
		try {
			const { commentId, replyId, videoId } = req.params;
			const token = await PlayerApp.getToken(req);

			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findById(token.userId);
			if (!customerPlayer) {
				throw InternalError('User not found');
			}

			const [player, video] = await Promise.all([
				PlayerApp.app.models.Player.findById(customerPlayer.playerId, {
					name: 1,
					lastName: 1,
					downloadUrl: 1
				}),
				PlayerApp.app.models.VideoAsset.findById(videoId)
			]);

			if (!player) {
				throw NotFoundError('Player not found');
			}
			if (!video) {
				throw NotFoundError('Video not found');
			}

			if (!video.notesThreads) video.notesThreads = [];

			const index = video.notesThreads.findIndex(({ id }) => String(id) === commentId);
			const comment = video.notesThreads[index];
			if (!comment) {
				throw NotFoundError('Comment not found');
			}
			if (!video.notesThreads[index].notesThreads) video.notesThreads[index].notesThreads = [];
			const replyIndex = comment.notesThreads.findIndex(({ id }) => String(id) === replyId);
			const reply = video.notesThreads[index].notesThreads[replyIndex];
			if (!reply) {
				throw NotFoundError('Reply not found');
			}
			if (String(reply.userId) !== String(token.userId)) {
				throw AuthorizationError('You are not the reply author');
			}

			await PlayerApp.deleteFiles(reply, player.clubId);

			video.notesThreads[index].notesThreads.splice(replyIndex, 1);
			await video.save();
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.uploadFiles = async function (req, clubId) {
		const { files } = req;
		const uploaded = await Promise.all(
			(files || []).map(file => PlayerApp.app.models.Storage.uploadFile(String(clubId), file.buffer, file.originalname))
		);
		(files || []).forEach((file, index) => {
			file.url = uploaded[index];
		});
		const attachments = (files || []).map(file => ({
			type: getType(file.originalname),
			name: file.originalname,
			url: file.url
		}));
		return attachments;
	};

	PlayerApp.deleteFiles = async function (comment, clubId) {
		const { attachments } = comment;
		await Promise.all(attachments.map(({ url }) => PlayerApp.app.models.Storage.deleteFile(String(clubId), url)));
		return true;
	};

	PlayerApp.setEventReminder = async function (playerId, eventId, minutes) {
		try {
			let customerPlayer = await PlayerApp.app.models.CustomerPlayer.findOne({ where: { playerId: playerId } });
			if (eventId) {
				customerPlayer.eventReminders = customerPlayer.eventReminders ? customerPlayer.eventReminders : [];
				const existing = customerPlayer.eventReminders.find(x => x.eventId.toString() === eventId);
				if (existing) existing.minutes = minutes;
				else customerPlayer.eventReminders.push({ eventId: eventId, minutes: minutes });
			} else {
				customerPlayer.globalEventReminder = minutes !== null && minutes !== undefined ? Number(minutes) : null;
			}
			customerPlayer = await customerPlayer.save();
			return true;
		} catch (error) {
			throw BadRequestError();
		}
	};

	PlayerApp.createEventForPlayer = async function (playerId, dateStart, dateEnd, duration, rpe) {
		try {
			const playerLinked = await PlayerApp.app.models.Player.findById(playerId);
			const teamSeasonCollection = PlayerApp.app.models.TeamSeason.getDataSource().connector.collection(
				PlayerApp.app.models.TeamSeason.modelName
			);
			const allTeamSeasons = await teamSeasonCollection.find({ teamId: ObjectID(playerLinked.teamId) }).toArray();
			const team = await PlayerApp.app.models.Team.findById(playerLinked.teamId);
			let newEvent = {};
			newEvent.title = 'Training ' + moment(dateStart).format('DD/MM/YYYY HH:mm');
			newEvent.type = 'GEN';
			newEvent.individual = false;
			newEvent.description = '';
			newEvent.start = moment(dateStart).toDate();
			newEvent.end = moment(dateEnd).toDate();
			newEvent.duration = duration;
			newEvent.gpsSessionLoaded = false;
			newEvent.lastUpdateDate = moment().toDate();
			newEvent.format = 'training';
			newEvent.teamId = playerLinked.teamId;
			const teamSeasonEvent = allTeamSeasons.find(x =>
				moment(newEvent.start).isBetween(moment(x.offseason), moment(x.inseasonEnd))
			);
			const tId = teamSeasonEvent ? teamSeasonEvent._id.toString() : null;
			newEvent.teamSeasonId = tId ? ObjectID(tId) : null;
			const nameSession = moment(newEvent.start).format('DD/MM/YYYY hh:mm') + ' SESSION';
			const date = moment(newEvent.start).startOf('day').toDate();
			const identifier = newEvent.teamId.toString() + '_' + nameSession;
			newEvent._sessionImport = { id: uuid(), name: nameSession, identifier: identifier, date: date, gdType: 'GEN' };
			newEvent._sessionPlayers = [];
			const sessionPlayerDummy = {
				date: date,
				dirty: false,
				complete: false,
				playerName: playerLinked.displayName,
				playerId: ObjectID(playerId),
				splitName: team.mainSplitName.toString(),
				mainSession: true,
				splitStartTime: newEvent.start,
				splitEndTime: newEvent.end,
				duration: newEvent.duration,
				rpe: rpe,
				rpeTl: rpe * duration,
				teamId: ObjectID(playerLinked.teamId)
			};
			newEvent._sessionPlayers.push(sessionPlayerDummy);
			newEvent.playerIds = [ObjectID(playerId)];
			newEvent = await PlayerApp.app.models.Event.calculateInternalMetricsForEvent(newEvent, true);
			newEvent = await PlayerApp.app.models.Event.create(newEvent);
			return newEvent;
		} catch (error) {
			throw InternalError('Error creating event');
		}
	};

	PlayerApp.playerLogout = async function (deviceId, req) {
		try {
			const token = await PlayerApp.getToken(req);
			if (!token) {
				throw AuthorizationError('Auth token not valid');
			}
			await PlayerApp.app.models.CustomerPlayer.logout(req.accessToken.id);
			return true;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	PlayerApp.getMinimumVersion = async function (playerId) {
		return { android: Number(process.env.PLAYERAPP_ANDROID_MINIMUM), ios: Number(process.env.PLAYERAPP_IOS_MINIMUM) };
	};

	PlayerApp.getPlayerTransferCareers = async function (req) {
		try {
			const token = await PlayerApp.getToken(req);
			const userId = token.userId;
			if (!userId) {
				throw ForbiddenError('Not allowed. Token missing');
			}
			const { playerId } = await PlayerApp.app.models.CustomerPlayer.findById(userId, { fields: ['playerId'] });
			const player = await PlayerApp.app.models.Player.findById(playerId, {
				fields: ['wyscoutId', 'instatId', 'teamId']
			});
			const team = await PlayerApp.app.models.Team.findById(player.teamId, { fields: ['providerTeam'] });
			const response = await tacticalInfoProvider.getCareerTransfers(
				team.providerTeam,
				player[tacticalInfoProvider.getProviderField(team.providerTeam, 'id')]
			);
			const transfers = getPlayerTransfers(response);
			const careers = getPlayerCareer(response);
			return [transfers, careers];
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	PlayerApp.getCurrency = async function (req) {
		try {
			const token = await PlayerApp.getToken(req);
			const userId = token.userId;
			if (!userId) {
				throw ForbiddenError('Not allowed. Token missing');
			}
			const { playerId } = await PlayerApp.app.models.CustomerPlayer.findById(userId, { fields: ['playerId'] });
			const { clubId } = await PlayerApp.app.models.Player.findById(playerId, { clubId: 1 });
			const { currency } = await PlayerApp.app.models.Club.findById(ObjectID(clubId), { currency: 1 });
			return {
				currency,
				currencySymbol: currency in currenciesSymbols ? currenciesSymbols[currency] : '€'
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.getContracts = async function (req) {
		try {
			const token = await PlayerApp.getToken(req);
			const userId = token.userId;
			if (!userId) {
				throw ForbiddenError('Not allowed. Token missing');
			}
			const { playerId } = await PlayerApp.app.models.CustomerPlayer.findById(userId, { fields: ['playerId'] });
			const [activeEmployment, activeInward, activeOutward] = await Promise.all([
				PlayerApp.app.models.EmploymentContract.findOne({
					where: { personId: ObjectID(playerId), status: true }
				}),
				PlayerApp.app.models.TransferContract.findOne({
					where: { personId: ObjectID(playerId), status: true, typeTransfer: 'inward' }
				}),
				PlayerApp.app.models.TransferContract.findOne({
					where: { personId: ObjectID(playerId), status: true, typeTransfer: 'outward' }
				})
			]);
			return [
				...extractAttachmentFromContract(activeEmployment, 'employment'),
				...extractAttachmentFromContract(activeInward, 'purchase'),
				...extractAttachmentFromContract(activeOutward, 'sale')
			];
		} catch (err) {
			console.error(err);
			throw err;
		}
	};

	PlayerApp.getPlayerStats = async function (req) {
		try {
			const token = await PlayerApp.getToken(req);
			const userId = token.userId;
			if (!userId) {
				throw ForbiddenError('Not allowed. Token missing');
			}
			const { playerId } = await PlayerApp.app.models.CustomerPlayer.findById(userId, { fields: ['playerId'] });
			const player = await PlayerApp.app.models.Player.findById(playerId, {
				fields: [
					'id',
					'clubId',
					'teamId',
					'valueField',
					'value',
					'clubValue',
					'transfermarktValue',
					'agentValue',
					'_pastValues',
					'_pastClubValues',
					'_pastTransfermarktValues',
					'_pastAgentValues',
					'wyscoutId'
				],
				include: ['attributes', 'descriptions']
			});
			if (!player) {
				throw new NotFoundError('Player not found');
			}
			const [club, team, teamSeasons, activeEmployment, playerBonuses, playerVideos, customers] = await Promise.all([
				PlayerApp.app.models.Club.findById(player.clubId, {
					fields: ['currency', 'name', 'scoutingSettings', 'scoutingAlt']
				}),
				PlayerApp.app.models.Team.findById(player.teamId, {
					fields: ['id', 'name', '_playerProviderMapping']
				}),
				PlayerApp.app.models.TeamSeason.find({ where: { teamId: ObjectID(player.teamId) } }),
				PlayerApp.app.models.EmploymentContract.findOne({
					where: { personId: ObjectID(playerId), status: true }
				}),
				PlayerApp.app.models.Bonus.find({ where: { personId: ObjectID(player.id) } }),
				PlayerApp.app.models.VideoAsset.getDataSource()
					.connector.collection(PlayerApp.app.models.VideoAsset.modelName)
					.find({ linkedId: String(player.id), linkedModel: 'Player' })
					.toArray(),
				PlayerApp.app.models.Customer.find({
					where: { clubId: ObjectID(String(player.clubId)) },
					fields: ['firstName', 'lastName', 'id']
				})
			]);
			const minutesField = team?._playerProviderMaapping?.durationField || '';
			const activeTeamSeasonId = teamSeasons.find(({ offseason, inseasonEnd }) =>
				moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
			)?.id;
			const playerFinancialData = await PlayerApp.app.models.ProfilePlayers.getPlayerFinancialProfile(
				playerId,
				activeTeamSeasonId,
				'currentSeason',
				minutesField,
				40
			);
			const bonuses = (playerBonuses || []).map(bonus => prepareBonus(bonus, club, teamSeasons, req));
			const currentValue = getPlayerValue(player);
			const pastValues = getPlayerPastValues(player);
			const contractStart = activeEmployment?.dateFrom || null;
			const contractEnd = activeEmployment?.dateTo || null;

			const attributes = getAttributesData(JSON.parse(JSON.stringify(player)), playerVideos, team, customers);

			return {
				playerId,
				contractStart,
				contractEnd,
				currentValue: currentValue ? parseInt(currentValue.toString()) : null,
				pastValues: pastValues || [],
				bonus: parseInt((playerFinancialData.bonus || 0).toString()),
				residualBonus: parseInt((playerFinancialData.residualBonus || 0).toString()),
				bookValue: parseInt((playerFinancialData.netBookValue || 0).toString()),
				fixedWage: parseInt((playerFinancialData.wage || 0).toString()),
				incrementCurrentValue: playerFinancialData.gainLossPercent || 0,
				purchaseCost: parseInt((playerFinancialData.purchaseCost || 0).toString()),
				totalInvestmentCost: parseInt((playerFinancialData.totalInvestmentCost || 0).toString()),
				losses_perc: playerFinancialData.losses_perc || 0,
				losses: parseInt((playerFinancialData.losses || 0).toString()),
				residual_perc: playerFinancialData.residualRoi_perc || 0,
				residual: parseInt((playerFinancialData.residualRoi || 0).toString()),
				roi_perc: playerFinancialData.roi_perc || 0,
				roi: parseInt((playerFinancialData.roi || 0).toString()),
				untapped_perc: playerFinancialData.untapped_perc || 0,
				untapped: playerFinancialData.untapped ? parseInt(playerFinancialData.untapped.toString()) : 0,
				bonuses,
				...attributes
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.getReminders = async function (req) {
		try {
			const token = await PlayerApp.getToken(req);
			const userId = token.userId;
			if (!userId) {
				throw ForbiddenError('Not allowed. Token missing');
			}
			console.log(`[PLAYER APP] Getting event reminders for customer player ${userId}`);
			const player = await PlayerApp.app.models.CustomerPlayer.findById(userId, {
				fields: ['globalEventReminders']
			});
			if (!player) throw InternalError('User not found');
			return player.globalEventReminders || [];
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	PlayerApp.setReminders = async function (req) {
		try {
			const token = await PlayerApp.getToken(req);
			const userId = token.userId;
			const { body: reminders } = req;
			if (!userId) {
				throw ForbiddenError('Not allowed. Token missing');
			}
			console.log(`[PLAYER APP] Setting event reminders for customer player ${userId}`, reminders);
			const player = await PlayerApp.app.models.CustomerPlayer.findById(userId);
			if (!player) throw InternalError('User not found');
			const updated = await player.updateAttribute('globalEventReminders', reminders);
			return updated.globalEventReminders;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	PlayerApp.getTactics = async function (req) {
		try {
			const token = await PlayerApp.getToken(req);
			const { clubId } = await PlayerApp.app.models.CustomerPlayer.findById(token.userId, { clubId: 1 });
			const { sportType } = await PlayerApp.app.models.Club.findById(ObjectID(clubId), { currency: 1 });
			return sportsConstants[sportType].fieldCoordinates;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.getPlayerReadiness = async function (date, req) {
		try {
			const token = await PlayerApp.getToken(req);
			const userId = token.userId;
			if (!userId) {
				throw ForbiddenError('Not allowed. Token missing');
			}
			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findById(userId);
			if (!customerPlayer) throw InternalError('User not found');
			const player = await PlayerApp.app.models.Player.findById(customerPlayer.playerId, {
				fields: ['_id']
			});
			if (!player) {
				throw new NotFoundError('Player not found');
			}

			return PlayerApp.app.models.Readiness.getPlayerReadiness(customerPlayer.playerId, date);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.getChatPlayers = async function (req) {
		return await PlayerApp.app.models.Chat.getPlayers(req);
	};

	PlayerApp.getChatStaffs = async function (req) {
		return await PlayerApp.app.models.Chat.getStaffs(req);
	};

	PlayerApp.getTeamTestMetrics = async function (req) {
		try {
			const token = await PlayerApp.getToken(req);

			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findById(token.userId);
			if (!customerPlayer) {
				throw InternalError('User not found');
			}

			const player = await PlayerApp.app.models.Player.findById(customerPlayer.playerId, {
				fields: ['teamId', 'id']
			});
			if (!player) throw InternalError('Linked player not found');

			console.log(`[PLAYERAPP] Getting test metrics for team ${player.teamId}`);
			const { metricsTests } = await PlayerApp.app.models.Team.findById(player.teamId, { fields: ['metricsTests'] });
			return metricsTests;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	PlayerApp.getPlayerFitnessProfile = async function (testIds, metrics, req) {
		try {
			const token = await PlayerApp.getToken(req);

			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findById(token.userId);
			if (!customerPlayer) {
				throw InternalError('User not found');
			}

			console.log(`[PLAYERAPP] Getting fitness profile for player ${customerPlayer.playerId}`);
			return await PlayerApp.app.models.ProfilePlayers.getPlayerFitnessProfile(
				customerPlayer.playerId,
				testIds,
				metrics
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	PlayerApp.getPlayerRobustness = async function (req) {
		try {
			const token = await PlayerApp.getToken(req);

			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findById(token.userId);
			if (!customerPlayer) {
				throw InternalError('User not found');
			}

			console.log(`[PLAYERAPP] Getting robustness for player ${customerPlayer.playerId}`);
			const player = await PlayerApp.app.models.Player.findById(customerPlayer.playerId);
			if (!player) throw new InternalError('Player not found');
			const [team, teamSeasons] = await Promise.all([
				PlayerApp.app.models.Team.findById(player.teamId),
				PlayerApp.app.models.TeamSeason.getDataSource()
					.connector.collection(PlayerApp.app.models.TeamSeason.modelName)
					.find({ teamId: ObjectID(player.teamId) })
					.toArray()
			]);
			if (!team) {
				throw InternalError('Team not found!');
			}
			const minutesField = getMinutesField(team);
			const currentTeamSeason = teamSeasons.find(({ offseason, inseasonEnd }) =>
				moment().isBetween(moment(offseason), moment(inseasonEnd))
			);
			if (!currentTeamSeason) {
				throw new InternalError('No season found for the current day');
			}
			return await PlayerApp.app.models.ProfilePlayers.profileRobustness(
				currentTeamSeason.id,
				[customerPlayer.playerId],
				currentTeamSeason.offseason,
				moment(currentTeamSeason.inseasonEnd).isBefore(moment())
					? currentTeamSeason.inseasonEnd
					: moment().endOf('day').toDate(),
				minutesField,
				0,
				player.teamId
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	PlayerApp.getSeasonInfo = async function (teamId, req) {
		try {
			const stats = await PlayerApp.getTeamStatsCached(teamId, req);
			const { gamesDone, gamesTotal, effectiveness, lost, win, draw } = stats;
			return { gamesDone, gamesTotal, effectiveness, lost, win, draw };
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.getTeamStatsCached = async function (teamId, req) {
		try {
			const asyncRedis = require('async-redis');
			const asyncClient = asyncRedis.decorate(Object.create(req.app.redisClient));
			const cacheKey = `PlayerApp_TeamStats_${teamId}`;
			const cachedStats = await asyncClient.get(cacheKey);
			if (!cachedStats) {
				const teamStats = await PlayerApp.app.models.DirectorV2.getTeamStats(teamId);
				asyncClient.set(cacheKey, JSON.stringify(teamStats));
				asyncClient.expire(cacheKey, CACHE_TTL);
				return teamStats;
			} else {
				return JSON.parse(cachedStats);
			}
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	// NOTE: copied fixtures section of DirectorV2.getTeamStats. Considering refactor for extracting common logic and atomizing by context
	PlayerApp.getFixturesInfo = async function (req) {
		try {
			const { teamId } = req.query;

			const [team, teamSeasons] = await Promise.all([
				PlayerApp.app.models.Team.findById(teamId),
				PlayerApp.app.models.TeamSeason.getDataSource()
					.connector.collection(PlayerApp.app.models.TeamSeason.modelName)
					.find({ teamId: ObjectID(teamId) })
					.toArray()
			]);
			if (!team) {
				throw InternalError('Team not found!');
			}

			const currentTeamSeason = teamSeasons.find(({ offseason, inseasonEnd }) =>
				moment().isBetween(moment(offseason), moment(inseasonEnd))
			);
			if (!currentTeamSeason) {
				throw new InternalError('No season found for the current day');
			}

			const dateFrom = moment(currentTeamSeason?.offseason).startOf('day').toDate() || moment().toDate();
			const dateTo = moment(currentTeamSeason?.inseasonEnd).endOf('day').toDate() || moment().toDate();

			const events = await PlayerApp.app.models.Event.find({
				where: {
					teamSeasonId: ObjectID(currentTeamSeason._id),
					format: 'game',
					start: { between: [dateFrom, dateTo] }
				},
				fields: ['title', 'opponent', 'opponentWyscoutId', 'result', 'start', 'home', 'id']
			});

			const remainingGames = sortBy(
				events.filter(({ start }) => moment(start).isAfter(moment())),
				'start'
			);
			const playedGames = sortBy(
				events.filter(({ start }) => moment(start).isBefore(moment())),
				'start'
			).reverse();

			const previous3Games = playedGames.slice(0, 3);
			const next2Games = remainingGames.slice(0, 2).reverse();

			let win = 0;
			let draw = 0;
			let lost = 0;
			let notSet = 0;
			let fixtures = [];

			const totalGames = [...previous3Games, ...next2Games];

			const opponentInfos = await Promise.all(
				totalGames
					.filter(({ opponentWyscoutId }) => opponentWyscoutId)
					.map(({ opponentWyscoutId }) => PlayerApp.app.models.Wyscout.getTeamData(opponentWyscoutId))
			);

			totalGames.forEach(game => {
				let goalHome = null;
				let goalAway = null;
				let resultSplit = game.result ? game.result.split('-') : null;
				if (resultSplit?.length !== 2) {
					resultSplit = game.result ? game.result.split(' ') : null;
				}
				if (resultSplit?.length > 1) {
					goalHome = resultSplit[0];
					goalAway = resultSplit[1];
					resultSplit = resultSplit.map(x => Number(x));
					if (resultSplit[0] === resultSplit[1]) draw = draw + 1;
					else if (resultSplit[0] > resultSplit[1]) {
						win = game.home ? win + 1 : win;
						lost = game.home ? lost : lost + 1;
					} else if (resultSplit[0] < resultSplit[1]) {
						win = game.home ? win : win + 1;
						lost = game.home ? lost + 1 : lost;
					}
				} else notSet = notSet + 1;

				const opponentInfo = opponentInfos.find(({ wyId }) => wyId === game.opponentWyscoutId);
				fixtures.push({
					id: String(game._id || game.id),
					start: game.start,
					date: moment(game.start).format('DD/MM/YYYY'),
					home: game.home,
					goalHome: goalHome ? parseInt(String(goalHome)) : null,
					goalAway: goalAway ? parseInt(String(goalAway)) : null,
					opponent: {
						name: opponentInfo?.name || game.opponent,
						logo: opponentInfo?.imageDataURL || null
					}
				});
			});

			fixtures = fixtures.sort((a, b) => {
				return moment(b['start']).toDate().getTime() - moment(a['start']).toDate().getTime();
			});

			return fixtures;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	// TODO: now it calls always Wyscout. Once we implement the opponent statistics sync into our databases, change this
	PlayerApp.getMatchStats = async function (req) {
		try {
			const token = await PlayerApp.getToken(req);
			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findById(token.userId);
			const { eventId } = req.params;
			console.log(`[PLAYERAPP] Getting match stats for event ${eventId}`);
			const [
				{ opponentWyscoutId: opponentId, wyscoutId: matchId, home, _playerMatchStats, start, playerIds = [] },
				player
			] = await Promise.all([
				PlayerApp.app.models.Event.findById(eventId, {
					opponentWyscoutId: 1,
					wyscoutId: 1,
					home: 1,
					start: 1,
					_playerMatchStats: 1,
					staffIds: 1
				}),
				PlayerApp.app.models.Player.findOne({ where: { _id: customerPlayer.playerId } }, { id: 1 })
			]);

			const { wyscoutId: myTeamId } = await PlayerApp.app.models.Team.findById(player.teamId, { wyscoutId: 1 });

			let current_team = {};
			let opponent_team = {};
			let participants = _playerMatchStats;
			let opponentParticipants = [];

			const isCustomerPresent = playerIds.map(String).includes(String(player?.id));

			if (matchId) {
				const gameDetail = await PlayerApp.app.models.Wyscout.singleTeamStatWithPlayers(matchId);
				const { playersThirdPartyIds, substitutions } = getPlayersThirdPartyIds(gameDetail);
				const [{ teamStats }, playersStats] = await Promise.all([
					PlayerApp.app.models.Wyscout.dashboardSingleTeamStat(
						matchId,
						home ? myTeamId : opponentId,
						home ? opponentId : myTeamId
					),
					PlayerApp.app.models.Wyscout.gamePlayerStats(matchId, playersThirdPartyIds, substitutions)
				]);
				current_team = {
					possessionPercent: teamStats[0]?.average?.possessionPercent,
					successfulPasses: teamStats[0]?.percent?.successfulPasses,
					shots: teamStats[0]?.total?.shots,
					shotsOnTarget: teamStats[0]?.percent?.shotsOnTarget,
					duelsWon: teamStats[0]?.percent?.duelsWon,
					fouls: teamStats[0]?.total?.fouls,
					offsides: teamStats[0]?.total?.offsides,
					corners: teamStats[0]?.total?.corners
				};
				opponent_team = {
					possessionPercent: teamStats[1]?.average?.possessionPercent,
					successfulPasses: teamStats[1]?.percent?.successfulPasses,
					shots: teamStats[1]?.total?.shots,
					shotsOnTarget: teamStats[1]?.percent?.shotsOnTarget,
					duelsWon: teamStats[1]?.percent?.duelsWon,
					fouls: teamStats[1]?.total?.fouls,
					offsides: teamStats[1]?.total?.offsides,
					corners: teamStats[1]?.total?.corners
				};
				[participants, opponentParticipants] = partition(playersStats, ({ teamId }) => teamId === teamStats[0].teamId);
			}

			return {
				eventId: isCustomerPresent ? eventId : undefined,
				eventDate: isCustomerPresent ? start : undefined,
				current_team,
				opponent_team,
				participants,
				opponentParticipants
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerApp.getClub = async function (req) {
		try {
			const token = await PlayerApp.getToken(req);
			const customerPlayer = await PlayerApp.app.models.CustomerPlayer.findById(token.userId);
			const player = await PlayerApp.app.models.Player.findOne({ where: { _id: customerPlayer.playerId } }, { id: 1 });

			const [{ crest, sportType, type }, imageToken, teams] = await Promise.all([
				PlayerApp.app.models.Club.findById(customerPlayer.clubId, { fields: { crest: 1, sportType: 1, type: 1 } }),
				PlayerApp.app.models.Storage.getToken(String(customerPlayer.clubId)),
				PlayerApp.app.models.Team.find({
					where: { id: { inq: [player.teamId] } },
					fields: { id: 1, name: 1 }
				})
			]);
			if (!imageToken) {
				console.error(`[COACHING] Image Token not found for club ${customerPlayer.clubId}`);
			}
			return {
				config: {
					type: type,
					sport: sportType,
					lineup: sportsConstants[sportType].lineup,
					bench: sportsConstants[sportType].bench,
					roles: sportsConstants[sportType].roles,
					positions: sportsConstants[sportType].positions
				},
				imageToken: imageToken.signature,
				teams,
				logo: crest
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};
};

function getPipelineVideos(playerId, teamId, categories) {
	const videoStage = {
		$match: {
			teamId: ObjectID(teamId),
			$expr: { $in: [ObjectID(playerId), '$sharedPlayerIds'] }
		}
	};

	if (categories?.length > 0) {
		videoStage.$match = {
			...videoStage.$match,
			category: { $in: categories }
		};
	}

	return [videoStage];
}

function getColorForFormatSubformatTheme(format, subformat, theme) {
	const palette1 = [
		'#0078D7',
		'#f1c40f',
		'#00CC6A',
		'#FF4343',
		'#FF8C00',
		'#018574',
		'#7f8c8d',
		'#9b59b6',
		'#847545',
		'#add8e6',
		'#00B7C3',
		'#e6addb'
	];

	switch (format) {
		case 'general':
			return palette1[0];
		case 'travel':
			return palette1[11];
		case 'training': {
			switch (theme) {
				case 'gym': {
					return palette1[5];
				}
				case 'reconditioning': {
					return palette1[1];
				}
				case 'recovery': {
					return palette1[9];
				}
				case 'field':
				default: {
					return palette1[2];
				}
			}
		}
		case 'game': {
			return subformat === 'friendly' ? palette1[4] : palette1[3];
		}
		case 'friendly':
			return palette1[4];
		case 'administration':
			return palette1[6];
		case 'medical':
			return palette1[7];
		case 'off':
			return palette1[8];
		case 'international':
			return palette1[10];
	}
}

function getLatestMedicalRecords(medicalRecords) {
	const sorted = sortBy(medicalRecords || [], 'date');
	const latest = last(sorted);
	return omit(latest, ['form']);
}

function extractAttachmentFromContract(contract, type) {
	const { _attachments } = contract || {};
	return (_attachments || []).map(attachment => ({
		...pick(attachment, ['name', 'date', 'downloadUrl', 'externalUrl']),
		type
	}));
}

function getAttributesData(player, videos, team, customers) {
	const attributesMetrics = team.playerAttributes || playerAttributes;

	const offensiveMetrics = attributesMetrics.filter(({ active, category }) => active && category === 'offensive');
	const defensiveMetrics = attributesMetrics.filter(({ active, category }) => active && category === 'defensive');
	const attitudeMetrics = attributesMetrics.filter(({ active, category }) => active && category === 'attitude');

	const { descriptions, attributes } = player;

	const sortedDescriptionEntries = sortBy(descriptions || [], 'date').reverse();
	const mappedDescriptions = sortedDescriptionEntries.map(entry => ({
		...entry,
		author: getAuthorName(customers, sortedDescriptionEntries[0].authorId)
	}));

	const sortedAttributesEntries = sortBy(attributes || [], 'date').reverse();
	const mappedAttributes = sortedAttributesEntries.map((entry, index) => ({
		attacking: mapAttributesCollection(entry, sortedAttributesEntries[index + 1], offensiveMetrics),
		attitude: mapAttributesCollection(entry, sortedAttributesEntries[index + 1], attitudeMetrics),
		defensive: mapAttributesCollection(entry, sortedAttributesEntries[index + 1], defensiveMetrics),
		date: entry.date,
		author: getAuthorName(customers, entry.authorId),
		notesThreads: entry.notesThreads
	}));

	return {
		attributes: mappedAttributes,
		descriptions: mappedDescriptions,
		videos: videos || []
	};
}

function mapAttributesCollection(entry, previousAttributes, selectedAttributes) {
	const values = (entry?.values || []).reduce((acc, { metric, value }) => ({ ...acc, [metric]: value }), {}) || {};
	const previousValues =
		(previousAttributes?.values || []).reduce((acc, { metric, value }) => ({ ...acc, [metric]: value }), {}) || {};
	return {
		...pick(
			values,
			selectedAttributes.map(({ value }) => value)
		),
		increments: getIncrementFromPrevious(values, previousValues, selectedAttributes),
		value: getAttributeSetMeanValue(values, selectedAttributes)
	};
}

function getIncrementFromPrevious(attributes, previousAttributes, selectedAttributes) {
	const picked = pick(
		attributes,
		selectedAttributes.map(({ value }) => value)
	);
	const previousPicked = pick(
		previousAttributes,
		selectedAttributes.map(({ value }) => value)
	);
	return mapValues(picked, (value, key) => getIncrementValue(value, previousPicked[key]));
}

function getIncrementValue(current, previous) {
	if (current > previous) return 1;
	if (current === previous) return 0;
	else return -1;
}

function getAttributeSetMeanValue(attributes, selectedAttributes) {
	if (attributes) {
		const sum = selectedAttributes
			.map(({ value }) => attributes[value])
			.reduce((total, a) => Number(total) + Math.pow(Number(a || 1), 2), 0);
		return Math.round(Math.sqrt(sum / selectedAttributes.length) * 10);
	} else return 0;
}

function getAuthorName(customers, author) {
	const customer = customers.find(({ id }) => String(id) === String(author));
	if (!customer) return '';
	return `${customer.firstName} ${customer.lastName}`;
}

function getPlayerTransfers(playerData) {
	let transfers = (playerData.transfers || []).map(transfer => ({
		year: moment(transfer.startDate).format('YYYY'),
		from: transfer.fromTeamName,
		to: transfer.toTeamName,
		toIcon: transfer.teamsData.toTeam?.team?.imageDataURL,
		toNationality: transfer.teamsData.toTeam?.team?.area?.alpha2code,
		amount: transfer.value
	}));
	transfers = sortBy(transfers, 'year').reverse();
	return transfers;
}

function getPlayerCareer(playerData) {
	let careers = (playerData.career || []).map(info => ({
		firstYear: moment(info.season?.startDate, 'YYYY-MM-DD').format('YY'),
		lastYear: moment(info.season?.endDate, 'YYYY-MM-DD').format('YY'),
		competition: info.competition?.name || '',
		team: info.team?.name || '',
		clubCrest: info.team?.imageDataURL,
		apps: info.appearances,
		goalScored: info.goal,
		mins: info.minutesPlayed
	}));
	careers = sortBy(careers, 'season').reverse();
	return careers;
}

function getExtension(filename) {
	const parts = filename.split('.');
	return parts[parts.length - 1];
}

function getType(filename) {
	try {
		const ext = getExtension(filename);
		switch (ext.toLowerCase()) {
			case 'jpg':
			case 'jpeg':
			case 'gif':
			case 'bmp':
			case 'png':
				return 'image';
		}
		return 'file';
	} catch (e) {
		return 'file';
	}
}

function sortByTime(array, field) {
	return array.sort((a, b) => {
		return moment(a[field]).toDate().getTime() - moment(b[field]).toDate().getTime();
	});
}

function getPlayerEventsPipeline(teamId, playerId, dateStart, dateEnd) {
	const matchStage = {
		$match: {
			teamId: ObjectID(teamId),
			start: {
				$gte: moment(dateStart).startOf('day').toDate(),
				$lte: moment(dateEnd).endOf('day').toDate()
			}
		}
	};
	const match2Stage = {
		$match: {
			$or: [
				{ playerIds: ObjectID(playerId) },
				{ $and: [{ '_playerMatchStats.playerId': String(playerId) }, { '_playerMatchStats.enabled': true }] }
			]
		}
	};
	const projectionStage = {
		$project: {
			_id: 1,
			id: 1,
			start: 1,
			end: 1,
			title: 1,
			format: 1,
			subformat: 1,
			theme: 1
		}
	};
	return [matchStage, match2Stage, projectionStage];
}

function getFullEventPipeline(eventId) {
	const matchStage = {
		$match: {
			_id: ObjectID(eventId)
		}
	};
	const projectionStage = {
		$project: {
			_id: 1,
			id: 1,
			start: 1,
			end: 1,
			title: 1,
			author: 1,
			teamId: 1,
			teamSeasonId: 1,
			type: 1,
			individual: 1,
			description: 1,
			format: 1,
			subformat: 1,
			theme: 1,
			subtheme: 1,
			where: 1,
			subformatDetails: 1,
			opponent: 1,
			opponentImageUrl: 1,
			home: 1,
			friendly: 1,
			destination: 1,
			recoveryStrategy: 1,
			nutritionalPre: 1,
			nutritionalDuring: 1,
			nutritionalPost: 1,
			testModel: 1,
			workload: 1,
			intensity: 1,
			playerIds: 1,
			staffIds: 1,
			injuryId: 1,
			medicalType: 1,
			notes: 1,
			wyscoutId: 1,
			instatId: 1,
			teamReport: 1,
			_sessionPlayers: 1,
			_playerMatchStats: 1,
			_opponentPlayerMatchStats: 1,
			_drills: 1,
			_drillsExecuted: 1,
			_attachments: 1
		}
	};

	// NOTE: because video.linkedId is string and event._id is ObjectId. Remove when switching to polymorphic belongsTo relation
	const addFieldsStage = { $addFields: { eventId: { $toString: '$_id' } } };
	const lookupVideoStage = {
		$lookup: {
			from: 'VideoAsset',
			localField: 'eventId',
			foreignField: 'linkedId',
			as: 'videos'
		}
	};
	const lookupMatchStage = {
		$lookup: {
			from: 'Match',
			localField: '_id',
			foreignField: 'eventId',
			as: 'match'
		}
	};
	const lookupTeamStage = {
		$lookup: {
			from: 'Team',
			localField: 'teamId',
			foreignField: '_id',
			as: 'team'
		}
	};
	const lookupTeamSeasonStage = {
		$lookup: {
			from: 'TeamSeason',
			localField: 'teamSeasonId',
			foreignField: '_id',
			as: 'season'
		}
	};
	return [
		matchStage,
		projectionStage,
		addFieldsStage,
		lookupVideoStage,
		lookupMatchStage,
		lookupTeamStage,
		lookupTeamSeasonStage
	];
}

function prepareBonus(bonus, club, teamSeasons, req) {
	const language = req.headers['accept-language'] || 'en-US';
	const bonusLabel = getBonusLabel(bonus, language);
	const bonusText = getBonusTranslatedText(bonus, club, teamSeasons, req);

	const percentage = getBonusPercentage(bonus);

	bonus.conditions.forEach(condition => {
		condition.text = getConditionText(condition, bonus, club, teamSeasons, req);
	});

	return {
		bonusCount: bonus.bonusCount,
		bonusTotal: bonus.bonusTotal,
		bonus: bonus.type,
		percentage: parseInt(percentage.toString()),
		bonusText,
		bonusLabel,
		conditions: bonus.conditions
	};
}

function getConditionText(condition, bonus, club, seasons, req) {
	const language = req.headers['accept-language'] || 'en-US';
	const text = getSingleConditionSimplified(condition, bonus, club, seasons, language);
	return text;
}

function getBonusLabel(bonus, language) {
	const translated = translate(`admin.contracts.${bonus.type}`, language);
	const bonusLabel = `${bonus.personType === 'Agent' && bonus.agentId ? 'Agent ' : ''}${translated}`;
	return bonusLabel;
}

function getBonusTranslatedText(bonus, club, seasons, language) {
	const text = getBonusText(bonus, false, null, false, false, club.name, null, null, seasons, language);
	return text;
}

function getBonusPercentage(bonus) {
	return bonus.type === 'appearanceFee' || bonus.type === 'performanceFee' || bonus.reached
		? 100
		: bonus.progress?.percentage !== null
		? Math.round(bonus.progress.percentage || 0)
		: 0;
}

// function interpolatePlayer(player, seasonPlayers) {
// 	const found = seasonPlayers
// 		.map(player => JSON.parse(JSON.stringify(player)))
// 		.find(({ id }) => String(player.playerId) === String(id));
// 	return {
// 		...player,
// 		displayName: found?.displayName,
// 		img: found?.downloadUrl,
// 		nationality: found?.nationality
// 	};
// }

function getMinutesField(team) {
	return team._playerProviderMapping?.durationField || 'minutesOnField';
}

function getPlayersThirdPartyIds(gameDetail) {
	if (!gameDetail) {
		return {
			playersThirdPartyIds: [],
			substitutions: {},
			gameDetail: null
		};
	}
	const teamsThirdPartyIds = Object.keys(gameDetail.teamsData);
	let playersThirdPartyIds = [];
	const substitutions = {};
	let formation;
	teamsThirdPartyIds
		.filter(teamsThirdPartyId => gameDetail.teamsData[teamsThirdPartyId].hasFormation)
		.forEach(teamsThirdPartyId => {
			formation = gameDetail.teamsData[teamsThirdPartyId].formation;
			substitutions[teamsThirdPartyId] = formation.substitutions;
			playersThirdPartyIds = playersThirdPartyIds.concat(
				[...formation.lineup, ...formation.bench].map(({ playerId, player }) => ({
					playerId: Number(playerId),
					teamsThirdPartyId: Number(teamsThirdPartyId) || Number(player?.currentTeamId),
					playerName: player.shortName
				}))
			);
		});
	return { playersThirdPartyIds, substitutions, gameDetail };
}

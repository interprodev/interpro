const moment = require('moment');
const { v4: uuid } = require('uuid');
const ObjectID = require('mongodb').ObjectID;
const { difference, differenceBy, isEmpty, sortBy, uniq, omit } = require('lodash');
const Promise = require('bluebird');
const { EventError, NotFoundError } = require('../modules/error');
const tacticalInfoProvider = require('../../server/models/thirdparty-connectors/tacticalInfoProvider');
const { defaultField } = require('../../config/event.config.json');
const {
	pushEventToAzureQueue,
	medicalThresholdQueueName,
	robustnessQueueName,
	thresholdQueueName,
	getPayloadForQueue
} = require('../modules/az-storage-queue');
const { pushToEWMALambdaFunction } = require('../modules/lambda-ewma');
const { setPrefetchedDataIfNotExist } = require('../modules/prefetchDataUtils/prefetchedData');

module.exports = function (Event) {
	Event.observe('after delete', async ctx => {
		console.log(`[EVENT] Deleted ${ctx.Model.name} matching ${ctx.where.id}`);
	});

	Event.observe('after save', async ctx => {
		try {
			console.log(
				`[EVENT] ${ctx.isNewInstance ? `Created` : `Updated`} ${ctx.Model.name} with id ${String(ctx.instance.id)}`
			);
		} catch (e) {
			throw EventError(e);
		}
	});

	Event.saveEvent = async function (eventToSave, notify) {
		try {
			const isNewInstance = !eventToSave?.id;
			console.log(isNewInstance ? `[EVENT] Creating event ...` : `[EVENT] Updating event ${eventToSave.id}...`);
			const currentInstance = isNewInstance
				? null
				: await Event.findById(eventToSave.id, { fields: ['staffIds', 'playerIds'] });

			// ==== BEFORE SAVE LOGIC ====
			await Event.removeMedicalTreatments(isNewInstance, eventToSave, currentInstance);

			// ==== SAVE ====
			const saved = await Event.upsert(eventToSave);

			// ==== AFTER SAVE LOGIC ====
			// -- SEND CHANGE NOTIFICATIONS
			if (notify && currentInstance) {
				await Event.sendUpdateNotification(eventToSave, currentInstance);
			}

			// -- SEND INVITE NOTIFICATIONS
			await Event.sendEventInvitations(isNewInstance, saved, currentInstance);

			// -- TRIGGER LAMBDA FUNCTIONS
			const eventTypes = ['general', 'off', 'travel', 'assessment', 'international', 'administration', 'medical'];
			const playerDiff = getOnlyEditedPlayerIds(currentInstance?.playerIds || [], saved.playerIds || []);
			let queueResult;
			if (eventTypes.includes(saved.format)) {
				const [team, currentSeason] = await getCommonTeamSeasonForQueues(Event, saved.teamId, saved.teamSeasonId);
				const queuesToPush = isAssessmentEvent(saved) ? [medicalThresholdQueueName] : [robustnessQueueName];
				const playerIds = isAssessmentEvent(saved) ? playerDiff : currentSeason.playerIds;
				queueResult = await handleQueuesForEvents(
					Event,
					saved,
					omit(team, ['enabledModules']),
					currentSeason,
					queuesToPush,
					playerIds
				);
			}
			return { result: saved, message: [queueResult] };
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.saveEventMatch = async function (eventToSave, notify) {
		try {
			console.log(`[EVENT] Updating match event ${eventToSave.id}...`);
			const currentInstance = await Event.findById(eventToSave.id, { fields: ['staffIds', 'playerIds'] });

			// ==== BEFORE SAVE LOGIC ====
			eventToSave = await Event.updateSessionPlayerData(eventToSave);
			eventToSave = await Event.updatePlayerMatchStats(eventToSave);

			// ==== SAVE ====
			const saved = await Event.upsert(eventToSave);

			// ==== AFTER SAVE LOGIC ====
			// -- UPDATE MATCH
			await Event.app.models.Match.updateRelatedMatch(saved);

			// -- SEND CHANGE NOTIFICATIONS
			if (notify) {
				await Event.sendUpdateNotification(eventToSave, currentInstance);
			}

			// -- SEND INVITE NOTIFICATIONS
			await Event.sendEventInvitations(false, saved, currentInstance);

			// -- TRIGGER LAMBDA FUNCTIONS
			const [team, currentSeason] = await getCommonTeamSeasonForQueues(Event, saved.teamId, saved.teamSeasonId);
			const queueResultArray = [
				await handleQueuesForEvents(
					Event,
					saved,
					omit(team, ['enabledModules']),
					currentSeason,
					[thresholdQueueName],
					saved.playerIds || []
				),
				await handleQueuesForEvents(
					Event,
					saved,
					omit(team, ['enabledModules']),
					currentSeason,
					[robustnessQueueName],
					currentSeason.playerIds || []
				)
			];
			await handleEWMA(saved, team, currentSeason);
			return { result: saved, message: queueResultArray };
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.saveEventTraining = async function (eventToSave, notify) {
		try {
			console.log(`[EVENT] Updating training event ${eventToSave.id}...`);
			const currentInstance = await Event.findById(eventToSave.id, { fields: ['staffIds', 'playerIds'] });

			// ==== BEFORE SAVE LOGIC ====
			eventToSave = await Event.updateSessionPlayerData(eventToSave);

			// ==== SAVE ====
			const saved = await Event.upsert(eventToSave);

			// ==== AFTER SAVE LOGIC ====
			if (notify) {
				await Event.sendUpdateNotification(eventToSave, currentInstance);
			}

			// -- SEND INVITE NOTIFICATIONS
			await Event.sendEventInvitations(false, saved, currentInstance);

			// -- TRIGGER LAMBDA FUNCTIONS
			const [team, currentSeason] = await getCommonTeamSeasonForQueues(Event, saved.teamId, saved.teamSeasonId);
			const queueResultArray = await handleQueuesForEvents(
				Event,
				saved,
				omit(team, ['enabledModules']),
				currentSeason,
				[robustnessQueueName],
				currentSeason.playerIds || []
			);
			await handleEWMA(saved, team, currentSeason);
			return { result: saved, message: queueResultArray };
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.saveEventAssessment = async function (event) {
		try {
			const currentEvent = await Event.findById(event.id);
			console.log(`[EVENT] Updating assessment event ${event.id}...`);
			const saved = await currentEvent.updateAttributes({
				playerIds: event.playerIds
			});
			const playerIds = saved.playerIds;
			let queueResult;
			if (!!playerIds && playerIds.length) {
				const [team, currentSeason] = await getCommonTeamSeasonForQueues(Event, saved.teamId, saved.teamSeasonId);
				const linkedTestInstance = await Event.app.models.TestInstance.findOne({
					where: { eventId: event.id },
					fields: { id: 1, testId: 1 }
				});
				queueResult = await handleQueuesForEvents(
					Event,
					event,
					omit(team, ['enabledModules']),
					currentSeason,
					[medicalThresholdQueueName],
					playerIds,
					linkedTestInstance.testId
				);
			}
			return { result: saved, message: [queueResult] };
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.saveEventRpe = async function (event) {
		try {
			console.log(`[EVENT] Updating RPE for event ${event.id}...`);
			let persistedEvent = await Event.findById(event.id);
			for (const session of event._sessionPlayers) {
				const sessionToUpdate = persistedEvent._sessionPlayers.find(
					({ playerId, splitName }) =>
						String(playerId) === String(session.playerId) && splitName.toLowerCase() === session.splitName.toLowerCase()
				);
				if (sessionToUpdate) {
					sessionToUpdate.rpe = session.rpe || null;
					sessionToUpdate.rpeTl = session.rpeTl || null;
				}
			}
			persistedEvent = await Event.calculateInternalMetricsForEvent(persistedEvent);
			const eventSaved = await Event.upsert(persistedEvent);

			await Event.app.models.Notification.checkForWorkloadScoreFluctuation(event, event.teamId);

			const [team, currentSeason] = await getCommonTeamSeasonForQueues(Event, event.teamId, event.teamSeasonId);
			let queueResult;
			if (isGameEvent(event)) {
				queueResult = await handleQueuesForEvents(
					Event,
					event,
					omit(team, ['enabledModules']),
					currentSeason,
					[thresholdQueueName],
					event.playerIds || []
				);
			}
			await handleEWMA(event, team, currentSeason);
			return { result: eventSaved, message: [queueResult] };
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.deleteAssociatedElements = async function (eventId) {
		try {
			const linkedMatch = await Event.app.models.Match.findOne({ where: { eventId } });
			if (linkedMatch) {
				console.log('\t[EVENT] Found an associated match with id %s. Deleting it', linkedMatch.id);
				await Event.app.models.Match.destroyById(linkedMatch.id);
			}

			const videoAssetCollection = Event.app.models.VideoAsset.getDataSource().connector.collection(
				Event.app.models.VideoAsset.modelName
			);
			const linkedVideos = await videoAssetCollection
				.find({ linkedId: String(eventId), linkedModel: 'Event' })
				.toArray();

			if (!isEmpty(linkedVideos)) {
				const ids = linkedVideos.map(({ _id }) => _id);
				console.log(`\t\t[EVENT] Found ${ids.length} associated VideoAssets. Deleting them`);
				await Promise.all(ids.map(id => Event.app.models.VideoAsset.destroyById(id)));
			}
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Event.deleteEvent = async function (eventId) {
		try {
			console.log(`[EVENT] Deleting event ${eventId}...`);
			const event = await Event.findById(eventId);
			if (!event) {
				console.log(`[EVENT] Event ${eventId} not found!`);
				return { result: true, message: [] };
			}

			await Event.deleteAssociatedElements(eventId);

			const result = await Event.deleteById(eventId);

			const [team, currentSeason] = await getCommonTeamSeasonForQueues(Event, event.teamId, event.teamSeasonId);
			const queueResultArray = [];
			if (isGameEvent(event)) {
				queueResultArray.push(
					await handleQueuesForEvents(
						Event,
						event,
						omit(team, ['enabledModules']),
						currentSeason,
						[thresholdQueueName],
						event.playerIds || []
					)
				);
			}
			if (isGameEvent(event) || isTrainingEvent(event)) {
				queueResultArray.push(
					await handleQueuesForEvents(
						Event,
						event,
						omit(team, ['enabledModules']),
						currentSeason,
						[robustnessQueueName],
						currentSeason.playerIds || []
					)
				);
			}
			await handleEWMA(event, team, currentSeason);
			return { result, message: queueResultArray };
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.createManyEvents = async function (events) {
		try {
			console.log(`[EVENT] Create Many events...`);
			const result = await Event.create(events);
			const queueResult = [];
			for (const event of result) {
				const eventTypes = ['general', 'off', 'travel', 'assessment', 'international', 'administration', 'medical'];
				if (!!event.playerIds && event.playerIds.length > 0 && eventTypes.includes(event.format)) {
					const [team, currentSeason] = await getCommonTeamSeasonForQueues(Event, event.teamId, event.teamSeasonId);
					queueResult.push(
						await handleQueuesForEvents(
							Event,
							event,
							omit(team, ['enabledModules']),
							currentSeason,
							[robustnessQueueName],
							event.playerIds
						)
					);
				}
			}
			return { result, message: queueResult };
		} catch (e) {
			throw EventError(e);
		}
	};

	// TODO change to GET
	Event.getEventsOnlySessionImport = async function (teamId, metrics, drillsIncluded = false, startDate, endDate) {
		try {
			console.log(
				`[EVENT] Getting event with only session import data between ${moment(startDate).format(
					'DD/MM/YYYY'
				)} and ${moment(endDate).format('DD/MM/YYYY')} for ${teamId}`
			);
			const response = {};
			const eventCollection = Event.getDataSource().connector.collection(Event.modelName);
			const pipe = [
				{
					$match: {
						teamId: ObjectID(teamId),
						start: { $gte: startDate, $lte: endDate },
						format: { $in: ['game', 'friendly', 'training'] }
					}
				},
				{
					$project: {
						_sessionPlayers: false,
						_playerMatchStats: false,
						_opponentPlayerMatchStats: false,
						_drills: false,
						_drillsExecuted: drillsIncluded
					}
				}
				// {
				// 	$sort: { start: -1 }
				// }
			];
			const results = sortBy(await eventCollection.aggregate(pipe).toArray(), 'start').reverse();
			results.forEach(x => {
				x.id = x._id;
			});

			response.preselectedSession = null;
			if (!isEmpty(metrics) && !isEmpty(results) && results[0]._id) {
				// const _sessionPlayers = await Event.singleSessionDataAnalysis(metrics, results[0]._id);
				response.preselectedSession = results[0];
			}
			response.events = results;

			return response;
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.getEventWithSessionPlayerData = async function (eventId) {
		try {
			console.log(`[EVENT] Getting event ${eventId} with only training main sessions...`);
			const event = await Event.findById(eventId);
			event._sessionPlayers = event._sessionPlayers.filter(session => session.mainSession);
			return event;
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.resetGPSDataForEvents = async function (eventIds) {
		try {
			const updatedEvents = await Promise.all(
				eventIds.map(id => Event.resetGPSDataForSingleEvent(id).then(event => Event.upsert(event)))
			);
			return updatedEvents;
		} catch (e) {
			throw EventError(e);
		}
	};

	// PLANNING
	Event.resetGPSDataForSingleEvent = async function (eventId) {
		try {
			console.log(`[EVENT] Resetting GPS data for event ${eventId}...`);
			let event = await Event.findById(eventId);
			const [{ club }] = await Event.app.models.Team.getDataSource()
				.connector.collection(Event.app.models.Team.modelName)
				.aggregate([
					{ $match: { _id: event.teamId } },
					{ $lookup: { from: 'Club', localField: 'clubId', foreignField: '_id', as: 'club' } },
					{ $unwind: '$club' }
				])
				.toArray();

			const rpeMap = {};
			event._sessionPlayers.forEach(session => {
				if (session.rpe !== null && session.rpe !== 0) rpeMap[String(session.playerId)] = session.rpe;
			});

			if (event.csvGps) {
				try {
					await Event.app.models.Storage.deleteFile(String(club._id), event.csvGps);
				} catch (e) {
					console.error(e);
				}
				event.csvGps = null;
			}

			event.gpsSessionLoaded = false;
			event._sessionImport = null;
			event._sessionPlayers = [];
			event._drillsExecuted = [];

			event = await Event.updateSessionPlayerData(event);
			event._sessionPlayers.forEach(session => {
				if (session.mainSession && String(session.playerId) in rpeMap) {
					const matchStats = event._playerMatchStats.find(
						({ enabled, minutesPlayed, playerId }) =>
							enabled && String(playerId) === String(session.playerId) && minutesPlayed
					);
					const duration = matchStats?.minutesPlayed || session?.duration;
					session.rpe = rpeMap[String(session.playerId)];
					session.rpeTl = session.rpe * duration;
				}
			});
			const [team, currentSeason] = await getCommonTeamSeasonForQueues(Event, event.teamId, event.teamSeasonId);
			const result = event;
			if (isGameEvent(event)) {
				await handleQueuesForEvents(
					Event,
					event,
					omit(team, ['enabledModules']),
					currentSeason,
					[thresholdQueueName],
					event.playerIds || []
				);
			}
			if (isGameEvent(event) || isTrainingTeamSessionEvent(event)) {
				await handleQueuesForEvents(
					Event,
					event,
					omit(team, ['enabledModules']),
					currentSeason,
					[robustnessQueueName],
					currentSeason.playerIds || []
				);
			}
			await handleEWMA(result, team, currentSeason);
			return result;
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.updatePlayerMatchStats = async function (eventToSave) {
		for (const stat of eventToSave._playerMatchStats) {
			if (stat.enabled && stat.minutesPlayed) {
				const sessionLinked = eventToSave._sessionPlayers
					.filter(({ mainSession }) => mainSession)
					.find(({ playerId }) => String(playerId) === String(stat.playerId));
				if (sessionLinked && sessionLinked.rpe) {
					sessionLinked.rpeTl = sessionLinked.rpe * stat.minutesPlayed;
				}
			}
		}
		return eventToSave;
	};

	Event.updateSessionPlayerData = async function (event) {
		try {
			console.log(`[EVENT] Updating session data with event ${event.id} playerIds...`);
			const isGame = isGameEvent(event);
			const team = await Event.app.models.Team.findOne({
				where: { id: event.teamId },
				fields: { id: 1, mainGameName: 1, mainSplitName: 1 }
			});
			const nameSession = `${moment(event.start).format('DD/MM/YYYY hh:mm')} ${isGame ? 'GAME' : 'SESSION'}`;
			const date = moment(event.start).startOf('day').toDate();
			const identifier = `${event.teamId.toString()}_${nameSession}`;
			const gdType = event.type;
			if (!event._sessionImport) {
				console.debug(`\tSession Import Data not found, creating one with associated Session Player Data...`);
				event._sessionImport = {
					nameSession,
					date,
					identifier,
					gdType,
					teamId: event.teamId
				};
				const players = await Event.app.models.Player.find({
					where: { id: { inq: event.playerIds.map(id => id.toString()) } },
					fields: { id: 1, displayName: 1 }
				});
				event._sessionPlayers = event.playerIds.map(playerId => {
					const playerMatchStats = event._playerMatchStats.find(stat => String(playerId) === String(stat.playerId));
					const player = players.find(player => String(player.id) === String(playerId));
					if (player) {
						const dummySession = {
							complete: false,
							date,
							dirty: false,
							playerName: player.displayName,
							playerId,
							splitName: isGame ? team.mainGameName : team.mainSplitName,
							mainSession: true,
							splitStartTime: event.start,
							splitEndTime: event.end,
							duration: isGame ? playerMatchStats?.minutesPlayed || 0 : event.duration,
							rpe: null,
							rpeTl: null,
							teamId: team.id
						};
						return dummySession;
					}
				});
			} else {
				console.debug(`\tSession Import Data found, updating it with its Session Player Data...`);
				event._sessionPlayers = event._sessionPlayers.filter(({ playerId }) =>
					event.playerIds.find(id => String(id) === String(playerId))
				);
				for (const playerId of event.playerIds) {
					const foundSession = event._sessionPlayers.find(session => String(session.playerId) === String(playerId));
					if (!foundSession) {
						const playerMatchStats = event._playerMatchStats.find(stat => String(playerId) === String(stat.playerId));
						const date = moment(event.start).startOf('day').toDate();
						const player = await Event.app.models.Player.findOne({
							where: { id: playerId },
							fields: { displayName: 1 }
						});
						const sessionPlayerDummy = {
							date: date,
							dirty: false,
							complete: false,
							playerName: player.displayName,
							playerId,
							splitName: isGame ? team.mainGameName : team.mainSplitName,
							mainSession: true,
							splitStartTime: event.start,
							splitEndTime: event.end,
							duration: isGame ? playerMatchStats?.minutesPlayed || 0 : foundSession?.duration || event?.duration,
							rpe: null,
							rpeTl: null,
							teamId: team.id
						};
						event._sessionPlayers.push(sessionPlayerDummy);
					}
				}
			}
			if (!isGame) {
				const dirtySessions = event._sessionPlayers
					.filter(({ mainSession }) => mainSession)
					.map(({ playerId, dirty }) => ({ playerId, dirty }));
				if (dirtySessions.length > 0) {
					console.debug(`\tUpdating modified sessions...`);
					for (const session of event._sessionPlayers) {
						if (session.mainSession) {
							const foundDirty = dirtySessions.find(({ playerId }) => String(playerId) === String(session.playerId));
							session.dirty = foundDirty ? foundDirty.dirty : false;
						}
					}
				}
			}
			if (!event.gpsSessionLoaded) {
				console.debug(`\tNo GPS uploaded, updating general information...`);
				event._sessionImport.name = nameSession;
				event._sessionImport.date = date;
				event._sessionImport.identifier = identifier;
				for (const session of event._sessionPlayers) {
					const playerMatchStats = event._playerMatchStats.find(
						stat => String(session.playerId) === String(stat.playerId)
					);
					session.splitStartTime = event.start;
					session.splitEndTime = event.end;
					session.duration = isGame ? playerMatchStats?.minutesPlayed || 0 : session.duration || event.duration;
					session.rpeTl = session.rpe * session.duration;
				}
			}
			return event;
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.setSessionPlayerDirtyStatus = async function (eventId, sessionId, dirty) {
		try {
			console.log(`[EVENT] Setting as dirty session player data ${sessionId} for event ${eventId}`);
			const event = await Event.findById(eventId);
			const index = event._sessionPlayers.findIndex(session => session.id === sessionId);
			if (index > -1) {
				event._sessionPlayers[index].dirty = dirty;
			}
			const saved = await Event.upsert(event);
			return saved;
		} catch (e) {
			throw EventError(e);
		}
	};

	// TODO change to GET
	Event.singleSessionDataAnalysis = async function (metrics, eventId) {
		try {
			console.log(`[EVENT] Getting session player data for event ${eventId}...`);
			const totalMetrics = [...defaultField, ...metrics];
			const event = await Event.findOne({ where: { id: eventId } });
			if (!event) return [];

			const thresholdsMap = await Event.getThresholdsForEvent(event);

			const stringified = JSON.parse(JSON.stringify(event._sessionPlayers || []));

			for (const session of stringified) {
				const playerThresholds = thresholdsMap.get(String(session.playerId));
				for (const field in session) {
					if (!totalMetrics.includes(field)) {
						delete session[defaultField];
					}

					const thresholdMetric = playerThresholds.find(({ name }) => name === field);
					if (thresholdMetric) {
						const value = thresholdMetric[thresholdMetric.format];
						session[`${field}Threshold`] = value;
						session[`${field}Norm`] = getNorm(session[field], value);
						session[`${field}Semaphore`] = getSemaphore(session[field], value);
					}
				}
			}
			return stringified.sort((a, b) => new Date(a.splitStartTime) - new Date(b.splitStartTime));
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.getThresholdsForEvent = async function ({ _sessionPlayers, type }) {
		const playerIds = uniq(_sessionPlayers.map(({ playerId }) => String(playerId)));
		const players = await Event.app.models.Player.find({
			where: { _id: { in: playerIds.map(ObjectID) } },
			fields: ['_thresholds', 'id']
		});
		const thresholdsByPlayer = players.map(({ id, _thresholds }) => {
			const thresholdsForGDType = _thresholds.find(({ name }) => name === type);
			return [String(id), thresholdsForGDType?.thresholds || []];
		});
		const thresholdsMap = new Map(thresholdsByPlayer);
		return thresholdsMap;
	};

	Event.uploadCsvDataMatch = async function (teamId, matchId, csvData) {
		try {
			console.log(`[EVENT] Uploading csv for match ${matchId}`);
			const [match, { clubId }] = await Promise.all([
				Event.app.models.Match.findById(matchId, { include: 'event' }),
				Event.app.models.Team.findById(teamId, { clubId: 1 })
			]);
			let event = await Event.findById(match.event.id);
			if (event) {
				const file = await Event.app.models.Storage.uploadFile(String(clubId), csvData);
				if (file) {
					event.csvTeam = file;
					event = await Event.upsert(event);
					return event;
				} else {
					throw new Error('[EVENT] Error while uploading file!');
				}
			} else {
				throw new Error('[EVENT] Event not found!');
			}
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.recalculateDefaultMetrics = async function (eventIds) {
		try {
			console.log(`[EVENT] Re-calculating default metrics (with workload) for events %s...`, eventIds);
			if (eventIds && eventIds.length > 0) {
				return await Promise.all(eventIds.map(eventId => Event.recalculateMetricsForSingleEvent(eventId, true)));
			} else {
				throw new Error('No event ids provided!');
			}
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.recalculateMetricsForSingleEvent = async function (eventId, includeWorkload) {
		try {
			const persistedEvent = await Event.findById(eventId);
			const savedEvent = await Event.calculateInternalMetricsForEvent(persistedEvent, includeWorkload);
			await Event.upsert(savedEvent);
			const [team, currentSeason] = await getCommonTeamSeasonForQueues(
				Event,
				savedEvent.teamId,
				savedEvent.teamSeasonId
			);
			let queueResult;
			if (isGameEvent(savedEvent)) {
				queueResult = await handleQueuesForEvents(
					Event,
					savedEvent,
					omit(team, ['enabledModules']),
					currentSeason,
					[thresholdQueueName],
					savedEvent.playerIds || []
				);
			}
			await handleEWMA(savedEvent, team, currentSeason);
			return { result: true, message: [queueResult] };
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.calculateInternalMetricsForEvent = async function (event, includeWorkload = true, includeRawMetrics = false) {
		try {
			if (!event) {
				throw new Error('Event not found!');
			}
			console.log(`[EVENT] Calculating internal metrics for event ${event.id || 'new'}...`);
			const team = await Event.app.models.Team.findById(event.teamId, {
				fields: { _gpsProviderMapping: 1 }
			});
			for (let session of event._sessionPlayers) {
				session = Event.app.models.SessionPlayerData.calculateDefaultMetrics(session, event, team, includeRawMetrics);
				if (includeWorkload) {
					session = await Event.app.models.SessionPlayerData.calculateWorkload(session);
				}
			}
			return event;
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.buildEventFromGPSData = async function (
		event,
		sessionImport,
		sessionsPlayerData,
		isMatch,
		{ teamId, mainGameName },
		authorId
	) {
		sessionsPlayerData = await Event.updateDrillInfo(sessionsPlayerData, teamId, authorId);

		if (isMatch) {
			sessionsPlayerData
				.filter(({ mainSession }) => mainSession)
				.forEach(session => (session.splitName = mainGameName));
		}

		const rpeMap = getExistingRPEMap(event);
		event._sessionPlayers = updateSessionPlayers(event._sessionPlayers, sessionsPlayerData, event, rpeMap);
		event.playerIds = Array.from(new Set(event._sessionPlayers.map(({ playerId }) => String(playerId))));
		event._sessionImport = sessionImport;

		if (!isMatch) {
			event._drillsExecuted = getDrillsExecuted(event);
		} else {
			(event._playerMatchStats || []).forEach(
				playerStat => (playerStat.enabled = event.playerIds.map(id => String(id)).includes(String(playerStat.playerId)))
			);
			(event._sessionPlayers || []).forEach(session => {
				if (
					!session.splitStartTime ||
					(moment(session.splitStartTime).isSame(moment(session.date)) && session.duration)
				) {
					session.splitStartTime = event.start;
					session.splitEndTime = moment(event.start).add(session.duration, 'minutes').toDate();
				}
				if (session.mainSession && session.splitName !== mainGameName) session.splitName = mainGameName;
			});
		}
		event.gpsSessionLoaded = true;
		return event;
	};

	Event.updateDrillInfo = async function (sessionsPlayerData, teamId, authorId) {
		sessionsPlayerData = sessionsPlayerData.filter(({ splitName }) => splitName.toLowerCase() !== 'all');
		const teamDrills = await Event.app.models.Drill.find({ where: { teamId: ObjectID(teamId) } });
		const newDrills = [];
		for (const session of sessionsPlayerData) {
			if (!session.mainSession && session.drillToConvert) {
				let drill = session.drillId
					? teamDrills.find(({ id }) => String(id) === String(session.drillId))
					: newDrills.find(({ name }) => name === session.splitName);
				if (!drill) {
					drill = await Event.createDrillFromSessionSplitName(session.splitName, teamId, authorId);
					newDrills.push(drill);
					teamDrills.push(drill);
				}
				session.drillId = ObjectID(String(drill.id));
			}
		}
		return sessionsPlayerData;
	};

	Event.createDrillFromSessionSplitName = async function (name, teamId, authorId) {
		const drill = await Event.app.models.Drill.create({
			teamId: ObjectID(teamId),
			name,
			authorId: ObjectID(authorId),
			_attachments: [],
			sharedWithIds: [ObjectID(authorId)]
		});
		return drill;
	};

	Event.getAssociatedEvent = async function (sessionImport) {
		let event;
		if (sessionImport.matchId || sessionImport.eventId) {
			event = await Event.findById(sessionImport.matchId || sessionImport.eventId);
		}
		return event ? JSON.parse(JSON.stringify(event)) : null;
	};

	Event.importGPSEvent = async function (sessionsToImport, teamId, userString, userId) {
		try {
			console.log(`[EVENT] Importing events for team ${teamId}...`);
			const [allSeasons, { clubId, device, mainGameName }] = await Promise.all([
				Event.app.models.TeamSeason.getDataSource()
					.connector.collection(Event.app.models.TeamSeason.modelName)
					.find({ teamId: ObjectID(teamId) })
					.toArray(),
				Event.app.models.Team.findById(teamId, { clubId: 1 })
			]);

			const confirmMessages = [];
			const events = [];
			const errors = [];
			let numberSessions = 0;
			const queueResult = [];
			for (const session of sessionsToImport) {
				let foundError = false;

				const csvData = session.sessionImport.csvFile;
				delete session.sessionImport.csvFile;

				let event = await Event.getAssociatedEvent(session);
				const mainSession = session.sessionPlayerData.find(({ mainSession }) => mainSession);
				if (event) {
					console.log(`\tFound event ${event.id}. Updating...`);
				} else {
					console.log(`\tEvent not found for session ${session.sessionImport.identifier}. Creating a new one...`);
					if (mainSession) {
						const teamSeason = allSeasons.find(({ offseason, inseasonEnd }) =>
							moment(mainSession.splitStartTime).isBetween(moment(offseason), moment(inseasonEnd))
						);
						event = {
							title: `training ${session.sessionImport.nameSession}`,
							start: moment(mainSession.splitStartTime).toDate(),
							end: moment(mainSession.splitEndTime).toDate(),
							description: '',
							allDay: false,
							format: session.matchId ? 'game' : 'training',
							playerIds: [],
							teamId,
							teamSeasonId: teamSeason ? String(teamSeason._id) : null,
							type: session.sessionImport.gdType,
							_sessionImport: null,
							_sessionPlayers: []
						};
					} else {
						errors.push(`Session with name ${session.nameSession} has not a main split session`);
						foundError = true;
					}
				}

				event.duration = getMostOccurredDuration(session);
				event.end = moment(event.start)
					.add(event.duration || 60, 'minutes')
					.toDate();
				event.lastUpdateDate = moment().toDate();
				event.lastUpdateAuthor = userString; // TODO: change with UserId
				event = await Event.buildEventFromGPSData(
					event,
					session.sessionImport,
					session.sessionPlayerData,
					!!session.matchId,
					{ teamId: String(teamId), mainGameName },
					userId
				);
				if (!foundError && csvData) {
					const rawFile = await Event.app.models.Storage.uploadFile(String(clubId), csvData);
					if (rawFile) {
						event.csvGps = rawFile;
					}
				}

				event = await Event.calculateInternalMetricsForEvent(event, true, device !== 'Dynamic');
				event = await Event.upsert(event);

				await Event.app.models.Notification.checkForImportEventNotifications(event, teamId);
				await Event.app.models.Notification.checkForWorkloadScoreFluctuation(event, teamId);

				confirmMessages.push(`${event.playerIds.length} players imported correctly.\n`);
				events.push({
					name: `Session ${moment(event.start).format('DD/MM/YYYY HH:mm')}`,
					start: event.start,
					eventId: event.id
				});
				numberSessions += foundError ? 0 : 1;
				const [team, currentSeason] = await getCommonTeamSeasonForQueues(Event, event.teamId, event.teamSeasonId);
				if (isGameEvent(event)) {
					queueResult.push(
						await handleQueuesForEvents(
							Event,
							event,
							omit(team, ['enabledModules']),
							currentSeason,
							[thresholdQueueName],
							event.playerIds || []
						)
					);
				}
				if (isGameEvent(event) || isTrainingTeamSessionEvent(event)) {
					queueResult.push(
						await handleQueuesForEvents(
							Event,
							event,
							omit(team, ['enabledModules']),
							currentSeason,
							[robustnessQueueName],
							currentSeason?.playerIds || []
						)
					);
				}
				await handleEWMA(event, team, currentSeason);
			}

			const response = {
				errors,
				numberSessions,
				confirmMessage: confirmMessages,
				sessEvents: events,
				message: queueResult
			};
			return response;
		} catch (e) {
			throw EventError(e);
		}
	};

	// TODO change to GET
	Event.findEventsWithFilterAndMetrics = async function (filterObj, metrics) {
		try {
			const eventsToReturn = [];
			const totalMetrics = [...defaultField, ...metrics];
			const events = await Event.find(filterObj);
			if (!isEmpty(events)) {
				for (const event of events) {
					const eventJson = JSON.parse(JSON.stringify(event));
					if (eventJson._sessionImport && !isEmpty(eventJson._sessionPlayers)) {
						for (const session of eventJson._sessionPlayers) {
							for (const keyField in session) {
								if (totalMetrics.indexOf(keyField) === -1) {
									delete session[keyField];
								}
							}
						}
					}
					eventsToReturn.push(eventJson);
				}
			}
			return eventsToReturn;
		} catch (e) {
			throw EventError(e);
		}
	};

	// TODO change to GET
	Event.findEventsForMedicalStats = async function (teamId, from, to) {
		try {
			console.log(`[EVENT] Getting aggregated events for Medical Statistics for ${teamId}...`);
			const eventCollection = Event.getDataSource().connector.collection(Event.modelName);
			const pipe = [
				{
					$match: {
						teamId: ObjectID(teamId),
						start: { $lte: to },
						end: { $gte: from },
						format: { $in: ['game', 'friendly', 'training'] }
					}
				},
				{
					$project: {
						id: true,
						start: true,
						format: true,
						playerIds: true,
						individual: true
					}
				},
				{
					$sort: { start: -1 }
				}
			];
			const resultAggr = await eventCollection.aggregate(pipe).toArray();
			resultAggr.forEach(x => {
				x.id = x._id;
			});
			return resultAggr;
		} catch (e) {
			throw EventError(e);
		}
	};

	// TODO change to GET
	Event.eventsForAttendance = async function (teamId, teamSeasonId, playerIds, dateFrom, dateTo, durationField) {
		try {
			console.log(`[EVENT] Getting aggregated events for Attendances for ${teamId}...`);
			const eventCollection = Event.app.models.Event.getDataSource().connector.collection(
				Event.app.models.Event.modelName
			);

			const pipelineStagesEventsAttendance = getPipelineEventsAttendance(
				teamId,
				teamSeasonId,
				playerIds,
				dateFrom,
				dateTo
			);

			const resultEvents = await eventCollection.aggregate(pipelineStagesEventsAttendance).toArray();

			for (const event of resultEvents) {
				if (event.matchId) {
					event.match = { matchId: event.matchId, playerStats: event.playerStats };
				}
			}

			return resultEvents;
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.syncDateRangeEvents = async function (teamId, teamSeasonIds, start, end) {
		try {
			return Event.find({
				where: {
					teamSeasonId: {
						inq: teamSeasonIds
					},
					start: { lte: end },
					end: { gte: start }
				},
				fields: {
					_sessionPlayers: false,
					_attachments: false,
					_drills: false,
					_drillsExecuted: false,
					_sessionImport: false
				},
				include: [
					{
						relation: 'match',
						scope: {
							fields: ['id']
						}
					},
					{
						relation: 'testInstance',
						scope: {
							fields: ['id']
						}
					}
				]
			});
		} catch (e) {
			throw EventError(e);
		}
	};

	Event.syncPeriod = async function (teamId, from, to) {
		try {
			const events = await Event.find({
				where: {
					teamId,
					format: { inq: ['game', 'clubGame'] },
					start: { gte: moment(from).startOf('day').toDate() },
					end: { lte: moment(to).endOf('day').toDate() }
				}
			});
			// Extract provider from event document, if any
			// const [event] = events;
			const provider = 'wyscout';
			// if (event) {
			// 	provider = tacticalInfoProvider.extractProvider(event);
			// }
			const providerIdField = tacticalInfoProvider.getProviderField(provider, 'id'); // now is 'wyscoutId'
			const providerTeamIdField = tacticalInfoProvider.getProviderField(provider, 'teamId');
			const providerSecondaryTeamIdField = tacticalInfoProvider.getProviderField(provider, 'secondaryTeamId');
			const [teamSeasons, team] = await Promise.all([
				Event.app.models.TeamSeason.find({
					where: { teamId },
					fields: ['id', 'playerIds', 'name', 'offseason', 'inseasonEnd']
				}),
				Event.app.models.Team.findById(teamId, {
					fields: {
						id: 1,
						_gpsProviderMapping: 1,
						_playerProviderMapping: 1,
						name: 1,
						providerPlayer: 1,
						device: 1,
						providerTeam: 1,
						clubId: 1,
						enabledModules: 1,
						[providerIdField]: 1
					}
				})
			]);
			const { clubId } = team;
			const providerTeamId = team[providerIdField];
			const players = await Event.app.models.Player.find({
				where: { clubId },
				fields: ['id', 'displayName', providerIdField, providerTeamIdField, providerSecondaryTeamIdField]
			});

			await Promise.map(
				events,
				async event => syncSingleEvent(event, teamSeasons, players, provider, providerTeamId, Event),
				{ concurrency: 2 }
			);

			const result = await Event.find({
				where: {
					teamSeasonId: { inq: teamSeasons.map(({ id }) => id) },
					start: { lte: to },
					end: { gte: from }
				},
				fields: {
					_sessionPlayers: false,
					_attachments: false,
					_drills: false,
					_drillsExecuted: false,
					_sessionImport: false
				},
				include: [
					{
						relation: 'match',
						scope: {
							fields: ['id']
						}
					},
					{
						relation: 'testInstance',
						scope: {
							fields: ['id']
						}
					}
				]
			});
			return result;
		} catch (e) {
			if (e.name === 'WyscoutException') console.warn(e.message);
			throw EventError(e);
		}
	};

	Event.syncEvent = async function (eventId) {
		try {
			console.log(`[Event.syncEvent] Syncing event ${eventId}...`);
			const currentEvent = await Event.findById(eventId, {
				fields: ['playerIds', '_playerMatchStats', '_opponentPlayerMatchStats']
			});
			const eventInstance = await Event.findById(eventId);
			if (!eventInstance) {
				throw NotFoundError('Event not found');
			}
			// const provider = tacticalInfoProvider.extractProvider(eventInstance);
			const provider = 'Wyscout';
			const providerEventIdField = tacticalInfoProvider.getProviderField(provider, 'id');
			const providerTeamIdField = tacticalInfoProvider.getProviderField(provider, 'teamId');
			const providerSecondaryTeamIdField = tacticalInfoProvider.getProviderField(provider, 'secondaryTeamId');
			const teamInstance = await Event.app.models.Team.findOne({
				where: { _id: eventInstance.teamId },
				fields: [
					providerEventIdField,
					'clubId',
					'name',
					'_id',
					'id',
					'providerPlayer',
					'device',
					'providerTeam',
					'_gpsProviderMapping',
					'_playerProviderMapping',
					'enabledModules'
				]
			});
			const { clubId } = teamInstance;
			const providerTeamId = teamInstance[providerEventIdField]; // now is teamInstance.wyscoutId
			// const providerPlayerTeamId = teamInstance[providerTeamIdField]; // now is 'wyscoutTeamId'
			// const providerPlayerSecondaryTeamIdField = teamInstance[providerSecondaryTeamIdField]; // now is 'wyscoutSecondaryTeamId'
			const [players, teamSeason, club] = await Promise.all([
				Event.app.models.Player.find({
					where: { clubId },
					fields: ['id', 'displayName', providerEventIdField, providerTeamIdField, providerSecondaryTeamIdField]
				}),
				Event.app.models.TeamSeason.findOne({ where: { _id: eventInstance.teamSeasonId } }),
				Event.app.models.Club.findOne({ where: { _id: clubId } })
			]);
			const result = await performEventSync(
				eventInstance,
				teamSeason,
				players,
				provider,
				Event,
				providerTeamId,
				club.nationalClub
			);

			const queueResultArray = [];
			if (isGameEvent(eventInstance) || isTrainingTeamSessionEvent(eventInstance)) {
				const playerMinutesDiff = getOnlyEditedMinutesPlayersIds(
					currentEvent._playerMatchStats,
					eventInstance._playerMatchStats
				);
				const isPlayersMinutesChanged = !!playerMinutesDiff && playerMinutesDiff.length > 0;
				if (isGameEvent(eventInstance)) {
					queueResultArray.push(
						await handleQueuesForEvents(
							Event,
							eventInstance,
							omit(teamInstance, ['enabledModules']),
							teamSeason,
							[thresholdQueueName],
							playerMinutesDiff
						)
					);
				}
				if (isPlayersMinutesChanged) {
					queueResultArray.push(
						await handleQueuesForEvents(
							Event,
							eventInstance,
							omit(teamInstance, ['enabledModules']),
							teamSeason,
							[robustnessQueueName],
							teamSeason.playerIds || []
						)
					);
				}
			}
			return { result, message: queueResultArray };
		} catch (e) {
			if (e.name === 'WyscoutException') console.warn(e.message);
			throw EventError(e);
		}
	};

	Event.updatePlayersStatsFromMatch = async function (eventId, playerStats, username) {
		try {
			console.log(`[EVENT] Updating match event ${eventId} with match player stats...`);
			const event = await Event.findById(eventId);
			event.lastUpdateDate = moment().toDate();
			event.lastUpdateAuthor = username; // TODO: change with UserId
			event._playerMatchStats = playerStats.map(stat => ({
				id: uuid(),
				enabled: true,
				playerId: stat.playerId,
				playerName: stat.playerName,
				minutesPlayed: stat.minutesPlayed,
				substituteInMinute: stat.substituteInMinute,
				substituteOutMinute: stat.substituteOutMinute,
				yellowCard: stat.yellowCard,
				doubleYellowCard: stat.doubleYellowCard,
				redCard: stat.redCard,
				score: stat.score,
				assists: stat.assists
			}));
			event.playerIds = playerStats.map(({ playerId }) => playerId);
			const updated = await Event.upsert(event);
			return updated;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Event.removeMedicalTreatments = async function (isNewInstance, eventToSave, currentInstance) {
		// When we duplicate a Medical Event, it will be saved a new Event with the same data as the original one, and also the Player Treatments will be saved
		// Then, if we change the Player, we need to delete Old Player Treatments
		if (!isNewInstance && currentInstance?.id && isMedicalEvent(eventToSave)) {
			// check if the playerIds[0] is changed, if yes, get and delete all the Player Prevention Treatments of this events
			const hasPlayers = eventToSave?.playerIds?.length > 0 && currentInstance?.playerIds?.length > 0;
			const isPlayerChanged = hasPlayers && String(currentInstance.playerIds[0]) !== String(eventToSave.playerIds[0]);
			if (isPlayerChanged) {
				await Event.app.models.MedicalTreatment.destroyAll({ eventId: currentInstance.id });
			}
		}
	};

	Event.sendEventInvitations = async function (isNewInstance, eventToSave, currentInstance) {
		let addedStaff = [];
		let addedPlayers = [];
		if (isNewInstance) {
			addedPlayers = eventToSave.playerIds;
			addedStaff = eventToSave.staffIds;
		} else {
			addedStaff = eventToSave.staffIds
				? difference(eventToSave.staffIds.map(String), currentInstance.staffIds.map(String))
				: [];
			addedPlayers = eventToSave.playerIds
				? difference(eventToSave.playerIds.map(String), currentInstance.playerIds.map(String))
				: [];
		}

		if (addedStaff.length > 0) {
			await Event.app.models.Notification.checkForEventInvitations(
				eventToSave.id,
				addedStaff,
				eventToSave.title,
				eventToSave.teamId,
				eventToSave.start
			);
		}
		if (addedPlayers.length > 0) {
			await Event.app.models.PlayerNotification.checkForEventInvitations(
				eventToSave.id,
				addedPlayers,
				eventToSave.title,
				eventToSave.teamId,
				eventToSave.start
			);
		}
	};

	Event.sendUpdateNotification = async function (eventToSave, currentInstance) {
		try {
			console.log(`[EVENT] notifying change in event ${eventToSave.id}...`);
			await Event.app.models.PlayerNotification.checkForEventUpdate(
				eventToSave.id,
				currentInstance.playerIds,
				eventToSave.teamId,
				eventToSave.start,
				eventToSave.title
			);
			await Event.app.models.Notification.checkForEventUpdate(
				eventToSave.id,
				currentInstance.staffIds,
				eventToSave.teamId,
				eventToSave.start,
				eventToSave.title
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};
};

// region Queue Utils
async function handleEWMA(event, teamData, currentSeason) {
	if (!teamData.enabledModules.includes('ewma')) {
		console.warn('\tTeam does not have ewma enabled. Skipping...');
	} else if (!event.gpsSessionLoaded) {
		console.warn('\tGPS not uploaded. Skipping...');
	} else {
		const metrics = [
			...teamData._gpsProviderMapping._gpsMetricsMapping.map(({ columnName }) => columnName),
			...teamData._gpsProviderMapping.rawMetrics
				.filter(({ type }) => !type || type === 'number')
				.map(({ name }) => name.replace(/\./g, '_'))
		];
		const payload = {
			teamId: event.teamId,
			playerIds: uniq(event._sessionPlayers.map(({ playerId }) => String(playerId))),
			seasonStart: currentSeason.offseason,
			dateFrom: event.start,
			dateTo: moment().toDate(),
			metrics
		};
		await pushToEWMALambdaFunction(payload);
	}
}

async function getCommonTeamSeasonForQueues(Event, teamId, teamSeasonId) {
	return await Promise.all([
		Event.app.models.Team.findOne({
			where: { _id: teamId },
			fields: {
				id: 1,
				clubId: 1,
				name: 1,
				providerPlayer: 1,
				device: 1,
				providerTeam: 1,
				_gpsProviderMapping: 1,
				_playerProviderMapping: 1,
				enabledModules: 1
			}
		}),
		Event.app.models.TeamSeason.findOne({
			where: { _id: teamSeasonId },
			fields: {
				id: 1,
				offseason: 1,
				inseasonEnd: 1,
				playerIds: 1
			}
		})
	]);
}

async function handleQueuesForEvents(Event, event, teamData, currentSeason, queuesToPush = [], playerIds, testId) {
	const playerIdsToUpdate = playerIds;
	const notSupportedQueues = queuesToPush.filter(
		name => name !== thresholdQueueName && name !== robustnessQueueName && name !== medicalThresholdQueueName
	);
	if (notSupportedQueues.length > 0) {
		console.warn('queue not supported');
	} else {
		if (moment(event.start).isBetween(moment(currentSeason.offseason), moment(currentSeason.inseasonEnd, 'day', []))) {
			if (!!playerIdsToUpdate && playerIdsToUpdate.length > 0) {
				const queueServiceClient = Object.create(Event.app.queueClient);
				const data = { teamData, currentSeason };
				const isPrefetchable = isGameEvent(event) || isTrainingEvent(event);
				if (isPrefetchable) {
					const prefetchDataContainer = Object.create(Event.app.prefetchDataContainer);
					await setPrefetchedDataIfNotExist(Event, prefetchDataContainer, data);
				}
				let message = {};
				for (const queueName of queuesToPush) {
					const currentQueueClient = queueServiceClient.getQueueClient(queueName);
					for (const playerId of playerIdsToUpdate) {
						const payload = getPayloadForQueue(queueName, teamData, currentSeason, playerId, testId);
						await pushEventToAzureQueue(currentQueueClient, payload);
					}
					const recalculationTypeLabel = getRecalculationTypeLabelFromQueueName(queueName);
					message = {
						title: message.title ? message.title + ', ' + recalculationTypeLabel : recalculationTypeLabel,
						playerIds
					};
				}
				return message;
			}
		}
	}
}

function getRecalculationTypeLabelFromQueueName(queueName) {
	switch (queueName) {
		case thresholdQueueName:
			return 'Thresholds';
		case robustnessQueueName:
			return 'Robustness';
		case medicalThresholdQueueName:
			return 'Medical Thresholds';
		default:
			console.error('queue not supported');
	}
}

async function handleCommonChangeMinutesPlayed(Event, currentEvent, event, calcThresholdOnlyIfPlayerChanged = false) {
	const playerMinutesDiff = getOnlyEditedMinutesPlayersIds(currentEvent._playerMatchStats, event._playerMatchStats);
	const isPlayersMinutesChanged = !!playerMinutesDiff && playerMinutesDiff.length > 0;
	const [team, currentSeason] = await getCommonTeamSeasonForQueues(Event, event.teamId, event.teamSeasonId);
	const queueResult = [];
	if (calcThresholdOnlyIfPlayerChanged) {
		const playerDiff = getOnlyEditedPlayerIds(currentEvent.playerIds, event.playerIds);
		const isPlayersChanged = !!playerDiff && playerDiff.length > 0;
		if (isPlayersChanged) {
			const result = await handleQueuesForEvents(
				Event,
				event,
				omit(team, ['enabledModules']),
				currentSeason,
				[thresholdQueueName],
				playerDiff
			);
			queueResult.push(result);
		}
	} else {
		if (isPlayersMinutesChanged) {
			if (isGameEvent(event)) {
				const result = await handleQueuesForEvents(
					Event,
					event,
					omit(team, ['enabledModules']),
					currentSeason,
					[thresholdQueueName],
					playerMinutesDiff
				);
				queueResult.push(result);
			}
		}
	}
	if (isGameEvent(event) || isTrainingTeamSessionEvent(event)) {
		const result = await handleQueuesForEvents(
			Event,
			event,
			omit(team, ['enabledModules']),
			currentSeason,
			[robustnessQueueName],
			currentSeason.playerIds
		);
		queueResult.push(result);
	}
	return queueResult;
}

function getOnlyEditedMinutesPlayersIds(currentPlayerMatchStats = [], eventPlayerMatchStats = []) {
	const diff1 = differenceBy(currentPlayerMatchStats, eventPlayerMatchStats, 'minutesPlayed').map(
		({ playerId }) => playerId
	);
	const diff2 = differenceBy(eventPlayerMatchStats, currentPlayerMatchStats, 'minutesPlayed').map(
		({ playerId }) => playerId
	);
	return uniq([...diff1, ...diff2]);
}

function getOnlyEditedPlayerIds(currentEventPlayerIds = [], eventPlayerIds = []) {
	currentEventPlayerIds = currentEventPlayerIds.map(id => String(id));
	eventPlayerIds = eventPlayerIds.map(id => String(id));
	const diff1 = difference(currentEventPlayerIds, eventPlayerIds);
	const diff2 = difference(eventPlayerIds, currentEventPlayerIds);
	return uniq([...diff1, ...diff2]);
}
// endregion

// region sync
async function syncSingleEvent(eventInstance, teamSeasons, players, provider, providerTeamId, Event) {
	try {
		const currentEvent = JSON.parse(JSON.stringify(eventInstance));
		if (!eventInstance.teamSeasonId) {
			throw NotFoundError('Event not included in any season');
		}
		const teamSeason = teamSeasons.find(({ id }) => String(id) === String(eventInstance.teamSeasonId));
		const result = await performEventSync(eventInstance, teamSeason, players, provider, Event, providerTeamId);
		if ((result && isGameEvent(result)) || isTrainingTeamSessionEvent(result)) {
			await handleCommonChangeMinutesPlayed(Event, currentEvent, result);
		}
	} catch (e) {
		console.error(e);
	}
}

async function performEventSync(eventInstance, season, players, provider, Event, providerTeamId, isNational) {
	if (!season) {
		console.warn(`[Event.performEventSync] event outside season`);
	} else {
		const playerIds = season.playerIds.filter(x => x).map(String);
		const lineup = players.filter(({ id }) => playerIds.includes(String(id))); // filter players with seasonal lineup
		if (isEmpty(lineup)) {
			throw EventError('Lineup for this season empty');
		}
		return eventInstance.format === 'clubGame'
			? await tacticalInfoProvider.syncClubEventWithProvider(provider, Event, eventInstance, lineup)
			: await tacticalInfoProvider.syncEventWithProvider(
					provider,
					Event,
					eventInstance,
					providerTeamId,
					lineup,
					isNational
			  );
	}
}

// end region

function getPipelineEventsAttendance(teamId, teamSeasonId, playerIds, dateFrom, dateTo) {
	const pipelineStages = [];
	const matchStage = {
		$match: {
			teamId: ObjectID(teamId),
			teamSeasonId: ObjectID(teamSeasonId),
			format: { $in: ['game', 'clubGame', 'friendly', 'training', 'international', 'gym', 'off'] },
			start: { $lte: dateTo },
			end: { $gte: dateFrom }
		}
	};
	playerIds = playerIds.map(ObjectID);

	const lookupStage = { $lookup: { from: 'Match', localField: '_id', foreignField: 'eventId', as: 'match' } };
	const unwindStage2 = { $unwind: { path: '$match', preserveNullAndEmptyArrays: true } };
	const projectStagePre = {
		$project: {
			idEvent: '$_id',
			format: '$format',
			theme: '$theme',
			subformat: '$subformat',
			matchId: '$match._id',
			title: '$title',
			playerIds: '$playerIds',
			playerStats: '$match._playerStats',
			start: '$start',
			end: '$end',
			_sessionImport: '$_sessionImport',
			_sessionPlayers: {
				$filter: {
					input: '$_sessionPlayers',
					as: 'item',
					cond: { $eq: ['$$item.mainSession', true] }
				}
			},
			_playerMatchStats: '$_playerMatchStats',
			individual: '$individual',
			friendly: '$friendly',
			duration: '$duration'
		}
	};
	//	const durFieldComplete = '$$n.' + durationField;
	const projectStage = {
		$project: {
			idEvent: '$_id',
			matchId: '$matchId',
			format: '$format',
			theme: '$theme',
			subformat: '$subformat',
			title: '$title',
			playerIds: '$playerIds',
			playerStats: '$playerStats',
			start: '$start',
			end: '$end',
			_sessionImport: '$_sessionImport',
			_sessionPlayers: {
				$map: {
					input: '$_sessionPlayers',
					as: 'm',
					in: {
						duration: '$$m.duration',
						playerId: '$$m.playerId',
						playerName: '$$m.playerName',
						splitName: '$$m.splitName',
						dirty: '$$m.dirty',
						start: '$start'
					}
				}
			},
			_playerMatchStats: {
				$map: {
					input: '$_playerMatchStats',
					as: 'm',
					in: {
						minutesPlayed: '$$m.minutesPlayed',
						playerId: '$$m.playerId',
						substituteInMinute: '$$m.substituteInMinute',
						enabled: '$$m.enabled'
					}
				}
			},
			individual: '$individual',
			friendly: '$friendly',
			duration: '$duration'
		}
	};

	pipelineStages.push(matchStage);
	pipelineStages.push(lookupStage);
	pipelineStages.push(unwindStage2);
	pipelineStages.push(projectStagePre);
	pipelineStages.push(projectStage);
	return pipelineStages;
}

function getDrillsExecuted(event) {
	const drillsMap = {};
	for (const session of event._sessionPlayers || []) {
		if (!session.mainSession) {
			const uniqueId = `${session.drillId}-${session.splitName}`;
			const momSplit1 = moment(session.splitEndTime);
			const momSplit2 = moment(session.splitStartTime);
			if (!(uniqueId in drillsMap)) {
				drillsMap[uniqueId] = {
					name: session.splitName,
					data: {},
					drillId: session.drillId,
					startTime: momSplit2.toDate(),
					participantsIds: event.playerIds
				};
			}
			const drillsMapSingleDrill = drillsMap[uniqueId].data;
			const durationSplit = momSplit1.diff(momSplit2, 'minutes');
			drillsMapSingleDrill[durationSplit] = !(durationSplit in drillsMapSingleDrill)
				? 1
				: drillsMapSingleDrill[durationSplit] + 1;
		}
	}
	const uniqueDrills = [];
	for (const keyDrill in drillsMap) {
		const name = drillsMap[keyDrill].name;
		const data = drillsMap[keyDrill].data;
		const drillId = drillsMap[keyDrill].drillId;
		const startTime = drillsMap[keyDrill].startTime;
		const participantsIds = drillsMap[keyDrill].participantsIds;
		let highestOccurrence = null;
		let highestDuration = 0;
		for (const keyDuration in data) {
			if (!highestOccurrence || Number(data[keyDuration]) > Number(highestOccurrence)) {
				highestOccurrence = data[keyDuration];
				highestDuration = Number(keyDuration);
			}
		}
		uniqueDrills.push({
			obj: {
				id: uuid(),
				name,
				theme: '',
				sets: null,
				reps: null,
				count: null,
				rest: null,
				duration: highestDuration,
				drillId,
				participantsIds
			},
			startTime
		});
	}
	return sortBy(uniqueDrills, ['startTime']).map(({ obj }) => obj);
}

function getExistingRPEMap(event) {
	const rpeMap = {};
	event._sessionPlayers.forEach(({ rpe, playerId }) => {
		if (rpe !== null && rpe !== 0) rpeMap[String(playerId)] = rpe;
	});
	return rpeMap;
}

function updateSessionPlayers(originalSessions, sessionPlayerData, event, rpeMap) {
	sessionPlayerData.forEach(newSession => {
		const foundIndex = originalSessions.findIndex(
			({ playerId, splitName }) =>
				String(playerId) === String(newSession.playerId) &&
				splitName?.toLowerCase() === newSession.splitName?.toLowerCase()
		);
		if (foundIndex > -1) originalSessions[foundIndex] = wrapPlayerSession(newSession, event, rpeMap);
		else originalSessions.push(wrapPlayerSession(newSession, event, rpeMap));
	});
	return sortBy(originalSessions, ['splitStartTime']);
}

function wrapPlayerSession(session, event, rpeMap) {
	session.fromCsv = true;
	if (!isEmpty(event._sessionPlayers)) {
		const existingSession = event._sessionPlayers.find(
			({ playerId, drillId, mainSession }) =>
				String(playerId) === String(session.playerId) &&
				((!!drillId && !!session.drillId && String(drillId) === String(session.drillId)) ||
					(!!mainSession && !!session.mainSession))
		);
		if (existingSession) {
			const playerMatchStat = (event._playerMatchStats || []).find(
				({ enabled, playerId, minutesPlayed }) =>
					enabled && String(playerId) === String(session.playerId) && minutesPlayed
			);
			const duration = playerMatchStat?.minutesPlayed || session.duration;
			session.rpe = rpeMap[String(session.playerId)] || session.rpe || null;
			session.rpeTl = session.rpe * duration;
		}
	}
	return session;
}

function getNorm(value, thresholdValue) {
	return value / (thresholdValue || 1);
}

function getSemaphore(value, thresholdValue) {
	const norm = getNorm(value, thresholdValue);
	return getColorText(norm);
}

function getColorText(value) {
	let colorText = '#acacac';
	if (value < 0.8) return '#acacac';
	else if (value >= 0.8 && value < 0.9) return '#CCCC00';
	else if (value >= 0.9 && value < 1.1) colorText = '#008e4a';
	else if (value >= 1.1 && value < 1.2) colorText = '#e4970c';
	else colorText = '#9e0f0f';
	return colorText;
}

function isGameEvent(event) {
	return event.format === 'game';
}
function isTrainingEvent(event) {
	return event.format === 'training';
}
function isAssessmentEvent(event) {
	return event.format === 'assessment';
}
function isTrainingTeamSessionEvent(event) {
	return event.format === 'training' && !event.individual;
}
function isMedicalEvent(event) {
	return event.format === 'medical';
}

function getMostOccurredDuration({ sessionPlayerData }) {
	const durations = (sessionPlayerData || []).filter(({ mainSession }) => mainSession).map(({ duration }) => duration);
	const hashmap = durations.reduce((acc, val) => {
		acc[val] = (acc[val] || 0) + 1;
		return acc;
	}, {});
	const max = Object.keys(hashmap).reduce((a, b) => (hashmap[a] > hashmap[b] ? a : b));
	return Number(max);
}

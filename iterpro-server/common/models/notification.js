const moment = require('moment');
const { isEmpty, sortBy } = require('lodash');
const notificationConstants = require('../constants/notificationConstants.js');
const { ObjectID } = require('mongodb');
const { NotFoundError } = require('../modules/error.js');
const { getDateFormatConfig } = require('../modules/customerDateFormat.util');
const { getPlayerValue } = require('../../server/shared/financial-utils.js');
const { checkPermissions } = require('../../server/shared/permissions-utils.js');

module.exports = function (Notification) {
	Notification.checkNotificationForPlayerOperation = async function (idPlayer, type) {
		console.log('[NOTIFICATION] Checking player operation...');
		const player = await Notification.app.models.Player.findById(ObjectID(idPlayer), { include: ['team', 'club'] });

		if (player) {
			const customerTeamSettings = await Notification.app.models.CustomerTeamSettings.find({
				where: {
					teamId: player.teamId
				}
			});

			for (const teamSettings of customerTeamSettings) {
				const notificationType = notificationConstants.TYPENOTIFICATIONPLAYEROPERATION;
				let notificationKey = null;
				switch (type) {
					case 'deleted':
						notificationKey = notificationConstants.PLAYEROPERATIONDELETED;
						break;
					case 'archived':
						notificationKey = notificationConstants.PLAYEROPERATIONARCHIVED;
						break;
					case 'created':
						notificationKey = notificationConstants.PLAYEROPERATIONCREATED;
						break;
					default:
						notificationKey = notificationConstants.PLAYEROPERATIONCREATED;
				}
				const message = `$${player.displayName}$|${notificationKey}`;
				if (teamSettings.notificationPlayerOperations) {
					const notificationToCreateAbove = {
						customerId: teamSettings.customerId,
						teamId: teamSettings.teamId,
						type: notificationType,
						date: moment().toDate(),
						playerId: idPlayer,
						img: player.downloadUrl,
						message,
						read: false
					};
					await Notification.create(notificationToCreateAbove);
				}
			}
		}
		return true;
	};

	Notification.checkNotificationForPlayerTransfer = async function (clubTransferId, isStatusChange, prevStatus) {
		console.log('[NOTIFICATION] Checking transfer operation...');

		const [clubTransfer, playerTransfer] = await Promise.all([
			Notification.app.models.ClubTransfer.findOne({ where: { id: ObjectID(clubTransferId) } }),
			Notification.app.models.PlayerTransfer.findOne({ where: { clubTransferId: ObjectID(clubTransferId) } })
		]);
		const customersForClub = await Notification.app.models.Customer.find({
			where: { clubId: ObjectID(clubTransfer.clubId), notificationTransfers: true }
		});

		if (playerTransfer) {
			let message = '';
			if (!isStatusChange) {
				const messageSuffix = clubTransfer.isPurchase
					? notificationConstants.TRANSFERPURCHASE
					: notificationConstants.TRANSFERSELL;
				message = `$${playerTransfer.displayName}$|${messageSuffix}`;
			} else {
				message = `$${playerTransfer.displayName}$|$${prevStatus}$|$${clubTransfer.currentStatus}$|${notificationConstants.TRANSFERCHANGE}`;
			}

			for (const customer of customersForClub) {
				const notificationType = notificationConstants.TYPENOTIFICATIONTRANSFER;
				let notificationToCreate = {
					clubId: ObjectID(clubTransfer.clubId),
					teamId: 'GLOBAL',
					customerId: customer.id,
					type: notificationType,
					transferId: clubTransfer.id,
					date: moment().toDate(),
					message,
					img: playerTransfer.downloadUrl,
					read: false
				};

				await Notification.create(notificationToCreate);

				if (!isStatusChange && !clubTransfer.isPurchase && playerTransfer?.inward?.options?.sellOnFee) {
					let messageFee = `$${playerTransfer.displayName}$|notification.message.transferFee`;
					if (playerTransfer.inward.options.sellOnFee.within)
						messageFee = `$${playerTransfer.displayName}$|$${moment(
							playerTransfer.inward.options.sellOnFee.within
						).format(getDateFormatConfig(customer?.currentDateFormat))}$|notification.message.transferFeeDate`;
					notificationToCreate = {
						clubId: ObjectID(clubTransfer.clubId),
						teamId: 'GLOBAL',
						customerId: customer.id,
						type: notificationType,
						transferId: clubTransfer._id,
						date: moment().toDate(),
						message: messageFee,
						img: playerTransfer.downloadUrl,
						read: false
					};
					await Notification.create(notificationToCreate);
				}
			}
		}
		return true;
	};

	// FIXME: DEPRECATED
	// Notification.checkForGPSThresholdsFluctuation = async function (currentEvent, teamId) {
	// 	console.log('[NOTIFICATION] Checking Thresholds notifications...');
	// 	const team = await Notification.app.models.Team.getDataSource()
	// 		.connector.collection(Notification.app.models.Team.modelName)
	// 		.findOne({ _id: ObjectID(teamId) });

	// 	const currentDate = moment().startOf('day').toDate();
	// 	const eventStartDate = moment(currentEvent.start).startOf('day').toDate();

	// 	if (moment(eventStartDate).isSame(moment(currentDate))) {
	// 		const metricsAbove = [];
	// 		const metricsBelow = [];
	// 		const mainSessions = currentEvent._sessionPlayers.filter(({ mainSession }) => mainSession);
	// 		for (const sessionPlayer of mainSessions) {
	// 			const player = await Notification.app.models.Player.findOne({ where: { id: sessionPlayer.playerId } });
	// 			if (player) {
	// 				const thresholds = Notification.app.models.Player.getThresholdArrayForExactGdType(
	// 					player,
	// 					sessionPlayer.gdType
	// 				);
	// 				if (!isEmpty(thresholds)) {
	// 					for (const { name, value } of thresholds.thresholds) {
	// 						if (name in sessionPlayer) {
	// 							const valueSession = sessionPlayer[name];
	// 							if (valueSession / value > 1.2 && metricsAbove.indexOf(name) === -1) {
	// 								metricsAbove.push(name);
	// 							} else if (valueSession / value < 0.8 && metricsBelow.indexOf(name) === -1) {
	// 								metricsBelow.push(name);
	// 							}
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}

	// 		const customerTeamSettings = await Notification.app.models.CustomerTeamSettings.find({
	// 			where: {
	// 				teamId: ObjectID(teamId)
	// 			},
	// 			include: ['customer']
	// 		});

	// 		const notificationsToCreate = [];
	// 		for (const teamSettings of customerTeamSettings) {
	// 			let foundAbove = false;
	// 			let foundBelow = false;
	// 			const aboves = [];
	// 			const belows = [];
	// 			// first 5 metrics for radar, are they needed ?
	// 			const metricsToCheck = teamSettings.metricsPerformance.slice(0, 5);
	// 			for (const m1 of metricsAbove) {
	// 				if (metricsToCheck.indexOf(m1) != -1) {
	// 					foundAbove = true;
	// 					aboves.push(m1);
	// 				}
	// 			}
	// 			for (const m2 of metricsBelow) {
	// 				if (metricsToCheck.indexOf(m2) != -1) {
	// 					foundBelow = true;
	// 					belows.push(m2);
	// 				}
	// 			}

	// 			if (
	// 				foundAbove &&
	// 				teamSettings.notificationSession &&
	// 				checkPermissions(team, teamSettings.customer(), teamSettings, 'notificationSession')
	// 			) {
	// 				const notificationToCreateAbove = {
	// 					type: notificationConstants.TYPENOTIFICATIONSESSION,
	// 					date: moment().toDate(),
	// 					eventId: currentEvent.id,
	// 					customerId: teamSettings.customerId,
	// 					teamId: teamSettings.teamId,
	// 					message: notificationConstants.SESSIONABOVE,
	// 					metrics: aboves,
	// 					eventDate: currentEvent.start,
	// 					read: false
	// 				};
	// 				notificationsToCreate.push(notificationToCreateAbove);
	// 			}

	// 			if (
	// 				foundBelow &&
	// 				teamSettings.notificationSession &&
	// 				checkPermissions(team, teamSettings.customer(), teamSettings, 'notificationSession')
	// 			) {
	// 				const notificationToCreateBelow = {
	// 					type: notificationConstants.TYPENOTIFICATIONSESSION,
	// 					date: moment().toDate(),
	// 					eventId: currentEvent.id,
	// 					customerId: teamSettings.customerId,
	// 					teamId: teamSettings.teamId,
	// 					message: notificationConstants.SESSIONBELOW,
	// 					metrics: belows,
	// 					eventDate: currentEvent.start,
	// 					read: false
	// 				};
	// 				notificationsToCreate.push(notificationToCreateBelow);
	// 			}
	// 		}

	// 		// save notifications
	// 		return !isEmpty(notificationsToCreate) ? await Notification.create(notificationsToCreate) : null;
	// 	}
	// };

	Notification.checkForWorkloadScoreFluctuation = async function (currentEvent, teamId) {
		try {
			console.log('[NOTIFICATION] Checking Workload Score notifications...');
			const { _sessionPlayers, workload: targetWorkload } = currentEvent;
			const mainSessionPlayers = _sessionPlayers.filter(({ mainSession }) => mainSession);
			const belowPlayers = mainSessionPlayers.filter(({ workload }) => workload <= targetWorkload - 1);
			const inTargetPlayers = mainSessionPlayers.filter(
				({ workload }) => workload > targetWorkload - 1 && workload <= targetWorkload
			);
			const abovePlayers = mainSessionPlayers.filter(({ workload }) => workload > targetWorkload);

			const customers = await Notification.app.models.CustomerTeamSettings.find({
				where: { teamId },
				include: ['customer']
			});

			const customerWithEnabledNotification = customers.filter(
				({ notificationWorkloadScore }) => notificationWorkloadScore?.length > 0
			);

			const notificationsToCreate = [];
			for (const teamSettings of customerWithEnabledNotification) {
				if ((teamSettings.notificationWorkloadScore || []).includes('below')) {
					notificationsToCreate.push(
						...belowPlayers.map(({ playerId, playerName }) => ({
							type: notificationConstants.TYPENOTIFICATIONWORKLOAD,
							date: moment().toDate(),
							eventId: currentEvent.id,
							customerId: teamSettings.customerId,
							teamId: teamSettings.teamId,
							message: `$${playerName}$|$${moment(currentEvent.start).format(
								getDateFormatConfig(teamSettings.customer?.currentDateFormat)
							)}$|${notificationConstants.WORKLOADBELOW}`,
							playerId,
							read: false
						}))
					);
				}
				if ((teamSettings.notificationWorkloadScore || []).includes('target')) {
					notificationsToCreate.push(
						...inTargetPlayers.map(({ playerId, playerName }) => ({
							type: notificationConstants.TYPENOTIFICATIONWORKLOAD,
							date: moment().toDate(),
							eventId: currentEvent.id,
							customerId: teamSettings.customerId,
							teamId: teamSettings.teamId,
							message: `$${playerName}$|$${moment(currentEvent.start).format(
								getDateFormatConfig(teamSettings.customer?.currentDateFormat)
							)}$|${notificationConstants.WORKLOADTARGET}`,
							playerId,
							read: false
						}))
					);
				}
				if ((teamSettings.notificationWorkloadScore || []).includes('above')) {
					notificationsToCreate.push(
						...abovePlayers.map(({ playerId, playerName }) => ({
							type: notificationConstants.TYPENOTIFICATIONWORKLOAD,
							date: moment().toDate(),
							eventId: currentEvent.id,
							customerId: teamSettings.customerId,
							teamId: teamSettings.teamId,
							message: `$${playerName}$|$${moment(currentEvent.start).format(
								getDateFormatConfig(teamSettings.customer?.currentDateFormat)
							)}$|${notificationConstants.WORKLOADABOVE}`,
							playerId,
							read: false
						}))
					);
				}
			}

			// save notifications
			return !isEmpty(notificationsToCreate) ? await Notification.create(notificationsToCreate) : null;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Notification.checkForImportEventNotifications = async function (currentEvent, teamId) {
		console.log('[NOTIFICATION] Checking Event import notifications...');
		const team = await Notification.app.models.Team.getDataSource()
			.connector.collection(Notification.app.models.Team.modelName)
			.findOne({ _id: ObjectID(teamId) });

		const customerTeamSettings = await Notification.app.models.CustomerTeamSettings.find({
			where: {
				teamId: ObjectID(teamId)
			},
			include: ['customer']
		});

		const notificationsToCreate = [];
		for (const teamSettings of customerTeamSettings) {
			if (
				teamSettings.notificationImport &&
				checkPermissions(team, teamSettings.customer(), teamSettings, 'import-data')
			) {
				const currEv = JSON.parse(JSON.stringify(currentEvent));
				const formattedDate = moment(currEv.start).format(
					`${getDateFormatConfig(teamSettings.customer()?.currentDateFormat)} hh:mm`
				);
				const notificationToWrite =
					currentEvent.format === 'training'
						? notificationConstants.SESSIONIMPORTTRAINING
						: notificationConstants.SESSIONIMPORTGAME;
				const message = '$' + formattedDate + '$' + '|' + notificationToWrite;
				const notificationToCreateImported = {
					type: notificationConstants.TYPENOTIFICATIONIMPORT,
					date: moment().toDate(),
					eventId: currentEvent.id,
					customerId: teamSettings.customerId,
					teamId: teamSettings.teamId,
					message: message,
					eventDate: currentEvent.start,
					read: false
				};
				notificationsToCreate.push(notificationToCreateImported);
			}
		}

		// save notifications
		return !isEmpty(notificationsToCreate) ? await Notification.create(notificationsToCreate) : null;
	};

	Notification.checkForGoScoreFluctuation = async function (goScore, player) {
		console.log('[NOTIFICATION] Checking for GO Score fluctuation notifications...');
		const teamCollection = Notification.app.models.Team.getDataSource().connector.collection(
			Notification.app.models.Team.modelName
		);
		const team = await teamCollection.findOne({ _id: ObjectID(player.teamId) });
		// notifications 1) Goscore < 60
		// 2) Goscore controllare < 30%
		const notificationsToCreate = [];

		const currentDate = moment().startOf('day').toDate();
		const currentDateMinus1Day = moment().startOf('day').subtract(1, 'd').toDate();
		const currentDateMinus2Day = moment().startOf('day').subtract(2, 'd').toDate();

		const dateGoScore = moment(goScore.date).startOf('day').toDate();
		const dateGoScoreMinus1Day = moment(goScore.date).subtract(1, 'd').toDate();
		const dateGoScoreMinus2Day = moment(goScore.date).subtract(2, 'd').toDate();
		const dateGoScorePlus1Day = moment(goScore.date).add(1, 'd').toDate();
		const dateGoScorePlus2Day = moment(goScore.date).add(2, 'd').toDate();
		let goScorePlus1Day, message, notificationToCreateAbove;
		if (moment(dateGoScore).isSame(moment(currentDate))) {
			if (goScore.score < 60) {
				// notifica 1
				message = '$' + player.displayName + '$' + '|' + notificationConstants.READINESSLOW;
				notificationToCreateAbove = {
					type: notificationConstants.TYPENOTIFICATIONREADINESS,
					date: moment().toDate(),
					playerId: goScore.playerId,
					img: player.downloadUrl,
					teamId: player.teamId,
					message: message,
					read: false
				};
				notificationsToCreate.push(notificationToCreateAbove);
			} else {
				const goScoreMinus1Day = await Notification.app.models.GOScore.findOne({
					where: {
						playerId: goScore.playerId,
						date: dateGoScoreMinus1Day
					}
				});
				const goScoreMinus2Day = await Notification.app.models.GOScore.findOne({
					where: {
						playerId: goScore.playerId,
						date: dateGoScoreMinus2Day
					}
				});

				if (
					(goScoreMinus1Day != null && goScoreMinus1Day.score / goScore.score > 1.3) ||
					(goScoreMinus1Day == null && goScoreMinus2Day != null && goScoreMinus2Day.score / goScore.score > 1.3)
				) {
					message = '$' + player.displayName + '$' + '|' + notificationConstants.READINESSDECREASING;
					notificationToCreateAbove = {
						type: notificationConstants.TYPENOTIFICATIONREADINESS,
						date: moment().toDate(),
						playerId: goScore.playerId,
						img: player.downloadUrl,
						teamId: player.teamId,
						message: message,
						read: false
					};
					notificationsToCreate.push(notificationToCreateAbove);
				}
			}
		} else if (moment(dateGoScore).isSame(moment(currentDateMinus1Day))) {
			goScorePlus1Day = await Notification.app.models.GOScore.findOne({
				where: {
					playerId: goScore.playerId,
					date: dateGoScorePlus1Day
				}
			});

			if (goScorePlus1Day != null && goScore.score / goScorePlus1Day.score > 1.3) {
				message = '$' + player.displayName + '$' + '|' + notificationConstants.READINESSDECREASING;
				notificationToCreateAbove = {
					type: notificationConstants.TYPENOTIFICATIONREADINESS,
					date: moment().toDate(),
					playerId: goScore.playerId,
					img: player.downloadUrl,
					teamId: player.teamId,
					message: message,
					read: false
				};
				notificationsToCreate.push(notificationToCreateAbove);
			}
		} else if (moment(dateGoScore).isSame(moment(currentDateMinus2Day))) {
			goScorePlus1Day = await Notification.app.models.GOScore.findOne({
				where: {
					playerId: goScore.playerId,
					date: dateGoScorePlus1Day
				}
			});
			const goScorePlus2Day = await Notification.app.models.GOScore.findOne({
				where: {
					playerId: goScore.playerId,
					date: dateGoScorePlus2Day
				}
			});

			if (goScorePlus1Day == null && goScorePlus2Day != null && goScore.score / goScorePlus2Day.score > 1.3) {
				message = '$' + player.displayName + '$' + '|' + notificationConstants.READINESSDECREASING;
				notificationToCreateAbove = {
					type: notificationConstants.TYPENOTIFICATIONREADINESS,
					date: moment().toDate(),
					playerId: goScore.playerId,
					img: player.downloadUrl,
					teamId: player.teamId,
					message: message,
					read: false
				};
				notificationsToCreate.push(notificationToCreateAbove);
			}
		}

		if (notificationsToCreate.length > 0) {
			const customerTeamSettings = await Notification.app.models.CustomerTeamSettings.find({
				where: {
					teamId: ObjectID(player.teamId)
				},
				include: ['customer']
			});

			for (const teamSettings of customerTeamSettings) {
				if (
					teamSettings.notificationReadiness &&
					checkPermissions(team, teamSettings.customer(), teamSettings, 'readiness')
				) {
					for (const not of notificationsToCreate) {
						not._id = null;
						not.customerId = teamSettings.customerId;
						const startDay = moment(not.date).startOf('day').toDate();
						const endDay = moment(not.date).endOf('day').toDate();
						let publishedNotification = await Notification.find({
							where: {
								customerId: ObjectID(teamSettings.customerId),
								type: not.type,
								date: { between: [startDay, endDay] },
								message: not.message
							}
						});
						publishedNotification =
							publishedNotification.length > 1
								? publishedNotification.filter(({ playerId }) => String(playerId) === String(not.playerId))[0]
								: publishedNotification[0] || null;
						if (publishedNotification) {
							publishedNotification.date = moment().toDate();
							await publishedNotification.save();
						} else {
							await Notification.create(not);
						}
					}
				}
			}
		}
	};

	Notification.checkForInjuryCreation = async function (injuryId, teamId) {
		console.log(`[NOTIFICATIONS] Checking for creation for injury ${injuryId}...`);
		const customerTeamSettings = await Notification.app.models.CustomerTeamSettings.find({
			where: {
				teamId: ObjectID(teamId),
				notificationInjury: true
			}
		});

		const injury = await Notification.app.models.Injury.findById(injuryId);
		if (!injury) throw NotFoundError('Injury not found!');

		const player = await Notification.app.models.Player.findById(injury.playerId);
		if (!player) throw NotFoundError('Injury player not found!');

		const notifications = customerTeamSettings.map(teamSettings => ({
			customerId: ObjectID(teamSettings.customerId),
			teamId: ObjectID(teamId),
			playerId: ObjectID(injury.playerId),
			date: moment().toDate(),
			type: notificationConstants.TYPENOTIFICATIONINJURY,
			img: player.downloadUrl,
			message: `$${player.displayName}$|$${injury.issue}$|${notificationConstants.INJURYCREATION}`,
			read: false
		}));

		await Notification.create(notifications);

		return true;
	};

	Notification.checkForInjuryStatusChanges = async function (injuryId, teamId) {
		console.log(`[NOTIFICATIONS] Checking for status changes for injury ${injuryId}...`);

		const customerTeamSettings = await Notification.app.models.CustomerTeamSettings.find({
			where: {
				teamId: ObjectID(teamId),
				notificationRehab: true
			}
		});

		const injury = await Notification.app.models.Injury.findById(injuryId);
		if (!injury) throw NotFoundError('Injury not found!');

		const player = await Notification.app.models.Player.findById(injury.playerId);
		if (!player) throw NotFoundError('Injury player not found!');

		let message;
		let type = notificationConstants.TYPENOTIFICATIONINJURY;
		if (injury.currentStatus === 'medical.infirmary.details.statusList.healed') {
			message = `$${player.displayName}$|$${injury.location}$|${notificationConstants.INJURYHEALED}`;
		} else {
			const payload = getMessageInjuryFromStatuses(injury);
			if (payload) {
				message = `$${player.displayName}$|$${payload.previous}$|$${payload.current}$|${payload.message}`;
				type = notificationConstants.TYPENOTIFICATIONINJURYREHAB;
			}
		}

		if (message) {
			const notifications = customerTeamSettings.map(teamSettings => ({
				customerId: ObjectID(teamSettings.customerId),
				teamId: ObjectID(teamId),
				playerId: ObjectID(injury.playerId),
				date: moment().toDate(),
				type,
				img: player.downloadUrl,
				message,
				read: false
			}));

			await Notification.create(notifications);
		}

		return true;
	};

	Notification.checkForInjuryAvailability = async function (injuryId, teamId) {
		console.log(`[NOTIFICATIONS] Checking for availability changes for injury ${injuryId}...`);

		const customerTeamSettings = await Notification.app.models.CustomerTeamSettings.find({
			where: {
				teamId: ObjectID(teamId),
				notificationInjury: true
			}
		});

		const injury = await Notification.app.models.Injury.findById(injuryId);
		if (!injury) throw NotFoundError('Injury not found!');

		const assessments = sortBy(injury._injuryAssessments, 'date').reverse();
		const [lastAssessment, previousAssessment] = assessments;

		const player = await Notification.app.models.Player.findById(injury.playerId);
		if (!player) throw NotFoundError('Injury player not found!');

		const type = notificationConstants.TYPENOTIFICATIONINJURY;

		const sendMessage =
			lastAssessment?.available === 'yes' || lastAssessment?.expectation || lastAssessment?.further === true;
		if (sendMessage) {
			const notifications = customerTeamSettings.map(teamSettings => ({
				customerId: ObjectID(teamSettings.customerId),
				teamId: ObjectID(teamId),
				playerId: ObjectID(injury.playerId),
				date: moment().toDate(),
				type,
				img: player.downloadUrl,
				read: false,
				message: getMessageForAssessment(
					player,
					lastAssessment,
					previousAssessment,
					teamSettings.customer?.currentDateFormat
				)
			}));

			await Notification.create(notifications);
		}

		return true;
	};

	Notification.checkNotificationForPlayerValue = async function (playerId) {
		console.log(`[NOTIFICATIONS] Checking for value changes for player ${playerId}...`);

		const player = await Notification.app.models.Player.findById(ObjectID(playerId));

		const customerTeamSettings = await Notification.app.models.CustomerTeamSettings.find({
			where: {
				teamId: ObjectID(player.teamId)
			}
		});

		if (player) {
			const notificationsToCreate = await checkPlayerValueChanges(player, customerTeamSettings, Notification);
			if (notificationsToCreate.length > 0) await Notification.create(notificationsToCreate);
		}
		return true;
	};

	Notification.checkNotificationForPlayerContract = async function (playerId, customerIds) {
		const player = await Notification.app.models.Player.findById(ObjectID(playerId));

		if (player) {
			for (const customerId of (customerIds || []).map(ObjectID)) {
				const type = notificationConstants.TYPENOTIFICATIONCONTRACT;
				const message = `$${player.displayName}$|${notificationConstants.NOTIFICATIONCONTRACTNOTIFY}`;

				const notificationToCreateAbove = {
					customerId,
					type,
					date: moment().toDate(),
					playerId,
					img: player.downloadUrl,
					teamId: player.teamId,
					message,
					read: false
				};
				await Notification.create(notificationToCreateAbove);
			}
		}
		return true;
	};

	Notification.checkNotificationForPlayerScouting = async function (playerId, messages) {
		try {
			console.log(`[NOTIFICATIONS] Creating scouting notifications for player ${playerId}...`);
			const type = notificationConstants.TYPENOTIFICATIONSCOUTING;
			const customerCollection = Notification.app.models.Customer.getDataSource().connector.collection(
				Notification.app.models.Customer.modelName
			);
			const playerScoutingCollection = Notification.app.models.PlayerScouting.getDataSource().connector.collection(
				Notification.app.models.PlayerScouting.modelName
			);
			const playerScouting = await playerScoutingCollection.findOne({ _id: ObjectID(playerId) });
			const customersForClub = await customerCollection.find({ clubId: ObjectID(playerScouting.clubId) }).toArray();

			const notificationsToCreate = [];
			if (playerScouting && messages) {
				messages.forEach(message => {
					for (const {
						notificationScouting,
						notificationScoutingPlayers,
						notificationScoutingMessages,
						notificationScoutingMessagesPlayers,
						_id: customerId
					} of customersForClub) {
						let notTarget = message.includes('notification.message.scoutingMessage')
							? notificationScoutingMessagesPlayers
							: notificationScoutingPlayers;
						notTarget = notTarget ? notTarget : 'ALL';
						if (
							(message.includes('notification.message.scoutingMessage') && notificationScoutingMessages) ||
							(!message.includes('notification.message.scoutingMessage') && notificationScouting)
						) {
							if (notTarget == 'ALL' || (notTarget == 'RECOMMENDED' && playerScouting.associatedPosition)) {
								const subtype = message.includes('notification.message.scoutingMessage') ? 'scoutingMessage' : null;
								const notificationToCreateAbove = {
									clubId: ObjectID(playerScouting.clubId),
									teamId: 'GLOBAL',
									date: moment().toDate(),
									type,
									subtype,
									customerId,
									playerId: playerScouting._id,
									img: playerScouting.downloadUrl,
									message,
									read: false
								};
								notificationsToCreate.push(notificationToCreateAbove);
							}
						}
					}
				});
			}
			if (!isEmpty(notificationsToCreate)) {
				await Notification.create(notificationsToCreate);
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Notification.checkForEventInvitations = async function (eventId, staffIds, eventTitle, teamId, eventStart) {
		try {
			console.log(`[NOTIFICATIONS] Creating invitations notifications for event ${eventId}...`);
			const staff = await Notification.app.models.Staff.find({
				where: { _id: { inq: staffIds } },
				fields: ['customerId']
			});
			const customerIds = staff.map(({ customerId }) => customerId).filter(x => x);
			const notificationsToCreate = (
				await Promise.all(
					customerIds.map(customerId =>
						Notification.createEventNotification(eventId, customerId, eventTitle, teamId, eventStart)
					)
				)
			).filter(x => x);
			if (notificationsToCreate.length > 0) {
				await Notification.create(notificationsToCreate);
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Notification.createEventNotification = async function (eventId, customerId, eventTitle, teamId, eventStart) {
		const type = notificationConstants.TYPEEVENTINVITATION;
		const notificationMessage = notificationConstants.EVENTINVITATION;
		const message = `$${eventTitle}$|${notificationMessage}`;
		const [notification, customer, team] = await Promise.all([
			Notification.getDataSource()
				.connector.collection(Notification.modelName)
				.findOne({ customerId, type, eventId: eventId.toString() }),
			Notification.app.models.Customer.findOne({
				where: { _id: ObjectID(customerId) },
				include: [
					{
						relation: 'teamSettings',
						scope: {
							where: {
								teamId: ObjectID(teamId)
							}
						}
					}
				]
			}),
			Notification.app.models.Team.findById(teamId, { fields: ['enabledModules'] })
		]);
		if (!customer) return null;
		const customerTeamSettings = (customer.teamSettings() || [])[0];
		if (!customerTeamSettings) return null;
		const canCreate = checkPermissions(team, customer, customerTeamSettings, 'planning');
		const isActive = customerTeamSettings.notificationEventInvitation;
		return !notification && canCreate && isActive
			? {
					customerId,
					type,
					date: moment().toDate(),
					eventId: eventId,
					eventStart,
					teamId,
					message,
					read: false
			  }
			: null;
	};

	Notification.checkForEventUpdate = async function (eventId, staffIds, teamId, eventStart, eventTitle) {
		try {
			console.log(`[NOTIFICATIONS] Creating event update notifications for event ${eventId}...`);
			const staff = await Notification.app.models.Staff.find({
				where: { _id: { inq: staffIds } },
				fields: ['customerId']
			});
			const customerIds = staff.map(({ customerId }) => customerId).filter(x => x);
			const notificationsToCreate = (
				await Promise.all(
					customerIds.map(customerId =>
						Notification.createEventUpdateNotification(eventId, customerId, teamId, eventStart, eventTitle)
					)
				)
			).filter(x => x);
			if (notificationsToCreate.length > 0) {
				await Notification.create(notificationsToCreate);
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Notification.createEventUpdateNotification = async function (eventId, customerId, teamId, eventStart, eventTitle) {
		const type = notificationConstants.TYPEEVENTUPDATE;
		const notificationMessage = notificationConstants.EVENTUPDATE;
		const [customer, team] = await Promise.all([
			Notification.app.models.Customer.findById(customerId, {
				include: [
					{
						relation: 'teamSettings',
						scope: {
							where: {
								teamId: ObjectID(teamId)
							}
						}
					}
				]
			}),
			Notification.app.models.Team.findById(teamId, { fields: ['enabledModules'] })
		]);
		if (!customer) return null;
		const notificationTitle = `${moment(eventStart).format(
			getDateFormatConfig(customer?.currentDateFormat)
		)} - ${eventTitle}`;
		const message = `$${notificationTitle}$|${notificationMessage}`;
		const customerTeamSettings = (customer.teamSettings() || [])[0];
		const canCreate = checkPermissions(team, customer, customerTeamSettings, 'planning');
		const isActive = customerTeamSettings.notificationEventInvitation;
		return canCreate && isActive
			? {
					customerId,
					type,
					date: moment().toDate(),
					eventId: eventId,
					eventStart,
					teamId,
					message,
					read: false
			  }
			: null;
	};

	Notification.checkForVideoSharingNotification = async function (videoId, staffIds, teamId) {
		try {
			console.log(`[NOTIFICATIONS] Creating video sharing notifications for video ${videoId}...`);
			const type = notificationConstants.TYPEVIDEOSHARING;
			const message = notificationConstants.VIDEOSHARING;
			const staff = await Notification.app.models.Staff.find({
				where: { _id: { inq: staffIds } },
				fields: ['customerId']
			});
			const customerIds = staff.map(({ customerId }) => customerId).filter(x => x);
			const { title } = await Notification.app.models.VideoAsset.findById(videoId, { fields: ['title'] });
			const notificationsToCreate = (
				await Promise.all(
					customerIds.map(customerId =>
						Notification.createVideoNotification(videoId, customerId, teamId, type, `$${title}$|${message}`)
					)
				)
			).filter(x => x);
			if (notificationsToCreate.length > 0) {
				await Notification.create(notificationsToCreate);
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Notification.checkForVideoCommentNotification = async function (videoId, staffIds, authorIds, teamId) {
		try {
			console.log(`[NOTIFICATIONS] Creating video comment notifications for video ${videoId}...`);
			const type = notificationConstants.TYPEVIDEOCOMMENT;
			const message = notificationConstants.VIDEOCOMMENT;
			const staff = await Notification.app.models.Staff.find({
				where: { _id: { inq: staffIds } },
				fields: ['customerId']
			});
			const customerIds = staff
				.map(({ customerId }) => customerId)
				.filter(customerId => customerId && !authorIds.includes(String(customerId)));
			const { firstName, lastName } = await Notification.app.models.Customer.findById(authorIds[0], {
				fields: ['firstName', 'lastName']
			});
			const notificationsToCreate = (
				await Promise.all(
					customerIds.map(customerId =>
						Notification.createVideoNotification(
							videoId,
							customerId,
							teamId,
							type,
							`$${firstName} ${lastName}$|${message}`
						)
					)
				)
			).filter(x => x);
			if (notificationsToCreate.length > 0) {
				await Notification.create(notificationsToCreate);
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Notification.createVideoNotification = async function (videoId, customerId, teamId, type, message) {
		const [notification, customer, team] = await Promise.all([
			Notification.getDataSource()
				.connector.collection(Notification.modelName)
				.findOne({ customerId, type, videoId: String(videoId) }),
			Notification.app.models.Customer.findById(customerId, {
				include: [
					{
						relation: 'teamSettings',
						scope: {
							where: {
								teamId: ObjectID(teamId)
							}
						}
					}
				]
			}),
			Notification.app.models.Team.findById(teamId, { fields: ['enabledModules'] })
		]);
		if (customer) {
			const customerTeamSettings = (customer.teamSettings() || [])[0];
			if (!customerTeamSettings) return null;
			const toCreate = (type === 'videoSharing' && !notification) || type === 'videoComment';
			const canCreate = checkPermissions(team, customer, customerTeamSettings, 'video-gallery');
			const isActive =
				customerTeamSettings[type === 'videoSharing' ? 'notificationVideoSharing' : 'notificationVideoComment'];
			return toCreate && canCreate && isActive
				? {
						customerId,
						type,
						date: moment().toDate(),
						videoId,
						teamId,
						message,
						read: false
				  }
				: null;
		}
	};

	Notification.checkForGameReportCompletion = async function (report) {
		try {
			console.log(`[NOTIFICATIONS] Creating scouting game report completion notifications for report ${report.id}...`);
			const type = notificationConstants.SCOUTINGGAMEREPORTCOMPLETION;
			const { clubId } = await Notification.app.models.Team.findById(report.teamId);
			const customerTeamSettings = await Notification.app.models.CustomerTeamSettings.find({
				where: {
					teamId: ObjectID(report.teamId)
				},
				include: [
					{
						relation: 'customer',
						scope: {
							where: {
								notificationScoutingGameReport: true
							}
						}
					}
				]
			});
			const usersWithNotificationActive = customerTeamSettings
				.filter(({ permissions }) => permissions.includes('scouting-games-report'))
				.filter(setting => setting.customer());
			const notificationsToCreate = (
				await Promise.all(
					usersWithNotificationActive.map(({ customerId }) =>
						Notification.createScoutingGameReportNotification(customerId, report, type, clubId)
					)
				)
			).filter(x => x);
			if (notificationsToCreate.length > 0) {
				await Notification.create(notificationsToCreate);
			}
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Notification.createScoutingGameReportNotification = async function (
		customerId,
		{ id: scoutingGameReportId, scoutingGameId, teamId, displayName, history, denormalizedScoutingGameFields },
		type,
		clubId
	) {
		const translationKey = notificationConstants.SCOUTINGGAMEREPORTCOMPLETIONMESSAGE;
		const { author: authorId } = history[0] || {};
		const customer = await Notification.app.models.Customer.findById(ObjectID(customerId), { currentDateFormat: 1 });
		const lastAuthor = await Notification.app.models.Customer.findById(ObjectID(authorId));

		const { start, homeTeam, awayTeam } = denormalizedScoutingGameFields;
		const title = `${moment(start).format(
			`${getDateFormatConfig(customer?.currentDateFormat)} hh:mm`
		)}, ${homeTeam} vs ${awayTeam}, ${displayName}`;
		const name = lastAuthor ? `${lastAuthor.firstName} ${lastAuthor.lastName}` : '';

		const message = `$${title}$|$${name}$|${translationKey}`;

		return {
			customerId,
			type,
			scoutingGameReportId,
			scoutingGameId,
			date: moment().toDate(),
			clubId,
			teamId,
			message,
			read: false
		};
	};

	Notification.checkForScoutingGameInvitations = async function (
		scoutingGameId,
		customerIds,
		eventTitle,
		teamId,
		eventStart
	) {
		try {
			console.log(`[NOTIFICATIONS] Creating invitations notifications for Scouting Game ${scoutingGameId}...`);
			const notificationsToCreate = (
				await Promise.all(
					customerIds.map(customerId =>
						Notification.creteScoutingGameInvitationNotification(
							scoutingGameId,
							customerId,
							eventTitle,
							teamId,
							eventStart
						)
					)
				)
			).filter(x => x);
			if (notificationsToCreate.length > 0) {
				await Notification.create(notificationsToCreate);
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Notification.creteScoutingGameInvitationNotification = async function (
		scoutingGameId,
		customerId,
		eventTitle,
		teamId,
		eventStart
	) {
		const type = notificationConstants.TYPESCOUTINGGAMEINVITATION;
		const notificationMessage = notificationConstants.SCOUTINGGAMEINVITATION;
		const message = `$${eventTitle}$|${notificationMessage}`;
		const [notification, customer] = await Promise.all([
			Notification.getDataSource()
				.connector.collection(Notification.modelName)
				.findOne({ customerId, type, scoutingGameId: String(scoutingGameId) }),
			Notification.app.models.Customer.findById(customerId, {
				fields: ['notificationScoutingGameInvitation']
			})
		]);
		if (!customer) return null;
		const isActive = customer.notificationScoutingGameInvitation;
		return !notification && isActive
			? {
					customerId,
					type,
					date: moment().toDate(),
					scoutingGameId,
					eventStart,
					teamId,
					message,
					read: false
			  }
			: null;
	};

	Notification.triggerBonusPaidNotification = async function (bonus) {
		console.log('[NOTIFICATION] Triggering Bonus Paid notification...');
		const [person, contract] = await Promise.all([
			Notification.app.models[bonus.personType].findById(bonus.personId),
			Notification.app.models[bonus.contractType].findById(bonus.contractId)
		]);

		const clubToPay =
			((await Notification.app.models.Wyscout.searchTeam(contract.club, true)) || [])[0]?.officialName || '';

		if (person) {
			const customerTeamSettings = await Notification.app.models.CustomerTeamSettings.find({
				where: {
					teamId: ObjectID(person.teamId)
				}
			});

			for (const teamSettings of customerTeamSettings) {
				const type = notificationConstants.TYPENOTIFICATIONBONUSPAIDOVERDUE;
				const displayName = person.displayName || `${person.firstName} ${person.lastName}`;
				let message = `$${displayName}$|${notificationConstants.BONUSPAID}`;
				if (isToPay(bonus, contract))
					message = `$${displayName}$|$${clubToPay}$|${notificationConstants.BONUSPAIDTEAM}`;
				if (isToReceive(bonus)) message = `$${displayName}$|$${clubToPay}$|${notificationConstants.BONUSRECEIVEDTEAM}`;

				if (teamSettings.notificationBonusPaidOverdue) {
					const notificationToCreateAbove = {
						type,
						date: moment().toDate(),
						customerId: teamSettings.customerId,
						teamId: teamSettings.teamId,
						playerId: String(person.id),
						bonusId: bonus._id,
						img: person.downloadUrl,
						message,
						read: false
					};
					await Notification.create(notificationToCreateAbove);
				}
			}
		}
		return true;
	};

	Notification.triggerBonusConfirmedNotification = async function (bonus) {
		console.log('[NOTIFICATION] Triggering Bonus Confirmed notification...');

		const person = await Notification.app.models[bonus.personType].findById(bonus.personId);

		if (person) {
			const customerTeamSettings = await Notification.app.models.CustomerTeamSettings.find({
				where: {
					teamId: ObjectID(person.teamId)
				}
			});

			for (const teamSettings of customerTeamSettings) {
				const type = notificationConstants.TYPENOTIFICATIONBONUSPAIDOVERDUE;
				const displayName = person.displayName || `${person.firstName} ${person.lastName}`;
				const message = `$${displayName}$|${notificationConstants.BONUSCONFIRMED}`;

				if (teamSettings.notificationBonusPaidOverdue) {
					const notificationToCreateAbove = {
						type,
						date: moment().toDate(),
						customerId: teamSettings.customerId,
						teamId: teamSettings.teamId,
						playerId: String(person.id),
						bonusId: bonus._id,
						img: person.downloadUrl,
						message,
						read: false
					};
					await Notification.create(notificationToCreateAbove);
				}
			}
		}
		return true;
	};

	Notification.triggerBonusReachedNotification = async function (bonus) {
		console.log('[NOTIFICATION] Triggering Bonus Reached notification...');

		const person = await Notification.app.models[bonus.personType].findById(bonus.personId);

		if (person) {
			const customerTeamSettings = await Notification.app.models.CustomerTeamSettings.find({
				where: {
					teamId: ObjectID(person.teamId)
				}
			});

			for (const teamSettings of customerTeamSettings) {
				const type = notificationConstants.TYPENOTIFICATIONBONUSPAIDOVERDUE;
				const message = getMessageForBonusNotifications(person, bonus);

				if (teamSettings.notificationBonusPaidOverdue) {
					const notificationToCreateAbove = {
						type,
						date: moment().toDate(),
						customerId: teamSettings.customerId,
						teamId: teamSettings.teamId,
						playerId: String(person.id),
						bonusId: bonus._id,
						img: person.downloadUrl,
						message,
						read: false
					};
					await Notification.create(notificationToCreateAbove);
				}
			}
		}
		return true;
	};

	Notification.triggerTeamBonusNotification = async function (bonus, message) {
		console.log('[NOTIFICATION] Triggering Team Bonus notification...');

		const customerTeamSettings = await Notification.app.models.CustomerTeamSettings.find({
			where: {
				teamId: ObjectID(bonus.teamId)
			}
		});

		const type = notificationConstants.TYPENOTIFICATIONCLUBBONUSPAIDOVERDUE;
		for (const teamSettings of customerTeamSettings) {
			if (teamSettings.notificationClubBonusPaidOverdue) {
				const notificationToCreate = {
					type: type,
					date: moment().toDate(),
					customerId: teamSettings.customerId,
					teamId: teamSettings.teamId,
					bonusId: bonus.id,
					message,
					read: false
				};
				await Notification.create(notificationToCreate);
			}
		}
		return true;
	};
};

async function checkPlayerValueChanges(player, customerTeamSettings, Notification) {
	const notifications = [];
	const value = getPlayerValue(player) || 0;
	const cost = player?.inward?.amount || 0;
	const gain = value - cost;
	const lossThreshold = (player._thresholdsFinancial || []).find(({ name }) => name === 'Capital Loss')?.value || 0;
	const gainThreshold = (player._thresholdsFinancial || []).find(({ name }) => name === 'Capital Gain')?.value || 0;
	if (gain > 0) {
		if (gain > gainThreshold) {
			for (const teamSettings of customerTeamSettings) {
				if (teamSettings?.notificationFinancialCapitalGainLoss) {
					const type = notificationConstants.TYPENOTIFICATIONFINANCIALCAPTALGAIN;
					const message = `$${player.displayName}$|${notificationConstants.CAPITALGAIN}`;
					// const start = moment().startOf('day').toDate();
					// const end = moment().endOf('day').toDate();
					const stringPlayerId = String(player.id);
					let publishedNotifications = await Notification.find({
						where: {
							customerId: ObjectID(teamSettings.customerId),
							type
						}
					});
					publishedNotifications = publishedNotifications.filter(({ playerId }) => String(playerId) === stringPlayerId);
					if (!publishedNotifications || publishedNotifications?.length === 0) {
						notifications.push({
							customerId: ObjectID(teamSettings.customerId),
							type,
							date: moment().toDate(),
							playerId: stringPlayerId,
							img: player.downloadUrl,
							teamId: player.teamId,
							message,
							read: false
						});
					}
				}
			}
		}
	} else if (gain < 0) {
		if (Math.abs(gain) > lossThreshold) {
			for (const teamSettings of customerTeamSettings) {
				if (teamSettings?.notificationFinancialCapitalGainLoss) {
					const type = notificationConstants.TYPENOTIFICATIONFINANCIALCAPITALLOSSGAIN;
					const message = `$${player.displayName}$|${notificationConstants.CAPITALLOSSGAIN}`;
					// const start = moment().startOf('day').toDate();
					// const end = moment().endOf('day').toDate();
					const stringPlayerId = String(player.id);
					let publishedNotifications = await Notification.find({
						where: {
							customerId: ObjectID(teamSettings.customerId),
							type
						}
					});
					publishedNotifications = publishedNotifications.filter(({ playerId }) => String(playerId) === stringPlayerId);
					if (!publishedNotifications || publishedNotifications?.length === 0) {
						notifications.push({
							customerId: ObjectID(teamSettings.customerId),
							type,
							date: moment().toDate(),
							playerId: stringPlayerId,
							img: player.downloadUrl,
							teamId: player.teamId,
							message,
							read: false
						});
					}
				}
			}
		}
	}
	return notifications;
}

function getMessageInjuryFromStatuses(injury) {
	const orderedStatuses = {
		'medical.infirmary.details.statusList.assessment': -1,
		'medical.infirmary.details.statusList.therapy': 0,
		'medical.infirmary.details.statusList.rehab': 1,
		'medical.infirmary.details.statusList.reconditioning': 2,
		'medical.infirmary.details.statusList.returnToPlay': 3,
		'medical.infirmary.details.statusList.returnToGame': 4
	};
	const historyOrdered = injury.statusHistory.sort((a, b) => {
		return moment(b['date']).toDate().getTime() - moment(a['date']).toDate().getTime();
	});
	if (historyOrdered.length > 1) {
		const indexCurrent = orderedStatuses[historyOrdered[0].phase];
		const indexPrev = orderedStatuses[historyOrdered[1].phase];
		const message = indexCurrent > indexPrev ? notificationConstants.INJURYBETTER : notificationConstants.INJURYWORSE;
		return {
			message: message,
			current: historyOrdered[0].phase,
			previous: historyOrdered[1].phase
		};
	}
	return null;
}

function getMessageForAssessment(player, lastAssessment, previousAssessment, customerCurrentDateFormat) {
	let message;
	if (lastAssessment?.available === 'yes') {
		message =
			previousAssessment?.available === 'no'
				? `$${player.displayName}$|${notificationConstants.INJURYAVAILABLE}`
				: null;
	} else {
		if (lastAssessment?.expectation) {
			message = `$${player.displayName}$|$${moment(lastAssessment?.expectation).format(
				getDateFormatConfig(customerCurrentDateFormat)
			)}$|${notificationConstants.INJURYEXPECTATION}`;
		} else if (lastAssessment?.further === true) {
			message = `$${player.displayName}$|${notificationConstants.INJURYFURTHER}`;
		}
	}
	return message;
}

function getMessageForBonusNotifications(recipient, element) {
	const name = recipient.displayName || `${recipient.firstName} ${recipient.lastName}` || recipient.name;
	const final = isPercentageToCheck(element.type)
		? `notification.message.bonus.${element.type}.percentage`
		: `notification.message.bonus.${element.type}`;
	const suffix = isPercentageToCheck(element.type) ? `$${element.progress?.percentage}$|${final}` : final;
	const message = `$${name}$|${suffix}`;
	return message;
}

function isPercentageToCheck(type) {
	return type === 'appearance' || type === 'performance';
}

function isToReceive(bonus) {
	return bonus.contractType === 'TransferContract' && bonus.transferType === 'outward';
}

function isToPay(bonus, contract) {
	return (
		bonus.contractType === 'TransferContract' &&
		bonus.transferType === 'inward' &&
		(contract.type === 'purchased' || contract.type === 'inTeamOnLoan')
	);
}

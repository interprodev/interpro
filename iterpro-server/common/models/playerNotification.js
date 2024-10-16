const moment = require('moment');
const { ObjectID } = require('mongodb');
const { isEmpty } = require('lodash');
const { BadRequestError } = require('../modules/error');
const { convert } = require('html-to-text');
const notificationConstants = require('../constants/notificationConstants.js');
const { getDateFormatConfig } = require('../modules/customerDateFormat.util');

module.exports = function (PlayerNotification) {
	PlayerNotification.checkForEventInvitations = async function (eventId, playerIds, eventTitle, teamId, date) {
		try {
			console.log(`[PLAYER NOTIFICATIONS] Creating invitations notifications for event ${eventId}...`);
			const customerPlayers = await PlayerNotification.app.models.CustomerPlayer.find({
				where: { playerId: { inq: playerIds.map(String) } }
			});
			const notificationsToCreate = (
				await Promise.all(
					customerPlayers
						.filter(({ notificationEvents }) => notificationEvents)
						.map(({ id: customerPlayerId }) =>
							PlayerNotification.createEventNotification(eventId, customerPlayerId, eventTitle, teamId, date)
						)
				)
			).filter(x => x);
			if (notificationsToCreate.length > 0) {
				await PlayerNotification.create(notificationsToCreate);
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerNotification.createEventNotification = async function (eventId, customerPlayerId, eventTitle, teamId, date) {
		const type = notificationConstants.TYPEEVENTINVITATION;
		const notificationMessage = notificationConstants.EVENTINVITATION;
		const message = `$${eventTitle}$|${notificationMessage}`;
		const notification = await PlayerNotification.getDataSource()
			.connector.collection(PlayerNotification.modelName)
			.findOne({ playerId: customerPlayerId, type, eventId: String(eventId) });
		return !notification
			? {
					customerId: customerPlayerId,
					type,
					date: moment().toDate(),
					read: false,
					eventId,
					eventStart: date,
					teamId,
					message: convert(message),
					launchUrl: `app://iterproPlayerApp/calendar?itemId=${eventId}&date=${moment(date).format('YYYY-MM-DD')}`
			  }
			: null;
	};

	PlayerNotification.checkForEventUpdate = async function (eventId, playerIds, teamId, eventStart, eventTitle) {
		try {
			console.log(`[PLAYER NOTIFICATIONS] Creating event update notifications for event ${eventId}...`);
			const customerPlayers = await PlayerNotification.app.models.CustomerPlayer.find({
				where: { playerId: { inq: playerIds.map(String) } }
			});
			const notificationsToCreate = (
				await Promise.all(
					customerPlayers
						.filter(({ notificationEvents }) => notificationEvents)
						.map(({ id: customerPlayerId }) =>
							PlayerNotification.createEventUpdate(eventId, customerPlayerId, teamId, eventStart, eventTitle)
						)
				)
			).filter(x => x);
			if (notificationsToCreate.length > 0) {
				await PlayerNotification.create(notificationsToCreate);
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerNotification.createEventUpdate = async function (eventId, customerPlayerId, teamId, eventStart, eventTitle) {
		const type = notificationConstants.TYPEEVENTUPDATE;
		const notificationMessage = notificationConstants.EVENTUPDATE;
		const customer = await PlayerNotification.app.models.Customer.findById(customerPlayerId, { currentDateFormat: 1 });
		if (!customer) return null;
		const notificationTitle = `${moment(eventStart).format(
			getDateFormatConfig(customer?.currentDateFormat)
		)} - ${eventTitle}`;
		const message = `$${notificationTitle}$|${notificationMessage}`;
		const notification = await PlayerNotification.getDataSource()
			.connector.collection(PlayerNotification.modelName)
			.findOne({ playerId: customerPlayerId, type, eventId: String(eventId) });
		return !notification
			? {
					customerId: customerPlayerId,
					type,
					date: moment().toDate(),
					read: false,
					eventId,
					eventStart,
					teamId,
					message: convert(message),
					launchUrl: `app://iterproPlayerApp/calendar?itemId=${eventId}&date=${moment(eventStart).format('YYYY-MM-DD')}`
			  }
			: null;
	};

	PlayerNotification.checkVideoCommentsNotifications = async function (videoId, matchId, playerIds, req) {
		try {
			console.log(`[PLAYER NOTIFICATIONS] Creating video comment notifications for video ${videoId}...`);
			if (!req) {
				throw BadRequestError('Incomplete request');
			}

			const type = notificationConstants.TYPEVIDEOCOMMENT;
			const message = notificationConstants.PLAYERAPPVIDEOCOMMENT;

			const customerPlayerCollection =
				PlayerNotification.app.models.CustomerPlayer.getDataSource().connector.collection(
					PlayerNotification.app.models.CustomerPlayer.modelName
				);

			let promise$;
			if (req.accessToken) {
				const authorId = req.accessToken.userId || '';
				promise$ = PlayerNotification.app.models.Customer.findById(ObjectID(authorId), { downloadUrl: 1 });
			} else {
				promise$ = PlayerNotification.app.models.Player.findById(ObjectID(req.playerId), { downloadUrl: 1 });
			}
			const author = await promise$;

			for (const playerId of playerIds) {
				const [customerPlayer, player] = await Promise.all([
					customerPlayerCollection.findOne({ playerId: ObjectID(playerId) }),
					PlayerNotification.app.models.Player.findById(ObjectID(playerId))
				]);
				if (customerPlayer && customerPlayer.notificationVideoComments && player) {
					await PlayerNotification.create({
						type,
						customerId: ObjectID(customerPlayer._id),
						message: `$${player.displayName}$|${message}`,
						date: moment().toDate(),
						read: false,
						matchId,
						videoId,
						img: author.downloadUrl,
						launchUrl: `app://iterproPlayerApp/videoComment?videoId=${videoId}&matchId=${matchId}`
					});
				}
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerNotification.checkVideoSharingNotifications = async function (videoId, matchId, playerIds, req) {
		try {
			console.log(`[PLAYER NOTIFICATIONS] Creating video sharing notifications for video ${videoId}...`);
			if (!req) {
				throw BadRequestError('Incomplete request');
			}

			const type = notificationConstants.TYPEPLAYERAPPVIDEOSHARING;
			const message = notificationConstants.PLAYERAPPVIDEOSHARING;

			const customerPlayerCollection =
				PlayerNotification.app.models.CustomerPlayer.getDataSource().connector.collection(
					PlayerNotification.app.models.CustomerPlayer.modelName
				);

			let promise$;
			if (req.accessToken) {
				const authorId = req.accessToken.userId || '';
				promise$ = PlayerNotification.app.models.Customer.findById(ObjectID(authorId), { downloadUrl: 1 });
			} else {
				promise$ = PlayerNotification.app.models.Player.findById(ObjectID(req.playerId), { downloadUrl: 1 });
			}
			const author = await promise$;

			for (const playerId of playerIds) {
				const [customerPlayer, player] = await Promise.all([
					customerPlayerCollection.findOne({ playerId: ObjectID(playerId) }),
					PlayerNotification.app.models.Player.findById(ObjectID(playerId))
				]);
				if (customerPlayer && customerPlayer.notificationVideoShared && player) {
					await PlayerNotification.create({
						type,
						customerId: ObjectID(customerPlayer._id),
						message: `$${player.displayName}$|${message}`,
						date: moment().toDate(),
						read: false,
						matchId,
						videoId,
						img: author.downloadUrl,
						launchUrl: `app://iterproPlayerApp/video?videoId=${videoId}&matchId=${matchId}`
					});
				}
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	PlayerNotification.checkVideoCommentsNotificationsFromPlayerApp = async function (playerId, matchId, videoId) {
		try {
			console.log(
				`[NOTIFICATIONS] Creating notification for a video comment left on Player App by player ${playerId} for video ${videoId}...`
			);
			const player = await PlayerNotification.app.models.Player.findById(ObjectID(playerId), {
				clubId: 1,
				teamId: 1,
				id: 1,
				downloadUrl: 1,
				displayName: 1
			});
			if (!player) return true;

			const customerTeamSettings = await PlayerNotification.app.models.CustomerTeamSettings.find({
				where: {
					teamId: ObjectID(player.teamId)
				}
			});

			const notificationsToCreate = [];
			for (const { customerId, notificationPlayerVideoComment } of customerTeamSettings) {
				if (notificationPlayerVideoComment) {
					const notificationToCreate = {
						clubId: ObjectID(player.clubId),
						teamId: player.teamId,
						customerId,
						playerId: player.id,
						type: 'playerVideoComment',
						date: moment().toDate(),
						img: player.downloadUrl,
						message: `$${player.displayName}$|notification.message.playerVideoComment`,
						videoId,
						matchId
					};
					notificationsToCreate.push(notificationToCreate);
				}
			}
			if (!isEmpty(notificationsToCreate)) {
				await PlayerNotification.app.models.Notification.create(notificationsToCreate);
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};
};

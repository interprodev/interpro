const axios = require('axios');
const axiosRetry = require('axios-retry');
const crypto = require('crypto');
const { omit, flatten } = require('lodash');
const { ObjectID } = require('mongodb');

const { ForbiddenError, InternalError, AuthorizationError, BadRequestError } = require('../../common/modules/error');
const SECRET_KEY = process.env.TALKJS_SECRET_KEY;
const APP_ID = process.env.TALKJS_APP_ID;

const oneSignalAPI = axios.create({ baseURL: `https://onesignal.com/api/v1` });
axiosRetry(oneSignalAPI, { retries: 15, retryDelay: axiosRetry.exponentialDelay });

const talkJSAPI = axios.create({
	baseURL: `https://api.talkjs.com/v1/${APP_ID}`,
	headers: { Authorization: `Bearer ${SECRET_KEY}`, 'Content-type': 'application/json' }
});
axiosRetry(talkJSAPI, { retries: 15, retryDelay: axiosRetry.exponentialDelay });

module.exports = Chat => {
	// --- REGION: AUTH
	Chat.getToken = async function (req) {
		const token = await Chat.app.models.AccessToken.getDataSource()
			.connector.collection(Chat.app.models.AccessToken.modelName)
			.findOne({ _id: req.headers['authorization'] });
		if (!token) {
			throw AuthorizationError('Auth token not provided');
		}
		return token;
	};

	Chat.getSignature = async function (userId, req) {
		try {
			const token = await Chat.getToken(req);
			const { userId: customerId } = token;
			if (!customerId) {
				throw ForbiddenError('Not allowed. Token missing');
			}

			let customer = await Chat.app.models.CustomerPlayer.findById(customerId);
			if (!customer) {
				customer = await Chat.app.models.Customer.findById(customerId);
			}
			if (!customer) throw InternalError('User not found');

			if (!userId) throw BadRequestError('Parameter userId missing');

			const hash = createHash(userId);

			return hash;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Chat.isEnabled = async function (req) {
		try {
			const { userId } = await Chat.getToken(req);
			if (!userId) {
				throw ForbiddenError('Not allowed. Token missing');
			}

			let customer = await Chat.app.models.CustomerPlayer.findById(userId);
			if (!customer) {
				customer = await Chat.app.models.Customer.findById(userId);
			}
			if (!customer) throw InternalError('User not found');

			const club = await Chat.app.models.Club.findById(customer.clubId, { isChatEnabled: 1 });

			return !!club.isChatEnabled;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};
	// --- END REGION: AUTH

	// --- REGION: UI LIST
	Chat.getPlayers = async function (req) {
		try {
			const token = await Chat.getToken(req);
			const userId = token.userId;
			if (!userId) {
				throw ForbiddenError('Not allowed. Token missing');
			}

			let isCustomerPlayer = true;
			let customer = await Chat.app.models.CustomerPlayer.findById(userId);
			if (!customer) {
				customer = await Chat.app.models.Customer.findById(userId);
				isCustomerPlayer = false;
			}
			if (!customer) throw InternalError('User not found');

			let where = {};
			if (isCustomerPlayer) {
				const relatedPlayer = await Chat.app.models.Player.findById(customer.playerId, { fields: ['teamId'] });
				if (!relatedPlayer) throw InternalError('Related player not found');
				where = { teamId: relatedPlayer.teamId, _id: { neq: userId } };
			} else {
				const teamSettings = await Chat.app.models.CustomerTeamSettings.find({
					where: { customerId: ObjectID(userId) }
				});
				where = { teamId: { inq: teamSettings.map(({ teamId }) => teamId) } };
			}

			const players = await Chat.app.models.Player.find({
				where,
				fields: { id: 1, displayName: 1, downloadUrl: 1 },
				include: {
					relation: 'customerPlayer',
					scope: {
						fields: ['email', 'id', 'currentLanguage']
					}
				}
			});

			const customerPlayers = players
				.filter(({ customerPlayer }) => !!customerPlayer())
				.map(({ customerPlayer, displayName, downloadUrl }) => ({
					id: customerPlayer()?.id,
					displayName: displayName,
					downloadUrl: downloadUrl,
					email: customerPlayer()?.email,
					currentLanguage: customerPlayer()?.currentLanguage
				}));

			return customerPlayers;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Chat.getStaffs = async function (req) {
		try {
			const token = await Chat.getToken(req);
			const userId = token.userId;
			if (!userId) {
				throw ForbiddenError('Not allowed. Token missing');
			}

			let isCustomerPlayer = true;
			let customer = await Chat.app.models.CustomerPlayer.findById(userId);
			if (!customer) {
				customer = await Chat.app.models.Customer.findById(userId);
				isCustomerPlayer = false;
			}
			if (!customer) throw InternalError('User not found');

			let where = {};
			if (isCustomerPlayer) {
				const relatedPlayer = await Chat.app.models.Player.findById(customer.playerId, { fields: ['teamId'] });
				if (!relatedPlayer) throw InternalError('Related player not found');
				const teamSettings = await Chat.app.models.CustomerTeamSettings.find({
					where: { teamId: ObjectID(relatedPlayer.teamId), customerId: { neq: userId } }
				});
				where = { id: { inq: teamSettings.map(({ customerId }) => customerId) } };
			} else {
				where = { clubId: ObjectID(customer.clubId), id: { neq: userId } };
			}

			const staffs = await Chat.app.models.Customer.find({
				where,
				fields: {
					id: 1,
					firstName: 1,
					lastName: 1,
					downloadUrl: 1,
					email: 1,
					currentLanguage: 1,
					currentTeamId: 1
				},
				include: ['teamSettings']
			});

			return staffs.map(staff => {
				const customerTeamSettings = (staff.teamSettings() || []).find(
					({ teamId }) => String(teamId) === String(staff.currentTeamId)
				);
				return {
					...omit(JSON.parse(JSON.stringify(staff)), ['currentTeamId', 'teamSettings']),
					position: customerTeamSettings?.position
				};
			});
		} catch (error) {
			console.error(error);
			throw error;
		}
	};
	// --- END REGION: LIST

	// --- REGION: PUSH NOTIFICATIONS
	Chat.sendNotification = async function (req) {
		const { body } = req;
		const { conversation, message, sender } = body.data;

		console.debug(JSON.stringify(body.data));

		const recipients = getRecipients(conversation, sender);
		const talkJSUsers = await getTalkJSUsers(recipients);

		const users = await getIterproCustomer(talkJSUsers, Chat);
		const players = await getIterproCustomerPlayer(talkJSUsers, Chat);

		await Promise.all([...users, ...players].map(person => forwardNotificationsForUser(person, message, sender)));
	};
	// --- REGION: PUSH NOTIFICATIONS

	// --- REGION: TALKJS UTILS
	Chat.getConversation = async function (conversationId, req) {
		try {
			const token = await Chat.getToken(req);
			const { userId: customerId } = token;

			if (!customerId) throw ForbiddenError('Not allowed. Token missing');

			const conversation = await talkJSAPI.get(`/conversations/${conversationId}`);

			return conversation.data;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Chat.addPerson = async function (user, req) {
		try {
			const token = await Chat.getToken(req);
			const { userId: customerId } = token;

			if (!customerId) throw ForbiddenError('Not allowed. Token missing');

			await talkJSAPI.put(`/users/${user.id}`, user);

			return user;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Chat.addToConversation = async function (conversationId, userId, req) {
		try {
			const token = await Chat.getToken(req);
			const { userId: customerId } = token;
			if (!customerId) {
				throw ForbiddenError('Not allowed. Token missing');
			}

			await talkJSAPI.put(`/conversations/${conversationId}/participants/${userId}`, {
				access: 'ReadWrite',
				notify: true
			});

			return userId;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Chat.removeFromConversation = async function (conversationId, userId, req) {
		try {
			const token = await Chat.getToken(req);
			const { userId: customerId } = token;
			if (!customerId) {
				throw ForbiddenError('Not allowed. Token missing');
			}

			await talkJSAPI.delete(`/conversations/${conversationId}/participants/${userId}`, {
				access: 'ReadWrite',
				notify: true
			});

			return userId;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};
	// --- END REGION: TALKJS UTILS
};

function createHash(userId) {
	const hash = crypto.createHmac('sha256', SECRET_KEY).update(userId);
	return hash.digest('hex');
}

function getRecipients({ participants }, { id: senderId }) {
	return Object.keys(participants).filter(partecipantId => partecipantId !== senderId);
}

async function getTalkJSUsers(recipients) {
	const promises$ = recipients.map(id => getTalkJSSingleUser(id));
	const users = await Promise.all(promises$);
	return users.filter(({ email, role }) => email && role);
}

async function getTalkJSSingleUser(id) {
	try {
		const user = await talkJSAPI.get(`/users/${id}`);
		return user.data;
	} catch (e) {
		console.error(e);
		throw e;
	}
}

async function getIterproCustomer(talkJSUsers, Chat) {
	const collection = Chat.app.models.Customer.getDataSource().connector.collection(Chat.app.models.Customer.modelName);
	const iterproUsers = await getIterproUsers(talkJSUsers, collection);

	const users = talkJSUsers
		.filter(({ role }) => role === 'staff')
		.map(user => {
			const customer = iterproUsers.find(({ _id }) => String(user.id) === String(_id));
			return customer
				? {
						...user,
						directorApp: (customer.teamSettings || []).some(({ mobilePermissions }) =>
							mobilePermissions.includes('directorApp')
						),
						coachingApp: (customer.teamSettings || []).some(({ mobilePermissions }) =>
							mobilePermissions.includes('coachingApp')
						),
						playerApp: false,
						customerId: customer._id
				  }
				: null;
		})
		.filter(x => x);

	return users;
}

async function getIterproCustomerPlayer(talkJSUsers, Chat) {
	const collection = Chat.app.models.CustomerPlayer.getDataSource().connector.collection(
		Chat.app.models.CustomerPlayer.modelName
	);
	const iterproUsers = await getIterproUsers(talkJSUsers, collection);

	const players = talkJSUsers
		.filter(({ role }) => role === 'player')
		.map(user => {
			const customerPlayer = iterproUsers.find(({ _id }) => String(user.id) === String(_id));
			return customerPlayer
				? {
						...user,
						playerApp: !!customerPlayer,
						directorApp: false,
						coachingApp: false,
						customerId: customerPlayer._id
				  }
				: null;
		})
		.filter(x => x);

	return players;
}

async function getIterproUsers(talkJSUsers, collection) {
	const ids = flatten(talkJSUsers.map(({ id }) => ObjectID(id) || []));
	const stages = [
		{
			$match: {
				$or: [{ _id: { $in: ids } }]
			}
		},
		{
			$lookup: {
				from: 'CustomerTeamSettings',
				localField: '_id',
				foreignField: 'customerId',
				as: 'teamSettings'
			}
		}
	];
	return await collection.aggregate(stages).toArray();
}

async function forwardNotificationsForUser(user, message, sender) {
	const oneSignalMessage = {
		contents: { en: getText(message) },
		headings: { en: sender.name },
		include_external_user_ids: [user.customerId]
	};
	if (user.role === 'staff' && user.directorApp) {
		console.info(`Pushing Director notifications for Customer ${user.customerId} to OneSignal...`);
		await sendNotificationToOneSignal(oneSignalMessage, message.conversationId, 'director');
	}
	if (user.role === 'staff' && user.coachingApp) {
		console.info(`Pushing Coaching notifications for Customer ${user.customerId} to OneSignal...`);
		await sendNotificationToOneSignal(oneSignalMessage, message.conversationId, 'coaching');
	}
	if (user.role === 'player' && user.playerApp) {
		console.info(`Pushing Player notifications for CustomerPlayer ${user.customerId} to OneSignal...`);
		await sendNotificationToOneSignal(oneSignalMessage, message.conversationId, 'player');
	}
}

function getText(message) {
	return message.text === '' ? (message.attachment ? 'Attachment' : '') : message.text;
}

function getOneSignalAppID(key) {
	switch (key) {
		case 'director':
			return process.env.DIRECTORAPPID;
		case 'coaching':
			return process.env.COACHINGAPPID;
		case 'player':
			return process.env.PLAYERAPPAPPID;
		default:
			return null;
	}
}

function getOneSignalRestKey(key) {
	switch (key) {
		case 'director':
			return process.env.DIRECTORRESTKEY;
		case 'coaching':
			return process.env.COACHINGAPPRESTKEY;
		case 'player':
			return process.env.PLAYERAPPRESTKEY;
		default:
			return null;
	}
}

function getAppBaseUrl(key) {
	switch (key) {
		case 'director':
			return 'directorApp';
		case 'coaching':
			return 'coachingApp';
		case 'player':
			return 'iterproPlayerApp';
		default:
			return null;
	}
}

async function sendNotificationToOneSignal(oneSignalMessage, conversationId, type) {
	try {
		const results = await oneSignalAPI.post(
			'/notifications/',
			{
				app_id: getOneSignalAppID(type),
				app_url: `app://${getAppBaseUrl(type)}/inbox?conversationId=${conversationId}`,
				...oneSignalMessage
			},
			{
				headers: { Authorization: `Basic ${getOneSignalRestKey(type)}`, 'Content-type': 'application/json' }
			}
		);
		return results;
	} catch (error) {
		console.error(error);
		throw error;
	}
}

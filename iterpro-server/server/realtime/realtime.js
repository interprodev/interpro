const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');

module.exports = function (app) {
	app.socketUsers = {};
	app.io.use(async (socket, next) => {
		const { token } = socket.handshake.auth;
		const { id, userId } = JSON.parse(token);
		const accessToken = await app.models.AccessToken.find({ where: { userId, id } });
		if (!accessToken) {
			socket.client.customerId = null;
			next(new Error('Not authorized socket'));
		} else {
			socket.client.customerId = userId;
			next();
		}
	});

	app.io.on('connection', socket => {
		app.socketUsers[socket.client.customerId] = null;

		socket.on('disconnect', () => {
			console.debug('Socket disconnected');
		});

		socket.on('join', data => {
			socket.join(data.userId);
			console.debug('Socket now in rooms', socket.rooms);
		});

		emitNotifications(socket);
	});

	const emitNotifications = async socket => {
		const notifications = await app.models.Notification.find({
			where: {
				customerId: ObjectID(socket.client.customerId),
				or: [{ read: { ne: true } }, { date: { gte: moment().subtract(10, 'days').toDate() } }]
			}
		});
		// const filtered = notifications.filter(notification => byTeam(notification, socket.client.teamId));

		socket.emit('notifications', { notifications });
	};

	try {
		app.models.Notification.getDataSource().connector.connect((err, db) => {
			console.log('Connected to realtime database');
			const changeStreamCursor = db.collection('Notification').watch({
				fullDocument: 'updateLookup'
			});
			changeStreamCursor.on('change', change => {
				const notification = change.fullDocument;
				if (notification?.customerId && change.operationType === 'insert') {
					app.io.in(String(notification.customerId)).emit('notification', notification);
				}
			});
		});
	} catch (error) {
		console.error(error);
	}
};

// function byTeam({ teamId }, currentTeamId) {
// 	return String(teamId) === String(currentTeamId) || teamId === 'GLOBAL';
// }

// function byStatus({ date, read }) {
// 	return !read || moment().subtract(10, 'day').isBefore(moment(date));
// }

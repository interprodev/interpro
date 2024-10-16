const { ObjectID } = require('mongodb');
const moment = require('moment-timezone');
const { isEmpty, difference } = require('lodash');
const { getClientHost } = require('../modules/utils');
const { sendEmail, renderEmailFromSendGridTemplate } = require('../../server/shared/emails-utils');
const { EventError } = require('../modules/error');

module.exports = function (ScoutingGame) {
	ScoutingGame.observe('persist', async ctx => {
		try {
			const { isNewInstance, currentInstance, data } = ctx;
			const scoutingGameId = data.id || currentInstance.id;
			if (!isNewInstance) {
				const current = await ScoutingGame.findById(scoutingGameId, {
					fields: ['assignedTo']
				});
				const addedStaff = data.assignedTo
					? difference(data.assignedTo.map(String), current.assignedTo.map(String))
					: [];
				if (addedStaff.length > 0) {
					await ScoutingGame.app.models.Notification.checkForScoutingGameInvitations(
						scoutingGameId,
						addedStaff,
						`${moment(data.start).format('DD/MM/YYYY')} - ${data.title}`,
						data.teamId,
						data.start
					);
				}
			}
		} catch (e) {
			throw EventError(e);
		}
	});

	ScoutingGame.observe('after save', async ctx => {
		try {
			const { isNewInstance, instance } = ctx;
			/*
				NOTE: why here and not in "persist" hook?

				Because in "persist" the event has not been yet saved, thus for new instances we don't have the id fields,
				which is needed for generating the notification.

				On the other hand, in the "after save" hook, for already existing instances we don't have the differences between current and updated event,
				which is needed for generating notifications only for the interested players/staffs
			*/
			if (isNewInstance) {
				const addedStaff = instance.assignedTo;
				if (addedStaff.length > 0) {
					await ScoutingGame.app.models.Notification.checkForScoutingGameInvitations(
						instance.id,
						addedStaff,
						`${moment(instance.start).format('DD/MM/YYYY')} - ${instance.title}`,
						instance.teamId,
						instance.start
					);
				}
			}
		} catch (e) {
			throw EventError(e);
		}
	});

	ScoutingGame.observe('before delete', async ctx => {
		try {
			console.log(
				`[SCOUTING GAME] Deleting ${ctx.Model.name} matching ${ctx.where.id}. Deleting its game reports and removing attachments from Cloud Storage...`
			);
			const game = await ScoutingGame.findById(ctx.where.id);
			const { clubId } = await ScoutingGame.app.models.Team.findById(game.teamId);
			await Promise.all(
				(game._attachments || []).map(({ url }) => ScoutingGame.app.models.Storage.deleteFile(clubId, url))
			);
			await game.gameReports.destroyAll();
		} catch (e) {
			throw console.error(e);
		}
	});

	ScoutingGame.sendEmail = async function (reportId, customerIds) {
		console.log(`[ScoutingGame] Sending emails for report ${reportId} to ${customerIds.join(', ')}...`);
		const game = await ScoutingGame.findById(reportId);
		const reports = await game.gameReports.find();
		const sender = await ScoutingGame.app.models.Customer.findById(
			!isEmpty(game.history) ? game.history[0].author : game.author
		);
		const recipients = await ScoutingGame.app.models.Customer.find({
			where: { id: { inq: customerIds.map(id => ObjectID(id)) } },
			fields: { id: true, email: true, firstName: true, lastName: true }
		});
		const players = reports
			.filter(({ scoutId }) => scoutId)
			.map(({ displayName, scoutId }) => ({
				displayName,
				scoutId
			}));

		const club = await ScoutingGame.app.models.Club.findOne({ where: { id: ObjectID(sender.clubId) } });

		const emails = recipients.map(recipient =>
			getEmail(
				recipient,
				sender,
				game,
				players
					.filter(({ scoutId }) => String(scoutId) === String(recipient.id))
					.map(({ displayName }) => displayName)
					.join(', '),
				club
			)
		);

		await sendEmail(emails);
	};
};
// STANDBY: ATM not perfect, but keep it since the logic may vary soon
// function getScoutQueryParams(customerIds) {
// 	return {
// 		$or: [
// 			{ assignedTo: { $elemMatch: { $in: customerIds } } },
// 			{ history: { $elemMatch: { author: { $in: customerIds } } } }
// 		]
// 	};
// }

function getEmail({ email, firstName, lastName }, sender, report, players, club) {
	const data = {
		firstName,
		lastName,
		senderFirstName: sender.firstName,
		senderLastName: sender.lastName,
		senderEmail: sender.email,
		title: !!report.title && report.title.length > 0 ? report.title : `${report.homeTeam} - ${report.awayTeam}`,
		start: moment(report.start).utcOffset(report.timezone).format('LLL'),
		players,
		location: report.location || '',
		host: getClientHost(club),
		notes: (report.notes || '').replace(/<\/?[^>]+>/gi, '')
	};
	const config = {
		recipient: email,
		cc: sender.email !== email ? sender.email : null,
		subject: 'Iterpro - New Scouting Game Report Update',
		template_id: 'd-ae2e555118e846d0986b302f4a9af35a'
	};
	return renderEmailFromSendGridTemplate(data, config);
}

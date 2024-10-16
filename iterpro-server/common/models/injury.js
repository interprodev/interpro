const { EventError } = require('../modules/error');
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const { pushEventToAzureQueue, robustnessQueueName, getPayloadForQueue } = require('../modules/az-storage-queue');
const { setPrefetchedDataIfNotExist } = require('../modules/prefetchDataUtils/prefetchedData');

module.exports = function (Injury) {
	Injury.validate(
		'expectedReturn',
		function (err) {
			if (this.expectedReturn && this.expectedReturn < this.date) err();
		},
		{
			message: 'Expected return must be after injury date'
		}
	);

	Injury.observe('before delete', async function (ctx, next) {
		const injury = await Injury.findById(ctx.where.id);
		const ids = [
			...(injury._injuryAssessments || []).map(({ eventId }) => eventId),
			...(injury._injuryExams || []).map(({ eventId }) => eventId),
			...(injury._injuryTreatments || []).map(({ eventId }) => eventId)
		].filter(x => x);
		await checkForQueueEvents(Injury, ctx.instance);
		console.log('[INJURY] Deleting', ids);

		for (const id of ids) {
			await Injury.app.models.Event.destroyById(id);
		}
	});

	Injury.observe('after save', async function (ctx) {
		await checkForQueueEvents(Injury, ctx.instance);
	});
};

async function checkForQueueEvents(Injury, injury) {
	try {
		console.log(`[INJURY] Check for injury queue events ${injury.id}...`);
		const { playerId } = injury;
		if (playerId) {
			const { teamId } = await Injury.app.models.Player.findOne({
				where: { id: playerId },
				fields: { teamId: 1 }
			});
			const [teamData, teamSeasons] = await Promise.all([
				Injury.app.models.Team.findOne({
					where: { _id: ObjectID(teamId) },
					fields: [
						'id',
						'clubId',
						'name',
						'providerPlayer',
						'device',
						'providerTeam',
						'_playerProviderMapping',
						'enabledModules'
					]
				}),
				Injury.app.models.TeamSeason.find({
					where: { teamId: ObjectID(teamId) },
					fields: {
						id: 1,
						offseason: 1,
						inseasonEnd: 1
					}
				})
			]);
			const currentSeason = getCurrentSeason(teamSeasons, injury);
			if (
				moment(injury.date).isBetween(moment(currentSeason.offseason), moment(currentSeason.inseasonEnd, 'day', []))
			) {
				const prefetchDataContainer = Object.create(Injury.app.prefetchDataContainer);
				const queueServiceClient = Object.create(Injury.app.queueClient);
				const data = { teamData, currentSeason };
				const payload = getPayloadForQueue(robustnessQueueName, teamData, currentSeason, playerId);
				await setPrefetchedDataIfNotExist(Injury, prefetchDataContainer, data);
				const currentQueueClient = queueServiceClient.getQueueClient(robustnessQueueName);
				await pushEventToAzureQueue(currentQueueClient, payload);
			}
		}
	} catch (e) {
		throw EventError(e);
	}
}

function getCurrentSeason(teamSeasons, fullDoc) {
	let currentSeason = fullDoc.teamSeasonId
		? teamSeasons.find(({ id }) => String(id) === String(fullDoc.teamSeasonId))
		: null;
	if (!currentSeason) {
		currentSeason = teamSeasons.find(({ offseason, inseasonEnd }) =>
			moment(fullDoc.start || fullDoc.date).isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
		);
	}
	if (!currentSeason) {
		currentSeason = teamSeasons.find(({ offseason, inseasonEnd }) =>
			moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
		);
	}
	return currentSeason;
}

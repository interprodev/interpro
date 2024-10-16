const moment = require('moment');
const { isEmpty } = require('lodash');
const { pushEventToAzureQueue, medicalThresholdQueueName, getPayloadForQueue } = require('../modules/az-storage-queue');
const { EventError } = require('../modules/error');
const { ObjectID } = require('mongodb');

module.exports = function (TestInstance) {
	TestInstance.observe('after save', async function (ctx) {
		const testInstance = JSON.parse(JSON.stringify(ctx.instance));
		const [team, testModel] = await Promise.all([
			TestInstance.app.models.Team.findById(testInstance.teamId),
			TestInstance.app.models.Test.findById(testInstance.testId)
		]);
		const isTestGoScore = team.goSettings.some(setting => setting.enabled && setting.testName === testModel.name);
		const playerIds = !isEmpty(testInstance) ? testInstance._testResults.map(({ playerId }) => playerId) : null;
		if (isTestGoScore && playerIds) {
			await TestInstance.app.models.GOScore.checkForGoScore(
				moment(testInstance.date).startOf('day').toDate(),
				playerIds,
				team.id
			);
		}
	});

	TestInstance.observe('before delete', async function (ctx) {
		const testIdToCheck = ctx.where.testId ? ctx.where.testId : ctx.where.id;
		const testInstance = await TestInstance.findById(testIdToCheck);
		if (testInstance) {
			const team = await TestInstance.app.models.Team.findById(testInstance.teamId);
			const playerIds = !isEmpty(testInstance._testResults)
				? testInstance._testResults.map(({ playerId }) => playerId)
				: null;
			if (playerIds) {
				await TestInstance.app.models.GOScore.checkForGoScore(
					moment(testInstance.date).startOf('day').toDate(),
					playerIds,
					team.id,
					null,
					testInstance.id
				);
			}
		}
	});

	TestInstance.deleteTestInstance = async function (testInstanceId) {
		try {
			console.log(`[TestInstance] Deleting Test Instance ${testInstanceId}...`);
			const testInstance = await TestInstance.findById(testInstanceId);
			const result = await TestInstance.deleteById(testInstanceId);
			if (testInstance) {
				const playerIds = !isEmpty(testInstance._testResults)
					? testInstance._testResults.map(({ playerId }) => playerId)
					: null;
				if (playerIds) {
					await checkForQueueEvents(TestInstance, testInstance, playerIds);
				}
			}
			return result;
		} catch (e) {
			throw EventError(e);
		}
	};
};

async function checkForQueueEvents(TestInstance, testInstance, playerIds) {
	try {
		console.log(`[TESTINSTANCE] Check for testInstance queue events ${testInstance.id}...`);
		if (playerIds && playerIds.length > 0) {
			const teamSeasons = await Promise.resolve(
				TestInstance.app.models.TeamSeason.find({
					where: { teamId: ObjectID(testInstance.teamId) },
					fields: {
						id: 1,
						offseason: 1,
						inseasonEnd: 1
					}
				})
			);
			const currentSeason = getCurrentSeason(teamSeasons, testInstance);
			if (
				moment(testInstance.date).isBetween(
					moment(currentSeason.offseason),
					moment(currentSeason.inseasonEnd, 'day', [])
				)
			) {
				const queueServiceClient = Object.create(TestInstance.app.queueClient);
				const currentQueueClient = queueServiceClient.getQueueClient(medicalThresholdQueueName);
				for (const playerId of playerIds) {
					const payload = getPayloadForQueue(
						medicalThresholdQueueName,
						undefined,
						currentSeason,
						playerId,
						String(testInstance.testId)
					);
					await pushEventToAzureQueue(currentQueueClient, payload);
				}
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

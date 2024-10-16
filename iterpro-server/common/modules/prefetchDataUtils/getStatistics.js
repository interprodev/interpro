/**
 * Get robustness statistics, if playerId is null only common team stats are computed
 * @param {*} db
 * @param {*} teamId
 * @param {*} playerId
 * @param {*} dateFrom
 * @param {*} dateTo
 * @param {*} minutesField
 * @returns
 */
const { ObjectID } = require('mongodb');

module.exports = async function (Model, teamId, playerId, dateFrom, dateTo, minutesField) {
	try {
		console.time(
			playerId !== null
				? `pipelineStagesProfileRobustnessApps-event-player-${playerId}`
				: `pipelineStagesProfileRobustnessApps-prefetched-event`
		);
		const pipelineApps = pipelineStagesProfileRobustnessApps(teamId, playerId, dateFrom, dateTo, minutesField);
		const eventCollection = Model.app.models.Event.getDataSource().connector.collection(
			Model.app.models.Event.modelName
		);
		const result = await eventCollection.aggregate(pipelineApps).toArray();
		console.timeEnd(
			playerId !== null
				? `pipelineStagesProfileRobustnessApps-event-player-${playerId}`
				: `pipelineStagesProfileRobustnessApps-prefetched-event`
		);
		return result;
	} catch (e) {
		console.error('[getStatistics]', e);
		throw e;
	}
};

function pipelineStagesProfileRobustnessApps(teamId, playerId, dateFrom, dateTo, minutesField) {
	try {
		const pipelineStages = [];
		const matchStage = {
			$match: {
				teamId: ObjectID(teamId),
				format: {
					$in: [
						'general',
						'travel',
						'game',
						'medical',
						'assessment',
						'international',
						'administration',
						'off',
						'training'
					]
				},
				start: { $gte: dateFrom, $lte: dateTo }
			}
		};
		const projectStage0 = {
			$project: {
				format: 1,
				subformat: 1,
				start: 1,
				end: 1,
				playerIds: 1,
				individual: 1,
				duration: 1,
				_playerMatchStats: 1,
				result: 1,
				resultFlag: 1
			}
		};
		const projectStage2 = {
			$project: {
				format: 1,
				subformat: 1,
				start: 1,
				end: 1,
				duration: 1,
				individual: 1,
				playerIds: 1,
				'_playerMatchStats._id': 1,
				'_playerMatchStats.playerId': 1,
				'_playerMatchStats.minutesPlayed': 1,
				'_playerMatchStats.substituteInMinute': 1,
				result: 1,
				resultFlag: 1
			}
		};

		pipelineStages.push(matchStage);
		pipelineStages.push(projectStage0);
		pipelineStages.push(projectStage2);

		return pipelineStages;
	} catch (e) {
		console.error('[pipelineStagesProfileRobustnessApps]', e);
		throw e;
	}
}

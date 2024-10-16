const { ObjectID } = require('mongodb');

module.exports = async function (Model, teamId, dateFrom, dateTo, type, individualFlag) {
	try {
		const eventCollection = Model.app.models.Event.getDataSource().connector.collection(
			Model.app.models.Event.modelName
		);
		const pipelineCountApps = pipelineStagesMatchesCount(teamId, dateFrom, dateTo);
		const events = await eventCollection.aggregate(pipelineCountApps).toArray();
		const countTrainings = events.filter(
			({ individual, format }) => (type === 'ALL' || individual === individualFlag) && format === 'training'
		).length;
		const countGames = events.filter(
			x => (type === 'ALL' || x.individual === individualFlag) && x.format === 'game'
		).length;
		const countGamesMinutes = events
			.filter(({ individual, format }) => (type === 'ALL' || individual === individualFlag) && format === 'game')
			.reduce((a, b) => a + (b.duration || 0), 0);
		return { countTrainings, countGames, countGamesMinutes };
	} catch (e) {
		console.error('[getCounters]', e);
		throw e;
	}
};

function pipelineStagesMatchesCount(teamId, dateFrom, dateTo) {
	return [
		{
			$match: {
				teamId: ObjectID(teamId),
				format: { $in: ['game', 'training'] },
				start: { $gte: dateFrom, $lte: dateTo }
			}
		},
		{ $project: { format: 1, duration: 1, individual: 1 } }
	];
}

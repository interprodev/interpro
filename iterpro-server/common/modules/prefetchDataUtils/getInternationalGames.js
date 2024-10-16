const { ObjectID } = require('mongodb');

module.exports = async function (Model, teamId, dateFrom, dateTo) {
	try {
		const eventCollection = Model.app.models.Event.getDataSource().connector.collection(
			Model.app.models.Event.modelName
		);
		const result = await eventCollection
			.aggregate([
				{
					$match: {
						teamId: ObjectID(teamId),
						format: 'international',
						start: { $lte: dateTo, $gte: dateFrom }
					}
				},
				{ $project: { start: 1, format: 1, individual: 1, playerIds: 1 } }
			])
			.toArray();
		return result;
	} catch (e) {
		console.error('[getInternationalGames]', e);
		throw e;
	}
};

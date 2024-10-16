const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;

module.exports = function (BonusesUtils) {
	BonusesUtils.getProgressNew = async function (bonuses, teamSeasonId, teamId, playerIds) {
		try {
			const eventCollection = BonusesUtils.app.models.Event.getDataSource().connector.collection(
				BonusesUtils.app.models.Event.modelName
			);
			const teamSeasonCollection = BonusesUtils.app.models.TeamSeason.getDataSource().connector.collection(
				BonusesUtils.app.models.TeamSeason.modelName
			);
			const seasons = await teamSeasonCollection.find({ teamId: ObjectID(teamId) }).toArray();
			const competitions = BonusesUtils.app.models.ProgressUtils.getAllCompetitions(seasons);
			const from =
				moment.min(seasons.map(x => moment(x.offseason))) || moment('01/01/1900', 'DD/MM/YYYY').startOf('day');
			const to = moment().startOf('day');
			const matches = await eventCollection
				.aggregate([
					{
						$match: {
							$and: [
								{ format: 'game' },
								{ teamId: ObjectID(teamId) },
								{
									start: {
										$gte: from.toDate()
									}
								},
								{
									start: {
										$lte: to.toDate()
									}
								}
							]
						}
					},
					{
						$project: {
							playerIds: 1,
							teamSeasonId: 1,
							_playerMatchStats: 1,
							format: 1,
							subformat: 1,
							competition: 1,
							subformatDetails: 1,
							start: 1,
							result: 1,
							resultFlag: 1,
							home: 1
						}
					}
				])
				.toArray();
			const players = await BonusesUtils.app.models.Player.find({
				where: { id: { in: playerIds.map(x => ObjectID(x)) } }
			});
			const monitored = bonuses.map(bonus => getProgressForBonus(bonus, matches, competitions));

			console.log(players);
			console.log(monitored);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};
};

function getProgressForBonus(bonus, matches, competitions) {
	switch (bonus.contractType) {
		case 'EmploymentContract': {
			break;
		}
		case 'TransferContract': {
			break;
		}
		case 'AgentContract': {
			break;
		}
	}
}

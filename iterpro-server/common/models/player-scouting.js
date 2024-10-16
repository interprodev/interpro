const ObjectID = require('mongodb').ObjectID;
const { uniqBy, omit, intersection } = require('lodash');
const gameReportUtils = require('../../server/shared/player-report-template-utils');
const { InternalError } = require('../modules/error');

module.exports = function (Playerscouting) {
	Playerscouting.observe('after save', async ctx => {
		if (ctx?.instance?.id) {
			const linkedPlayer = await Playerscouting.findOne({
				where: { id: ctx.instance.id }
			});

			if (linkedPlayer) {
				await Playerscouting.updateRelatedClubTransfers(linkedPlayer);
			}
		}

		return true;
	});

	Playerscouting.afterRemote('prototype.__get__employmentContracts', async ctx => {
		ctx.result = await Promise.all(
			ctx.result.map(contract => Playerscouting.app.models.Contract.prepareContract(contract, 'EmploymentContract'))
		);
	});

	Playerscouting.afterRemote('prototype.__get__transferContracts', async ctx => {
		ctx.result = await Promise.all(
			ctx.result.map(contract => Playerscouting.app.models.Contract.prepareContract(contract, 'TransferContract'))
		);
	});

	Playerscouting.getPlayerGames = async function (playerId) {
		try {
			console.log(`[PlayerScouting] Getting games for player ${playerId}...`);
			const filter = getScoutingGameReportQueryFilter(playerId);
			const gameReportCollection = Playerscouting.getDataSource().connector.collection(
				Playerscouting.app.models.ScoutingGameReport.modelName
			);
			const results = await gameReportCollection.aggregate(filter).toArray();
			if (results.length === 0) return [];
			const teams = await Playerscouting.app.models.Team.find({
				where: {
					_id: {
						in: uniqBy(
							results.map(({ teamId }) => teamId),
							String
						)
					}
				},
				fields: ['id', 'clubId']
			});
			const clubId = String(teams[0].clubId);
			const clubTemplates = await gameReportUtils.getScoutingTemplates(clubId, Playerscouting.app.models.Club);
			const mappedResults = await Promise.all(
				results.map(item => {
					return gameReportUtils.getMappedReportData(item, clubTemplates);
				})
			);
			return mappedResults;
		} catch (error) {
			console.error(error);
			throw InternalError('Unable to query Games per PlayerScouting');
		}
	};

	Playerscouting.updateRelatedClubTransfers = async savedPlayer => {
		const transfersforPlayer = await Playerscouting.app.models.ClubTransfer.find({
			where: { personId: savedPlayer.id }
		});
		for (const transfer of transfersforPlayer || []) {
			const transferPlayer = await transfer.player.get();
			if (!transferPlayer) {
				continue;
			}
			const transferPlayerKeys = Object.keys(
				omit(Playerscouting.app.models.PlayerTransfer.definition.rawProperties, 'id')
			);
			const playerKeys = Object.keys(omit(Playerscouting.definition.rawProperties, 'id'));
			for (const key of intersection(transferPlayerKeys, playerKeys)) {
				transferPlayer[key] = savedPlayer[key];
			}
			transferPlayer.sell = transferPlayer.sell || null;
			await transferPlayer.save();
		}
	};
};

function getScoutingGameReportQueryFilter(playerId) {
	return [
		{
			$match: {
				playerScoutingId: ObjectID(playerId)
			}
		},
		{
			$project: {
				nationality: 0,
				position: 0,
				birthDate: 0,
				history: 0,
				denormalizedScoutingGameFields: 0,
				assignedTo: 0,
				thirdPartyProviderId: 0,
				thirdPartyProviderTeamId: 0
			}
		},
		{
			$lookup: {
				from: 'ScoutingGame',
				let: { scoutingGameId: '$scoutingGameId' }, // Define a variable to hold the value of 'scoutingGameId'
				pipeline: [
					{
						$match: {
							$expr: { $eq: ['$_id', '$$scoutingGameId'] } // Compare '_id' with the variable
						}
					},
					{
						$project: {
							title: 1,
							start: 1,
							startTime: 1,
							endTime: 1,
							location: 1,
							assignedTo: 1,
							author: 1,
							homeTeam: 1,
							awayTeam: 1,
							teamId: 1,
							clubId: 1
						}
					}
				],
				as: 'game'
			}
		},
		{
			$replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ['$game', 0] }, '$$ROOT'] } }
		},
		{ $project: { game: 0 } }
	];
}

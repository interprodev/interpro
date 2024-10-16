const ObjectID = require('mongodb').ObjectID;

/**
 * Purpose : Comparing player and team statistics.
 * Holding...
 * 1. comparePlayerStats
 * 2. compareTeamStats
 */
module.exports = function (ComparePlayersStats) {
	ComparePlayersStats.comparePlayerStats = async function (
		teamId,
		playerId,
		dateFrom,
		dateTo,
		metricsGps,
		metricsPlayerStats,
		metricMinutes
	) {
		const eventCollection = ComparePlayersStats.app.models.Event.getDataSource().connector.collection(
			ComparePlayersStats.app.models.Event.modelName
		);
		const matchCollection = ComparePlayersStats.app.models.Match.getDataSource().connector.collection(
			ComparePlayersStats.app.models.Match.modelName
		);

		const pipelineStagesGps = ComparePlayersStats.pipelineStagesGps(teamId, playerId, dateFrom, dateTo, metricsGps);
		const pipelineStagesPlayerStats = ComparePlayersStats.pipelineStagesPlayerStats(
			teamId,
			playerId,
			dateFrom,
			dateTo,
			metricsPlayerStats,
			metricMinutes
		);
		const [resultGps, resultPlayerStats] = await Promise.all([
			eventCollection.aggregate(pipelineStagesGps).toArray(),
			matchCollection.aggregate(pipelineStagesPlayerStats).toArray()
		]);

		return { gps: resultGps, playerStats: resultPlayerStats };
	};

	// Helper pipeline method for comparePlayerStats
	ComparePlayersStats.pipelineStagesGps = function (teamId, playerId, dateFrom, dateTo, metricsGps) {
		const groupGpsClause = {};
		groupGpsClause['_id'] = '$_sessionPlayers.playerId';
		const pipelineStages = [];
		for (const m of metricsGps) {
			const avgComplete = m;
			const sessionAvg = '$_sessionPlayers.' + m;
			groupGpsClause[avgComplete] = { $avg: sessionAvg };
		}
		const groupStage = { $group: groupGpsClause };
		const matchStage = {
			$match: {
				teamId: ObjectID(teamId),
				format: { $in: ['game', 'friendly'] },
				start: { $gte: dateFrom, $lte: dateTo },
				_sessionPlayers: { $exists: true, $ne: [] }
			}
		};
		const unwindStage = {
			$unwind: '$_sessionPlayers'
		};
		const matchStage2 = {
			$match: {
				'_sessionPlayers.mainSession': true,
				'_sessionPlayers.playerId': ObjectID(playerId),
				'_sessionPlayers.duration': { $exists: true, $gt: 85 }
			}
		};
		pipelineStages.push(matchStage);
		pipelineStages.push(unwindStage);
		pipelineStages.push(matchStage2);
		pipelineStages.push(groupStage);
		return pipelineStages;
	};

	// Helper pipeline method for comparePlayerStats
	ComparePlayersStats.pipelineStagesPlayerStats = function (
		teamId,
		playerId,
		dateFrom,
		dateTo,
		metricsPlayerStats,
		metricMinutes
	) {
		const matchStage = {
			$match: {
				teamId: ObjectID(teamId),
				date: { $gte: dateFrom, $lte: dateTo }
			}
		};
		const minutesField = '$$item.' + metricMinutes;
		const projectStage = {
			$project: {
				_id: '$_id',
				playerStats: {
					$filter: {
						input: '$_playerStats',
						as: 'item',
						cond: { $and: [{ $eq: ['$$item.playerId', ObjectID(playerId)] }, { $gte: [minutesField, 0] }] }
					}
				}
			}
		};
		const unwindStage = {
			$unwind: '$playerStats'
		};
		const matchStage3 = {
			$match: {
				'playerStats.playerId': ObjectID(playerId)
			}
		};
		const groupPlayerStatsClause = {};
		groupPlayerStatsClause['_id'] = '$playerStats.playerId';
		const pipelineStages = [];
		for (const m of metricsPlayerStats) {
			const avgComplete = m;
			const mAvg = '$playerStats.' + m;
			groupPlayerStatsClause[avgComplete] = { $avg: mAvg };
		}
		const groupStage = { $group: groupPlayerStatsClause };

		pipelineStages.push(matchStage);
		pipelineStages.push(projectStage);
		pipelineStages.push(unwindStage);
		pipelineStages.push(matchStage3);
		pipelineStages.push(groupStage);

		return pipelineStages;
	};

	// Helper remote method for comparePlayerStats
	ComparePlayersStats.remoteMethod('comparePlayerStats', {
		accepts: [
			{
				arg: 'teamId',
				type: 'string',
				http: { source: 'form' }
			},
			{
				arg: 'playerId',
				type: 'string',
				http: { source: 'form' }
			},
			{
				arg: 'dateFrom',
				type: 'date',
				http: { source: 'form' }
			},
			{
				arg: 'dateTo',
				type: 'date',
				http: { source: 'form' }
			},
			{
				arg: 'metricsGps',
				type: 'array',
				http: { source: 'form' }
			},
			{
				arg: 'metricsPlayerStats',
				type: 'array',
				http: { source: 'form' }
			},
			{
				arg: 'metricMinutes',
				type: 'string',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'object',
			root: true
		},
		http: {
			path: '/comparePlayerStats',
			verb: 'post'
		}
	});
	// --------END of comparePlayerStats--------//

	/**
	 *
	 */
	ComparePlayersStats.compareTeamStats = async function (teamId, dateFrom, dateTo, metricsTeamStats) {
		const matchCollection = ComparePlayersStats.app.models.Match.getDataSource().connector.collection(
			ComparePlayersStats.app.models.Match.modelName
		);

		const pipelineStagesTeamStats = ComparePlayersStats.pipelineStagesTeamStats(
			teamId,
			dateFrom,
			dateTo,
			metricsTeamStats
		);
		const resultTeamStats = await matchCollection.aggregate(pipelineStagesTeamStats).toArray();

		const singleResult = resultTeamStats && resultTeamStats.length > 0 ? resultTeamStats[0] : null;
		return singleResult;
	};

	// Helper pipeline method for compareTeamStats
	ComparePlayersStats.pipelineStagesTeamStats = function (teamId, dateFrom, dateTo, metricsTeamStats) {
		const matchStage = {
			$match: {
				teamId: ObjectID(teamId),
				date: { $gte: dateFrom, $lte: dateTo }
			}
		};

		const groupPlayerStatsClause = {};
		groupPlayerStatsClause['_id'] = null;
		const groupStage = { $group: groupPlayerStatsClause };
		for (const m of metricsTeamStats) {
			const mAvg = '$_teamStat.' + m;
			groupPlayerStatsClause[m] = { $avg: mAvg };
		}

		const pipelineStages = [];

		pipelineStages.push(matchStage);
		pipelineStages.push(groupStage);

		return pipelineStages;
	};

	// Remote method for compareTeamStats
	ComparePlayersStats.remoteMethod('compareTeamStats', {
		accepts: [
			{
				arg: 'teamId',
				type: 'string',
				http: { source: 'form' }
			},
			{
				arg: 'dateFrom',
				type: 'date',
				http: { source: 'form' }
			},
			{
				arg: 'dateTo',
				type: 'date',
				http: { source: 'form' }
			},
			{
				arg: 'metricsTeamStats',
				type: 'array',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'object',
			root: true
		},
		http: {
			path: '/compareTeamStats',
			verb: 'post'
		}
	});
	// -------END of compareTeamStats-------//
};

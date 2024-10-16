'use strict';
/**
 * This includes expected data/responses/results/values required for ComparePlayersStats for player service testing.
 */
module.exports = {
	expectedEndpointUrl: '/api/ComparePlayersStats/comparePlayerStats',
	expectedEndpointUrlForTeam: '/api/ComparePlayersStats/compareTeamStats',
	expectedContentType: 'application/json; charset=utf-8',
	wrongData: '{"id":12345677asjhdajd88}',
	wrongContentType: 'text/plain',
	params: {
		dateFrom: '2018-05-26',
		dateTo: '2019-06-30',
		metricMinutes: 'minutesOnField',
		metricsGps: ['highspeedRunningDistance', 'powerPlays', 'averageMetabolicPower'],
		metricsPlayerStats: [
			'linkupPlays',
			'duelsWon',
			'passes',
			'successfulPasses',
			'successfulPassesToFinalThird',
			'keyPasses',
			'interceptions',
			'missedBalls',
			'recoveries',
			'shots'
		],
		playerId: '5b2bb76849ae6876424bb1b0',
		teamId: '5979b5c55fe28f1a50e781b8'
	},
	paramsForTeam: {
		dateFrom: '2018-05-26',
		dateTo: '2019-06-30',
		metricsTeamStats: [],
		teamId: '5979b5c55fe28f1a50e781b8'
	}
};

/**
 * For Player
 */
module.exports.getExpectedData = function () {
	return [
		{
			gps: [
				{
					_id: '5b2bb76849ae6876424bb1b0',
					highspeedRunningDistance: 516.8981666666667,
					powerPlays: 51.666666666666664,
					averageMetabolicPower: 9.951633333333334
				}
			],
			playerStats: []
		}
	];
};

module.exports.getPartiallyCorrectedData = function () {
	return [
		{
			gps: [
				{
					highspeedRunningDistance: 516.8981666666667,
					powerPlays: 51.666666666666664,
					averageMetabolicPower: 9.951633333333334
				}
			],
			playerStats: []
		}
	];
};

/**
 * For Team
 */
module.exports.getExpectedDataForTeam = function () {
	return [
		{
			_id: null
		}
	];
};

module.exports.getPartiallyCorrectedDataForTeam = function () {
	return [
		{
			_id: '5979b5c55fe28f1a50e781b8'
		}
	];
};

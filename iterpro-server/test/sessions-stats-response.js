'use strict';
/**
 * This includes expected data/responses/results/values required for SessionsStatsService for EWMA service testing.
 */
module.exports = {
	expectedEndpointUrlPeriodTrend: '/api/SessionsStats/sessionsPeriodTrend',
	expectedEndpointUrlPeriodTotal: '/api/SessionsStats/sessionsPeriodTotal',
	expectedEndpointUrlPeriodCsv: '/api/SessionsStats/periodCsv',
	expectedEndpointUrlWorkload: '/api/SessionsStats/workloadAnalysisPeriod',

	expectedContentType: 'application/json; charset=utf-8',
	expectedContentTypeForCsv: 'text/html; charset=utf-8',

	wrongData: '{"id":12345677asjhdajd88}',
	wrongContentType: 'text/plain',

	paramsEwma: {
		dateFrom: '2019-05-18',
		dateTo: '2019-05-18',
		teamId: '5979b5c55fe28f1a50e781b8',
		playerIds: [
			'5c62e508eac3322fb423df75',
			'5979b6c25fe28f1a50e781c2',
			'5979b6c25fe28f1a50e781cc',
			'5979b6c25fe28f1a50e781c0',
			'5b43304d5f0fc40769f94a81',
			'5c382dc7a1ddaa43a8105600',
			'5979b6c25fe28f1a50e781bf',
			'5b58363ef42fb205078a2e0b',
			'5c6d54e9f9225212d40b71ea',
			'5b61a30036ae6006ac91547e',
			'5979b6c25fe28f1a50e781be',
			'5c581b0f10162c27206e1268',
			'5979b6c25fe28f1a50e781b9',
			'5979b6c25fe28f1a50e781c6',
			'5979b6c25fe28f1a50e781c1',
			'5b31f5460a3ebd026b7f332c',
			'5979b6c25fe28f1a50e781cf'
		],
		metrics: ['averageMetabolicPower'],
		seasonStart: '2018-05-26'
	},
	paramsTrend: {
		teamId: '5979b5c55fe28f1a50e781b8',
		playerIds: [
			'5c62e508eac3322fb423df75',
			'5979b6c25fe28f1a50e781c2',
			'5979b6c25fe28f1a50e781cc',
			'5979b6c25fe28f1a50e781c0',
			'5b43304d5f0fc40769f94a81',
			'5c382dc7a1ddaa43a8105600',
			'5979b6c25fe28f1a50e781bf',
			'5b58363ef42fb205078a2e0b',
			'5c6d54e9f9225212d40b71ea',
			'5b61a30036ae6006ac91547e',
			'5979b6c25fe28f1a50e781be',
			'5c581b0f10162c27206e1268',
			'5979b6c25fe28f1a50e781b9',
			'5979b6c25fe28f1a50e781c6',
			'5979b6c25fe28f1a50e781c1',
			'5b31f5460a3ebd026b7f332c',
			'5979b6c25fe28f1a50e781cf'
		],
		dateFrom: '2019-05-18',
		dateTo: '2019-05-18',
		metricsGps: ['averageMetabolicPower', 'highspeedRunningDistance'],
		splits: ['Session', 'game'],
		modified: 0,
		individual: 0
	},
	paramsTotal: {
		teamId: '5979b5c55fe28f1a50e781b8',
		playerIds: ['5c62e508eac3322fb423df75', '5b2bb76849ae6876424bb1b0'],
		dateFrom: '2019-06-04',
		dateTo: '2019-06-11',
		metricsGps: ['averageMetabolicPower', 'highspeedRunningDistance'],
		splits: ['Session', 'game'],
		modified: 0,
		individual: 0
	},
	paramsCsv: {
		teamId: '5979b5c55fe28f1a50e781b8',
		playerIds: ['5c62e508eac3322fb423df75', '5b2bb76849ae6876424bb1b0', '5979b6c25fe28f1a50e781c2'],
		dateFrom: '2019-06-05',
		dateTo: '2019-06-12',
		activeMetrics: ['highspeedRunningDistance', 'powerPlays', 'averageMetabolicPower', 'Work Ratio'],
		splits: ['Session', 'game']
	},
	paramsWorkload: {
		teamId: '5979b5c55fe28f1a50e781b8',
		playerIds: [
			'5c62e508eac3322fb423df75',
			'5979b6c25fe28f1a50e781c2',
			'5979b6c25fe28f1a50e781cc',
			'5979b6c25fe28f1a50e781c0',
			'5b43304d5f0fc40769f94a81',
			'5c382dc7a1ddaa43a8105600',
			'5979b6c25fe28f1a50e781bf',
			'5b58363ef42fb205078a2e0b',
			'5c6d54e9f9225212d40b71ea',
			'5b61a30036ae6006ac91547e',
			'5979b6c25fe28f1a50e781be',
			'5c581b0f10162c27206e1268',
			'5979b6c25fe28f1a50e781b9',
			'5979b6c25fe28f1a50e781c6',
			'5979b6c25fe28f1a50e781c1',
			'5b31f5460a3ebd026b7f332c',
			'5979b6c25fe28f1a50e781cf'
		],
		dateFrom: '2019-06-06',
		dateTo: '2019-06-13',
		modified: 0,
		individual: 0
	},
	paramsTest: {
		teamId: '5979b5c55fe28f1a50e781b8',
		playerIds: [
			{
				name: 'Centre Midfielder',
				displayName: 'Centre Midfielder',
				id: '5c7590a3442a481b2c42a359'
			},
			{
				displayName: 'Left Winger',
				id: '5c759031442a481b2c42a358',
				name: 'Left Winger',
				playerIds: ['5b2bb76849ae6876424bb1b0', '5979b6c25fe28f1a50e781c1'],
				players: ['5b2bb76849ae6876424bb1b0', '5979b6c25fe28f1a50e781c1'],
				teamId: '5979b5c55fe28f1a50e781b8'
			},
			'5c62e508eac3322fb423df75',
			'5b2bb76849ae6876424bb1b0'
		],
		dateFrom: '2019-06-04',
		dateTo: '2019-06-11',
		metricsGps: ['averageMetabolicPower', 'highspeedRunningDistance'],
		splits: ['Session', 'game'],
		modified: 0,
		individual: 0
	}
};

module.exports.getPartiallyCorrectedDataForEwma = function () {
	return [{ '602eb81d12e815938ce1ab8ba8205649': {} }];
};

/**
 * For Period Trend
 */
module.exports.getExpectedDataForTrend = function () {
	return [{ data: [], splits: [], games: 0, trainings: 0, eventData: {} }];
};

module.exports.getPartiallyCorrectedDataForTrend = function () {
	return [{ splits: [], games: 0, trainings: 0, eventData: {} }];
};

/**
 * For PeriodTotal
 */
module.exports.getExpectedDataForTotal = function () {
	return [
		{
			data: [],
			splits: [],
			games: 0,
			eventData: {},
			trainings: 0
		}
	];
};

module.exports.getPartiallyCorrectedDataForTotal = function () {
	return [
		{
			data: [
				{ label: 'Centre Midfielder', series0: 0, series1: 0 },
				{ label: 'Goalkeeper', series0: 0, series1: 0 }
			],
			splits: [],
			eventData: [],
			games: 0,
			trainings: 0
		}
	];
};

/**
 * For PeriodCsv
 */
module.exports.getExpectedDataForCsv = function () {
	return [{}];
};

module.exports.getPartiallyCorrectedDataForCsv = function () {
	return [{ data: 'should not exist' }];
};

/**
 * For Workload
 */
module.exports.getExpectedDataForWorkload = function () {
	return [
		{
			general: {
				totalDays: 7,
				daysOff: 7,
				trainingSessions: 0,
				games: 0,
				allSessions: 0,
				gameMinutes: 0,
				trainingMinutes: 0
			},
			period_breakdown: { loadMap: {}, timeInTarget: { above: null, below: null, inTarget: null } },
			workload_distribution: {
				avg_values: {
					'06/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					},
					'07/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					},
					'08/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					},
					'09/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					},
					'10/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					},
					'11/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					},
					'12/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					},
					'13/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					}
				},
				percentage: {
					game_load: { perceived: null, mechanical: null, cardio: null, kinematic: null, metabolic: null },
					training_load: { perceived: null, mechanical: null, cardio: null, kinematic: null, metabolic: null }
				}
			},
			stress_balance: [
				{ label: '06/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null },
				{ label: '07/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null },
				{ label: '08/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null },
				{ label: '09/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null },
				{ label: '10/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null },
				{ label: '11/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null },
				{ label: '12/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null },
				{ label: '13/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null }
			]
		}
	];
};

// removed "totalDays":7
module.exports.getPartiallyCorrectedDataForWorkload = function () {
	return [
		{
			general: { daysOff: 7, trainingSessions: 0, games: 0, allSessions: 0, gameMinutes: 0, trainingMinutes: 0 },
			period_breakdown: { loadMap: {}, timeInTarget: { above: null, below: null, inTarget: null } },
			workload_distribution: {
				avg_values: {
					'06/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					},
					'07/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					},
					'08/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					},
					'09/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					},
					'10/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					},
					'11/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					},
					'12/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					},
					'13/06/2019': {
						perceived: null,
						mechanical: null,
						cardio: null,
						kinematic: null,
						metabolic: null,
						intensity: null,
						workload: null,
						eventResult: null,
						home: null,
						opponent: null
					}
				},
				percentage: {
					game_load: { perceived: null, mechanical: null, cardio: null, kinematic: null, metabolic: null },
					training_load: { perceived: null, mechanical: null, cardio: null, kinematic: null, metabolic: null }
				}
			},
			stress_balance: [
				{ label: '06/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null },
				{ label: '07/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null },
				{ label: '08/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null },
				{ label: '09/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null },
				{ label: '10/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null },
				{ label: '11/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null },
				{ label: '12/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null },
				{ label: '13/06/2019', workload: null, readiness: null, eventResult: null, home: null, opponent: null }
			]
		}
	];
};

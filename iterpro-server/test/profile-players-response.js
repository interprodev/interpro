'use strict';
/**
 * This includes expected data/responses/results/values required for ProfilePlayersService service testing.
 */
module.exports = {
	expectedEndpointUrlGameStat: '/api/ProfilePlayers/profileGameStats',
	expectedEndpointUrlRobustness: '/api/ProfilePlayers/profileRobustness',
	expectedEndpointUrlFitness: '/api/ProfilePlayers/profileFitness',

	expectedContentType: 'application/json; charset=utf-8',
	wrongData: '{"id":12345677asjhdajd88}',
	wrongContentType: 'text/plain',
	paramsGameStat: {
		teamId: '5979b5c55fe28f1a50e781b8',
		playerId: '5b31f5460a3ebd026b7f332c',
		metricsPlayerStats: [
			'linkupPlays',
			'duelsWon',
			'passes',
			'successfulPasses',
			'successfulPassesToFinalThird',
			'keyPasses'
		],
		dateFrom: '2019-06-30T00:00:00.000Z',
		dateTo: '2020-06-30T00:00:00.000Z'
	},
	paramsRobustness: {
		teamId: '5979b5c55fe28f1a50e781b8',
		playerIds: ['5b31f5460a3ebd026b7f332c'],
		dateFrom: '2019-06-30',
		dateTo: '2019-06-12',
		minutesField: 'minutesOnField'
	},
	paramsFitness: {
		teamIds: '5979b5c55fe28f1a50e781b8',
		playerId: '5b31f5460a3ebd026b7f332c',
		testIds: ['5ba11a07341d8f054170e4a1'],
		metricsSelected: ['% BF'],
		dateFrom: '2018-05-26',
		dateTo: '2019-06-20'
	}
};

// Game stats
module.exports.getExpectedDataGameStat = function () {
	return [
		{
			matches: [],
			avgMetrics: {
				linkupPlays: null,
				duelsWon: null,
				passes: null,
				successfulPasses: null,
				successfulPassesToFinalThird: null,
				keyPasses: null,
				interceptions: null,
				missedBalls: null,
				recoveries: null,
				shots: null
			},
			avgPlanning: { minutesPlayed: null }
		}
	];
};

module.exports.getPartiallyCorrectedDataGameStat = function () {
	return [
		{
			avgMetrics: {
				linkupPlays: null,
				duelsWon: null,
				passes: null,
				successfulPasses: null,
				successfulPassesToFinalThird: null,
				keyPasses: null,
				interceptions: null,
				missedBalls: null,
				recoveries: null,
				shots: null
			},
			avgPlanning: { minutesPlayed: null }
		}
	];
};

// Robustness
module.exports.getExpectedDataRobustness = function () {
	return [
		{
			'5b31f5460a3ebd026b7f332c': {
				startingApps: 0,
				substitutingApps: 0,
				daysAbsence: 0,
				daysPerGame: 0,
				gameRate: null,
				robustness: null,
				healthStatus: 'fit',
				healthStatusReadiness: 'fit',
				apps: 0,
				minutesPlayed: 0,
				appsBySubFormat: {},
				minutesPlayedBySubFormat: {},
				availability: null,
				gameAvailability: null,
				trainingAvailability: null,
				gameMissed: 0,
				countGames: 0,
				countGamesMinutes: 0,
				countTrainingsMinutes: 0,
				countAllMinutes: 0,
				playingTime: null,
				performanceReliability: null,
				sessionsMissed: 0,
				injuriesNumber: 0,
				injurySeverity: 0,
				reinjuryRate: null,
				breakdown: {
					injured: 0,
					illness: 0,
					complaint: 0,
					fit: 100
				},
				breakdownStatus: {
					notAvailable: 0,
					beCareful: 0,
					available: 100
				},
				monthBreakdown: {},
				gamesMissedInjuries: 0,
				trainingsMissedInjuries: 0,
				gamesMissedInternational: 0,
				trainingsMissedInternational: 0,
				gamesMissedOthers: 0,
				trainingsMissedOthers: 0,
				periodBreakDown: {
					playerId: '5b31f5460a3ebd026b7f332c'
				}
			}
		}
	];
};

module.exports.getPartiallyCorrectedDataRobustness = function () {
	return [
		{
			'5b31f5460a3ebd026b7f332c': {
				startingApps: 0,
				substitutingApps: 0
			}
		}
	];
};

// Fitness
module.exports.getExpectedDataFitness = function () {
	return [
		{
			testsValues: {
				'27/06/2018': { series1: [7.3], series2: [] },
				'04/07/2018': { series1: [8.5], series2: [] },
				'18/07/2018': { series1: [8.7], series2: [] },
				'06/08/2018': { series1: [7.9], series2: [] },
				'07/09/2018': { series1: [8.101709637], series2: [] },
				'11/10/2018': { series1: [7.733922286], series2: [] },
				'17/11/2018': { series1: [6.369595248], series2: [] },
				'13/12/2018': { series1: [6.4], series2: [] },
				'14/01/2019': { series1: [6.497611036], series2: [] },
				'30/01/2019': { series1: [7.32421696], series2: [] },
				'26/02/2019': { series1: [6.048575575], series2: [] },
				'15/05/2019': { series1: [6.561534694], series2: [] }
			},
			lastResults: {
				'Weight (kg)': {
					date: '2019-05-15T00:00:00.000Z',
					valueCurrent: 81.3,
					valuePrev: 81,
					testId: '5ba11a07341d8f054170e4a1',
					testName: 'Anthropometry'
				},
				Chest: {
					date: '2019-05-15T00:00:00.000Z',
					valueCurrent: 5,
					valuePrev: 4,
					testId: '5ba11a07341d8f054170e4a1',
					testName: 'Anthropometry'
				},
				Axilla: {
					date: '2019-05-15T00:00:00.000Z',
					valueCurrent: 6,
					valuePrev: 5.8,
					testId: '5ba11a07341d8f054170e4a1',
					testName: 'Anthropometry'
				},
				Tricep: {
					date: '2019-05-15T00:00:00.000Z',
					valueCurrent: 6.4,
					valuePrev: 6.6,
					testId: '5ba11a07341d8f054170e4a1',
					testName: 'Anthropometry'
				},
				Subscapular: {
					date: '2019-05-15T00:00:00.000Z',
					valueCurrent: 8.8,
					valuePrev: 8.4,
					testId: '5ba11a07341d8f054170e4a1',
					testName: 'Anthropometry'
				},
				Abdominal: {
					date: '2019-05-15T00:00:00.000Z',
					valueCurrent: 11,
					valuePrev: 9.2,
					testId: '5ba11a07341d8f054170e4a1',
					testName: 'Anthropometry'
				},
				Suprailiac: {
					date: '2019-05-15T00:00:00.000Z',
					valueCurrent: 6.4,
					valuePrev: 6,
					testId: '5ba11a07341d8f054170e4a1',
					testName: 'Anthropometry'
				},
				Thight: {
					date: '2019-05-15T00:00:00.000Z',
					valueCurrent: 7,
					valuePrev: 7.4,
					testId: '5ba11a07341d8f054170e4a1',
					testName: 'Anthropometry'
				},
				'% BF': {
					date: '2019-05-15T00:00:00.000Z',
					valueCurrent: 6.561534694,
					valuePrev: 6.048575575,
					testId: '5ba11a07341d8f054170e4a1',
					testName: 'Anthropometry'
				},
				'Skinfold Sum': {
					date: '2019-05-15T00:00:00.000Z',
					valueCurrent: 50.6,
					valuePrev: 47.4,
					testId: '5ba11a07341d8f054170e4a1',
					testName: 'Anthropometry'
				},
				'Deep Squat': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 1,
					valuePrev: 2,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'Hurdle Step L': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 2,
					valuePrev: 3,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'Hurdle Step R': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 2,
					valuePrev: 3,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'In-line lunge L': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 2,
					valuePrev: 2,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'In-line lunge R': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 2,
					valuePrev: 2,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'Shoulder mobility L': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 2,
					valuePrev: 2,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'Shoulder mobility R': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 3,
					valuePrev: 2,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'Shoulder clearing L': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 0,
					valuePrev: 0,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'Shoulder clearing R': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 0,
					valuePrev: 0,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'Active straight leg raise L': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 3,
					valuePrev: 3,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'Active straight leg raise R': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 3,
					valuePrev: 3,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'Trunk stability push up': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 3,
					valuePrev: 3,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'Spinal extension clearing': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 0,
					valuePrev: 0,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'Rotary stability quadruped L': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 2,
					valuePrev: 2,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'Rotary stability quadruped R': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 2,
					valuePrev: 2,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'Spinal flexion clearing': {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 0,
					valuePrev: 0,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				TOTAL: {
					date: '2019-01-12T00:00:00.000Z',
					valueCurrent: 15,
					valuePrev: 17,
					testId: '5ba11a06341d8f054170e49c',
					testName: 'FMS'
				},
				'HT Right(cm) Arms Locked': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 26.515,
					valuePrev: 27.78,
					testId: '5ba11a06341d8f054170e498',
					testName: 'Single Leg Jump'
				},
				'P Right(W/kg) Arms Locked': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 39.731,
					valuePrev: 40.69,
					testId: '5ba11a06341d8f054170e498',
					testName: 'Single Leg Jump'
				},
				'HT Left(cm) Arms Locked': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 25.386,
					valuePrev: 27.44,
					testId: '5ba11a06341d8f054170e498',
					testName: 'Single Leg Jump'
				},
				'P Left(W/kg) Arms Locked': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 38.874,
					valuePrev: 40.43,
					testId: '5ba11a06341d8f054170e498',
					testName: 'Single Leg Jump'
				},
				'Diff % Height Right-Left Arms Locked': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 4.447333176,
					valuePrev: 1.27,
					testId: '5ba11a06341d8f054170e498',
					testName: 'Single Leg Jump'
				},
				'Diff % Power Right-Left Arms Locked': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 2.204558317,
					valuePrev: 0.66,
					testId: '5ba11a06341d8f054170e498',
					testName: 'Single Leg Jump'
				},
				'HT Right(cm) With Swing': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 34.836,
					valuePrev: 35.1,
					testId: '5ba11a06341d8f054170e498',
					testName: 'Single Leg Jump'
				},
				'P Right(W/kg) With Swing': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 46.044,
					valuePrev: 46.24,
					testId: '5ba11a06341d8f054170e498',
					testName: 'Single Leg Jump'
				},
				'HT Left(cm) With Swing': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 32.523,
					valuePrev: 32.52,
					testId: '5ba11a06341d8f054170e498',
					testName: 'Single Leg Jump'
				},
				'P Left(W/kg) With Swing': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 44.289,
					valuePrev: 44.29,
					testId: '5ba11a06341d8f054170e498',
					testName: 'Single Leg Jump'
				},
				'Diff % Power Right Swing-Locked': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 15.88935592,
					valuePrev: 13.64,
					testId: '5ba11a06341d8f054170e498',
					testName: 'Single Leg Jump'
				},
				'Diff % Power Left Swing-Locked': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 13.92961877,
					valuePrev: 9.55,
					testId: '5ba11a06341d8f054170e498',
					testName: 'Single Leg Jump'
				},
				'Diff % Height Right-Left Arms With Swing': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 7.111890047,
					valuePrev: 7.92,
					testId: '5ba11a06341d8f054170e498',
					testName: 'Single Leg Jump'
				},
				'Diff % Power Right-Left Arms With Swing': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 3.962609226,
					valuePrev: 4.41,
					testId: '5ba11a06341d8f054170e498',
					testName: 'Single Leg Jump'
				},
				'CMJ Arm Swing HT(cm)': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 59.743,
					valuePrev: 58.382,
					testId: '5ba11a06341d8f054170e499',
					testName: 'Counter Movement Jump'
				},
				'CMJ Arm Swing P(W/kg)': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 64.943,
					valuePrev: 63.91,
					testId: '5ba11a06341d8f054170e499',
					testName: 'Counter Movement Jump'
				},
				'CMJ Arm Locked HT(cm)': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 50.699,
					valuePrev: 51.332,
					testId: '5ba11a06341d8f054170e499',
					testName: 'Counter Movement Jump'
				},
				'CMJ Arm Locked P(W/kg)': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 58.08,
					valuePrev: 58.561,
					testId: '5ba11a06341d8f054170e499',
					testName: 'Counter Movement Jump'
				},
				'Diff % Height Swing-Locked': {
					date: '2019-01-09T00:00:00.000Z',
					valueCurrent: 17.83861615,
					valuePrev: 13.73412296,
					testId: '5ba11a06341d8f054170e499',
					testName: 'Counter Movement Jump'
				},
				'SJ Arm Swing HT(cm)': {
					date: '2018-07-26T00:00:00.000Z',
					valueCurrent: 58.213,
					valuePrev: null,
					testId: '5ba11a06341d8f054170e49a',
					testName: 'Squat Jump'
				},
				'SJ Arm Swing P(W/kg)': {
					date: '2018-07-26T00:00:00.000Z',
					valueCurrent: 63.7816125,
					valuePrev: null,
					testId: '5ba11a06341d8f054170e49a',
					testName: 'Squat Jump'
				},
				'SJ Arm Locked HT(cm)': {
					date: '2018-07-26T00:00:00.000Z',
					valueCurrent: 47.442,
					valuePrev: null,
					testId: '5ba11a06341d8f054170e49a',
					testName: 'Squat Jump'
				},
				'SJ Arm Locked P(W/kg)': {
					date: '2018-07-26T00:00:00.000Z',
					valueCurrent: 55.6091125,
					valuePrev: null,
					testId: '5ba11a06341d8f054170e49a',
					testName: 'Squat Jump'
				}
			}
		}
	];
};

module.exports.getPartiallyCorrectedDataFitness = function () {
	return [{ testsValues: {} }];
};

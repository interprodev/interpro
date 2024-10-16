const moment = require('moment');
const { isEmpty } = require('lodash');
const { ObjectID } = require('mongodb');

module.exports = function (Goscore) {
	Goscore.observe('before save', function (ctx, next) {
		if (ctx.instance && (!ctx.instance.dirty || ctx.instance.dirty === false)) {
			// console.log("Go score triggered");
			Goscore.app.models.Player.findById(
				ctx.instance.playerId,
				{
					include: {
						relation: 'team',
						scope: {
							fields: ['goSettings']
						}
					}
				},
				(err, player) => {
					if (err) console.error(err);
					else {
						const parsedPlayer = JSON.parse(JSON.stringify(player));
						const goScore = computeGoScore(ctx.instance, parsedPlayer.team.goSettings);
						ctx.instance.score = goScore;
						// check for goScoreNotification
						Goscore.app.models.Notification.checkForGoScoreFluctuation(ctx.instance, parsedPlayer);
						// console.log(ctx.currentInstance);
						next();
					}
				}
			);
		} else {
			console.error('Dirty or undefined ctx.instance');
			next();
		}
	});

	Goscore.checkForGoScore = async function (date, playerIds, teamId, wellnessToExclude, testInstanceToExclude) {
		try {
			console.log(`[GOSCORE] Checking GO Score for date ${date} and team ${teamId}`);
			const team = await Goscore.app.models.Team.findById(teamId);
			const { goSettings: settings } = team;
			const endDay = moment(date).endOf('day').toDate();
			const startDay = moment(date).startOf('day').toDate();

			for (const playerId of playerIds) {
				const player = await Goscore.app.models.Player.findById(playerId, {
					fields: { _id: 1, id: 1, _thresholdsTests: 1, displayName: 1 }
				});

				// check for wellness
				const wellnessSettings = settings.find(({ metricName, enabled }) => metricName === 'wellness' && enabled);

				// date = moment(date).startOf('day').toDate();
				let wellnessLinked = null;
				let innerScoreWellness = null;
				let testsScore = null;

				if (wellnessSettings) {
					wellnessLinked = await Goscore.app.models.Wellness.findOne({
						where: {
							playerId: ObjectID(playerId),
							date: { between: [startDay, endDay] }
						}
					});
					innerScoreWellness =
						wellnessLinked && String(wellnessLinked.id) !== wellnessToExclude
							? computeWellnessScore(wellnessLinked, wellnessSettings.weights)
							: null;
				}

				// check for test metrics
				const testSettings = settings.filter(({ metricName, enabled }) => metricName !== 'wellness' && enabled);
				if (!isEmpty(testSettings)) {
					let testInstancesLinked = await Goscore.app.models.TestInstance.find({
						where: {
							teamId: ObjectID(team.id),
							date: { between: [startDay, endDay] }
						},
						include: {
							relation: 'test',
							scope: {
								fields: ['id', 'name']
							}
						}
					});
					testInstancesLinked = JSON.parse(JSON.stringify(testInstancesLinked));
					const filtered = testInstancesLinked.filter(
						({ test }) => testSettings && testSettings.some(({ testName }) => testName === test.name)
					);
					const testExcludeId = !testInstanceToExclude ? null : String(testInstanceToExclude);
					const filtered2 = filtered.filter(
						({ id, _testResults }) =>
							id.toString() !== testExcludeId &&
							!isEmpty(_testResults) &&
							_testResults.some(result => String(result.playerId) === String(playerId))
					);
					let allResults = [];
					filtered2.forEach(({ _testResults }) => {
						if (!isEmpty(_testResults)) {
							const filteredRes = _testResults.filter(
								({ playerId: testResultPlayerId, results }) =>
									String(testResultPlayerId) === String(playerId) && (results || []).some(({ rawValue }) => rawValue)
							);
							if (!isEmpty(filteredRes)) {
								const [{ results }] = filteredRes;
								allResults = allResults.concat(results);
							}
						}
					});
					const playerTestThresholds = getTestsThresholds(player);
					if (isEmpty(playerTestThresholds)) {
						console.error(
							`[GOSCORE] Unable to update GO Score for player ${player.displayName}. Please check player test thresholds.`
						);
					} else {
						testsScore = !isEmpty(allResults)
							? computeTestInstanceScore(playerTestThresholds, allResults, testSettings)
							: null;
					}
				}

				// update or create go score
				let foundGoScore = await Goscore.findOne({
					where: {
						playerId: ObjectID(playerId),
						date: { between: [startDay, endDay] }
					}
				});
				if (
					(!wellnessLinked || wellnessToExclude) &&
					(!hasValuesForGoScoreTest(testsScore) || testInstanceToExclude) &&
					foundGoScore
				) {
					await foundGoScore.destroy();
				} else if (wellnessLinked || hasValuesForGoScoreTest(testsScore)) {
					let newGoScore = false;
					if (!foundGoScore) {
						newGoScore = true;
						foundGoScore = {
							date: startDay,
							playerId: ObjectID(playerId)
						};
					}
					foundGoScore.wellness = innerScoreWellness || null;
					for (const metric in testsScore) {
						foundGoScore[metric] = testsScore[metric];
					}
					if (newGoScore) foundGoScore = await Goscore.create(foundGoScore);
					else await foundGoScore.save();
				}
			}
		} catch (error) {
			console.error(error);
			throw error;
		}
	};
};

function hasValuesForGoScoreTest(testsScore) {
	for (const keyColumn in testsScore) {
		if (testsScore[keyColumn]) return true;
	}
	return false;
}

function isNan(n) {
	return isNaN(n) ? 0 : n;
}

function computeGoScore(instance, settings) {
	let score = null;
	let sumWeight = 0;
	for (const go of settings) {
		if (go.enabled && instance[go.metricName]) {
			sumWeight += go.weights.go_weight * (instance[go.metricName] ? 1 : 0);
		}
	}
	for (const go of settings) {
		if (instance[go.metricName]) {
			const _metricNorm = (go.weights.go_weight / sumWeight) * 100;
			const partialScore = isNan(go.enabled * ((_metricNorm * instance[go.metricName]) / 100));
			score += partialScore;
		}
	}
	return score !== null && score !== undefined ? Number(score).toFixed(1) : null;
}

function computeWellnessScore(wellness, weights) {
	const sleep = weights.sleep[wellness.wellness_sleep - 1] * wellness.wellness_sleep;
	const stress = weights.stress[wellness.wellness_stress - 1] * wellness.wellness_stress;
	const fatigue = weights.fatigue[wellness.wellness_fatigue - 1] * wellness.wellness_fatigue;
	const soreness = weights.soreness[wellness.wellness_soreness - 1] * wellness.wellness_soreness;
	const mood = weights.mood[wellness.wellness_mood - 1] * wellness.wellness_mood;
	return ((sleep + stress + fatigue + soreness + mood) * 100) / 25;
}

function computeTestInstanceScore(playerThresholds, allResults, goSettings) {
	// thre name === test metric colonna
	// go metricName colonna testname test
	const resultScore = {};
	for (const { metricName, testName, weights } of goSettings) {
		resultScore[metricName] = null;
		allResults.forEach(({ playerId }) => {
			const thrObj = playerThresholds.find(thr => {
				return (
					thr.name.toLowerCase() === testName.toLowerCase() && thr.metric.toLowerCase() === metricName.toLowerCase()
				);
			});
			const thresholdActiveValue = thrObj ? thrObj[thrObj.format] : null;
			const thrIntervals = thrObj?.intervals || 1;
			const valueRes = allResults.find(({ rawField }) => rawField === metricName);
			const value = valueRes?.rawValue || null;

			if (value) {
				if (thresholdActiveValue) {
					const percent = ((Number(value) - thresholdActiveValue) / thresholdActiveValue) * 100;
					let semaphore = null;
					if (Number(thrObj.semaphoreType) === 1) {
						semaphore = checkSemaphore1(percent, thrIntervals);
					} else if (Number(thrObj.semaphoreType) === 2) {
						semaphore = checkSemaphore2(percent, thrIntervals);
					} else if (Number(thrObj.semaphoreType) === 3) {
						semaphore = checkSemaphore3(percent, thrIntervals);
					}
					if (semaphore !== null) {
						resultScore[metricName] = 100 * weights.inner[semaphore];
					} else console.error('No semaphore for test instance column');
				}
			} else {
				console.error(`Empty test instance for player ${playerId}`);
			}
		});
	}
	return resultScore;
}

function checkSemaphore1(value, [min, max]) {
	if (value >= max) return 0;
	if (value < max && value > min) return 1;
	if (value < min) return 2;
}

function checkSemaphore2(value, [min, max]) {
	if (value <= min) return 0;
	if (value < max && value > min) return 1;
	if (value > max) return 2;
}

function checkSemaphore3(value, [negMax, negMin, min, max]) {
	if (value <= min && value >= negMin) return 0;
	if ((value < negMin && value >= negMax) || (value > min && value <= max)) return 1;
	if (value < negMax || value > max) return 2;
}

function getTestsThresholds(player) {
	if (player) {
		return player._thresholdsTests;
	} else {
		throw new Error('Player undefined!');
	}
}

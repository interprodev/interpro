const moment = require('moment');
const { InternalError } = require('../../common/modules/error');
const { omit, sortBy, meanBy, last, pick, groupBy } = require('lodash');
const { getThresholdsIntervalColor } = require('../../common/modules/thresholds-utils');
const ObjectID = require('mongodb').ObjectID;

const healthIcons = {
	notAvailable: 'fas fa-ambulance bordered-red',
	careful: 'fas fa-exclamation-triangle bordered-yellow',
	injury: 'fas fa-band-aid',
	complaint: 'fas fa-frown',
	illness: 'fas fa-thermometer-three-quarters',
	fit: ''
};

module.exports = function (Readiness) {
	Readiness.getPeriodReadiness = async function (teamId, playerId, from, to) {
		const datasetWrapper = {};
		const dataset = [];
		const { goSettings } = await Readiness.app.models.Team.findById(teamId);
		const testSettings = goSettings.filter(({ enabled, metricName }) => metricName !== 'wellness' && enabled);
		const emptyWrapper = getEmptyReadiness();
		const testFieldsMapping = {};
		const testsIncluded = [];
		const fieldsIncluded = [];
		for (const setting of testSettings) {
			const name = `${setting.testName}_${setting.metricName}`;
			emptyWrapper[name] = null;
			testFieldsMapping[setting.metricName] = name;
			fieldsIncluded.push(setting.metricName);
			testsIncluded.push(setting.testName);
		}

		const eventsPipeline = getPipelineEvents(teamId, playerId, from, to);
		const goscorePipeline = getPipelineGoscore(playerId, from, to);
		const wellnessPipeline = getPipelineWellness(playerId, from, to);
		const testsPipeline = getPipelineTests(teamId, [playerId], from, to, { fieldsIncluded, testsIncluded });

		const [resultEvents, resultGoScore, resultWellness, resultTests, injuries] = await Promise.all([
			Readiness.app.models.Event.getDataSource()
				.connector.collection(Readiness.app.models.Event.modelName)
				.aggregate(eventsPipeline)
				.toArray(),
			Readiness.app.models.GOScore.getDataSource()
				.connector.collection(Readiness.app.models.GOScore.modelName)
				.aggregate(goscorePipeline)
				.toArray(),
			Readiness.app.models.Wellness.getDataSource()
				.connector.collection(Readiness.app.models.Wellness.modelName)
				.aggregate(wellnessPipeline)
				.toArray(),
			Readiness.app.models.TestInstance.getDataSource()
				.connector.collection(Readiness.app.models.TestInstance.modelName)
				.aggregate(testsPipeline)
				.toArray(),
			Readiness.app.models.Injury.find({
				where: {
					playerId: ObjectID(playerId),
					date: { between: [from, to] }
				}
			})
		]);

		for (const event of JSON.parse(JSON.stringify(resultEvents))) {
			const date = moment(event.date, 'DD/MM/YYYY').format('DD/MM/YYYY');
			if (!(date in datasetWrapper)) {
				datasetWrapper[date] = Object.assign({}, emptyWrapper);
			}

			const sessions = event.sessionsPerDay;
			sessions.sort((d1, d2) => moment(d1.eventStart).toDate().getTime() - moment(d2.eventStart).toDate().getTime());
			const workload1 = sessions[0]?.workload || 0;
			const workload2 = sessions[1]?.workload || 0;

			datasetWrapper[date]['session0'] = workload1;
			datasetWrapper[date]['session1'] = workload2;
		}

		for (const goScore of JSON.parse(JSON.stringify(resultGoScore))) {
			const date = moment(goScore.date, 'DD/MM/YYYY').format('DD/MM/YYYY');
			if (!(date in datasetWrapper)) {
				datasetWrapper[date] = Object.assign({}, emptyWrapper);
			}

			datasetWrapper[date]['goscore'] = goScore.score;
		}

		for (const wellness of JSON.parse(JSON.stringify(resultWellness))) {
			const date = moment(wellness.date, 'DD/MM/YYYY').format('DD/MM/YYYY');
			if (!(date in datasetWrapper)) {
				datasetWrapper[date] = Object.assign({}, emptyWrapper);
			}

			datasetWrapper[date]['wellness_fatigue'] = wellness.wellness_fatigue;
			datasetWrapper[date]['wellness_mood'] = wellness.wellness_mood;
			datasetWrapper[date]['wellness_sleep'] = wellness.wellness_sleep;
			datasetWrapper[date]['wellness_soreness'] = wellness.wellness_soreness;
			datasetWrapper[date]['wellness_stress'] = wellness.wellness_stress;
			datasetWrapper[date]['sleep_hours'] = getHoursBetween(wellness);
		}

		for (const test of JSON.parse(JSON.stringify(resultTests))) {
			const date = moment(test.date).format('DD/MM/YYYY');
			if (!(date in datasetWrapper)) {
				datasetWrapper[date] = Object.assign({}, emptyWrapper);
			}
			const paramDataset =
				test.testResults?.rawField in testFieldsMapping ? testFieldsMapping[test.testResults?.rawField] : null;
			if (paramDataset) datasetWrapper[date][paramDataset] = Number(test.testResults?.rawValue);
		}

		for (const injury of injuries) {
			const date = moment(injury.date).format('DD/MM/YYYY');
			if (!(date in datasetWrapper)) {
				datasetWrapper[date] = Object.assign({}, emptyWrapper);
			}
			datasetWrapper[date]['injury'] = injury;
		}

		for (const keyObj in datasetWrapper) {
			const newObj = datasetWrapper[keyObj];
			newObj.label = keyObj;
			dataset.push(newObj);
		}

		return dataset;
	};

	Readiness.getTeamReadiness = async function (teamId, date) {
		try {
			console.log(`[READINESS] Getting readiness for team ${teamId} and date ${date}`);
			const seasons = await Readiness.app.models.TeamSeason.find({
				where: { teamId: ObjectID(teamId) }
			});
			const currentSeason = seasons.find(({ offseason, inseasonEnd }) =>
				moment(date).isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
			);
			if (!currentSeason) throw InternalError('No season found for this date');

			const { playerIds } = currentSeason;

			const testsFields = await getTestsFields(teamId, Readiness);
			const testInstances = await Readiness.app.models.TestInstance.getDataSource()
				.connector.collection(Readiness.app.models.TestInstance.modelName)
				.aggregate(getPipelineTests(teamId, playerIds, moment(date).subtract(6, 'day').toDate(), date, testsFields))
				.toArray();

			const players = await Readiness.app.models.Player.find(getQueryForTeamReadiness(playerIds, date));

			const active = players.filter(
				({ archived, archivedDate }) => !archived || moment(archivedDate).isAfter(moment(date))
			);

			return JSON.parse(JSON.stringify(active)).map(player => {
				const mappedInstances = getTestsInstances(testInstances, testsFields, player);
				return getPlayerReadiness(player, mappedInstances, date);
			});
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Readiness.getPlayerReadiness = async function (playerId, date) {
		try {
			const player = await Readiness.app.models.Player.findById(playerId, getQueryForPlayerReadiness(date));

			const testsFields = await getTestsFields(player.teamId, Readiness);
			const testInstances = await Readiness.app.models.TestInstance.getDataSource()
				.connector.collection(Readiness.app.models.TestInstance.modelName)
				.aggregate(
					getPipelineTests(player.teamId, [playerId], moment(date).subtract(6, 'day').toDate(), date, testsFields)
				)
				.toArray();
			const mappedInstances = getTestsInstances(testInstances, testsFields, player);

			return getPlayerReadiness(JSON.parse(JSON.stringify(player)), mappedInstances, date);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Readiness.getPlayerLatestReadiness = async function (playerId) {
		try {
			const player = await Readiness.app.models.Player.findById(playerId, getQueryForPlayerLatestReadiness());

			const testsFields = await getTestsFields(player.teamId, Readiness);
			const testInstances = await Readiness.app.models.TestInstance.getDataSource()
				.connector.collection(Readiness.app.models.TestInstance.modelName)
				.aggregate(getPipelineTests(player.teamId, [playerId], null, null, testsFields))
				.toArray();
			const mappedInstances = getTestsInstances(testInstances, testsFields, player);

			return wrapLastReadiness(player.wellnesses() || [], mappedInstances);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};
};

async function getTestsFields(teamId, Readiness) {
	const testsIncluded = [];
	const fieldsIncluded = [];
	const { goSettings } = await Readiness.app.models.Team.findById(teamId);
	const testSettings = goSettings.filter(({ enabled, metricName }) => metricName !== 'wellness' && enabled);
	for (const setting of testSettings) {
		testsIncluded.push(setting.testName);
		fieldsIncluded.push(setting.metricName);
	}
	return { testsIncluded, fieldsIncluded };
}

function getPipelineEvents(teamId, playerId, dateFrom, dateTo) {
	const matchStage = {
		$match: {
			teamId: ObjectID(teamId),
			format: { $in: ['game', 'friendly', 'training'] },
			start: { $gte: dateFrom, $lte: dateTo }
		}
	};
	const unwindStage = { $unwind: { path: '$playerIds', preserveNullAndEmptyArrays: true } };
	const matchStage2 = { $match: { playerIds: ObjectID(playerId) } };
	const projectStage = {
		$project: {
			dateSession: { $dateToString: { format: '%d/%m/%Y', date: '$start' } },
			sessionsFiltered: {
				$filter: {
					input: '$_sessionPlayers',
					as: 'item',
					cond: { $and: [{ $eq: ['$$item.mainSession', true] }, { $eq: ['$$item.playerId', ObjectID(playerId)] }] }
				}
			},
			dateOriginal: '$start'
		}
	};
	const projectStage2 = { $project: { dateSession: 1, 'sessionsFiltered.workload': 1, dateOriginal: 1 } };
	const addFieldsStage = {
		$addFields: {
			'sessionsFiltered.eventId': '$_id',
			'sessionsFiltered.eventStart': '$dateOriginal'
		}
	};
	const unwindStage2 = { $unwind: { path: '$sessionsFiltered', preserveNullAndEmptyArrays: false } };
	const groupStage = {
		$group: {
			_id: '$dateSession',
			sessionsPerDay: { $push: '$sessionsFiltered' },
			date: { $first: '$dateSession' }
		}
	};
	return [matchStage, unwindStage, matchStage2, projectStage, projectStage2, addFieldsStage, unwindStage2, groupStage];
}

function getPipelineGoscore(playerId, dateFrom, dateTo) {
	const matchStage = { $match: { playerId: ObjectID(playerId), date: { $gte: dateFrom, $lte: dateTo } } };
	const projectStage = {
		$project: {
			date: { $dateToString: { format: '%d/%m/%Y', date: '$date' } },
			score: 1
		}
	};
	return [matchStage, projectStage];
}

function getPipelineWellness(playerId, dateFrom, dateTo) {
	const matchStage = { $match: { playerId: ObjectID(playerId), date: { $gte: dateFrom, $lte: dateTo } } };
	const projectStage = {
		$project: {
			date: { $dateToString: { format: '%d/%m/%Y', date: '$date' } },
			wellness_sleep: 1,
			wellness_stress: 1,
			wellness_fatigue: 1,
			wellness_soreness: 1,
			wellness_mood: 1,
			sleep_start: 1,
			sleep_end: 1
		}
	};
	return [matchStage, projectStage];
}

function getPipelineTests(teamId, playerIds, dateFrom, dateTo, { fieldsIncluded, testsIncluded }) {
	const matchStage = {
		$match: {
			teamId: ObjectID(teamId)
		}
	};
	if (dateFrom && dateTo) {
		matchStage.$match = {
			...matchStage.$match,
			date: { $gte: moment(dateFrom).startOf('day').toDate(), $lte: moment(dateTo).endOf('day').toDate() }
		};
	}

	const collectiveStage = [matchStage];

	if (!dateFrom || !dateTo) {
		collectiveStage.push({ $sort: { date: -1 } });
		// collectiveStage.push({ $limit: 2 });
	}
	const lookupStage = {
		$lookup: {
			from: 'Test',
			localField: 'testId',
			foreignField: '_id',
			as: 'testModel'
		}
	};
	const unwindStage = {
		$unwind: '$testModel'
	};
	const matchStage2 = { $match: { 'testModel.name': { $in: testsIncluded } } };

	const projectStage = {
		$project: {
			_id: '$_id',
			date: '$date',
			name: '$testModel.name',
			results: {
				$filter: {
					input: '$_testResults',
					as: 'item',
					cond: {
						$in: ['$$item.playerId', playerIds.map(String)]
					}
				}
			}
		}
	};
	const unwindStage2 = { $unwind: '$results' };
	const projectStage2 = {
		$project: {
			_id: '$_id',
			date: '$date',
			name: '$name',
			testResults: {
				$filter: {
					input: '$results.results',
					as: 'item',
					cond: {
						$or: [{ $in: ['$$item.rawField', fieldsIncluded] }]
					}
				}
			}
		}
	};
	const sortStage = {
		$sort: { date: -1 }
	};
	const unwindStage3 = {
		$unwind: '$testResults'
	};

	return [
		...collectiveStage,
		lookupStage,
		unwindStage,
		matchStage2,
		projectStage,
		unwindStage2,
		projectStage2,
		sortStage,
		unwindStage3
	];
}

function getEmptyReadiness() {
	return {
		label: null,
		session0: null,
		session1: null,
		goscore: null,
		injury: null,
		wellness_fatigue: null,
		wellness_mood: null,
		wellness_sleep: null,
		wellness_soreness: null,
		wellness_stress: null,
		sleep_hours: null
	};
}

// TODO: change in pipeline
function getQueryForTeamReadiness(playerIds, date) {
	return {
		where: {
			_id: { inq: playerIds },
			or: [
				{ archived: false },
				{ and: [{ archived: true }, { archivedDate: { gt: moment(date).endOf('day').toDate() } }] }
			]
		},
		...getQueryForPlayerReadiness(date)
	};
}

function getQueryForPlayerReadiness(date) {
	return {
		include: getIncludeQuery(date),
		fields: getFieldsQuery()
	};
}

function getQueryForPlayerLatestReadiness() {
	return {
		include: getLatestInclude(),
		fields: getFieldsQuery()
	};
}

function getLatestInclude() {
	return [
		{
			relation: 'wellnesses',
			scope: {
				order: 'date DESC',
				limit: 2
			}
		}
	];
}

function getIncludeQuery(date) {
	return [
		{
			relation: 'goScores',
			scope: {
				where: {
					date: {
						gte: moment(date).startOf('day').subtract(13, 'day').toDate(),
						lte: moment(date).endOf('day').toDate()
					}
				},
				order: 'date DESC'
			}
		},
		{
			relation: 'injuries',
			scope: {
				where: {
					or: [{ endDate: null }, { endDate: { gte: moment(date).endOf('day').toDate() } }]
				},
				fields: {
					statusHistory: true,
					currentStatus: true,
					_injuryAssessments: true,
					issue: true,
					date: true,
					endDate: true,
					location: true,
					osics: true,
					chronicInjuryId: true,
					createdBy: true,
					admissionDate: true,
					system: true,
					anatomicalDetails: true,
					type: true,
					reinjury: true,
					category: true,
					contact: true,
					mechanism: true,
					occurrence: true,
					severity: true,
					expectedReturn: true,
					diagnosis: true,
					notes: true,
					surgery: true,
					surgeryNotes: true,
					treatInstruction: true
				}
			}
		},
		{
			relation: 'wellnesses',
			scope: {
				where: {
					date: {
						gte: moment(date).startOf('day').subtract(13, 'day').toDate(),
						lte: moment(date).endOf('day').toDate()
					}
				},
				order: 'date DESC'
			}
		}
	];
}

function getFieldsQuery() {
	return [
		'id',
		'teamId',
		'displayName',
		'downloadUrl',
		'position',
		'birthDate',
		'jersey',
		'nationality',
		'goScores',
		'wellnesses',
		'injuries',
		'_chronicInjuries',
		'_thresholdsTests'
	];
}

function getBodyChartInfo(player, locations) {
	return {
		injuries: sortBy([...player.injuries, ...getSorenessForBodyChart(locations)], 'date'),
		chronicInjuries: player._chronicInjuries
	};
}

function getSorenessForBodyChart(locations) {
	return (locations || []).map(zone => ({
		location: `medical.infirmary.details.location.${zone}`,
		issue: 'medical.infirmary.details.issue.soreness',
		currentStatus: 'medical.infirmary.details.statusList.soreness'
	}));
}

function getTestsInstances(testInstances, testFields, player) {
	const mapped = testInstances.map(test => ({
		date: test.date,
		test: test.name,
		label: test.testResults.rawField,
		value: test.testResults.rawValue
	}));
	const grouped = groupBy(mapped, 'label');
	const filtered = Object.entries(grouped)
		.map(entry => ({ [entry[0]]: entry[1].slice(0, 2) }))
		.reduce((a, b) => ({ ...a, ...b }), {});
	const aggregated = Object.values(filtered).map(series =>
		series.reduce(
			(acc, curr) => ({
				...acc,
				color: getColorReadiness(player, acc),
				increment: getDifferencePercentage(acc?.value, curr?.value || 0)
			}),
			{
				...series[0]
			}
		)
	);
	testFields.testsIncluded.forEach((test, index) => {
		if (!aggregated.map(({ test }) => test).includes(test)) {
			aggregated.push({
				date: null,
				test,
				label: testFields.fieldsIncluded[index],
				value: null,
				color: null,
				increment: '-'
			});
		}
	});
	return sortBy(aggregated, 'test');
}

function getPlayerReadiness(player, testInstances, currentDay) {
	const filteredInjuries = filterInjuries(player.injuries, currentDay);
	const score = getScoreAtDay(player.goScores, currentDay);
	const activeInjuries = (player.injuries || []).filter(
		({ currentStatus }) => currentStatus !== 'medical.infirmary.details.statusList.healed'
	);
	const flaredUp = getFlaredUp(player);
	const injuryIcon = getInjuryIcon(activeInjuries, currentDay);
	const availability = getAvailability(activeInjuries, currentDay);
	const expectation = getExpectation(availability);
	const scoreColor = getScoreColor(score, availability.available);
	const status = getScoreClass(availability.available, score);

	const filtered48h = getLastScoresForDays(player.goScores, currentDay, 2);
	const last48h = getMeanScore(filtered48h);
	const filtered7d = getLastScoresForDays(player.goScores, currentDay, 7);
	const last7d = getMeanScore(filtered7d);
	const wellness = getMappedWellnessAtDay(player.wellnesses, currentDay);

	return {
		...omit(player, ['goScores', 'injuries', '_chronicInjuries', 'wellnesses', '_thresholdsTests']),
		date: currentDay,
		status,
		goscore: {
			today: {
				value: score,
				color: scoreColor
			},
			last48h: {
				value: last48h,
				color: getScoreColor(last48h, availability.available),
				increment: getScoreIncrement(player.goScores, currentDay, 'score')
			},
			last7d: {
				value: last7d,
				color: getScoreColor(last7d, availability.available),
				increment: getDifferencePercentage(score, last7d)
			},
			injuryRisk: getInjuryRisk(scoreColor)
		},
		healthStatus: {
			injuries: filteredInjuries.map(injury => ({
				issue: injury.issue,
				chronic: !!injury.chronicInjuryId,
				icon: getInjuryIcon([injury], currentDay),
				location: injury.location,
				status: getInjuryStatusAtDay(injury, currentDay)
			})),
			available: availability.available,
			expectation,
			flaredUp,
			injuryIcon,
			color: getAvailabilityColor(availability.available)
		},
		wellness,
		readiness: testInstances,
		bodyChart: getBodyChartInfo(player, wellness.locations)
	};
}

function filterInjuries(injuries, currentDay) {
	return injuries.filter(
		({ date, endDate }) =>
			moment(date).startOf('day').isSameOrBefore(moment(currentDay).startOf('day')) &&
			(!endDate || (endDate && moment(endDate).startOf('day').isSameOrAfter(moment(currentDay).startOf('day'))))
	);
}

function getScoreClass(available, score) {
	if (available === 'no') return 'poor';
	if (score === null) return 'notMeasured';
	else if (score < 60) return 'poor';
	else if (score < 75) return 'moderate';
	else return 'optimal';
}

function getScoreColor(score, available = 'yes') {
	if (available === 'no') return 'red';
	if (score) {
		if (score < 60) return 'red';
		else if (score < 75) return 'yellow';
		else return 'green';
	} else {
		return 'grey';
	}
}

function getWellnessAtDay(wellnesses, currentDay) {
	return (wellnesses || []).find(({ date }) => moment(currentDay).startOf('day').isSame(moment(date), 'day'));
}

function getMappedWellnessAtDay(wellnesses, currentDay) {
	const wellness = getWellnessAtDay(wellnesses, currentDay);
	return {
		sleep: {
			value: wellness?.wellness_sleep || null,
			color: getColorWellness(wellness, 'wellness_sleep'),
			increment: getScoreIncrement(wellnesses, currentDay, 'wellness_sleep')
		},
		sleep_duration: getHoursBetween(wellness),
		...pick(wellness, ['sleep_end', 'sleep_start']),
		stress: {
			value: wellness?.wellness_stress || null,
			color: getColorWellness(wellness, 'wellness_stress'),
			increment: getScoreIncrement(wellnesses, currentDay, 'wellness_stress')
		},
		fatigue: {
			value: wellness?.wellness_fatigue || null,
			color: getColorWellness(wellness, 'wellness_fatigue'),
			increment: getScoreIncrement(wellnesses, currentDay, 'wellness_fatigue')
		},
		soreness: {
			value: wellness?.wellness_soreness || null,
			color: getColorWellness(wellness, 'wellness_soreness'),
			increment: getScoreIncrement(wellnesses, currentDay, 'wellness_soreness')
		},
		locations: wellness?.locations || [],
		mood: {
			value: wellness?.wellness_mood || null,
			color: getColorWellness(wellness, 'wellness_mood'),
			increment: getScoreIncrement(wellnesses, currentDay, 'wellness_mood')
		}
	};
}

function getScoreAtDay(goscores, currentDay) {
	return (
		Math.round(
			(goscores || []).find(({ date }) => moment(currentDay).startOf('day').isSame(moment(date), 'day'))?.score
		) || null
	);
}

function getScoreIncrement(values, currentDay, scoreField) {
	const today = (values || []).find(({ date }) => moment(currentDay).startOf('day').isSame(moment(date), 'day'));
	const yesterday = (values || []).find(({ date }) =>
		moment(currentDay).startOf('day').subtract(1, 'day').isSame(moment(date), 'day')
	);
	const twoDays = (values || []).find(({ date }) =>
		moment(currentDay).startOf('day').subtract(2, 'day').isSame(moment(date), 'day')
	);
	if (!today || !(yesterday || twoDays)) return '-';
	return getDifferencePercentage(today[scoreField], (yesterday || twoDays)[scoreField]);
}

function getDifferencePercentage(score1, score2) {
	const diff = score1 - score2;
	const ratio = (diff / (score1 || 100)) * 100;
	const signScore = ratio >= 0 ? '+' : '';
	return ratio === 0 ? '-' : signScore + Number(ratio).toFixed(0) + '%';
}

function getFlaredUp({ injuries, _chronicInjuries }) {
	return !!(injuries || []).find(
		({ currentStatus, chronicInjuryId }) =>
			currentStatus !== 'medical.infirmary.details.statusList.healed' &&
			(_chronicInjuries || []).map(({ id }) => id).includes(chronicInjuryId)
	);
}

function getAvailabilityColor(availability) {
	if (availability === 'yes') return 'green';
	if (availability === 'careful') return 'yellow';
	if (availability === 'no') return 'red';
}

function getInjuryIcon(injuries, period) {
	const status = getInjuryStatus(injuries, period);
	const icon = healthIcons[status];
	return icon;
}

function getInjuryStatus(injuries, period) {
	const { available } = getAvailability(injuries, period);
	if (available === 'no') return 'notAvailable';
	else if (available === 'careful') return 'careful';
	else return getIssueType(injuries);
}

function getAvailability(injuries, period) {
	let availability = { available: 'yes' };
	injuries.forEach(injury => {
		if (injury._injuryAssessments?.length > 0) {
			injury._injuryAssessments = sortBy(injury._injuryAssessments, 'date').reverse();
			const filteredAssessments = !period
				? injury._injuryAssessments
				: injury._injuryAssessments.filter(({ date }) => moment(date).isSameOrBefore(moment(period).endOf('day')));
			if (
				availability.available !== 'no' &&
				filteredAssessments[0] &&
				filteredAssessments[0].available !== 'yes' &&
				!moment().isSame(injury.endDate, 'day')
			) {
				availability = { ...filteredAssessments[0] };
			}
		}
	});
	return availability;
}

function getExpectation({ further, expectation }) {
	return further === true ? 'further' : expectation ? moment(expectation).format('DD/MM/YYYY') : null;
}

function getIssueType(injuries) {
	if (injuries.some(({ issue }) => issue === 'medical.infirmary.details.issue.injury')) return 'injury';
	if (injuries.some(({ issue }) => issue === 'medical.infirmary.details.issue.illness')) return 'illness';
	if (injuries.some(({ issue }) => issue === 'medical.infirmary.details.issue.complaint')) return 'complaint';
	return 'fit';
}

function getInjuryRisk(color) {
	switch (color) {
		case 'red':
			return 'High';
		case 'yellow':
			return 'Medium';
		case 'green':
			return 'Low';
		default:
			return '-';
	}
}

function getLastScoresForDays(goscores, currentDay, numOfDays) {
	return (goscores || []).filter(({ date }) =>
		moment(date).isBetween(
			moment(currentDay).startOf('day').subtract(numOfDays, 'days'),
			moment(currentDay).endOf('day')
		)
	);
}

function getMeanScore(goscores) {
	return Math.round(meanBy(goscores, 'score')) || null;
}

function getInjuryStatusAtDay({ currentStatus, statusHistory }, currentDay) {
	if (currentStatus !== 'medical.infirmary.details.statusList.healed') return currentStatus;
	else {
		return last(sortBy(statusHistory, 'date').filter(({ date }) => moment(currentDay).isAfter(date))).phase;
	}
}

function getColorWellness(wellness, key) {
	if (!wellness) return 'transparent';
	if (wellness[key] <= 2) return 'red';
	else if (wellness[key] === 3) return 'yellow';
	else return 'green';
}

function getHoursBetween({ sleep_start, sleep_end } = {}) {
	let sum = '-';
	if (sleep_start?.length > 0 && sleep_end?.length > 0) {
		const [startHours, startMinutes] = sleep_start.split(':').map(chunk => Number(chunk) - 0);
		const [endHours, endMinutes] = sleep_end.split(':').map(chunk => Number(chunk) - 0);

		let sleepHours = startHours > endHours ? 24 - startHours + endHours : endHours - startHours;
		if (startMinutes !== endMinutes) {
			const isReverseMin = startMinutes > endMinutes;
			const sleepMins = (isReverseMin ? 60 - startMinutes + endMinutes : endMinutes - startMinutes) % 60;
			if (isReverseMin) {
				sleepHours--;
			}
			sum = sleepHours.toFixed(0) + 'h ' + sleepMins.toFixed(0) + 'm';
		} else {
			sum = sleepHours.toFixed(0) + 'h';
		}
	}
	return sum;
}

function getColorReadiness({ _thresholdsTests }, { label, value }) {
	const threshold = _thresholdsTests.find(({ metric }) => metric === label);
	return getThresholdsIntervalColor(value, threshold);
}

function wrapLastReadiness(wellnesses, testInstances) {
	const currentDay = wellnesses[0]?.date;
	return {
		currentDay,
		...getMappedWellnessAtDay(wellnesses, currentDay),
		readiness: testInstances
	};
}

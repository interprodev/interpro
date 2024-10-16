const moment = require('moment');
const { ObjectID } = require('mongodb');
const { flatten, groupBy, union, sortBy, uniqBy } = require('lodash');

module.exports = function (Test) {
	Test.graphComparison = async function (teamId, testModelId, date, metrics, playerIds) {
		try {
			console.log(`[TEST] Getting comparison data for team ${teamId} and test ${testModelId}...`);
			const testInstanceCollection = Test.app.models.TestInstance.getDataSource().connector.collection(
				Test.app.models.TestInstance.modelName
			);
			const response = [];
			playerIds = playerIds.map(x => ObjectID(x));
			const allPlayers = await Test.app.models.Player.find({ where: { id: { inq: playerIds } } });
			playerIds = playerIds.filter(plId => !isPlayerArchivedForDate(allPlayers, plId, date));
			if (metrics && metrics.length > 0) {
				const pipelineGraphComparison = getPipelineGraphComparison(teamId, testModelId, date, metrics, playerIds);

				const resultData = await testInstanceCollection.aggregate(pipelineGraphComparison).toArray();
				const playerIdsMapped = playerIds.map(x => x.toString());
				const filteredData = resultData.filter(x => playerIdsMapped.indexOf(x._id.toString()) !== -1);
				const mapping = {};
				metrics.forEach((element, index) => {
					mapping[element.toLowerCase()] = index;
				});
				for (const filterElem of filteredData) {
					const objPlayer = { label: filterElem._id };
					for (const val of metrics) {
						const valueMetric = filterElem.results.find(x => x.rawField.toLowerCase() === val.toLowerCase());
						const indexForMetric = mapping[val.toLowerCase()];
						const seriesProp = 'series' + indexForMetric;
						objPlayer[seriesProp] = valueMetric && valueMetric.rawValue ? Number(valueMetric.rawValue) : 0;
					}
					response.push(objPlayer);
				}
				for (const pl of playerIds) {
					if (!response.find(ob => ob.label.toString() === pl.toString())) {
						const objPlayerEmpty = { label: pl, series0: 0 };
						if (metrics.length > 1) objPlayerEmpty['series1'] = 0;
						response.push(objPlayerEmpty);
					}
				}
			}

			return response;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Test.graphTrend = async function (
		teamId,
		testModelId1,
		metrics1,
		testModelId2,
		metrics2,
		dateFrom,
		dateTo,
		playerIds
	) {
		try {
			console.log(`[TEST] Getting trend data for team ${teamId} and tests ${testModelId1} and ${testModelId2}...`);
			const testInstanceCollection = Test.app.models.TestInstance.getDataSource().connector.collection(
				Test.app.models.TestInstance.modelName
			);
			let response = [];

			if (playerIds.length > 0 && testModelId1 && metrics1 && metrics1.length > 0) {
				const promise$ = [
					testInstanceCollection
						.aggregate(getPipelineGraphTrend(testModelId1, metrics1, dateFrom, dateTo, playerIds))
						.toArray()
				];
				if (testModelId2 && metrics2 && metrics2.length > 0) {
					promise$.push(
						testInstanceCollection
							.aggregate(getPipelineGraphTrend(testModelId2, metrics2, dateFrom, dateTo, playerIds))
							.toArray()
					);
				}

				const results = flatten(await Promise.all(promise$));
				const grouped = Object.entries(groupBy(results, 'dateString'))
					.map(([key, value]) => {
						const flattened = flatten(
							flatten(value.map(({ _testResults }) => _testResults)).map(({ playerId, results }) =>
								results.map(res => ({ ...res, playerId }))
							)
						);
						const filtered = flattened.filter(
							({ rawField, rawValue }) => [...metrics1, ...metrics2].includes(rawField) && rawValue && rawValue !== ''
						);
						return {
							_id: key,
							results: filtered
						};
					})
					.filter(({ results }) => results.length > 0);
				const resultTotal = grouped.reduce((obj, item) => Object.assign(obj, { [item._id]: item.results }), {});
				const metricsMapping = [...metrics1, ...metrics2].map((item, index) => ({
					metricName: item.toLowerCase(),
					index: index
				}));

				response = sortBy(
					Object.entries(resultTotal).map(([keyDate, values]) => {
						const object = values.reduce((obj, item) => reduceValueForTestMap(obj, item, metricsMapping), {});
						return {
							label: moment(keyDate, 'DD/MM/YYYY').toDate(),
							...object
						};
					}),
					'label'
				);
			}

			// Wrapping data for chart
			const chart = {};
			playerIds.forEach(playerId => {
				response.forEach(istance => {
					Object.keys(istance).forEach(key => {
						if (key.includes(playerId)) {
							chart[key] = { [moment(istance.label).format('DD/MM/YYYY')]: istance[key], ...chart[key] };
						}
					});
				});
			});

			// Wrapping data for table
			const table = [];
			playerIds.forEach(playerId => {
				const row = { playerId };
				response.forEach(istance => {
					const playerKeys = Object.keys(istance).filter(key => key.includes(playerId));
					playerKeys.forEach(key => {
						const metricIndex = key.split('_')[1];
						row[moment(istance.label).format('DD/MM/YYYY')] = {
							[metricIndex]: istance[key],
							...row[istance.label]
						};
					});
					table.push(row);
				});
			});
			// Filling table data for undefined values
			const labels = response.map(({ label }) => moment(label).format('DD/MM/YYYY'));
			const completeTable = table.map(row =>
				union(labels, Object.keys(row)).reduce((acc, key) => ({ ...acc, [key]: row[key] || {} }), {})
			);
			const completeChart = Object.entries(chart).reduce(
				(acc, [key, value]) => ({
					...acc,
					[key]: labels.reduce((acc, label) => ({ ...acc, [label]: value[label] || null }), {})
				}),
				{}
			);

			return { chart: completeChart, table: uniqBy(completeTable, 'playerId') };
		} catch (e) {
			console.error(e);
			throw e;
		}
	};
};

function reduceValueForTestMap(obj, { playerId, rawField, rawValue }, metricsMapping) {
	return Object.assign(obj, {
		[`${playerId}_${metricsMapping.find(({ metricName }) => metricName === rawField.toLowerCase()).index}`]: rawValue
			? Number(rawValue)
			: 0
	});
}

function isPlayerArchivedForDate(players, playerId, date) {
	for (const player of players) {
		if (
			player.id.toString() === playerId.toString() &&
			player.archived &&
			moment(player.archivedDate).isBefore(moment(date), 'days')
		) {
			return true;
		}
	}
	return false;
}

function getPipelineGraphTrend(testModelId, metrics, dateFrom, dateTo, playerIds) {
	const dateStart = moment(dateFrom).startOf('day').toDate();
	const dateEnd = moment(dateTo).endOf('day').toDate();
	const pipelineStages = [];
	const matchStage = {
		$match: {
			testId: ObjectID(testModelId),
			date: { $gte: dateStart, $lte: dateEnd },
			_testResults: { $exists: true }
		}
	};
	const projectStage = {
		$project: {
			dateString: { $dateToString: { format: '%d/%m/%Y', date: '$date' } },
			_testResults: {
				$filter: {
					input: '$_testResults',
					as: 'item',
					cond: { $in: ['$$item.playerId', playerIds.map(id => String(id))] }
				}
			}
		}
	};

	pipelineStages.push(matchStage);
	pipelineStages.push(projectStage);
	return pipelineStages;
}

function getPipelineGraphComparison(teamId, testModelId, date, metrics, playerIds) {
	const dayStart = moment(date).startOf('day').toDate();
	const dayEnd = moment(date).endOf('day').toDate();
	const pipelineStages = [];
	const matchStage = {
		$match: {
			testId: ObjectID(testModelId),
			date: { $gte: dayStart, $lte: dayEnd },
			_testResults: { $exists: true }
		}
	};

	const unwindStage = { $unwind: '$_testResults' };
	const groupStage = { $group: { _id: '$_testResults.playerId', results: { $push: '$_testResults.results' } } };

	const unwindStage2 = { $unwind: '$results' };
	const unwindStage3 = { $unwind: '$results' };
	const matchStage2 = {
		$match: {
			'results.rawField': { $in: metrics }
		}
	};
	const groupStage2 = { $group: { _id: '$_id', results: { $push: '$results' } } };

	pipelineStages.push(matchStage);
	pipelineStages.push(unwindStage);
	pipelineStages.push(groupStage);
	pipelineStages.push(unwindStage2);
	pipelineStages.push(unwindStage3);
	pipelineStages.push(matchStage2);
	pipelineStages.push(groupStage2);
	return pipelineStages;
}

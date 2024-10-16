const { ObjectID } = require('mongodb');
const { each, flatten, forOwn, groupBy, map, meanBy, omit, reduce } = require('lodash');
const { BadRequestError, InternalError, EventError } = require('../modules/error');
const moment = require('moment/moment');

module.exports = function (Drill) {
	Drill.validatesUniquenessOf('identifier', { message: 'drills.errors.nameAlreadyTaken' });

	Drill.getDrillProfile = async function (drillId, teamId, customerId) {
		try {
			console.log(`[Drill.getDrillProfile] Getting Drill ${drillId} profile for team ${teamId}...`);
			const eventCollection = Drill.app.models.Event.getDataSource().connector.collection(
				Drill.app.models.Event.modelName
			);
			const [teamSettings, team] = await Promise.all([
				Drill.app.models.CustomerTeamSettings.findOne({
					where: { customerId: ObjectID(customerId), teamId: ObjectID(teamId) }
				}),
				Drill.app.models.Team.findById(teamId, { fields: { _gpsProviderMapping: 1 } })
			]);
			if (!teamSettings || !team) {
				throw BadRequestError('Bad Request: missing parameters');
			} else {
				/*  */
				const mappings = getMetricsMapping(team._gpsProviderMapping);
				const metrics = teamSettings.metricsPerformance.splice(0, 6);
				const pipeline = pipelineForDrillProfile(drillId, teamId, metrics);
				let sessions;
				try {
					sessions = await eventCollection.aggregate(pipeline).toArray();
				} catch (error) {
					throw InternalError(error);
				}
				sessions = await Drill.computeThresholdsPercentage(sessions, metrics);
				const { average, len } = getProfileData(sessions, metrics);
				const result = {
					id: drillId,
					num_splits: len,
					perc: {
						...mapMetricNameWithLabel(average.perc, mappings)
					},
					abs: {
						...mapMetricNameWithLabel(average.abs, mappings)
					}
				};
				return result;
			}
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Drill.computeThresholdsPercentage = async function (sessions, metrics) {
		const thresholds = {};
		for (const session of sessions) {
			session.perc = {};
			let playerThreshold;
			if (!thresholds[session.playerId]) {
				playerThreshold = await Drill.getPlayerThreshold(session.playerId, metrics);
			}
			if (playerThreshold) {
				thresholds[session.playerId] = playerThreshold;
				metrics.forEach(metric => {
					let threshold = thresholds[session.playerId].find(({ name }) => name === metric);
					if (!threshold) {
						threshold = { customValue: 1, format: 'customValue' };
					} else {
						const activeValue = threshold[threshold.format];
						if (!activeValue || isNaN(activeValue)) {
							threshold[threshold.format] = 1;
						}
					}
					session.perc[metric] = (session.abs[metric] / (threshold[threshold.format] || 1)) * 100;
				});
			}
		}
		return sessions;
	};

	Drill.getPlayerThreshold = async function (playerId, metrics) {
		if (!playerId) {
			throw new Error('Player id undefined!');
		}
		const player = await Drill.app.models.Player.findById(playerId, { fields: { _thresholds: 1 } });
		if (!player) {
			console.error(`${playerId}: Player not found!`);
			return null;
		} else {
			const thresholdsObj = Drill.app.models.Player.getThresholdArrayForExactGdType(player, 'GD');
			return thresholdsObj ? (thresholdsObj.thresholds || []).filter(({ name }) => metrics.includes(name)) : [];
		}
	};

	Drill.getDrillStatsComparison = async function (teamId, drillsIds, startDate, endDate, gpsSessionLoaded, metric) {
		try {
			console.log(`[DRILL] Getting DrillStatsComparison for team ${teamId}...`);
			const eventCollection = Drill.app.models.Event.getDataSource().connector.collection(
				Drill.app.models.Event.modelName
			);
			const allAttributes = await getAllAttributes(Drill, teamId);
			const pipeline = pipelineForDrillInstances(drillsIds, teamId, startDate, endDate, gpsSessionLoaded);
			let result = {};
			const { drillIdField, drillDurationMinField } = getDrillFields(gpsSessionLoaded);
			try {
				const drillInstances = await eventCollection.aggregate(pipeline).toArray();
				const { result: drillsWithParticipants } = getDrillsWithParticipants(
					drillInstances,
					drillsIds,
					[],
					gpsSessionLoaded
				);
				const { mapped, numSessionsMin, numSessions, numDrillsMin } = await getComparisonMappedResults(
					Drill,
					metric,
					drillsWithParticipants,
					drillIdField,
					drillDurationMinField,
					allAttributes
				);
				result = {
					metric,
					numSessions: numSessions,
					numSessionsMin: Number(numSessionsMin.toFixed()),
					numDrills: drillsWithParticipants.length,
					numDrillsMin: Number(numDrillsMin.toFixed()),
					numSessionMinPercentage: numDrillsMin > 0 ? Number(((numDrillsMin / numSessionsMin) * 100).toFixed()) : 0, // numSessionMinToDrillsMin
					results: mapped
				};
			} catch (error) {
				throw InternalError(error);
			}
			return result;
		} catch (e) {
			throw EventError(e);
		}
	};

	Drill.getDrillStatsTrend = async function (
		teamId,
		drillsIds,
		startDate,
		endDate,
		gpsSessionLoaded,
		metric,
		playersIds
	) {
		try {
			console.log(`[DRILL] Getting getDrillStatsTrend for team ${teamId}...`);
			const eventCollection = Drill.app.models.Event.getDataSource().connector.collection(
				Drill.app.models.Event.modelName
			);
			const allAttributes = await getAllAttributes(Drill, teamId);
			const pipeline = pipelineForDrillInstances(drillsIds, teamId, startDate, endDate, gpsSessionLoaded);
			let result = {};
			const { drillIdField, drillDurationMinField } = getDrillFields(gpsSessionLoaded);
			try {
				const drillInstances = await eventCollection.aggregate(pipeline).toArray();
				const { result: drillsWithParticipants } = getDrillsWithParticipants(
					drillInstances,
					drillsIds,
					playersIds,
					gpsSessionLoaded
				);
				const { mapped, numSessionsMin, numSessions, numDrillsMin } = await getTrendMappedResults(
					Drill,
					startDate,
					endDate,
					metric,
					drillsWithParticipants,
					drillIdField,
					drillDurationMinField,
					allAttributes
				);
				result = {
					metric,
					numSessions: numSessions,
					numSessionsMin: Number(numSessionsMin.toFixed()),
					numDrills: drillsWithParticipants.length,
					numDrillsMin: Number(numDrillsMin.toFixed()),
					numSessionMinPercentage: numDrillsMin > 0 ? Number(((numDrillsMin / numSessionsMin) * 100).toFixed()) : 0, // numSessionMinToDrillsMin
					results: mapped
				};
			} catch (error) {
				throw InternalError(error);
			}
			return result;
		} catch (e) {
			throw EventError(e);
		}
	};
};

function getDrillFields(gpsSessionLoaded) {
	const drillIdField = gpsSessionLoaded ? 'drillId' : 'drillsId';
	const drillDurationMinField = gpsSessionLoaded ? 'duration' : 'durationMin';
	return { drillIdField, drillDurationMinField };
}
async function getAllAttributes(Drill, teamId) {
	try {
		const { playerAttributes } = await Drill.app.models.TeamSeason.findOne({
			where: {
				teamId,
				offseason: { lte: moment().toDate() },
				inseasonEnd: { gte: moment().toDate() }
			},
			fields: ['playerAttributes', 'name', '_id']
		});
		return (playerAttributes || []).filter(({ category }) => category !== 'attitude');
	} catch (e) {
		throw EventError(e);
	}
}

function getSessionValues(drillsWithParticipants) {
	let numSessions = 0;
	let numSessionsMin = 0;
	const groupedByEventMap = Object.values(groupBy(drillsWithParticipants, 'eventId'));
	numSessions += groupedByEventMap.length;
	for (const items of [...groupedByEventMap]) {
		numSessionsMin += items[0].eventDuration ? Number(items[0].eventDuration) : 0;
	}
	return { numSessions, numSessionsMin };
}

async function getComparisonMappedResults(
	Drill,
	metric,
	drillsWithParticipants,
	drillIdField,
	drillDurationMinField,
	allAttributes
) {
	const { numSessions, numSessionsMin } = getSessionValues(drillsWithParticipants);
	let numDrillsMin = 0;
	const mapped = {};
	try {
		for (const item of drillsWithParticipants) {
			const drillTemplate = await Drill.findById(item[drillIdField]);
			numDrillsMin += item[drillDurationMinField]
				? Number(item[drillDurationMinField])
				: drillTemplate.duration
				? drillTemplate.duration
				: 0;
			for (let playerId of item.participantsIds) {
				playerId = String(playerId);
				const record = getMetricValue(
					metric,
					drillTemplate,
					item,
					mapped[playerId] ? mapped[playerId] : [],
					allAttributes,
					drillDurationMinField
				);
				mapped[playerId] = record;
			}
		}
		Object.keys(mapped).forEach(key => {
			const totalForPlayer = getTotalForPlayer(mapped[key]);
			mapped[key] = mapped[key].map(item => {
				return {
					...item,
					percentage: ((item.value / totalForPlayer) * 100).toFixed(2)
				};
			});
		});
	} catch (e) {
		throw EventError(e);
	}
	return { mapped, numSessionsMin, numSessions, numDrillsMin };
}

function getTotalForPlayer(playerItem) {
	let totalForPlayer = 0;
	Object.keys(playerItem).forEach(key => {
		totalForPlayer += playerItem[key].value;
	});
	return totalForPlayer;
}

async function getTrendMappedResults(
	Drill,
	startDate,
	endDate,
	metric,
	drillsWithParticipants,
	drillIdField,
	drillDurationMinField,
	allAttributes
) {
	const mapped = {};
	const { numSessions, numSessionsMin } = getSessionValues(drillsWithParticipants);
	let numDrillsMin = 0;
	try {
		const dates = Array.from(moment.range(moment(startDate).startOf('day'), moment(endDate).startOf('day')).by('days'));
		for (const date of dates) {
			const instancesForDate = drillsWithParticipants.filter(({ eventStart }) => {
				const eventStartDate = moment(eventStart).startOf('day').format('L');
				return date.isSame(moment(eventStartDate));
			});
			if (instancesForDate.length > 0) {
				const records = [];
				for (const item of instancesForDate) {
					const drillTemplate = await Drill.findById(item[drillIdField]);
					numDrillsMin += item[drillDurationMinField]
						? Number(item[drillDurationMinField])
						: drillTemplate.duration
						? drillTemplate.duration
						: 0;
					records[date] = getMetricValue(
						metric,
						drillTemplate,
						item,
						records[date] ? records[date] : [],
						allAttributes,
						drillDurationMinField
					);
				}
				const elementsForDate = [];
				Object.keys(records).forEach(key => ({
					...records[key].forEach(item =>
						elementsForDate.push({
							...item,
							value: item.value / item.counter
						})
					)
				}));
				let totalForDate = 0;
				elementsForDate.forEach(item => {
					totalForDate += item.value;
				});
				elementsForDate.forEach(item => {
					item.percentage = ((item.value / totalForDate) * 100).toFixed(2);
				});
				mapped[moment(date).format('DD/MM/YYYY')] = elementsForDate;
			} else {
				mapped[moment(date).format('DD/MM/YYYY')] = null;
			}
		}
		return { mapped, numSessionsMin, numSessions, numDrillsMin };
	} catch (e) {
		throw EventError(e);
	}
}

function getDrillsWithParticipants(drillInstances, inputDrillIds, inputPlayersIds, gpsSessionLoaded) {
	const result = [];
	const drillsWithParticipants = gpsSessionLoaded
		? drillInstances.map(({ _drillsExecuted, start, duration, _id }) =>
				_drillsExecuted
					.filter(
						({ drillId, participantsIds }) =>
							inputDrillIds.includes(drillId) &&
							(inputPlayersIds.length === 0 || (participantsIds || []).find(id => inputPlayersIds.includes(String(id))))
					)
					.map(a => ({ ...a, eventId: _id, eventStart: start, eventDuration: duration }))
		  )
		: drillInstances.map(({ _drills, _id, start, duration, playerIds }) =>
				_drills
					.filter(({ drillsId }) => inputDrillIds.includes(drillsId))
					.map(a => ({ ...a, eventId: _id, eventStart: start, eventPlayerIds: playerIds, eventDuration: duration }))
		  );
	for (const item of drillsWithParticipants) {
		for (const row of item) {
			const playerIds =
				row.participantsIds && row.participantsIds.length > 0 ? row.participantsIds : row.eventPlayerIds;
			if (playerIds && playerIds.length > 0) {
				result.push({ ...row, participantsIds: playerIds });
			}
		}
	}
	return { result };
}

function getMetricValue(metric, drill, drillInstance, playerItem, allAttributes, drillDurationMinField) {
	let itemKeys, itemValue, isArray;
	const defGoals = allAttributes.filter(({ category }) => category !== 'offensive').map(({ value }) => value);
	const attGoals = allAttributes.filter(({ category }) => category === 'offensive').map(({ value }) => value);
	const goals = [
		...(drill.technicalGoals || []).filter(goal => defGoals.includes(goal)),
		...(drill.technicalGoals || []).filter(goal => attGoals.includes(goal)),
		...(drill.tacticalGoals || [])
	];
	switch (metric) {
		case 'themeMins':
			itemKeys = [drill?.theme ? drill.theme : 'noTheme'];
			itemValue = drillInstance[drillDurationMinField] ? drillInstance[drillDurationMinField] : 0;
			break;
		case 'themeNumber':
			itemKeys = [drill?.theme ? drill.theme : 'noTheme'];
			itemValue = 1;
			break;
		case 'goalMins':
			itemKeys = goals;
			itemValue = drillInstance[drillDurationMinField] ? drillInstance[drillDurationMinField] : 0;
			isArray = true;
			break;
		case 'goalNumber':
			itemKeys = goals;
			itemValue = 1;
			isArray = true;
			break;
		case 'techinicalDEFMins':
			itemKeys = (drill.technicalGoals || []).filter(goal => defGoals.includes(goal));
			itemValue = drillInstance[drillDurationMinField] ? drillInstance[drillDurationMinField] : 0;
			isArray = true;
			break;
		case 'techinicalDEFNumber':
			itemKeys = (drill.technicalGoals || []).filter(goal => defGoals.includes(goal));
			itemValue = 1;
			isArray = true;
			break;
		case 'techinicalATTMins':
			itemKeys = (drill.technicalGoals || []).filter(goal => attGoals.includes(goal));
			itemValue = drillInstance[drillDurationMinField] ? drillInstance[drillDurationMinField] : 0;
			isArray = true;
			break;
		case 'techinicalATTNumber':
			itemKeys = (drill.technicalGoals || []).filter(goal => attGoals.includes(goal));
			itemValue = 1;
			isArray = true;
			break;
		case 'tacticalMins':
			itemKeys = drill.tacticalGoals;
			itemValue = drillInstance[drillDurationMinField] ? drillInstance[drillDurationMinField] : 0;
			isArray = true;
			break;
		case 'tacticalNumber':
			itemKeys = drill.tacticalGoals;
			itemValue = 1;
			isArray = true;
			break;
		case 'physicalMins':
			itemKeys = drill.physicalGoals;
			itemValue = drillInstance[drillDurationMinField] ? drillInstance[drillDurationMinField] : 0;
			isArray = true;
			break;
		case 'physicalNumber':
			itemKeys = drill.physicalGoals;
			itemValue = 1;
			isArray = true;
			break;
		default:
			throw BadRequestError('Bad Request: metric not allowed');
	}
	if (!itemKeys || itemKeys.length === 0) return playerItem;
	for (const itemKey of itemKeys) {
		const metricFound = playerItem.find(({ key }) => (!isArray ? key === itemKey : key.includes(itemKey)));
		if (!metricFound) {
			playerItem.push({
				key: itemKey,
				value: Number(itemValue),
				counter: 1
			});
		} else {
			playerItem = playerItem.map(item => {
				if (item.key && item.key === itemKey) {
					return {
						...item,
						value: item.value + Number(itemValue),
						counter: item.counter + 1
					};
				}
				return item;
			});
		}
	}
	return playerItem;
}

function getMetricsMapping(gpsProviderMapping) {
	return reduce(
		[
			...gpsProviderMapping.rawMetrics.map(({ name, label }) => ({ name, label })),
			...gpsProviderMapping._gpsMetricsMapping.map(({ columnName, columnLabel }) => ({
				name: columnName,
				label: columnLabel
			}))
		],
		(acc, { name, label }) => ({ ...acc, [name]: label }),
		{}
	);
}

function mapMetricNameWithLabel(object, mappings) {
	each(object, function (value, key) {
		key = mappings[key] || key;
		object[key] = value;
	});
	return omit(object, Object.keys(mappings));
}

function getProfileData(sessions, metrics) {
	const teamAverageForSplit = getTeamAverageForSplit(sessions, metrics);
	const average = getAverage(teamAverageForSplit, metrics);
	return { average, len: teamAverageForSplit.length };
}

function getTeamAverageForSplit(sessions, metrics) {
	const groupedByEventAndSplit = forOwn(
		groupBy(sessions, 'eventId'),
		(value, key, obj) => (obj[key] = groupBy(obj[key], 'splitName'))
	);
	const teamAverageForEventAndSplit = flatten(
		map(groupedByEventAndSplit, value => map(value, sessions => getAverage(sessions, metrics)))
	);
	return teamAverageForEventAndSplit;
}

function getAverage(sessions, metrics) {
	const reduced = {
		abs: {},
		perc: {}
	};
	metrics.forEach(x => {
		reduced.abs[x] = meanBy(
			sessions.map(({ abs }) => abs).filter(x => x),
			x
		);
		reduced.perc[x] =
			meanBy(
				sessions.map(({ perc }) => perc).filter(x => x),
				x
			) || 0;
	});
	return reduced;
}

function pipelineForDrillProfile(drillId, teamId, metrics) {
	const matchStage = {
		$match: {
			teamId: ObjectID(teamId),
			format: { $in: ['game', 'friendly', 'training'] },
			'_sessionPlayers.0': { $exists: true }
		}
	};
	const unwindStage = { $unwind: { path: '$_sessionPlayers', preserveNullAndEmptyArrays: true } };
	const matchStage2 = { $match: { '_sessionPlayers.drillId': drillId } };

	const projectStage = {
		$project: {
			eventId: '$_id',
			drillId: '$_sessionPlayers.drillId',
			playerId: '$_sessionPlayers.playerId',
			splitName: '$_sessionPlayers.splitName',
			abs: {}
		}
	};

	for (const m of metrics) {
		projectStage['$project']['abs'][m] = '$_sessionPlayers.' + m;
	}

	const stages = [matchStage, unwindStage, matchStage2, projectStage];

	return stages;
}

function pipelineForDrillInstances(drillIds, teamId, startDate, endDate, gpsSessionLoaded) {
	const field = gpsSessionLoaded ? '_drillsExecuted' : '_drills';
	const matchStageExecuted = {
		$match: {
			teamId: ObjectID(teamId),
			'_drillsExecuted.0': { $exists: true },
			gpsSessionLoaded: gpsSessionLoaded,
			start: { $gte: moment(startDate).toDate(), $lte: moment(endDate).toDate() }
		}
	};
	const matchStagePlanned = {
		$match: {
			teamId: ObjectID(teamId),
			'_drills.0': { $exists: true },
			start: { $gte: moment(startDate).toDate(), $lte: moment(endDate).toDate() }
		}
	};
	const unwindStage = { $unwind: { path: `$_${field}`, preserveNullAndEmptyArrays: true } };
	const matchStage2Executed = {
		$match: {
			'_drillsExecuted.drillId': { $in: drillIds }
		}
	};
	const matchStage2Planned = {
		$match: {
			'_drills.drillsId': { $in: drillIds }
		}
	};

	const projectStageExecuted = {
		$project: {
			_drillsExecuted: 1,
			_id: 1,
			start: 1,
			duration: 1,
			playerIds: 1
		}
	};

	const projectStagePlanned = {
		$project: {
			_drills: 1,
			_id: 1,
			start: 1,
			duration: 1,
			playerIds: 1
		}
	};

	const stages = gpsSessionLoaded
		? [matchStageExecuted, unwindStage, matchStage2Executed, projectStageExecuted]
		: [matchStagePlanned, unwindStage, matchStage2Planned, projectStagePlanned];

	return stages;
}

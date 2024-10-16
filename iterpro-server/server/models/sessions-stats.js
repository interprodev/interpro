const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const { flatten, groupBy, uniq, sortBy, isNumber, keyBy, compact, meanBy, pick, intersection } = require('lodash');
const Promise = require('bluebird');
const axiosLib = require('axios');

const { getGD } = require('./date-utils');

module.exports = function (SessionsStats) {
	SessionsStats.getAdvancedData = async function (teamId, playerIds, dateFrom, dateTo, metrics, groupingBy = 'player') {
		try {
			console.log(
				`[SESSION ANALYSIS] Getting EWMA data for ${teamId} between ${moment(dateFrom).format(
					'DD/MM/YYYY'
				)} and ${moment(dateTo).format('DD/MM/YYYY')}...`
			);
			const teamIdParam = `teamId=${teamId}`;
			const datesParam = `dateFrom=${moment(dateFrom).toISOString()}&dateTo=${moment(dateTo).toISOString()}`;
			const playersParam = `${playerIds.map(playerId => `&playerIds=${playerId}`).join('')}`;
			// const metricsParam = `${metrics.map(metric => `&metrics=${metric}`).join('')}`; // NOTE for future development for aggregating more metrics
			const metricsParam = `&metrics=${metrics[0]}`;
			const url = `${process.env.ADVANCED_GPS_DATA_URL}?${teamIdParam}&${datesParam}${playersParam}${metricsParam}`;
			const response = await axiosLib.get(url);
			const { data } = response;
			// console.debug(data);
			const grouped = groupBy(data, groupingBy === 'player' ? 'playerId' : 'day');
			return grouped;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	SessionsStats.sessionsPeriodTotal = async function (
		teamId,
		groups,
		dateFrom,
		dateTo,
		metricsGps,
		selectedSplits,
		modified,
		individual
	) {
		try {
			console.log(
				`[SESSION ANALYSIS] Getting period total data for team ${teamId} between ${moment(dateFrom).format(
					'DD/MM/YYYY'
				)} and ${moment(dateTo).format('DD/MM/YYYY')}`
			);
			const eventCollection = SessionsStats.app.models.Event.getDataSource().connector.collection(
				SessionsStats.app.models.Event.modelName
			);

			const pipelineSessionsPeriodTotal = getPipelinePeriodTotal(
				teamId,
				dateFrom,
				dateTo,
				metricsGps,
				selectedSplits,
				modified,
				individual
			);
			const pipelineCountArrayTrainings = getPipelineArrayTrainings(teamId, dateFrom, dateTo, individual);
			const pipelineCountArrayMatches = getPipelineArrayMatches(teamId, dateFrom, dateTo, individual);
			const pipelineSplitsMain = getPipelineSplitsForTotal(teamId, dateFrom, dateTo);

			const [resultPeriodTotal, resultCountTraining, resultCountMatches, resultSplitsMain] = await Promise.all([
				eventCollection
					.aggregate(pipelineSessionsPeriodTotal, {
						allowDiskUse: true
					})
					.toArray(),
				eventCollection.aggregate(pipelineCountArrayTrainings).toArray(),
				eventCollection.aggregate(pipelineCountArrayMatches).toArray(),
				eventCollection.aggregate(pipelineSplitsMain).toArray()
			]);

			const groupedByIdResults = keyBy(resultPeriodTotal, '_id');

			const data = [
				...(resultPeriodTotal || []).map(session => ({
					label: session._id,
					values: metricsGps.reduce((acc, metric) => ({ ...acc, [metric]: session[metric] }), {})
				})),
				...(groups || []).map(({ id, players }) => {
					const values = Object.values(pick(groupedByIdResults, players));
					const aggregated = values.reduce((acc, cur) => {
						metricsGps.forEach(metric => {
							acc[metric] = (acc[metric] || 0) + cur[metric];
						});
						return acc;
					}, {});
					Object.entries(aggregated).forEach(
						([key, value]) => (aggregated[key] = metricsGps.includes(key) ? value / players.length : value)
					);
					return {
						label: id,
						values: aggregated
					};
				})
			];

			const games = resultCountMatches[0]?.count || 0;
			const trainings = resultCountTraining[0]?.count || 0;

			const splitTraining = resultCountTraining[0]?.splits || [];
			const splitMatches = resultCountMatches[0]?.splits || [];
			const splits = compact(uniq([...splitTraining, ...splitMatches]).sort());

			const splitsPipelineMain = resultSplitsMain[0]?.splits || [];
			const mainSplits = compact(uniq(splitsPipelineMain).sort());

			return {
				data,
				splits,
				mainSplits,
				games,
				trainings
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	SessionsStats.sessionsPeriodTrend = async function (
		teamId,
		playerIds,
		groups,
		dateFrom,
		dateTo,
		metricsGps,
		splits,
		modified,
		individual
	) {
		try {
			console.log(
				`[SESSION ANALYSIS] Getting period trend data for ${teamId} between ${moment(dateFrom).format(
					'DD/MM/YYYY'
				)} and ${moment(dateTo).format('DD/MM/YYYY')}...`
			);
			const eventCollection = SessionsStats.app.models.Event.getDataSource().connector.collection(
				SessionsStats.app.models.Event.modelName
			);

			const playerIdsObjs = [...playerIds.map(ObjectID)];

			const players = await SessionsStats.app.models.Player.find({
				where: { id: { inq: playerIdsObjs } },
				fields: ['id', 'archived', 'archivedDate', '_thresholds']
			});

			const pipelineSessionsPeriodTrend = getPipelinePeriodTrend(
				teamId,
				playerIds,
				groups,
				dateFrom,
				dateTo,
				metricsGps,
				splits,
				modified,
				individual
			);
			const pipelineSplits = getPipelineSplits(teamId, dateFrom, dateTo, individual);
			const pipelineSplitsMain = getPipelineSplitsMain(teamId, dateFrom, dateTo, individual);
			const pipelineCountArrayTrainings = getPipelineArrayTrainings(teamId, dateFrom, dateTo, individual);
			const pipelineCountArrayMatches = getPipelineArrayMatches(teamId, dateFrom, dateTo, individual);

			const [resultPeriodTrend, resultSplits, resultSplitsMain, resultCountTraining, resultCountMatches] =
				await Promise.all([
					eventCollection.aggregate(pipelineSessionsPeriodTrend, { allowDiskUse: true }).toArray(),
					eventCollection.aggregate(pipelineSplits).toArray(),
					eventCollection.aggregate(pipelineSplitsMain).toArray(),
					eventCollection.aggregate(pipelineCountArrayTrainings).toArray(),
					eventCollection.aggregate(pipelineCountArrayMatches).toArray()
				]);

			const games = resultCountMatches[0]?.count || 0;
			const trainings = resultCountTraining[0]?.count || 0;
			const splitsData = getSplitsData(resultSplits, resultSplitsMain);

			const filteredPeriodResults = resultPeriodTrend.filter(({ splitName }) => splits.includes(splitName));
			const eventsData = getEventsData(filteredPeriodResults, players, groups, metricsGps);
			const tableData = getTableData(filteredPeriodResults, players, metricsGps, groups);

			return {
				...eventsData,
				...splitsData,
				tableData,
				games,
				trainings
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	SessionsStats.periodCsv = async function (
		teamId,
		dateFrom,
		dateTo,
		playerIds,
		activeMetrics,
		splits,
		timezoneOffset,
		res
	) {
		try {
			console.log(
				`[SESSION ANALYSIS] Getting csv file of period for team ${teamId} between ${moment(dateFrom).format(
					'DD/MM/YYYY'
				)} and ${moment(dateTo).format('DD/MM/YYYY')}`
			);
			const eventCollection = SessionsStats.app.models.Event.getDataSource().connector.collection(
				SessionsStats.app.models.Event.modelName
			);

			const team = await SessionsStats.app.models.Team.findById(teamId);
			const defaultSplits = [team.mainSplitName, team.mainGameName];

			const pipelinePeriodCsv = getPipelinePeriodCsv(
				teamId,
				playerIds,
				dateFrom,
				dateTo,
				activeMetrics,
				splits || defaultSplits
			);
			let results = await eventCollection.aggregate(pipelinePeriodCsv, { allowDiskUse: true }).toArray();

			const pipelineMatches = getPipelineMatches(teamId);
			const allMatches = await eventCollection.aggregate(pipelineMatches, { allowDiskUse: true }).toArray();

			const headerRow = [
				'Date',
				'Type',
				'Title',
				'Player name',
				'Split',
				'Split Start Time',
				'Split End Time',
				'Partecipants',
				...activeMetrics
			];
			const csvBodyRows = [headerRow];

			const sessions = results.map(res => {
				const metrics = activeMetrics.map(metricName => ({ metricName, value: res[metricName] }));
				return { sessionDate: res.eventStart, metrics };
			});

			let sameEventSessionDate = null;

			// sorting the resulting array by start date of an avent. (increasing order)
			results = sortBy(results, 'eventStart');
			for (const res of results) {
				const date = moment(res.eventStart).subtract(timezoneOffset, 'minutes').format('DD/MM/YYYY HH:mm');
				const splitStartTime = moment(res.splitStartTime).subtract(timezoneOffset, 'minutes').format('HH:mm');
				const splitEndTime = moment(res.splitEndTime).subtract(timezoneOffset, 'minutes').format('HH:mm');

				if (!sameEventSessionDate || !moment(sameEventSessionDate).isSame(moment(res.eventStart))) {
					// Add the row for average calculation here for all players
					const avgRow = [
						date,
						getGD(res.eventStart, allMatches),
						`"${res.eventTitle}"`,
						'Team',
						res.splitName,
						splitStartTime,
						splitEndTime,
						''
					];
					for (const metric of activeMetrics) {
						const filtered = sessions.filter(({ sessionDate }) => moment(sessionDate).isSame(moment(res.eventStart)));
						let result = 0;
						filtered.forEach(({ metrics }) => {
							const metricInCollection = metrics.find(({ metricName }) => metricName === metric);
							result = result + (metricInCollection?.value || null);
						});
						result = filtered.length ? result / filtered.length : 0;
						avgRow.push(isNumber(result) ? Number(result).toFixed(2) : null);
					}
					csvBodyRows.push(avgRow);
					sameEventSessionDate = res.eventStart;
				}

				// each player row
				const row = [
					date,
					getGD(res.eventStart, allMatches),
					`"${res.eventTitle}"`,
					res.playerName,
					res.splitName,
					splitStartTime,
					splitEndTime,
					res.dirty ? 'Modified' : 'Full',
					...activeMetrics.map(metric => {
						const resultMetric = res[metric];
						return isNumber(resultMetric) ? Number(resultMetric).toFixed(2) : null;
					})
				];
				csvBodyRows.push(row);
			}
			const outCSV = csvBodyRows.join('\n');
			res.send(outCSV);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	SessionsStats.workloadAnalysisPeriod = async function (teamId, playerIds, dateFrom, dateTo, modified, individual) {
		try {
			console.log(
				`[WORKLOAD ANALYSIS] Getting period data for team ${teamId} between ${moment(dateFrom).format(
					'DD/MM/YYYY'
				)} and ${moment(dateTo).format('DD/MM/YYYY')}`
			);
			const eventCollection = SessionsStats.app.models.Event.getDataSource().connector.collection(
				SessionsStats.app.models.Event.modelName
			);
			const goScoreCollection = SessionsStats.app.models.GOScore.getDataSource().connector.collection(
				SessionsStats.app.models.GOScore.modelName
			);

			const pipelineStagesWorkloadPeriod = getPipelineStagesWorkloadPeriod(
				teamId,
				playerIds,
				dateFrom,
				dateTo,
				modified,
				individual
			);
			const pipelineStagesWorkloadPeriodGoScore = getPipelineStagesWorkloadPeriodGoScore(playerIds, dateFrom, dateTo);

			const resultEvents = await eventCollection.aggregate(pipelineStagesWorkloadPeriod).toArray();
			const resultGoScores = await goScoreCollection.aggregate(pipelineStagesWorkloadPeriodGoScore).toArray();

			const allDays = moment(dateTo).diff(moment(dateFrom), 'days') + 1;
			const loadMapPlayers = {};
			const gamesDays = [];
			let gamesCounter = 0;
			const trainingDays = [];
			let trainingCounter = 0;
			const daysOn = [];
			let totalTimes = 0;
			let aboveTarget = 0;
			let inTarget = 0;
			let belowTarget = 0;
			const K_TOLERANCE_MIN = 0.1;
			const gameLoadMacroCategories = [];
			const trainingLoadMacroCategories = [];

			const workloadDistributionAvg = {};
			const eventMapDate = {};
			for (const ev of resultEvents) {
				if (ev.eventFormat === 'game') {
					const dateFormattedEv = moment(ev.start).format('DD/MM/YYYY');
					eventMapDate[dateFormattedEv] = ev;
				}
			}

			const daysArray = Array.from(moment.range(moment(dateFrom), moment(dateTo)).snapTo('day').by('days'));

			const stressBalanceArray = [];
			for (const d of daysArray) {
				const dateFormat = moment(d).format('DD/MM/YYYY');
				const eventFound = dateFormat in eventMapDate ? eventMapDate[dateFormat] : null;
				const eventResult = eventFound ? eventFound.result : null;
				const eventHome = eventFound ? eventFound.home : null;
				const eventOpponent = eventFound ? eventFound.opponent : null;
				workloadDistributionAvg[dateFormat] = {
					perceived: null,
					mechanical: null,
					cardio: null,
					kinematic: null,
					metabolic: null,
					intensity: null,
					workload: null,
					eventResult: eventResult,
					home: eventHome,
					opponent: eventOpponent
				};
				stressBalanceArray.push({
					label: dateFormat,
					workload: null,
					readiness: null,
					eventResult: eventResult,
					home: eventHome,
					opponent: eventOpponent
				});
			}

			let gameMinutes = 0;
			let trainingMinutes = 0;

			for (const ev of resultEvents) {
				const dateFormatted = moment(ev.start).format('DD/MM/YYYY');
				if (ev.eventFormat === 'training') {
					trainingCounter = trainingCounter + 1;
					if (!trainingDays.find(x => x === dateFormatted)) trainingDays.push(dateFormatted);
				} else {
					gamesCounter = gamesCounter + 1;
					if (!gamesDays.find(x => x === dateFormatted)) gamesDays.push(dateFormatted);
				}
				if (!daysOn.find(x => x === dateFormatted)) daysOn.push(dateFormatted);
				let sumPerceived = 0;
				let sumMechanical = 0;
				let sumCardio = 0;
				let sumKinematic = 0;
				let sumMetabolic = 0;
				let sumIntensity = 0;
				let sumWorkload = 0;

				for (const sess of ev.sessionsFiltered) {
					// Minutes General
					let minutesToConsider = null;
					if (ev.eventFormat === 'training') {
						trainingMinutes = trainingMinutes + sess.duration;
						minutesToConsider = sess.duration;
					} else {
						const playerMatchStat = ev.pmStats.find(x => x.playerId.toString() === sess.playerId.toString());
						if (playerMatchStat && playerMatchStat.minutesPlayed) {
							gameMinutes = gameMinutes + playerMatchStat.minutesPlayed;
							minutesToConsider = playerMatchStat.minutesPlayed;
						} else {
							gameMinutes = gameMinutes + sess.duration;
							minutesToConsider = sess.duration;
						}
					}
					// Loadmap
					if (!(sess.playerId in loadMapPlayers))
						loadMapPlayers[sess.playerId] = {
							game_load: 0,
							training_load: 0,
							countGames: 0,
							countTrainings: 0,
							trainingMinutes: 0,
							gameMinutes: 0
						};

					const fieldCountToUpdate = ev.eventFormat === 'training' ? 'countTrainings' : 'countGames';
					const fieldMinutesToUpdate = ev.eventFormat === 'training' ? 'trainingMinutes' : 'gameMinutes';
					const fieldToUpdate = ev.eventFormat === 'training' ? 'training_load' : 'game_load';
					const workloadToAdd = sess.workload && isFinite(sess.workload) ? sess.workload : 0;

					loadMapPlayers[sess.playerId][fieldToUpdate] = loadMapPlayers[sess.playerId][fieldToUpdate] + workloadToAdd;
					loadMapPlayers[sess.playerId][fieldCountToUpdate] = loadMapPlayers[sess.playerId][fieldCountToUpdate] + 1;
					loadMapPlayers[sess.playerId][fieldMinutesToUpdate] =
						loadMapPlayers[sess.playerId][fieldMinutesToUpdate] + minutesToConsider;

					// Time in target
					totalTimes = totalTimes + 1;
					sess.workload = sess.workload ? sess.workload : 0;
					if (sess.workload > ev.eventWorkload + K_TOLERANCE_MIN) aboveTarget = aboveTarget + 1;
					else if (sess.workload < ev.eventWorkload - 1 - K_TOLERANCE_MIN) belowTarget = belowTarget + 1;
					else inTarget = inTarget + 1;

					// Workload distribution avg
					sumPerceived =
						sumPerceived + (sess.perceivedWorkload && isFinite(sess.perceivedWorkload) ? sess.perceivedWorkload : 0);
					sumMechanical =
						sumMechanical +
						(sess.mechanicalWorkload && isFinite(sess.mechanicalWorkload) ? sess.mechanicalWorkload : 0);
					sumCardio = sumCardio + (sess.cardioWorkload && isFinite(sess.cardioWorkload) ? sess.cardioWorkload : 0);
					sumKinematic =
						sumKinematic + (sess.kinematicWorkload && isFinite(sess.kinematicWorkload) ? sess.kinematicWorkload : 0);
					sumMetabolic =
						sumMetabolic + (sess.metabolicWorkload && isFinite(sess.metabolicWorkload) ? sess.metabolicWorkload : 0);
					sumIntensity = sumIntensity + (sess.intensity && isFinite(sess.intensity) ? sess.intensity : 0);
					sumWorkload = sumWorkload + (sess.workload && isFinite(sess.workload) ? sess.workload : 0);
				}
				const sessLength = ev.sessionsFiltered.length;
				const eventFound = dateFormatted in eventMapDate ? eventMapDate[dateFormatted] : null;
				const eventResult = eventFound ? eventFound.result : null;
				const eventHome = eventFound ? eventFound.home : null;
				const eventOpponent = eventFound ? eventFound.opponent : null;

				const perceivedCalc = sumPerceived !== 0 && sessLength !== 0 ? sumPerceived / sessLength : 0;
				const mechanicalCalc = sumMechanical !== 0 && sessLength !== 0 ? sumMechanical / sessLength : 0;
				const cardioCalc = sumCardio !== 0 && sessLength !== 0 ? sumCardio / sessLength : 0;
				const kinematicCalc = sumKinematic !== 0 && sessLength !== 0 ? sumKinematic / sessLength : 0;
				const metabolicCalc = sumMetabolic !== 0 && sessLength !== 0 ? sumMetabolic / sessLength : 0;
				const intensityCalc = sumIntensity !== 0 && sessLength !== 0 ? sumIntensity / sessLength : 0;
				const workloadCalc = sumWorkload !== 0 && sessLength !== 0 ? sumWorkload / sessLength : 0;

				workloadDistributionAvg[dateFormatted] = {
					perceived: workloadDistributionAvg[dateFormatted].perceived
						? workloadDistributionAvg[dateFormatted].perceived + perceivedCalc
						: perceivedCalc,
					mechanical: workloadDistributionAvg[dateFormatted].mechanical
						? workloadDistributionAvg[dateFormatted].mechanical + mechanicalCalc
						: mechanicalCalc,
					cardio: workloadDistributionAvg[dateFormatted].cardio
						? workloadDistributionAvg[dateFormatted].cardio + cardioCalc
						: cardioCalc,
					kinematic: workloadDistributionAvg[dateFormatted].kinematic
						? workloadDistributionAvg[dateFormatted].kinematic + kinematicCalc
						: kinematicCalc,
					metabolic: workloadDistributionAvg[dateFormatted].metabolic
						? workloadDistributionAvg[dateFormatted].metabolic + metabolicCalc
						: metabolicCalc, // wl parameters always sum
					intensity: workloadDistributionAvg[dateFormatted].intensity
						? (workloadDistributionAvg[dateFormatted].intensity + intensityCalc) / 2
						: intensityCalc, // intensity should be always a avg
					workload: workloadDistributionAvg[dateFormatted].workload
						? workloadDistributionAvg[dateFormatted].workload + workloadCalc
						: workloadCalc,
					eventResult: eventResult,
					home: eventHome,
					opponent: eventOpponent
				};

				const existingStressIndex = stressBalanceArray.findIndex(x => x.label === dateFormatted);
				if (stressBalanceArray[existingStressIndex].workload)
					stressBalanceArray[existingStressIndex].workload += workloadCalc;
				else stressBalanceArray[existingStressIndex].workload = workloadCalc;

				const total = sumPerceived + sumMechanical + sumCardio + sumKinematic + sumMetabolic;
				if (total > 0) {
					if (ev.eventFormat === 'training')
						trainingLoadMacroCategories.push({
							perceived: (sumPerceived / total) * 100,
							mechanical: (sumMechanical / total) * 100,
							cardio: (sumCardio / total) * 100,
							kinematic: (sumKinematic / total) * 100,
							metabolic: (sumMetabolic / total) * 100
						});
					else
						gameLoadMacroCategories.push({
							perceived: (sumPerceived / total) * 100,
							mechanical: (sumMechanical / total) * 100,
							cardio: (sumCardio / total) * 100,
							kinematic: (sumKinematic / total) * 100,
							metabolic: (sumMetabolic / total) * 100
						});
				}
			}

			const daysOff = allDays - daysOn.length;

			const response = {};
			response.general = {
				totalDays: allDays,
				daysOff: daysOff,
				trainingSessions: trainingCounter,
				games: gamesCounter,
				allSessions: trainingCounter + gamesCounter,
				gameMinutes: gameMinutes,
				trainingMinutes: trainingMinutes
			};
			response.period_breakdown = {};
			response.period_breakdown.loadMap = loadMapPlayers;
			response.period_breakdown.timeInTarget = {
				above: (aboveTarget / totalTimes) * 100,
				below: (belowTarget / totalTimes) * 100,
				inTarget: (inTarget / totalTimes) * 100
			};

			response.workload_distribution = {};
			response.workload_distribution.avg_values = workloadDistributionAvg;
			response.workload_distribution.percentage = {};
			response.workload_distribution.percentage.game_load = {};
			response.workload_distribution.percentage.game_load.perceived = meanBy(gameLoadMacroCategories, 'perceived');
			response.workload_distribution.percentage.game_load.mechanical = meanBy(gameLoadMacroCategories, 'mechanical');
			response.workload_distribution.percentage.game_load.cardio = meanBy(gameLoadMacroCategories, 'cardio');
			response.workload_distribution.percentage.game_load.kinematic = meanBy(gameLoadMacroCategories, 'kinematic');
			response.workload_distribution.percentage.game_load.metabolic = meanBy(gameLoadMacroCategories, 'metabolic');

			response.workload_distribution.percentage.training_load = {};
			response.workload_distribution.percentage.training_load.perceived = meanBy(
				trainingLoadMacroCategories,
				'perceived'
			);
			response.workload_distribution.percentage.training_load.mechanical = meanBy(
				trainingLoadMacroCategories,
				'mechanical'
			);
			response.workload_distribution.percentage.training_load.cardio = meanBy(trainingLoadMacroCategories, 'cardio');
			response.workload_distribution.percentage.training_load.kinematic = meanBy(
				trainingLoadMacroCategories,
				'kinematic'
			);
			response.workload_distribution.percentage.training_load.metabolic = meanBy(
				trainingLoadMacroCategories,
				'metabolic'
			);

			for (const res of resultGoScores) {
				const dateF = res._id.toString();
				const existingStressIndex = stressBalanceArray.findIndex(x => x.label === dateF);
				stressBalanceArray[existingStressIndex].readiness = res.avg_readiness;
			}

			response.stress_balance = stressBalanceArray;

			return response;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};
};

function getPipelinePeriodCsv(teamId, playerIds, dateFrom, dateTo, metricsGps, splits) {
	const pipelineStages = [];
	const playerIdsObjs = playerIds.filter(id => !isGroup(id)).map(x => ObjectID(x));

	const matchStage = {
		$match: {
			teamId: ObjectID(teamId),
			format: { $in: ['game', 'friendly', 'training'] },
			start: { $gte: dateFrom, $lte: dateTo },
			_sessionPlayers: { $exists: true, $nin: [null, []] }
		}
	};
	const addFieldsStage = {
		$addFields: {
			'_sessionPlayers.eventId': '$_id',
			'_sessionPlayers.eventStart': '$start',
			'_sessionPlayers.eventType': '$type',
			'_sessionPlayers.eventTitle': '$title',
			'_sessionPlayers.format': '$format'
		}
	};

	const projectStage = {
		$project: {
			day: { $dateToString: { format: '%d/%m/%Y', date: '$start' } },
			playerIds: 1,
			_sessionPlayers: 1
		}
	};

	let projectStage2 = null;

	projectStage2 = {
		$project: {
			sessionsFiltered: {
				$filter: {
					input: '$_sessionPlayers',
					as: 'item',
					cond: { $and: [{ $in: ['$$item.splitName', splits] }, { $in: ['$$item.playerId', playerIdsObjs] }] }
				}
			}
		}
	};

	const unwindStage2 = {
		$unwind: {
			path: '$sessionsFiltered',
			preserveNullAndEmptyArrays: true
		}
	};
	const projectStage3Clause = {};
	projectStage3Clause['playerId'] = '$sessionsFiltered.playerId';
	projectStage3Clause['splitName'] = '$sessionsFiltered.splitName';
	projectStage3Clause['playerName'] = '$sessionsFiltered.playerName';
	projectStage3Clause['date'] = '$_id';
	projectStage3Clause['playerName'] = '$sessionsFiltered.playerName';
	projectStage3Clause['eventId'] = '$sessionsFiltered.eventId';
	projectStage3Clause['eventStart'] = '$sessionsFiltered.eventStart';
	projectStage3Clause['format'] = '$sessionsFiltered.format';
	projectStage3Clause['eventType'] = '$sessionsFiltered.eventType';
	projectStage3Clause['eventTitle'] = '$sessionsFiltered.eventTitle';
	projectStage3Clause['splitStartTime'] = '$sessionsFiltered.splitStartTime';
	projectStage3Clause['splitEndTime'] = '$sessionsFiltered.splitEndTime';
	projectStage3Clause['dirty'] = '$sessionsFiltered.dirty';
	for (const m of metricsGps) {
		const mLabel = '$sessionsFiltered.' + m;
		projectStage3Clause[m] = mLabel;
	}
	const projectStage3 = { $project: projectStage3Clause };

	pipelineStages.push(matchStage);
	pipelineStages.push(addFieldsStage);
	pipelineStages.push(projectStage);
	pipelineStages.push(projectStage2);
	pipelineStages.push(unwindStage2);
	pipelineStages.push(projectStage3);
	return pipelineStages;
}

function getPipelineMatches(teamId) {
	const matchStage = {
		$match: {
			teamId: ObjectID(teamId),
			format: { $in: ['game', 'friendly'] }
		}
	};

	const projectStage = {
		$project: {
			_id: 1,
			start: 1
		}
	};

	return [matchStage, projectStage];
}

function getPipelinePeriodTotal(teamId, dateFrom, dateTo, metricsGps, splits, modified, individual) {
	const matchStage = {
		$match: {
			teamId: ObjectID(teamId),
			format: { $in: ['game', 'friendly', 'training'] },
			start: { $gte: dateFrom, $lte: dateTo },
			_sessionImport: { $exists: true }
		}
	};
	if (individual !== 0) {
		matchStage.$match = {
			...matchStage.$match,
			individual: individual === 1 ? true : false
		};
	}

	const unwindStage = {
		$unwind: {
			path: '$playerIds',
			preserveNullAndEmptyArrays: true
		}
	};

	const projectStagePreGroup = {
		$project: {
			['_sessionPlayers.playerId']: 1,
			['_sessionPlayers.splitName']: 1,
			['_sessionPlayers.mainSession']: 1,
			['teamId']: 1,
			['playerIds']: 1,
			['_id']: 1,
			...metricsGps.map(metric => `_sessionPlayers.${metric}`).reduce((acc, metric) => ({ ...acc, [metric]: 1 }), {})
		}
	};

	const groupStage = {
		$group: {
			_id: '$playerIds',
			sessions: { $push: '$_sessionPlayers' }
		}
	};
	const unwindStage2 = { $unwind: '$sessions' };

	const projectStage = {
		$project: {
			sessionsFiltered: {
				$filter: {
					input: '$sessions',
					as: 'item',
					cond: { $and: [{ $in: ['$$item.splitName', splits] }, { $eq: ['$$item.playerId', '$_id'] }] }
				}
			}
		}
	};
	if (modified !== 0) {
		projectStage.$project.sessionsFiltered.$filter.cond.$and.push({
			$eq: ['$$item.dirty', modified === 1 ? true : false]
		});
	}

	const unwindStage3 = { $unwind: '$sessionsFiltered' };

	const projectStage2 = {
		$project: {
			...metricsGps.map(metric => `sessionsFiltered.${metric}`).reduce((acc, metric) => ({ ...acc, [metric]: 1 }), {})
		}
	};

	const groupStage2 = {
		$group: {
			_id: '$_id',
			...metricsGps.reduce(
				(acc, metric) => ({
					...acc,
					[metric]: {
						$sum: {
							$convert: {
								input: `$sessionsFiltered.${metric}`,
								to: 'double',
								onError: 0
							}
						}
					}
				}),
				{}
			)
		}
	};

	return [
		matchStage,
		unwindStage,
		projectStagePreGroup,
		groupStage,
		unwindStage2,
		projectStage,
		unwindStage3,
		projectStage2,
		groupStage2
	];
}

function getPipelineArrayTrainings(teamId, dateFrom, dateTo, individual) {
	let matchStageTrainings = null;
	if (individual === 0) {
		matchStageTrainings = {
			$match: {
				teamId: ObjectID(teamId),
				format: 'training',
				start: { $gte: dateFrom, $lte: dateTo }
			}
		};
	} else {
		matchStageTrainings = {
			$match: {
				teamId: ObjectID(teamId),
				format: 'training',
				start: { $gte: dateFrom, $lte: dateTo },
				individual: individual === 1 ? true : false
			}
		};
	}

	const pipelineCountArrayTrainings = [
		matchStageTrainings,
		{ $project: { _id: 1, split: '$_sessionPlayers.splitName', mainSession: '$_sessionPlayers.mainSession' } },
		{ $group: { _id: null, count: { $sum: 1 }, splits: { $addToSet: '$split' } } },
		{ $unwind: '$splits' },
		{ $unwind: '$splits' },
		{
			$group: {
				_id: null,
				splits: { $addToSet: '$splits' },
				count: { $first: '$count' }
			}
		}
	];
	return pipelineCountArrayTrainings;
}

function getPipelineArrayMatches(teamId, dateFrom, dateTo, individual) {
	let matchStageGames = null;
	if (individual === 0) {
		matchStageGames = {
			$match: {
				teamId: ObjectID(teamId),
				format: { $in: ['game', 'friendly'] },
				start: { $gte: dateFrom, $lte: dateTo }
			}
		};
	} else {
		matchStageGames = {
			$match: {
				teamId: ObjectID(teamId),
				format: { $in: ['game', 'friendly'] },
				start: { $gte: dateFrom, $lte: dateTo },
				individual: individual === 1 ? true : false
			}
		};
	}

	const pipelineCountArrayMatches = [
		matchStageGames,
		{ $project: { _id: 1, split: '$_sessionPlayers.splitName', mainSession: '$_sessionPlayers.mainSession' } },
		{ $group: { _id: null, count: { $sum: 1 }, splits: { $addToSet: '$split' } } },
		{ $unwind: '$splits' },
		{ $unwind: '$splits' },
		{
			$group: {
				_id: null,
				splits: { $addToSet: '$splits' },
				count: { $first: '$count' }
			}
		}
	];

	return pipelineCountArrayMatches;
}

function getPipelineSplitsForTotal(teamId, dateFrom, dateTo) {
	return [
		{
			$match: {
				teamId: ObjectID(teamId),
				format: { $in: ['game', 'friendly', 'training'] },
				start: { $gte: dateFrom, $lte: dateTo },
				_sessionImport: { $exists: true }
			}
		},
		{
			$project: {
				_id: 1,
				_sessions: {
					$filter: {
						input: '$_sessionPlayers',
						as: 'item',
						cond: { $eq: ['$$item.mainSession', true] }
					}
				}
			}
		},
		{ $project: { _id: 1, split: '$_sessions.splitName', mainSession: '$_sessions.mainSession' } },
		{
			$group: {
				_id: null,
				splits: { $addToSet: '$split' }
			}
		},
		{ $unwind: '$splits' },
		{ $unwind: '$splits' },
		{
			$group: {
				_id: null,
				splits: { $addToSet: '$splits' }
			}
		}
	];
}

function getPipelinePeriodTrend(teamId, playerIds, groups, dateFrom, dateTo, metricsGps, splits, modified, individual) {
	const pipelineStages = [];

	const playerIdsObjs = playerIds.map(ObjectID);
	for (const group of groups) {
		for (const playerId of group.players) {
			playerIdsObjs.push(ObjectID(playerId));
		}
	}

	const matchStage = {
		$match: {
			teamId: ObjectID(teamId),
			format: { $in: ['game', 'friendly', 'training'] },
			start: { $gte: dateFrom, $lte: dateTo },
			_sessionImport: { $exists: true }
		}
	};
	if (individual !== 0) {
		matchStage.$match = {
			...matchStage.$match,
			individual: individual === 1 ? true : false
		};
	}

	const addFieldsStage = {
		$addFields: {
			'_sessionPlayers.eventId': '$_id',
			'_sessionPlayers.eventStart': '$start',
			'_sessionPlayers.eventOpponent': '$opponent',
			'_sessionPlayers.eventResult': '$result',
			'_sessionPlayers.eventHome': '$home',
			'_sessionPlayers.eventGDtype': '$type'
		}
	};

	const projectStage = {
		$project: {
			day: { $dateToString: { format: '%d/%m/%Y', date: '$start' } },
			training: { $cond: [{ $eq: ['$format', 'training'] }, 1, 0] },
			game: { $cond: [{ $ne: ['$format', 'training'] }, 1, 0] },
			playerIds: 1,
			_sessionPlayers: 1
		}
	};

	const groupStage = {
		$group: {
			_id: '$day',
			sessions: {
				$push: '$_sessionPlayers'
			}
		}
	};
	const unwindStage = {
		$unwind: {
			path: '$sessions',
			preserveNullAndEmptyArrays: true
		}
	};

	const projectStage2 = {
		$project: {
			sessionsFiltered: {
				$filter: {
					input: '$sessions',
					as: 'item',
					cond: { $and: [{ $in: ['$$item.splitName', splits] }, { $in: ['$$item.playerId', playerIdsObjs] }] }
				}
			}
		}
	};
	if (modified !== 0) {
		projectStage2.$project.sessionsFiltered.$filter.cond.$and.push({
			$eq: ['$$item.dirty', modified === 1 ? true : false]
		});
	}

	const unwindStage2 = {
		$unwind: {
			path: '$sessionsFiltered',
			preserveNullAndEmptyArrays: true
		}
	};

	const projectStage3 = {
		$project: {
			date: '$_id',
			playerId: '$sessionsFiltered.playerId',
			playerName: '$sessionsFiltered.playerName',
			splitName: '$sessionsFiltered.splitName',
			eventId: '$sessionsFiltered.eventId',
			eventStart: '$sessionsFiltered.eventStart',
			eventOpponent: '$sessionsFiltered.eventOpponent',
			eventResult: '$sessionsFiltered.eventResult',
			eventHome: '$sessionsFiltered.eventHome',
			eventGDtype: '$sessionsFiltered.eventGDtype',
			...metricsGps.reduce(
				(acc, metric) => ({
					...acc,
					[metric]: {
						$sum: {
							$convert: {
								input: `$sessionsFiltered.${metric}`,
								to: 'double',
								onError: 0
							}
						}
					}
				}),
				{}
			)
		}
	};

	pipelineStages.push(matchStage);
	pipelineStages.push(addFieldsStage);
	pipelineStages.push(projectStage);
	pipelineStages.push(groupStage);
	pipelineStages.push(unwindStage);
	pipelineStages.push(projectStage2);
	pipelineStages.push(unwindStage2);
	pipelineStages.push(projectStage3);

	return pipelineStages;
}

function isPlayerArchivedForDate(players, playerId, date) {
	for (const player of players) {
		if (
			String(player.id) === String(playerId) &&
			player.archived &&
			moment(player.archivedDate).isBefore(moment(date), 'days')
		) {
			return true;
		}
	}
	return false;
}

function getPipelineStagesWorkloadPeriod(teamId, playerIds, dateFrom, dateTo, modified, individual) {
	const pipelineStages = [];
	dateTo = moment(dateTo).endOf('day').toDate();
	playerIds = playerIds.map(x => ObjectID(x));
	let projectStage = null;
	let matchStage = null;
	if (individual === 0) {
		matchStage = {
			$match: {
				teamId: ObjectID(teamId),
				format: { $in: ['game', 'friendly', 'training'] },
				start: { $gte: dateFrom, $lte: dateTo },
				_sessionPlayers: { $exists: true, $ne: [] }
			}
		};
	} else {
		const individualFlag = individual === 1 ? true : false;
		matchStage = {
			$match: {
				teamId: ObjectID(teamId),
				format: { $in: ['game', 'friendly', 'training'] },
				start: { $gte: dateFrom, $lte: dateTo },
				individual: individualFlag,
				_sessionPlayers: { $exists: true, $ne: [] }
			}
		};
	}

	if (modified === 0) {
		projectStage = {
			$project: {
				eventFormat: '$format',
				eventWorkload: '$workload',
				eventTitle: '$title',
				home: '$home',
				result: '$result',
				start: '$start',
				type: '$type',
				opponent: '$opponent',
				pmStats: '$_playerMatchStats',
				sessionsFiltered: {
					$filter: {
						input: '$_sessionPlayers',
						as: 'item',
						cond: {
							$and: [{ $eq: ['$$item.mainSession', true] }, { $in: ['$$item.playerId', playerIds] }]
						}
					}
				}
			}
		};
	} else {
		const modifiedFlag = modified === 1 ? true : false;
		projectStage = {
			$project: {
				eventFormat: '$format',
				eventWorkload: '$workload',
				eventTitle: '$title',
				home: '$home',
				result: '$result',
				start: '$start',
				type: '$type',
				opponent: '$opponent',
				pmStats: '$_playerMatchStats',
				sessionsFiltered: {
					$filter: {
						input: '$_sessionPlayers',
						as: 'item',
						cond: {
							$and: [
								{ $eq: ['$$item.mainSession', true] },
								{ $in: ['$$item.playerId', playerIds] },
								{ $eq: ['$$item.dirty', modifiedFlag] }
							]
						}
					}
				}
			}
		};
	}

	const projectStage2 = {
		$project: {
			eventFormat: '$eventFormat',
			eventWorkload: '$eventWorkload',
			eventTitle: '$eventTitle',
			start: '$start',
			type: '$type',
			home: '$home',
			result: '$result',
			opponent: '$opponent',
			pmStats: '$pmStats',
			'sessionsFiltered.playerName': 1,
			'sessionsFiltered.playerId': 1,
			'sessionsFiltered.splitName': 1,
			'sessionsFiltered.workload': 1,
			'sessionsFiltered.perceivedWorkload': 1,
			'sessionsFiltered.cardioWorkload': 1,
			'sessionsFiltered.kinematicWorkload': 1,
			'sessionsFiltered.metabolicWorkload': 1,
			'sessionsFiltered.mechanicalWorkload': 1,
			'sessionsFiltered.intensity': 1,
			'sessionsFiltered.duration': 1
		}
	};
	pipelineStages.push(matchStage);
	pipelineStages.push(projectStage);
	pipelineStages.push(projectStage2);
	return pipelineStages;
}

function getPipelineStagesWorkloadPeriodGoScore(playerIds, dateFrom, dateTo) {
	const pipelineStages = [];
	dateTo = moment(dateTo).endOf('day').toDate();
	playerIds = playerIds.map(x => ObjectID(x));
	const matchStage = {
		$match: {
			playerId: { $in: playerIds },
			date: { $gte: dateFrom, $lte: dateTo }
		}
	};

	const groupStage = {
		$group: {
			_id: { $dateToString: { format: '%d/%m/%Y', date: '$date' } },
			avg_readiness: { $avg: '$score' }
		}
	};
	pipelineStages.push(matchStage);
	pipelineStages.push(groupStage);
	// console.log(JSON.stringify(pipelineStages));
	return pipelineStages;
}

function getPipelineCommonStage(teamId, dateFrom, dateTo, individual) {
	let matchStage = null;
	if (individual === 0) {
		matchStage = {
			$match: {
				teamId: ObjectID(teamId),
				format: { $in: ['game', 'friendly', 'training'] },
				start: { $gte: dateFrom, $lte: dateTo }
			}
		};
	} else {
		const individualFlag = individual === 1 ? true : false;
		matchStage = {
			$match: {
				teamId: ObjectID(teamId),
				format: { $in: ['game', 'friendly', 'training'] },
				start: { $gte: dateFrom, $lte: dateTo },
				individual: individualFlag
			}
		};
	}
	return matchStage;
}

function getPipelineSplits(teamId, dateFrom, dateTo, individual) {
	const matchStage = getPipelineCommonStage(teamId, dateFrom, dateTo, individual);
	return [
		matchStage,
		{ $project: { _id: 1, split: '$_sessionPlayers.splitName', mainSession: '$_sessionPlayers.mainSession' } },
		{
			$group: {
				_id: null,
				splits: { $addToSet: '$split' }
			}
		},
		{ $unwind: '$splits' },
		{ $unwind: '$splits' },
		{
			$group: {
				_id: null,
				splits: { $addToSet: '$splits' }
			}
		}
	];
}

function getPipelineSplitsMain(teamId, dateFrom, dateTo, individual) {
	const matchStage = getPipelineCommonStage(teamId, dateFrom, dateTo, individual);
	return [
		matchStage,
		{
			$project: {
				_id: 1,
				_sessions: {
					$filter: {
						input: '$_sessionPlayers',
						as: 'item',
						cond: { $eq: ['$$item.mainSession', true] }
					}
				}
			}
		},
		{ $project: { _id: 1, split: '$_sessions.splitName', mainSession: '$_sessions.mainSession' } },
		{
			$group: {
				_id: null,
				splits: { $addToSet: '$split' }
			}
		},
		{ $unwind: '$splits' },
		{ $unwind: '$splits' },
		{
			$group: {
				_id: null,
				splits: { $addToSet: '$splits' }
			}
		}
	];
}

function getTableData(results, players, metricsGps, groups) {
	const groupedById = groupBy(results, '_id');
	const withGroups = Object.values(groupedById).map(sessionsByDate => {
		const sessionsForActivePlayers = sessionsByDate.filter(
			({ playerId, eventStart }) => !isPlayerArchivedForDate(players, playerId, eventStart)
		);
		const sessions = sortBy(sessionsForActivePlayers, 'eventStart');

		const playersIds = uniq(sessionsForActivePlayers.map(({ playerId }) => String(playerId)));
		groups.forEach(group => {
			if (intersection(group.players, playersIds).length > 0) {
				const sessionsForGroup = sessions.filter(({ playerId }) => group.players.includes(String(playerId)));

				const groupSession = {
					_id: sessions[0]._id,
					date: sessions[0]._id,
					eventId: sessions[0].eventId,
					playerId: group.id,
					playerName: group.name,
					...metricsGps.reduce((acc, metric) => ({ ...acc, [metric]: meanBy(sessionsForGroup, metric) }), {})
				};

				sessionsByDate.push(groupSession);
				playersIds.push(group.id);
			}
		});
		return sessionsByDate;
	});
	const flattenedResultsWithGroups = flatten(withGroups);
	const groupedByPlayer = groupBy(flattenedResultsWithGroups, 'playerId');
	for (const [playerId, playerSessions] of Object.entries(groupedByPlayer)) {
		const player = players.find(({ id }) => String(id) === playerId);
		if (player) {
			const { _thresholds } = player;
			for (const session of playerSessions) {
				const thresholdForSession = (_thresholds || []).find(({ name }) => name === session.eventGDtype);
				for (const metric of metricsGps) {
					const thresholdForMetric = (thresholdForSession ? thresholdForSession.thresholds : []).find(
						({ name }) => name === metric
					);
					if (thresholdForMetric) {
						session[`${metric}Threshold`] = thresholdForMetric.value;
						session[`${metric}Norm`] = getNorm(session[metric], thresholdForMetric.value);
						session[`${metric}Semaphore`] = getSemaphore(session[metric], thresholdForMetric.value);
					}
				}
			}
		}
	}
	return groupedByPlayer;
}

function getSplitsData(resultSplits, resultSplitsMain) {
	const splits = compact(uniq((resultSplits || [])[0]?.splits).sort());
	const mainSplits = compact(uniq((resultSplitsMain || [])[0]?.splits).sort());
	return { splits, mainSplits };
}

function getEventsData(results, players, groups, metricsGps) {
	const groupedById = groupBy(results, '_id');
	const eventData = {};
	const data = Object.entries(groupedById).map(([date, sessionsInDate]) => {
		const datasetObj = { label: date, values: {} };

		eventData[date] = {
			opponent: sessionsInDate[0].eventOpponent,
			result: sessionsInDate[0].eventResult,
			home: sessionsInDate[0].eventHome
		};

		const groupedByEvent = groupBy(
			sessionsInDate.filter(({ eventId }) => eventId),
			'eventId'
		);

		Object.values(groupedByEvent).forEach(sessionsInGroup => {
			const sessionsForActivePlayers = sessionsInGroup.filter(
				({ playerId, eventStart }) => !isPlayerArchivedForDate(players, playerId, eventStart)
			);
			const sessions = sortBy(sessionsForActivePlayers, 'eventStart');

			const playersIds = uniq(sessionsForActivePlayers.map(({ playerId }) => String(playerId)));
			groups.forEach(group => {
				if (intersection(group.players, playersIds).length > 0) {
					const sessionsForGroup = sessions.filter(({ playerId }) => group.players.includes(String(playerId)));

					const groupSession = {
						_id: sessions[0]._id,
						date: sessions[0]._id,
						eventId: sessions[0].eventId,
						playerId: group.id,
						playerName: group.name,
						...metricsGps.reduce((acc, metric) => ({ ...acc, [metric]: meanBy(sessionsForGroup, metric) }), {})
					};

					sessions.push(groupSession);
					playersIds.push(group.id);
				}
			});

			datasetObj.values = {
				...datasetObj.values,
				...metricsGps.reduce(
					(acc, metric) => ({
						...acc,
						[metric]: [...(datasetObj.values[metric] || []), meanBy(sessions, metric)]
					}),
					{}
				)
			};
		});

		return datasetObj;
	});

	return {
		data,
		eventData
	};
}

function isGroup(group) {
	return group && group.name && group.playerIds;
}

function getNorm(value, thresholdValue) {
	return value / (thresholdValue || 1);
}

function getSemaphore(value, thresholdValue) {
	const norm = getNorm(value, thresholdValue);
	return getColorText(norm);
}

function getColorText(value) {
	let colorText = '#acacac';
	if (value < 0.8) return '#acacac';
	else if (value >= 0.8 && value < 0.9) return '#CCCC00';
	else if (value >= 0.9 && value < 1.1) colorText = '#008e4a';
	else if (value >= 1.1 && value < 1.2) colorText = '#e4970c';
	else colorText = '#9e0f0f';
	return colorText;
}

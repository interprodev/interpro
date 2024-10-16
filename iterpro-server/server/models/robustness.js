const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');
const momentRange = require('moment-range');
momentRange.extendMoment(moment);
const { mean, meanBy, sumBy } = require('lodash');

module.exports = function (Robustness) {
	Robustness.getRobustnessData = async function (playerIds, minutesField, dateFrom, dateTo, teamId, type) {
		try {
			const individualFlag = type === 'ALL' ? null : type === 'INDIVIDUAL';
			const counters$ = Robustness.getCounters(teamId, dateFrom, dateTo, type, individualFlag);
			const allEvents$ = Robustness.getStatistics(teamId, playerIds, dateFrom, dateTo, minutesField);
			const injuries$ = Robustness.getInjuries(playerIds, dateFrom, dateTo);
			const internationalGames$ = Robustness.getInternationalGames(teamId, dateFrom, dateTo);

			const [{ countTrainings, countGames, countGamesMinutes }, allEvents, injuries, internationalGames] =
				await Promise.all([counters$, allEvents$, injuries$, internationalGames$]);

			const dayInjuriesMap = {};
			const response = {};
			const playerResults = {};
			for (const playerId of playerIds) {
				playerResults[playerId] = getEmptyDataForPlayer();
				response[playerId] = {};
			}

			const events = sortByDate(
				allEvents.filter(({ individual }) => type === 'ALL' || individual === individualFlag),
				'start'
			);

			// metrics based on injuries
			for (const injury of injuries) {
				const playerId = injury.playerId.toString();
				const start = moment(injury.date).isBefore(moment(dateFrom)) ? dateFrom : injury.date;
				const end = getInjuryEndDate(injury, dateFrom, dateTo);
				playerResults[playerId].injuriesNumber += 1;
				const injMonthBreakdownSingle = {
					date: injury.date,
					endDate: end,
					issue: injury.issue,
					location: injury.location,
					osics: injury.osics,
					_injuryAssessments: []
				};
				playerResults[playerId].daysAbsence += getInjuryAbsenceDays(injury, dateFrom, dateTo);
				// count injury with issue injury and also the duration
				if (injury.issue === 'medical.infirmary.details.issue.injury') {
					playerResults[playerId].severityInjuries += 1;
					const healedEndDate =
						injury.currentStatus === 'medical.infirmary.details.statusList.healed' && injury.endDate
							? injury.endDate
							: moment().startOf('day').toDate();
					playerResults[playerId].durationSeverityInjuries += moment(healedEndDate).diff(moment(injury.date), 'days');
					playerResults[playerId].injurySeverity =
						playerResults[playerId].durationSeverityInjuries !== 0
							? playerResults[playerId].durationSeverityInjuries / playerResults[playerId].severityInjuries
							: 0;
					if (injury.reinjury) {
						playerResults[playerId].reinjuries += 1;
						playerResults[playerId].reinjuryRate =
							playerResults[playerId].reinjuries / playerResults[playerId].injuriesNumber;
					}
				}
				const rangeInjury = moment.range(start, end);
				const daysArray = Array.from(rangeInjury.by('days'));
				// for every day of injury count the days for illness,injury and compliant type
				daysArray.forEach(x => {
					const dateFormat = moment(x).format('DD/MM/YYYY');
					let key;

					switch (injury.issue) {
						case 'medical.infirmary.details.issue.illness': {
							key = 'illness';
							playerResults[playerId].daysIllness += 1;
							break;
						}
						case 'medical.infirmary.details.issue.injury': {
							key = 'injury';
							playerResults[playerId].daysInjury += 1;
							break;
						}
						case 'medical.infirmary.details.issue.complaint': {
							key = 'complaint';
							playerResults[playerId].daysComplaint += 1;
							break;
						}
					}

					if (!(dateFormat in dayInjuriesMap)) {
						dayInjuriesMap[dateFormat] = key;
					} else {
						playerResults[playerId][`days${dayInjuriesMap[dateFormat]}`] -= 1;
						dayInjuriesMap[dateFormat] = key;
					}
				});

				let status;
				const assessments = sortByDate(injury._injuryAssessments, 'date');
				if (assessments.length > 0) {
					// for every assessment, calculate the duration in days. Also calculate for every day the availability based on what assessment are active for that day
					assessments
						.filter(({ date }) => date)
						.forEach((assessment, index) => {
							const nextAssessment =
								index + 1 in assessments && assessments[index + 1].date ? assessments[index + 1] : { date: end };
							injMonthBreakdownSingle._injuryAssessments.push({
								date: assessment.date,
								endDate: nextAssessment.date,
								available: assessment.available
							});
							const assessmentDays = Array.from(moment.range(assessment.date, nextAssessment.date).by('days'));
							assessmentDays.forEach(day => {
								const formattedDate = moment(day).format('DD/MM/YYYY');
								playerResults[playerId].daysAssessmentArrayMap[formattedDate] = [
									...(playerResults[playerId].daysAssessmentArrayMap[formattedDate] || []),
									assessment
								];
								// se non è presente nulla per giorno corrente: salvo liscio e incremento counter
								if (!(formattedDate in playerResults[playerId].daysAssessmentMap)) {
									playerResults[playerId].daysAssessmentMap[formattedDate] = assessment.available;
									playerResults[playerId][`daysAvailable${assessment.available}`] += 1;
								} else {
									// se è presente già qualcosa
									// incremento solo se peggioro rispetto a quello che sta già presente: no > careful > yes
									const oldStatus = playerResults[playerId].daysAssessmentMap[formattedDate];
									const newStatus = assessment.available;
									if (getAssessmentStatusValue(newStatus) > getAssessmentStatusValue(oldStatus)) {
										playerResults[playerId][`daysAvailable${oldStatus}`] += 1;
										playerResults[playerId][`daysAvailable${newStatus}`] += 1;
										playerResults[playerId].daysAssessmentMap[formattedDate] = newStatus;
									}
								}
							});
							if (index === 0 && assessment.available !== 'yes' && !moment().isSame(injury.endDate, 'day')) {
								status = assessment;
							}
						});
					playerResults[playerId].healthStatusReadiness = getPlayerHealthStatus(status, injury);
				} else {
					daysArray.forEach(date => {
						const dateFormat = moment(date).format('DD/MM/YYYY'); // Calculate every day that has not assessments and so it's available
						if (!(dateFormat in playerResults[playerId].daysAssessmentMap)) {
							playerResults[playerId].daysAssessmentMap[dateFormat] = 'yes';
						}
					});
				}

				const allDays = Math.round(moment(dateTo).diff(moment(dateFrom), 'days', '[]'));
				const breakDownInjuriesPercent = (playerResults[playerId].daysInjury / allDays) * 100;
				const breakDownIllnessPercent = (playerResults[playerId].daysIllness / allDays) * 100;
				const breakDownComplaintPercent = (playerResults[playerId].daysComplaint / allDays) * 100;
				playerResults[playerId].breakdown = {
					injured: breakDownInjuriesPercent,
					illness: breakDownIllnessPercent,
					complaint: breakDownComplaintPercent,
					fit: 100 - (breakDownInjuriesPercent + breakDownIllnessPercent + breakDownComplaintPercent)
				};

				const breakDownAssNotAvailable = (playerResults[playerId].daysAvailableno / allDays) * 100;
				const breakDownAssCareful = (playerResults[playerId].daysAvailablecareful / allDays) * 100;
				playerResults[playerId].breakdownStatus = {
					notAvailable: breakDownAssNotAvailable,
					beCareful: breakDownAssCareful,
					available: 100 - (breakDownAssNotAvailable + breakDownAssCareful)
				};
				playerResults[playerId].injuryMonthBreakDown.push(injMonthBreakdownSingle);
			}

			// metrics based on game stats
			for (const event of events) {
				for (const playerId of playerIds) {
					playerResults[playerId] = {
						...playerResults[playerId],
						...getStatsFromEventFormat(event, playerId, playerResults[playerId], internationalGames, minutesField)
					};

					playerResults[playerId].daysPerGame = getDaysPerGame(playerResults[playerId].counters);
					playerResults[playerId].gameAvailability = getAvailability(
						countGames,
						playerResults[playerId].gameAvailabilityCalled
					);
					playerResults[playerId].trainingAvailability = getAvailability(
						countTrainings,
						playerResults[playerId].trainingAvailabilityCalled
					);
					playerResults[playerId].availability = getTotalAvailability(
						countGames,
						countTrainings,
						playerResults[playerId]
					);
					playerResults[playerId].gameMissed = countGames - playerResults[playerId].gameCalled;
					playerResults[playerId].trainingPercentCalled =
						(playerResults[playerId].trainingMinutesPlayed / playerResults[playerId].trainingMinutesDuration) * 100;
					playerResults[playerId].gamePercentCalled =
						(playerResults[playerId].minutesPlayed / playerResults[playerId].gameMinutesDuration) * 100;
					playerResults[playerId].sessionsMissed = countTrainings - playerResults[playerId].sessionsCalled;
					playerResults[playerId].gameRate = playerResults[playerId].minutesPlayed / 90;
					playerResults[playerId].robustness =
						(playerResults[playerId].gameAvailability * playerResults[playerId].trainingAvailability) / 100;
					playerResults[playerId].playingTime = getPlayingTime(
						playerResults[playerId].minutesPlayed,
						countGamesMinutes
					);
					playerResults[playerId].performanceReliability =
						(playerResults[playerId].gameAvailability * playerResults[playerId].playingTime) / 100;
					playerResults[playerId].countGames = countGames;
					playerResults[playerId].countTrainings = countTrainings;
				}
			}

			// grouping and cleaning
			for (const playerId of playerIds) {
				if (isGroup(playerId)) {
					const resultsInGroup = playerResults.filter(x => playerId.playerIds.includes(x));
					const groupResults = {
						substitutingApps: meanBy(resultsInGroup, 'substitutingApps'),
						// daysAbsence: meanBy(resultsInGroup, 'daysAbsence'),
						daysPerGame: meanBy(resultsInGroup, 'daysPerGame'),
						gameRate: meanBy(resultsInGroup, 'gameRate'),
						robustness: meanBy(resultsInGroup, 'robustness'),
						healthStatus: null,
						healthStatusReadiness: null,
						apps: meanBy(resultsInGroup, 'apps'),
						minutesPlayed: meanBy(resultsInGroup, 'minutesPlayed'),
						availability: meanBy(resultsInGroup, 'availability'),
						gameAvailability: meanBy(resultsInGroup, 'gameAvailability'),
						trainingAvailability: meanBy(resultsInGroup, 'trainingAvailability'),
						gameMissed: meanBy(resultsInGroup, 'gameMissed'),
						countGames: meanBy(resultsInGroup, 'countGames'),
						countGamesMinutes: meanBy(resultsInGroup, 'countGamesMinutes'),
						countTrainingsMinutes: meanBy(resultsInGroup, 'countTrainingsMinutes'),
						countAllMinutes: meanBy(resultsInGroup, 'countAllMinutes'),
						playingTime: meanBy(resultsInGroup, 'playingTime'),
						performanceReliability: meanBy(resultsInGroup, 'performanceReliability'),
						sessionsMissed: meanBy(resultsInGroup, 'sessionsMissed'),
						injuriesNumber: sumBy(resultsInGroup, 'injuriesNumber'),
						injurySeverity: 0,
						reinjuryRate: meanBy(resultsInGroup, 'reinjuryRate'),
						breakdownStatus: {},
						breakdown: {},
						gamesMissedInjuries: sumBy(resultsInGroup, 'gamesMissedInjuries'),
						trainingsMissedInjuries: sumBy(resultsInGroup, 'trainingsMissedInjuries'),
						gamesMissedInternational: sumBy(resultsInGroup, 'gamesMissedInternational'),
						trainingsMissedInternational: sumBy(resultsInGroup, 'trainingsMissedInternational'),
						gamesMissedOthers: sumBy(resultsInGroup, 'gamesMissedOthers'),
						trainingsMissedOthers: sumBy(resultsInGroup, 'trainingsMissedOthers'),
						daysAbsence: sumBy(resultsInGroup, 'daysAbsence')
					};
					const breakdownGroup = {};
					const appsBySubFormatGroup = {};
					const minutesPlayedBySubFormatGroup = {};
					for (const result of resultsInGroup) {
						for (const keyBreak in result.periodBreakDown) {
							if (!(keyBreak in breakdownGroup)) breakdownGroup[keyBreak] = 0;
							breakdownGroup[keyBreak] += result.periodBreakDown[keyBreak];
						}
						for (const keyApps in result.appsBySubFormat) {
							if (!(keyApps in appsBySubFormatGroup)) appsBySubFormatGroup[keyApps] = 0;
							appsBySubFormatGroup[keyApps] += result.appsBySubFormat[keyApps];
						}
						for (const keyMinutes in result.minutesPlayedBySubFormat) {
							if (!(keyMinutes in minutesPlayedBySubFormatGroup)) minutesPlayedBySubFormatGroup[keyMinutes] = 0;
							minutesPlayedBySubFormatGroup[keyMinutes] += result.minutesPlayedBySubFormat[keyMinutes];
						}
					}
					groupResults.periodBreakDown = breakdownGroup;
					groupResults.appsBySubFormat = appsBySubFormatGroup;
					groupResults.minutesPlayedBySubFormat = minutesPlayedBySubFormatGroup;
					response[playerId.name] = groupResults;
				} else {
					// const playerData = playerCalculatedData.find(data => data.playerId.toString() == playerId.toString());
					// const robustnessData = playerData && playerData.robustnessData ? playerData.robustnessData.find(data => data.teamSeasonId.toString() == teamSeasonId.toString()) : null;
					// response[playerId.toString()] = robustnessData && robustnessData.robustness ? robustnessData.robustness[individualPropertyValue] : emptyRobustnessResult;
					if (!playerResults[playerId].breakdownStatus.available)
						playerResults[playerId].breakdownStatus = {
							notAvailable: 0,
							beCareful: 0,
							available: 100
						};
					if (!playerResults[playerId].breakdown.fit)
						playerResults[playerId].breakdown = {
							injured: 0,
							illness: 0,
							complaint: 0,
							fit: 100
						};

					delete playerResults[playerId].daysAssessmentMap;
					delete playerResults[playerId].daysAssessmentArrayMap;
					delete playerResults[playerId].counters;
					response[playerId] = copyResults(playerResults[playerId]);
				}
			}
			// }

			return response;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Robustness.getCounters = async function (teamId, dateFrom, dateTo, type, individualFlag) {
		const eventCollection = Robustness.app.models.Event.getDataSource().connector.collection(
			Robustness.app.models.Event.modelName
		);
		try {
			const pipelineCountApps = pipelineStagesMatchesCount(teamId, dateFrom, dateTo);
			const events = await eventCollection.aggregate(pipelineCountApps).toArray();
			const countTrainings = events
				.filter(({ individual }) => type === 'ALL' || individual === individualFlag)
				.filter(({ format }) => format === 'training').length;
			const countGames = events
				.filter(({ individual }) => type === 'ALL' || individual === individualFlag)
				.filter(({ format }) => format === 'game').length;
			const countGamesMinutes = events
				.filter(({ individual }) => type === 'ALL' || individual === individualFlag)
				.filter(({ format }) => format === 'game')
				.reduce((a, { duration }) => a + (duration || 0), 0);
			return { countTrainings, countGames, countGamesMinutes };
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Robustness.getStatistics = async function (teamId, playerIds, dateFrom, dateTo, minutesField, individual) {
		const eventCollection = Robustness.app.models.Event.getDataSource().connector.collection(
			Robustness.app.models.Event.modelName
		);
		try {
			const pipelineApps = pipelineStagesProfileRobustnessApps(
				teamId,
				playerIds,
				dateFrom,
				dateTo,
				minutesField,
				individual
			);
			return await eventCollection.aggregate(pipelineApps).toArray();
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Robustness.getInjuries = async function (playerIds, dateFrom, dateTo) {
		const injuryCollection = Robustness.app.models.Injury.getDataSource().connector.collection(
			Robustness.app.models.Injury.modelName
		);
		try {
			const injuries = await injuryCollection
				.find(
					{
						playerId: { $in: playerIds.map(playerId => ObjectID(playerId)) },
						date: { $lte: dateTo },
						$or: [{ endDate: null }, { endDate: { $gte: dateFrom } }]
					},
					{
						$project: {
							_id: 1,
							date: 1,
							issue: 1,
							location: 1,
							endDate: 1,
							currentStatus: 1,
							_injuryAssessments: 1
						}
					}
				)
				.toArray();
			return injuries;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Robustness.getInternationalGames = async function (teamId, dateFrom, dateTo) {
		const eventCollection = Robustness.app.models.Event.getDataSource().connector.collection(
			Robustness.app.models.Event.modelName
		);
		try {
			const events = await eventCollection
				.aggregate([
					{
						$match: {
							teamId: ObjectID(teamId),
							format: 'international',
							start: {
								$gte: dateFrom,
								$lte: dateTo
							}
						}
					},
					{ $project: { start: 1, format: 1, individual: 1, playerIds: 1 } }
				])
				.toArray();
			return events;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};
};

// --- HELPERS ---

function pipelineStagesProfileRobustnessApps(teamId, playerIds, dateFrom, dateTo, minutesField, individual) {
	const pipelineStages = [];
	const matchStage = {
		$match: {
			teamId: ObjectID(teamId),
			format: {
				$in: [
					'general',
					'travel',
					'game',
					'medical',
					'assessment',
					'international',
					'administration',
					'off',
					'training'
				]
			},
			start: { $gte: dateFrom, $lte: dateTo }
		}
	};
	const projectStage = {
		$project: {
			format: 1,
			subformat: 1,
			theme: 1,
			start: 1,
			end: 1,
			playerIds: 1,
			individual: 1,
			duration: 1,
			_playerMatchStats: {
				$filter: {
					input: '$_playerMatchStats',
					as: 'itempmatch',
					cond: {
						$and: [
							{
								$or: [
									{ $in: ['$$itempmatch.playerId', playerIds] },
									{ $in: ['$$itempmatch.playerId', playerIds.map(playerId => ObjectID(playerId))] }
								]
							},
							{ $gt: ['$$itempmatch.minutesPlayed', 0] }
						]
					}
				}
			},
			result: 1,
			resultFlag: 1
		}
	};
	const project2Filter = {
		format: 1,
		subformat: 1,
		theme: 1,
		start: 1,
		end: 1,
		duration: 1,
		individual: 1,
		playerIds: 1,
		// '_playerStats._id': 1,
		// '_playerStats.playerId': 1,
		'_playerMatchStats._id': 1,
		'_playerMatchStats.playerId': 1,
		'_playerMatchStats.minutesPlayed': 1,
		'_playerMatchStats.substituteInMinute': 1,
		result: 1,
		resultFlag: 1
	};
	// const projectString2 = '_playerStats.' + minutesField;
	// project2Filter[projectString2] = 1;
	const projectStage2 = { $project: project2Filter };

	pipelineStages.push(matchStage);
	// pipelineStages.push(lookupStage);
	// pipelineStages.push(unwindStage2);
	pipelineStages.push(projectStage);
	pipelineStages.push(projectStage2);

	return pipelineStages;
}

function pipelineStagesMatchesCount(teamId, dateFrom, dateTo) {
	return [
		{
			$match: {
				teamId: ObjectID(teamId),
				format: { $in: ['game', 'training'] },
				start: { $gte: dateFrom, $lte: dateTo }
			}
		},
		{ $project: { format: 1, duration: 1, individual: 1 } }
	];
}

function diffDays(date1, date2) {
	return moment(date1).diff(moment(date2), 'day');
}

function isEventMissedForInternationalDuty(playerId, event, internationalGames) {
	// TODO: optimize query or data structure for this
	const duties = internationalGames.filter(
		game =>
			moment(event.start).isSameOrBefore(moment()) &&
			moment(event.start).isBetween(moment(game.start), moment(game.end), 'day', '[]') &&
			game.playerIds.find(x => x.toString() === playerId.toString())
	);
	return duties.length > 0;
}

function getPlayerAvailabilityAtDate(event, daysAssessmentArrayMap) {
	const startDate = moment(event.start).format('DD/MM/YYYY');
	const assessmentAtDay = startDate in daysAssessmentArrayMap ? daysAssessmentArrayMap[startDate] : null;
	let isAvailableAtDate = true;
	if (assessmentAtDay && assessmentAtDay.length > 0) {
		for (const assessment of assessmentAtDay) {
			if (assessment.available === 'no' && moment(assessment.date).isBefore(moment(event.start)))
				isAvailableAtDate = false;
		}
	}
	return isAvailableAtDate;
}

function getEmptyDataForPlayer() {
	return {
		apps: 0, // attendances statistics, compare players, admin dashboard
		appsBySubFormat: {}, // attendances statistics
		availability: 0, // attendances statistics, admin dashboard, compare players, robustness, admin financial
		breakdown: {
			injured: 0,
			illness: 0,
			complaint: 0,
			fit: 100
		}, // attendance statistics, robustness
		breakdownStatus: {
			notAvailable: 0,
			beCareful: 0,
			available: 100
		}, // robustness
		countAllMinutes: 0,
		counters: [],
		countTrainings: 0, // robustness
		countGames: 0, // robustness
		daysAbsence: 0, // compare players
		daysAssessmentArrayMap: {},
		daysAssessmentMap: {},
		daysAvailablecareful: 0,
		daysAvailableno: 0,
		daysComplaint: 0,
		daysIllness: 0,
		daysInjury: 0,
		daysPerGame: 0, // attendance statistics
		durationSeverityInjuries: 0,
		gameAvailability: 0, // attendance statistics
		gameAvailabilityCalled: 0,
		gameCalled: 0,
		gameMinutesDuration: 0,
		gameMinutesInvestment: 0, // admin financial
		gameMinutesLosses: 0, // admin financial
		gameMinutesRoi: 0, // admin financial
		gameMinutesUntapped: 0, // admin financial
		gameMissed: 0, // compare players, medical statistics, robustness
		gamePercentCalled: 0, // attendances statistics
		gameRate: 0, // attendances statistics, player card, compare players,
		gamesMissedInjuries: 0, // attendances statistics, robustness
		gamesMissedInternational: 0, // attendances statistics
		gamesMissedOthers: 0, // attendances statistics
		healthStatus: null, // player card, event viewer, daily treatment, readiness, robustness,
		healthStatusReadiness: 'fit', // admin dashboard
		heavyGoal: 0, // admin dashboard
		injuriesNumber: 0, // admin dashboard, robustness
		injuryMonthBreakDown: [], // robustness
		injurySeverity: 0, // compare players, robustness
		minutesPlayed: 0, // attendances statistics, admin dashboard, admin financial
		minutesPlayedBySubFormat: {}, // attendances statistics
		performanceReliability: 0, // attendances statistics, admin dashboard, player card, compare players, admin financial
		periodBreakDown: {}, // attendances statistics
		periodBreakDownMinutes: {}, // attendances statistics
		playingTime: 0, // attendances statistics, compare players, admin financial,
		reinjuries: 0,
		reinjuryRate: 0, // medical statistics, compare players, robustness,
		robustness: 0, // player card, attendnaces statistics, compare players
		sessionsCalled: 0,
		sessionsMissed: 0, // compare players
		severityInjuries: 0,
		startingApps: 0, // attendances statistics
		substitutingApps: 0, // attendances statistics
		trainingAvailability: 0, // attendances statistics
		trainingAvailabilityCalled: 0,
		trainingMinutesDuration: 0,
		trainingMinutesPlayed: 0,
		trainingPercentCalled: 0, // attendances statistics
		trainingsMissedInjuries: 0, // attendances statistics, robustness,
		trainingsMissedInternational: 0, // attendances statistics
		trainingsMissedOthers: 0 // attendance statistics
	};
}

function getInjuryAbsenceDays(injury, dateFrom, dateTo) {
	let daysAbsenceToAdd = 0;
	if (moment(injury.date).isSameOrAfter(moment(dateFrom))) {
		if (!injury.endDate || (injury.endDate && moment(injury.endDate).isAfter(dateTo))) {
			daysAbsenceToAdd = diffDays(moment(dateTo).toDate(), moment(injury.date).toDate());
		} else {
			daysAbsenceToAdd = diffDays(moment(injury.endDate).toDate(), moment(injury.date).toDate());
		}
	} else {
		if (!injury.endDate || (injury.endDate && moment(injury.endDate).isAfter(dateTo))) {
			daysAbsenceToAdd = diffDays(moment(dateTo).toDate(), moment(dateFrom).toDate());
		} else {
			daysAbsenceToAdd = diffDays(moment(injury.endDate).toDate(), moment(dateFrom).toDate());
		}
	}
	return daysAbsenceToAdd;
}

function getInjuryEndDate(injury, dateFrom, dateTo) {
	if (!injury.endDate || (injury.endDate && moment(injury.endDate).isAfter(dateTo))) {
		return dateTo;
	} else return injury.endDate;
}

function getPlayerHealthStatus(status, injury) {
	if (injury.currentStatus !== 'medical.infirmary.details.statusList.healed') {
		if (status && status.available !== 'yes') {
			if (status.available === 'no') return 'notAvailable';
			else if (status.available === 'careful') return 'careful';
		} else {
			if (injury.issue === 'medical.infirmary.details.issue.injury') return 'injury';
			else if (injury.issue === 'medical.infirmary.details.issue.complaint') return 'complaint';
			else if (injury.issue === 'medical.infirmary.details.issue.illness') return 'illness';
		}
	}
}

function getGroupedStats(event) {
	const groupedStats = {};
	// for (const stat of event._playerStats || []) {
	// 	if (!(stat.playerId in groupedStats)) {
	// 		groupedStats[stat.playerId] = { _playerStat: null, _playerMatchStat: null };
	// 	}
	// 	groupedStats[stat.playerId]._playerStat = stat;
	// }
	for (const stat of event._playerMatchStats || []) {
		if (!(stat.playerId in groupedStats)) {
			groupedStats[stat.playerId] = { _playerStat: null, _playerMatchStat: null };
		}
		groupedStats[stat.playerId]._playerMatchStat = stat;
	}
	return groupedStats;
}

function getMinutesPlayed(playerData, minutesField) {
	return playerData._playerMatchStat && playerData._playerMatchStat.minutesPlayed
		? playerData._playerMatchStat.minutesPlayed
		: 0;
	// : playerData._playerStat && playerData._playerStat[minutesField]
	// 	? playerData._playerStat[minutesField]
	// 	: 0;
}

function updateMinutesPlayedBySubformat(subformat, minutesPlayedBySubFormat, minutesToAdd) {
	if (!(subformat in minutesPlayedBySubFormat)) minutesPlayedBySubFormat[subformat] = 0;
	minutesPlayedBySubFormat[subformat] += minutesToAdd;
	return minutesPlayedBySubFormat[subformat];
}

function updateAppBySubformat(subformat, appsBySubformat) {
	if (!(subformat in appsBySubformat)) appsBySubformat[subformat] = 0;
	appsBySubformat[subformat] += 1;
	return appsBySubformat[subformat];
}

function updatePeriodBreakdown(format, subformat, periodBreakdown) {
	if (format === 'game' && subformat === 'friendly') format = 'friendly';
	if (!(format in periodBreakdown)) periodBreakdown[format] = 0;
	periodBreakdown[format] += 1;
	return periodBreakdown[format];
}

function updatePeriodBreakdownMinutes(format, periodBreakdownMinutes, duration) {
	if (!(format in periodBreakdownMinutes)) periodBreakdownMinutes[format] = 0;
	periodBreakdownMinutes[format] += duration;
	return periodBreakdownMinutes[format];
}

function extractSubstitutionData(game, playerId) {
	const stat = (game._playerMatchStats || []).find(x => x.playerId.toString() === playerId.toString());
	return stat
		? { starting: stat.minutesPlayed && !stat.substituteInMinute, notStarting: stat.substituteInMinute }
		: null;
}

function updateSubstitutionData(event, playerId, playerResults) {
	const substitutionData = extractSubstitutionData(event, playerId);
	if (substitutionData && (substitutionData.starting || substitutionData.notStarting)) {
		playerResults.counters = [...playerResults.counters, event];
		playerResults.startingApps += substitutionData.starting ? 1 : 0;
		playerResults.substitutingApps += substitutionData.notStarting ? 1 : 0;
	}
	return playerResults;
}

function hasPlayerCalledUp(event, playerId) {
	return (event.playerIds || []).find(id => String(id) === String(playerId));
}

function getStatsFromEventFormat(event, playerId, playerResults, internationalGames, minutesField) {
	const isAvailableAtDateFromInjury = getPlayerAvailabilityAtDate(event, playerResults.daysAssessmentArrayMap);
	const isNotAvailableForInternationalDuty = isEventMissedForInternationalDuty(playerId, event, internationalGames);
	switch (event.format) {
		case 'training': {
			playerResults.trainingMinutesDuration += event.duration;
			playerResults.trainingAvailabilityCalled += isAvailableAtDateFromInjury ? 1 : 0;
			if (hasPlayerCalledUp(event, playerId)) {
				const breakDownFormat = event.theme === 'gym' ? 'gym' : 'training';

				playerResults.sessionsCalled++;
				playerResults.trainingMinutesPlayed += event.duration;
				playerResults.periodBreakDown[breakDownFormat] = updatePeriodBreakdown(
					breakDownFormat,
					null,
					playerResults.periodBreakDown
				);
				playerResults.periodBreakDownMinutes[breakDownFormat] = updatePeriodBreakdownMinutes(
					breakDownFormat,
					playerResults.periodBreakDownMinutes,
					event.duration
				);
			} else {
				if (!isAvailableAtDateFromInjury) playerResults.trainingsMissedInjuries += 1;
				else if (isNotAvailableForInternationalDuty) playerResults.trainingsMissedInternational += 1;
				else playerResults.trainingsMissedOthers += 1;
			}
			break;
		}
		case 'game': {
			playerResults = {
				...playerResults,
				...getStatsFromBasicInfo(event, playerId, playerResults, minutesField)
			};
			playerResults.gameMinutesInvestment += event.duration;
			playerResults.gameAvailabilityCalled += isAvailableAtDateFromInjury ? 1 : 0;
			if (hasPlayerCalledUp(event, playerId)) {
				playerResults.gameCalled++;
				playerResults.gameMinutesDuration += event.duration;
				playerResults.gameMinutesRoi += event.duration;
				playerResults.periodBreakDown[event.subformat === 'friendly' ? 'friendly' : 'game'] = updatePeriodBreakdown(
					event.format,
					event.subformat,
					playerResults.periodBreakDown
				);
				playerResults.periodBreakDownMinutes[event.format] = updatePeriodBreakdownMinutes(
					event.format,
					playerResults.periodBreakDownMinutes,
					event.duration
				);
			} else {
				if (!isAvailableAtDateFromInjury) {
					playerResults.gameMinutesLosses += event.duration;
					playerResults.gamesMissedInjuries += 1;
				} else {
					playerResults.gameMinutesUntapped += event.duration;
					if (isNotAvailableForInternationalDuty) playerResults.gamesMissedInternational += 1;
					else playerResults.gamesMissedOthers += 1;
				}
			}
			playerResults = {
				...playerResults,
				...updateSubstitutionData(event, playerId, playerResults)
			};
			break;
		}
		default: {
			if (hasPlayerCalledUp(event, playerId)) {
				playerResults.periodBreakDown[event.format] = updatePeriodBreakdown(
					event.format,
					null,
					playerResults.periodBreakDown
				);
				playerResults.periodBreakDownMinutes[event.format] = updatePeriodBreakdownMinutes(
					event.format,
					playerResults.periodBreakDownMinutes,
					event.duration
				);
			}
			break;
		}
	}
	return playerResults;
}

function getStatsFromBasicInfo(event, playerId, playerResults, minutesField) {
	const groupedStats = getGroupedStats(event);
	const playerData = groupedStats[playerId];
	if (
		playerData &&
		// playerData._playerStat ||
		playerData._playerMatchStat
	) {
		if (event.resultFlag) playerResults.heavyGoal += 3;
		else if (event.resultFlag === null) playerResults.heavyGoal += 1;
		playerResults.apps += 1;
		playerResults.appsBySubFormat[event.subformat] = updateAppBySubformat(
			event.subformat,
			playerResults.appsBySubFormat
		);
		const minutesPlayed = getMinutesPlayed(playerData, minutesField);
		playerResults.minutesPlayed += minutesPlayed;
		playerResults.minutesPlayedBySubFormat[event.subformat] = updateMinutesPlayedBySubformat(
			event.subformat,
			playerResults.minutesPlayedBySubFormat,
			minutesPlayed
		);
	}
	return playerResults;
}

function getDaysBetweenEachMatch(match, index, array) {
	if (index < array.length - 1) {
		return (
			moment(array[index + 1].start)
				.startOf('day')
				.diff(moment(match.start).startOf('day'), 'days') - 1
		);
	}
}

function getDaysPerGame(counters) {
	const daysBetweenEachMatch = (counters || []).map((match, index, array) =>
		getDaysBetweenEachMatch(match, index, array)
	);
	const spliced = daysBetweenEachMatch.slice(0, daysBetweenEachMatch.length - 1);
	return mean(spliced) || 0;
}

function getAvailability(count, stat) {
	return count > 0 ? (stat / count) * 100 : 0;
}

function getTotalAvailability(countGames, countTrainings, playerResults) {
	return countGames + countTrainings > 0
		? ((playerResults.gameAvailabilityCalled + playerResults.trainingAvailabilityCalled) /
				(countGames + countTrainings)) *
				100
		: 0;
}

function getPlayingTime(minutesPlayed, countGamesMinutes) {
	const playingTime = (minutesPlayed / countGamesMinutes) * 100;
	return playingTime > 100 ? 100 : playingTime;
}

function getEmptyResult() {
	return {
		apps: 0, // attendances statistics, compare players, admin dashboard
		appsBySubFormat: {}, // attendances statistics
		availability: 0, // attendances statistics, admin dashboard, compare players, robustness, admin financial
		breakdown: {
			injured: 0,
			illness: 0,
			complaint: 0,
			fit: 100
		}, // attendance statistics, robustness
		breakdownStatus: {
			notAvailable: 0,
			beCareful: 0,
			available: 100
		}, // robustness
		countTrainings: 0, // robustness
		countGames: 0, // robustness
		daysAbsence: 0, // compare players
		daysPerGame: 0, // attendance statistics
		durationSeverityInjuries: 0,
		gameAvailability: 0, // attendance statistics
		gameMinutesInvestment: 0, // admin financial
		gameMinutesLosses: 0, // admin financial
		gameMinutesRoi: 0, // admin financial
		gameMinutesUntapped: 0, // admin financial
		gameMissed: 0, // compare players, medical statistics, robustness
		gamePercentCalled: 0, // attendances statistics
		gameRate: 0, // attendances statistics, player card, compare players,
		gamesMissedInjuries: 0, // attendances statistics, robustness
		gamesMissedInternational: 0, // attendances statistics
		gamesMissedOthers: 0, // attendances statistics
		healthStatus: null, // player card, event viewer, daily treatment, readiness, robustness,
		healthStatusReadiness: 'fit', // admin dashboard
		heavyGoal: 0, // admin dashboard
		injuriesNumber: 0, // admin dashboard, robustness
		injuryMonthBreakDown: [], // robustness
		injurySeverity: 0, // compare players, robustness
		minutesPlayed: 0, // attendances statistics, admin dashboard, admin financial
		minutesPlayedBySubFormat: {}, // attendances statistics
		performanceReliability: 0, // attendances statistics, admin dashboard, player card, compare players, admin financial
		periodBreakDown: {}, // attendances statistics
		periodBreakDownMinutes: {}, // attendances statistics
		playingTime: 0, // attendances statistics, compare players, admin financial,
		reinjuryRate: 0, // medical statistics, compare players, robustness,
		robustness: 0, // player card, attendnaces statistics, compare players
		sessionsCalled: 0,
		sessionsMissed: 0, // compare players
		startingApps: 0, // attendances statistics
		substitutingApps: 0, // attendances statistics
		trainingAvailability: 0, // attendances statistics
		trainingPercentCalled: 0, // attendances statistics
		trainingsMissedInjuries: 0, // attendances statistics, robustness,
		trainingsMissedInternational: 0, // attendances statistics
		trainingsMissedOthers: 0 // attendance statistics
	};
}

function copyResults(playerResults) {
	const response = getEmptyResult();
	Object.keys(response).forEach(key => {
		if (playerResults[key]) response[key] = playerResults[key];
	});
	return response;
}

function getAssessmentStatusValue(status) {
	switch (status) {
		case 'careful':
			return 1;
		case 'no':
			return 2;
		case 'yes':
		default:
			return 0;
	}
}

function sortByDate(array, field) {
	return array.sort((a, b) => {
		return moment(a[field], 'DD/MM/YYYY').toDate().getTime() - moment(b[field], 'DD/MM/YYYY').toDate().getTime();
	});
}

function isGroup(gr) {
	return gr && gr.name && gr.playerIds;
}

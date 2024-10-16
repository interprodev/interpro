const moment = require('moment');
const { ObjectID } = require('mongodb');
const { meanBy, sum, sumBy, first, sortBy, groupBy, flatten, last } = require('lodash');
const {
	pushEventToAzureQueue,
	robustnessQueueName,
	getPayloadForQueue
} = require('../../common/modules/az-storage-queue');
const {
	getThresholdsIntervalColor,
	getThresholdsIntervalValue,
	getThresholdActiveValue
} = require('../../common/modules/thresholds-utils');
const {
	getAssetValueNew,
	getAmortizationFromContracts,
	getNetBookValue,
	getGainLoss,
	getGainLossPercentage,
	getPlayerValue,
	getTransferFee,
	getYearsInTeam,
	getYearsLastContracts,
	getTotalElementsAmountForSeasonNew,
	getAchievedBonusesAmount,
	getResidualBonusesAmount,
	getTotalInvestmentCostNew,
	getMonthsInTeam,
	getMonthsLastContracts,
	getPlayerPastValues,
	getContractLength,
	getAgentFeeFromSingleContractNew,
	getTotalConditionalElementsAmountForSeasonNew,
	getContractLengthMonths
} = require('../shared/financial-utils');
const emptyRobustnessResult = {
	apps: 0,
	appsBySubFormat: {},
	availability: 0,
	breakdown: {},
	breakdownStatus: {},
	countGames: 0,
	daysAbsence: 0,
	daysPerGame: 0,
	durationSeverityInjuries: 0,
	gameAvailability: 0,
	gameMinutesInvestment: 0,
	gameMinutesLosses: 0,
	gameMinutesRoi: 0,
	gameMinutesUntapped: 0,
	gameMissed: 0,
	gamePercentCalled: 0,
	gameRate: 0,
	gamesMissedInjuries: 0,
	gamesMissedInternational: 0,
	gamesMissedOthers: 0,
	healthStatus: null,
	healthStatusReadiness: 'fit',
	heavyGoal: 0,
	injuriesNumber: 0,
	injuryMonthBreakDown: [],
	injurySeverity: 0,
	minutesPlayed: 0,
	minutesPlayedBySubFormat: {},
	performanceReliability: 0,
	periodBreakDown: {},
	periodBreakDownMinutes: {},
	playingTime: 0,
	reinjuryRate: 0,
	robustness: 0,
	sessionsMissed: 0,
	startingApps: 0,
	substitutingApps: 0,
	teamSeasonId: null,
	trainingAvailability: 0,
	trainingPercentCalled: 0,
	trainingsMissedInjuries: 0,
	trainingsMissedInternational: 0,
	trainingsMissedOthers: 0
};

module.exports = function (ProfilePlayers) {
	ProfilePlayers.profileGameStats = async function (
		teamSeasonId,
		playerId,
		dateFrom,
		dateTo,
		metricsPlayerStats,
		isPrimaryTeam = true
	) {
		try {
			console.log(`[PROFILE PLAYERS] Getting Game Stats for player ${playerId}...`);
			const matchCollection = ProfilePlayers.app.models.Match.getDataSource().connector.collection(
				ProfilePlayers.app.models.Match.modelName
			);

			const pipelineProfileGameStats = getPipelineStagesProfileGameStats(
				playerId,
				dateFrom,
				dateTo,
				metricsPlayerStats
			);

			const matches = (await matchCollection.aggregate(pipelineProfileGameStats).toArray()).filter(result =>
				isPrimaryTeam ? result.format !== 'clubGame' : result.format === 'clubGame'
			);

			const metricsValues = {
				minutesPlayed: []
			};
			for (const metric of metricsPlayerStats) {
				metricsValues[metric] = [];
			}

			for (const match of matches) {
				metricsValues['minutesPlayed'].push(
					match.pmstats && 'minutesPlayed' in match.pmstats ? match.pmstats['minutesPlayed'] : 0
				);
				for (const metric of metricsPlayerStats) {
					metricsValues[metric].push(
						match._playerStats && metric in match._playerStats ? match._playerStats[metric] : 0
					);
				}
			}

			const avgMetrics = {};
			for (const metric in metricsValues) {
				avgMetrics[metric] = sum(metricsValues[metric]) / metricsValues[metric].length;
			}

			return { matches, avgMetrics };
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	ProfilePlayers.getPlayerFitnessProfile = async function (playerId, testIds, metrics) {
		const { teamId } = await ProfilePlayers.app.models.Player.findById(playerId, { fields: ['teamId'] });

		const testInstanceCollection = ProfilePlayers.app.models.TestInstance.getDataSource().connector.collection(
			ProfilePlayers.app.models.TestInstance.modelName
		);
		const pipelineProfileFitnessLastResults = getPipelineForLastTestResults(String(playerId));
		const pipelineProfileFitnessTimeline = getPipelineForTimelineChart(String(playerId), testIds, metrics);
		const [{ _thresholdsTests }, { metricsTests }, lastTestResults, timelineResults] = await Promise.all([
			ProfilePlayers.app.models.Player.findById(playerId, { fields: ['_thresholdsTests'] }),
			ProfilePlayers.app.models.Team.findById(teamId, { fields: ['metricsTests'] }),
			testInstanceCollection.aggregate(pipelineProfileFitnessLastResults).toArray(),
			testInstanceCollection.aggregate(pipelineProfileFitnessTimeline).toArray()
		]);

		const table = getLastResultsTableData(lastTestResults, metricsTests, _thresholdsTests);
		const timeline = getTimeLineChartData(timelineResults);
		const radar = getRadarChartData(table);

		return {
			radar,
			timeline,
			table,
			rawTimeline: timelineResults
		};
	};

	ProfilePlayers.profileMaintenance = async function (playerId, testIds) {
		try {
			console.log(`[PROFILE PLAYERS] Getting Maintenance data for player ${playerId}...`);
			const testInstanceCollection = ProfilePlayers.app.models.TestInstance.getDataSource().connector.collection(
				ProfilePlayers.app.models.TestInstance.modelName
			);

			const pipelineProfileMaintenance = getPipelineStagesProfileMaintenance(playerId, testIds);
			let resultTestInstances = await testInstanceCollection.aggregate(pipelineProfileMaintenance).toArray();
			resultTestInstances = resultTestInstances.filter(
				({ _testResults }) =>
					_testResults &&
					_testResults.length > 0 &&
					_testResults.some(({ results }) => results.some(({ rawValue }) => rawValue))
			);
			return resultTestInstances && resultTestInstances.length > 0 ? resultTestInstances : [];
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	ProfilePlayers.profileRobustness = async function (
		teamSeasonId,
		playerIds,
		dateFrom,
		dateTo,
		minutesField,
		individual,
		teamId
	) {
		try {
			console.log('[PROFILE PLAYERS] Getting Robustness data for players', playerIds);
			const playerCalculatedDataCollection =
				ProfilePlayers.app.models.PlayerCalculatedData.getDataSource().connector.collection(
					ProfilePlayers.app.models.PlayerCalculatedData.modelName
				);
			individual = !individual ? 0 : individual;
			const individualPropertyValue = individual == 0 ? 'ALL' : individual == 1 ? 'INDIVIDUAL' : 'NOTINDIVIDUAL';
			const filteredPlayerIds = playerIds.filter(playerId => !isGroup(playerId)).map(String);

			const groups = playerIds.filter(id => isGroup(id));
			for (const group of groups) {
				for (const playerId of group.playerIds) {
					filteredPlayerIds.push(String(playerId));
				}
			}

			let missingData = false;
			let playerCalculatedData = [];
			let response = {};

			if (teamSeasonId) {
				console.log(
					`\tRequested robustness data for the entire season ${teamSeasonId}. Searching for existing entries...`
				);
				const teamSeason = await ProfilePlayers.app.models.TeamSeason.findOne({
					where: { id: ObjectID(teamSeasonId) }
				});
				const teamData = await ProfilePlayers.app.models.Team.findOne(
					{ where: { id: ObjectID(teamSeason.teamId) } },
					{
						fields: [
							'id',
							'_gpsProviderMapping',
							'_playerProviderMapping',
							'name',
							'providerPlayer',
							'device',
							'providerTeam',
							'clubId'
						]
					}
				);
				playerCalculatedData = await playerCalculatedDataCollection
					.find({ playerId: { $in: filteredPlayerIds } })
					.toArray();

				const missingPlayerIds = filteredPlayerIds.filter(
					playerId => !hasRobustnessData(playerCalculatedData, playerId, teamSeasonId)
				);
				missingData = missingPlayerIds.length > 0;
				if (missingData) {
					console.warn('\tSome players have not robustness data. Requesting computation now...', missingPlayerIds);
					const queueServiceClient = Object.create(ProfilePlayers.app.queueClient);
					const robustnessQueueClient = queueServiceClient.getQueueClient(robustnessQueueName);
					// It's a PEOPLE event, it needs to set prefetchData before
					for (const playerId of missingPlayerIds) {
						const payload = getPayloadForQueue(robustnessQueueName, teamData, teamSeason, playerId);
						await pushEventToAzureQueue(robustnessQueueClient, payload);
					}
				}

				for (const playerId of playerIds) {
					if (isGroup(playerId)) {
						const resultsInGroup = playerCalculatedData
							.filter(data => playerId.playerIds.includes(data.playerId))
							.map(data =>
								(data.robustnessData || []).find(robustness => String(robustness.teamSeasonId) === String(teamSeasonId))
							)
							.map(({ robustness }) => robustness[individualPropertyValue]);

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
						const playerData = first(
							sortBy(
								playerCalculatedData.filter(data => String(data.playerId) === String(playerId) && data.createdOn),
								'createdOn'
							).reverse()
						);
						const robustnessData =
							(playerData?.robustnessData || []).find(
								data => data.teamSeasonId && String(data.teamSeasonId) === String(teamSeasonId)
							) || null;
						response[String(playerId)] =
							robustnessData && robustnessData.robustness
								? {
										createdOn: playerData.createdOn,
										updatedOn: playerData.updatedOn,
										...robustnessData.robustness[individualPropertyValue]
								  }
								: emptyRobustnessResult;
					}
				}
			} else {
				console.log(
					`\tRequested robustness data between ${moment(dateFrom).format('DD/MM/YYYY')} and ${moment(dateTo).format(
						'DD/MM/YYYY'
					)}. Computing now...`
				);
				response = await ProfilePlayers.app.models.Robustness.getRobustnessData(
					filteredPlayerIds,
					minutesField,
					dateFrom,
					dateTo,
					teamId,
					individualPropertyValue
				);
			}
			return { missingData, robustness: response };
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	ProfilePlayers.getPlayerFinancialProfile = async function (
		playerId,
		teamSeasonId,
		mode,
		minutesField,
		numberOfMatches
	) {
		const [player, teamSeason] = await Promise.all([
			ProfilePlayers.app.models.Player.findById(playerId),
			ProfilePlayers.app.models.TeamSeason.findById(teamSeasonId)
		]);

		let results = {};

		if (player) {
			const where = { personId: ObjectID(playerId) };
			const include = [
				{
					relation: 'agentContracts',
					scope: {
						include: ['fee', 'bonuses']
					}
				}
			];
			const [employmentContracts, transferContracts, bonuses, teamBonuses, wages] = await Promise.all([
				ProfilePlayers.app.models.EmploymentContract.find({ where, include }),
				ProfilePlayers.app.models.TransferContract.find({ where, include }),
				ProfilePlayers.app.models.Bonus.find({ where: { ...where, contractType: { ne: 'AgentContract' } } }),
				ProfilePlayers.app.models.TeamBonus.find({
					where: {
						teamId: ObjectID(teamSeason.teamId),
						people: ObjectID(playerId)
					}
				}),
				ProfilePlayers.app.models.BasicWage.find({ where })
			]);
			const activeEmployment = employmentContracts.find(({ status }) => status);
			const activeInward = transferContracts.find(({ status, typeTransfer }) => status && typeTransfer === 'inward');

			const club = await ProfilePlayers.app.models.Club.findById(player.clubId);

			const economicValues = getPlayerEconomicValues(
				player,
				activeInward,
				activeEmployment,
				employmentContracts,
				wages,
				bonuses,
				[teamSeason],
				club
			);
			const contractValues = getPersonContractValue(
				player,
				activeEmployment,
				activeInward,
				employmentContracts,
				wages,
				bonuses,
				teamBonuses,
				[teamSeason],
				club
			);
			const investmentPerformanceMetrics = await ProfilePlayers.getPlayerInvestmentPerformance(
				playerId,
				mode,
				minutesField,
				numberOfMatches,
				club
			);

			const analysisValues = getPlayerFinancialAnalysisValue(
				activeEmployment,
				activeInward,
				wages,
				bonuses,
				teamSeason
			);

			results = {
				playerId,
				personName: player?.displayName,
				...economicValues,
				...contractValues,
				...investmentPerformanceMetrics,
				analysisValues
			};
		}

		return results;
	};

	ProfilePlayers.getStaffFinancialProfile = async function (staffId, teamSeasonId) {
		const [staff, teamSeason] = await Promise.all([
			ProfilePlayers.app.models.Staff.findById(staffId),
			ProfilePlayers.app.models.TeamSeason.findById(teamSeasonId)
		]);
		const where = { personId: ObjectID(staffId) };
		const [employmentContracts, bonuses, teamBonuses, wages] = await Promise.all([
			ProfilePlayers.app.models.EmploymentContract.find({ where }),
			ProfilePlayers.app.models.Bonus.find({ where: { ...where, contractType: { ne: 'AgentContract' } } }),
			ProfilePlayers.app.models.TeamBonus.find({
				where: {
					teamId: ObjectID(teamSeason.teamId),
					people: ObjectID(staffId)
				}
			}),
			ProfilePlayers.app.models.BasicWage.find({ where })
		]);
		const activeEmployment = employmentContracts.find(({ status }) => status);

		let contractValues = {};

		if (staff) {
			const club = await ProfilePlayers.app.models.Club.findById(staff.clubId);

			contractValues = getPersonContractValue(
				staff,
				activeEmployment,
				null,
				employmentContracts,
				wages,
				bonuses,
				teamBonuses,
				[teamSeason],
				club
			);
		}

		const results = {
			staffId,
			personName: `${staff?.firstName} ${staff?.lastName}`,
			...contractValues
		};

		return results;
	};

	ProfilePlayers.getStaffsWithContractAndWages = async function (query, include) {
		const staffs = await ProfilePlayers.app.models.Staff.find({
			...query,
			include: [
				...include,
				{
					relation: 'employmentContracts',
					scope: {
						where: { status: true }
					}
				}
			]
		});

		const basicWages = await ProfilePlayers.app.models.BasicWage.find({
			where: {
				contractId: {
					inq: flatten(staffs.map(({ employmentContracts }) => employmentContracts() || [])).map(({ id }) => id)
				}
			}
		});

		staffs.forEach(staff => {
			const contract = (staff.employmentContracts() || [])[0];
			if (contract) {
				const contractMonths = getContractLengthMonths(contract);
				const contractBasicWages = basicWages.filter(({ contractId }) => String(contractId) === String(contract.id));
				staff.contractExpiry = contract?.dateTo;
				staff.wage = getTotalElementsAmountForSeasonNew(contract, contractBasicWages);
				staff.monthlyWage = staff.wage / contractMonths;
			}
		});

		return staffs;
	};

	ProfilePlayers.getPlayersWithContractAndWages = async function (query, include) {
		const players = await ProfilePlayers.app.models.Player.find({
			...query,
			include: [
				...include,
				{
					relation: 'employmentContracts',
					scope: {
						where: { status: true }
					}
				}
			]
		});

		const basicWages = await ProfilePlayers.app.models.BasicWage.find({
			where: {
				contractId: {
					inq: flatten(players.map(({ employmentContracts }) => employmentContracts() || [])).map(({ id }) => id)
				}
			}
		});

		players.forEach(player => {
			const contract = (player.employmentContracts() || [])[0];
			if (contract) {
				const contractMonths = getContractLengthMonths(contract);
				const contractBasicWages = basicWages.filter(({ contractId }) => String(contractId) === String(contract.id));
				player.marketValue = getPlayerValue(player);
				player.contractExpiry = contract?.dateTo;
				player.wage = getTotalElementsAmountForSeasonNew(contract, contractBasicWages);
				player.monthlyWage = player.wage / contractMonths;
			}
		});

		return players;
	};

	ProfilePlayers.getPlayerInvestmentPerformance = async function (
		playerId,
		mode,
		minutesField,
		numberOfMatches,
		{ vat }
	) {
		// extract teamSeasonIds from mode
		const [playerTeamSeasons, employmentContracts, activeInward, bonuses, wages] = await Promise.all([
			ProfilePlayers.app.models.TeamSeason.find({
				where: { playerIds: ObjectID(playerId) }
			}),
			ProfilePlayers.app.models.EmploymentContract.find({
				where: { personId: ObjectID(playerId) },
				include: [
					{
						relation: 'agentContracts',
						scope: {
							include: ['fee']
						}
					}
				]
			}),
			ProfilePlayers.app.models.TransferContract.findOne({
				where: { personId: ObjectID(playerId), status: true, typeTransfer: 'inward' },
				include: [
					{
						relation: 'agentContracts',
						scope: {
							include: ['fee']
						}
					}
				]
			}),
			ProfilePlayers.app.models.Bonus.find({
				where: { personId: ObjectID(playerId), contractType: { ne: 'AgentContract' }, typeTransfer: { ne: 'outward' } }
			}),
			ProfilePlayers.app.models.BasicWage.find({ where: { personId: ObjectID(playerId) } })
		]);

		const activeEmployment = employmentContracts.find(({ status }) => status);
		const activeBonuses = bonuses.filter(
			({ contractId }) =>
				String(contractId) === String(activeEmployment?.id) || String(contractId) === String(activeInward?.id)
		);
		const teamSeasons = getTeamSeasonsFromMode(mode, playerTeamSeasons, activeEmployment, activeInward);
		const teamSeasonIds = teamSeasons.map(({ id }) => String(id));

		const robustnessRawValues = await Promise.all(
			teamSeasonIds.map(teamSeasonId =>
				ProfilePlayers.profileRobustness(teamSeasonId, [playerId], null, null, minutesField).then(
					({ robustness }) => Object.values(robustness)[0]
				)
			)
		);
		const robustnessPerSeason = Object.fromEntries(teamSeasonIds.map((id, index) => [id, robustnessRawValues[index]]));
		const aggregatedRobustness = aggregateRobustnessData(robustnessPerSeason);

		if (mode !== 'history' && !activeEmployment) return null;

		const filteredEmployments = mode === 'history' ? employmentContracts : [activeEmployment];
		const filteredWages = filterWageByMode(wages, mode, activeEmployment.id, teamSeasonIds);
		const filteredBonuses = mode === 'history' ? bonuses : activeBonuses;

		const totalInvestmentCost = getTotalInvestmentCostNew(
			activeInward,
			filteredEmployments,
			filteredWages,
			filteredBonuses,
			teamSeasons,
			false,
			false,
			vat
		);
		const totalInvestmentCostGross = getTotalInvestmentCostNew(
			activeInward,
			filteredEmployments,
			filteredWages,
			filteredBonuses,
			teamSeasons,
			false,
			true,
			vat
		);

		const investmentPerformanceMetrics = getInvestmentPerformanceMetrics(
			activeEmployment,
			aggregatedRobustness,
			{ totalInvestmentCost, totalInvestmentCostGross },
			numberOfMatches
		);

		return {
			...aggregatedRobustness,
			...investmentPerformanceMetrics,
			totalInvestmentCost,
			totalInvestmentCostGross
		};
	};
};

function getPipelineStagesProfileGameStats(playerId, dateFrom, dateTo, metricsPlayerStats) {
	const pipelineStages = [];
	const matchStage = {
		$match: {
			date: { $gte: dateFrom, $lte: dateTo },
			'_playerStats.playerId': { $in: [String(playerId), ObjectID(playerId)] }
		}
	};
	const unwindStage = {
		$unwind: '$_playerStats'
	};
	const matchStage2 = {
		$match: {
			'_playerStats.playerId': { $in: [String(playerId), ObjectID(playerId)] }
		}
	};
	const lookupStage2 = { $lookup: { from: 'Event', localField: 'eventId', foreignField: '_id', as: 'event' } };
	const unwindStage2 = { $unwind: { path: '$event', preserveNullAndEmptyArrays: true } };

	const projectObj = {
		date: 1,
		format: '$event.format', // TODO denormalize event fields by copying into match
		subformat: '$event.subformat',
		clubGameHomeTeam: '$event.clubGameHomeTeam',
		clubGameAwayTeam: '$event.clubGameAwayTeam',
		opponent: 1,
		result: 1,
		resultFlag: 1,
		teamSeasonId: 1,
		home: 1,
		eventId: 1,
		pmstats: '$event._playerMatchStats',
		'_playerStats.playerId': 1,
		'_playerStats.playerName': 1
	};
	for (const m of metricsPlayerStats) {
		const mField = '_playerStats.' + m;
		projectObj[mField] = 1;
	}

	const projectStage = {
		$project: projectObj
	};

	const projectObj2 = {
		date: '$date',
		opponent: '$opponent',
		result: '$result',
		resultFlag: '$resultFlag',
		teamSeasonId: '$teamSeasonId',
		home: '$home',
		eventId: '$eventId',
		format: '$format',
		subformat: '$subformat',
		clubGameHomeTeam: '$clubGameHomeTeam',
		clubGameAwayTeam: '$clubGameAwayTeam',
		pmstats: {
			$filter: {
				input: '$pmstats',
				as: 'itempmatch',
				cond: {
					$or: [{ $eq: ['$$itempmatch.playerId', ObjectID(playerId)] }, { $eq: ['$$itempmatch.playerId', playerId] }]
				}
			}
		},
		_playerStats: '$_playerStats'
	};
	const projectStage2 = {
		$project: projectObj2
	};
	const unwindStage3 = { $unwind: { path: '$pmstats', preserveNullAndEmptyArrays: true } };

	pipelineStages.push(matchStage);
	pipelineStages.push(unwindStage);
	pipelineStages.push(matchStage2);
	pipelineStages.push(lookupStage2);
	pipelineStages.push(unwindStage2);
	pipelineStages.push(projectStage);
	pipelineStages.push(projectStage2);
	pipelineStages.push(unwindStage3);

	return pipelineStages;
}

function getPipelineForLastTestResults(playerId) {
	return [
		{
			$match: {
				'_testResults.playerId': playerId
			}
		},
		{
			$lookup: {
				from: 'Test',
				localField: 'testId',
				foreignField: '_id',
				as: 'test'
			}
		},
		{
			$unwind: {
				path: '$test'
			}
		},
		{
			$project: {
				_id: 1,
				date: 1,
				testId: 1,
				testName: '$test.name',
				testPurpose: '$test.purpose',
				_testResults: {
					$filter: {
						input: '$_testResults',
						as: 'item',
						cond: {
							$eq: ['$$item.playerId', playerId]
						}
					}
				}
			}
		},
		{
			$unwind: {
				path: '$_testResults'
			}
		},
		{
			$project: {
				_id: 1,
				testId: 1,
				testName: 1,
				testPurpose: 1,
				date: 1,
				results: '$_testResults.results'
			}
		},
		{
			$sort: {
				date: -1
			}
		}
	];
}

function getPipelineForTimelineChart(playerId, testIds, metrics) {
	return [
		{
			$match: {
				testId: { $in: testIds.map(ObjectID) },
				// date: {
				// 	$gte: moment(dateFrom, 'YYYY-MM-DDTHH:mm:ss ZZ').toDate(),
				// 	$lte: moment(dateTo, 'YYYY-MM-DDTHH:mm:ss ZZ').toDate()
				// },
				'_testResults.playerId': playerId
			}
		},
		{
			$lookup: {
				from: 'Test',
				localField: 'testId',
				foreignField: '_id',
				as: 'test'
			}
		},
		{
			$unwind: {
				path: '$test'
			}
		},
		{
			$project: {
				_id: 1,
				date: 1,
				testId: 1,
				testName: '$test.name',
				_testResults: {
					$filter: {
						input: '$_testResults',
						as: 'item',
						cond: {
							$eq: ['$$item.playerId', String(playerId)]
						}
					}
				}
			}
		},
		{
			$unwind: {
				path: '$_testResults'
			}
		},
		{
			$project: {
				_id: 1,
				date: 1,
				testId: 1,
				testName: 1,
				_testResults: {
					$filter: {
						input: '$_testResults.results',
						as: 'item',
						cond: {
							$in: ['$$item.rawField', metrics]
						}
					}
				}
			}
		},
		{
			$unwind: {
				path: '$_testResults'
			}
		},
		{
			$project: {
				_id: 1,
				date: 1,
				testId: 1,
				testName: 1,
				metricName: '$_testResults.rawField',
				series1: {
					$cond: {
						if: { $eq: ['$_testResults.rawField', metrics[0]] },
						then: '$_testResults.rawValue',
						else: undefined
					}
				},
				series2: {
					$cond: {
						if: { $eq: ['$_testResults.rawField', metrics[1]] },
						then: '$_testResults.rawValue',
						else: undefined
					}
				}
			}
		},
		{
			$sort: {
				date: -1
			}
		}
	];
}

function getPipelineStagesProfileMaintenance(playerId, testIds) {
	const pipelineStages = [];

	testIds = testIds.map(id => ObjectID(id));
	const matchStage = {
		$match: {
			testId: { $in: testIds }
		}
	};

	const projectStage = {
		$project: {
			_id: '$_id',
			id: '$_id',
			date: '$date',
			testId: '$testId',
			_testResults: {
				$filter: {
					input: '$_testResults',
					as: 'item',
					cond: {
						$eq: ['$$item.playerId', String(playerId)]
					}
				}
			}
		}
	};

	pipelineStages.push(matchStage);
	pipelineStages.push(projectStage);

	return pipelineStages;
}

function hasRobustnessData(playerCalculatedData, playerId, seasonId) {
	return playerCalculatedData.find(
		data =>
			String(data.playerId) === String(playerId) &&
			data.robustnessData.some(({ teamSeasonId }) => teamSeasonId === String(seasonId))
	);
}

function getLastResultsTableData(lastTestResults, metricsTests, _thresholdsTests) {
	const table = {};
	for (const testInstance of lastTestResults) {
		const filtered = filterByActiveMetrics(testInstance, metricsTests);
		for (const result of filtered) {
			const label = `${result.rawField}_${String(testInstance.testId)}`;
			const threshold = getTestThreshold(_thresholdsTests, testInstance.testName, result.rawField);
			let tableElement = table[label];
			if (tableElement === undefined) {
				tableElement = {
					date: testInstance.date,
					testInstanceId: testInstance._id,
					testId: testInstance.testId,
					testPurpose: testInstance.testPurpose[0],
					testName: testInstance.testName,
					metricName: result.rawField,
					valueCurrent: Number(result.rawValue),
					datePrev: null,
					valuePrev: null,
					diffThresholdColor: getThresholdsIntervalColor(Number(result.rawValue), threshold),
					diffThresholdValue: getThresholdsIntervalValue(Number(result.rawValue), threshold),
					tooltip: getThresholdTooltip(Number(result.rawValue), threshold)
				};
			} else if (!tableElement.valuePrev) {
				tableElement.datePrev = testInstance.date;
				tableElement.valuePrev = Number(result.rawValue);
				tableElement.diffValuePercentage = getDiffPercentage(tableElement.valueCurrent, tableElement.valuePrev);
				tableElement.diffThresholdColor = getThresholdsIntervalColor(tableElement.valueCurrent, threshold);
				tableElement.diffThresholdValue = getThresholdsIntervalValue(tableElement.valueCurrent, threshold);
				tableElement.tooltip = getThresholdTooltip(tableElement.valueCurrent, threshold);
			}
			table[label] = tableElement;
		}
	}
	const grouped = groupBy(Object.values(table), 'testPurpose');

	return grouped;
}

function filterByActiveMetrics({ results, testName: testNameToCheck }, metricsTests) {
	return results.filter(
		({ rawField, rawValue }) =>
			metricsTests.find(({ testName, metricName }) => testNameToCheck === testName && rawField === metricName) &&
			rawValue
	);
}

function getTestThreshold(_thresholdsTests, testName, metricName) {
	const found = (_thresholdsTests || []).find(({ metric, name }) => name === testName && metric === metricName);
	return found || null;
}

function getThresholdTooltip(value, threshold) {
	const thresholdActiveValue = getThresholdActiveValue(threshold);

	if (!thresholdActiveValue || !value) return { key: 'noThresholdSet', label: null };

	const percentage = Math.abs(((value - thresholdActiveValue) / thresholdActiveValue) * 100);
	const basicLabel = `${thresholdActiveValue}`;
	const percentageLabel = `${percentage.toFixed(2)}%)`;
	let tooltip;
	if (value > thresholdActiveValue) {
		tooltip = `${basicLabel} (${percentageLabel}`;
	} else if (value < thresholdActiveValue) {
		tooltip = `${basicLabel} (-${percentageLabel}`;
	} else if (value === thresholdActiveValue) {
		tooltip = basicLabel;
	}
	return { key: 'threshold', value: tooltip };
}

function getDiffPercentage(valueCurrent, valuePrev) {
	const value = Math.round(((valueCurrent - valuePrev) / (valueCurrent || 1)) * 100);
	return value + '%';
}

function getTimeLineChartData(timelineResults) {
	timelineResults.forEach(instance => {
		instance.dateString = moment(instance.date).format('MM/DD/YYYY');
	});

	const dateFrom = timelineResults[0]?.date;
	const dateTo = last(timelineResults)?.date;

	const grouped = groupBy(timelineResults, 'dateString');
	const reduced = Object.entries(grouped)
		.map(([key, values]) => ({
			[key]: values.reduce(
				(item, acc) => ({
					series1: Number(acc.series1 || item.series1),
					series2: Number(acc.series2 || item.series2)
				}),
				{}
			)
		}))
		.reduce((val, acc) => ({ ...acc, ...val }), {});

	const days = Array.from(
		moment.range(moment(dateFrom, 'YYYY-MM-DDTHH:mm:ss ZZ'), moment(dateTo, 'YYYY-MM-DDTHH:mm:ss ZZ')).by('days')
	);
	const daysMap = new Map(days.map(day => [day.format('MM/DD/YYYY'), { series1: null, series2: null }]));

	Object.entries(reduced).forEach(([day, values]) => {
		daysMap.set(day, values);
	});

	return Array.from(daysMap.entries()).map(([day, values]) => ({
		date: moment(day, 'MM/DD/YYYY').toDate(),
		...values
	}));
}

function getRadarChartData(tableData) {
	return flatten(Object.values(tableData));
}

function isGroup(gr) {
	return gr && gr.name && gr.playerIds;
}

// financial
function getPlayerEconomicValues(
	player,
	activeInward,
	activeEmployment,
	employmentContracts,
	wages,
	bonuses,
	seasons,
	{ vat, taxes }
) {
	const basicWages = wages.filter(
		({ type, contractId }) => type === 'basicWage' && String(contractId) === String(activeEmployment?.id)
	);
	const valorizations = wages.filter(
		({ type, contractId }) => type === 'valorization' && String(contractId) === String(activeInward?.id)
	);
	const assetValue = getAssetValueNew(
		activeInward,
		activeEmployment,
		employmentContracts,
		valorizations,
		basicWages,
		bonuses,
		seasons,
		false,
		vat,
		taxes
	);
	const assetValueGross = getAssetValueNew(
		activeInward,
		activeEmployment,
		employmentContracts,
		valorizations,
		wages,
		bonuses,
		seasons,
		true,
		vat,
		taxes
	);
	const amortizationAsset = getAmortizationFromContracts(employmentContracts, assetValue);
	const amortizationAssetGross = getAmortizationFromContracts(employmentContracts, assetValueGross);
	const netBookValue = getNetBookValue(assetValue, amortizationAsset);
	const netBookValueGross = getNetBookValue(assetValueGross, amortizationAssetGross);
	const marketValue = getPlayerValue(player, false, vat);
	const marketValueGross = getPlayerValue(player, true, vat);
	const gainLoss = getGainLoss(marketValue, netBookValue);
	const gainLossGross = getGainLoss(marketValueGross, netBookValueGross);
	const gainLossPercent = getGainLossPercentage(gainLoss, netBookValue);
	const purchaseCost = getTransferFee(activeInward, true, false, vat);
	const purchaseCostGross = getTransferFee(activeInward, true, true, vat);

	const pastValues = getPlayerPastValues(player);

	return {
		assetValue,
		assetValueGross,
		amortizationAsset,
		amortizationAssetGross,
		netBookValue,
		netBookValueGross,
		marketValue,
		marketValueGross,
		gainLoss,
		gainLossGross,
		gainLossPercent,
		purchaseCost,
		purchaseCostGross,
		pastValues
	};
}

function getPersonContractValue(
	person,
	activeEmployment,
	activeInward,
	employmentContracts,
	wages,
	bonuses,
	teamBonuses,
	seasons,
	{ taxes, vat }
) {
	const basicWages = wages.filter(
		({ type, contractId }) => type === 'basicWage' && String(contractId) === String(activeEmployment?.id)
	);
	const clubSeasonIds = seasons.map(({ clubSeasonId }) => String(clubSeasonId));
	const personTeamBonuses = teamBonuses.filter(
		({ people, clubSeasonId }) =>
			(people || []).includes(String(person.id)) && clubSeasonIds.includes(String(clubSeasonId))
	);

	const activeBonuses = bonuses.filter(
		({ contractId }) =>
			String(contractId) === String(activeEmployment?.id) || String(contractId) === String(activeInward?.id)
	);

	const yearsInTeam = getYearsInTeam(employmentContracts);
	const monthsInTeam = getMonthsInTeam(employmentContracts);
	const yearsLastContract = getYearsLastContracts(employmentContracts);
	const monthsLastContract = getMonthsLastContracts(employmentContracts);
	const wage = getTotalElementsAmountForSeasonNew(
		activeEmployment,
		basicWages,
		seasons.map(({ id }) => id),
		false,
		vat
	);
	const wageGross = getTotalElementsAmountForSeasonNew(
		activeEmployment,
		basicWages,
		seasons.map(({ id }) => id),
		true,
		vat
	);

	const bonus =
		getAchievedBonusesAmount(activeBonuses, seasons, false, false, vat, taxes) +
		getAchievedBonusesAmount(personTeamBonuses, seasons, false, false, vat, taxes);
	const bonusGross =
		getAchievedBonusesAmount(activeBonuses, seasons, false, true, vat, taxes) +
		getAchievedBonusesAmount(personTeamBonuses, seasons, false, true, vat, taxes);
	const residualBonus =
		getResidualBonusesAmount(activeBonuses, [], false, false, vat, taxes) +
		getResidualBonusesAmount(personTeamBonuses, seasons, false, false, vat, taxes);
	const residualBonusGross =
		getResidualBonusesAmount(activeBonuses, [], false, true, vat, taxes) +
		getResidualBonusesAmount(personTeamBonuses, seasons, false, true, vat, taxes);

	const years = activeEmployment
		? Math.round(moment(activeEmployment.dateTo).diff(moment(activeEmployment.dateFrom), 'years', true))
		: null;
	const months = activeEmployment
		? Math.round(moment(activeEmployment.dateTo).diff(moment(activeEmployment.dateFrom), 'months', true))
		: null;
	const days = activeEmployment
		? Math.round(moment(activeEmployment.dateTo).diff(moment(activeEmployment.dateFrom), 'days', true))
		: null;
	const fromToday = activeEmployment ? Math.round(moment(activeEmployment.dateTo).diff(moment(), 'days', true)) : null;
	const completionPercentage = activeEmployment
		? Math.round((moment().diff(moment(activeEmployment.dateFrom), 'days', true) / (days || 1)) * 100) || 0
		: null;
	const remainingTime = activeEmployment
		? Math.round(moment(activeEmployment.dateTo).diff(moment(), 'months', true))
		: null;
	const start = activeEmployment?.dateFrom || null;
	const end = activeEmployment?.dateTo || null;

	return {
		yearsInTeam,
		monthsInTeam,
		yearsLastContract,
		monthsLastContract,
		contractDuration: {
			years,
			months,
			days,
			fromToday,
			completionPercentage,
			remainingTime,
			start,
			end
		},
		wage,
		wageGross,
		bonus,
		bonusGross,
		residualBonus,
		residualBonusGross
	};
}

function getInvestmentPerformanceMetrics(
	activeEmployment,
	robustness,
	{ totalInvestmentCost, totalInvestmentCostGross },
	matchesForSeason
) {
	let response = {
		roi: 0,
		roiGross: 0,
		losses: 0,
		lossesGross: 0,
		untapped: 0,
		untappedGross: 0,
		residualRoi: 0,
		residualRoiGross: 0,
		roi_perc: 0,
		untapped_perc: 0,
		losses_perc: 0,
		residualRoi_perc: 0
	};
	if (robustness) {
		// already played
		const availablePlayedMinutes = robustness.gameMinutesInvestment || 0;
		// estimated future
		const availableFixturesMinutes = getEstimatedFixturesMinutes(activeEmployment, matchesForSeason);

		const allGameMinutes = availablePlayedMinutes + availableFixturesMinutes;

		const percentageMinutesRoi = ((robustness.minutesPlayed || 0) * 100) / allGameMinutes;
		const roi = (totalInvestmentCost * percentageMinutesRoi) / 100;
		const roiGross = (totalInvestmentCostGross * percentageMinutesRoi) / 100;

		const percentageMinutesLosses = ((robustness.gameMinutesLosses || 0) * 100) / allGameMinutes;
		const losses = (totalInvestmentCost * percentageMinutesLosses) / 100;
		const lossesGross = (totalInvestmentCostGross * percentageMinutesLosses) / 100;

		const percentageMinutesUntapped = ((robustness.gameMinutesUntapped || 0) * 100) / allGameMinutes;
		const untapped = (totalInvestmentCost * percentageMinutesUntapped) / 100;
		const untappedGross = (totalInvestmentCostGross * percentageMinutesUntapped) / 100;

		const residualRoi =
			totalInvestmentCost - untapped - roi - losses >= 0 ? totalInvestmentCost - untapped - roi - losses : 0;
		const residualRoiGross =
			totalInvestmentCostGross - untappedGross - roiGross - lossesGross >= 0
				? totalInvestmentCostGross - untappedGross - roiGross - lossesGross
				: 0;

		const totalGraph = untapped + roi + residualRoi + losses || 100;
		const roi_perc = (roi * 100) / totalGraph;
		const untapped_perc = (untapped * 100) / totalGraph;
		const losses_perc = (losses * 100) / totalGraph;
		const residualRoi_perc = (residualRoi * 100) / totalGraph;

		response = {
			roi,
			roiGross,
			losses,
			lossesGross,
			untapped,
			untappedGross,
			residualRoi,
			residualRoiGross,
			roi_perc,
			untapped_perc,
			losses_perc,
			residualRoi_perc
		};
	}
	return response;
}

function getPlayerRobustnessData(robustness) {
	return {
		availability: robustness?.availability,
		productivity: robustness?.performanceReliability,
		gameAvailability: robustness?.gameAvailability,
		playingTime: robustness?.playingTime,
		minutesPlayed: robustness?.minutesPlayed,
		countGames: robustness?.countGames,
		gameMinutesInvestment: robustness?.gameMinutesInvestment,
		gameMinutesRoi: robustness?.gameMinutesRoi,
		gameMinutesLosses: robustness?.gameMinutesLosses,
		gameMinutesUntapped: robustness?.gameMinutesUntapped
	};
}

function aggregateRobustnessData(robustnessPerSeason) {
	const mappedValues = Object.values(robustnessPerSeason).map(getPlayerRobustnessData);
	const len = mappedValues.length;
	const sumObject = mappedValues.reduce((sum, robustness) => {
		return Object.keys(robustness).reduce(
			(acc, key) => ({
				...acc,
				[key]: (acc[key] || 0) + robustness[key]
			}),
			sum
		);
	}, {});

	return {
		availability: sumObject.availability / len,
		productivity: sumObject.productivity / len,
		gameAvailability: sumObject.gameAvailability / len,
		playingTime: sumObject.playingTime / len,
		minutesPlayed: sumObject.minutesPlayed,
		countGames: sumObject.countGames,
		gameMinutesInvestment: sumObject.gameMinutesInvestment,
		gameMinutesRoi: sumObject.gameMinutesRoi,
		gameMinutesLosses: sumObject.gameMinutesLosses,
		gameMinutesUntapped: sumObject.gameMinutesUntapped
	};
}

function getEstimatedFixturesMinutes(activeEmployment, matchesForSeason) {
	if (!activeEmployment) return 0;
	if (moment().isAfter(activeEmployment.dateTo)) return 0;
	const matchesForMonth = matchesForSeason / 12;
	const diffMonthsToContractEnd = moment(activeEmployment.dateTo).diff(moment(), 'months');
	const minutes = Number(matchesForMonth * diffMonthsToContractEnd) * 90;
	return minutes || 0;
}

function getPlayerFinancialAnalysisValue(activeEmployment, activeInward, wages, bonuses, season) {
	const basicWages = wages.filter(
		({ type, contractId }) => type === 'basicWage' && String(contractId) === String(activeEmployment?.id)
	);
	const contributions = wages.filter(
		({ type, contractId }) => type === 'contribution' && String(contractId) === String(activeEmployment?.id)
	);
	// const valorizations = wages.filter(
	// 	({ type, contractId }) => type === 'valorization' && String(contractId) === String(activeInward?.id)
	// );

	const appearanceFee = bonuses.filter(
		({ type, contractId }) => type === 'appearanceFee' && String(contractId) === String(activeEmployment?.id)
	);
	const performanceFee = bonuses.filter(
		({ type, contractId }) => type === 'performanceFee' && String(contractId) === String(activeEmployment?.id)
	);
	const appearance = bonuses.filter(
		({ type, contractId }) => type === 'appearance' && String(contractId) === String(activeEmployment?.id)
	);
	const performance = bonuses.filter(
		({ type, contractId }) => type === 'performance' && String(contractId) === String(activeEmployment?.id)
	);
	const standardTeamBonus = bonuses.filter(
		({ type, contractId }) => type === 'standardTeam' && String(contractId) === String(activeEmployment?.id)
	);
	const signing = bonuses.filter(
		({ type, contractId }) => type === 'signing' && String(contractId) === String(activeEmployment?.id)
	);
	const custom = bonuses.filter(
		({ type, contractId }) => type === 'custom' && String(contractId) === String(activeEmployment?.id)
	);
	const purchaseCost = {
		basicWages: getTransferFee(activeInward),
		appearanceBonus: getTotalConditionalElementsAmountForSeasonNew(activeInward, appearance, [season?.id]),
		performanceBonus: getTotalConditionalElementsAmountForSeasonNew(activeInward, performance, [season?.id]),
		standardTeamBonus: getTotalConditionalElementsAmountForSeasonNew(activeInward, standardTeamBonus, [season?.id]),
		signingBonus: getTotalConditionalElementsAmountForSeasonNew(activeInward, signing, [season?.id]),
		customBonus: getTotalConditionalElementsAmountForSeasonNew(activeInward, custom, [season?.id]),
		benefits: 0,
		// valorizations: getTotalElementsAmountForSeasonNew(activeInward, valorizations, [season?.id]),
		agent: (activeInward?.agentContracts() || [])
			.map(agentContract => getAgentFeeFromSingleContractNew(agentContract))
			.reduce(sumReduce, 0)
	};
	const purchaseCostOverall = Object.values(purchaseCost).reduce(sumReduce, 0);
	const contractCost = {
		basicWages: getTotalElementsAmountForSeasonNew(activeEmployment, basicWages, [season?.id]),
		contributions: getTotalElementsAmountForSeasonNew(activeEmployment, contributions, [season?.id]),
		appearanceFee: getTotalConditionalElementsAmountForSeasonNew(activeEmployment, appearanceFee, [season?.id]),
		performanceFee: getTotalConditionalElementsAmountForSeasonNew(activeEmployment, performanceFee, [season?.id]),
		appearanceBonus: getTotalConditionalElementsAmountForSeasonNew(activeEmployment, appearance, [season?.id]),
		performanceBonus: getTotalConditionalElementsAmountForSeasonNew(activeEmployment, performance, [season?.id]),
		standardTeamBonus: getTotalConditionalElementsAmountForSeasonNew(activeEmployment, standardTeamBonus, [season?.id]),
		signingBonus: getTotalConditionalElementsAmountForSeasonNew(activeEmployment, signing, [season?.id]),
		customBonus: getTotalConditionalElementsAmountForSeasonNew(activeEmployment, custom, [season?.id]),
		benefits: getTotalElementsAmountForSeasonNew(activeEmployment, activeEmployment?.benefits || [], [season?.id]),
		agent: (activeEmployment?.agentContracts() || [])
			.map(agentContract => getTotalElementsAmountForSeasonNew(activeEmployment, agentContract.fee(), [season?.id]))
			.reduce(sumReduce, 0)
	};
	const contractCostOverall = Object.values(contractCost).reduce(sumReduce, 0);
	const contractLength = getContractLength(activeEmployment);

	return {
		purchaseCost,
		purchaseCostOverall,
		contractCost,
		contractCostOverall,
		contractLength
	};
}

function sumReduce(a, b) {
	return a + b;
}

function getTeamSeasonsFromMode(mode, teamSeasons, employmentContract, transferContract) {
	let startDate;
	switch (mode) {
		case 'currentSeason':
		default: {
			startDate = new Date();
			break;
		}
		case 'currentContract': {
			startDate = employmentContract?.dateFrom;
			break;
		}
		case 'history':
			startDate = transferContract?.on;
			break;
	}

	const oldest = teamSeasons.find(({ offseason, inseasonEnd }) =>
		moment(startDate).isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
	);
	const filtered = teamSeasons.filter(({ offseason }) =>
		moment(offseason).isSameOrAfter(moment(oldest.offseason), 'year')
	);
	return filtered;
}

function filterWageByMode(wages, mode, activeEmploymentId, teamSeasonIds) {
	switch (mode) {
		case 'currentSeason':
			return wages.filter(
				({ contractId, season }) =>
					String(contractId) === String(activeEmploymentId) &&
					season.some(seasonId => teamSeasonIds.includes(String(seasonId)) || seasonId === 'allContract')
			);
		case 'currentContract':
			return wages.filter(({ contractId }) => String(contractId) === String(activeEmploymentId));
		case 'history':
		default:
			return wages;
	}
}

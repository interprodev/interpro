const { ObjectID } = require('mongodb');
const { isEmpty, pick, uniq, flatten, uniqBy, groupBy } = require('lodash');
const { InternalError, AuthorizationError, ForbiddenError, NotFoundError } = require('../modules/error');
const moment = require('moment');
const scoutingUtils = require('../../server/shared/scouting');
const gameReportUtils = require('../../server/shared/player-report-template-utils');
const {
	getAttachmentsPipeline,
	getTeamPipeline,
	getPlayerScoutingPipeline,
	getVideoAssetPipeline,
	getScoutingGameReportPipeline,
	getEventPipeline,
	getInjuryPipeline,
	getPlayerPipeline,
	getTestInstancePipeline,
	getMedicalTreatmentPipeline,
	getEmploymentContractPipeline,
	getTransferContractPipeline
} = require('../modules/team-attachments-pipelines');
const { getTeamFinancialProfile, getTeamFinancialAnalysis } = require('../../server/shared/dashboard-utils');
const { getCashFlowData } = require('../../server/shared/cash-flow-utils');
const { getPlayerValue, getTotalElementsAmountForSeasonNew } = require('../../server/shared/financial-utils');
const {
	getAllDrillCanvases,
	getSingleDrillCanvas,
	createDrillCanvas,
	updateDrillCanvas,
	deleteDrillCanvas
} = require('../../server/models/services-connectors/drill-canvas');
const {
	createTemplate,
	getAllTemplates,
	getSingleTemplateVersion,
	updateTemplate
} = require('../../server/models/services-connectors/custom-report-templates/custom-report-template');
const gameTemplateServicePath = 'player-game';
const trainingTemplateServicePath = 'player-training';

module.exports = function (Team) {
	Team.getEnabledModules = async function (teamId) {
		const team = await Team.findOne({ where: { id: teamId } });
		const enabledModules = !isEmpty(team.enabledModules) ? team.enabledModules : [];
		return enabledModules;
	};

	Team.getObservedScouting = async function (teamId) {
		console.log(`[TEAM] Getting observed scouting players (with aggregated data) for team ${teamId}`);
		const { clubId, playerAttributes: teamPlayerAttributes } = await Team.findById(teamId, {
			fields: ['clubId', 'playerAttributes']
		});
		const { scoutingSettings } = await Team.app.models.Club.findById(clubId, { fields: ['scoutingSettings'] });
		const playerCollection = Team.getDataSource().connector.collection(Team.app.models.PlayerScouting.modelName);
		const scoutings = await playerCollection.aggregate(getPipeline(teamId)).toArray();
		const aggregated = [];
		const clubTemplates = await gameReportUtils.getScoutingTemplates(clubId, Team.app.models.Club);
		for (const scouting of scoutings) {
			const wrappedPlayer = { ...scouting, id: scouting._id, creationDate: scouting._id.getTimestamp() };
			const result = await scoutingUtils.addAggregateData(
				wrappedPlayer,
				teamPlayerAttributes,
				scoutingSettings,
				clubTemplates
			);
			aggregated.push(result);
		}
		return aggregated;
	};

	Team.getGamesWithReportsCSV = async function (teamId, dates, options, timezoneOffset) {
		try {
			console.log(`[TEAM] Getting games for csv export with players for ${teamId} and dates ${dates.join(' and ')}...`);
			const gameReportCollection = Team.getDataSource().connector.collection(
				Team.app.models.ScoutingGameReport.modelName
			);
			const { clubId } = await Team.findById(teamId, { fields: ['clubId'] });
			const filter = getScoutingGameReportsWithGame(teamId, dates, options, true);
			const items = await gameReportCollection
				.aggregate(filter, { disableSanitization: true, serializeFunctions: true, allowDiskUse: true })
				.toArray();
			const clubTemplates = await gameReportUtils.getScoutingTemplates(clubId, Team.app.models.Club);
			const mappedItems = await Promise.all(
				items.map(item => gameReportUtils.getMappedReportData(item, clubTemplates))
			);
			mappedItems.forEach(item => {
				item.birthYear = moment(item.birthDate).utcOffset(Number(timezoneOffset)).year();
			});
			return { items: mappedItems };
		} catch (e) {
			console.error(e);
			throw InternalError('Unable to get scouting games per the provided dates');
		}
	};

	Team.getGamesWithReports = async function (teamId, dates, options, timezoneOffset) {
		try {
			console.log(`[TEAM] Getting games with players for ${teamId} and dates ${dates.join(' and ')}...`);
			const gameReportCollection = Team.getDataSource().connector.collection(
				Team.app.models.ScoutingGameReport.modelName
			);
			const { clubId } = await Team.findById(teamId, { fields: ['clubId'] });
			const filter = getScoutingGameReportsWithGame(teamId, dates, options, false);
			const [{ count, items, ...opts }] = await gameReportCollection
				.aggregate(filter, { disableSanitization: true, serializeFunctions: true, allowDiskUse: true })
				.toArray();
			const clubTemplates = await gameReportUtils.getScoutingTemplates(clubId, Team.app.models.Club);
			const mappedItems = await Promise.all(
				items.map(item => gameReportUtils.getMappedReportData(item, clubTemplates))
			);
			(mappedItems || []).forEach(item => {
				if (item) {
					item.birthYear = moment(item?.birthDate).utcOffset(Number(timezoneOffset)).year();
				}
			});
			const filtersItems = {
				teams: uniq([
					...opts.awayTeam.map(({ _id }) => _id).filter(x => x),
					...opts.homeTeam.map(({ _id }) => _id).filter(x => x)
				]),
				player: uniqBy(
					opts.player
						.map(({ _id }) => _id)
						.map(player => ({
							playerScoutingId: player?.playerScoutingId ? String(player.playerScoutingId) : undefined,
							displayName: player.displayName
						})),
					player => `${player?.playerScoutingId}_${player.displayName}`
				),
				scout: uniq(opts.scout.map(({ _id }) => _id).filter(x => x)),
				level: uniq(opts.level.map(({ _id }) => _id).filter(x => x)),
				nationality: uniq(opts.nationality.map(({ _id }) => _id).filter(x => x)),
				position: uniq(opts.position.map(({ _id }) => _id).filter(x => x)),
				birthYear: uniq(items.map(({ birthYear }) => birthYear).filter(x => x)),
				competition: uniq(opts.competition.map(({ _id }) => _id).filter(x => x)),
				lastUpdate: uniq(opts.lastUpdate.map(({ _id }) => _id).filter(x => x)),
				lastUpdateAuthor: uniq(opts.lastUpdateAuthor.map(({ _id }) => _id).filter(x => x))
			};
			return { count: count.length > 0 ? count[0].count : 0, items: mappedItems, filtersItems };
		} catch (e) {
			console.error(e);
			throw InternalError('Unable to get scouting games per the provided dates');
		}
	};

	Team.getPlayersLimits = async function (teamId) {
		const { activePlayersLimit, archivedPlayersLimit } = await Team.findOne({
			where: { id: teamId },
			fields: ['activePlayersLimit', 'archivedPlayersLimit']
		});
		return { activePlayersLimit, archivedPlayersLimit };
	};

	Team.getTeamAttachments = async function (currentTeamId, req) {
		const token = await Team.getToken(req);

		const customer = await Team.app.models.Customer.findById(token.userId, { id: 1 });
		if (!customer) {
			throw InternalError('User not found');
		}

		const teamSettings = await Team.app.models.CustomerTeamSettings.findOne({
			where: { customerId: ObjectID(token.userId), teamId: ObjectID(currentTeamId) }
		});
		if (!teamSettings) {
			throw ForbiddenError('User does not have access to this team');
		}

		const [playerIds, staffIds] = await Promise.all([
			Team.app.models.Player.find({
				where: { teamId: ObjectID(currentTeamId) },
				fields: ['id']
			}),
			Team.app.models.Staff.find({
				where: { teamId: ObjectID(currentTeamId) },
				fields: ['id']
			})
		]);

		const collections = (teamSettings.permissions || []).map(permission =>
			getPipelineForPermission(permission, {
				Team,
				currentTeamId,
				customer,
				personIds: [...playerIds.map(({ id }) => id), ...staffIds.map(({ id }) => id)]
			})
		);

		collections.push([getPlayerPipeline(Team, currentTeamId, teamSettings.permissions || [])]);

		if (teamSettings.permissions.includes('medical-screenings'))
			collections.push(getMedicalTreatmentPipeline(Team, currentTeamId));

		const response = await Promise.all(flatten(collections));

		return flatten(response);
	};

	Team.getToken = async function (req) {
		const token = await Team.app.models.AccessToken.getDataSource()
			.connector.collection(Team.app.models.AccessToken.modelName)
			.findOne({ _id: req.headers['authorization'] });
		if (!token) {
			throw AuthorizationError('Auth token not provided');
		}
		return token;
	};

	Team.getEventVideos = async function (id, categories, req) {
		const token = await Team.app.models.AccessToken.getDataSource()
			.connector.collection(Team.app.models.AccessToken.modelName)
			.findOne({ _id: req.headers['authorization'] });
		if (!token) {
			throw AuthorizationError('Auth token not provided');
		}

		const teamSeasons = await Team.app.models.TeamSeason.find({
			where: { teamId: ObjectID(req.params.id) },
			fields: ['id', 'offseason', 'inseasonEnd', 'staffIds']
		});
		const currentSeason = teamSeasons.find(({ offseason, inseasonEnd }) =>
			moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
		);
		if (!currentSeason) throw NotFoundError('Current season not set!');

		const staff = await Team.app.models.Staff.findOne({
			where: {
				customerId: token.userId
			}
		});
		if (!staff) {
			throw NotFoundError('Your account is not associated with any staff!');
		}
		const isStaffInSeason = (currentSeason?.staffIds || []).map(staffId => String(staffId)).includes(String(staff.id));

		if (!isStaffInSeason) {
			throw NotFoundError('Your associated Staff is not part of the current season!');
		}

		const videoCollection = Team.app.models.VideoAsset.getDataSource().connector.collection(
			Team.app.models.VideoAsset.modelName
		);
		const pipelineVideos = getPipelineEventVideos(id, staff.id, token.userId, categories);

		const results = await videoCollection.aggregate(pipelineVideos).toArray();

		return results;
	};

	Team.getFinancialOverview = async function (id, teamSeasonId, minutesField, numberOfMatches) {
		try {
			console.log(`[TEAM] Getting financial overview data for Team ${id}`);
			return await getTeamFinancialProfile(teamSeasonId, minutesField, numberOfMatches, Team);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Team.getFinancialAnalysis = async function (id, teamSeasonId, minutesField, numberOfMatches) {
		try {
			console.log(`[TEAM] Getting financial analysis data for Team ${id}`);
			const season = await Team.app.models.TeamSeason.findById(teamSeasonId);
			return await getTeamFinancialAnalysis(season.playerIds, teamSeasonId, minutesField, numberOfMatches, Team);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Team.getCashFlow = async function (id, national, international, achieved) {
		try {
			console.log(`[TEAM] Getting cash flow data for Team ${id}`);
			const [seasons, players] = await Promise.all([
				Team.app.models.TeamSeason.find({
					where: { teamId: ObjectID(id) },
					fields: { id: true, name: true, offseason: true, inseasonEnd: true }
				}),
				Team.app.models.Player.find({
					where: { teamId: ObjectID(id) },
					fields: { id: true, displayName: true, archived: true }
				})
			]);
			const transferContracts = await Team.app.models.TransferContract.find({
				where: { personId: { inq: players.map(({ id }) => id) }, status: true },
				include: [
					{
						relation: 'agentContracts',
						scope: {
							include: ['fee', 'bonuses']
						}
					},
					'bonuses',
					'valorization'
				]
			});

			return {
				id: {
					national,
					international,
					achieved
				},
				tableData: getCashFlowData(seasons, transferContracts, national, international, achieved)
			};
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Team.getPlayerForCompare = async function (id) {
		try {
			console.log(`[TEAM] Getting players for compare ${id}`);
			const query = { where: { teamId: ObjectID(id) } };
			const include = [{ relation: 'attributes' }];
			const [team, players] = await Promise.all([
				Team.findById(id),
				Team.app.models.ProfilePlayers.getPlayersWithContractAndWages(query, include)
			]);

			const basicWages = await Team.app.models.BasicWage.find({
				where: {
					contractId: {
						inq: flatten(players.map(({ employmentContracts }) => employmentContracts() || [])).map(({ id }) => id)
					},
					type: 'basicWage'
				}
			});

			players.forEach(player => {
				const contract = (player.employmentContracts() || [])[0];
				if (contract) {
					// const contractMonths = getContractLengthMonths(contract);
					const contractBasicWages = basicWages.filter(({ contractId }) => String(contractId) === String(contract.id));
					player.marketValue = getPlayerValue(player);
					player.contractExpiry = contract?.dateTo;
					player.monthlyWage = getTotalElementsAmountForSeasonNew(contract, contractBasicWages) / 12;
				}
			});

			return {
				...pick(JSON.parse(JSON.stringify(team)), ['id', 'name', 'mainSplitName', 'mainGameName']),
				players
			};
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Team.getAllDrillCanvases = async function (teamId) {
		try {
			console.log(`[TEAM] Getting drill canvases for team ${teamId}`);
			const data = await getAllDrillCanvases(teamId);
			return data;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Team.getSingleDrillCanvas = async function (teamId, canvasId) {
		try {
			console.log(`[TEAM] Getting drill canvas ${canvasId} for team ${teamId}`);
			const data = await getSingleDrillCanvas(teamId, canvasId);
			return data;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Team.createDrillCanvas = async function (teamId, canvas) {
		try {
			console.log(`[TEAM] Creating drill canvas for team ${teamId}`);
			const data = await createDrillCanvas(teamId, canvas);
			return data;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Team.updateDrillCanvas = async function (teamId, canvas) {
		try {
			console.log(`[TEAM] Updating drill canvas ${canvas.id} for team ${teamId}`);
			const data = await updateDrillCanvas(teamId, canvas);
			return data;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Team.deleteDrillCanvas = async function (teamId, canvasId) {
		try {
			console.log(`[TEAM] Deleting drill canvas ${canvasId} for team ${teamId}`);
			const data = await deleteDrillCanvas(teamId, canvasId);
			return data;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};
	// region Game Report Templates
	Team.getGameReportTemplates = async function (teamId) {
		console.log(`[TEAM] Getting Game Report Templates for team ${teamId}`);
		const templates = await getAllTemplates(gameTemplateServicePath, 'teams', teamId);
		const grouped = groupBy(templates, '_key');
		const values = Object.values(grouped);
		return flatten(values);
	};

	Team.getSingleGameReportTemplateVersion = async function (teamId, templateKey, version) {
		console.log(`[TEAM] Getting Single Game Reports for team ${teamId} with key ${templateKey} and version ${version}`);
		return await getSingleTemplateVersion(gameTemplateServicePath, templateKey, version);
	};

	Team.upsertGameReportTemplate = async function (teamId, template) {
		const log = template._id ? 'Updating' : 'Creating';
		console.log(`[TEAM] ${log} Game Report for team ${teamId}`);
		const response = await (template._id
			? updateTemplate(gameTemplateServicePath, template)
			: createTemplate(gameTemplateServicePath, template));
		return response;
	};
	// endregion
	// region Training Game Report Templates
	Team.getTrainingReportTemplates = async function (teamId) {
		console.log(`[TEAM] Getting Training Report Templates for team ${teamId}`);
		const templates = await getAllTemplates(trainingTemplateServicePath, 'teams', teamId);
		const grouped = groupBy(templates, '_key');
		const values = Object.values(grouped);
		return flatten(values);
	};

	Team.getSingleTrainingReportTemplateVersion = async function (teamId, templateKey, version) {
		console.log(
			`[TEAM] Getting Single Training Reports for team ${teamId} with key ${templateKey} and version ${version}`
		);
		return await getSingleTemplateVersion(trainingTemplateServicePath, templateKey, version);
	};

	Team.upsertTrainingReportTemplate = async function (teamId, template) {
		const log = template._id ? 'Updating' : 'Creating';
		console.log(`[TEAM] ${log} Training Report for team ${teamId}`);
		const response = await (template._id
			? updateTemplate(trainingTemplateServicePath, template)
			: createTemplate(trainingTemplateServicePath, template));
		return response;
	};
	// endregion
};

function getPipelineForPermission(permission, { Team, currentTeamId, customer, personIds }) {
	switch (permission) {
		case 'drills':
			return [getAttachmentsPipeline(Team, currentTeamId, 'Drill')];
		case 'infirmary':
			return [getInjuryPipeline(Team, currentTeamId), getMedicalTreatmentPipeline(Team, currentTeamId)];
		case 'planning':
			return [getEventPipeline(Team, currentTeamId)];
		case 'preferences':
			return [getTeamPipeline(Team, currentTeamId)];
		case 'scouting':
			return [
				getAttachmentsPipeline(Team, currentTeamId, 'ScoutingLineup'),
				getPlayerScoutingPipeline(Team, customer.clubId)
			];
		case 'scouting-games':
			return [
				getAttachmentsPipeline(Team, currentTeamId, 'ScoutingGame'),
				getScoutingGameReportPipeline(Team, currentTeamId, 'ScoutingGame')
			];
		case 'video-gallery':
			return [getVideoAssetPipeline(Team, currentTeamId)];
		case 'tests':
			return [
				getAttachmentsPipeline(Team, currentTeamId, 'Test', { medical: false }),
				getTestInstancePipeline(Team, currentTeamId, 'TestInstance', { medical: false }) // TODO: change
			];
		case 'examination':
			return [
				getAttachmentsPipeline(Team, currentTeamId, 'Test', { medical: true }),
				getTestInstancePipeline(Team, currentTeamId, 'TestInstance', { medical: true }) // TODO: change
			];
		case 'legal':
			return [
				getEmploymentContractPipeline(Team, personIds, 'Player'),
				getTransferContractPipeline(Team, personIds, 'Player'),
				getEmploymentContractPipeline(Team, personIds, 'Staff')
			];
		default:
			return [];
	}
}

function getPipeline(teamId) {
	return [
		{
			$match: {
				observed: true,
				$or: [
					{ teamId: ObjectID(teamId) },
					{
						[`observerTeams.${teamId}`]: { $exists: true }
					}
				]
			}
		},
		{
			$project: {
				clubId: 1,
				teamId: 1,
				name: 1,
				lastName: 1,
				displayName: 1,
				downloadUrl: 1,
				email: 1,
				phone: 1,
				position: 1,
				birthDate: 1,
				birthYear: { $year: '$birthDateCalculated' },
				nationality: 1,
				altNationality: 1,
				passport: 1,
				altPassport: 1,
				foot: 1,
				nationalityOrigin: 1,
				currentTeam: 1,
				currentLeague: 1,
				contractEnd: 1,
				agent: 1,
				agentEmail: 1,
				agentPhone: 1,
				weight: 1,
				height: 1,
				associatedPlayer: 1,
				recommended: 1,
				wageFrom: 1,
				wageTo: 1,
				feeFrom: 1,
				feeTo: 1,
				archived: 1,
				notesThreads: 1,
				wyscoutId: 1,
				instatId: 1,
				observerTeams: 1,
				movOnBall: 1,
				movOffBall: 1,
				passing: 1,
				finishing: 1,
				defending: 1,
				technique: 1
			}
		},
		{ $lookup: { from: 'ScoutingGameReport', localField: '_id', foreignField: 'playerScoutingId', as: 'gameReports' } },
		{
			$lookup: {
				from: 'PlayerAttributesEntry',
				localField: '_id',
				foreignField: 'personId',
				as: 'attributes'
			}
		},
		{
			$lookup: {
				from: 'PlayerDescriptionEntry',
				localField: '_id',
				foreignField: 'personId',
				as: 'descriptions'
			}
		}
	];
}

function getScoutingGameReportsWithGame(teamId, dates, { first, rows, filters, sortField, sortOrder }, csv) {
	const commonStages = [
		{
			$match: {
				teamId: ObjectID(teamId),
				'denormalizedScoutingGameFields.start': {
					$gte: moment(dates[0]).toDate(),
					$lte: moment(dates[1]).toDate()
				}
			}
		}
	];
	if (isFiltersDefined(filters)) {
		const filterMatches = Object.entries(filters)
			.filter(([, { value }]) => value.length > 0)
			.map(([key, { value }]) => getQueryParam(key, value))
			.map($match => ({ $match }));
		commonStages.push(...filterMatches);
	}
	commonStages.push({
		$addFields: {
			lastUpdate: {
				$function: {
					body: function (history) {
						return history.length > 0 ? history[0].updatedAt : null;
					},
					args: ['$history'],
					lang: 'js'
				}
			},
			lastUpdateAuthor: {
				$function: {
					body: function (history) {
						return history.length > 0 && history[0].author != null ? history[0].author : null;
					},
					args: ['$history'],
					lang: 'js'
				}
			}
			// birthYear: {
			// 	$function: {
			// 		body: function (birthDate) {
			// 			return new Date(birthDate).getFullYear();
			// 		},
			// 		args: ['$birthDate'],
			// 		lang: 'js'
			// 	}
			// }
		}
	});
	let laterStages = [];
	if (!csv) {
		laterStages = [
			{
				$facet: {
					count: [{ $count: 'count' }],
					items: [
						{
							$sort: { [getSortField(sortField)]: sortOrder }
						},
						{ $skip: first }
					],
					scout: [{ $group: { _id: '$scoutId' } }],
					player: [{ $group: { _id: { displayName: '$displayName', playerScoutingId: '$playerScoutingId' } } }],
					awayTeam: [{ $group: { _id: '$denormalizedScoutingGameFields.awayTeam' } }],
					homeTeam: [{ $group: { _id: '$denormalizedScoutingGameFields.homeTeam' } }],
					level: [{ $group: { _id: '$level' } }],
					nationality: [{ $group: { _id: '$nationality' } }],
					position: [{ $group: { _id: '$position' } }],
					// birthYear: [{ $group: { _id: '$birthYear' } }],
					lastUpdate: [{ $group: { _id: '$lastUpdate' } }],
					lastUpdateAuthor: [{ $group: { _id: '$lastUpdateAuthor' } }],
					thirdPartyProvider: [{ $group: { _id: '$denormalizedScoutingGameFields.thirdPartyProvider' } }],
					competition: [{ $group: { _id: '$denormalizedScoutingGameFields.thirdPartyProviderCompetitionId' } }]
				}
			}
		];
		if (rows !== null) {
			laterStages[0].$facet.items.push({ $limit: rows });
		}
	}
	return [...commonStages, ...laterStages];
}

function getQueryParam(key, value) {
	return value.length > 1 ? getMultipleConditions(key, value) : getSingleCondition(key, value);
}

function getMultipleConditions(key, value) {
	if (key === 'teams') {
		return {
			$or: value.map(cond => ({
				$or: [{ 'denormalizedScoutingGameFields.homeTeam': cond }, { 'denormalizedScoutingGameFields.awayTeam': cond }]
			}))
		};
	}
	if (key === 'competition') {
		return {
			$or: value.map(cond => ({ 'denormalizedScoutingGameFields.thirdPartyProviderCompetitionId': cond }))
		};
	} else if (key === 'player') {
		return {
			$or: value.map(
				cond => (
					{
						playerScoutingId:
							cond?.playerScoutingId && cond?.playerScoutingId !== 'undefined' ? ObjectID(cond.playerScoutingId) : ''
					},
					{ displayName: cond?.displayName }
				)
			)
		};
	} else if (key === 'scout') {
		return {
			$or: value.map(cond => ({ scoutId: ObjectID(cond) }))
		};
	} else if (key === 'lastUpdate') {
		return {
			$or: value.map(cond => ({ 'history.updatedAt': cond }))
		};
	} else if (key === 'lastUpdateAuthor') {
		return {
			$or: value.map(cond => ({ 'history.author': cond }))
		};
	} else if (key === 'birthYear') {
		return {
			$or: value.map(cond => ({ birthDate: { $gte: new Date(cond, 0, 1), $lte: new Date(cond, 11, 31, 12, 59, 59) } }))
		};
	} else return { $or: value.map(cond => ({ [key]: cond })) };
}

function getSingleCondition(key, value) {
	if (key === 'teams') {
		return {
			$or: [
				{ 'denormalizedScoutingGameFields.homeTeam': value[0] },
				{ 'denormalizedScoutingGameFields.awayTeam': value[0] }
			]
		};
	} else if (key === 'competition') {
		return {
			$or: [{ 'denormalizedScoutingGameFields.thirdPartyProviderCompetitionId': value[0] }]
		};
	} else if (key === 'player') {
		return {
			$or: [
				{
					playerScoutingId:
						value[0]?.playerScoutingId && value[0]?.playerScoutingId !== 'undefined'
							? ObjectID(value[0]?.playerScoutingId)
							: ''
				},
				{ displayName: value[0]?.displayName }
			]
		};
	} else if (key === 'scout') {
		return {
			$or: [{ scoutId: ObjectID(value[0]) }]
		};
	} else if (key === 'lastUpdate') {
		return {
			$or: [{ 'history.updatedAt': value[0] }]
		};
	} else if (key === 'lastUpdateAuthor') {
		return {
			$or: [{ 'history.author': value[0] }]
		};
	} else if (key === 'birthYear') {
		return {
			$or: [{ birthDate: { $gte: new Date(value[0], 0, 1), $lte: new Date(value[0], 11, 31, 12, 59, 59) } }]
		};
	} else {
		return { [key]: value[0] };
	}
}

function isFiltersDefined(filters) {
	return filters && Object.keys(filters).length > 0 && Object.values(filters).some(({ value }) => value.length > 0);
}

function getSortField(sortField) {
	switch (sortField) {
		case 'homeTeam':
		case 'awayTeam':
		case 'title':
		case 'thirdPartyProviderCompetitionId':
		case 'start':
			return `denormalizedScoutingGameFields.${sortField || 'start'}`;
		default:
			return sortField || 'start';
	}
}

function getPipelineEventVideos(teamId, staffId, customerId, categories) {
	const customerFilter = {
		$or: [{ authorId: String(customerId) }, { sharedStaffIds: staffId }]
	};
	const videoStage =
		Array.isArray(categories) && !isEmpty(categories)
			? { $match: { teamId: ObjectID(teamId), ...customerFilter, category: { $in: categories } } }
			: { $match: { teamId: ObjectID(teamId), ...customerFilter } };
	return [
		videoStage,
		{ $addFields: { sharedPlayerIds: { $ifNull: ['$sharedPlayerIds', []] } } },
		{
			$lookup: {
				from: 'Event',
				let: {
					eventId: {
						$toObjectId: '$linkedId'
					}
				},
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: ['$_id', '$$eventId']
							}
						}
					},
					{
						$project: {
							_id: 1,
							id: 1,
							start: 1,
							format: 1,
							players: 1,
							staff: 1,
							_playerMatchStats: 1
						}
					}
				],
				as: 'linkedObject'
			}
		},
		{
			$unwind: {
				path: '$linkedObject',
				includeArrayIndex: 'string',
				preserveNullAndEmptyArrays: false
			}
		},
		{
			$addFields: { 'linkedObject.id': '$linkedObject._id' }
		}
	];
}

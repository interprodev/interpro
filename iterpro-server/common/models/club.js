const ObjectID = require('mongodb').ObjectID;
const { groupBy, flatten, isEmpty, pick, last, sortBy } = require('lodash');
const moment = require('moment');
const {
	createTemplate,
	getAllTemplates,
	getSingleTemplateVersion,
	updateTemplate
} = require('../../server/models/services-connectors/custom-report-templates/custom-report-template');
const { BadRequestError, InternalError } = require('../modules/error');
const {
	getTransferFee,
	getAgentFeePercentage,
	getPlayerValue,
	getAmortizationSeason,
	getGainLossPercentage,
	getLegalStatusFromContract,
	getTotalElementsAmountForSeasonNew,
	getTotalConditionalElementsAmountForSeasonNew,
	getNetBookValue,
	getGainLoss,
	getAmortizationFromContracts,
	getAgentFeeFromAllContractsNew,
	getAssetValueNew
} = require('../../server/shared/financial-utils');
const scoutingReportServicePath = 'scouting-game';

const passwordUtil = require('../modules/lambda-password-utils');
const { decryptPlayers } = require('../modules/db.utils');
const { initTransferObject, setTransferCost } = require('../../server/shared/transfers-utils');

module.exports = function (Club) {
	Club.getScoutingEventsForCalendar = async function (
		clubId,
		[start, end],
		{ currentTeamId: teamId, id: customerId, players }
	) {
		console.log(`[CLUB] Getting Scouting Games for club ${clubId} between ${start} and ${end}`);
		const teamSettings = await Club.app.models.CustomerTeamSettings.findOne({
			where: { customerId: ObjectID(customerId), teamId: ObjectID(teamId) }
		});
		const isScoutingAdmin = hasScoutingAdminPermissions(teamSettings);
		const pipeline = getScoutingEventsPipeline(clubId, start, end, isScoutingAdmin, customerId);
		const games = await Club.getDataSource()
			.connector.collection(Club.app.models.ScoutingGame.modelName)
			.aggregate(pipeline)
			.toArray();
		return (games || []).map(game => ({
			...game,
			assignedTo: isScoutingAdmin ? game?.assignedTo : game?.assignedTo.filter(id => String(id) === String(customerId)),
			isAdminOrUniqueScout:
				isScoutingAdmin || (game?.assignedTo?.length === 1 && String(game.assignedTo[0]) === String(customerId))
		}));
	};

	Club.getGameReportTemplates = async function (clubId) {
		console.log(`[CLUB] Getting Game Report Templates for club ${clubId}`);
		const templates = await getAllTemplates(scoutingReportServicePath, 'clubs', clubId);
		const grouped = groupBy(templates, '_key');
		const values = Object.values(grouped);
		return flatten(values);
	};

	Club.getSingleGameReportTemplateVersion = async function (clubId, templateKey, version) {
		console.log(`[CLUB] Getting Single Game Reports for club ${clubId} with key ${templateKey} and version ${version}`);
		return await getSingleTemplateVersion(scoutingReportServicePath, templateKey, version);
	};

	Club.upsertGameReportTemplate = async function (clubId, template) {
		const log = template._id ? 'Updating' : 'Creating';
		console.log(`[CLUB] ${log} Game Report for club ${clubId}`);
		const response = await (template._id
			? updateTemplate(scoutingReportServicePath, template)
			: createTemplate(scoutingReportServicePath, template));
		return response;
	};

	Club.getPeopleForSquads = async function (
		clubId,
		model,
		page,
		sortByField,
		order,
		season,
		teams,
		textQuery,
		statuses,
		positions,
		nationalities,
		birthYears,
		origins,
		contractTypes,
		contractExpiryYears,
		notarizationStatues,
		feeRange,
		wageRange,
		netValueFlag,
		timezoneOffset
	) {
		try {
			if (!clubId) throw BadRequestError('Club ID not defined');
			console.log(`[CLUB] Getting squads ${model} for club ${clubId}`);
			if (!season || season === '') throw BadRequestError('Club Season not defined!');

			const [club, clubSeason, requestedTeams] = await Promise.all([
				Club.findById(clubId),
				Club.app.models.ClubSeason.findById(season),
				Club.app.models.Team.find({
					where: { id: { inq: teams.map(ObjectID) } }
				})
			]);
			const teamSeasons = await clubSeason.teamSeasons.find();

			let decryptedPeople = [];
			let employmentContracts = [];
			let transferContracts = [];
			let bonuses = [];
			let basicWages = [];

			if (!isEmpty(teams)) {
				const aggregation = getPipelineSquadsPeople(teams);
				const criptedPeople = await Club.app.models[model]
					.getDataSource()
					.connector.collection(Club.app.models[model].modelName)
					.aggregate(aggregation)
					.toArray();
				const fields = [
					'displayName',
					'firstName',
					'name',
					'lastName',
					'birthDate',
					'fiscalIssue',
					'nationality',
					'passport',
					'idCard',
					'phone',
					'mobilePhone',
					'email',
					'federalId'
				];
				if (model === 'Staff') fields.push('position');
				decryptedPeople = await decryptPlayers(criptedPeople, fields);

				const where = { personId: { in: decryptedPeople.map(({ _id }) => ObjectID(_id)) } };
				const include = [
					{
						relation: 'agentContracts',
						scope: {
							include: ['fee', 'bonuses']
						}
					}
				];
				[employmentContracts, transferContracts, bonuses, basicWages] = await Promise.all([
					Club.app.models.EmploymentContract.find({ where, include }),
					Club.app.models.TransferContract.find({ where, include }),
					Club.app.models.Bonus.find({ where }),
					Club.app.models.BasicWage.find({ where })
				]);
			}

			const mappedPeople = decryptedPeople.map(person => {
				const team = requestedTeams.find(({ id }) => String(id) === String(person.teamId));

				const playerEmploymentContracts = employmentContracts.filter(
					({ personId }) => String(personId) === String(person._id)
				);
				const playerTransferContracts = transferContracts.filter(
					({ personId }) => String(personId) === String(person._id)
				);
				const playerBonuses = bonuses.filter(({ personId }) => String(personId) === String(person._id));
				const playerWages = basicWages.filter(({ personId }) => String(personId) === String(person._id));

				const season = (teamSeasons || []).find(({ teamId }) => String(teamId) === String(person.teamId));

				if (!season)
					throw InternalError(
						'No team seasons found. Please verify that all the team seasons are correctly linked to their own Club Season.'
					);
				return mapSquadPerson(
					person,
					playerEmploymentContracts,
					playerTransferContracts,
					playerBonuses,
					playerWages,
					season,
					netValueFlag,
					club,
					team,
					timezoneOffset
				);
			});

			const filteredPeople = mappedPeople.filter(
				person =>
					filterByTextQuery(person, textQuery) &&
					filterByArchiveStatus(person, statuses) &&
					filterByTeams(person, teams) &&
					filterByBasicParameter(person.position, positions) &&
					filterByBasicParameter(person.nationality, nationalities) &&
					filterByBasicParameter(person.birthYear, birthYears) &&
					filterByBasicParameter(person.nationalityOrigin, origins) &&
					filterByBasicParameter(moment(person.contractExpiry).year(), contractExpiryYears) &&
					filterByBasicParameter(person.contractStatus, contractTypes) &&
					filterByContractNotarizationStatus(person.currentContractNotarized, notarizationStatues, [
						'currentContractNotarized',
						'currentContractNOTNotarized'
					]) &&
					filterByContractNotarizationStatus(person.inwardContractNotarized, notarizationStatues, [
						'inwardContractNotarized',
						'inwardContractNOTNotarized'
					]) &&
					filterByContractNotarizationStatus(person.outwardContractNotarized, notarizationStatues, [
						'outwardContractNotarized',
						'outwardContractNOTNotarized'
					]) &&
					filterByRange(person.fixedWage, wageRange) &&
					filterByRange(person.transferFee, feeRange)
			);

			if (!isEmpty(sortByField)) {
				filteredPeople.sort((a, b) => sortByParameter(a, b, order, sortByField));
			} else {
				filteredPeople.sort((a, b) => sortByParameter(a, b, 'asc', 'displayName'));
			}

			let pageResult = filteredPeople;
			const totalRows = filteredPeople.length;
			if (page >= 0) {
				const pageLength = 30;
				const begin = pageLength * page;
				const end = pageLength * (page + 1);
				pageResult = filteredPeople.slice(begin, end < totalRows ? end : totalRows);
			}

			return { people: pageResult, totalRows };
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Club.addNewCustomer = async function (clubId, customer) {
		console.log(`[CLUB] Creating Customers for club ${clubId}`);
		const { password: tempPassword } = await passwordUtil.generateStrongPassword();
		if (!tempPassword) {
			console.error(`Error while generating temporary password!`);
			throw InternalError('Error while generating temporary password!');
		}
		// setting temporary password at first time customer creation.
		customer.password = tempPassword;
		customer.isTempPassword = true;
		const response = await Club.app.models.Customer.create(customer);
		if (!response) {
			console.error(`Customer not created successfully!`);
			throw InternalError('Error while sending welcome email!');
		}
		return response;
	};

	Club.getTransfersBalance = async function (id, transferWindowId, transferIds) {
		console.log(`[CLUB] Getting transfer balance for club ${id}`);
		if (!transferWindowId && (!transferIds || transferIds.length === 0))
			return BadRequestError('Endpoint parameters missing');

		const query = transferWindowId
			? {
					where: { transferWindowId }
			  }
			: {
					where: { _id: { inq: transferIds.map(ObjectID) } }
			  };

		const transfers = await Club.app.models.ClubTransfer.find(query);

		const salePhases = ['transferable', 'contacted', 'negotiation', 'sold', 'rejected'];
		const purchasePhases = ['recommended', 'contacted', 'negotiation', 'signed', 'rejected'];

		/**
		 * current status can be transferable and will not be included in either sale or purchase.
		 * salesTransfers will include only contacted/negotiation/sold
		 * purchasesTransfers will include only recommended/contacted/negotiation/signed
		 */
		const salesTransfers = transfers.filter(
			({ currentStatus, isPurchase }) => !isPurchase && currentStatus && salePhases.includes(currentStatus)
		);
		const purchasesTransfers = transfers.filter(
			({ isPurchase, currentStatus }) => isPurchase && currentStatus && purchasePhases.includes(currentStatus)
		);

		// initializing deal breadown objects
		let sales = initTransferObject(salePhases);
		let purchases = initTransferObject(purchasePhases);

		// setting deal breakdown object for sales
		if (salesTransfers?.length > 0) {
			for (const sale of salesTransfers) {
				const transferPlayer = await sale.player.get();
				if (!transferPlayer?.id) continue;
				const [employments, transfers] = await Promise.all([
					Club.app.models.EmploymentContract.find({
						where: { personId: transferPlayer.id },
						include: [
							{
								relation: 'agentContracts',
								scope: {
									include: ['fee', 'bonuses']
								}
							},
							'bonuses',
							'basicWages'
						]
					}),
					Club.app.models.TransferContract.find({
						where: { personId: transferPlayer.id },
						include: [
							{
								relation: 'agentContracts',
								scope: {
									include: ['fee', 'bonuses']
								}
							}
						]
					})
				]);
				sales = await setTransferCost(sale, transferPlayer, employments, transfers, sales, 'outward');
			}
		}

		// setting deal breakdown object for purchases
		if (purchasesTransfers?.length > 0) {
			for (const purchase of purchasesTransfers) {
				const transferPlayer = await purchase.player.get();
				if (!transferPlayer?.id) continue;
				const [employments, transfers] = await Promise.all([
					Club.app.models.EmploymentContract.find(
						{ where: { personId: transferPlayer.id } },
						{
							include: [
								{
									relation: 'agentContracts',
									scope: {
										include: ['fee', 'bonuses']
									}
								},
								'bonuses',
								'basicWages'
							]
						}
					),
					Club.app.models.TransferContract.find(
						{ where: { personId: transferPlayer.id } },
						{
							include: [
								{
									relation: 'agentContracts',
									scope: {
										include: ['fee', 'bonuses']
									}
								}
							]
						}
					)
				]);
				purchases = await setTransferCost(purchase, transferPlayer, employments, transfers, purchases, 'inward');
			}
		}

		return {
			salesBreakdown: sales,
			purchasesBreakdown: purchases
		};
	};
};

function getScoutingEventsPipeline(clubId, start, end, isScoutingAdmin, customerId) {
	const stages = [
		{
			$match: {
				clubId: ObjectID(clubId),
				start: { $gte: moment(start).toDate(), $lte: moment(end).toDate() }
			}
		},
		{
			$project: {
				title: 1,
				start: 1,
				startTime: 1,
				endTime: 1,
				location: 1,
				assignedTo: 1,
				author: 1,
				homeTeam: 1,
				awayTeam: 1,
				teamId: 1
			}
		},
		{
			$lookup: {
				// TODO: split into multiple queries
				from: 'ScoutingGameReport',
				let: { gameId: '$_id' },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [{ $eq: ['$scoutingGameId', '$$gameId'] }, { $eq: ['$scoutId', ObjectID(customerId)] }]
							}
						}
					},
					{ $project: { playerScoutingId: 1, displayName: 1 } }
				],
				as: 'gameReports'
			}
		}
	];
	if (!isScoutingAdmin) {
		stages[0].$match.$and = [
			{
				$or: [{ author: customerId }, { assignedTo: customerId }]
			}
		];
		stages[2].$lookup.pipeline[0].$match.$expr.$and.push({ $eq: ['$scoutId', ObjectID(customerId)] });
	}
	return stages;
}

function hasScoutingAdminPermissions(teamSettings) {
	if (!teamSettings) return false;
	return (teamSettings.permissions || []).includes('scouting-games-report');
}

function documentStatus(documents = []) {
	const dates = documents
		.map(({ expiryDate }) => expiryDate)
		.filter(Boolean)
		.sort(
			(a, b) =>
				// Turn strings into dates, and then subtract them
				// to get a value that is either negative, positive, or zero.
				new Date(a) - new Date(b)
		);
	return dates.length > 0 ? dates[0] : null;
}

function filterByTextQuery({ name, firstName, displayName, lastName, id }, text) {
	if (isEmpty(text)) return true;
	const searchText = text.toLowerCase();
	return (
		(name || firstName).toLowerCase().indexOf(searchText) > -1 ||
		displayName.toLowerCase().indexOf(searchText) > -1 ||
		lastName.toLowerCase().indexOf(searchText) > -1 ||
		String(id) === text
	);
}

function filterByArchiveStatus({ archived }, status) {
	if (isEmpty(status)) return !archived; // default show only active
	return (status.indexOf('active') > -1 && !archived) || (status.indexOf('archived') > -1 && archived);
}

function filterByTeams({ teamId }, teams) {
	if (isEmpty(teams)) return true;
	return teams.indexOf(String(teamId)) > -1;
}

function filterByRange(value, [min, max]) {
	if (!min && !max) return true;
	if (min && !max) return value >= min;
	if (!min && max) return value <= max;
	return value >= min && value <= max;
}

function filterByBasicParameter(field, parameters) {
	if (isEmpty(parameters)) return true;
	return parameters.indexOf(field) > -1;
}

function filterByContractNotarizationStatus(field, filters, [notarized, notNotarized]) {
	if (isEmpty(filters)) return true;
	if (anyFiltersAreFilled(filters, [notarized, notNotarized]))
		return (isFilterFilled(filters, notarized) && field) || (isFilterFilled(filters, notNotarized) && !field);
	else return true;
}

function isFilterFilled(filters, filterValue) {
	return filters.indexOf(filterValue) > -1;
}

function anyFiltersAreFilled(filters, values) {
	return values.some(value => filters.indexOf(value) > -1);
}

function sortByParameter(a, b, order, sortByField) {
	let result = 0;
	order = !order || order.toLowerCase() !== 'desc' ? 1 : -1;
	const value1 = a[sortByField];
	const value2 = b[sortByField];

	// null values are at the end of the list
	if (value1 === null) {
		return 1;
	} else if (value2 === null) {
		return -1;
	}
	result = 0;
	if (!value1 && value2) result = -1;
	else if (value1 && !value2) result = 1;
	else if (typeof value1 === 'string' && typeof value2 === 'string') result = value1.localeCompare(value2);
	else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;

	return order * result;
}

// NEW METHODS FOR SQUADS PEOPLE
function getPipelineSquadsPeople(teams) {
	const teamIds = teams.map(ObjectID);

	return [
		{
			$match: {
				teamId: { $in: teamIds }
			}
		},
		{
			$addFields: {
				idCardDocuments: {
					$filter: {
						input: '$documents',
						as: 'item',
						cond: {
							$eq: ['$$item.type', 'idCard']
						}
					}
				},
				passportDocuments: {
					$filter: {
						input: '$documents',
						as: 'item',
						cond: {
							$eq: ['$$item.details', 'passport']
						}
					}
				},
				membershipTeams: {
					$filter: {
						input: '$federalMembership',
						as: 'item',
						cond: {
							$eq: ['$$item.details', 'membershipTeam']
						}
					}
				},
				firstMembershipPros: {
					$filter: {
						input: '$federalMembership',
						as: 'item',
						cond: {
							$eq: ['$$item.details', 'firstMembershipPro']
						}
					}
				},
				firstMembershipTeams: {
					$filter: {
						input: '$federalMembership',
						as: 'item',
						cond: {
							$eq: ['$$item.type', 'firstMembershipTeam']
						}
					}
				}
			}
		},
		{
			$addFields: {
				pic: '$downloadUrl'
			}
		},
		{
			$project: {
				_id: 1,
				birthPlace: 1,
				foot: 1,
				teamId: 1,
				clubId: 1,
				downloadUrl: 1,
				fiscalIssue: 1,
				firstName: 1,
				name: 1,
				lastName: 1,
				displayName: 1,
				height: 1,
				weight: 1,
				nationality: 1,
				preferredFoot: 1,
				birthDate: 1,
				position: 1,
				customerId: 1,
				shoeSize: 1,
				idCard: { $ifNull: [{ $arrayElemAt: ['$idCardDocuments.number', 0] }, null] },
				passport: { $ifNull: [{ $arrayElemAt: ['$passportDocuments.number', 0] }, null] },
				phone: 1,
				mobilePhone: 1,
				email: 1,
				federalId: 1,
				archived: 1,
				archivedDate: 1,
				deleted: 1,
				documents: 1,
				_statusHistory: 1,
				value: 1,
				clubValue: 1,
				transfermarktValue: 1,
				anamnesys: 1,
				agentValue: 1,
				valueField: 1,
				_thresholdsFinancial: 1,
				// origin: {
				// 	$cond: {
				// 		if: { $eq: ['$inward.type', null] },
				// 		then: null,
				// 		else: { $concat: ['admin.contracts.origin.', '$inward.type'] }
				// 	}
				// },
				nationalityOrigin: 1,
				membershipTeam: { $ifNull: [{ $arrayElemAt: ['$membershipTeams.from', 0] }, null] },
				firstMembershipPro: { $ifNull: [{ $arrayElemAt: ['$firstMembershipPros.issueDate', 0] }, null] },
				firstMembershipTeam: { $ifNull: [{ $arrayElemAt: ['$firstMembershipTeams.issueDate', 0] }, null] },
				pic: 1,
				instatId: {
					$cond: {
						if: { $eq: ['$provider', 'Instat'] },
						then: '$instatId',
						else: '$$REMOVE'
					}
				},
				wyscoutId: {
					$cond: {
						if: { $eq: ['$provider', 'Wyscout'] },
						then: '$wyscoutId',
						else: '$$REMOVE'
					}
				}
			}
		}
	];
}

function mapSquadPerson(
	person,
	employmentContracts,
	transferContracts,
	bonuses,
	wages,
	season,
	netValueFlag,
	{ name, vat, taxes },
	team,
	timezoneOffset
) {
	const activeEmployment = employmentContracts.find(({ status }) => status);
	const activeInward = transferContracts.find(({ status, typeTransfer }) => status && typeTransfer === 'inward');
	const activeOutward = transferContracts.find(({ status, typeTransfer }) => status && typeTransfer === 'outward');

	const basicWages = wages.filter(
		({ type, contractId }) => type === 'basicWage' && String(contractId) === String(activeEmployment?.id)
	);
	const contributions = wages.filter(
		({ type, contractId }) => type === 'contribution' && String(contractId) === String(activeEmployment?.id)
	);
	const valorizations = wages.filter(
		({ type, contractId }) => type === 'valorization' && String(contractId) === String(activeInward?.id)
	);

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

	person.team = team?.name;
	person.provider = team?.providerTeam;

	person.club = name;
	person.clubVat = vat;
	person.clubTaxes = taxes;

	// legal
	person.contractStatus = getLegalStatusFromContract(person, activeInward, activeOutward);
	person.currentContractNotarized = activeEmployment?.validated || undefined;
	person.contractFrom = activeEmployment?.dateFrom || undefined;
	person.contractExpiry = activeEmployment?.dateTo || undefined;
	person.inwardContractNotarized = activeInward?.validated || undefined;
	person.outwardContractNotarized = activeOutward?.validated || undefined;

	// Salary
	person.fixedWage = getTotalElementsAmountForSeasonNew(activeEmployment, basicWages, season?.id, !netValueFlag, vat);
	person.contributions = getTotalElementsAmountForSeasonNew(
		activeEmployment,
		contributions,
		season?.id,
		!netValueFlag,
		vat
	);
	person.appearanceFee = appearanceFee.map(({ progress }) => progress.amount || 0).reduce((a, b) => a + b, 0);
	person.performanceFee = performanceFee.map(({ progress }) => progress.amount || 0).reduce((a, b) => a + b, 0);
	person.appearanceBonus = getTotalConditionalElementsAmountForSeasonNew(
		activeEmployment,
		appearance,
		[season?.id],
		!netValueFlag,
		vat
	);
	person.performanceBonus = getTotalConditionalElementsAmountForSeasonNew(
		activeEmployment,
		performance,
		[season?.id],
		!netValueFlag,
		vat
	);
	person.teamBonus = getTotalConditionalElementsAmountForSeasonNew(
		activeEmployment,
		standardTeamBonus,
		[season?.id],
		!netValueFlag,
		vat
	);
	person.signingBonus = getTotalConditionalElementsAmountForSeasonNew(
		activeEmployment,
		signing,
		[season?.id],
		!netValueFlag,
		vat
	);
	person.customBonus = getTotalConditionalElementsAmountForSeasonNew(
		activeEmployment,
		custom,
		[season?.id],
		!netValueFlag,
		vat
	);
	person.totalBonus =
		person.appearanceBonus + person.performanceBonus + person.teamBonus + person.signingBonus + person.customBonus;

	// Asset
	person.assetValue = getAssetValueNew(
		activeInward,
		activeEmployment,
		employmentContracts,
		valorizations,
		wages,
		bonuses,
		[season],
		!netValueFlag,
		vat,
		taxes
	);
	person.transferFee = getTransferFee(activeInward, true, !netValueFlag, vat);
	person.agentFee = getAgentFeeFromAllContractsNew(activeInward, employmentContracts, true, !netValueFlag, vat);
	person.agentFeePerc = getAgentFeePercentage(person.agentFee, person.transferFee);
	person.amortizationAsset = getAmortizationFromContracts(employmentContracts, person.assetValue);
	person.netBookValue = getNetBookValue(person.assetValue, person.amortizationAsset);
	person.marketValue = getPlayerValue(person, !netValueFlag, vat);
	person.gainLoss = getGainLoss(person.marketValue, person.netBookValue);
	person.gainLossPercent = getGainLossPercentage(person.gainLoss, person.netBookValue);

	// Amortization
	person.seasonAmortization = getAmortizationSeason(employmentContracts, person.assetValue);

	return {
		...person,
		...mapBasicProps(person, timezoneOffset)
	};
}

function mapBasicProps(person, timezoneOffset) {
	person.medicalRecord = pick(sortBy(person.anamnesys, 'expirationDate').reverse()[0], ['id', 'expirationDate']);
	person.birthYear = moment(person.birthDate).utcOffset(Number(timezoneOffset)).year();
	person.age = moment().diff(person.birthDate, 'years');
	person.archivedMotivation = getArchivedMotiviation(person);
	person.value = getPlayerValue(person);
	person.documents = person.documents || [];
	person.documentStatus = documentStatus(person.documents);
	person.id = person._id;
	person.displayName = person.displayName || `${person.firstName} ${person.lastName}`;
	delete person._id;
	delete person.valueField;
	delete person.anamnesys;
	return person;
}

function getArchivedMotiviation(person) {
	return person._statusHistory?.length &&
		last(person._statusHistory).status &&
		last(person._statusHistory).status !== ''
		? `profile.status.${last(person._statusHistory).status}`
		: '';
}

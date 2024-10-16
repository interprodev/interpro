const {
	ForbiddenError,
	InternalError,
	AuthorizationError,
	BadRequestError,
	UnprocessableEntityError,
	NotFoundError
} = require('../../common/modules/error');
const { ObjectID } = require('mongodb');
const { ONE_YEAR_IN_SECONDS: ONE_YEAR } = require('../../common/constants/commonConstants');
const CACHE_TTL = 43200;
const { isEmpty, sortBy, pick, mapValues, partition } = require('lodash');
const moment = require('moment');
const { v4: uuid } = require('uuid');
const { convert } = require('html-to-text');
const sportsConstants = require('../../common/constants/sports-constants');
const permissions = ['coachingApp'];
const tacticalInfoProvider = require('./thirdparty-connectors/tacticalInfoProvider');
const { getMedicalExamsForEvent } = require('../../common/modules/medical-event-utils');
const medicalEventUtils = require('../../common/modules/medical-event-utils');
const { getPlayerPastValues, getPlayerValue } = require('../shared/financial-utils');
const { getBonusText, getSingleConditionSimplified } = require('../shared/bonus-string-builder');
const { translateNotification, getTranslations, getLanguage, translate } = require('../shared/translate-utils');
const { getCustomerName } = require('../shared/common-utils');
const { getEventPlayerReport } = require('../shared/player-report.utils');

const notificationsType = [
	'invitation',
	'videoSharing',
	'videoComment',
	'playerVideoComment',
	'eventReminder',
	'eventUpdate'
];

const playerAttributes = [
	{
		value: 'one_to_one_att',
		label: 'profile.attributes.one_to_one',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.one_to_oneAttacking.tooltip'
	},
	{
		value: 'one_to_one_def',
		label: 'profile.attributes.one_to_one',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.one_to_oneDefending.tooltip'
	},
	{
		value: 'determination',
		label: 'profile.attributes.determination',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.determination.tooltip'
	},
	{
		value: 'finishing',
		label: 'profile.attributes.finishing',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.finishing.tooltip'
	},
	{
		value: 'first_touch',
		label: 'profile.attributes.first_touch',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.first_touch.tooltip'
	},
	{
		value: 'heading',
		label: 'profile.attributes.heading',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.heading.tooltip'
	},
	{
		value: 'passing',
		label: 'profile.attributes.passing',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.passing.tooltip'
	},
	{
		value: 'long_throws',
		label: 'profile.attributes.long_throws',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.long_throws.tooltip'
	},
	{
		value: 'marking',
		label: 'profile.attributes.marking',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.marking.tooltip'
	},
	{
		value: 'tackling',
		label: 'profile.attributes.tackling',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.tackling.tooltip'
	},
	{
		value: 'headings',
		label: 'profile.attributes.heading',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.heading.tooltip'
	},
	{
		value: 'anticipation',
		label: 'profile.attributes.anticipation',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.anticipation.tooltip'
	},
	{
		value: 'positioning',
		label: 'profile.attributes.positioning',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.positioning.tooltip'
	},
	{
		value: 'bravery',
		label: 'profile.attributes.bravery',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.bravery.tooltip'
	},
	{
		value: 'leadership',
		label: 'profile.attributes.leadership',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.leadership.tooltip'
	},
	{
		value: 'teamwork',
		label: 'profile.attributes.teamwork',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.teamwork.tooltip'
	},
	{
		value: 'concentration',
		label: 'profile.attributes.concentration',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.concentration.tooltip'
	},
	{
		value: 'flair',
		label: 'profile.attributes.flair',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.flair.tooltip'
	}
];

const playerFields = [
	'id',
	'name',
	'firstName',
	'lastName',
	'displayName',
	'email',
	'mobilePhone',
	'phone',
	'otherMobile',
	'address',
	'domicile',
	'nationality',
	'birthDate',
	'position',
	'height',
	'weight',
	'position2',
	'position3',
	'downloadUrl',
	'altNationality',
	'currentStatus',
	'passport',
	'altPassport',
	'teamId',
	'nationalityOrigin',
	'archived'
	// 'injuries',
	// 'goScores',
	// 'wellnesses'
];

module.exports = function (Coaching) {
	Coaching.getToken = async function (req) {
		const token = await Coaching.app.models.AccessToken.getDataSource()
			.connector.collection(Coaching.app.models.AccessToken.modelName)
			.findOne({ _id: req.headers['authorization'] });
		if (!token) {
			throw AuthorizationError('Auth token not provided');
		}
		return token;
	};

	Coaching.login = async function (email, password) {
		try {
			console.log(`[COACHING] Requested mobile app login from ${email}`);
			const responseToken = await Coaching.app.models.Customer.login(
				{
					email,
					password,
					ttl: ONE_YEAR
				},
				['customer']
			);

			if (!responseToken?.userId) throw AuthorizationError('Empty auth token');
			const customer = await Coaching.app.models.Customer.findOne({
				where: { id: ObjectID(responseToken.userId) },
				fields: ['id', 'clubId', 'email', 'password'],
				include: 'teamSettings'
			});

			if (!customer) return;

			const { coachingApp, active } = await Coaching.app.models.Club.findOne({
				where: { id: ObjectID(customer.clubId) },
				fields: ['coachingApp', 'active']
			});

			if (!active) {
				throw new ForbiddenError('The associated Club has been deactivated! Please contact support');
			}
			if (!coachingApp) {
				throw ForbiddenError('Coaching App not enabled for this club');
			}

			const allowedTeamSettings = (customer.teamSettings() || []).filter(({ mobilePermissions }) =>
				(mobilePermissions || []).some(permission => permissions.includes(permission))
			);
			if (isEmpty(allowedTeamSettings)) {
				throw ForbiddenError('Not enough permissions');
			}
			await customer.updateAttribute('coachingLatestLogin', moment().toDate());
			return {
				token: responseToken.id,
				customerId: customer.id
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.logout = async function (deviceId, req) {
		try {
			const token = await Coaching.getToken(req);
			if (!token) {
				throw AuthorizationError('Auth token not valid');
			}
			await Coaching.app.models.Customer.logout(token._id);
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.changePassword = async function (oldPassword, newPassword, req) {
		const token = await Coaching.getToken(req);
		console.log(`[COACHING] Requested password change from ${token.userId}`);
		const customer = await Coaching.app.models.Customer.findById(token.userId);
		if (!customer) throw InternalError('User not found');

		await Coaching.app.models.Customer.checkPasswordSecurity(newPassword);
		try {
			await customer.changePassword(oldPassword, newPassword);
		} catch (e) {
			throw InternalError(e.message);
		}
		await Coaching.app.models.Customer.postChangePassword(token.userId);

		try {
			return await Coaching.login(customer.email, newPassword);
		} catch (e) {
			throw InternalError('Invalid credentials');
		}
	};

	Coaching.resetPassword = async function (email) {
		try {
			console.log(`[COACHING] Requested password reset from ${email}`);
			const customer = await Coaching.app.models.Customer.findOne({ where: { email } });
			if (!customer) return;

			const club = await Coaching.app.models.Club.findById(customer.clubId);
			if (!club.active) {
				throw new ForbiddenError('The associated Club has been deactivated! Please contact support');
			}
			return Coaching.app.models.Customer.resetPassword({ email });
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getMinimumVersion = async function () {
		try {
			return {
				android: Number(process.env.COACHINGAPP_ANDROID_MINIMUM),
				ios: Number(process.env.COACHINGAPP_IOS_MINIMUM)
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getPositionsCoordinates = async function (req) {
		try {
			const token = await Coaching.getToken(req);
			const { clubId } = await Coaching.app.models.Customer.findById(token.userId, { clubId: 1 });
			const { sportType } = await Coaching.app.models.Club.findById(ObjectID(clubId), { currency: 1 });
			return sportsConstants[sportType].tacticBoardCoordinates;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getClub = async function (req) {
		try {
			const token = await Coaching.getToken(req);
			const customer = await getCustomer(token, Coaching);

			const [{ crest, sportType }, imageToken, teams] = await Promise.all([
				Coaching.app.models.Club.findById(customer.clubId, { fields: { crest: 1, sportType: 1, type: 1 } }),
				Coaching.app.models.Storage.getToken(String(customer.clubId)),
				Coaching.app.models.Team.find({
					where: { id: { inq: customer.teamSettings().map(({ teamId }) => teamId) } },
					fields: { id: 1, name: 1, enabledModules: 1 }
				})
			]);
			if (!imageToken) {
				console.error(`[COACHING] Image Token not found for club ${customer.clubId}`);
			}
			return {
				config: {
					sport: sportType,
					lineup: sportsConstants[sportType].lineup,
					bench: sportsConstants[sportType].bench,
					roles: sportsConstants[sportType].roles,
					positions: sportsConstants[sportType].positions
				},
				imageToken: imageToken.signature,
				teams: teams.map(team => ({
					name: team.name,
					id: team.id,
					canAccessTactics: canAccessTactics(
						customer,
						customer.teamSettings().find(({ teamId }) => String(teamId) === String(team.id))?.permissions,
						team.enabledModules
					)
				})),
				logo: crest
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getStaffs = async function (req) {
		try {
			const token = await Coaching.getToken(req);
			const customer = await getCustomer(token, Coaching);

			const teamIds = customer.teamSettings().map(({ teamId }) => ObjectID(teamId));
			const staffs = await Coaching.app.models.Staff.find({
				where: { teamId: { inq: teamIds } },
				fields: ['id', 'firstName', 'lastName', 'downloadUrl', 'archived']
			});
			const filtered = staffs.filter(player => isPlayerSearched(player, req.query));
			return filtered;
		} catch (err) {
			console.error(err);
			throw InternalError('Error while getting players');
		}
	};

	Coaching.getTeamPlayers = async function (id, req) {
		try {
			const token = await Coaching.getToken(req);
			await getCustomer(token, Coaching);

			const teamSeasons = await Coaching.app.models.TeamSeason.find({
				where: { teamId: ObjectID(req.params.id) },
				fields: ['id', 'offseason', 'inseasonEnd', 'playerIds']
			});
			const currentSeason = teamSeasons.find(({ offseason, inseasonEnd }) =>
				moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
			);
			if (!currentSeason) throw NotFoundError('Current season not set!');

			const toQuery = moment().endOf('day').toDate();
			const fromQuery = moment(prevDay(toQuery, 6)).startOf('day').toDate();
			const fromQueryGo = moment(prevDay(toQuery, 13)).startOf('day').toDate();

			const [players, teams, agents] = await Promise.all([
				Coaching.app.models.ProfilePlayers.getPlayersWithContractAndWages(
					{
						where: { _id: { in: currentSeason?.playerIds || [] } },
						fields: playerFields
					},
					[
						{
							relation: 'goScores',
							scope: {
								where: {
									date: { between: [fromQueryGo, toQuery] }
								},
								order: 'date DESC'
							}
						},
						{
							relation: 'wellnesses',
							scope: {
								where: {
									date: { gte: fromQuery, lte: toQuery }
								},
								order: 'date DESC'
							}
						},
						{
							relation: 'injuries',
							scope: {
								where: {
									or: [{ endDate: null }, { endDate: { gte: toQuery } }]
								}
							}
						}
					]
				),
				Coaching.app.models.Team.find({
					where: { _id: ObjectID(id) },
					fields: ['id', 'name']
				}),
				Coaching.app.models.Agent.find({
					where: { _id: { in: currentSeason?.staffIds || [] } },
					fields: ['id', 'firstName', 'lastName', 'mobilePhone', 'phone', 'email', 'assistedIds']
				})
			]);
			const translations = getTranslations(req.headers['accept-language']);
			const parsedPlayers = players.map(player => JSON.parse(JSON.stringify(player)));
			const filtered = parsedPlayers
				.filter(player => isPlayerSearched(player, req.query))
				.map(player => mapSearchedPlayer(player, teams, agents, translations));
			return filtered;
		} catch (err) {
			console.error(err);
			throw InternalError('Error while getting players');
		}
	};

	Coaching.getPlayers = async function (req) {
		try {
			const token = await Coaching.getToken(req);
			const customer = await getCustomer(token, Coaching);

			const teamIds = customer.teamSettings().map(({ teamId }) => ObjectID(teamId));
			const [players, teams, agents] = await Promise.all([
				Coaching.app.models.ProfilePlayers.getPlayersWithContractAndWages(
					{
						where: { teamId: { inq: teamIds } },
						fields: playerFields
					},
					[]
				),
				Coaching.app.models.Team.find({
					where: { id: { inq: teamIds } },
					fields: ['id', 'name']
				}),
				Coaching.app.models.Agent.find({
					where: { teamId: { inq: teamIds } },
					fields: ['id', 'firstName', 'lastName', 'mobilePhone', 'phone', 'email', 'assistedIds']
				})
			]);
			const translations = getTranslations(req.headers['accept-language']);
			const filtered = players
				.filter(player => isPlayerSearched(player, req.query))
				.map(player => mapSearchedPlayer(player, teams, agents, translations));
			return filtered;
		} catch (err) {
			console.error(err);
			throw InternalError('Error while getting players');
		}
	};

	Coaching.getSinglePlayer = async function (req) {
		try {
			const translations = getTranslations(req.headers['accept-language']);
			const token = await Coaching.getToken(req);
			const playerId = req.params.id;
			const customer = await getCustomer(token, Coaching);

			const teamIds = customer.teamSettings().map(({ teamId }) => ObjectID(teamId));
			const [player, teams, agents] = await Promise.all([
				Coaching.app.models.ProfilePlayers.getPlayersWithContractAndWages(
					{ where: { id: ObjectID(playerId) }, fields: playerFields },
					[]
				),
				Coaching.app.models.Team.find({
					where: { id: { inq: teamIds } },
					fields: ['id', 'name']
				}),
				Coaching.app.models.Agent.find({
					where: { teamId: { inq: teamIds } },
					fields: ['id', 'firstName', 'lastName', 'mobilePhone', 'phone', 'email', 'assistedIds']
				})
			]);
			if (!teamIds.map(String).includes(String(player.teamId))) {
				throw ForbiddenError('Unauthorized to see this player');
			}
			return mapSearchedPlayer(player, teams, agents, translations);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getPlayerStats = async function (req) {
		try {
			const token = await Coaching.getToken(req);
			const customer = await getCustomer(token, Coaching);

			const teamIds = customer.teamSettings().map(({ teamId }) => ObjectID(teamId));

			const provider = 'wyscout'; // TODO IT-3853
			const playerId = req.params.id;
			const player = await Coaching.app.models.Player.findById(playerId, {
				fields: [
					'id',
					'clubId',
					'teamId',
					'valueField',
					'value',
					'clubValue',
					'transfermarktValue',
					'agentValue',
					'_pastValues',
					'_pastClubValues',
					'_pastTransfermarktValues',
					'_pastAgentValues',
					'wyscoutId'
				],
				include: ['attributes', 'descriptions']
			});
			if (!player) {
				throw new InternalError('Player not found');
			}
			if (!teamIds.map(String).includes(String(player.teamId))) {
				throw ForbiddenError('Unauthorized to see this player');
			}
			const [club, team, teamSeasons, activeEmployment, playerBonuses, playerData, playerVideos, customers] =
				await Promise.all([
					Coaching.app.models.Club.findById(player.clubId, {
						fields: ['currency', 'name', 'scoutingSettings', 'scoutingAlt']
					}),
					Coaching.app.models.Team.findById(player.teamId, {
						fields: ['id', 'name', '_playerProviderMapping', 'playerAttributes']
					}),
					Coaching.app.models.TeamSeason.find({ where: { teamId: ObjectID(player.teamId) } }),
					Coaching.app.models.EmploymentContract.findOne({
						where: { personId: ObjectID(playerId), status: true }
					}),
					Coaching.app.models.Bonus.find({ where: { personId: ObjectID(player.id) } }),
					tacticalInfoProvider.getCareerTransfers(
						provider,
						player[tacticalInfoProvider.getProviderField(provider, 'id')]
					),
					Coaching.app.models.VideoAsset.getDataSource()
						.connector.collection(Coaching.app.models.VideoAsset.modelName)
						.find({ linkedId: String(player.id), linkedModel: 'Player' })
						.toArray(),
					Coaching.app.models.Customer.find({
						where: { clubId: ObjectID(String(player.clubId)) },
						fields: ['firstName', 'lastName', 'id']
					})
				]);
			const minutesField = team?._playerProviderMaapping?.durationField || '';
			const activeTeamSeasonId = teamSeasons.find(({ offseason, inseasonEnd }) =>
				moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
			)?.id;
			const playerFinancialData = await Coaching.app.models.ProfilePlayers.getPlayerFinancialProfile(
				playerId,
				activeTeamSeasonId,
				'currentSeason',
				minutesField,
				40
			);
			const {
				bonus,
				netBookValue,
				wage,
				gainLossPercent,
				losses,
				losses_perc,
				purchaseCost,
				residualRoi_perc,
				residualRoi,
				residualBonus,
				roi_perc,
				roi,
				totalInvestmentCost,
				untapped,
				untapped_perc
			} = playerFinancialData;
			const bonuses = (playerBonuses || []).map(bonus => prepareBonus(bonus, club, teamSeasons, req));
			const currentValue = getPlayerValue(player);
			const pastValues = getPlayerPastValues(player);
			const contractStart = activeEmployment?.dateFrom || null;
			const contractEnd = activeEmployment?.dateTo || null;
			const transfers = getPlayerTransfers(playerData);
			const careers = getPlayerCareer(playerData);
			const attributes = getAttributesData(JSON.parse(JSON.stringify(player)), playerVideos, team, customers);

			return {
				playerId,
				bonus: bonus ? parseInt(String(bonus)) : 0,
				bookValue: netBookValue ? parseInt(String(netBookValue)) : null,
				contractStart,
				contractEnd,
				currentValue: currentValue ? parseInt(String(currentValue)) : null,
				fixedWage: wage ? parseInt(String(wage)) : null,
				incrementCurrentValue: gainLossPercent || 0,
				losses: losses ? parseInt(String(losses)) : 0,
				losses_perc: losses_perc || 0,
				pastValues: pastValues?.length > 0 ? pastValues : [],
				purchaseCost: purchaseCost ? parseInt(String(purchaseCost)) : null,
				residual_perc: residualRoi_perc || 0,
				residual: residualRoi ? parseInt(String(residualRoi)) : 0,
				residualBonus: residualBonus ? parseInt(String(residualBonus)) : 0,
				roi_perc: roi_perc || 0,
				roi: roi ? parseInt(String(roi)) : 0,
				totalInvestmentCost: totalInvestmentCost ? parseInt(String(totalInvestmentCost)) : 0,
				untapped_perc: untapped_perc || 0,
				untapped: untapped ? parseInt(String(untapped)) : 0,
				bonuses,
				transfers: transfers || [],
				careers: careers || [],
				...attributes
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getMatchLineup = async function (req) {
		try {
			const translations = getTranslations(req.headers['accept-language']);
			const toQuery = moment().endOf('day').toDate();
			const fromQuery = moment(prevDay(toQuery, 6)).startOf('day').toDate();
			const fromQueryGo = moment(prevDay(toQuery, 13)).startOf('day').toDate();
			const token = await Coaching.getToken(req);
			const customer = await getCustomer(token, Coaching);

			const [team, teamSeasons] = await Promise.all([
				Coaching.app.models.Team.findOne({
					where: { id: req.params.id },
					fields: ['id', 'name']
				}),
				Coaching.app.models.TeamSeason.find({
					where: { teamId: ObjectID(req.params.id) },
					fields: ['id', 'offseason', 'inseasonEnd', 'playerIds']
				})
			]);
			const currentSeason = teamSeasons.find(({ offseason, inseasonEnd }) =>
				moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
			);
			if (!currentSeason) throw InternalError('No current season found!');
			const [sportType, matches, players, agents] = await Promise.all([
				Coaching.app.models.Club.findById(customer.clubId, { fields: { crest: 1, sportType: 1 } }),
				Coaching.app.models.Match.find({
					where: { teamSeasonId: ObjectID(currentSeason.id) },
					include: {
						relation: 'event',
						scope: {
							fields: ['opponentImageUrl']
						}
					}
				}),
				Coaching.app.models.ProfilePlayers.getPlayersWithContractAndWages(
					{
						where: { teamId: ObjectID(req.params.id) },
						fields: playerFields
					},
					[
						{
							relation: 'goScores',
							scope: {
								where: {
									date: { between: [fromQueryGo, toQuery] }
								},
								order: 'date DESC'
							}
						},
						{
							relation: 'wellnesses',
							scope: {
								where: {
									date: { gte: fromQuery, lte: toQuery }
								},
								order: 'date DESC'
							}
						},
						{
							relation: 'injuries',
							scope: {
								where: {
									or: [{ endDate: null }, { endDate: { gte: toQuery } }]
								},
								fields: {
									statusHistory: true,
									currentStatus: true,
									_injuryAssessments: true,
									issue: true,
									date: true,
									endDate: true,
									location: true,
									chronicInjuryId: true
								}
							}
						}
					]
				),
				Coaching.app.models.Agent.find({
					where: { teamId: ObjectID(req.params.id) },
					fields: ['id', 'firstName', 'lastName', 'mobilePhone', 'phone', 'email', 'assistedIds']
				})
			]);
			const match = getClosestMatch(sortBy(matches, 'date'));
			if (!match) throw InternalError('No match found!');
			const parsedPlayers = players.map(player => JSON.parse(JSON.stringify(player)));
			const offensivePhasePlayers = getLineupAndBenchAndNotCalledByPhase(
				match._offensive._players,
				parsedPlayers,
				match,
				sportType.sportType
			)
				.map((player, index) => getPlayerWithAdditionalData(index, player, parsedPlayers, [team], agents, translations))
				.filter(x => x);
			const defensivePhasePlayers = getLineupAndBenchAndNotCalledByPhase(
				match._defensive._players,
				parsedPlayers,
				match,
				sportType.sportType
			)
				.map((player, index) => getPlayerWithAdditionalData(index, player, parsedPlayers, [team], agents, translations))
				.filter(x => x);
			return {
				teamId: match.teamId,
				opponent: match.opponent,
				opponentImageUrl: match.event()?.opponentImageUrl,
				home: match.home,
				date: match.date,
				offensive: {
					tactic: match._offensive.tactic,
					players: offensivePhasePlayers
				},
				defensive: {
					tactic: match._defensive.tactic,
					players: defensivePhasePlayers
				}
			};
		} catch (err) {
			console.error(err);
			throw err;
		}
	};

	Coaching.getTeamEvents = async function (req) {
		try {
			const { id: teamId } = req.params;
			const { dateStart: from, dateEnd: to } = req.query;
			const token = await Coaching.getToken(req);
			const customer = await getCustomer(token, Coaching);

			if (!from || !to) throw BadRequestError('Missing dates parameters');

			console.log(`[COACHING] Getting events from team ${teamId} between ${from} and ${to}`);

			const isAdmin = (
				customer.teamSettings().find(teamSetting => String(teamSetting.teamId) === String(teamId))?.mobilePermissions ||
				[]
			).includes('coachingAppAdmin');

			const staff = await Coaching.app.models.Staff.findOne({ where: { customerId: customer.id } }, { id: 1 });

			const pipeline = getSeasonForEventsPipeline(teamId, from, to, staff?.id, isAdmin);
			const events = await Coaching.app.models.Event.getDataSource()
				.connector.collection(Coaching.app.models.Event.modelName)
				.aggregate(pipeline)
				.toArray();

			for (const event of events) {
				event.color = getColorForFormatSubformatTheme(event.format, event.subformat, event.theme);
				if (!event.end) event.end = moment(event.start).add(60, 'minute').toDate();
			}

			// TODO: move in pipeline?
			const filtered = events.filter(
				({ format, staffIds }) =>
					format === 'medical' || isAdmin || (staffIds || []).map(String).includes(String(staff?.id))
			);

			return sortBy(filtered, 'start');
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getEventDetails = async function (eventId, req) {
		try {
			console.log(`[COACHING] Getting full event ${eventId}`);
			const token = await Coaching.getToken(req);
			const customer = await getCustomer(token, Coaching);

			const pipeline = getFullEventPipeline(eventId);
			const [
				{
					videos,
					match: [match],
					team: [team],
					...event
				}
			] = await Coaching.app.models.Event.getDataSource()
				.connector.collection(Coaching.app.models.Event.modelName)
				.aggregate(pipeline)
				.toArray();
			if (!event) throw InternalError('Event not found');

			const isAdmin = (
				customer.teamSettings().find(teamSetting => String(teamSetting.teamId) === String(event.teamId))
					?.mobilePermissions || []
			).includes('coachingAppAdmin');

			const [staff, clubPlayers] = await Promise.all([
				Coaching.app.models.Staff.findOne({ where: { customerId: customer.id } }, { id: 1 }),
				Coaching.app.models.Player.find({
					where: { clubId: team.clubId },
					fields: ['id', 'downloadUrl', 'nationality', 'displayName']
				})
			]);
			let gameStats, lineup;
			let statistics = [];
			let opponentStatistics = [];

			if (!event.staffIds) event.staffIds = [];

			event._attachments = (event._attachments || []).filter(
				({ sharedStaffIds }) => isAdmin || sharedStaffIds.map(String).includes(String(staff?.id))
			);

			event.author = await getCustomerName(Coaching, event.author);

			if (event.format === 'medical') {
				switch (event.medicalType) {
					case 'exam':
						event['preventionExams'] = await getMedicalExamsForEvent(Coaching, event, '_preventionExams');
						if (event?.injuryId) {
							event['injuryExams'] = await getMedicalExamsForEvent(Coaching, event, '_injuryExams');
							event.injury = await Coaching.app.models.Injury.findById(event.injuryId);
							const injuryLocation = event?.injury?.location;
							event.medicalLocations = [injuryLocation];
						}
						break;
					case 'treatment': {
						const medicalTreatments = await Coaching.app.models.MedicalTreatment.find({
							where: { eventId: ObjectID(event._id) }
						});
						const mapped = await medicalEventUtils.getEventMedicalTreatmentsMapped(Coaching, medicalTreatments, event);
						event['medicalTreatments'] = mapped?.medicalTreatments;
						event['medicalLocations'] = mapped?.eventMedicalLocations;
						break;
					}
					default:
						console.warn('Medical field is not supported:', event.medicalType);
				}
			}

			if (event.format === 'game' || event.format === 'training') {
				event._sessionPlayers = (event._sessionPlayers || [])
					.filter(({ mainSession }) => mainSession)
					.map(({ playerId, playerName, rpe }) => ({ playerId, playerName, rpe }));

				if (event.format === 'training') {
					const drillsTeam = await Coaching.app.models.Drill.find({
						where: { teamId: ObjectID(event.teamId) },
						fields: ['_attachments', 'rules', 'description', 'id']
					});
					event._drills = (event._drills || [])
						.filter(({ sharedStaffIds }) => (sharedStaffIds || []).map(String).includes(String(staff?.id)))
						.map(drill => {
							drill._attachments = [];
							drill.rules = null;
							drill.description = null;
							drill.duration = drill?.durationMin; // only for andrea CAA-104
							if (drill.drillsId) {
								const foundDrill = drillsTeam.find(({ id }) => String(id) === String(drill.drillsId));
								drill._attachments = foundDrill?._attachments || [];
								drill.rules = foundDrill?.rules || null;
								drill.description = foundDrill?.description || null;
							}
							return drill;
						});
				}

				if (event.format === 'game') {
					event.competition = event.subformat === 'internationalCup' ? event.subformatDetails : event.subformat;
					const providerIdField = team.providerTeam === 'Wyscout' ? 'wyscoutId' : 'instatId';
					const service = team.providerTeam === 'Wyscout' ? Coaching.app.models.Wyscout : Coaching.app.models.Instat;

					if (event[providerIdField]) {
						gameStats = await service.getStandingsMatchStats(event[providerIdField], req);
					}

					statistics = event._playerMatchStats || [];
					opponentStatistics = event._opponentPlayerMatchStats || [];

					lineup = {
						offensive: {
							tactic: match._offensive.tactic,
							players: match._offensive._players.map(player => interpolatePlayer(player, clubPlayers))
						},
						defensive: {
							tactic: match._offensive.tactic,
							players: match._defensive._players.map(player => interpolatePlayer(player, clubPlayers))
						}
					};
				}
			}

			// delete event.playerIds;
			// delete event._sessionPlayers;
			delete event._playerMatchStats;
			delete event._opponentPlayerMatchStats;

			return {
				event,
				videos,
				lineup,
				gameStats,
				statistics,
				opponentStatistics
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getEventPlayerReport = async function (eventId, playerId, req) {
		try {
			console.log(`[COACHING] Getting player report for event ${eventId} and player ${playerId}`);
			const token = await Coaching.getToken(req);
			const customer = await getCustomer(token, Coaching);
			const staff = await Coaching.app.models.Staff.find({
				where: { customerId: customer.id },
				fields: ['id']
			});
			return await getEventPlayerReport(Coaching, eventId, playerId, staff.id);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getTeamStatsCached = async function (teamId, req) {
		try {
			const asyncRedis = require('async-redis');
			const asyncClient = asyncRedis.decorate(Object.create(req.app.redisClient));
			const cacheKey = `Coaching_TeamStats_${teamId}`;
			const cachedStats = await asyncClient.get(cacheKey);
			if (!cachedStats) {
				const teamStats = await Coaching.app.models.DirectorV2.getTeamStats(teamId);
				asyncClient.set(cacheKey, JSON.stringify(teamStats));
				asyncClient.expire(cacheKey, CACHE_TTL);
				return teamStats;
			} else {
				return JSON.parse(cachedStats);
			}
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.invalidateFixturesCache = async function (req) {
		return await Coaching.invalidateStatsCache(req);
	};

	Coaching.invalidateSeasonCache = async function (req) {
		return await Coaching.invalidateStatsCache(req);
	};

	Coaching.invalidateStatsCache = async function (req) {
		try {
			const token = await Coaching.getToken(req);
			const customer = await Coaching.app.models.Customer.findById(token.userId);
			if (!customer) {
				throw InternalError('User not found');
			}
			const asyncRedis = require('async-redis');
			const asyncClient = asyncRedis.decorate(Object.create(req.app.redisClient));
			const cacheKey = `Coaching_TeamStats_${req.params.id}`;
			await asyncClient.del(cacheKey);
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getSeasonInfo = async function (teamId, req) {
		try {
			const stats = await Coaching.getTeamStatsCached(teamId, req);
			const { gamesDone, gamesTotal, effectiveness, lost, win, draw } = stats;
			return { gamesDone, gamesTotal, effectiveness, lost, win, draw };
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getFixturesInfo = async function (teamId, req) {
		try {
			const stats = await Coaching.getTeamStatsCached(teamId, req);
			const { fixtures } = stats;
			return fixtures;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getTactics = async function (req) {
		try {
			const token = await Coaching.getToken(req);
			const { clubId } = await Coaching.app.models.Customer.findById(token.userId, { clubId: 1 });
			const { sportType } = await Coaching.app.models.Club.findById(ObjectID(clubId), { currency: 1 });
			return sportsConstants[sportType].fieldCoordinates;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	// TODO: now it calls always Wyscout. Once we implement the opponent statistics sync into our databases, change this
	Coaching.getMatchStats = async function (req) {
		try {
			const token = await Coaching.getToken(req);
			const { teamId, eventId } = req.params;
			console.log(`[COACHING] Getting match stats for event ${eventId} for team ${teamId}`);
			const [
				{ opponentWyscoutId: opponentId, wyscoutId: matchId, home, _playerMatchStats, start, staffIds = [] },
				{ wyscoutId: myTeamId },
				staff
			] = await Promise.all([
				Coaching.app.models.Event.findById(eventId, {
					opponentWyscoutId: 1,
					wyscoutId: 1,
					home: 1,
					start: 1,
					_playerMatchStats: 1,
					staffIds: 1
				}),
				Coaching.app.models.Team.findById(teamId, { wyscoutId: 1 }),
				Coaching.app.models.Staff.findOne({ where: { customerId: token.userId } }, { id: 1 })
			]);

			let current_team = {};
			let opponent_team = {};
			let participants = _playerMatchStats;
			let opponentParticipants = [];

			const isCustomerPresent = staffIds.map(String).includes(String(staff?.id));

			if (matchId) {
				const gameDetail = await Coaching.app.models.Wyscout.singleTeamStatWithPlayers(matchId);
				const { playersThirdPartyIds, substitutions } = getPlayersThirdPartyIds(gameDetail);
				const [{ teamStats }, playersStats] = await Promise.all([
					Coaching.app.models.Wyscout.dashboardSingleTeamStat(
						matchId,
						home ? myTeamId : opponentId,
						home ? opponentId : myTeamId
					),
					Coaching.app.models.Wyscout.gamePlayerStats(matchId, playersThirdPartyIds, substitutions)
				]);
				current_team = {
					possessionPercent: teamStats[0]?.average?.possessionPercent,
					successfulPasses: teamStats[0]?.percent?.successfulPasses,
					shots: teamStats[0]?.total?.shots,
					shotsOnTarget: teamStats[0]?.percent?.shotsOnTarget,
					duelsWon: teamStats[0]?.percent?.duelsWon,
					fouls: teamStats[0]?.total?.fouls,
					offsides: teamStats[0]?.total?.offsides,
					corners: teamStats[0]?.total?.corners
				};
				opponent_team = {
					possessionPercent: teamStats[1]?.average?.possessionPercent,
					successfulPasses: teamStats[1]?.percent?.successfulPasses,
					shots: teamStats[1]?.total?.shots,
					shotsOnTarget: teamStats[1]?.percent?.shotsOnTarget,
					duelsWon: teamStats[1]?.percent?.duelsWon,
					fouls: teamStats[1]?.total?.fouls,
					offsides: teamStats[1]?.total?.offsides,
					corners: teamStats[1]?.total?.corners
				};
				[participants, opponentParticipants] = partition(playersStats, ({ teamId }) => teamId === teamStats[0].teamId);
			}

			return {
				eventId: isCustomerPresent ? eventId : undefined,
				eventDate: isCustomerPresent ? start : undefined,
				current_team,
				opponent_team,
				participants,
				opponentParticipants
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getNotificationSettings = async function (id, req) {
		try {
			const token = await Coaching.getToken(req);

			const customerTeamSettings = await Coaching.app.models.CustomerTeamSettings.findOne({
				where: {
					teamId: ObjectID(id),
					customerId: ObjectID(token.userId)
				}
			});

			if (!customerTeamSettings) {
				throw InternalError('Team info not found');
			}

			const {
				notificationEventInvitation,
				notificationVideoSharing,
				notificationVideoComment,
				notificationEventReminder,
				notificationPlayerVideoComment
			} = customerTeamSettings;

			return {
				notificationEventInvitation,
				notificationEventReminder,
				notificationVideoSharing,
				notificationVideoComment,
				notificationPlayerVideoComment
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.updateNotificationSettings = async function (id, req) {
		try {
			const token = await Coaching.getToken(req);
			const customerTeamSettings = await Coaching.app.models.CustomerTeamSettings.findOne({
				where: {
					teamId: ObjectID(id),
					customerId: ObjectID(token.userId)
				}
			});

			const { body: config } = req;
			if (!config) {
				throw UnprocessableEntityError('Data not provided');
			}

			if (!customerTeamSettings) {
				throw InternalError('Team info not found');
			}

			customerTeamSettings.notificationEventInvitation = config.notificationEventInvitation;
			customerTeamSettings.notificationVideoSharing = config.notificationVideoSharing;
			customerTeamSettings.notificationVideoComment = config.notificationVideoComment;
			customerTeamSettings.notificationEventReminder = config.notificationEventReminder;
			customerTeamSettings.notificationPlayerVideoComment = config.notificationPlayerVideoComment;

			await customerTeamSettings.save();
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getNotifications = async function (start, limit, read, teamIds, startDate, endDate, req) {
		try {
			console.log(`[COACHING] Getting notifications list`);
			start = start && typeof start == 'number' ? start : 0;
			limit = limit && typeof limit == 'number' ? limit : 99;
			const lang = getLanguage(req.headers['accept-language']);
			const token = await Coaching.getToken(req);
			if (!token) {
				throw AuthorizationError('Auth token not valid');
			}
			const queryParams = {
				customerId: ObjectID(token.userId),
				type: {
					in: notificationsType
				}
			};
			if (read !== undefined) {
				queryParams.read = read;
			}
			if (teamIds) {
				queryParams.teamId = { inq: teamIds };
			}
			if (startDate || endDate) {
				if (startDate && endDate) {
					queryParams.date = {
						between: [moment(startDate).startOf('day').toDate(), moment(endDate).endOf('day').toDate()]
					};
				} else if (startDate) {
					queryParams.date = { gte: moment(startDate).startOf('day').toDate() };
				} else if (endDate) {
					queryParams.date = { lte: moment(endDate).endOf('day').toDate() };
				}
			}
			const notifications = await Coaching.app.models.Notification.find({
				skip: start,
				limit,
				order: 'date DESC',
				where: queryParams
			});
			for (const notification of notifications || []) {
				notification.message = convert(translateNotification(notification.message, lang));
			}
			return notifications;
		} catch (err) {
			console.error(err);
			throw err;
		}
	};

	Coaching.getNotificationsBadge = async function (req) {
		try {
			console.log(`[COACHING] Getting unread notifications number`);
			const token = await Coaching.getToken(req);
			if (!token) {
				throw AuthorizationError('Auth token not valid');
			}
			const count = await Coaching.app.models.Notification.count({
				customerId: ObjectID(token.userId),
				read: false,
				type: {
					in: notificationsType
				}
			});
			return { count };
		} catch (err) {
			console.error(err);
			throw err;
		}
	};

	Coaching.setNotification = async function (req) {
		try {
			const { id } = req.params;
			const { read } = req.body;
			const token = await Coaching.getToken(req);
			if (!token) {
				throw AuthorizationError('Auth token not valid');
			}
			console.log(`[COACHING] Setting notification ${id} as ${read ? 'read' : 'unread'}`);
			await Coaching.app.models.Notification.updateAll({ id }, { read });
			return true;
		} catch (err) {
			console.error(err);
			throw err;
		}
	};

	Coaching.setAllNotifications = async function (req) {
		try {
			const { read } = req.body;
			const token = await Coaching.getToken(req);
			if (!token) {
				throw AuthorizationError('Auth token not valid');
			}
			console.log(`[COACHING] Setting all notifications for customer ${token.userId} as ${read ? 'read' : 'unread'}`);
			await Coaching.app.models.Notification.updateAll({ customerId: ObjectID(token.userId) }, { read });
			return true;
		} catch (err) {
			console.error(err);
			throw err;
		}
	};

	Coaching.getComments = async function (req) {
		try {
			const { videoId } = req.params;
			const video = await Coaching.app.models.VideoAsset.findById(videoId, {
				fields: ['notesThreads']
			});
			if (!video) {
				throw InternalError('Video not found');
			}
			video.notesThreads = sortByTime(video.notesThreads || [], 'time').reverse();
			return video.notesThreads;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.createComment = async function (req) {
		try {
			const { videoId } = req.params;
			const token = await Coaching.getToken(req);
			const [video, customer] = await Promise.all([
				Coaching.app.models.VideoAsset.findById(videoId),
				Coaching.app.models.Customer.findById(token.userId)
			]);
			if (!video) {
				throw InternalError('Video not found');
			}
			if (!customer) {
				throw InternalError('User not found');
			}
			if (!video.notesThreads) video.notesThreads = [];

			const attachments = await Coaching.uploadFiles(req, video.teamId);

			const user = `${customer.firstName} ${customer.lastName}`;
			const comment = {
				id: uuid(),
				user,
				userId: String(customer.id),
				time: moment().toDate(),
				content: req.body.content,
				img: customer.downloadUrl,
				attachments,
				notesThreads: []
			};
			video.notesThreads.push(comment);
			await video.save();
			await Promise.all([
				Coaching.app.models.Notification.checkForVideoCommentNotification(
					video.id,
					video.sharedStaffIds,
					[customer.id],
					video.teamId
				),
				Coaching.app.models.PlayerNotification.checkVideoCommentsNotifications(
					video.id,
					video.linkedId || '',
					video.sharedPlayerIds,
					req
				)
			]);
			return comment;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.updateComment = async function (req) {
		try {
			const { videoId } = req.params;
			const commentId = req.params.commentId;
			const [token, video] = await Promise.all([
				Coaching.getToken(req),
				Coaching.app.models.VideoAsset.findById(videoId)
			]);
			if (!video) {
				throw InternalError('Video not found');
			}
			if (!video.notesThreads) video.notesThreads = [];

			const index = video.notesThreads.findIndex(({ id }) => String(id) === commentId);
			const comment = video.notesThreads[index];
			if (!comment) {
				throw InternalError('Comment not found');
			}
			if (String(comment.userId) !== String(token.userId)) {
				throw AuthorizationError('You are not the comment author');
			}
			if (req.files.length > 0) {
				const attachments = await Coaching.uploadFiles(req, video.teamId);
				comment.attachments = attachments;
			}
			comment.content = req.body.content;
			comment.updatedTime = moment().toDate();
			comment.read = req.body.read;
			video.notesThreads[index] = comment;
			await video.save();
			return comment;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.deleteComment = async function (req) {
		try {
			const { videoId } = req.params;
			const commentId = req.params.commentId;
			const [token, video] = await Promise.all([
				Coaching.getToken(req),
				Coaching.app.models.VideoAsset.findById(videoId)
			]);
			if (!video) {
				throw InternalError('Video not found');
			}
			if (!video.notesThreads) video.notesThreads = [];

			const index = video.notesThreads.findIndex(({ id }) => String(id) === commentId);
			const comment = video.notesThreads[index];
			if (!comment) {
				throw InternalError('Comment not found');
			}
			if (String(comment.userId) !== String(token.userId)) {
				throw AuthorizationError('You are not the comment author');
			}

			await Coaching.deleteFiles(comment, video.teamId);
			video.notesThreads.splice(index, 1);
			await video.save();
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getReplies = async function (req) {
		try {
			const { videoId } = req.params;
			const commentId = req.params.commentId;
			const video = await Coaching.app.models.VideoAsset.findById(videoId, {
				fields: ['notesThreads']
			});
			if (!video) {
				throw InternalError('Video not found');
			}
			if (!video.notesThreads) video.notesThreads = [];
			const index = video.notesThreads.findIndex(({ id }) => String(id) === commentId);
			const comment = video.notesThreads[index];
			if (!comment) {
				throw InternalError('Comment not found');
			}
			const replies = sortByTime(comment.notesThreads || [], 'time').reverse();
			return replies;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	// TODO: add notification
	Coaching.createReply = async function (req) {
		try {
			const { videoId } = req.params;
			const commentId = req.params.commentId;
			const token = await Coaching.getToken(req);
			const [video, customer] = await Promise.all([
				Coaching.app.models.VideoAsset.findById(videoId),
				Coaching.app.models.Customer.findById(token.userId)
			]);
			if (!video) {
				throw InternalError('Video not found');
			}
			if (!customer) {
				throw InternalError('User not found');
			}
			if (!video.notesThreads) video.notesThreads = [];

			const user = `${customer.firstName} ${customer.lastName}`;
			const index = video.notesThreads.findIndex(({ id }) => String(id) === commentId);
			const comment = video.notesThreads[index];
			if (!comment) {
				throw InternalError('Comment not found');
			}
			const attachments = await Coaching.uploadFiles(req, video.teamId);
			const reply = {
				id: uuid(),
				user,
				userId: String(customer.id),
				time: moment().toDate(),
				content: req.body.content,
				img: customer.downloadUrl,
				attachments
			};
			if (!video.notesThreads[index].notesThreads) video.notesThreads[index].notesThreads = [];
			video.notesThreads[index].notesThreads.push(reply);
			await video.save();
			await Promise.all([
				Coaching.app.models.Notification.checkForVideoCommentNotification(
					video.id,
					video.sharedStaffIds,
					[customer.id],
					video.teamId
				),
				Coaching.app.models.PlayerNotification.checkVideoCommentsNotifications(
					video.id,
					video.linkedId || '',
					video.sharedPlayerIds,
					req
				)
			]);
			return reply;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.updateReply = async function (req) {
		try {
			const { videoId } = req.params;
			const commentId = req.params.commentId;
			const replyId = req.params.replyId;
			const [token, video] = await Promise.all([
				Coaching.getToken(req),
				Coaching.app.models.VideoAsset.findById(videoId)
			]);
			if (!video) {
				throw InternalError('Video not found');
			}
			if (!video.notesThreads) video.notesThreads = [];

			const index = video.notesThreads.findIndex(({ id }) => String(id) === commentId);
			const comment = video.notesThreads[index];
			if (!comment) {
				throw InternalError('Comment not found');
			}
			if (!video.notesThreads[index].notesThreads) video.notesThreads[index].notesThreads = [];
			const replyIndex = comment.notesThreads.findIndex(({ id }) => String(id) === replyId);
			const reply = video.notesThreads[index].notesThreads[replyIndex];
			if (!reply) {
				throw InternalError('Reply not found');
			}
			if (String(reply.userId) !== String(token.userId)) {
				throw AuthorizationError('You are not the reply author');
			}
			if (req.files.length > 0) {
				const attachments = await Coaching.uploadFiles(req, video.teamId);
				reply.attachments = attachments;
			}
			reply.content = req.body.content;
			reply.updatedTime = moment().toDate();
			reply.read = req.body.read;
			video.notesThreads[index].notesThreads[replyIndex] = reply;
			await video.save();
			return reply;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.deleteReply = async function (req) {
		try {
			const { videoId } = req.params;
			const commentId = req.params.commentId;
			const replyId = req.params.replyId;
			const [token, video] = await Promise.all([
				Coaching.getToken(req),
				Coaching.app.models.VideoAsset.findById(videoId, {
					fields: ['id', 'notesThreads']
				})
			]);
			if (!video) {
				throw InternalError('Video not found');
			}
			if (!video.notesThreads) video.notesThreads = [];

			const index = video.notesThreads.findIndex(({ id }) => String(id) === commentId);
			const comment = video.notesThreads[index];
			if (!comment) {
				throw InternalError('Comment not found');
			}
			if (!video.notesThreads[index].notesThreads) video.notesThreads[index].notesThreads = [];
			const replyIndex = comment.notesThreads.findIndex(({ id }) => String(id) === replyId);
			const reply = video.notesThreads[index].notesThreads[replyIndex];
			if (!reply) {
				throw InternalError('Reply not found');
			}
			if (String(reply.userId) !== String(token.userId)) {
				throw AuthorizationError('You are not the reply author');
			}
			await Coaching.deleteFiles(reply, video.teamId);
			video.notesThreads[index].notesThreads.splice(replyIndex, 1);
			await video.save();
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.uploadFiles = async function (req, teamId) {
		try {
			const { files } = req;
			const { clubId } = await Coaching.app.models.Team.findById(teamId, { fields: { clubId: 1 } });
			const uploaded = await Promise.all(
				(files || []).map(file =>
					Coaching.app.models.Storage.uploadFile(String(clubId), file.buffer, file.originalname)
				)
			);
			(files || []).forEach((file, index) => {
				file.url = uploaded[index];
			});
			const attachments = (files || []).map(file => ({
				type: getType(file.originalname),
				name: file.originalname,
				url: file.url
			}));
			return attachments;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.deleteFiles = async function (comment, teamId) {
		try {
			const { attachments } = comment;
			const { clubId } = await Coaching.app.models.Team.findById(teamId, { fields: { clubId: 1 } });
			await Promise.all(attachments.map(({ url }) => Coaching.app.models.Storage.deleteFile(String(clubId), url)));
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getVideos = async function (categories, req) {
		try {
			const token = await Coaching.getToken(req);
			const { id: teamId } = req.params;

			const customer = await getCustomer(token, Coaching);

			const isAdmin = (
				customer.teamSettings().find(teamSetting => String(teamSetting.teamId) === String(teamId))?.mobilePermissions ||
				[]
			).includes('coachingAppAdmin');

			const videoCollection = Coaching.app.models.VideoAsset.getDataSource().connector.collection(
				Coaching.app.models.VideoAsset.modelName
			);

			const pipelineVideos = getPipelineVideos(
				teamId,
				!categories || isEmpty(categories) ? ['TRAINING', 'OTHER', 'GAMES'] : categories
			);

			const [results, staff] = await Promise.all([
				videoCollection.aggregate(pipelineVideos).toArray(),
				Coaching.app.models.Staff.findOne({ where: { customerId: token.userId } }, { id: 1 })
			]);

			const filtered = isAdmin
				? results
				: results.filter(({ sharedStaffIds }) => (sharedStaffIds || []).map(String).includes(String(staff?.id)));

			const wrapped = await Promise.all(filtered.map(result => Coaching.getAssociatedEvent(result)));
			return wrapped;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getAssociatedEvent = async function (video) {
		try {
			if (video.linkedModel) {
				video.linkedObject = await Coaching.app.models[video.linkedModel].findById(video.linkedId, {
					fields: {
						_sessionPlayers: 0,
						_sessionImport: 0,
						_drillsExecuted: 0,
						_drills: 0,
						_playerMatchStats: 0,
						_attachments: 0
					}
				});
			}
			return video;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getTeamReadiness = async function (teamId, date, req) {
		try {
			const token = await Coaching.getToken(req);
			const customer = await Coaching.app.models.Customer.findById(token.userId);
			if (!customer) {
				throw InternalError('User not found');
			}

			return await Coaching.app.models.Readiness.getTeamReadiness(teamId, date);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getPlayerReadiness = async function (playerId, date, req) {
		try {
			const token = await Coaching.getToken(req);
			const customer = await Coaching.app.models.Customer.findById(token.userId);
			if (!customer) {
				throw InternalError('User not found');
			}

			return await Coaching.app.models.Readiness.getPlayerReadiness(playerId, date);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getPlayerInjuries = async function (playerId, req) {
		try {
			const token = await Coaching.getToken(req);
			const customer = await Coaching.app.models.Customer.findById(token.userId);
			if (!customer) {
				throw InternalError('User not found');
			}

			const [{ _chronicInjuries: chronicInjuries }, injuries] = await Promise.all([
				Coaching.app.models.Player.findById(playerId, { fields: ['_chronicInjuries'] }),
				Coaching.app.models.Injury.find({ where: { playerId } })
			]);

			return { chronicInjuries, injuries };
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getMe = async function (req) {
		try {
			const token = await Coaching.getToken(req);
			const customer = await Coaching.app.models.Customer.findById(token.userId);
			if (!customer) {
				throw InternalError('User not found');
			}

			return {
				id: customer.id,
				downloadUrl: customer.downloadUrl,
				email: customer.email,
				firstName: customer.firstName,
				lastName: customer.lastName,
				currentLanguage: customer?.currentLanguage,
				currentDateFormat: customer?.currentDateFormat
			};
		} catch (error) {
			console.error(error);
			throw InternalError('Error while getting personal information');
		}
	};

	Coaching.updateMe = async function (req) {
		try {
			const token = await Coaching.getToken(req);
			const customer = await Coaching.app.models.Customer.findById(token.userId);
			if (!customer) {
				throw InternalError('User not found');
			}
			const { body: config } = req;
			if (!config) {
				throw UnprocessableEntityError('Data not provided');
			}
			customer.currentLanguage = config?.currentLanguage;
			customer.currentDateFormat = config?.currentDateFormat;
			await customer.save();
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Coaching.getChatPlayers = async function (req) {
		return await Coaching.app.models.Chat.getPlayers(req);
	};

	Coaching.getChatStaffs = async function (req) {
		return await Coaching.app.models.Chat.getStaffs(req);
	};

	Coaching.getTeamTestMetrics = async function (id, req) {
		try {
			const token = await Coaching.getToken(req);
			const customer = await Coaching.app.models.Customer.findById(token.userId);
			if (!customer) {
				throw InternalError('User not found');
			}

			console.log(`[COACHING] Getting test metrics for team ${id}`);
			const { metricsTests } = await Coaching.app.models.Team.findById(id, { fields: ['metricsTests'] });
			return metricsTests;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Coaching.getPlayerFitnessProfile = async function (id, testIds, metrics, req) {
		try {
			const token = await Coaching.getToken(req);
			const customer = await Coaching.app.models.Customer.findById(token.userId);
			if (!customer) {
				throw InternalError('User not found');
			}

			console.log(`[COACHING] Getting fitness profile for player ${id}`);
			return await Coaching.app.models.ProfilePlayers.getPlayerFitnessProfile(id, testIds, metrics);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Coaching.getPlayerRobustness = async function (playerId) {
		try {
			console.log(`[COACHING] Getting robustness for player ${playerId}`);
			const player = await Coaching.app.models.Player.findById(playerId);
			if (!player) throw new InternalError('Player not found');
			const [team, teamSeasons] = await Promise.all([
				Coaching.app.models.Team.findById(player.teamId),
				Coaching.app.models.TeamSeason.getDataSource()
					.connector.collection(Coaching.app.models.TeamSeason.modelName)
					.find({ teamId: ObjectID(player.teamId) })
					.toArray()
			]);
			if (!team) {
				throw InternalError('Team not found!');
			}
			const minutesField = getMinutesField(team);
			const currentTeamSeason = teamSeasons.find(({ offseason, inseasonEnd }) =>
				moment().isBetween(moment(offseason), moment(inseasonEnd))
			);
			if (!currentTeamSeason) {
				throw new InternalError('No season found for the current day');
			}
			return await Coaching.app.models.ProfilePlayers.profileRobustness(
				currentTeamSeason.id,
				[playerId],
				currentTeamSeason.offseason,
				moment(currentTeamSeason.inseasonEnd).isBefore(moment())
					? currentTeamSeason.inseasonEnd
					: moment().endOf('day').toDate(),
				minutesField,
				0,
				player.teamId
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};
};

function prevDay(date, n) {
	return moment(date).subtract(n, 'days').toDate();
}

function isPlayerSearched({ displayName, firstName, lastName }, query) {
	if (!query || isEmpty(query)) return true;
	if (!query.name) return false;
	return matchName(displayName, query.name) || matchName(firstName, query.name) || matchName(lastName, query.name);
}

function matchName(name, query) {
	return name && name.toLowerCase().indexOf(String(query).toLowerCase()) !== -1;
}

function mapSearchedPlayer(player, teams, allAgents, translations) {
	return mapPlayer(player, teams, allAgents, translations);
}

function mapPlayer(player, teams, allAgents, translations) {
	const team = teams.find(({ id }) => String(id) === String(player.teamId));
	const agents = getAgents(player.id, allAgents);
	return {
		id: String(player.id),
		archived: player.archived,
		name: player.name,
		firstName: player.firstName,
		lastName: player.lastName,
		displayName: player.displayName,
		email: player.email,
		phone: player.phone,
		mobilePhone: player.mobilePhone,
		otherMobile: player.otherMobile,
		address: player.address,
		domicile: player.domicile,
		nationality: player.nationality,
		altNationality: player.altNationality,
		passport: player.passport,
		altPassport: player.altPassport,
		nationalityFull: player.nationality ? translations[`nationalities.${player.nationality}`] : null,
		altNationalityFull: player.altNationality ? translations[`nationalities.${player.altNationality}`] : null,
		passportFull: player.passport ? translations[`nationalities.${player.passport}`] : null,
		altPassportFull: player.altPassport ? translations[`nationalities.${player.altPassport}`] : null,
		birthDate: player.birthDate ? moment(player.birthDate).format('DD/MM/YYYY') : null,
		position: player.position,
		heigth: player.height,
		weight: player.weight || 0,
		position2: player.position2,
		position3: player.position3,
		img: player.downloadUrl,
		status: player.currentStatus,
		teamId: player.teamId,
		teamName: team?.name,
		wage: player.wage,
		expire: player.contractExpiry,
		agents,
		origin: player.nationalityOrigin,
		injuries: player.injuries,
		goScores: player.goScores,
		wellnesses: player.wellnesses
	};
}

function getAgents(playerId, agents) {
	const filtered = (agents || []).filter(({ assistedIds }) => assistedIds.includes(ObjectID(playerId)));
	return filtered;
}

function getPlayerWithAdditionalData(orderingIndex, { playerId, mappings }, players, teams, allAgents, translations) {
	const originalPlayer = players.find(({ id }) => String(id) === String(playerId));
	if (originalPlayer) {
		return {
			orderingIndex,
			mappings,
			...mapPlayer(originalPlayer, teams, allAgents, translations)
		};
	}
}

function getColorForFormatSubformatTheme(format, subformat, theme) {
	const palette1 = [
		'#0078D7',
		'#f1c40f',
		'#00CC6A',
		'#FF4343',
		'#FF8C00',
		'#018574',
		'#7f8c8d',
		'#9b59b6',
		'#847545',
		'#add8e6',
		'#00B7C3',
		'#e6addb'
	];

	switch (format) {
		case 'general':
			return palette1[0];
		case 'travel':
			return palette1[11];
		case 'training': {
			switch (theme) {
				case 'gym': {
					return palette1[5];
				}
				case 'reconditioning': {
					return palette1[1];
				}
				case 'recovery': {
					return palette1[9];
				}
				case 'field':
				default: {
					return palette1[2];
				}
			}
		}
		case 'game': {
			return subformat === 'friendly' ? palette1[4] : palette1[3];
		}
		case 'friendly':
			return palette1[4];
		case 'administration':
			return palette1[6];
		case 'medical':
			return palette1[7];
		case 'off':
			return palette1[8];
		case 'international':
			return palette1[10];
	}
}

function sortByTime(array, field) {
	return array.sort((a, b) => {
		return moment(a[field]).toDate().getTime() - moment(b[field]).toDate().getTime();
	});
}

function getPipelineVideos(teamId, categories) {
	const videoStage = {
		$match:
			Array.isArray(categories) && categories.length > 0
				? { teamId: ObjectID(teamId), category: { $in: categories } }
				: { teamId: ObjectID(teamId) }
	};
	const groupStage = {
		$addFields: {
			allCommentsLength: { $size: '$notesThreads' },
			unreadCommentsLenght: {
				$size: {
					$filter: {
						input: '$notesThreads',
						as: 'item',
						cond: {
							$or: [{ $ne: ['$$item.read', true] }]
						}
					}
				}
			}
		}
	};
	const projectStage = {
		$project: {
			notesThreads: 0
		}
	};

	return [videoStage, groupStage, projectStage];
}

function getExtension(filename) {
	const parts = filename.split('.');
	return parts[parts.length - 1];
}

function getType(filename) {
	try {
		const ext = getExtension(filename);
		switch (ext.toLowerCase()) {
			case 'jpg':
			case 'jpeg':
			case 'gif':
			case 'bmp':
			case 'png':
				return 'image';
		}
		return 'file';
	} catch (e) {
		return 'file';
	}
}

function getClosestMatch(matches) {
	const nextGame = matches.filter(({ date }) => moment(date).isSameOrAfter(moment())).reverse();
	const beforeGame = matches.filter(({ date }) => moment(date).isSameOrBefore(moment())).reverse();
	if (nextGame.length === 0) {
		if (beforeGame.length === 0) return null;
		else return beforeGame[0];
	} else {
		return nextGame[nextGame.length - 1];
	}
}

function getPlayerTransfers(playerData) {
	let transfers = (playerData.transfers || []).map(transfer => ({
		year: moment(transfer.startDate).format('YYYY'),
		from: transfer.fromTeamName,
		to: transfer.toTeamName,
		toIcon: transfer.teamsData.toTeam?.team?.imageDataURL,
		toNationality: transfer.teamsData.toTeam?.team?.area?.alpha2code,
		amount: transfer.value
	}));
	transfers = sortBy(transfers, 'year').reverse();
	return transfers;
}

function getPlayerCareer(playerData) {
	let careers = (playerData.career || []).map(info => ({
		firstYear: moment(info.season?.startDate, 'YYYY-MM-DD').format('YY'),
		lastYear: moment(info.season?.endDate, 'YYYY-MM-DD').format('YY'),
		competition: info.competition?.name || '',
		team: info.team?.name || '',
		clubCrest: info.team?.imageDataURL,
		apps: info.appearances,
		goalScored: info.goal,
		mins: info.minutesPlayed
	}));
	careers = sortBy(careers, 'season').reverse();
	return careers;
}

function getAttributesData(player, videos, team, customers) {
	const attributesMetrics = team.playerAttributes || playerAttributes;

	const offensiveMetrics = attributesMetrics.filter(({ active, category }) => active && category === 'offensive');
	const defensiveMetrics = attributesMetrics.filter(({ active, category }) => active && category === 'defensive');
	const attitudeMetrics = attributesMetrics.filter(({ active, category }) => active && category === 'attitude');

	const { descriptions, attributes } = player;

	const sortedDescriptionEntries = sortBy(descriptions || [], 'date').reverse();
	const mappedDescriptions = sortedDescriptionEntries.map(entry => ({
		...entry,
		author: getAuthorName(customers, sortedDescriptionEntries[0].authorId)
	}));

	const sortedAttributesEntries = sortBy(attributes || [], 'date').reverse();
	const mappedAttributes = sortedAttributesEntries.map((entry, index) => ({
		attacking: mapAttributesCollection(entry, sortedAttributesEntries[index + 1], offensiveMetrics),
		attitude: mapAttributesCollection(entry, sortedAttributesEntries[index + 1], attitudeMetrics),
		defensive: mapAttributesCollection(entry, sortedAttributesEntries[index + 1], defensiveMetrics),
		date: entry.date,
		author: getAuthorName(customers, entry.authorId),
		notesThreads: entry.notesThreads
	}));

	return {
		attributes: mappedAttributes,
		descriptions: mappedDescriptions,
		videos: videos || []
	};
}

function mapAttributesCollection(entry, previousAttributes, selectedAttributes) {
	const values = (entry?.values || []).reduce((acc, { metric, value }) => ({ ...acc, [metric]: value }), {}) || {};
	const previousValues =
		(previousAttributes?.values || []).reduce((acc, { metric, value }) => ({ ...acc, [metric]: value }), {}) || {};
	return {
		...pick(
			values,
			selectedAttributes.map(({ value }) => value)
		),
		increments: getIncrementFromPrevious(values, previousValues, selectedAttributes),
		value: getAttributeSetMeanValue(values, selectedAttributes)
	};
}

function getIncrementFromPrevious(attributes, previousAttributes, selectedAttributes) {
	const picked = pick(
		attributes,
		selectedAttributes.map(({ value }) => value)
	);
	const previousPicked = pick(
		previousAttributes,
		selectedAttributes.map(({ value }) => value)
	);
	return mapValues(picked, (value, key) => getIncrementValue(value, previousPicked[key]));
}

function getIncrementValue(current, previous) {
	if (current > previous) return 1;
	if (current === previous) return 0;
	else return -1;
}

function getAttributeSetMeanValue(attributes, selectedAttributes) {
	if (attributes) {
		const sum = selectedAttributes
			.map(({ value }) => attributes[value])
			.reduce((total, a) => Number(total) + Math.pow(Number(a || 1), 2), 0);
		return Math.round(Math.sqrt(sum / selectedAttributes.length) * 10);
	} else return 0;
}

function getAuthorName(customers, author) {
	const customer = customers.find(({ id }) => String(id) === String(author));
	if (!customer) return '';
	return `${customer.firstName} ${customer.lastName}`;
}

function getSeasonForEventsPipeline(teamId, from, to, staffId, isAdmin) {
	const matchStage = {
		$match: {
			teamId: ObjectID(teamId),
			start: { $gte: moment(from, 'YYYY-MM-DD').startOf('day').toDate() },
			end: { $lte: moment(to, 'YYYY-MM-DD').endOf('day').toDate() }
			// $or: [ // TODO evaluate performance
			// 	{ format: 'medical' },
			// 	{
			// 		isAdmin: true,
			// 		staffIds: { $in: [String(staffId)] }
			// 	}
			// ]
		}
	};
	const projectionStage = {
		$project: {
			type: 1,
			individual: 1,
			start: 1,
			end: 1,
			title: 1,
			author: 1,
			description: 1,
			format: 1,
			subformat: 1,
			theme: 1,
			subtheme: 1,
			where: 1,
			subformatDetails: 1,
			opponent: 1,
			opponentImageUrl: 1,
			home: 1,
			friendly: 1,
			destination: 1,
			medicalType: 1,
			recoveryStrategy: 1,
			nutritionalPre: 1,
			nutritionalDuring: 1,
			nutritionalPost: 1,
			testModel: 1,
			workload: 1,
			intensity: 1,
			_drills: 1,
			_drillsExecuted: 1,
			playerIds: 1,
			staffIds: 1,
			_id: 1,
			id: 1,
			notes: 1,
			_attachments: 1
		}
	};

	// NOTE: because video.linkedId is string and event._id is ObjectId. Remove when switching to polymorphic belongsTo relation
	const addFieldsStage = { $addFields: { eventId: { $toString: '$_id' } } };
	const lookupStage = {
		$lookup: {
			from: 'VideoAsset',
			localField: 'eventId',
			foreignField: 'linkedId',
			as: 'videos'
		}
	};

	return [matchStage, projectionStage, addFieldsStage, lookupStage];
}

function getLineupAndBenchAndNotCalledByPhase(phasePlayers, players, match, sportType) {
	const lineupNumberOfPlayer = sportsConstants[sportType].lineup;
	const benchNumberOfPlayer = sportsConstants[sportType].bench;
	phasePlayers = phasePlayers.concat(getNotInListPlayers(phasePlayers.length, players, match.date, phasePlayers));
	phasePlayers.forEach(tacticPlayerData => {
		if (!players.find(({ id }) => String(id) === tacticPlayerData.playerId)) {
			delete tacticPlayerData.playerId;
		}
	});
	return [
		...getLineup(phasePlayers, lineupNumberOfPlayer),
		...getBench(phasePlayers, lineupNumberOfPlayer, benchNumberOfPlayer),
		...getNotCalled(phasePlayers, lineupNumberOfPlayer, benchNumberOfPlayer)
	];
}

function getNotInListPlayers(startIndex, players, matchDate, phasePlayers) {
	return players
		.filter(({ archived }) => isActiveAtDate(archived, matchDate))
		.filter(({ id }) => !phasePlayers.map(({ playerId }) => playerId).includes(String(id)))
		.map((player, index) => toTacticsPlayerData(player, startIndex + (index + 1)));
}

function toTacticsPlayerData(player, orderingIndex) {
	return {
		id: uuid(),
		playerId: String(player.id),
		displayName: player.displayName,
		orderingIndex,
		organization: null,
		transition: null,
		organizationVideoUrl: null,
		organizationAlternateVideoUrl: null,
		organizationVideoTags: null,
		transitionVideoUrl: null,
		transitionAlternateVideoUrl: null,
		transitionVideoTags: null,
		transitionComments: [],
		organizationComments: []
	};
}

function isActiveAtDate(archived, matchDate) {
	return moment(matchDate).isBefore(moment()) || !archived;
}

function getLineup(players, fieldPlayersNumber) {
	return players.slice(0, fieldPlayersNumber);
}

function getBench(players, fieldPlayersNumber, benchPlayersNumber) {
	return players.slice(fieldPlayersNumber, fieldPlayersNumber + benchPlayersNumber);
}

function getNotCalled(players, fieldPlayersNumber, benchPlayersNumber) {
	return players.slice(fieldPlayersNumber + benchPlayersNumber);
}

function getFullEventPipeline(eventId) {
	const matchStage = {
		$match: {
			_id: ObjectID(eventId)
		}
	};
	const projectionStage = {
		$project: {
			_id: 1,
			id: 1,
			start: 1,
			end: 1,
			title: 1,
			author: 1,
			teamId: 1,
			teamSeasonId: 1,
			type: 1,
			individual: 1,
			description: 1,
			format: 1,
			subformat: 1,
			theme: 1,
			subtheme: 1,
			where: 1,
			subformatDetails: 1,
			opponent: 1,
			opponentImageUrl: 1,
			opponentWyscoutId: 1,
			home: 1,
			friendly: 1,
			destination: 1,
			recoveryStrategy: 1,
			nutritionalPre: 1,
			nutritionalDuring: 1,
			nutritionalPost: 1,
			testModel: 1,
			workload: 1,
			intensity: 1,
			playerIds: 1,
			staffIds: 1,
			injuryId: 1,
			medicalType: 1,
			notes: 1,
			wyscoutId: 1,
			instatId: 1,
			teamReport: 1,
			_sessionPlayers: 1,
			_playerMatchStats: 1,
			_opponentPlayerMatchStats: 1,
			_drills: 1,
			_drillsExecuted: 1,
			_attachments: 1
		}
	};

	// NOTE: because video.linkedId is string and event._id is ObjectId. Remove when switching to polymorphic belongsTo relation
	const addFieldsStage = { $addFields: { eventId: { $toString: '$_id' } } };
	const lookupVideoStage = {
		$lookup: {
			from: 'VideoAsset',
			localField: 'eventId',
			foreignField: 'linkedId',
			as: 'videos'
		}
	};
	const lookupMatchStage = {
		$lookup: {
			from: 'Match',
			localField: '_id',
			foreignField: 'eventId',
			as: 'match'
		}
	};
	const lookupTeamStage = {
		$lookup: {
			from: 'Team',
			localField: 'teamId',
			foreignField: '_id',
			as: 'team'
		}
	};
	// const lookupTeamSeasonStage = {
	// 	$lookup: {
	// 		from: 'TeamSeason',
	// 		localField: 'teamSeasonId',
	// 		foreignField: '_id',
	// 		as: 'season'
	// 	}
	// };
	return [
		matchStage,
		projectionStage,
		addFieldsStage,
		lookupVideoStage,
		lookupMatchStage,
		lookupTeamStage
		// lookupTeamSeasonStage
	];
}

function interpolatePlayer(player, seasonPlayers) {
	const found = seasonPlayers
		.map(player => JSON.parse(JSON.stringify(player)))
		.find(({ id }) => String(player.playerId) === String(id));
	return {
		...player,
		displayName: found?.displayName,
		img: found?.downloadUrl,
		nationality: found?.nationality
	};
}

function prepareBonus(bonus, club, teamSeasons, req) {
	const language = req.headers['accept-language'] || 'en-US';
	const bonusLabel = getBonusLabel(bonus, language);
	const bonusText = getBonusTranslatedText(bonus, club, teamSeasons, req);

	const percentage = getBonusPercentage(bonus);

	bonus.conditions.forEach(condition => {
		condition.text = getConditionText(condition, bonus, club, teamSeasons, req);
	});

	return {
		bonusCount: bonus.bonusCount,
		bonusTotal: bonus.bonusTotal,
		bonus: bonus.type,
		percentage: parseInt(percentage.toString()),
		bonusText,
		bonusLabel,
		conditions: bonus.conditions
	};
}

function getConditionText(condition, bonus, club, seasons, req) {
	const language = req.headers['accept-language'] || 'en-US';
	const text = getSingleConditionSimplified(condition, bonus, club, seasons, language);
	return text;
}

function getBonusLabel(bonus, language) {
	const translated = translate(`admin.contracts.${bonus.type}`, language);
	const bonusLabel = `${bonus.personType === 'Agent' && bonus.agentId ? 'Agent ' : ''}${translated}`;
	return bonusLabel;
}

function getBonusTranslatedText(bonus, club, seasons, language) {
	const text = getBonusText(bonus, false, null, false, false, club.name, null, null, seasons, language);
	return text;
}

function getBonusPercentage(bonus) {
	return bonus.type === 'appearanceFee' || bonus.type === 'performanceFee' || bonus.reached
		? 100
		: bonus.progress?.percentage !== null
		? Math.round(bonus.progress.percentage || 0)
		: 0;
}

function getMinutesField(team) {
	return team._playerProviderMapping?.durationField || 'minutesOnField';
}

async function getCustomer(token, Coaching) {
	const customer = await Coaching.app.models.Customer.findById(token.userId, {
		include: {
			relation: 'teamSettings',
			scope: {
				where: {
					mobilePermissions: {
						inq: permissions
					}
				}
			}
		}
	});
	if (!customer) {
		throw InternalError('User not found');
	}
	if (isEmpty(customer.teamSettings())) {
		throw ForbiddenError('Not enough permissions');
	}

	return customer;
}

function getPlayersThirdPartyIds(gameDetail) {
	if (!gameDetail) {
		return {
			playersThirdPartyIds: [],
			substitutions: {},
			gameDetail: null
		};
	}
	const teamsThirdPartyIds = Object.keys(gameDetail.teamsData);
	let playersThirdPartyIds = [];
	const substitutions = {};
	let formation;
	teamsThirdPartyIds
		.filter(teamsThirdPartyId => gameDetail.teamsData[teamsThirdPartyId].hasFormation)
		.forEach(teamsThirdPartyId => {
			formation = gameDetail.teamsData[teamsThirdPartyId].formation;
			substitutions[teamsThirdPartyId] = formation.substitutions;
			playersThirdPartyIds = playersThirdPartyIds.concat(
				[...formation.lineup, ...formation.bench].map(({ playerId, player }) => ({
					playerId: Number(playerId),
					teamsThirdPartyId: Number(teamsThirdPartyId) || Number(player?.currentTeamId),
					playerName: player.shortName
				}))
			);
		});
	return { playersThirdPartyIds, substitutions, gameDetail };
}

function canAccessTactics({ admin }, permissions, enabledModules) {
	const teamHasAccess = enabledModules.includes('tactics');
	const userHasAccess = permissions.includes('tactics');
	return teamHasAccess && (admin || userHasAccess);
}

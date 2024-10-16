const {
	ONE_YEAR_IN_SECONDS: ONE_YEAR,
	CURRENCY_SYMBOLS: currenciesSymbols
} = require('../../common/constants/commonConstants');
const {
	AuthorizationError,
	ForbiddenError,
	UnprocessableEntityError,
	InternalError,
	BadRequestError,
	NotFoundError
} = require('../../common/modules/error');
const { ObjectID } = require('mongodb');
const { isEmpty, sortBy, pick, mapValues, partition } = require('lodash');
const tacticalInfoProvider = require('./thirdparty-connectors/tacticalInfoProvider');
const { v4: uuid } = require('uuid');
const moment = require('moment');
const sportsConstants = require('../../common/constants/sports-constants');
const { convert } = require('html-to-text');
const { getBonusText, getSingleConditionSimplified } = require('../shared/bonus-string-builder');
const { translateNotification, getTranslations, getLanguage, translate } = require('../shared/translate-utils');
const { getCustomerName } = require('../shared/common-utils');
const { getEventPlayerReport } = require('../shared/player-report.utils');
const permissions = ['directorApp', 'directorAppScouting'];
const CACHE_TTL = 43200;

const notificationsType = [
	'scouting',
	'contractExpiration',
	'appearanceBonus',
	'performanceBonus',
	'standardTeamBonus',
	'signingBonus',
	'customBonus',
	'appearanceFee',
	'performanceFee',
	'valorization',
	'invitation',
	'eventReminder',
	'eventUpdate',
	'scoutingGameReminder',
	'scoutingGameInvitation',
	'videoSharing',
	'videoComment',
	'playerVideoComment'
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
	'archived',
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
	'injuries',
	'goScores',
	'wellnesses'
];

const staffFields = [
	'id',
	'archived',
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
	'nationalityOrigin'
];

module.exports = function (DirectorV2) {
	DirectorV2.login = async function (email, password) {
		try {
			console.log(`[DIRECTORV2] Requested mobile app login from ${email}`);
			const responseToken = await DirectorV2.app.models.Customer.login(
				{
					email,
					password,
					ttl: ONE_YEAR
				},
				['customer']
			);
			if (!responseToken?.userId) throw AuthorizationError('Empty auth token');

			const customer = await DirectorV2.app.models.Customer.findOne({
				where: { id: ObjectID(responseToken.userId) },
				fields: ['id', 'clubId', 'email', 'password'],
				include: 'teamSettings'
			});

			if (!customer) return;

			const { directorApp, active } = await DirectorV2.app.models.Club.findOne({
				where: { id: ObjectID(customer.clubId) },
				fields: ['directorApp', 'active']
			});

			if (!active) {
				throw new ForbiddenError('The associated Club has been deactivated! Please contact support');
			}
			if (!directorApp) {
				throw ForbiddenError('Director App not enabled for this club');
			}

			const allowedTeamSettings = (customer.teamSettings() || []).filter(({ mobilePermissions }) =>
				(mobilePermissions || []).some(permission => permissions.includes(permission))
			);
			if (isEmpty(allowedTeamSettings)) {
				throw ForbiddenError('Not enough permissions');
			}
			await customer.updateAttribute('directorLatestLogin', moment().toDate());
			return {
				token: responseToken.id,
				customerId: customer.id
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.logout = async function (deviceId, req) {
		try {
			const token = await DirectorV2.getToken(req);
			if (!token) {
				throw AuthorizationError('Auth token not valid');
			}
			await DirectorV2.app.models.Customer.logout(token._id);
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.changePassword = async function (oldPassword, newPassword, req) {
		const token = await DirectorV2.getToken(req);
		console.log(`[DIRECTORV2] Requested password change from ${token.userId}`);
		const customer = await DirectorV2.app.models.Customer.findById(token.userId);
		if (!customer) throw InternalError('User not found');

		await DirectorV2.app.models.Customer.checkPasswordSecurity(newPassword);
		try {
			await customer.changePassword(oldPassword, newPassword);
		} catch (e) {
			throw InternalError(e.message);
		}
		await DirectorV2.app.models.Customer.postChangePassword(token.userId);

		try {
			return await DirectorV2.login(customer.email, newPassword);
		} catch (e) {
			throw InternalError('Invalid credentials');
		}
	};

	DirectorV2.resetPassword = async function (email) {
		try {
			console.log(`[DIRECTORV2] Requested password reset from ${email}`);
			const customer = await DirectorV2.app.models.Customer.findOne({ where: { email } });
			if (!customer) return;

			const club = await DirectorV2.app.models.Club.findById(customer.clubId);
			if (!club.active) {
				throw new ForbiddenError('The associated Club has been deactivated! Please contact support');
			}
			return DirectorV2.app.models.Customer.resetPassword({ email });
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getToken = async function (req) {
		const token = await DirectorV2.app.models.AccessToken.getDataSource()
			.connector.collection(DirectorV2.app.models.AccessToken.modelName)
			.findOne({ _id: req.headers['authorization'] });
		if (!token) {
			throw AuthorizationError('Auth token not provided');
		}
		return token;
	};

	DirectorV2.getTactics = async function (req) {
		try {
			const token = await DirectorV2.getToken(req);
			const { clubId } = await DirectorV2.app.models.Customer.findById(token.userId, { clubId: 1 });
			const { sportType } = await DirectorV2.app.models.Club.findById(ObjectID(clubId), { currency: 1 });
			return sportsConstants[sportType].fieldCoordinates;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getCurrency = async function (req) {
		try {
			const token = await DirectorV2.getToken(req);
			const { clubId } = await DirectorV2.app.models.Customer.findById(token.userId, { clubId: 1 });
			const { currency } = await DirectorV2.app.models.Club.findById(ObjectID(clubId), { currency: 1 });
			return {
				currency,
				currencySymbol: currency in currenciesSymbols ? currenciesSymbols[currency] : '€'
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getPositionsCoordinates = async function (req) {
		try {
			const token = await DirectorV2.getToken(req);
			const { clubId } = await DirectorV2.app.models.Customer.findById(token.userId, { clubId: 1 });
			const { sportType } = await DirectorV2.app.models.Club.findById(ObjectID(clubId), { currency: 1 });
			return sportsConstants[sportType].tacticBoardCoordinates;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getCustomer = async function (req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await DirectorV2.app.models.Customer.findById(token.userId, {
				id: 1,
				firstName: 1,
				lastName: 1,
				profilePhotoUrl: 1
			});
			if (!customer) {
				throw InternalError('User not found');
			}
			return {
				id: customer.id,
				firstName: customer.firstName,
				lastName: customer.lastName,
				profilePhotoUrl: customer.profilePhotoUrl || null
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getNotificationSettings = async function (req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await DirectorV2.app.models.Customer.findOne({
				where: { id: ObjectID(token.userId) },
				fields: [
					'notificationScouting',
					'notificationScoutingPlayers',
					'notificationScoutingMessages',
					'notificationScoutingMessagesPlayers',
					'id'
				],
				include: 'teamSettings'
			});
			if (!customer) {
				throw InternalError('User not found');
			}
			const teamNotificationConfig = sortBy(
				await Promise.all(
					(customer.teamSettings() || []).map(teamSetting => DirectorV2.getCustomerTeamSettings(teamSetting))
				),
				'teamName'
			);
			return {
				notificationScouting: customer.notificationScouting || false,
				notificationScoutingPlayers: customer.notificationScoutingPlayers
					? customer.notificationScoutingPlayers.toString()
					: null,
				notificationScoutingMessages: customer.notificationScoutingMessages || false,
				notificationScoutingMessagesPlayers: customer.notificationScoutingMessagesPlayers
					? customer.notificationScoutingMessagesPlayers.toString()
					: null,
				teamNotificationConfig: teamNotificationConfig
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getCustomerTeamSettings = async function (teamSettings) {
		const team = await DirectorV2.app.models.Team.findById(teamSettings.teamId, { name: 1 });
		if (!team) {
			throw InternalError('Team not found');
		}
		const {
			teamId,
			notificationEventInvitation,
			notificationEventReminder,
			notificationAppearanceFee,
			notificationPerformanceFee,
			notificationAppearanceBonuses,
			notificationPerformanceBonuses,
			notificationStandardTeamBonuses,
			notificationContractExpiration,
			notificationValorization,
			notificationVideoSharing,
			notificationVideoComment,
			notificationPlayerVideoComment
		} = teamSettings;
		return {
			teamId: String(teamId),
			teamName: team.name,
			notificationEventInvitation,
			notificationEventReminder,
			notificationAppearanceFee,
			notificationPerformanceFee,
			notificationAppearanceBonuses,
			notificationPerformanceBonuses,
			notificationStandardTeamBonuses,
			notificationContractExpiration,
			notificationValorization,
			notificationVideoSharing,
			notificationVideoComment,
			notificationPlayerVideoComment
		};
	};

	DirectorV2.updateNotificationSettings = async function (req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await DirectorV2.app.models.Customer.findById(token.userId);
			if (!customer) {
				throw InternalError('User not found');
			}
			const { body: config } = req;
			if (!config) {
				throw UnprocessableEntityError('Data not provided');
			}

			customer.notificationScouting = config.notificationScouting || false;
			customer.notificationScoutingPlayers = config.notificationScoutingPlayers
				? config.notificationScoutingPlayers.toString()
				: null;
			customer.notificationScoutingMessages = config.notificationScoutingMessages || false;
			customer.notificationScoutingMessagesPlayers = config.notificationScoutingMessagesPlayers
				? config.notificationScoutingMessagesPlayers.toString()
				: null;
			await customer.save();

			for (const teamSettingConfig of config.teamNotificationConfig) {
				const customerTeamSettings = await DirectorV2.app.models.CustomerTeamSettings.findOne({
					where: {
						customerId: ObjectID(token.userId),
						teamId: ObjectID(teamSettingConfig.teamId)
					}
				});
				if (customerTeamSettings) {
					customerTeamSettings.notificationContractExpiration = teamSettingConfig.notificationContractExpiration || 0;
					customerTeamSettings.notificationAppearanceBonuses = teamSettingConfig.notificationAppearanceBonuses || [];
					customerTeamSettings.notificationPerformanceBonuses = teamSettingConfig.notificationPerformanceBonuses || [];
					customerTeamSettings.notificationStandardTeamBonuses =
						teamSettingConfig.notificationStandardTeamBonuses || false;
					customerTeamSettings.notificationAppearanceFee = teamSettingConfig.notificationAppearanceFee || false;
					customerTeamSettings.notificationPerformanceFee = teamSettingConfig.notificationPerformanceFee || false;
					customerTeamSettings.notificationValorization = teamSettingConfig.notificationValorization || false;
					customerTeamSettings.notificationVideoSharing = teamSettingConfig.notificationVideoSharing || false;
					customerTeamSettings.notificationVideoComment = teamSettingConfig.notificationVideoComment || false;
					customerTeamSettings.notificationEventInvitation = teamSettingConfig.notificationEventInvitation || false;
					customerTeamSettings.notificationEventReminder = teamSettingConfig.notificationEventReminder || {
						active: false,
						formats: [],
						minutes: null
					};
					customerTeamSettings.notificationPlayerVideoComment =
						teamSettingConfig.notificationPlayerVideoComment || false;

					await customerTeamSettings.save();
				}
			}
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getMinimumVersion = async function () {
		try {
			return {
				android: Number(process.env.DIRECTORAPP_ANDROID_MINIMUM),
				ios: Number(process.env.DIRECTORAPP_IOS_MINIMUM)
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getClub = async function (req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await getCustomer(token, DirectorV2);

			const [{ crest, sportType }, imageToken, teams] = await Promise.all([
				DirectorV2.app.models.Club.findById(customer.clubId, { fields: { crest: 1, sportType: 1, type: 1 } }),
				DirectorV2.app.models.Storage.getToken(customer.clubId.toString()),
				DirectorV2.app.models.Team.find({
					where: { id: { inq: customer.teamSettings().map(({ teamId }) => teamId) } },
					fields: { id: 1, name: 1, enabledModules: 1 }
				})
			]);
			if (!imageToken) {
				console.error(`[DIRECTOR V2] Image Token not found for club ${customer.clubId}`);
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

	DirectorV2.getTeamSummary = async function (teamId) {
		try {
			const { name, id } = await DirectorV2.app.models.Team.findById(teamId);
			return {
				id,
				name
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getLatestScoutingLineup = async function (req) {
		try {
			const toQuery = moment().endOf('day').toDate();
			const fromQuery = moment(prevDay(toQuery, 6)).startOf('day').toDate();
			const fromQueryGo = moment(prevDay(toQuery, 13)).startOf('day').toDate();
			const [scoutingScenarios, scoutingPlayers, players, agents] = await Promise.all([
				DirectorV2.app.models.ScoutingLineup.find({ where: { teamId: ObjectID(req.params.id) } }),
				DirectorV2.app.models.PlayerScouting.find({
					where: { teamId: ObjectID(req.params.id) },
					fields: [
						'id',
						'name',
						'teamId',
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
						'altNationality',
						'passport',
						'altPassport',
						'birthDate',
						'position',
						'height',
						'weight',
						'position2',
						'position3',
						'downloadUrl',
						'feeFrom',
						'feeTo',
						'wageFrom',
						'wageTo',
						'contractStart',
						'contractEnd',
						'agent',
						'agentEmail',
						'agentPhone'
					]
				}),
				DirectorV2.app.models.ProfilePlayers.getPlayersWithContractAndWages(
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
									date: { between: [fromQuery, toQuery] }
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
				DirectorV2.app.models.Agent.find({
					where: { teamId: ObjectID(req.params.id) },
					fields: ['id', 'firstName', 'lastName', 'mobilePhone', 'phone', 'email', 'assistedIds']
				})
			]);
			if (!scoutingScenarios || isEmpty(scoutingScenarios)) {
				throw InternalError('No scouting scenarios found');
			}
			const parsedPlayers = players.map(player => JSON.parse(JSON.stringify(player)));
			let activeScenario =
				(scoutingScenarios || []).find(({ selectedDirectorAppScenario }) => selectedDirectorAppScenario) ||
				(scoutingScenarios || []).find(({ freezed }) => !freezed);
			if (!activeScenario) {
				const scenarioPlayers = parsedPlayers
					.filter(({ archived }) => !archived)
					.map((player, index) => ({ orderingIndex: index, playerId: player.id, player }));
				activeScenario = {
					teamId: ObjectID(req.params.is),
					tactic: '4-4-2',
					_players: scenarioPlayers
				};
				activeScenario = await DirectorV2.app.models.ScoutingLineup.create(activeScenario);
			}
			activeScenario._players = sortBy(activeScenario._players, 'orderingIndex');
			return [activeScenario, scoutingPlayers, parsedPlayers, agents];
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getScoutingScenario = async function (req) {
		try {
			const token = await DirectorV2.getToken(req);
			const translations = getTranslations(req.headers['accept-language']);
			const [[activeScenario, scoutingPlayers, players, agents], teamSetting, team] = await Promise.all([
				DirectorV2.getLatestScoutingLineup(req),
				DirectorV2.app.models.CustomerTeamSettings.findOne({
					where: {
						customerId: ObjectID(token.userId),
						teamId: ObjectID(req.params.id)
					}
				}),
				DirectorV2.app.models.Team.findOne({
					where: { id: req.params.id },
					fields: ['id', 'name']
				})
			]);
			const lineupWithBench = activeScenario._players
				.map(lineupPlayer => getPlayerLineup(lineupPlayer, players, [team], agents, translations))
				.filter(x => x);
			return {
				tactic: activeScenario.tactic,
				players: lineupWithBench,
				scoutingAssociations: DirectorV2.getScoutingPlayerAssociation(
					lineupWithBench,
					scoutingPlayers,
					teamSetting,
					translations
				),
				attachments: activeScenario._attachments
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getScoutingPlayerAssociation = function (lineupWithBench, playerScoutings, teamSetting, translations) {
		try {
			const scoutingPlayersAssociation = lineupWithBench.map(({ id, mappings }) => {
				const mapped = (mappings || [])
					.map(({ associatedScoutingId, associatedPosition }) => {
						const scouting = playerScoutings.find(({ id }) => String(id) === String(associatedScoutingId));
						if (scouting) {
							return {
								...mapScoutingPlayer(scouting, translations),
								associatedPlayerId: id,
								associatedPosition
							};
						}
					})
					.filter(x => x);
				const filtered = mapped.filter(({ associatedPosition }) =>
					teamSetting.mobilePermissions.includes('directorApp') &&
					!teamSetting.mobilePermissions.includes('directorAppScouting')
						? associatedPosition
						: true
				);
				return {
					playerId: String(id),
					associatedPlayers: filtered
				};
			});
			return scoutingPlayersAssociation;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	// TODO: split into multiple endpoint
	DirectorV2.getTeamStats = async function (teamId) {
		try {
			const [team, teamSeasons] = await Promise.all([
				DirectorV2.app.models.Team.findById(teamId),
				DirectorV2.app.models.TeamSeason.getDataSource()
					.connector.collection(DirectorV2.app.models.TeamSeason.modelName)
					.find({ teamId: ObjectID(teamId) })
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

			const dateFrom = moment(currentTeamSeason?.offseason).startOf('day').toDate() || moment().toDate();
			const dateTo = moment(currentTeamSeason?.inseasonEnd).endOf('day').toDate() || moment().toDate();

			const [teamFinancialData, events] = await Promise.all([
				DirectorV2.app.models.Team.getFinancialOverview(teamId, String(currentTeamSeason._id), minutesField, 40),
				DirectorV2.app.models.Event.find({
					where: {
						teamSeasonId: ObjectID(currentTeamSeason._id),
						format: 'game',
						start: { between: [dateFrom, dateTo] }
					},
					fields: ['title', 'opponent', 'opponentWyscoutId', 'result', 'start', 'home', 'id', 'subformatDetails']
				})
			]);

			const remainingGames = events.filter(({ start }) => moment(start).isAfter(moment()));
			const playedGames = events.filter(({ result, start }) => result && moment(start).isSameOrBefore(moment()));

			const previous3Games = playedGames.slice(0, 3);
			const next2Games = remainingGames.slice(0, 2).reverse();

			let win = 0;
			let draw = 0;
			let lost = 0;
			let notSet = 0;
			let fixtures = [];

			const totalGames = [...previous3Games, ...next2Games];

			const opponentInfos = await Promise.all(
				totalGames
					.filter(({ opponentWyscoutId }) => opponentWyscoutId)
					.map(({ opponentWyscoutId }) => DirectorV2.app.models.Wyscout.getTeamData(opponentWyscoutId))
			);

			totalGames.forEach(game => {
				let goalHome = null;
				let goalAway = null;
				let resultSplit = game.result ? game.result.split('-') : null;
				if (resultSplit?.length !== 2) {
					resultSplit = game.result ? game.result.split(' ') : null;
				}
				if (resultSplit?.length > 1) {
					goalHome = resultSplit[0];
					goalAway = resultSplit[1];
					resultSplit = resultSplit.map(x => Number(x));
					if (resultSplit[0] === resultSplit[1]) draw = draw + 1;
					else if (resultSplit[0] > resultSplit[1]) {
						win = game.home ? win + 1 : win;
						lost = game.home ? lost : lost + 1;
					} else if (resultSplit[0] < resultSplit[1]) {
						win = game.home ? win : win + 1;
						lost = game.home ? lost + 1 : lost;
					}
				} else notSet = notSet + 1;

				const opponentInfo = opponentInfos.find(({ wyId }) => wyId === game.opponentWyscoutId);
				fixtures.push({
					id: String(game._id || game.id),
					start: game.start,
					date: moment(game.start).format('DD/MM/YYYY'),
					home: game.home,
					goalHome: goalHome ? parseInt(String(goalHome)) : null,
					goalAway: goalAway ? parseInt(String(goalAway)) : null,
					competition: game.subformatDetails,
					opponent: {
						name: opponentInfo?.name || game.opponent,
						logo: opponentInfo?.imageDataURL || null
					}
				});
			});

			fixtures = fixtures.sort((a, b) => {
				return moment(b['start']).toDate().getTime() - moment(a['start']).toDate().getTime();
			});

			const contractTypes = getContractTypes(teamFinancialData);
			const graphContracts = getGraphContracts(teamFinancialData);

			return {
				seasonName: currentTeamSeason?.name || 'No Season Defined',
				gamesDone: playedGames.length,
				gamesTotal: remainingGames.length + playedGames.length,
				effectiveness: playedGames.length > 0 ? (win * 3) / playedGames.length : null,
				lost,
				win,
				draw,
				notSet,
				fixtures,
				totalSquadValue: parseInt(
					Math.round(parseFloat(String(teamFinancialData?.totalSquadValue?.totalSquadValue || 0)))
				),
				totalSquadValueGross: parseInt(
					Math.round(parseFloat(String(teamFinancialData?.totalSquadValue?.totalSquadValueGross || 0)))
				),
				percentForTeamValues: {
					...Object.entries(teamFinancialData?.totalSquadValue?.roleValues).reduce((acc, [role, value]) => {
						return {
							...acc,
							[role]: role ? parseInt(Math.round(parseFloat(String(value)))) : 0
						};
					}, {})
				},
				totalContractValue: parseInt(
					Math.round(parseFloat(String(teamFinancialData?.contractsData?.totalContractValue || 0)))
				),
				totalContractValueGross: parseInt(
					Math.round(parseFloat(String(teamFinancialData?.contractsData?.totalContractValueGross || 0)))
				),
				averageContractValue: parseInt(
					Math.round(parseFloat(String(teamFinancialData?.contractsData?.playersPa || 0)))
				),
				averageContractValueGross: parseInt(
					Math.round(parseFloat(String(teamFinancialData?.contractsData?.playersPaGross || 0)))
				),
				averageLengthYears: teamFinancialData?.contractsData?.avgContractLength?.years || 0,
				averageLengthMonths: teamFinancialData?.contractsData?.avgContractLength?.months || 0,
				playerBonusWon: teamFinancialData?.contractsData?.bonusWon,
				playerBonusWonGross: teamFinancialData?.contractsData?.bonusWonGross,
				playerBonusResdual: teamFinancialData?.contractsData?.residualBonus,
				playerBonusResdualGross: teamFinancialData?.contractsData?.residualBonusGross,
				staffBonusWon: teamFinancialData?.contractsData?.bonusStaffWon,
				staffBonusWonGross: teamFinancialData?.contractsData?.bonusStaffWonGross,
				staffBonusResidual: teamFinancialData?.contractsData?.residualStaffBonus,
				staffBonusResidualGross: teamFinancialData?.contractsData?.residualStaffBonusGross,
				totalPlayersWages: parseInt(
					Math.round(parseFloat(String(teamFinancialData?.contractsData?.fixedWagePlayersSum)))
				),
				totalPlayersWagesGross: parseInt(
					Math.round(parseFloat(String(teamFinancialData?.contractsData?.fixedWagePlayersSumGross)))
				),
				totalPlayerBonuses: parseInt(
					Math.round(
						parseFloat(
							(teamFinancialData?.contractsData?.bonusWon + teamFinancialData?.contractsData?.residualBonus).toString()
						)
					)
				),
				totalStaffWages: parseInt(Math.round(parseFloat(String(teamFinancialData?.contractsData?.fixedWageStaffSum)))),
				totalStaffWagesGross: parseInt(
					Math.round(parseFloat(String(teamFinancialData?.contractsData?.fixedWageStaffSumGross)))
				),
				totalStaffBonuses: parseInt(
					Math.round(
						parseFloat(
							(
								teamFinancialData?.contractsData?.bonusStaffWon + teamFinancialData?.contractsData?.residualStaffBonus
							).toString()
						)
					)
				),
				avgAvailability: parseInt(
					Math.round(parseFloat(String(teamFinancialData?.investmentPerformance?.teamAvailability || 0)))
				),
				losses: parseInt(Math.round(parseFloat(String(teamFinancialData?.investmentPerformance?.losses || 0)))),
				lossesGross: parseInt(
					Math.round(parseFloat(String(teamFinancialData?.investmentPerformance?.lossesGross || 0)))
				),
				teamRoi: parseInt(Math.round(parseFloat(String(teamFinancialData?.investmentPerformance?.teamRoi || 0)))),
				teamResidual: parseInt(
					Math.round(parseFloat(String(teamFinancialData?.investmentPerformance?.teamResidualRoi || 0)))
				),
				capitalGain: parseInt(
					Math.round(parseFloat(String(teamFinancialData?.investmentPerformance?.teamCapitalGain || 0)))
				),
				capitalGainGross: parseInt(
					Math.round(parseFloat(String(teamFinancialData?.investmentPerformance?.teamCapitalGainGross || 0)))
				),
				contractExpire1Year: teamFinancialData.contractExpiry?.contractsExpireIn1Year,
				contractTypes,
				graphContracts
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	// TODO: even with cached result, launch the computation and update the cached value
	DirectorV2.getTeamStatsCached = async function (teamId, req) {
		try {
			const asyncRedis = require('async-redis');
			const asyncClient = asyncRedis.decorate(Object.create(req.app.redisClient));
			const cacheKey = `Director_TeamStats_${teamId}`;
			const cachedStats = await asyncClient.get(cacheKey);
			if (!cachedStats) {
				const teamStats = await DirectorV2.getTeamStats(teamId);
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

	DirectorV2.invalidateStatsCache = async function (req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await DirectorV2.app.models.Customer.findById(token.userId);
			if (!customer) {
				throw InternalError('User not found');
			}
			const asyncRedis = require('async-redis');
			const asyncClient = asyncRedis.decorate(Object.create(req.app.redisClient));
			const cacheKey = `Director_TeamStats_${req.params.id}`;
			await asyncClient.del(cacheKey);
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getTeamPlayers = async function (id, req) {
		try {
			const token = await DirectorV2.getToken(req);
			await getCustomer(token, DirectorV2);

			const teamSeasons = await DirectorV2.app.models.TeamSeason.find({
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
				DirectorV2.app.models.ProfilePlayers.getPlayersWithContractAndWages(
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
				DirectorV2.app.models.Team.find({
					where: { _id: ObjectID(id) },
					fields: ['id', 'name']
				}),
				DirectorV2.app.models.Agent.find({
					where: { teamSeasonId: ObjectID(currentSeason?.id) },
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

	DirectorV2.getPlayers = async function (req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await getCustomer(token, DirectorV2);
			const teamIds = customer.teamSettings().map(({ teamId }) => ObjectID(teamId));
			const [players, teams, agents] = await Promise.all([
				DirectorV2.app.models.ProfilePlayers.getPlayersWithContractAndWages(
					{
						where: { teamId: { inq: teamIds } },
						fields: playerFields
					},
					[]
				),
				DirectorV2.app.models.Team.find({
					where: { id: { inq: teamIds } },
					fields: ['id', 'name']
				}),
				DirectorV2.app.models.Agent.find({
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

	DirectorV2.getPlayerScouting = async function (req) {
		try {
			const translations = getTranslations(req.headers['accept-language']);
			const playerId = req.params.id;
			const player = await DirectorV2.app.models.PlayerScouting.findById(playerId, {
				fields: [
					'clubId',
					'teamId',
					'id',
					'feeFrom',
					'feeTo',
					'wageFrom',
					'wageTo',
					'_dataReports',
					'contractEnd',
					'currentTeam',
					'_videoClips',
					'wyscoutId',
					'downloadUrl',
					'name',
					'firstName',
					'lastName',
					'displayName',
					'nationality',
					'altNationality',
					'passport',
					'altPassport',
					'agent',
					'agentEmail',
					'agentPhone',
					'nationalityOrigin'
				]
			});
			if (!player) {
				throw InternalError('Player not found');
			}
			return {
				...mapScoutingPlayer(player, translations),
				associatedPlayerId: 1 // needed on the director app for discriminating if the player is a scouting. Will be removed in the future
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getSinglePlayer = async function (req) {
		try {
			const translations = getTranslations(req.headers['accept-language']);
			const token = await DirectorV2.getToken(req);
			const playerId = req.params.id;
			const customer = await getCustomer(token, DirectorV2);
			const teamIds = customer.teamSettings().map(({ teamId }) => ObjectID(teamId));
			const [[player], teams, agents] = await Promise.all([
				DirectorV2.app.models.ProfilePlayers.getPlayersWithContractAndWages(
					{ where: { id: ObjectID(playerId) }, fields: playerFields },
					[]
				),
				DirectorV2.app.models.Team.find({
					where: { id: { inq: teamIds } },
					fields: ['id', 'name']
				}),
				DirectorV2.app.models.Agent.find({
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

	DirectorV2.getPlayerStats = async function (req) {
		try {
			const provider = 'wyscout'; // TODO IT-3853
			const playerId = req.params.id;
			const player = await DirectorV2.app.models.Player.findById(playerId, {
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
			const [club, team, teamSeasons, activeEmployment, playerBonuses, playerData, playerVideos, customers] =
				await Promise.all([
					DirectorV2.app.models.Club.findById(player.clubId, {
						fields: ['currency', 'name', 'scoutingAlt']
					}),
					DirectorV2.app.models.Team.findById(player.teamId, {
						fields: ['id', 'name', '_playerProviderMapping', 'playerAttributes']
					}),
					DirectorV2.app.models.TeamSeason.find({ where: { teamId: ObjectID(player.teamId) } }),
					DirectorV2.app.models.EmploymentContract.findOne({
						where: { personId: ObjectID(playerId), status: true }
					}),
					DirectorV2.app.models.Bonus.find({ where: { personId: ObjectID(player.id) } }),
					tacticalInfoProvider.getCareerTransfers(
						provider,
						player[tacticalInfoProvider.getProviderField(provider, 'id')]
					),
					DirectorV2.app.models.VideoAsset.getDataSource()
						.connector.collection(DirectorV2.app.models.VideoAsset.modelName)
						.find({ linkedId: String(player.id), linkedModel: 'Player' })
						.toArray(),
					DirectorV2.app.models.Customer.find({
						where: { clubId: ObjectID(String(player.clubId)) },
						fields: ['firstName', 'lastName', 'id']
					})
				]);
			const minutesField = team?._playerProviderMaapping?.durationField || '';
			const activeTeamSeasonId = teamSeasons.find(({ offseason, inseasonEnd }) =>
				moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
			)?.id;
			const playerFinancialData = await DirectorV2.app.models.ProfilePlayers.getPlayerFinancialProfile(
				playerId,
				activeTeamSeasonId,
				'currentSeason',
				minutesField,
				40
			);
			const bonuses = (playerBonuses || []).map(bonus => prepareBonus(bonus, club, teamSeasons, req));
			const contractStart = activeEmployment?.dateFrom || null;
			const contractEnd = activeEmployment?.dateTo || null;
			const transfers = getPlayerTransfers(playerData);
			const careers = getPlayerCareer(playerData);
			const attributes = getAttributesData(JSON.parse(JSON.stringify(player)), playerVideos, team, customers);

			return {
				playerId,
				contractStart,
				contractEnd,
				currentValue: parseInt((playerFinancialData.marketValue || 0).toString()),
				currentValueGross: parseInt((playerFinancialData.marketValueGross || 0).toString()),
				pastValues: playerFinancialData.pastValues || [],
				bonus: parseInt((playerFinancialData.bonus || 0).toString()),
				bonusGross: parseInt((playerFinancialData.bonusGross || 0).toString()),
				residualBonus: parseInt((playerFinancialData.residualBonus || 0).toString()),
				residualBonusGross: parseInt((playerFinancialData.residualBonusGross || 0).toString()),
				bookValue: parseInt((playerFinancialData.netBookValue || 0).toString()),
				bookValueGross: parseInt((playerFinancialData.netBookValueGross || 0).toString()),
				fixedWage: parseInt((playerFinancialData.wage || 0).toString()),
				fixedWageGross: parseInt((playerFinancialData.wageGross || 0).toString()),
				incrementCurrentValue: playerFinancialData.gainLossPercent || 0,
				purchaseCost: parseInt((playerFinancialData.purchaseCost || 0).toString()),
				purchaseCostGross: parseInt((playerFinancialData.purchaseCostGross || 0).toString()),
				totalInvestmentCost: parseInt((playerFinancialData.totalInvestmentCost || 0).toString()),
				losses_perc: playerFinancialData.losses_perc || 0,
				losses: parseInt((playerFinancialData.losses || 0).toString()),
				lossesGross: parseInt((playerFinancialData.lossesGross || 0).toString()),
				residual_perc: playerFinancialData.residualRoi_perc || 0,
				residual: parseInt((playerFinancialData.residualRoi || 0).toString()),
				roi_perc: playerFinancialData.roi_perc || 0,
				roi: parseInt((playerFinancialData.roi || 0).toString()),
				untapped_perc: playerFinancialData.untapped_perc || 0,
				untapped: playerFinancialData.untapped ? parseInt(playerFinancialData.untapped.toString()) : 0,
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

	DirectorV2.getPlayerScoutingStats = async function (req) {
		try {
			const provider = 'wyscout'; // TODO IT-3853
			const playerId = req.params.id;
			const player = await DirectorV2.app.models.PlayerScouting.findById(playerId, {
				fields: [
					'id',
					'clubId',
					'teamId',
					'id',
					'feeFrom',
					'feeTo',
					'wageFrom',
					'wageTo',
					'contractEnd',
					'currentTeam',
					'wyscoutId'
				],
				include: ['attributes', 'descriptions']
			});
			if (!player) {
				throw InternalError('Player not found');
			}
			const [team, playerData, playerVideos, customers] = await Promise.all([
				DirectorV2.app.models.Team.findById(player.teamId, { fields: ['playerAttributes'] }),
				tacticalInfoProvider.getCareerTransfers(
					provider,
					player[tacticalInfoProvider.getProviderField(provider, 'id')]
				),
				DirectorV2.app.models.VideoAsset.getDataSource()
					.connector.collection(DirectorV2.app.models.VideoAsset.modelName)
					.find({ linkedId: String(player.id), linkedModel: 'PlayerScouting' })
					.toArray(),
				DirectorV2.app.models.Customer.find({
					where: { clubId: ObjectID(String(player.clubId)) },
					fields: ['firstName', 'lastName', 'id']
				})
			]);

			const transfers = getPlayerTransfers(playerData);
			const careers = getPlayerCareer(playerData);
			const attributes = getAttributesData(JSON.parse(JSON.stringify(player)), playerVideos, team, customers);

			// const customer = getAuthor(customers, player.lastAuthor);

			return {
				playerId: player.id.toString(),
				transferFeeMin: player.feeFrom ? player.feeFrom * 1000000 : null,
				tranferFeeMax: player.feeTo ? player.feeTo * 1000000 : null,
				salaryMin: player.wageFrom ? player.wageFrom * 1000000 : null,
				salaryMax: player.wageTo ? player.wageTo * 1000000 : null,
				dataReports: player._dataReports,
				contractEnd: player.contractEnd,
				// lastUpdate: player.lastUpdate,
				// lastAuthor: customer,
				currentTeam: player.currentTeam,
				associatedPlayerId: 1, // needed on the director app for discriminating if the player is a scouting. Will be removed in the future
				transfers: transfers || [],
				careers: careers || [],
				...attributes
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getComments = async function (req) {
		try {
			const playerId = req.params.playerId;
			const player = await DirectorV2.app.models.PlayerScouting.findById(playerId, {
				fields: ['notesThreads']
			});
			if (!player) {
				throw InternalError('Player not found');
			}
			player.notesThreads = sortByTime(player.notesThreads || [], 'time').reverse();
			return player.notesThreads;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.createComment = async function (req) {
		try {
			const playerId = req.params.playerId;
			const token = await DirectorV2.getToken(req);
			const [player, customer] = await Promise.all([
				DirectorV2.app.models.PlayerScouting.findById(playerId),
				DirectorV2.app.models.Customer.findById(token.userId)
			]);
			if (!player) {
				throw InternalError('Player not found');
			}
			if (!customer) {
				throw InternalError('User not found');
			}
			if (!player.notesThreads) player.notesThreads = [];

			const attachments = await DirectorV2.uploadFiles(req, player.clubId);

			const user = `${customer.firstName} ${customer.lastName}`;
			const comment = {
				id: uuid(),
				user,
				userId: customer.id.toString(),
				time: moment().toDate(),
				content: req.body.content,
				img: customer.downloadUrl,
				attachments,
				notesThreads: []
			};
			player.notesThreads.push(comment);
			await player.save();
			await DirectorV2.app.models.Notification.checkNotificationForPlayerScouting(player.id.toString(), [
				`$${user}$|$${player.displayName}$|notification.message.scoutingMessage`
			]);
			return comment;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.updateComment = async function (req) {
		try {
			const playerId = req.params.playerId;
			const commentId = req.params.commentId;
			const [token, player] = await Promise.all([
				DirectorV2.getToken(req),
				DirectorV2.app.models.PlayerScouting.findById(playerId)
			]);
			if (!player) {
				throw InternalError('Player not found');
			}
			if (!player.notesThreads) player.notesThreads = [];

			const index = player.notesThreads.findIndex(({ id }) => id.toString() === commentId);
			const comment = player.notesThreads[index];
			if (!comment) {
				throw InternalError('Comment not found');
			}
			if (comment.userId.toString() !== token.userId.toString()) {
				throw AuthorizationError('You are not the comment author');
			}
			if (req.files.length > 0) {
				const attachments = await DirectorV2.uploadFiles(req, player.clubId);
				comment.attachments = attachments;
			}
			comment.content = req.body.content;
			comment.updatedTime = moment().toDate();
			player.notesThreads[index] = comment;
			await player.save();
			return comment;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.deleteComment = async function (req) {
		try {
			const playerId = req.params.playerId;
			const commentId = req.params.commentId;
			const [token, player] = await Promise.all([
				DirectorV2.getToken(req),
				DirectorV2.app.models.PlayerScouting.findById(playerId)
			]);
			if (!player) {
				throw InternalError('Player not found');
			}
			if (!player.notesThreads) player.notesThreads = [];

			const index = player.notesThreads.findIndex(({ id }) => id.toString() === commentId);
			const comment = player.notesThreads[index];
			if (!comment) {
				throw InternalError('Comment not found');
			}
			if (comment.userId.toString() !== token.userId.toString()) {
				throw AuthorizationError('You are not the comment author');
			}

			await DirectorV2.deleteFiles(comment, player.clubId);
			player.notesThreads.splice(index, 1);
			await player.save();
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getReplies = async function (req) {
		try {
			const playerId = req.params.playerId;
			const commentId = req.params.commentId;
			const player = await DirectorV2.app.models.PlayerScouting.findById(playerId, {
				fields: ['notesThreads']
			});
			if (!player) {
				throw InternalError('Player not found');
			}
			if (!player.notesThreads) player.notesThreads = [];
			const index = player.notesThreads.findIndex(({ id }) => id.toString() === commentId);
			const comment = player.notesThreads[index];
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

	DirectorV2.createReply = async function (req) {
		try {
			const playerId = req.params.playerId;
			const commentId = req.params.commentId;
			const token = await DirectorV2.getToken(req);
			const [player, customer] = await Promise.all([
				DirectorV2.app.models.PlayerScouting.findById(playerId),
				DirectorV2.app.models.Customer.findById(token.userId)
			]);
			if (!player) {
				throw InternalError('Player not found');
			}
			if (!customer) {
				throw InternalError('User not found');
			}
			if (!player.notesThreads) player.notesThreads = [];

			const user = `${customer.firstName} ${customer.lastName}`;
			const index = player.notesThreads.findIndex(({ id }) => id.toString() === commentId);
			const comment = player.notesThreads[index];
			if (!comment) {
				throw InternalError('Comment not found');
			}
			const attachments = await DirectorV2.uploadFiles(req, player.clubId);
			const reply = {
				id: uuid(),
				user,
				userId: customer.id.toString(),
				time: moment().toDate(),
				content: req.body.content,
				img: customer.downloadUrl,
				attachments
			};
			if (!player.notesThreads[index].notesThreads) player.notesThreads[index].notesThreads = [];
			player.notesThreads[index].notesThreads.push(reply);
			await player.save();
			await DirectorV2.app.models.Notification.checkNotificationForPlayerScouting(player.id.toString(), [
				`$${user}$|$${player.displayName}$|notification.message.scoutingMessage`
			]);
			return reply;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.updateReply = async function (req) {
		try {
			const playerId = req.params.playerId;
			const commentId = req.params.commentId;
			const replyId = req.params.replyId;
			const [token, player] = await Promise.all([
				DirectorV2.getToken(req),
				DirectorV2.app.models.PlayerScouting.findById(playerId)
			]);
			if (!player) {
				throw InternalError('Player not found');
			}
			if (!player.notesThreads) player.notesThreads = [];

			const index = player.notesThreads.findIndex(({ id }) => id.toString() === commentId);
			const comment = player.notesThreads[index];
			if (!comment) {
				throw InternalError('Comment not found');
			}
			if (!player.notesThreads[index].notesThreads) player.notesThreads[index].notesThreads = [];
			const replyIndex = comment.notesThreads.findIndex(({ id }) => id.toString() === replyId);
			const reply = player.notesThreads[index].notesThreads[replyIndex];
			if (!reply) {
				throw InternalError('Reply not found');
			}
			if (reply.userId.toString() !== token.userId.toString()) {
				throw AuthorizationError('You are not the reply author');
			}
			if (req.files.length > 0) {
				const attachments = await DirectorV2.uploadFiles(req, player.clubId);
				reply.attachments = attachments;
			}
			reply.content = req.body.content;
			reply.updatedTime = moment().toDate();
			player.notesThreads[index].notesThreads[replyIndex] = reply;
			await player.save();
			return reply;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.deleteReply = async function (req) {
		try {
			const playerId = req.params.playerId;
			const commentId = req.params.commentId;
			const replyId = req.params.replyId;
			const [token, player] = await Promise.all([
				DirectorV2.getToken(req),
				DirectorV2.app.models.PlayerScouting.findById(playerId, {
					fields: ['id', 'displayName', 'notesThreads']
				})
			]);
			if (!player) {
				throw InternalError('Player not found');
			}
			if (!player.notesThreads) player.notesThreads = [];

			const index = player.notesThreads.findIndex(({ id }) => id.toString() === commentId);
			const comment = player.notesThreads[index];
			if (!comment) {
				throw InternalError('Comment not found');
			}
			if (!player.notesThreads[index].notesThreads) player.notesThreads[index].notesThreads = [];
			const replyIndex = comment.notesThreads.findIndex(({ id }) => id.toString() === replyId);
			const reply = player.notesThreads[index].notesThreads[replyIndex];
			if (!reply) {
				throw InternalError('Reply not found');
			}
			if (reply.userId.toString() !== token.userId.toString()) {
				throw AuthorizationError('You are not the reply author');
			}
			await DirectorV2.deleteFiles(reply, player.clubId);
			player.notesThreads[index].notesThreads.splice(replyIndex, 1);
			await player.save();
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getNotifications = async function (start, limit, read, teamIds, startDate, endDate, req) {
		try {
			console.log(`[DIRECTORV2] Getting notifications list`);
			start = start && typeof start == 'number' ? start : 0;
			limit = limit && typeof limit == 'number' ? limit : 99;
			const lang = getLanguage(req.headers['accept-language']);
			const token = await DirectorV2.getToken(req);
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
			const notifications = await DirectorV2.app.models.Notification.find({
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

	DirectorV2.getNotificationsBadge = async function (req) {
		try {
			console.log(`[DIRECTORV2] Getting unread notifications number`);
			const token = await DirectorV2.getToken(req);
			if (!token) {
				throw AuthorizationError('Auth token not valid');
			}
			const count = await DirectorV2.app.models.Notification.count({
				customerId: ObjectID(token.userId),
				type: {
					in: notificationsType
				},
				read: false
			});
			return { count };
		} catch (err) {
			console.error(err);
			throw err;
		}
	};

	DirectorV2.setNotification = async function (req) {
		try {
			const { id } = req.params;
			const { read } = req.body;
			const token = await DirectorV2.getToken(req);
			if (!token) {
				throw AuthorizationError('Auth token not valid');
			}
			console.log(`[DIRECTORV2] Setting notification ${id} as ${read ? 'read' : 'unread'}`);
			await DirectorV2.app.models.Notification.updateAll({ id }, { read });
			return true;
		} catch (err) {
			console.error(err);
			throw err;
		}
	};

	DirectorV2.setAllNotifications = async function (req) {
		try {
			const { read } = req.body;
			const token = await DirectorV2.getToken(req);
			if (!token) {
				throw AuthorizationError('Auth token not valid');
			}
			console.log(`[DIRECTORV2] Setting all notifications for customer ${token.userId} as ${read ? 'read' : 'unread'}`);
			await DirectorV2.app.models.Notification.updateAll({ customerId: ObjectID(token.userId) }, { read });
			return true;
		} catch (err) {
			console.error(err);
			throw err;
		}
	};

	DirectorV2.getTeamBonuses = async function (teamId, req) {
		try {
			const token = await DirectorV2.getToken(req);
			if (!token) {
				throw AuthorizationError('Auth token not valid');
			}
			const seasons = await DirectorV2.app.models.TeamSeason.find({ where: { teamId: ObjectID(teamId) } });
			const currentTeamSeason = seasons.find(({ offseason, inseasonEnd }) =>
				moment().isBetween(moment(offseason), moment(inseasonEnd))
			);
			if (!currentTeamSeason) {
				throw InternalError('No current team season found');
			}
			const playerIds = currentTeamSeason.playerIds
				? currentTeamSeason.playerIds.filter(id => !Array.isArray(id)).map(id => ObjectID(id))
				: [];
			const staffIds = currentTeamSeason.staffIds
				? currentTeamSeason.staffIds.filter(id => !Array.isArray(id)).map(id => ObjectID(id))
				: [];

			const [allBonuses, valorizations] = await Promise.all([
				DirectorV2.app.models.Bonus.find({
					where: {
						personId: { inq: [...playerIds, ...staffIds] }
					}
				}),
				DirectorV2.app.models.BasicWage.find({
					where: { personId: { inq: [...playerIds, ...staffIds] }, type: 'valorization' }
				})
			]);

			const bonusList = await DirectorV2.wrapBonuses(teamId, [...allBonuses, ...valorizations], seasons, req);
			return bonusList;
		} catch (err) {
			console.error(err);
			throw err;
		}
	};

	DirectorV2.wrapBonuses = async function (teamId, bonuses, seasons, req) {
		const userMap = new Map();
		const contractMap = new Map();
		const agentMap = new Map();
		const language = req.headers['accept-language'];
		const team = await DirectorV2.app.models.Team.findById(ObjectID(teamId), { fields: ['clubId'] });
		const club = await DirectorV2.app.models.Club.findById(ObjectID(team.clubId), { fields: ['name', 'currency'] });
		const bonusList = [];
		for (const bonus of bonuses) {
			let agent;
			let contract = contractMap.get(String(bonus.contractId));
			if (!contract) {
				contract = await DirectorV2.app.models[bonus.contractType].findById(bonus.contractId);
				contractMap.set(String(contract.id), contract);
				if (bonus.contractType === 'AgentContract' && contract.agentId) {
					agent = agentMap.get(String(contract.agentId));
					if (!agent) {
						agent = await DirectorV2.app.models.Agent.findById(contract.agentId);
						agentMap.set(String(contract.agentId), agent);
					}
				}
			}

			let user = userMap.get(String(bonus.personId));
			if (!user) {
				user = await (bonus.personType === 'Staff'
					? DirectorV2.app.models.Staff.findOne({
							where: { id: ObjectID(bonus.personId) },
							fields: ['id', 'firstName', 'lastName', 'downloadUrl']
					  })
					: DirectorV2.app.models.Player.findOne({
							where: { id: ObjectID(bonus.personId) },
							fields: ['id', 'name', 'firstName', 'lastName', 'displayName', 'downloadUrl']
					  }));
				userMap.set(String(user.id), user);
			}
			const bonusLabel = getBonusLabel(bonus, language);
			const bonusText = getBonusTranslatedText(bonus, club, seasons, req);
			bonus.conditions.forEach((condition, index) => {
				condition.text = getConditionText(condition, bonus, club, seasons, req);
			});
			bonusList.push({
				...JSON.parse(JSON.stringify(bonus)),
				bonusLabel,
				bonusText,
				percentage: getBonusPercentage(bonus),
				img: user?.downloadUrl || null,
				name: user?.name || user?.firstName || null,
				firstName: user?.firstName || null,
				lastName: user?.lastName || null,
				displayName: user?.displayName || `${user?.firstName} ${user?.lastName}` || bonus.playerName || '',
				personStatus: contract.personStatus,
				status: user.archived ? 'archived' : 'active',
				agent: bonus.contractType === 'AgentContract',
				agentName: agent ? `${agent.firstName} ${agent.lastName}` : contract.agentName,
				staff: bonus.personType === 'Staff',
				toPay: bonus.contractType === 'EmploymentContract' || bonus.transferType === 'inward'
			});
		}
		return bonusList;
	};

	DirectorV2.getPlayerContracts = async function (req) {
		try {
			const token = await DirectorV2.getToken(req);
			const playerId = req.params.id;
			const customer = await getCustomer(token, DirectorV2);
			const teamIds = customer.teamSettings().map(({ teamId }) => ObjectID(teamId));
			const player = await DirectorV2.app.models.Player.findById(playerId, {
				fields: ['teamId']
			});
			if (!teamIds.map(id => String(id)).includes(String(player.teamId))) {
				throw ForbiddenError('Unauthorized to see this player');
			}

			const [activeEmployment, activeInward, activeOutward] = await Promise.all([
				DirectorV2.app.models.EmploymentContract.findOne({
					where: { personId: ObjectID(playerId), status: true }
				}),
				DirectorV2.app.models.TransferContract.findOne({
					where: { personId: ObjectID(playerId), status: true, typeTransfer: 'inward' }
				}),
				DirectorV2.app.models.TransferContract.findOne({
					where: { personId: ObjectID(playerId), status: true, typeTransfer: 'outward' }
				})
			]);
			return [
				...extractAttachmentFromContract(activeEmployment, 'employment'),
				...extractAttachmentFromContract(activeInward, 'purchase'),
				...extractAttachmentFromContract(activeOutward, 'sale')
			];
		} catch (err) {
			console.error(err);
			throw err;
		}
	};

	DirectorV2.getStaffContracts = async function (req) {
		try {
			const token = await DirectorV2.getToken(req);
			const staffId = req.params.id;
			const customer = await getCustomer(token, DirectorV2);
			const teamIds = customer.teamSettings().map(({ teamId }) => ObjectID(teamId));
			const staff = await DirectorV2.app.models.Staff.findById(staffId, {
				fields: ['teamId']
			});
			if (!teamIds.map(id => String(id)).includes(String(staff.teamId))) {
				throw ForbiddenError('Unauthorized to see this player');
			}

			const activeEmployment = await DirectorV2.app.models.EmploymentContract.findOne({
				where: { personId: ObjectID(staffId), status: true }
			});
			return [...extractAttachmentFromContract(activeEmployment, 'employment')];
		} catch (err) {
			console.error(err);
			throw err;
		}
	};

	DirectorV2.uploadFiles = async function (req, clubId) {
		const { files } = req;
		const uploaded = await Promise.all(
			(files || []).map(file =>
				DirectorV2.app.models.Storage.uploadFile(String(clubId), file.buffer, file.originalname)
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
	};

	DirectorV2.deleteFiles = async function (comment, clubId) {
		const { attachments } = comment;
		await Promise.all(attachments.map(({ url }) => DirectorV2.app.models.Storage.deleteFile(String(clubId), url)));
		return true;
	};

	DirectorV2.getTeamEvents = async function (req) {
		try {
			const { id: teamId } = req.params;
			const { dateStart: from, dateEnd: to } = req.query;
			const token = await DirectorV2.getToken(req);
			const customer = await DirectorV2.app.models.Customer.findById(token.userId, { id: 1 });
			if (!customer) {
				throw InternalError('User not found');
			}
			if (!from || !to) throw BadRequestError('Missing dates parameters');

			console.log(`[DIRECTORV2] Getting events from team ${teamId} between ${from} and ${to}`);

			const staff = await DirectorV2.app.models.Staff.findOne({ where: { customerId: customer.id } }, { id: 1 });

			const pipeline = getSeasonForEventsPipeline(teamId, from, to, staff?.id);
			const events = await DirectorV2.app.models.Event.getDataSource()
				.connector.collection(DirectorV2.app.models.Event.modelName)
				.aggregate(pipeline)
				.toArray();

			for (const event of events) {
				event.color = getColorForFormatSubformatTheme(event.format, event.subformat, event.theme);
				if (!event.end) event.end = moment(event.start).add(60, 'minute').toDate();
			}

			return sortBy(events, 'start');
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getEventDetails = async function (eventId, req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await DirectorV2.app.models.Customer.findById(token.userId, { id: 1 });
			if (!customer) {
				throw InternalError('User not found');
			}
			console.log(`[DIRECTORV2] Getting full event ${eventId}`);
			const pipeline = getFullEventPipeline(eventId);
			const [
				{
					videos,
					match: [match],
					team: [team],
					...event
				}
			] = await DirectorV2.app.models.Event.getDataSource()
				.connector.collection(DirectorV2.app.models.Event.modelName)
				.aggregate(pipeline)
				.toArray();
			if (!event) throw InternalError('Event not found');

			const [staff, clubPlayers] = await Promise.all([
				DirectorV2.app.models.Staff.findOne({ where: { customerId: customer.id } }, { id: 1 }),
				DirectorV2.app.models.Player.find({
					where: { clubId: team.clubId },
					fields: ['id', 'downloadUrl', 'nationality', 'displayName']
				})
			]);
			let gameStats, lineup;
			let statistics = [];
			let opponentStatistics = [];

			if (!event.staffIds) event.staffIds = [];

			event._attachments = (event._attachments || []).filter(({ sharedStaffIds }) =>
				sharedStaffIds.map(String).includes(String(staff?.id))
			);

			event.author = await getCustomerName(DirectorV2, event.author);

			if (event.format === 'training') {
				const drillsTeam = await DirectorV2.app.models.Drill.find({
					where: { teamId: ObjectID(event.teamId) },
					fields: ['_attachments', 'rules', 'description', 'id']
				});
				event._drills = (event._drills || []).map(drill => {
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
				const service = team.providerTeam === 'Wyscout' ? DirectorV2.app.models.Wyscout : DirectorV2.app.models.Instat;

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

			// delete event.playerIds;
			delete event._sessionPlayers;
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

	DirectorV2.getEventPlayerReport = async function (eventId, playerId, req) {
		try {
			console.log(`[DIRECTOR] Getting player report for event ${eventId} and player ${playerId}`);
			const token = await DirectorV2.getToken(req);
			const customer = await getCustomer(token, DirectorV2);
			const staff = await DirectorV2.app.models.Staff.find({
				where: { customerId: customer.id },
				fields: ['id']
			});
			return await getEventPlayerReport(DirectorV2, eventId, playerId, staff.id);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.createEvent = async function (payload, req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await DirectorV2.app.models.Customer.findById(token.userId, { id: 1 });
			if (!customer) {
				throw InternalError('User not found');
			}

			return payload;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	DirectorV2.getStaffs = async function (req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await getCustomer(token, DirectorV2);
			const teamIds = customer.teamSettings().map(({ teamId }) => ObjectID(teamId));
			const [staffs, teams, agents] = await Promise.all([
				DirectorV2.app.models.ProfilePlayers.getStaffsWithContractAndWages(
					{
						where: { teamId: { inq: teamIds } },
						fields: staffFields
					},
					[]
				),
				DirectorV2.app.models.Team.find({
					where: { id: { inq: teamIds } },
					fields: ['id', 'name']
				}),
				DirectorV2.app.models.Agent.find({
					where: { teamId: { inq: teamIds } },
					fields: ['id', 'firstName', 'lastName', 'mobilePhone', 'phone', 'email', 'assistedIds']
				})
			]);
			const translations = getTranslations(req.headers['accept-language']);
			const filtered = staffs
				.filter(player => isPlayerSearched(player, req.query))
				.map(player => mapSearchedPlayer(player, teams, agents, translations));
			return filtered;
		} catch (err) {
			console.error(err);
			throw InternalError('Error while getting players');
		}
	};

	DirectorV2.getSingleStaff = async function (req) {
		try {
			const translations = getTranslations(req.headers['accept-language']);
			const token = await DirectorV2.getToken(req);
			const staffId = req.params.id;
			const customer = await getCustomer(token, DirectorV2);
			const teamIds = customer.teamSettings().map(({ teamId }) => ObjectID(teamId));
			const [[staff], teams, agents] = await Promise.all([
				DirectorV2.app.models.ProfilePlayers.getStaffsWithContractAndWages(
					{ where: { id: ObjectID(staffId) }, fields: staffFields },
					[]
				),
				DirectorV2.app.models.Team.find({
					where: { id: { inq: teamIds } },
					fields: ['id', 'name']
				}),
				DirectorV2.app.models.Agent.find({
					where: { teamId: { inq: teamIds } },
					fields: ['id', 'firstName', 'lastName', 'mobilePhone', 'phone', 'email', 'assistedIds']
				})
			]);
			if (!teamIds.map(String).includes(String(staff.teamId))) {
				throw ForbiddenError('Unauthorized to see this player');
			}
			return mapSearchedPlayer(staff, teams, agents, translations);
		} catch (err) {
			console.error(err);
			throw InternalError('Error while getting staff');
		}
	};

	DirectorV2.getStaffStats = async function (req) {
		try {
			const staffId = req.params.id;
			const staff = await DirectorV2.app.models.Staff.findById(staffId, {
				fields: ['id', 'clubId', 'teamId']
			});
			if (!staff) {
				throw new InternalError('Staff not found');
			}
			const [club, teamSeasons, activeEmployment, playerBonuses] = await Promise.all([
				DirectorV2.app.models.Club.findById(staff.clubId, {
					fields: ['currency', 'name', 'scoutingAlt']
				}),
				DirectorV2.app.models.TeamSeason.find({ where: { teamId: ObjectID(staff.teamId) } }),
				DirectorV2.app.models.EmploymentContract.findOne({
					where: { personId: ObjectID(staffId), status: true }
				}),
				DirectorV2.app.models.Bonus.find({ where: { personId: ObjectID(staffId) } })
			]);
			const activeTeamSeasonId = teamSeasons.find(({ offseason, inseasonEnd }) =>
				moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
			)?.id;
			const staffFinancialData = await DirectorV2.app.models.ProfilePlayers.getStaffFinancialProfile(
				staffId,
				activeTeamSeasonId
			);
			const bonuses = (playerBonuses || []).map(bonus => prepareBonus(bonus, club, teamSeasons, req));
			const contractStart = activeEmployment?.dateFrom || null;
			const contractEnd = activeEmployment?.dateTo || null;

			return {
				staffId,
				contractStart,
				contractEnd,
				currentValue: parseInt((staffFinancialData.marketValue || 0).toString()),
				currentValueGross: parseInt((staffFinancialData.marketValueGross || 0).toString()),
				pastValues: staffFinancialData.pastValues || [],
				bonus: parseInt((staffFinancialData.bonus || 0).toString()),
				bonusGross: parseInt((staffFinancialData.bonusGross || 0).toString()),
				residualBonus: parseInt((staffFinancialData.residualBonus || 0).toString()),
				residualBonusGross: parseInt((staffFinancialData.residualBonusGross || 0).toString()),
				bookValue: parseInt((staffFinancialData.netBookValue || 0).toString()),
				bookValueGross: parseInt((staffFinancialData.netBookValueGross || 0).toString()),
				fixedWage: parseInt((staffFinancialData.wage || 0).toString()),
				fixedWageGross: parseInt((staffFinancialData.wageGross || 0).toString()),
				incrementCurrentValue: staffFinancialData.gainLossPercent || 0,
				purchaseCost: parseInt((staffFinancialData.purchaseCost || 0).toString()),
				purchaseCostGross: parseInt((staffFinancialData.purchaseCostGross || 0).toString()),
				totalInvestmentCost: parseInt((staffFinancialData.totalInvestmentCost || 0).toString()),
				losses_perc: staffFinancialData.losses_perc || 0,
				losses: parseInt((staffFinancialData.losses || 0).toString()),
				lossesGross: parseInt((staffFinancialData.lossesGross || 0).toString()),
				residual_perc: staffFinancialData.residualRoi_perc || 0,
				residual: parseInt((staffFinancialData.residualRoi || 0).toString()),
				roi_perc: staffFinancialData.roi_perc || 0,
				roi: parseInt((staffFinancialData.roi || 0).toString()),
				untapped_perc: staffFinancialData.untapped_perc || 0,
				untapped: staffFinancialData.untapped ? parseInt(staffFinancialData.untapped.toString()) : 0,
				bonuses
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getMe = async function (req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await DirectorV2.app.models.Customer.findById(token.userId);
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

	DirectorV2.updateMe = async function (req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await DirectorV2.app.models.Customer.findById(token.userId);
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

	DirectorV2.getChatPlayers = async function (req) {
		return await DirectorV2.app.models.Chat.getPlayers(req);
	};

	DirectorV2.getChatStaffs = async function (req) {
		return await DirectorV2.app.models.Chat.getStaffs(req);
	};

	DirectorV2.getTeamReadiness = async function (teamId, date, req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await DirectorV2.app.models.Customer.findById(token.userId);
			if (!customer) {
				throw InternalError('User not found');
			}

			return await DirectorV2.app.models.Readiness.getTeamReadiness(teamId, date);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getPlayerReadiness = async function (playerId, date, req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await DirectorV2.app.models.Customer.findById(token.userId);
			if (!customer) {
				throw InternalError('User not found');
			}

			return await DirectorV2.app.models.Readiness.getPlayerReadiness(playerId, date);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getPlayerInjuries = async function (playerId, req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await DirectorV2.app.models.Customer.findById(token.userId);
			if (!customer) {
				throw InternalError('User not found');
			}

			const [{ _chronicInjuries: chronicInjuries }, injuries] = await Promise.all([
				DirectorV2.app.models.Player.findById(playerId, { fields: ['_chronicInjuries'] }),
				DirectorV2.app.models.Injury.find({ where: { playerId } })
			]);

			return { chronicInjuries, injuries };
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getTeamTestMetrics = async function (id, req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await DirectorV2.app.models.Customer.findById(token.userId);
			if (!customer) {
				throw InternalError('User not found');
			}

			console.log(`[DIRECTORV2] Getting test metrics for team ${id}`);
			const { metricsTests } = await DirectorV2.app.models.Team.findById(id, { fields: ['metricsTests'] });
			return metricsTests;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	DirectorV2.getPlayerFitnessProfile = async function (id, testIds, metrics, req) {
		try {
			const token = await DirectorV2.getToken(req);
			const customer = await DirectorV2.app.models.Customer.findById(token.userId);
			if (!customer) {
				throw InternalError('User not found');
			}

			console.log(`[DIRECTORV2] Getting fitness profile for player ${id}`);
			return await DirectorV2.app.models.ProfilePlayers.getPlayerFitnessProfile(id, testIds, metrics);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	// TODO: now it calls always Wyscout. Once we implement the opponent statistics sync into our databases, change this
	DirectorV2.getMatchStats = async function (teamId, eventId, req) {
		try {
			console.log(`[DIRECTORV2] Getting match stats for event ${eventId} for team ${teamId}`);
			const token = await DirectorV2.getToken(req);
			const [
				{ opponentWyscoutId: opponentId, wyscoutId: matchId, home, _playerMatchStats, start, staffIds = [] },
				{ wyscoutId: myTeamId },
				staff
			] = await Promise.all([
				DirectorV2.app.models.Event.findById(eventId, {
					opponentWyscoutId: 1,
					wyscoutId: 1,
					home: 1,
					start: 1,
					_playerMatchStats: 1,
					staffIds: 1
				}),
				DirectorV2.app.models.Team.findById(teamId, { wyscoutId: 1 }),
				DirectorV2.app.models.Staff.findOne({ where: { customerId: token.userId } }, { id: 1 })
			]);

			let current_team = {};
			let opponent_team = {};
			let participants = _playerMatchStats;
			let opponentParticipants = [];

			const isCustomerPresent = staffIds.map(String).includes(String(staff?.id));

			if (matchId) {
				const gameDetail = await DirectorV2.app.models.Wyscout.singleTeamStatWithPlayers(matchId);
				const { playersThirdPartyIds, substitutions } = getPlayersThirdPartyIds(gameDetail);
				const [{ teamStats }, playersStats] = await Promise.all([
					DirectorV2.app.models.Wyscout.dashboardSingleTeamStat(
						matchId,
						home ? myTeamId : opponentId,
						home ? opponentId : myTeamId
					),
					DirectorV2.app.models.Wyscout.gamePlayerStats(matchId, playersThirdPartyIds, substitutions)
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

	DirectorV2.getVideos = async function (teamId, categories, req) {
		try {
			const token = await DirectorV2.getToken(req);

			const customer = await DirectorV2.app.models.Customer.findById(token.userId, { id: 1 });
			if (!customer) {
				throw InternalError('User not found');
			}

			const videoCollection = DirectorV2.app.models.VideoAsset.getDataSource().connector.collection(
				DirectorV2.app.models.VideoAsset.modelName
			);

			const pipelineVideos = getPipelineVideos(
				teamId,
				!categories || isEmpty(categories) ? ['TRAINING', 'OTHER', 'GAMES'] : categories
			);

			const [results, staff] = await Promise.all([
				videoCollection.aggregate(pipelineVideos).toArray(),
				DirectorV2.app.models.Staff.findOne({ where: { customerId: token.userId } }, { id: 1 })
			]);

			const filtered = results.filter(({ sharedStaffIds }) =>
				(sharedStaffIds || []).map(String).includes(String(staff?.id))
			);

			const wrapped = await Promise.all(filtered.map(result => DirectorV2.getAssociatedEvent(result)));
			return wrapped;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getAssociatedEvent = async function (video) {
		try {
			if (video.linkedModel) {
				video.linkedObject = await DirectorV2.app.models[video.linkedModel].findById(video.linkedId, {
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

	DirectorV2.getVideoComments = async function (req) {
		try {
			const { videoId } = req.params;
			const video = await DirectorV2.app.models.VideoAsset.findById(videoId, {
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

	DirectorV2.createVideoComment = async function (req) {
		try {
			const { videoId } = req.params;
			const token = await DirectorV2.getToken(req);
			const [video, customer] = await Promise.all([
				DirectorV2.app.models.VideoAsset.findById(videoId),
				DirectorV2.app.models.Customer.findById(token.userId)
			]);
			if (!video) {
				throw InternalError('Video not found');
			}
			if (!customer) {
				throw InternalError('User not found');
			}
			if (!video.notesThreads) video.notesThreads = [];

			const { clubId } = await DirectorV2.app.models.Team.findById(video.teamId, { fields: { clubId: 1 } });

			const attachments = await DirectorV2.uploadFiles(req, clubId);

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
				DirectorV2.app.models.Notification.checkForVideoCommentNotification(
					video.id,
					video.sharedStaffIds,
					[customer.id],
					video.teamId
				),
				DirectorV2.app.models.PlayerNotification.checkVideoCommentsNotifications(
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

	DirectorV2.updateVideoComment = async function (req) {
		try {
			const { videoId } = req.params;
			const commentId = req.params.commentId;
			const [token, video] = await Promise.all([
				DirectorV2.getToken(req),
				DirectorV2.app.models.VideoAsset.findById(videoId)
			]);
			if (!video) {
				throw InternalError('Video not found');
			}
			if (!video.notesThreads) video.notesThreads = [];

			const { clubId } = await DirectorV2.app.models.Team.findById(video.teamId, { fields: { clubId: 1 } });

			const index = video.notesThreads.findIndex(({ id }) => String(id) === commentId);
			const comment = video.notesThreads[index];
			if (!comment) {
				throw InternalError('Comment not found');
			}
			if (String(comment.userId) !== String(token.userId)) {
				throw AuthorizationError('You are not the comment author');
			}
			if (req.files.length > 0) {
				const attachments = await DirectorV2.uploadFiles(req, clubId);
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

	DirectorV2.deleteVideoComment = async function (req) {
		try {
			const { videoId } = req.params;
			const commentId = req.params.commentId;
			const [token, video] = await Promise.all([
				DirectorV2.getToken(req),
				DirectorV2.app.models.VideoAsset.findById(videoId)
			]);
			if (!video) {
				throw InternalError('Video not found');
			}
			if (!video.notesThreads) video.notesThreads = [];

			const { clubId } = await DirectorV2.app.models.Team.findById(video.teamId, { fields: { clubId: 1 } });

			const index = video.notesThreads.findIndex(({ id }) => String(id) === commentId);
			const comment = video.notesThreads[index];
			if (!comment) {
				throw InternalError('Comment not found');
			}
			if (String(comment.userId) !== String(token.userId)) {
				throw AuthorizationError('You are not the comment author');
			}

			await DirectorV2.deleteFiles(comment, clubId);
			video.notesThreads.splice(index, 1);
			await video.save();
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getVideoCommentReplies = async function (req) {
		try {
			const { videoId } = req.params;
			const commentId = req.params.commentId;
			const video = await DirectorV2.app.models.VideoAsset.findById(videoId, {
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
	DirectorV2.createVideoCommentReply = async function (req) {
		try {
			const { videoId } = req.params;
			const commentId = req.params.commentId;
			const token = await DirectorV2.getToken(req);
			const [video, customer] = await Promise.all([
				DirectorV2.app.models.VideoAsset.findById(videoId),
				DirectorV2.app.models.Customer.findById(token.userId)
			]);
			if (!video) {
				throw InternalError('Video not found');
			}
			if (!customer) {
				throw InternalError('User not found');
			}
			if (!video.notesThreads) video.notesThreads = [];

			const { clubId } = await DirectorV2.app.models.Team.findById(video.teamId, { fields: { clubId: 1 } });

			const user = `${customer.firstName} ${customer.lastName}`;
			const index = video.notesThreads.findIndex(({ id }) => String(id) === commentId);
			const comment = video.notesThreads[index];
			if (!comment) {
				throw InternalError('Comment not found');
			}
			const attachments = await DirectorV2.uploadFiles(req, clubId);
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
				DirectorV2.app.models.Notification.checkForVideoCommentNotification(
					video.id,
					video.sharedStaffIds,
					[customer.id],
					video.teamId
				),
				DirectorV2.app.models.PlayerNotification.checkVideoCommentsNotifications(
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

	DirectorV2.updateVideoCommentReply = async function (req) {
		try {
			const { videoId } = req.params;
			const commentId = req.params.commentId;
			const replyId = req.params.replyId;
			const [token, video] = await Promise.all([
				DirectorV2.getToken(req),
				DirectorV2.app.models.VideoAsset.findById(videoId)
			]);
			if (!video) {
				throw InternalError('Video not found');
			}
			if (!video.notesThreads) video.notesThreads = [];

			const { clubId } = await DirectorV2.app.models.Team.findById(video.teamId, { fields: { clubId: 1 } });

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
				const attachments = await DirectorV2.uploadFiles(req, clubId);
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

	DirectorV2.deleteVideoCommentReply = async function (req) {
		try {
			const { videoId } = req.params;
			const commentId = req.params.commentId;
			const replyId = req.params.replyId;
			const [token, video] = await Promise.all([
				DirectorV2.getToken(req),
				DirectorV2.app.models.VideoAsset.findById(videoId, {
					fields: ['id', 'notesThreads']
				})
			]);
			if (!video) {
				throw InternalError('Video not found');
			}
			if (!video.notesThreads) video.notesThreads = [];

			const { clubId } = await DirectorV2.app.models.Team.findById(video.teamId, { fields: { clubId: 1 } });

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
			await DirectorV2.deleteFiles(reply, clubId);
			video.notesThreads[index].notesThreads.splice(replyIndex, 1);
			await video.save();
			return true;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	DirectorV2.getPlayerRobustness = async function (playerId) {
		try {
			console.log(`[DIRECTOR] Getting robustness for player ${playerId}`);
			const player = await DirectorV2.app.models.Player.findById(playerId);
			if (!player) throw new InternalError('Player not found');
			const [team, teamSeasons] = await Promise.all([
				DirectorV2.app.models.Team.findById(player.teamId),
				DirectorV2.app.models.TeamSeason.getDataSource()
					.connector.collection(DirectorV2.app.models.TeamSeason.modelName)
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
			return await DirectorV2.app.models.ProfilePlayers.profileRobustness(
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

function extractAttachmentFromContract(contract, type) {
	const { _attachments } = contract || {};
	return (_attachments || []).map(attachment => ({
		...pick(attachment, ['name', 'date', 'downloadUrl', 'externalUrl']),
		type
	}));
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

function mapSearchedPlayer(player, teams, allAgents, translations) {
	return mapPlayer(player, teams, allAgents, translations);
}

function mapScoutingPlayer(scouting, translations) {
	return {
		id: scouting.id.toString(),
		img: scouting.downloadUrl,
		name: scouting.name,
		firstName: scouting.firstName,
		lastName: scouting.lastName,
		displayName: scouting.displayName,
		feeFrom: (scouting.feeFrom || 0) * 1000000,
		feeTo: (scouting.feeTo || 0) * 1000000,
		wageFrom: (scouting.wageFrom || 0) * 1000000,
		wageTo: (scouting.wageTo || 0) * 1000000,
		nationality: scouting.nationality,
		altNationality: scouting.altNationality,
		passport: scouting.passport,
		altPassport: scouting.altPassport,
		nationalityFull: scouting.nationality ? translations['nationalities.' + scouting.nationality] : null,
		altNationalityFull: scouting.altNationality ? translations['nationalities.' + scouting.altNationality] : null,
		passportFull: scouting.passport ? translations['nationalities.' + scouting.passport] : null,
		altPassportFull: scouting.altPassport ? translations['nationalities.' + scouting.altPassport] : null,
		expire: scouting.contractEnd,
		agent: {
			name: scouting.agent,
			email: scouting.agentEmail,
			phone: scouting.agentPhone
		},
		origin: scouting.nationalityOrigin
	};
}

function isPlayerSearched({ displayName, firstName, lastName }, query) {
	if (!query || isEmpty(query)) return true;
	if (!query.name) return false;
	return matchName(displayName, query.name) || matchName(firstName, query.name) || matchName(lastName, query.name);
}

function matchName(name, query) {
	return name && name.toLowerCase().indexOf(String(query).toLowerCase()) !== -1;
}

function getAgents(playerId, agents) {
	const filtered = agents.filter(({ assistedIds }) => assistedIds.includes(ObjectID(playerId)));
	return filtered;
}

function getPlayerLineup({ playerId, orderingIndex, mappings }, players, teams, allAgents, translations) {
	const originalPlayer = players.find(({ id }) => id.toString() === playerId.toString());
	if (originalPlayer) {
		return {
			orderingIndex,
			mappings,
			...mapPlayer(originalPlayer, teams, allAgents, translations)
		};
	}
}

function mapPlayer(player, teams, allAgents, translations) {
	const team = teams.find(({ id }) => id.toString() === player.teamId.toString());
	const agents = getAgents(player.id, allAgents);
	return {
		id: player.id.toString(),
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
		birthDate: moment(player.birthDate).format('DD/MM/YYYY'),
		position: player.position,
		heigth: player.height,
		weight: player.weight || 0,
		position2: player.position2,
		position3: player.position3,
		img: player.downloadUrl,
		status: player.currentStatus,
		teamId: player.teamId,
		teamName: team.name,
		wage: player.wage,
		expire: player.contractExpiry,
		agents,
		origin: player.nationalityOrigin,
		injuries: player.injuries,
		goScores: player.goScores,
		wellnesses: player.wellnesses
	};
}

function getMinutesField(team) {
	return team._playerProviderMapping?.durationField || 'minutesOnField';
}

function getContractTypes(financialData) {
	return {
		inTeam: (financialData?.contractTypes || {}).inTeam,
		inTeamOnLoan: (financialData?.contractTypes || {}).inTeamOnLoan,
		onLoan: (financialData?.contractTypes || {}).trial
	};
}

function getGraphContracts(financialData) {
	return Object.entries(financialData?.contractExpiry?.contractsEndPerYear || []).map(
		([season, { inTeam, inTeamOnLoan, trial }]) => {
			return {
				season,
				inTeam,
				inTeamOnLoan,
				trial
			};
		}
	);
}

function sortByTime(array, field) {
	return array.sort((a, b) => {
		return moment(a[field]).toDate().getTime() - moment(b[field]).toDate().getTime();
	});
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

function prevDay(date, n) {
	return moment(date).subtract(n, 'days').toDate();
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

// function getAuthor(customers, author) {
// 	const customer = customers.find(({ id }) => String(id) === String(author));
// 	if (!customer) return author;
// 	return `${customer.firstName} ${customer.lastName}`;
// }

function getSeasonForEventsPipeline(teamId, from, to, staffId, isAdmin) {
	const matchStage = {
		$match: {
			teamId: ObjectID(teamId),
			format: { $ne: 'medical' },
			start: { $gte: moment(from, 'YYYY-MM-DD').startOf('day').toDate() },
			end: { $lte: moment(to, 'YYYY-MM-DD').endOf('day').toDate() }
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
	return [matchStage, projectionStage, addFieldsStage, lookupVideoStage, lookupMatchStage, lookupTeamStage];
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

function getConditionText(condition, bonus, club, seasons, req) {
	const language = req.headers['accept-language'] || 'en-US';
	const text = getSingleConditionSimplified(condition, bonus, club, seasons, language);
	return text;
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

async function getCustomer(token, DirectorV2) {
	const customer = await DirectorV2.app.models.Customer.findById(token.userId, {
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

/* eslint-disable camelcase */

const { ObjectID } = require('mongodb');
const { isEmpty, flatten, omit, intersection } = require('lodash');
const moment = require('moment');
const {
	pushEventToAzureQueue,
	thresholdQueueName,
	robustnessQueueName,
	getPayloadForQueue
} = require('../modules/az-storage-queue');
const { InternalError, NotFoundError } = require('../modules/error');
const {
	getAmortizationLength,
	extractContractChain,
	getTransferFee,
	getAgentFeeFromAllContractsNew,
	getSolidarityMechanismFromActiveContracts,
	getTotalElementsAmountForSeasonNew
} = require('../../server/shared/financial-utils');

// TODO:
/*
	- Remove the following properties, now obsolete:
		- preventionExams
*/

module.exports = function (Player) {
	Player.getBonuses = async function (id, filters) {
		try {
			console.log(`[PLAYER] Get all bonuses for player ${id}...`);
			const player = await Player.findById(id);
			const obs$ = [player.employmentContracts.find(), player.transferContracts.find()];
			if (filters?.type === 'employment') obs$.splice(1, 1);
			if (filters?.type === 'transfer') obs$.splice(0, 1);
			const contracts = flatten(await Promise.all(obs$));
			const bonuses = flatten(
				await Promise.all(
					contracts
						.filter(({ status }) => filters?.active === undefined || status === filters?.active)
						.map(contract => contract.bonuses.find())
				)
			);
			return bonuses;
		} catch (e) {
			console.error(e);
			throw PlayerError(e);
		}
	};

	Player.afterRemote('prototype.__get__employmentContracts', async ctx => {
		ctx.result = await Promise.all(
			ctx.result.map(contract => Player.app.models.Contract.prepareContract(contract, 'EmploymentContract'))
		);
	});

	Player.afterRemote('prototype.__get__transferContracts', async ctx => {
		ctx.result = await Promise.all(
			ctx.result.map(contract => Player.app.models.Contract.prepareContract(contract, 'TransferContract'))
		);
	});

	Player.observe('before save', async ctx => {
		if (!ctx.currentInstance) return;
		const player = await Player.findById(ctx.currentInstance.id);
		if (ctx.currentInstance?.archived !== ctx.data?.archived) {
			if (ctx.data?.archived) {
				await Player.removeArchivedPlayerFromEntities({ ...player.__data, ...ctx.data });
			}
		}
		return;
	});

	Player.observe('after save', async ctx => {
		if (ctx?.instance?.id) {
			const linkedPlayer = await Player.findOne({
				where: { id: ctx.instance.id },
				fields: {
					_thresholds: false,
					_thresholdsPlayer: false,
					_thresholdsAgility: false,
					_thresholdsPower: false,
					_thresholdsSpeed: false,
					_thresholdsMovement: false,
					_thresholdsEndurance: false,
					_thresholdsAnthropometry: false,
					_thresholdsAncillary: false,
					_thresholdsSleep: false,
					_thresholdsCardiovascular: false,
					_thresholdsHaematology: false,
					_thresholdsAttendances: false,
					_thresholdsMedical: false,
					_preventionTreatments: false,
					_chronicInjuries: false,
					_thresholdsTeam: false,
					_thresholdsMovementScreening: false,
					_thresholdsTests: false
				}
			});

			if (linkedPlayer) {
				await Player.updateRelatedClubTransfers(linkedPlayer);
				await Player.updateRelatedCustomerPlayerEmail(linkedPlayer);
			}
		}

		return true;
	});

	Player.removeArchivedPlayerFromEntities = async player => {
		const { archivedDate } = player;

		const conditions = {
			teamId: player.teamId,
			format: 'game',
			start: { $gte: moment(archivedDate).startOf('day').toDate() },
			$or: [
				{ playerIds: player.id },
				{ '_playerMatchStats.playerId': player.id },
				{ '_sessionPlayers.playerId': player.id }
			]
		};

		const futureEvents = await Player.app.models.Event.getDataSource()
			.connector.collection(Player.app.models.Event.modelName)
			.find(conditions)
			.toArray();

		const matchesConditions = {
			$or: [
				{
					eventId: { $in: futureEvents.map(({ _id }) => _id) }
				},
				{
					teamId: player.teamId,
					date: { $gte: moment(archivedDate).startOf('day').toDate() },
					$or: [
						{ '_playerStats.playerId': player.id },
						{ '_offensive._players.playerId': String(player.id) },
						{ '_defensive._players.playerId': String(player.id) }
					]
				}
			]
		};
		const futureMatches = await Player.app.models.Match.getDataSource()
			.connector.collection(Player.app.models.Match.modelName)
			.find(matchesConditions)
			.toArray();

		// CLEAN EVENTS
		await Player.app.models.Event.getDataSource()
			.connector.collection(Player.app.models.Event.modelName)
			.update(
				{ _id: { $in: futureEvents.map(({ _id }) => _id) } },
				{ $pull: { playerIds: player.id } },
				{ multi: true }
			);

		await Player.app.models.Event.getDataSource()
			.connector.collection(Player.app.models.Event.modelName)
			.update(
				{ _id: { $in: futureEvents.map(({ _id }) => _id) } },
				{ $pull: { _playerMatchStats: { playerId: String(player.id) } } },
				{ multi: true }
			);

		await Player.app.models.Event.getDataSource()
			.connector.collection(Player.app.models.Event.modelName)
			.update(
				{ _id: { $in: futureEvents.map(({ _id }) => _id) } },
				{ $pull: { _sessionPlayers: { playerId: player.id } } },
				{ multi: true }
			);

		// CLEAN MATCHES
		await Player.app.models.Match.getDataSource()
			.connector.collection(Player.app.models.Match.modelName)
			.update(
				{ _id: { $in: futureMatches.map(({ _id }) => _id) } },
				{ $pull: { _playerStats: { playerId: player.id } } },
				{ multi: true }
			);

		await Player.app.models.Match.getDataSource()
			.connector.collection(Player.app.models.Match.modelName)
			.update(
				{ _id: { $in: futureMatches.map(({ _id }) => _id) } },
				{ $pull: { '_offensive._players': { playerId: String(player.id) } } },
				{ multi: true }
			);

		await Player.app.models.Match.getDataSource()
			.connector.collection(Player.app.models.Match.modelName)
			.update(
				{ _id: { $in: futureMatches.map(({ _id }) => _id) } },
				{ $pull: { '_defensive._players': { playerId: String(player.id) } } },
				{ multi: true }
			);

		return;
	};

	Player.updateRelatedClubTransfers = async savedPlayer => {
		const transfersforPlayer = await Player.app.models.ClubTransfer.find({
			where: { personId: savedPlayer.id }
		});
		for (const transfer of transfersforPlayer || []) {
			const transferPlayer = await transfer.player.get();
			if (!transferPlayer) continue;
			const transferPlayerKeys = Object.keys(omit(Player.app.models.PlayerTransfer.definition.rawProperties, 'id'));
			const playerKeys = Object.keys(omit(Player.definition.rawProperties, 'id'));
			for (const key of intersection(transferPlayerKeys, playerKeys)) {
				transferPlayer[key] = savedPlayer[key];
			}
			transferPlayer.sell = transferPlayer.sell || null;
			await transferPlayer.save();
		}
	};

	Player.updateRelatedCustomerPlayerEmail = async player => {
		const customerPlayer = await Player.app.models.CustomerPlayer.findOne({
			where: { playerId: player.id }
		});
		if (customerPlayer && player.email && customerPlayer.email !== player.email) {
			customerPlayer.email = player.email;
			try {
				await customerPlayer.save();
			} catch (error) {
				console.error(error);
			}
		}
	};

	// new
	Player.getAmortizationData = async function (id) {
		try {
			console.log(`[PLAYER] Getting amortization data for player ${id}...`);
			const [employmentContracts, currentInward] = await Promise.all([
				Player.app.models.EmploymentContract.find({
					where: { personId: id },
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
				Player.app.models.TransferContract.findOne({
					where: { personId: id, typeTransfer: 'inward', status: true },
					include: [
						{
							relation: 'agentContracts',
							scope: {
								include: ['fee', 'bonuses']
							}
						},
						'valorization',
						'bonuses'
					]
				})
			]);
			// employmentContracts = employmentContracts.map(x => JSON.parse(JSON.stringify(x)));
			// currentInward = JSON.parse(JSON.stringify(currentInward));
			const currentContract = employmentContracts.find(({ status }) => status === true);
			const wages = flatten([
				...(currentInward?.agentContracts() || []).map(({ fee }) => fee()),
				...(currentContract?.agentContracts() || []).map(({ fee }) => fee())
			]);
			const valorizations = currentInward?.valorization() || [];
			const bonuses = flatten([
				...(currentInward?.bonuses() || []),
				...(currentContract?.bonuses() || []),
				...(currentInward?.agentContracts() || []).map(({ bonuses }) => bonuses()),
				...(currentContract?.agentContracts() || []).map(({ bonuses }) => bonuses())
			]);

			const agentFees = wages.filter(
				({ agentId, type, contractType }) => type === 'fee' && agentId && contractType === 'AgentContract'
			);
			const agentBonuses = bonuses.filter(({ agentId, contractType }) => agentId && contractType === 'AgentContract');
			const transferBonuses = bonuses.filter(({ contractId }) => String(contractId) === String(currentInward?.id));

			const isAsset = true;

			const chain = extractContractChain(employmentContracts);

			const forecastData = {
				on: currentInward?.on || null,
				from: chain[0]?.dateFrom || null,
				to: currentContract?.dateTo || null,
				total: 0,
				cost: getTransferFee(currentInward, isAsset),
				agent: getAgentFeeFromAllContractsNew(currentInward, employmentContracts, isAsset),
				solidarityMechanism: getSolidarityMechanismFromActiveContracts(
					currentInward,
					agentFees,
					agentBonuses,
					transferBonuses
				),
				valorization: getTotalElementsAmountForSeasonNew(currentInward, valorizations),
				bonuses: 0,
				achievedBonuses: 0,
				agentBonuses: 0,
				agentAchievedBonuses: 0,
				amortization: 0,
				amortizationLength: getAmortizationLength(employmentContracts),
				chain
			};

			return forecastData;
		} catch (e) {
			console.error(e);
			throw PlayerError(e);
		}
	};

	Player.getThresholdValue = function (playerObj, thresholdName, gdType) {
		let thresholdArray = [];
		const playerThresholds = !isEmpty(playerObj._thresholds) ? playerObj._thresholds : [];
		thresholdArray = playerThresholds.find(({ name }) => name == gdType);
		if (!thresholdArray) {
			thresholdArray = playerThresholds.find(({ name }) => name == 'GD');
		}
		const th =
			thresholdArray && 'thresholds' in thresholdArray
				? thresholdArray.thresholds.find(({ name }) => name === thresholdName)
				: null;
		return th !== null && th !== undefined ? th[th.format] : 1;
	};

	Player.getThresholdArrayForExactGdType = function (playerObj, gdType) {
		let thresholdArray = [];
		const playerThresholds = !isEmpty(playerObj._thresholds) ? playerObj._thresholds : [];
		thresholdArray = playerThresholds.find(({ name }) => name == gdType);
		return thresholdArray;
	};

	Player.triggerThresholdsUpdate = async function (teamId, currentSeasonId, playerIds) {
		try {
			if (!isEmpty(playerIds)) {
				console.log(
					`[Player.triggerThresholdsUpdate] Triggering thresholds calculation for %s. Requesting computation now...`,
					playerIds
				);
				const [currentSeason, teamData] = await Promise.all([
					Player.app.models.TeamSeason.getDataSource()
						.connector.collection(Player.app.models.TeamSeason.modelName)
						.findOne(
							{ _id: ObjectID(currentSeasonId) },
							{ projection: { offseason: 1, inseasonEnd: 1, playerIds: 1 } }
						),
					Player.app.models.Team.getDataSource()
						.connector.collection(Player.app.models.Team.modelName)
						.findOne(
							{ _id: ObjectID(teamId) },
							{
								projection: {
									_id: 1,
									_gpsProviderMapping: 1,
									_playerProviderMapping: 1,
									name: 1,
									providerPlayer: 1,
									device: 1,
									providerTeam: 1,
									clubId: 1
								}
							}
						)
				]);
				const queueServiceClient = Object.create(Player.app.queueClient);
				const thresholdQueueClient = queueServiceClient.getQueueClient(thresholdQueueName);
				for (const playerId of playerIds) {
					const payload = getPayloadForQueue(thresholdQueueName, teamData, currentSeason, playerId);
					await pushEventToAzureQueue(thresholdQueueClient, payload);
				}
				console.log('Requested thresholds data calculation');
				return true;
			} else {
				throw Error('No players provided!');
			}
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Player.triggerRobustnessUpdate = async function (playerId, currentSeasonId, teamId) {
		try {
			if (!playerId) throw Error('No player provided!');
			console.log(
				`[Player.triggerRobustnessUpdate] Triggering robustness calculation for %s. Requesting computation now...`,
				playerId
			);
			const [currentSeason, teamData] = await Promise.all([
				Player.app.models.TeamSeason.getDataSource()
					.connector.collection(Player.app.models.TeamSeason.modelName)
					.findOne({ _id: ObjectID(currentSeasonId) }),
				Player.app.models.Team.getDataSource()
					.connector.collection(Player.app.models.Team.modelName)
					.findOne(
						{ _id: ObjectID(teamId) },
						{
							projection: {
								_id: 1,
								_gpsProviderMapping: 1,
								_playerProviderMapping: 1,
								name: 1,
								providerPlayer: 1,
								device: 1,
								providerTeam: 1,
								clubId: 1
							}
						}
					)
			]);
			const queueServiceClient = Object.create(Player.app.queueClient);
			const robustnessQueueClient = queueServiceClient.getQueueClient(robustnessQueueName);
			const payload = getPayloadForQueue(robustnessQueueName, teamData, currentSeason, playerId);
			// It's a PEOPLE event, it needs to set prefetchData before
			await pushEventToAzureQueue(robustnessQueueClient, payload);
			console.log('Requested robustness data calculation');
			return true;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	// Creation and deletion of Customer Player

	Player.createPlayerAppCredentials = async function (playerId) {
		console.log(`Create PlayerApp credentials for player ${playerId} `);
		try {
			const player = await Player.findById(playerId);
			if (!player.email) throw InternalError('Player has no email set!');

			const newCustomerPlayer = await Player.app.models.CustomerPlayer.createNew(player);

			return newCustomerPlayer;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Player.deletePlayerAppCredentials = async function (playerId) {
		console.log(`Delete PlayerApp credentials for player ${playerId}`);
		try {
			const customerPlayer = await Player.app.models.CustomerPlayer.findOne({
				where: { playerId: ObjectID(playerId) }
			});
			if (!customerPlayer) throw NotFoundError('Customer Player not found!');
			return await Player.app.models.CustomerPlayer.deleteById(customerPlayer.id);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Player.getFitnessProfile = async function (playerId, testIds, metrics) {
		try {
			console.log(`[PLAYER] Getting fitness profile for player ${playerId}`);
			return await Player.app.models.ProfilePlayers.getPlayerFitnessProfile(playerId, testIds, metrics);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Player.getActiveContract = async function (id, type) {
		try {
			console.log(`[PLAYER] Get active ${type} contract for player ${id}...`);
			let promise$;
			switch (type) {
				case 'employment': {
					promise$ = Player.app.models.EmploymentContract;
					break;
				}
				case 'inward':
				case 'outward': {
					promise$ = Player.app.models.TransferContract;
					break;
				}
				default: {
					throw new Error('Contract type not specified');
				}
			}
			const contract = promise$.find({
				where: { personId: id, status: true }
			});
			return contract;
		} catch (e) {
			console.error(e);
			throw PlayerError(e);
		}
	};

	Player.getInvestmentPerformance = async function (playerId, mode, minutesField, numberOfMatches) {
		try {
			console.log(`[PLAYER] Getting investment performance for player ${playerId}`);
			const player = await Player.findById(playerId);
			const club = await Player.app.models.Club.findById(player.clubId);
			return await Player.app.models.ProfilePlayers.getPlayerInvestmentPerformance(
				playerId,
				mode,
				minutesField,
				numberOfMatches,
				club
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};
};

function PlayerError(e) {
	const error = new Error(e);
	error.statusCode = e.statusCode || '500';
	error.code = 'PLAYER_ERROR';
	error.name = 'PlayerError';
	error.message = e.message;
	return error;
}

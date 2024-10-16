const {
	getCommonItemFromCloned,
	getConditionsFromCloned,
	getInstallmentsFromCloned,
	copyAgentContractData
} = require('../../server/shared/clone-contract.utils');
const { isEmpty } = require('lodash');

module.exports = function (ClubTransfer) {
	ClubTransfer.observe('after delete', async ctx => {
		try {
			console.log(`[TRANSFER] Deleted ClubTransfer with id ${ctx.where.id}. Deleting associated TransferPlayer...`);

			process.nextTick(
				async () => await ClubTransfer.app.models.PlayerTransfer.destroyAll({ clubTransferId: ctx.where.id })
			);
		} catch (e) {
			console.error(e);
			throw e;
		}
	});

	ClubTransfer.observe('after save', async ctx => {
		console.log(
			`[TRANSFER] ${ctx.isNewInstance ? 'Created' : 'Saved'} ${ctx.Model.name}${
				ctx.isNewInstance ? '' : ` with id ${ctx.instance.id}`
			}`
		);
		try {
			if (ctx.isNewInstance) {
				const clubTransferId = ctx.instance.id;
				const originalClubTransferPersonId = ctx.instance?.personId;
				const clubTransferPersonType = ctx.instance.personType;
				const tempWyscoutPlayerTransfer = ctx.instance?.tempWyscoutPlayerTransfer;
				if (clubTransferPersonType === 'PlayerScouting') {
					if (originalClubTransferPersonId) {
						const targetPlayer = await ClubTransfer.app.models.PlayerScouting.findById(originalClubTransferPersonId);
						await ClubTransfer.app.models.PlayerTransfer.create({
							...targetPlayer,
							id: undefined,
							clubTransferId: clubTransferId
						});
					} else if (tempWyscoutPlayerTransfer) {
						await ClubTransfer.app.models.PlayerTransfer.create({
							...tempWyscoutPlayerTransfer,
							id: undefined,
							clubTransferId: clubTransferId
						});
						// delete tempWyscoutPlayerTransfer from ClubTransfer and save
						await ctx.instance.updateAttributes({ tempWyscoutPlayerTransfer: null });
					} else {
						await ClubTransfer.app.models.PlayerTransfer.create({
							id: undefined,
							clubTransferId: clubTransferId,
							teamId: ctx.instance.teamId,
							firstName: 'Name',
							lastName: 'Surname',
							displayName: 'Name Surname'
						});
					}
				} else if (clubTransferPersonType === 'Player') {
					if (originalClubTransferPersonId) {
						const sourcePlayer = await ClubTransfer.app.models.Player.findById(originalClubTransferPersonId); // player to get contracts from
						const sourcePlayerId = sourcePlayer.id;
						const playerTransfer = await ClubTransfer.app.models.PlayerTransfer.create({
							// player to copy contracts to
							...sourcePlayer,
							id: undefined,
							clubTransferId: clubTransferId
						});
						await ClubTransfer.copyContractsFromPersonToPerson(
							sourcePlayerId,
							'Player',
							playerTransfer.id,
							'PlayerTransfer'
						);
					} else {
						await ClubTransfer.app.models.PlayerTransfer.create({
							clubTransferId: clubTransferId,
							teamId: ctx.instance.teamId,
							clubId: ctx.instance.clubId,
							firstName: 'Name',
							lastName: 'Surname',
							displayName: 'Name Surname'
						});
					}
				}
			}
		} catch (e) {
			console.error(e);
		}
	});

	ClubTransfer.buyPlayer = async function (id, targetTeamId, playerData) {
		console.log(`[TRANSFER] Buying Player with id ${id}...`);
		// Buying player
		const clubTransfer = await ClubTransfer.findById(id);
		if (!clubTransfer) {
			throw new Error(`ClubTransfer with id ${id} not found`);
		}
		if (!clubTransfer.isPurchase) {
			throw new Error(`ClubTransfer with id ${id} is not a purchase`);
		}
		// find playerTransfer
		const playerTransfer = await ClubTransfer.app.models.PlayerTransfer.findOne({ where: { clubTransferId: id } });
		const playerTransferId = playerTransfer?.id;
		if (!playerTransfer) {
			throw new Error(`PlayerTransfer with clubTransferId ${id} not found`);
		}
		if (!targetTeamId) {
			throw new Error(`No selectedTransferTeamId found for Player. Skipping...`);
		}

		// region Copy Contracts from PlayerTransfer to Player
		const squadPlayer = await ClubTransfer.app.models.Player.create({
			...playerTransfer,
			id: undefined,
			teamId: targetTeamId,
			currentStatus: 'inTeam',
			archived: false,
			archivedDate: null,
			archivedMotivation: null,
			clubId: playerData.clubId,
			downloadUrl: playerData.downloadUrl,
			profilePhotoUrl: playerData.profilePhotoUrl,
			profilePhotoName: playerData.profilePhotoName,
			_thresholds: playerData._thresholds,
			_thresholdsTests: playerData._thresholdsTests
		});
		console.log(`[TRANSFER] Created Player with id ${squadPlayer.id}...`);

		await ClubTransfer.copyContractsFromPersonToPerson(playerTransferId, 'PlayerTransfer', squadPlayer.id, 'Player');
		// endregion

		// Set playerTransfer to closed and currentStatus to signed
		clubTransfer.updateAttributes({ currentStatus: 'signed', closed: true });
		console.log(`[TRANSFER] Archived ClubTransfer with id ${clubTransfer.id}...`);
		return squadPlayer;
	};

	ClubTransfer.sellPlayer = async function (clubTransferId, club, amount, personStatus) {
		console.log(`[TRANSFER] Selling Player with clubTransferId ${clubTransferId}...`);
		// Selling player
		const clubTransfer = await ClubTransfer.findById(clubTransferId);
		if (!clubTransfer) {
			throw new Error(`ClubTransfer with id ${clubTransferId} not found`);
		}
		if (clubTransfer.isPurchase) {
			throw new Error(`ClubTransfer with id ${clubTransferId} is not a sale`);
		}
		// find playerTransfer
		const playerTransfer = await ClubTransfer.app.models.PlayerTransfer.findOne({ where: { clubTransferId } });
		if (!playerTransfer) {
			throw new Error(`PlayerTransfer with clubTransferId ${clubTransferId} not found`);
		}
		const activeOutwardContract = await ClubTransfer.app.models.TransferContract.findOne({
			where: { personId: playerTransfer.id, personType: 'PlayerTransfer', status: 1, typeTransfer: 'outward' }
		});
		if (!activeOutwardContract) {
			throw new Error(`No active outward contract found for PlayerTransfer with id ${playerTransfer.id}`);
		}
		// update active outward contract club, amount and status
		await activeOutwardContract.updateAttributes({ club, amount, personStatus });

		const motivationStatus = activeOutwardContract?.personStatus === 'sell' ? 'sold' : 'onLoan';

		// Find player
		const player = await ClubTransfer.app.models.Player.findById(clubTransfer.personId);
		if (!player) {
			throw new Error(`Player with id ${clubTransfer.personId} not found`);
		}

		// region copy Active Outward Contract from PlayerTransfer to Player
		if (activeOutwardContract) {
			const clonedTransferContract = await ClubTransfer.createCommonItems(
				player.id,
				'Player',
				activeOutwardContract,
				'TransferContract'
			);
			await ClubTransfer.createTransferContractItems(
				player.id,
				'Player',
				activeOutwardContract.id,
				clonedTransferContract.id
			);
		}
		// endregion

		// Set player to archived and archivedMotivation to sold
		await player.updateAttributes({ archived: true, archivedDate: new Date(), archivedMotivation: motivationStatus });
		console.log(`[TRANSFER] Archived Player with id ${player.id}...`);
		// Set ClubTransfer to archived and currentStatus to sold
		await clubTransfer.updateAttributes({ closed: true, currentStatus: motivationStatus });
		console.log(`[TRANSFER] Archived ClubTransfer with id ${clubTransfer.id}...`);
		return player;
	};

	ClubTransfer.copyContractsFromPersonToPerson = async function (
		sourcePersonId,
		sourcePersonType,
		targetPersonId,
		targetPersonType
	) {
		try {
			console.log(
				`[TRANSFER] Copying contracts from ${sourcePersonType} with id ${sourcePersonId} to ${targetPersonType} with id ${targetPersonId}...`
			);
			const sourceEmploymentContracts = await ClubTransfer.app.models.EmploymentContract.find({
				where: { personId: sourcePersonId, personType: sourcePersonType }
			});
			const sourceTransferContracts = await ClubTransfer.app.models.TransferContract.find({
				where: { personId: sourcePersonId, personType: sourcePersonType }
			});
			for (const employmentContract of sourceEmploymentContracts) {
				await ClubTransfer.createCommonItems(
					targetPersonId,
					targetPersonType,
					employmentContract,
					'EmploymentContract'
				);
			}
			for (const transferContract of sourceTransferContracts) {
				const clonedTransferContract = await ClubTransfer.createCommonItems(
					targetPersonId,
					targetPersonType,
					transferContract,
					'TransferContract'
				);
				await ClubTransfer.createTransferContractItems(
					targetPersonId,
					targetPersonType,
					transferContract.id,
					clonedTransferContract.id
				);
			}
			console.log(
				`[TRANSFER] Copied contracts from ${sourcePersonType} with id ${sourcePersonId} to ${targetPersonType} with id ${targetPersonId}...`
			);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	ClubTransfer.createCommonItems = async function (targetPersonId, targetPersonType, contractToClone, ContractModel) {
		try {
			const basicWages = await ClubTransfer.app.models.BasicWage.find({ where: { contractId: contractToClone } });
			const bonuses = await ClubTransfer.app.models.Bonus.find({ where: { contractId: contractToClone } });
			const agentContracts = await ClubTransfer.app.models.AgentContract.find({
				where: { contractId: contractToClone.id }
			});
			const clonedContract = await ClubTransfer.app.models[ContractModel].create({
				...contractToClone,
				id: undefined,
				personId: targetPersonId,
				personType: targetPersonType
			});
			const commonObs$ = [
				ClubTransfer.app.models.BasicWage.create(
					basicWages.map(basicWage => {
						return {
							...basicWage,
							id: undefined,
							...getCommonItemFromCloned(clonedContract.id),
							...getConditionsFromCloned(basicWage),
							...getInstallmentsFromCloned(basicWage),
							personId: targetPersonId,
							personType: targetPersonType
						};
					})
				),
				ClubTransfer.app.models.Bonus.create(
					bonuses.map(bonus => {
						return {
							...bonus,
							...getCommonItemFromCloned(clonedContract.id),
							...getConditionsFromCloned(bonus),
							...getInstallmentsFromCloned(bonus),
							personId: targetPersonId,
							personType: targetPersonType
						};
					})
				)
			];
			await Promise.all(commonObs$);
			console.log(
				'[TRANSFER] Found AgentContracts: ',
				agentContracts.length + ' for contract with id ',
				contractToClone.id
			);
			if (!isEmpty(agentContracts)) {
				for (const agentContract of agentContracts) {
					console.log('[TRANSFER] Copying AgentContract with id ', agentContract.id);
					const agentContractId = agentContract.id;
					const clonedAgentContract = await ClubTransfer.app.models.AgentContract.create({
						...agentContract,
						...getCommonItemFromCloned(clonedContract.id)
					});
					console.log('[TRANSFER] Copied AgentContract with id ', clonedAgentContract.id);
					await copyAgentContractData(ClubTransfer, agentContractId, clonedAgentContract.id);
				}
			}
			return clonedContract;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	ClubTransfer.createTransferContractItems = async function (
		targetPersonId,
		targetPersonType,
		sourceTransferContractId,
		targetTransferContractId
	) {
		try {
			const loanOptions = await ClubTransfer.app.models.LoanOption.find({
				where: { contractId: sourceTransferContractId }
			});
			const transferClauses = await ClubTransfer.app.models.TransferClause.find({
				where: { contractId: sourceTransferContractId }
			});
			const transferContractObs$ = [
				ClubTransfer.app.models.LoanOption.create(
					loanOptions.map(loanOption => {
						return {
							...loanOption,
							...getCommonItemFromCloned(targetTransferContractId),
							...getConditionsFromCloned(loanOption),
							...getInstallmentsFromCloned(loanOption),
							personId: targetPersonId,
							personType: targetPersonType
						};
					})
				),
				ClubTransfer.app.models.TransferClause.create(
					transferClauses.map(transferClause => {
						return {
							...transferClause,
							...getCommonItemFromCloned(targetTransferContractId),
							...getConditionsFromCloned(transferClause),
							...getInstallmentsFromCloned(transferClause),
							personId: targetPersonId,
							personType: targetPersonType
						};
					})
				)
			];
			await Promise.all(transferContractObs$);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};
};

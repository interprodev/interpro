const ObjectId = require('mongodb').ObjectID;
const { NotFoundError } = require('../../common/modules/error');
const moment = require('moment');

const { isEmpty, flatten } = require('lodash');
const {
	getCommonItemFromCloned,
	getConditionsFromCloned,
	getInstallmentsFromCloned,
	copyAgentContractData
} = require('../../server/shared/clone-contract.utils');

module.exports = function (Contract) {
	Contract.observe('before save', async ctx => {
		console.log(
			`[CONTRACT] ${ctx.isNewInstance ? 'Creating' : 'Saving'} ${ctx.Model.name}${
				ctx.isNewInstance ? '' : ` with id ${ctx.data.id}`
			}`
		);
		try {
			const instanceToSave = ctx.isNewInstance ? ctx.instance : ctx.data;
			if (instanceToSave.personType !== 'PlayerTransfer') {
				const persisted = !ctx.isNewInstance && ctx.currentInstance;
				if (ctx.Model.name === 'EmploymentContract') {
					const otherContracts = await Contract.app.models[ctx.Model.name].find({
						where: getLoopbackFilterOptions(ctx, instanceToSave)
					});
					if (isEmpty(otherContracts)) {
						instanceToSave.status = true;
					} else {
						if (
							isStatusChanged(instanceToSave, persisted) ||
							isInwardChanged(instanceToSave, persisted) ||
							isOutwardChanged(instanceToSave, persisted)
						) {
							// NB: I use the native MongoDB connector in order to avoid being catched up again by this hook
							await Contract.getDataSource()
								.connector.collection(ctx.Model.name)
								.updateMany(getMongoDBFilterOptions(ctx, instanceToSave), getUpdateOptions(instanceToSave, persisted), {
									multi: true
								});
						}
					}
				}
				if (ctx.Model.name === 'AgentContract') {
					ctx.hookState.previousAgents =
						persisted.agentId && instanceToSave.agentId !== persisted.agentId.toString()
							? [persisted.agentId.toString()]
							: [];
				}
			}
		} catch (e) {
			console.error(e);
			throw e;
		}
	});

	Contract.observe('after save', async ctx => {
		console.log(
			`[CONTRACT] ${ctx.isNewInstance ? 'Created' : 'Saved'} ${ctx.Model.name}${
				ctx.isNewInstance ? '' : ` with id ${ctx.instance.id}`
			}`
		);
		try {
			if (ctx.instance.personType !== 'PlayerTransfer' && ctx.Model.name === 'AgentContract') {
				if (ctx.instance.agentId) {
					const { personId } = await Contract.app.models[ctx.instance.contractType].findById(ctx.instance.contractId, {
						fields: 'personId'
					});
					await Contract.updateRelatedAgent(ctx, true, personId);
				}
			}
		} catch (e) {
			console.error(e);
		}
	});

	Contract.updateRelatedAgent = async function (ctx, addedFlag, personId) {
		console.debug(
			`[CONTRACT] Updating agent ${
				ctx.instance ? ctx.instance.agentId : ctx.hookState.previousAgents
			} assisted players collection...`
		);
		try {
			if (addedFlag) {
				const agent = await Contract.app.models.Agent.findById(ctx.instance.agentId);
				if (!agent) {
					throw NotFoundError('Agent not found');
				}
				if (!agent.assistedIds.map(id => id.toString()).includes(personId.toString())) {
					await addAssistedToAgent(agent, personId);
				}
			}
			if (ctx.hookState.previousAgents && !isEmpty(ctx.hookState.previousAgents)) {
				console.debug(
					`[CONTRACT] Updating previous agent ${ctx.hookState.previousAgents} assisted players collection...`
				);
				const otherAgentContracts = await Contract.getOtherAgentContracts(personId);
				if (ctx.hookState.previousAgents.some(id => !otherAgentContracts.map(({ agentId }) => agentId).includes(id))) {
					const id = ctx.hookState.previousAgents.find(
						id => !otherAgentContracts.map(({ agentId }) => agentId).includes(id)
					);
					const previousAgent = await Contract.app.models.Agent.findById(id);
					await removeAssistedToAgent(previousAgent, personId);
				}
			}
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Contract.prepareContract = async function (contract, contractType) {
		try {
			if (contract) {
				let agentBonuses, agentFees;
				const [
					bonuses,
					basicWages,
					privateWriting,
					contributions,
					loanOption,
					sellOnFee,
					buyBack,
					valorization,
					agentContracts
				] = await Promise.all([
					contract.bonuses.find(),
					contractType === 'EmploymentContract' ? contract.basicWages.find({ type: 'contribution' }) : null,
					contractType === 'EmploymentContract' ? contract.privateWriting.find() : null,
					contractType === 'EmploymentContract' ? contract.contributions.find() : null,
					contractType === 'TransferContract' ? contract.loanOption.find() : null,
					contractType === 'TransferContract' ? contract.sellOnFee.find() : null,
					contractType === 'TransferContract' ? contract.buyBack.find() : null,
					contractType === 'TransferContract' ? contract.valorization.find() : null,
					contract.agentContracts.find()
				]);
				if (!isEmpty(agentContracts)) {
					[agentBonuses, agentFees] = await Promise.all([
						Promise.all(agentContracts.map(agent => agent.bonuses.find())),
						Promise.all(agentContracts.map(agent => agent.fee.find()))
					]);
				}
				contract.valid = Contract.app.models[contractType].isValid({
					...contract.__data,
					bonuses,
					basicWages,
					privateWriting,
					contributions,
					loanOption,
					sellOnFee,
					buyBack,
					valorization,
					agentContracts: (agentContracts || []).map((agentContract, index) => ({
						...agentContract.__data,
						agentBonuses: agentBonuses[index],
						agentFees: agentFees[index]
					}))
				});
				contract.agentIds = agentContracts.map(({ agentId }) => agentId);
				return contract;
			}
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Contract.getOtherAgentContracts = async function (personId) {
		try {
			const otherContracts = flatten(
				await Promise.all([
					Contract.app.models.EmploymentContract.find({ where: { personId }, fields: ['id', 'agent'] }),
					Contract.app.models.TransferContract.find({ where: { personId }, fields: ['id', 'agent'] })
				])
			);
			const otherAgentContracts = await Promise.all(otherContracts.map(contract => contract.agentContracts.find()));
			return otherAgentContracts;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};

	Contract.clone = async function (contractId, contractType, isRenewal, copyDataForRenewal) {
		console.log(`[CONTRACT] Cloning contract with id ${contractId}`);
		try {
			if (
				contractType !== 'EmploymentContract' &&
				contractType !== 'TransferContract' &&
				contractType !== 'AgentContract'
			)
				throw new Error('Invalid contract type');
			const contract = await Contract.app.models[contractType].findById(contractId);
			if (!contract) throw NotFoundError('Contract not found');
			const basicWages = await Contract.app.models.BasicWage.find({ where: { contractId } });
			const bonuses = await Contract.app.models.Bonus.find({ where: { contractId } });
			const clonedContract = await Contract.app.models[contractType].create({
				...contract,
				id: undefined,
				renew: isRenewal ? contractId : contract?.renew,
				renewContractId: isRenewal ? contract?.renewContractId : undefined,
				validated: false,
				status: false,
				dateFrom: isRenewal && contractType === 'EmploymentContract' ? moment().toDate() : contract?.dateFrom,
				dateTo: contract?.dateTo,
				inward: isRenewal && contractType === 'EmploymentContract' ? null : contract?.inward,
				outward: isRenewal && contractType === 'EmploymentContract' ? null : contract?.outward
			});
			if (!isRenewal || (isRenewal && copyDataForRenewal)) {
				const commonObs$ = [
					Contract.app.models.BasicWage.create(
						basicWages.map(basicWage => {
							return {
								...basicWage,
								id: undefined,
								...getCommonItemFromCloned(clonedContract.id),
								...getConditionsFromCloned(basicWage),
								...getInstallmentsFromCloned(basicWage)
							};
						})
					),
					Contract.app.models.Bonus.create(
						bonuses.map(bonus => {
							return {
								...bonus,
								...getCommonItemFromCloned(clonedContract.id),
								...getConditionsFromCloned(bonus),
								...getInstallmentsFromCloned(bonus)
							};
						})
					)
				];
				await Promise.all(commonObs$);
				if (contractType === 'EmploymentContract' || contractType === 'TransferContract') {
					const agentContracts = await Contract.app.models.AgentContract.find({ where: { contractId } });
					if (!isEmpty(agentContracts)) {
						for (const agentContract of agentContracts) {
							const agentContractId = agentContract.id;
							const clonedAgentContract = await Contract.app.models.AgentContract.create({
								...agentContract,
								...getCommonItemFromCloned(clonedContract.id)
							});
							await copyAgentContractData(Contract, agentContractId, clonedAgentContract.id);
						}
					}
					if (contractType === 'TransferContract') {
						const loanOptions = await Contract.app.models.LoanOption.find({ where: { contractId } });
						const transferClauses = await Contract.app.models.TransferClause.find({ where: { contractId } });
						const transferContractObs$ = [
							Contract.app.models.LoanOption.create(
								loanOptions.map(loanOption => {
									return {
										...loanOption,
										...getCommonItemFromCloned(clonedContract.id),
										...getConditionsFromCloned(loanOption),
										...getInstallmentsFromCloned(loanOption)
									};
								})
							),
							Contract.app.models.TransferClause.create(
								transferClauses.map(transferClause => {
									return {
										...transferClause,
										...getCommonItemFromCloned(clonedContract.id),
										...getConditionsFromCloned(transferClause),
										...getInstallmentsFromCloned(transferClause)
									};
								})
							)
						];
						await Promise.all(transferContractObs$);
					}
				}
			}
			return clonedContract;
		} catch (e) {
			console.error(e);
			throw e;
		}
	};
};

function getLoopbackFilterOptions(ctx, instanceToSave) {
	let options = {
		personId: ObjectId(instanceToSave.personId)
	};
	if (!ctx.isNewInstance) {
		options = {
			...options,
			id: { neq: ObjectId(instanceToSave.id) }
		};
	}
	return options;
}

function getMongoDBFilterOptions(ctx, instanceToSave) {
	let options = {
		personId: ObjectId(instanceToSave.personId)
	};
	if (!ctx.isNewInstance) {
		options = {
			...options,
			id: { $ne: ObjectId(instanceToSave.id) }
		};
	}
	return options;
}

function isStatusChanged(instanceToSave, persisted) {
	return instanceToSave.status && instanceToSave.status !== (persisted && persisted.status);
}

function isInwardChanged(instanceToSave, persisted) {
	return instanceToSave.inward && instanceToSave.inward !== (persisted && persisted.inward);
}

function isOutwardChanged(instanceToSave, persisted) {
	return instanceToSave.outward && instanceToSave.outward !== (persisted && persisted.outward);
}

function getUpdateOptions(instanceToSave, persisted) {
	const set = { $set: {} };
	if (isStatusChanged(instanceToSave, persisted)) set.$set = { ...set.$set, status: false };
	if (isInwardChanged(instanceToSave, persisted)) set.$set = { ...set.$set, inward: null };
	if (isOutwardChanged(instanceToSave, persisted)) set.$set = { ...set.$set, outward: null };
	return set;
}

async function addAssistedToAgent(agent, personId) {
	try {
		agent.assistedIds.push(personId);
		await agent.save();
	} catch (e) {
		console.error(e);
		throw e;
	}
}

async function removeAssistedToAgent(agent, personId) {
	try {
		const index = agent.assistedIds.map(id => id.toString()).findIndex(id => id === personId.toString());
		if (index !== -1) agent.assistedIds.splice(index, 1);
		await agent.save();
	} catch (e) {
		console.error(e);
		throw e;
	}
}

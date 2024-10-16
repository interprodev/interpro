module.exports = function (TransferContract) {
	TransferContract.observe('before delete', async ctx => {
		try {
			console.log(
				`[CONTRACT] Deleting TransferContract with id ${ctx.where.id}. Deleting associated contract options...`
			);
			const contract = await TransferContract.app.models[ctx.Model.name].findById(ctx.where.id || ctx.where.contractId);
			const contractAgents = await contract.agentContracts.find();
			const agentIds = contractAgents.map(({ agentId }) => agentId);
			ctx = {
				...ctx,
				hookState: {
					...ctx.hookState,
					previousAgents: agentIds
				}
			};
			await TransferContract.updateRelatedAgent(ctx, false, contract.personId);
		} catch (e) {
			console.error(e);
			throw e;
		}
	});

	TransferContract.observe('after delete', async ctx => {
		try {
			console.log(
				`[CONTRACT] Deleted TransferContract with id ${ctx.where.id}. Deleting associated contract options...`
			);

			const agentContracts = await TransferContract.app.models.AgentContract.find({
				where: { contractId: ctx.where.id }
			});

			const obs$ = [
				TransferContract.app.models.BasicWage.destroyAll({ contractId: ctx.where.id }),
				TransferContract.app.models.Bonus.destroyAll({ contractId: ctx.where.id }),
				TransferContract.app.models.LoanOption.destroyAll({ contractId: ctx.where.id }),
				TransferContract.app.models.TransferClause.destroyAll({ contractId: ctx.where.id }),
				TransferContract.app.models.Attachment.destroyAll({ contractId: ctx.where.id }),
				...agentContracts.map(contract => contract.destroy())
			];
			process.nextTick(async () => await Promise.all(obs$));
		} catch (e) {
			console.error(e);
			throw e;
		}
	});

	TransferContract.isValid = function (contract) {
		if (contract) {
			const isContractValid = !!contract.personStatus && isValidAmount(contract) && !!contract.on;
			const isBonusesValid = contract.bonuses.every(bonus => TransferContract.app.models.Bonus.isValid(bonus));
			const isLoanOptionsValid = contract.loanOption.every(wage =>
				TransferContract.app.models.LoanOption.isValid(wage)
			);
			const isBuyBacksValid = contract.buyBack.every(clause =>
				TransferContract.app.models.TransferClause.isValid(clause)
			);
			const isSellOnFeesValid = contract.sellOnFee.every(clause =>
				TransferContract.app.models.TransferClause.isValid(clause)
			);
			const isValorizationValid = contract.valorization.every(wage =>
				TransferContract.app.models.BasicWage.isValid(wage)
			);
			const isAgentValid = contract.agentContracts.map(agent =>
				TransferContract.app.models.AgentContract.isValid(agent)
			);
			return (
				isContractValid &&
				isBonusesValid &&
				isLoanOptionsValid &&
				isBuyBacksValid &&
				isSellOnFeesValid &&
				isValorizationValid &&
				isAgentValid
			);
		} else {
			return true;
		}
	};
};

function isValidAmount(contract) {
	return contract.personStatus === 'onLoan' || contract.personStatus === 'freeTransfer' ? true : !!contract.amount;
}

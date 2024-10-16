const { isEmpty } = require('lodash');

module.exports = function (AgentContract) {
	AgentContract.observe('after delete', async ctx => {
		try {
			console.log(`[CONTRACT] Deleted AgentContract with id ${ctx.where.id}. Deleting associated contract options...`);

			const obs$ = [
				AgentContract.app.models.BasicWage.destroyAll({ contractId: ctx.where.id || ctx.where.contractId }),
				AgentContract.app.models.Bonus.destroyAll({ contractId: ctx.where.id || ctx.where.contractId }),
				AgentContract.app.models.Attachment.destroyAll({ contractId: ctx.where.id || ctx.where.contractId })
			];

			process.nextTick(async () => await Promise.all(obs$));
		} catch (e) {
			console.error(e);
			throw e;
		}
	});

	AgentContract.isValid = function (contract) {
		if (contract) {
			const isContractValid =
				contract.agentId || (!contract.agentId && isEmpty(contract.agentBonuses) && isEmpty(contract.agentFees));
			const isBonusesValid = contract.agentBonuses.every(bonus => AgentContract.app.models.Bonus.isValid(bonus));
			const isFeesValid = contract.agentFees.every(wage => AgentContract.app.models.BasicWage.isValid(wage));
			return isContractValid && isBonusesValid && isFeesValid;
		} else {
			return true;
		}
	};
};

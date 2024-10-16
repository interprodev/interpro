const { isNullOrUndefined } = require('../../server/shared/financial-utils');

module.exports = function (EmploymentContract) {
	EmploymentContract.observe('before delete', async ctx => {
		try {
			console.log(
				`[CONTRACT] Deleting EmploymentContract with id ${ctx.where.id}. Deleting associated contract options...`
			);
			const contract = await EmploymentContract.app.models[ctx.Model.name].findById(ctx.where.id);
			const contractAgents = await contract.agentContracts.find();
			const agentIds = contractAgents.map(({ agentId }) => agentId);
			ctx = {
				...ctx,
				hookState: {
					...ctx.hookState,
					previousAgents: agentIds
				}
			};
			await EmploymentContract.updateRelatedAgent(ctx, false, contract.personId);
			return;
		} catch (e) {
			console.error(e);
			throw e;
		}
	});

	EmploymentContract.observe('after delete', async ctx => {
		try {
			console.log(
				`[CONTRACT] Deleted EmploymentContract with id ${ctx.where.id}. Deleting associated contract options...`
			);

			const agentContracts = await EmploymentContract.app.models.AgentContract.find({
				where: { contractId: ctx.where.id }
			});

			const obs$ = [
				EmploymentContract.app.models.BasicWage.destroyAll({ contractId: ctx.where.id }),
				EmploymentContract.app.models.Bonus.destroyAll({ contractId: ctx.where.id }),
				EmploymentContract.app.models.LoanOption.destroyAll({ contractId: ctx.where.id }),
				EmploymentContract.app.models.TransferClause.destroyAll({ contractId: ctx.where.id }),
				EmploymentContract.app.models.Attachment.destroyAll({ contractId: ctx.where.id }),
				...agentContracts.map(contract => contract.destroy())
			];

			process.nextTick(async () => await Promise.all(obs$));
		} catch (e) {
			console.error(e);
			throw e;
		}
	});

	EmploymentContract.isValid = function (contract) {
		if (contract) {
			const isContractValid =
				!!contract.personStatus && !!contract.dateFrom && !!contract.dateTo && !hasMissingFields(contract);
			const isBonusesValid = contract.bonuses.every(bonus => EmploymentContract.app.models.Bonus.isValid(bonus));
			const isBasicWagesValid = contract.basicWages.every(wage =>
				EmploymentContract.app.models.BasicWage.isValid(wage)
			);
			const isPrivateWritingValid = contract.privateWriting.every(wage =>
				EmploymentContract.app.models.BasicWage.isValid(wage)
			);
			const isContributionsValid = contract.contributions.every(wage =>
				EmploymentContract.app.models.BasicWage.isValid(wage)
			);
			const isAgentValid = contract.agentContracts.every(agent =>
				EmploymentContract.app.models.AgentContract.isValid(agent)
			);
			return (
				isContractValid &&
				isBonusesValid &&
				isBasicWagesValid &&
				isPrivateWritingValid &&
				isContributionsValid &&
				isAgentValid
			);
		} else {
			return true;
		}
	};
};

function hasMissingFields(contract) {
	const hasIncompleteBenefits = contract.benefits.some(
		benefit => benefit.enabled && isNullOrUndefined(benefit.amount) && isNullOrUndefined(benefit.grossAmount)
	);
	const hasIncompleteInsurance =
		contract.insurance &&
		(!isNullOrUndefined(contract.insurance.amount) || !isNullOrUndefined(contract.insurance.grossAmount)
			? !contract.insurance.prize
			: false);
	const hasIncompleteAdditionalClauses = contract.additionalClauses.some(x => !x.value);
	const hasIncompleteCommercialRights = contract.commercialRights.some(x => !x.value);
	const hasIncompleteOptions = contract.options.some(x => !x.value);
	const hasIncompleteBuyout = contract.buyout.some(
		x => isNullOrUndefined(x.amount) && isNullOrUndefined(x.grossAmount)
	);
	return (
		hasIncompleteBenefits ||
		hasIncompleteInsurance ||
		hasIncompleteAdditionalClauses ||
		hasIncompleteCommercialRights ||
		hasIncompleteOptions ||
		hasIncompleteBuyout
	);
}

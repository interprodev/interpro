const { v4: uuid } = require('uuid');

const cloneContractUtils = (module.exports = {
	getCommonItemFromCloned(clonedContractId) {
		return {
			id: undefined,
			contractId: clonedContractId
		};
	},
	getConditionsFromCloned(bonus) {
		return {
			conditions: (bonus?.conditions || [])
				.filter(condition => !!condition._id)
				.map(condition => {
					return { ...condition, _id: uuid() };
				})
		};
	},

	getInstallmentsFromCloned(bonus) {
		return {
			installments: (bonus?.installments || [])
				.filter(installment => !!installment._id)
				.map(installment => {
					return { ...installment, _id: uuid() };
				})
		};
	},

	copyAgentContractData: async function (Model, sourceAgentContractId, targetAgentContractId) {
		console.log(
			'[clone-contract.utils] copyAgentContractData from ',
			sourceAgentContractId,
			' to ',
			targetAgentContractId
		);
		const [basicWages, bonuses] = await Promise.all([
			Model.app.models.BasicWage.find({ where: { contractId: sourceAgentContractId } }),
			Model.app.models.Bonus.find({ where: { contractId: sourceAgentContractId } })
		]);
		for (const basicWage of basicWages) {
			await Model.app.models.BasicWage.create({
				...basicWage,
				...cloneContractUtils.getCommonItemFromCloned(targetAgentContractId),
				...cloneContractUtils.getConditionsFromCloned(basicWage),
				...cloneContractUtils.getInstallmentsFromCloned(basicWage)
			});
		}
		for (const bonus of bonuses) {
			await Model.app.models.Bonus.create({
				...bonus,
				...cloneContractUtils.getCommonItemFromCloned(targetAgentContractId),
				...cloneContractUtils.getConditionsFromCloned(bonus),
				...cloneContractUtils.getInstallmentsFromCloned(bonus)
			});
		}
	}
});

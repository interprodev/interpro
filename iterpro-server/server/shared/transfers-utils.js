const { flatten } = require('lodash');
const {
	getContractLength,
	getGross,
	getTotalBenefitsFromContract,
	getTotalConditionalElementsAmountForSeasonNew,
	getAgentFeeFromAllContractsNew
} = require('./financial-utils');

const EMPTY = { transferFee: 0, wageBonus: 0, benefits: 0, agent: 0, count: 0, wage: 0, loan: 0, purchase: 0 };

module.exports = {
	initTransferObject: phases => {
		const object = phases.map(phase => ({ [phase]: { ...EMPTY } })).reduce((phase, acc) => ({ ...acc, ...phase }), {});
		return object;
	},

	setTransferCost: async (currentDeal, transferPlayer, employments, transfers, deals, type) => {
		const activeEmployment = employments.find(({ status }) => status);
		if (transferPlayer) {
			if (!(currentDeal.currentStatus in deals)) deals[currentDeal.currentStatus] = { ...EMPTY };

			deals[currentDeal.currentStatus]['count'] += 1;

			const transferContractToConsider = transfers.find(({ typeTransfer }) => typeTransfer === type);

			const amount = transferContractToConsider?.amount || 0;

			let bonuses = 0;
			let wages = 0;
			let benefits = 0;
			let agent = 0;
			if (activeEmployment) {
				wages += getTotalBasicWage(activeEmployment, activeEmployment.basicWages(), null);
				bonuses += getTotalConditionalElementsAmountForSeasonNew(activeEmployment, activeEmployment.bonuses(), []);
				benefits += getTotalBenefitsFromContract(activeEmployment);

				if ((activeEmployment.agentContracts() || [])?.length > 0) {
					const inward = transfers.find(({ typeTransfer }) => typeTransfer === 'inward');
					agent += getAgentFeeFromAllContractsNew(inward, employments);
					agent += flatten(
						(activeEmployment.agentContracts() || []).map(agentContract =>
							getTotalConditionalElementsAmountForSeasonNew(agentContract, agentContract.bonuses(), [])
						)
					).reduce((a, b) => a + b, 0);
				}
			}

			deals[currentDeal.currentStatus]['transferFee'] += amount;
			deals[currentDeal.currentStatus]['agent'] += agent;
			deals[currentDeal.currentStatus]['wageBonus'] += bonuses + wages;
			deals[currentDeal.currentStatus]['benefits'] += benefits;
			deals[currentDeal.currentStatus]['wage'] += wages;
			deals[currentDeal.currentStatus]['loan'] += transferPlayer.currentStatus === 'onLoan' ? 1 : 0;
			deals[currentDeal.currentStatus]['purchase'] += transferPlayer.currentStatus !== 'onLoan' ? 1 : 0;
		}
		return deals;
	}
};

function getTotalBasicWage(contract, elements, seasonId) {
	const years = getContractLength(contract);
	const elementsOverMultipleSeasons = (elements || []).filter(({ season }) => (season || []).includes('allContract'));
	const totalOverMultipleSeason = getTotalAmountOverMultipleSeasons(elementsOverMultipleSeasons, years);

	const elementsForSelectedSeason = (elements || []).filter(({ season }) => (season || []).includes(String(seasonId)));
	const totalForSelectedSeason = getTotalAmount(elementsForSelectedSeason);
	return totalOverMultipleSeason + totalForSelectedSeason;
}

function getTotalAmountOverMultipleSeasons(collection, years, gross, vat) {
	return (collection || []).reduce((acc, { amount, grossAmount, repeat }) => {
		const tot = gross ? getGross({ grossAmount, amount }, vat) : amount;
		return acc + (repeat ? tot * years : tot / (years && years > 0 ? years : 1));
	}, 0);
}

function getTotalAmount(collection, gross, vat) {
	const length = collection.length;
	return (collection || []).reduce((acc, { amount, grossAmount, repeat }) => {
		const tot = gross ? getGross({ grossAmount, amount }, vat) : amount;
		return acc + (repeat ? tot : tot / length);
	}, 0);
}

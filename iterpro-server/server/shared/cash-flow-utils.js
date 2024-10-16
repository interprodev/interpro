const { flatten, groupBy, sumBy, sortBy } = require('lodash');
const moment = require('moment');

module.exports = {
	getCashFlowData: (seasons, transferContracts, national, international, achieved) => {
		const sales = transferContracts.filter(({ typeTransfer }) => typeTransfer === 'outward');
		const purchases = transferContracts.filter(({ typeTransfer }) => typeTransfer === 'inward');

		const filteredSales = filterContracts(sales, national, international);
		const filteredPurchases = filterContracts(purchases, national, international);

		const salesAmounts = flatten(filteredSales.map(contract => scanContract(contract, achieved, seasons)));
		const purchasesAmounts = flatten(filteredPurchases.map(contract => scanContract(contract, achieved, seasons)));

		const values = sortBy(seasons, 'offseason').map(teamSeason => {
			const salesValue = salesAmounts.filter(({ season }) => season === teamSeason.name);
			const purchasesValues = purchasesAmounts.filter(({ season }) => season === teamSeason.name);
			const sales = aggregateValues(salesValue);
			const purchases = aggregateValues(purchasesValues);
			return {
				season: teamSeason.name,
				date: teamSeason.offseason,
				sales,
				purchases,
				tradingBalance: getTradingBalance(sales, purchases)
			};
		});

		return [...values, getTotalSeason(values)];
	}
};

function filterContracts(contracts, national, international) {
	if (national && !international) {
		contracts = contracts.filter(({ homeTransfer }) => homeTransfer);
	} else if (!national && international) {
		contracts = contracts.filter(({ homeTransfer }) => !homeTransfer);
	}

	return contracts;
}

function scanContract(contract, achieved, seasons) {
	const factor = contract.typeTransfer === 'outward' ? 1 : -1;
	const transferFee = scanTransferFee(contract, seasons, factor);
	const bonuses = scanBonuses(contract.bonuses() || [], achieved, seasons, 'bonuses', factor);
	const valorization = scanBonuses(contract.valorization() || [], false, seasons, 'bonuses', -factor);
	const agentFee = flatten(
		(contract.agentContracts() || []).map(agentContract => scanAgentFee(agentContract.fee(), contract, seasons, -1))
	);
	const agentBonuses = flatten(
		(contract.agentContracts() || []).map(agentContract =>
			scanBonuses(agentContract.bonuses(), achieved, seasons, 'agentBonuses', -1)
		)
	);
	const elements = flatten([transferFee, bonuses, valorization, agentFee, agentBonuses]);
	return elements;
}

function scanTransferFee(contract, seasons, factor) {
	if (!contract.installments || contract.installments?.length === 0) {
		const elementSeason = seasonAtDate(seasons, contract.on);
		const elementValue = Math.round(factor * contract.amount);
		return [{ season: elementSeason?.name, type: 'transferFee', amount: elementValue }];
	} else {
		const installmentsValue = (contract.installments || []).map(installment => {
			const elementSeason = getSeasonById(seasons, installment.season) || seasonAtDate(seasons, installment.date);
			const elementValue = factor * installment.value;
			return { season: elementSeason?.name, type: 'transferFee', amount: elementValue };
		});
		return installmentsValue;
	}
}

function scanBonuses(bonuses, achieved, seasons, type, factor = 1) {
	if (achieved) bonuses = bonuses.filter(isAchieved);
	const bonusesValue = bonuses.map(bonus => {
		if (!bonus.installments || bonus.installments?.length === 0) {
			const elementSeason = seasonAtDate(seasons, bonus.achievedDate || new Date());
			const elementValue = factor * bonus.amount;
			return [{ season: elementSeason?.name, type, amount: elementValue }];
		} else {
			const installmentsValue = bonus.installments.map(installment => {
				const elementSeason = getSeasonById(seasons, installment.season) || seasonAtDate(seasons, installment.date);
				const elementValue = factor * installment.value;
				return { season: elementSeason?.name, type, amount: elementValue };
			});
			return installmentsValue;
		}
	});
	return flatten(bonusesValue);
}

function scanAgentFee(fees, contract, seasons, factor) {
	const agentFeeValues = fees.map(fee => {
		if (!fee.installments || fee.installments?.length === 0) {
			const elementSeason = getSeasonById(seasons, fee.season[0]) || seasonAtDate(seasons, contract.on || new Date());
			const elementValue = factor * fee.amount;
			return [{ season: elementSeason?.name, type: 'agentFee', amount: elementValue }];
		} else {
			const installmentsValue = fee.installments.map(installment => {
				const elementSeason = getSeasonById(seasons, installment.season) || seasonAtDate(seasons, installment.date);
				const elementValue = factor * installment.value;
				return { season: elementSeason?.name, type: 'agentFee', amount: elementValue };
			});
			return installmentsValue;
		}
	});
	return flatten(agentFeeValues);
}

function isAchieved({ reached, progress }) {
	return reached || progress?.percentage >= 100;
}

function getSeasonById(seasons, seasonId) {
	if (!seasonId) return null;
	return seasons.find(({ id }) => String(id) === String(seasonId));
}

function seasonAtDate(seasons, date) {
	if (!date) return null;
	return seasons.find(({ offseason, inseasonEnd }) =>
		moment(date).isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
	);
}

// function seasonAtDateIndex(seasons, date) {
// 	if (!date) return null;
// 	return seasons.findIndex(({ offseason, inseasonEnd }) =>
// 		moment(date).isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
// 	);
// }

function getTradingBalance(sales, purchases) {
	const salesAmount = Object.values(sales).reduce((a, b) => a + b, 0);
	const purchasesAmount = Object.values(purchases).reduce((a, b) => a + b, 0);
	return salesAmount + purchasesAmount;
}

function aggregateValues(values) {
	return Object.entries(groupBy(values, 'type')).reduce(
		(acc, [type, elements]) => ({ ...acc, [type]: sumBy(elements, 'amount') }),
		{
			transferFee: 0,
			bonuses: 0,
			agentFee: 0,
			agentBonuses: 0
		}
	);
}

function getTotalSeason(values) {
	const total = {
		season: 'TOTAL',
		sales: {
			transferFee: sumBy(values, 'sales.transferFee'),
			bonuses: sumBy(values, 'sales.bonuses'),
			agentFee: sumBy(values, 'sales.agentFee'),
			agentBonuses: sumBy(values, 'sales.agentBonuses')
		},
		purchases: {
			transferFee: sumBy(values, 'purchases.transferFee'),
			bonus: sumBy(values, 'purchases.bonus'),
			agentFee: sumBy(values, 'purchases.agentFee'),
			agentBonuses: sumBy(values, 'purchases.agentBonuses')
		},
		tradingBalance: sumBy(values, 'tradingBalance')
	};

	return total;
}

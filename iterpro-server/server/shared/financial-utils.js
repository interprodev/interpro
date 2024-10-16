const { last, flatten } = require('lodash');
const moment = require('moment');

const financialUtils = (module.exports = {
	// REGION: UTILS
	isNullOrUndefined: val => val === null || val === undefined,

	getContractLength: contract => getContractYears(contract),

	getContractLengthMonths: contract => getContractMonths(contract),

	getYearsInTeam: contracts => {
		const minDate = moment.min(contracts.map(({ dateFrom }) => moment(dateFrom)));
		return (moment().diff(minDate, 'days') || 0) / 365;
	},

	getMonthsInTeam: contracts => {
		const minDate = moment.min(contracts.map(({ dateFrom }) => moment(dateFrom)));
		return moment().diff(minDate, 'months') || 0;
	},

	getYearsLastContracts: contracts => {
		const maxDate = moment.max(contracts.map(({ dateTo }) => moment(dateTo)));
		return (maxDate.diff(moment(), 'days') || 0) / 365;
	},

	getMonthsLastContracts: contracts => {
		const maxDate = moment.max(contracts.map(({ dateTo }) => moment(dateTo)));
		return maxDate.diff(moment(), 'months') || 0;
	},

	getLegalStatusFromContract: ({ archived }, inward, outward) => {
		if (archived) return outward?.type;
		return inward?.type;
	},

	getGross: ({ grossAmount, amount, total }, vat) => {
		return grossAmount || financialUtils.getVirtualGross(amount || total, vat);
	},

	getVirtualGross: (amount, vat) => {
		return amount + amount * ((vat || 0) / 100);
	},

	getPlayerValue: (player, gross, vat) => {
		const val = player.valueField ? player[player.valueField] : player.value;
		return (gross ? financialUtils.getVirtualGross(val, vat) : val) || 0;
	},

	getPlayerPastValues: player => {
		if (!player.valueField || player.valueField === 'value') return player._pastValues;
		else if (player.valueField === 'clubValue') return player._pastClubValues;
		else if (player.valueField === 'agentValue') return player._pastAgentValues;
		else if (player.valueField === 'transfermarktValue') return player._pastTransfermarktValues;
	},
	// endregion

	// REGION: CONTRACTS
	extractContractChain: contracts => {
		let chain = [];
		if (contracts?.length) {
			const current = contracts.find(({ status }) => status === true);
			if (current) {
				// let currentTemp = cloneDeep(JSON.parse(JSON.stringify(current)));
				let currentTemp = current;
				chain = [...chain, current];
				while (currentTemp?.renew && currentTemp?.renewContractId) {
					currentTemp = contracts.find(({ id }) => String(id) === String(currentTemp.renewContractId));
					if (currentTemp) chain = [...chain, currentTemp];
				}
			}
		}
		return chain.reverse(); // FROM OLDEST TO NEWEST
	},

	getTransferFee: (contract, asset, gross, vat) => {
		if (contract?.amount) {
			if (asset)
				return Number(contract.amountAsset ? (gross ? financialUtils.getGross(contract, vat) : contract.amount) : 0);
			else return Number(gross ? financialUtils.getGross(contract, vat) : contract.amount);
		}
		return 0;
	},

	getAgentFeeFromAllContractsNew: (inward, employmentContracts, asset, gross, vat) => {
		const chain = financialUtils.extractContractChain(employmentContracts);
		const inwardAgentFee = (inward?.agentContracts() || [])
			.map(agentContract => financialUtils.getAgentFeeFromSingleContractNew(agentContract, asset, gross, vat))
			.reduce(sum, 0);
		const employmentAgentContracts = flatten((chain || []).map(contract => contract?.agentContracts() || []));
		const employmentAgentFee = (employmentAgentContracts || [])
			.map(agentContract => financialUtils.getAgentFeeFromSingleContractNew(agentContract, asset, gross, vat))
			.reduce(sum, 0);
		return inwardAgentFee + employmentAgentFee;
	},

	getAgentFeeFromSingleContractNew: (contract, asset, gross, vat) => {
		const sumValues = (contract?.fee() || [])
			.map(contract => {
				if (asset) return Number(asset ? (gross ? financialUtils.getGross(contract, vat) : contract.amount) : 0);
				else return Number(gross ? financialUtils.getGross(contract, vat) : contract.amount);
			})
			.reduce(sum, 0);
		return sumValues;
	},

	getAgentFeePercentage(agentFee, transferFee) {
		let percentage = transferFee > 0.4 ? Math.round((agentFee / transferFee) * 100) : null;
		if (!!percentage && percentage < -100) {
			percentage = -100;
		}
		return percentage;
	},

	// if season is null, take the total wage. From each wage:
	//  - if 'allContract', take the amount and apply the "repeat factor" over the contract years
	//  - else, take the amount and apply the "repeat factor" over the selected season(s)
	// if season is defined, take the seasonal wage
	//  - if 'allContract', take the amount and do not apply the "repeat factor" [=== yearly amount]
	//  - else, take the amount ONLY if its seasons contain the season
	// Finally, sum all the values from each wage
	// NB: "repeat factor": if repeat, multiply the amount by the number of contract years/selected season(s); else divide
	getTotalElementsAmountForSeasonNew: (contract, elements, seasonId, gross, vat) => {
		if (!contract?.validated) return 0;

		const years = getContractYears(contract);
		const elementsOverMultipleSeasons = (elements || []).filter(({ season }) => (season || []).includes('allContract'));
		const totalOverMultipleSeason = getTotalAmountOverMultipleSeasons(elementsOverMultipleSeasons, years, gross, vat);

		const elementsForSelectedSeason = (elements || []).filter(({ season }) =>
			(season || []).includes(String(seasonId))
		);
		const totalForSelectedSeason = getTotalAmount(elementsForSelectedSeason, gross, vat);
		return totalOverMultipleSeason + totalForSelectedSeason;
	},

	// consider to merge with getTotalElementsAmountForSeasonNew
	getTotalElementsAmountForMultipleSeasons: (contract, elements, seasonIds, gross, vat) => {
		if (!contract?.validated) return 0;

		const years = getContractYears(contract);
		const elementsOverMultipleSeasons = (elements || []).filter(({ season }) => (season || []).includes('allContract'));
		const totalOverMultipleSeason = getTotalAmountOverMultipleSeasons(elementsOverMultipleSeasons, years, gross, vat);

		const elementsForSelectedSeason = (elements || []).filter(({ season }) =>
			(season || []).some(seasonId => seasonIds.includes(String(seasonId)))
		);
		const totalForSelectedSeason = getTotalAmount(elementsForSelectedSeason, gross, vat);
		return totalOverMultipleSeason + totalForSelectedSeason;
	},

	getTotalConditionalElementsAmountForSeasonNew: (contract, elements, seasonIds, gross, vat) => {
		if (!contract?.validated) return 0;

		const years = getContractYears(contract);
		const elementsWithAllContractInCondition = (elements || []).filter(({ conditions }) =>
			(conditions || []).some(({ seasons }) => (seasons || []).includes('allContract'))
		);
		const totalForAllContractCondition = getTotalAmountOverMultipleSeasons(
			elementsWithAllContractInCondition,
			years,
			gross,
			vat
		);

		const elementsWithSeasonInCondition = (elements || []).filter(({ conditions }) =>
			(conditions || []).some(({ seasons }) => seasonIds.some(seasonId => (seasons || []).includes(String(seasonId))))
		);
		const totalForSelectedSeason = getTotalAmount(elementsWithSeasonInCondition, gross, vat);
		return totalForAllContractCondition + totalForSelectedSeason;
	},

	getTotalBenefitsFromContract: (contract, gross, vat) => {
		const years = getContractYears(contract);
		const totalBenefits = (contract?.benefits || [])
			.filter(({ enabled }) => enabled === true)
			.map(({ amount }) => amount * years)
			.reduce((sum, value) => sum + (gross ? financialUtils.getVirtualGross(value, vat) : value), 0);
		return totalBenefits;
	},

	getSolidarityMechanismFromActiveContracts: (
		currentInward,
		agentFees,
		agentBonuses,
		transferBonuses,
		asset,
		gross,
		vat
	) => {
		const fromInward = getSolidarityMechanismFromElement(currentInward, asset, gross, vat);
		const fromTransferFees = (transferBonuses || [])
			.map(bonus => getSolidarityMechanismFromElement(bonus, asset, gross, vat))
			.reduce((a, b) => a + b, 0);
		const fromAgentFees = (agentFees || [])
			.map(fee => getSolidarityMechanismFromElement(fee, asset, gross, vat))
			.reduce((a, b) => a + b, 0);
		const fromAgentBonuses = (agentBonuses || [])
			.map(bonus => getSolidarityMechanismFromElement(bonus, asset, gross, vat))
			.reduce((a, b) => a + b, 0);

		return fromInward + fromTransferFees + fromAgentFees + fromAgentBonuses || 0;
	},
	// endregion

	// REGION: ASSET VALUES
	// transfer fee + achieved transfer bonus + agent fee + solidarity mechanism + valorization + achieved employment bonus (only if their asset value is set to true)
	getAssetValueNew: (
		activeInward,
		activeEmployment,
		employmentContracts,
		valorizations,
		wages,
		bonuses,
		seasons,
		gross,
		vat,
		taxes
	) => {
		const agentFees = wages.filter(
			({ type, contractId }) =>
				type === 'fee' &&
				(String(contractId) === String(activeEmployment?.id) || String(contractId) === String(activeInward?.id))
		);
		const agentBonuses = bonuses.filter(
			({ agentId, contractId }) =>
				agentId &&
				(String(contractId) === String(activeEmployment?.id) || String(contractId) === String(activeInward?.id))
		);
		const transferBonuses = bonuses.filter(({ contractId }) => String(contractId) === String(activeInward?.id));

		const transferFee = financialUtils.getTransferFee(activeInward, true, gross, vat);

		const agentFee = financialUtils.getAgentFeeFromAllContractsNew(activeInward, employmentContracts, true, gross, vat);

		const achievedBonuses = financialUtils.getAchievedBonusesAmount(bonuses, seasons, true, gross, vat, taxes);

		const solidarityMechanism = financialUtils.getSolidarityMechanismFromActiveContracts(
			activeInward,
			agentFees,
			agentBonuses,
			transferBonuses,
			true,
			gross,
			vat
		);

		const valorization = financialUtils.getTotalConditionalElementsAmountForSeasonNew(
			activeInward,
			valorizations,
			seasons.map(({ id }) => id),
			gross,
			vat,
			taxes
		);

		return Number(transferFee + agentFee + achievedBonuses + solidarityMechanism + valorization);
	},

	getAmortizationFromContracts(contracts, assetValue) {
		const renewChain = financialUtils.extractContractChain(contracts);
		const days = moment(last(renewChain)?.dateTo).diff(moment(renewChain[0]?.dateFrom), 'days', true);
		let daysToday = moment().diff(moment(renewChain[0]?.dateFrom), 'days', true);
		if (daysToday > days) daysToday = days;
		const rounded = ((assetValue / days) * daysToday).toFixed(2);
		return Number(rounded);
	},

	getAmortizationLength: employmentContracts => {
		const chain = financialUtils.extractContractChain(employmentContracts);
		if ((chain || []).length === 0) return 0;
		return round(Number(moment(last(chain).dateTo).diff(moment(chain[0].dateFrom), 'years', true)).toFixed(1), 0.5);
	},

	getAmortizationSeason: (contracts, assetValue) => {
		const chain = financialUtils.extractContractChain(contracts);
		if (chain.length > 0) {
			const years = moment(last(chain)?.dateTo).diff(moment(chain[0]?.dateFrom), 'years', true);
			return years !== 0 ? Number((assetValue / years).toFixed(2)) : 0;
		}
		return 0;
	},

	getNetBookValue: (assetValue, amortizationAsset) => {
		return Number((assetValue - amortizationAsset).toFixed(2));
	},

	getGainLoss: (marketValue, netBookValue) => {
		return Number((marketValue - netBookValue).toFixed(2));
	},

	getGainLossPercentage: (gainLoss, netBookValue) => {
		return Math.max(-100, netBookValue > 0.4 ? Math.round((gainLoss / netBookValue) * 100) : 100);
	},
	// endregione

	// REGION: BONUSES
	getAchievedBonusesAmount: (bonuses, seasons, assetFlag, gross, vat, taxes) => {
		const assetBonuses = bonuses.filter(({ asset }) => !assetFlag || (assetFlag && asset));
		const achieved = getAchievedBonus(assetBonuses, seasons);
		const amount = achieved.reduce(
			(sum, bonus) =>
				sum +
				(gross
					? financialUtils.getGross(bonus, bonus.contractType === 'TransferContract' ? vat : taxes)
					: bonus.amount || bonus.total),
			0
		);
		return amount;
	},

	getResidualBonusesAmount: (bonuses, seasons, assetFlag, gross, vat, taxes) => {
		const assetBonuses = bonuses.filter(({ asset }) => !assetFlag || (assetFlag && asset));
		const residual = getResidualBonus(assetBonuses, seasons);
		const amount = residual.reduce(
			(sum, bonus) =>
				sum +
				(gross
					? financialUtils.getGross(bonus, bonus.contractType === 'TransferContract' ? vat : taxes)
					: bonus.amount || bonus.total),
			0
		);
		return amount;
	},

	getTotalInvestmentCostNew: (inward, employmentContracts, basicWages, bonuses, seasons, asset, gross, vat) => {
		const transferFee = financialUtils.getTransferFee(inward, asset, gross, vat);
		const agentFees = financialUtils.getAgentFeeFromAllContractsNew(inward, employmentContracts, asset, gross, vat);
		const wages = (employmentContracts || []).reduce(
			(acc, contract) =>
				acc +
				financialUtils.getTotalElementsAmountForMultipleSeasons(
					contract,
					basicWages,
					seasons.map(({ id }) => String(id)),
					gross,
					vat
				),
			0
		);
		const bonusWon = financialUtils.getAchievedBonusesAmount(bonuses, seasons, asset, gross, vat);
		const benefits = employmentContracts.reduce(
			(acc, contract) => acc + financialUtils.getTotalBenefitsFromContract(contract, gross, vat),
			0
		);

		const totalCost = Number(transferFee + agentFees + wages + bonusWon + benefits);

		return totalCost;
	}
});

function getTotalAmount(collection, gross, vat) {
	const length = collection.length;
	return (collection || []).reduce((acc, { amount, grossAmount, repeat }) => {
		const tot = gross ? financialUtils.getGross({ grossAmount, amount }, vat) : amount;
		return acc + (repeat ? tot : tot / (length || 1));
	}, 0);
}

function getTotalAmountOverMultipleSeasons(collection, years, gross, vat) {
	return (collection || []).reduce((acc, { amount, grossAmount, repeat }) => {
		const tot = gross ? financialUtils.getGross({ grossAmount, amount }, vat) : amount;
		return acc + (repeat ? tot : tot / (years || 1));
	}, 0);
}

function getContractYears(contract) {
	return contract ? Math.round(Math.ceil(moment(contract.dateTo).diff(moment(contract.dateFrom), 'days')) / 365) : null;
}

function getContractMonths(contract) {
	return contract ? Math.ceil(moment(contract.dateTo).diff(moment(contract.dateFrom), 'month')) : null;
}

function sum(a, b) {
	return a + b;
}

function getSolidarityMechanismFromElement(element, asset, gross, vat) {
	let soldarityMechanism = 0;
	if (element?.mechanismSolidarityType && element?.mechanismSolidarityType === 'add') {
		if (asset) {
			soldarityMechanism = element.mechanismSolidarityAsset
				? gross
					? financialUtils.getVirtualGross(element.mechanismSolidarity, vat)
					: element.mechanismSolidarity
				: 0;
		} else {
			soldarityMechanism = gross
				? financialUtils.getVirtualGross(element.mechanismSolidarity, vat)
				: element.mechanismSolidarity;
		}
	}
	return soldarityMechanism;
}

function round(value, step) {
	const inv = 1.0 / (step || 1.0);
	return Math.round(value * inv) / inv;
}

function getAchievedBonus(bonuses, seasons) {
	return bonuses.filter(
		({ reached, progress, achievedDate }) =>
			(reached || progress?.percentage >= 100) && achievedDate && filterBySeasons(achievedDate, seasons)
	);
}

function filterBySeasons(achievedDate, seasons) {
	if (seasons?.length === 0) return true;
	return (seasons || []).some(({ offseason, inseasonEnd }) =>
		moment(achievedDate).isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
	);
}

function getResidualBonus(bonuses, seasons) {
	return bonuses.filter(
		({ reached, progress, achievedDate }) =>
			((!reached && progress?.percentage < 100) || !achievedDate) && filterBySeasons(new Date(), seasons)
	);
}

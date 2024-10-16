module.exports = function (ContractOption) {
	ContractOption.observe('after delete', (ctx, next) => {
		console.log(`[CONTRACT OPTION] Deleted ${ctx.Model.name} matching contract ${ctx.where.contractId}.`);
		next();
	});

	ContractOption.hasInstallmentsValid = function (bonus) {
		return hasAllDates(bonus) && !hasResidual(bonus);
	};
};

function hasAllDates(bonus) {
	const installments = bonus?.installments || [];
	return installments && installments.length > 0 ? installments.every(x => x.date || x.season) : true;
}

function hasResidual(bonus) {
	if (bonus && bonus.installments && bonus.installments.length > 0) {
		const amount = bonus.amount || bonus.grossAmount;
		const installments = bonus.installments
			.map(x => x.value)
			.reduce((accumulator, currentValue) => (accumulator += Number(currentValue)), 0);
		return amount - installments !== 0;
	} else {
		return false;
	}
}

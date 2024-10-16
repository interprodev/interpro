const { isNullOrUndefined } = require('../../server/shared/financial-utils');

// TODO update
module.exports = function (BasicWage) {
	BasicWage.isValid = function (wage) {
		return BasicWage.app.models.ContractOption.hasInstallmentsValid(wage) && !hasMissingFields(wage);
	};
};

function hasMissingFields(wage) {
	if (wage) {
		switch (wage.type) {
			case 'basicWage':
			case 'privateWriting':
			case 'valorization':
				return (
					(isNullOrUndefined(wage.amount) && isNullOrUndefined(wage.grossAmount)) ||
					(wage.season && wage.season.length === 0)
				);
			case 'fee':
			case 'contribution':
			case 'transferFee':
				return isNullOrUndefined(wage.amount) && isNullOrUndefined(wage.grossAmount);
		}
	}
	return false;
}

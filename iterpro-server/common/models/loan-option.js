const { isNullOrUndefined } = require('../../server/shared/financial-utils');

module.exports = function (LoanOption) {
	LoanOption.isValid = function (wage) {
		return LoanOption.app.models.ContractOption.hasInstallmentsValid(wage) && !hasMissingFields(wage);
	};
};

function hasMissingFields(option) {
	return option.option
		? !option.action || (isNullOrUndefined(option.amount) && isNullOrUndefined(option.grossAmount))
		: false;
}

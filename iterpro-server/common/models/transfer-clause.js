const { isNullOrUndefined } = require('../../server/shared/financial-utils');

module.exports = function (TransferClause) {
	TransferClause.isValid = function (wage) {
		return TransferClause.app.models.ContractOption.hasInstallmentsValid(wage) && !hasMissingFields(wage);
	};
};

function hasMissingFields(wage) {
	return isNullOrUndefined(wage?.amount) && isNullOrUndefined(wage?.grossAmount);
}

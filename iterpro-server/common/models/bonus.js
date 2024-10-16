const { isNullOrUndefined } = require('../../server/shared/financial-utils');
const { CustomError } = require('../modules/error');

module.exports = function (Bonus) {
	Bonus.observe('persist', async ctx => {
		try {
			const { isNewInstance, currentInstance, data } = ctx;
			const bonusId = data.id || currentInstance.id;
			if (!isNewInstance) {
				const current = await Bonus.findById(bonusId);
				if (data.paid && !current.paid) {
					await Bonus.app.models.Notification.triggerBonusPaidNotification(data);
				} else if (data.confirmed && !current.confirmed) {
					await Bonus.app.models.Notification.triggerBonusConfirmedNotification(data);
				} else if (data.reached && !current.reached) {
					await Bonus.app.models.Notification.triggerBonusReachedNotification(data);
				}
			}
		} catch (e) {
			throw CustomError(e);
		}
	});

	Bonus.isValid = function (bonus) {
		return Bonus.app.models.ContractOption.hasInstallmentsValid(bonus) && !hasMissingFields(bonus);
	};
};

function hasMissingFields(bonus) {
	if (bonus) {
		switch (bonus.type) {
			case 'appearanceFee':
			case 'performanceFee':
				return (
					(isNullOrUndefined(bonus.amount) && isNullOrUndefined(bonus.grossAmount)) ||
					(bonus.conditions || []).some(x => !x.goal) ||
					(bonus.conditions || []).some(x => x.seasons && x.seasons.length === 0) ||
					(bonus.conditions || []).some(x => x.competitions && x.competitions.length === 0)
				);
			case 'appearance':
				return bonus.conditions || []
					? (isNullOrUndefined(bonus.amount) && isNullOrUndefined(bonus.grossAmount)) ||
							(bonus.conditions || []).some(x => !x.goal) ||
							(bonus.conditions || []).some(x => !x.count) ||
							(bonus.conditions || []).some(x => x.seasons && x.seasons.length === 0) ||
							(bonus.conditions || []).some(x => x.competitions && x.competitions.length === 0)
					: false;
			case 'performance':
			case 'standardTeam':
			case 'signing':
				return bonus.conditions || []
					? (isNullOrUndefined(bonus.amount) && isNullOrUndefined(bonus.grossAmount)) ||
							(bonus.conditions || []).some(x => !x.action) ||
							(bonus.conditions || []).some(x => x.action === 'makes' && !x.goal) ||
							(bonus.conditions || []).some(x => x.action === 'isInCompList' && x.seasons && x.seasons.length === 0) ||
							(bonus.conditions || []).some(
								x => x.action === 'isInCompList' && x.competitions && x.competitions.length === 0
							)
					: false;
			case 'custom':
				return bonus.conditions || []
					? (isNullOrUndefined(bonus.amount) && isNullOrUndefined(bonus.grossAmount)) ||
							(bonus.conditions || []).some(x => !x.custom) ||
							(bonus.conditions || []).some(x => x.seasons && x.seasons.length === 0) ||
							(bonus.conditions || []).some(x => x.competitions && x.competitions.length === 0)
					: false;
		}
	}
	return false;
}

// function checkForCompetitionStringInBonuses(bonus) {
// 	if (!('repeat' in bonus) || !bonus.repeat) bonus.repeat = false;
// 	if ((bonus.conditions || [])) {
// 		(bonus.conditions || []).forEach(condition => {
// 			if (!Array.isArray(condition.competitions)) {
// 				condition.competitions = bonus.competitions && bonus.competitions.length > 0 ? [bonus.competitions] : [];
// 			}
// 		});
// 	}
// 	return bonus;
// }

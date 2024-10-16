const { CustomError } = require('../modules/error');

module.exports = function (Teambonus) {
	Teambonus.observe('persist', async ctx => {
		try {
			const { isNewInstance, currentInstance, data } = ctx;
			const bonusId = data.id || currentInstance.id;
			if (!isNewInstance) {
				const current = await Teambonus.findById(bonusId);
				if (data.paid && !current.paid) {
					await Teambonus.app.models.Notification.triggerTeamBonusNotification(
						data,
						'notification.message.clubBonusPaid'
					);
				} else if (data.confirmed && !current.confirmed) {
					await Teambonus.app.models.Notification.triggerTeamBonusNotification(
						data,
						'notification.message.clubBonusConfirmed'
					);
				} else if (data.reached && !current.reached) {
					await Teambonus.app.models.Notification.triggerTeamBonusNotification(
						data,
						'notification.message.clubBonusMatch'
					);
				}
			}
		} catch (e) {
			throw CustomError(e);
		}
	});

	Teambonus.observe('after save', async ctx => {
		try {
			const { isNewInstance, instance } = ctx;
			/*
				NOTE: why here and not in "persist" hook?

				Because in "persist" the instace has not been yet saved, thus for new instances we don't have the id fields,
				which is needed for generating the notification.

				On the other hand, in the "after save" hook, for already existing instances we don't have the differences between current and updated event,
				which is needed for generating notifications only for the interested players/staffs
			*/
			if (isNewInstance) {
				if (instance.paid) {
					await Teambonus.app.models.Notification.triggerTeamBonusNotification(
						instance,
						'notification.message.clubBonusPaid'
					);
				} else if (instance.confirmed) {
					await Teambonus.app.models.Notification.triggerTeamBonusNotification(
						instance,
						'notification.message.clubBonusConfirmed'
					);
				} else if (instance.reached) {
					await Teambonus.app.models.Notification.triggerTeamBonusNotification(
						instance,
						'notification.message.clubBonusMatch'
					);
				}
			}
		} catch (e) {
			throw CustomError(e);
		}
	});
};

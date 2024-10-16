const { pickBy } = require('lodash');

const permissionsMap = {
	tactics: ['notificationReadiness'],
	planning: ['notificationEventInvitation', 'notificationEventReminder'],
	drills: [],
	attendances: [],
	'video-gallery': ['notificationVideoSharing', 'notificationVideoComment', 'notificationPlayerVideoComment'],
	'session-analysis': [],
	readiness: ['notificationReadiness'],
	assessments: [],
	'test-analysis': [],
	'workload-analysis': ['notificationWorkloadScore', 'notificationEwma'],
	infirmary: ['notificationInjury', 'notificationRehab'],
	examination: [],
	'medical-test-analysis': [],
	'medical-statistics': [],
	maintenance: ['notificationReadiness', 'notificationClinicalRecords'],
	'my-team': [],
	overview: [],
	fitness: [],
	'game-stats': [],
	robustness: [],
	thresholds: [],
	'profile-attributes': [],
	'compare-players': [],
	scouting: [
		'notificationScouting',
		'notificationScoutingPlayers',
		'notificationScoutingMessages',
		'notificationScoutingMessagesPlayers'
	],
	'scouting-games': ['notificationScoutingGameInvitation', 'notificationScoutingGameReminder'],
	'scouting-games-report': ['notificationScoutingGameReport'],
	transfers: ['notificationTransfers'],
	squads: ['notificationDocumentsDays', 'notificationPlayerOperations'],
	legal: [
		'notificationContractExpiration',
		'notificationAppearanceFee',
		'notificationPerformanceFee',
		'notificationAppearanceBonuses',
		'notificationPerformanceBonuses',
		'notificationStandardTeamBonuses',
		'notificationValorization',
		'notificationBonusPaidOverdue',
		'notificationClubBonus',
		'notificationClubBonusPaidOverdue',
		'notificationInstallments'
	],
	'legal-admin': [],
	notarize: [],
	notifyContract: [],
	'finance-overview': [
		'notificationFinancialCapitalGainLoss',
		'notificationFinancialLossesByInjury',
		'notificationFinancialRoi'
	],
	bonus: [
		'notificationAppearanceFee',
		'notificationPerformanceFee',
		'notificationAppearanceBonuses',
		'notificationPerformanceBonuses',
		'notificationStandardTeamBonuses',
		'notificationValorization',
		'notificationBonusPaidOverdue',
		'notificationClubBonus',
		'notificationClubBonusPaidOverdue',
		'notificationInstallments'
	],
	'cash-flow': [],
	'cost-items': ['notificationCostItemExpiration'],
	'import-data': ['notificationImport']
};

const customerTeamSettingsNotification = {
	notificationInjury: false,
	notificationImport: false,
	notificationEventInvitation: false,
	notificationEventReminder: {
		active: false,
		minutes: null,
		formats: null
	},
	notificationVideoSharing: false,
	notificationVideoComment: false,
	notificationWorkloadScore: [],
	notificationReadiness: false,
	notificationRehab: false,
	notificationPlayerVideoComment: false,
	notificationEwma: false,
	notificationClinicalRecords: null,
	notificationContractExpiration: null,
	notificationCostItemExpiration: null,
	notificationDocumentsDays: null,
	notificationPlayerOperations: false,
	notificationAppearanceFee: false,
	notificationAppearanceBonuses: [],
	notificationPerformanceFee: false,
	notificationPerformanceBonuses: [],
	notificationStandardTeamBonuses: false,
	notificationValorization: false,
	notificationBonusPaidOverdue: false,
	notificationClubBonus: false,
	notificationClubBonusPaidOverdue: false,
	notificationInstallments: false,
	notificationFinancialCapitalGainLoss: false,
	notificationFinancialLossesByInjury: [],
	notificationFinancialRoi: []
};

// const customerNotifications = {
// 	notificationTransfers: false,
// 	notificationScouting: false,
// 	notificationScoutingPlayers: null,
// 	notificationScoutingMessages: false,
// 	notificationScoutingMessagesPlayers: null,
// 	notificationScoutingGameReport: false,
// 	notificationScoutingGameInvitation: false,
// 	notificationScoutingGameReminder: {
// 		active: false,
// 		minutes: null,
// 		formats: null
// 	}
// };

module.exports = function (CustomerTeamSettings) {
	CustomerTeamSettings.observe('before save', async ctx => {
		console.log(
			`[CUSTOMER TEAM SETTINGS] ${ctx.isNewInstance ? 'Creating' : 'Updating'} TeamSettings ${
				ctx.isNewInstance ? '' : ctx.currentInstance?.id
			} for customer ${(ctx.currentInstance || ctx.data)?.customerId}`
		);
		if (!ctx.isNewInstance) {
			if (!ctx.data.permissions) {
				return true;
			}

			const { permissions } = ctx.data;

			const entries = Object.entries(permissionsMap);

			const notificationsToDisable = entries
				.filter(([permission]) => !permissions.includes(permission))
				.map(([, notification]) => notification)
				.flat();

			const enabledNotifications = entries
				.filter(([permission]) => permissions.includes(permission))
				.map(([, notification]) => notification)
				.flat();

			// Considering that some notifications are related to multiple modules, I remove from the notifications to disable, those that must remained untouched due to another active module
			const notificationsToDisabledCleaned = notificationsToDisable.filter(
				notification => !enabledNotifications.includes(notification)
			);

			// await updateCustomer(notificationsToDisable, ctx);

			const customerTeamSettingsToDisable = pickBy(customerTeamSettingsNotification, (value, key) =>
				notificationsToDisabledCleaned.includes(key)
			);

			ctx.data = {
				...ctx.data,
				...customerTeamSettingsToDisable
			};
		} else {
			// If it's a new instance, I need to set the current team to the customer
			const customer = await CustomerTeamSettings.app.models.Customer.findById(ctx.instance.customerId);
			// if the customer doesn't have a current team, or the currentTeamId he has is not a team that exists in the CustomerTeamSettings, I set the current team to the new team
			const validTeamSettings = await CustomerTeamSettings.findOne({
				where: { customerId: ctx.instance.customerId, teamId: customer.currentTeamId }
			});
			if (!validTeamSettings) {
				await customer.updateAttributes({ currentTeamId: ctx.instance.teamId });
			}
		}

		return;
	});

	CustomerTeamSettings.observe('before delete', async ctx => {
		try {
			if (Object.keys(ctx.where).includes('customerId')) {
				// the delete is happening because a Customer has been deleted, so all of their TeamSettings are being deleted. No need to perform the update
				return;
			}

			const id = ctx.where.id;
			console.log(
				`[CUSTOMER TEAM SETTINGS] Deleting CustomerTeamSettings with id ${id}. Updating associated entities...`
			);
			// If the team access is deleted, we need to update the customer's current team if it's the same
			const toDeleteTeamSettings = await CustomerTeamSettings.findById(id);
			const customer = await CustomerTeamSettings.app.models.Customer.findById(toDeleteTeamSettings.customerId);
			// If the customer's current team is different from the one being deleted, we don't need to update anything
			if (String(customer.currentTeamId) !== String(toDeleteTeamSettings.teamId)) {
				return;
			}
			// Find the first available team settings for the customer (different from the one being deleted)
			const firstAvailableTeamSettings = await CustomerTeamSettings.findOne({
				where: { customerId: toDeleteTeamSettings.customerId, id: { neq: toDeleteTeamSettings.id } }
			});
			// Update the customer's current team to the first available
			await customer.updateAttributes(
				{ currentTeamId: firstAvailableTeamSettings?.teamId },
				{ where: { _id: ctx.where.customerId, currentTeamId: id } }
			);
		} catch (e) {
			console.error(e);
			throw e;
		}
	});
};

// async function updateCustomer(notificationsToDisabledCleaned, ctx) {
// 	const relatedCustomer = await ctx.currentInstance.customer.get();
// 	const customerSettingsToDisable = pickBy(customerNotifications, (value, key) =>
// 		notificationsToDisabledCleaned.includes(key)
// 	);

// 	relatedCustomer.__data = {
// 		...relatedCustomer.__data,
// 		...customerSettingsToDisable
// 	};

// 	await relatedCustomer.save();

// 	return;
// }

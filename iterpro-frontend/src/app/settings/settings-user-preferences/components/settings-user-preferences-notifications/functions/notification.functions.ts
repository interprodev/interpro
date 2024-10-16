import {
	CustomerPreferenceNotification,
	CustomerPreferenceNotifications,
	CustomerTeamSettingPreferenceNotifications,
	TeamPreferenceNotifications
} from '../models/notification.type';
import { Customer, CustomerTeamSettings, Team } from '@iterpro/shared/data-access/sdk';

export function getTeamSettingsNotifications(
	teamSettings: CustomerPreferenceNotification | CustomerTeamSettings
): CustomerTeamSettingPreferenceNotifications {
	return {
		// customer team settings
		notificationInjury: teamSettings.notificationInjury,
		notificationImport: teamSettings.notificationImport,
		notificationEventInvitation: teamSettings.notificationEventInvitation,
		notificationEventReminder: teamSettings.notificationEventReminder,
		notificationVideoSharing: teamSettings.notificationVideoSharing,
		notificationVideoComment: teamSettings.notificationVideoComment,
		notificationWorkloadScore: teamSettings.notificationWorkloadScore,
		notificationReadiness: teamSettings.notificationReadiness,
		notificationRehab: teamSettings.notificationRehab,
		notificationPlayerVideoComment: teamSettings.notificationPlayerVideoComment,
		notificationClinicalRecords: teamSettings.notificationClinicalRecords,
		notificationContractExpiration: teamSettings.notificationContractExpiration,
		notificationCostItemExpiration: teamSettings.notificationCostItemExpiration,
		notificationDocumentsDays: teamSettings.notificationDocumentsDays,
		notificationPlayerOperations: teamSettings.notificationPlayerOperations,
		notificationAppearanceFee: teamSettings.notificationAppearanceFee,
		notificationPerformanceFee: teamSettings.notificationPerformanceFee,
		notificationAppearanceBonuses: teamSettings.notificationAppearanceBonuses,
		notificationPerformanceBonuses: teamSettings.notificationPerformanceBonuses,
		notificationStandardTeamBonuses: teamSettings.notificationStandardTeamBonuses,
		notificationValorization: teamSettings.notificationValorization,
		notificationBonusPaidOverdue: teamSettings.notificationBonusPaidOverdue,
		notificationClubBonus: teamSettings.notificationClubBonus,
		notificationClubBonusPaidOverdue: teamSettings.notificationClubBonusPaidOverdue,
		notificationInstallments: teamSettings.notificationInstallments,
		notificationFinancialCapitalGainLoss: teamSettings.notificationFinancialCapitalGainLoss,
		notificationFinancialLossesByInjury: teamSettings.notificationFinancialLossesByInjury,
		notificationFinancialRoi: teamSettings.notificationFinancialRoi,
		notificationEwma: teamSettings.notificationEwma
	};
}

export function getTeamNotification(team: CustomerPreferenceNotification | Team): TeamPreferenceNotifications {
	return {
		// team
		botGmt: team.botGmt,
		mobileWellnessNotification: team.mobileWellnessNotification,
		botHourMessage: team.botHourMessage
	};
}

export function getCustomerNotification(
	customer: CustomerPreferenceNotification | Customer
): CustomerPreferenceNotifications {
	return {
		// customer
		notificationScouting: customer.notificationScouting,
		notificationScoutingPlayers: customer.notificationScoutingPlayers,
		notificationScoutingMessages: customer.notificationScoutingMessages,
		notificationScoutingMessagesPlayers: customer.notificationScoutingMessagesPlayers,
		notificationScoutingGameReport: customer.notificationScoutingGameReport,
		notificationScoutingGameInvitation: customer.notificationScoutingGameInvitation,
		notificationScoutingGameReminder: customer.notificationScoutingGameReminder,
		notificationTransfers: customer.notificationTransfers
	};
}

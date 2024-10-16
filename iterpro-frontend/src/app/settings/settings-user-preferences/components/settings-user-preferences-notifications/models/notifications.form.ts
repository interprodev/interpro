import { FormControl, FormGroup } from '@angular/forms';
import { UserPreferencesNotifications } from './notification.type';

const valueDefault = { value: null, disabled: true };
export const userPreferencesNotificationsForm: UserPreferencesNotifications = {
	general: new FormGroup({
		notificationInjury: new FormControl(valueDefault),
		notificationImport: new FormControl(valueDefault),
		notificationEventInvitation: new FormControl(valueDefault),
		notificationEventReminder: new FormGroup({
			active: new FormControl(null),
			minutes: new FormControl(null),
			formats: new FormControl(null)
		}),
		notificationVideoSharing: new FormControl(valueDefault),
		notificationVideoComment: new FormControl(valueDefault)
	}),
	advanced: new FormGroup({
		notificationWorkloadScore: new FormControl(valueDefault),
		notificationReadiness: new FormControl(valueDefault),
		notificationRehab: new FormControl(valueDefault),
		notificationPlayerVideoComment: new FormControl(valueDefault),
		notificationEwma: new FormControl(valueDefault),
		mobileWellnessNotification: new FormControl(valueDefault),
		botGmt: new FormControl(valueDefault),
		botHourMessage: new FormControl(valueDefault)
	}),
	administration: new FormGroup({
		notificationClinicalRecords: new FormControl(valueDefault),
		notificationContractExpiration: new FormControl(valueDefault),
		notificationCostItemExpiration: new FormControl(valueDefault),
		notificationDocumentsDays: new FormControl(valueDefault),
		notificationPlayerOperations: new FormControl(valueDefault),
		notificationTransfers: new FormControl(valueDefault),
		notificationAppearanceFee: new FormControl(valueDefault),
		notificationAppearanceBonuses: new FormControl(valueDefault),
		notificationPerformanceFee: new FormControl(valueDefault),
		notificationPerformanceBonuses: new FormControl(valueDefault),
		notificationStandardTeamBonuses: new FormControl(valueDefault),
		notificationValorization: new FormControl(valueDefault),
		notificationBonusPaidOverdue: new FormControl(valueDefault),
		notificationClubBonus: new FormControl(valueDefault),
		notificationClubBonusPaidOverdue: new FormControl(valueDefault),
		notificationInstallments: new FormControl(valueDefault),
		notificationFinancialCapitalGainLoss: new FormControl(valueDefault),
		notificationFinancialLossesByInjury: new FormControl(valueDefault),
		notificationFinancialRoi: new FormControl(valueDefault)
	}),
	scouting: new FormGroup({
		notificationScouting: new FormControl(valueDefault),
		notificationScoutingPlayers: new FormControl(valueDefault),
		notificationScoutingMessages: new FormControl(valueDefault),
		notificationScoutingMessagesPlayers: new FormControl(valueDefault),
		notificationScoutingGameReport: new FormControl(valueDefault),
		notificationScoutingGameInvitation: new FormControl(valueDefault),
		notificationScoutingGameReminder: new FormGroup({
			active: new FormControl(null),
			time: new FormControl(null),
			minutes: new FormControl(null)
		})
	})
};

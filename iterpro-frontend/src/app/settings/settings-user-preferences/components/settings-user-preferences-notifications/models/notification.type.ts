import { Customer, CustomerTeamSettings, Team } from '@iterpro/shared/data-access/sdk';
import { FormControl, FormGroup } from '@angular/forms';

export type UserPreferencesNotifications = {
	general: FormGroup<{
		// customer team settings
		notificationInjury: FormControl<boolean>;
		notificationImport: FormControl<boolean>;
		notificationEventInvitation: FormControl<boolean>;
		notificationEventReminder: FormGroup<{
			active: FormControl<boolean>;
			minutes: FormControl<number>;
			formats: FormControl<string>;
		}>;
		notificationVideoSharing: FormControl<boolean>;
		notificationVideoComment: FormControl<boolean>;
	}>;
	advanced: FormGroup<{
		// customer team settings
		notificationWorkloadScore: FormControl<string[]>;
		notificationReadiness: FormControl<boolean>;
		notificationRehab: FormControl<boolean>;
		notificationPlayerVideoComment: FormControl<boolean>;
		// team
		mobileWellnessNotification: FormControl<boolean>;
		botGmt: FormControl<number>;
		botHourMessage: FormControl<string>;
		// customer team settings
		notificationEwma: FormControl<boolean>;
	}>;
	administration: FormGroup<{
		// customer team settings
		notificationClinicalRecords: FormControl<number>;
		notificationContractExpiration: FormControl<number>;
		notificationCostItemExpiration: FormControl<number>;
		notificationDocumentsDays: FormControl<number>;
		notificationPlayerOperations: FormControl<boolean>;
		// customer
		notificationTransfers: FormControl<boolean>;
		// customer team settings
		notificationAppearanceFee: FormControl<boolean>;
		notificationAppearanceBonuses: FormControl<string[]>;
		notificationPerformanceFee: FormControl<boolean>;
		notificationPerformanceBonuses: FormControl<string[]>;
		notificationStandardTeamBonuses: FormControl<boolean>;
		notificationValorization: FormControl<boolean>;
		notificationBonusPaidOverdue: FormControl<boolean>;
		notificationClubBonus: FormControl<boolean>;
		notificationClubBonusPaidOverdue: FormControl<boolean>;
		notificationInstallments: FormControl<boolean>;
		notificationFinancialCapitalGainLoss: FormControl<boolean>;
		notificationFinancialLossesByInjury: FormControl<string[]>;
		notificationFinancialRoi: FormControl<string[]>;
	}>;
	scouting: FormGroup<{
		// customer
		notificationScouting: FormControl<boolean>;
		notificationScoutingPlayers: FormControl<string>;
		notificationScoutingMessages: FormControl<boolean>;
		notificationScoutingMessagesPlayers: FormControl<string>;
		notificationScoutingGameReport: FormControl<boolean>;
		notificationScoutingGameInvitation: FormControl<boolean>;
		notificationScoutingGameReminder: FormGroup<{
			active: FormControl<boolean>;
			time: FormControl<string>;
			minutes: FormControl<number>;
		}>;
	}>;
};

export type CustomerTeamSettingPreferenceNotifications = Pick<
	CustomerTeamSettings,
	| 'notificationInjury'
	| 'notificationImport'
	| 'notificationEventInvitation'
	| 'notificationEventReminder'
	| 'notificationVideoSharing'
	| 'notificationVideoComment'
	| 'notificationWorkloadScore'
	| 'notificationReadiness'
	| 'notificationRehab'
	| 'notificationPlayerVideoComment'
	| 'notificationClinicalRecords'
	| 'notificationContractExpiration'
	| 'notificationCostItemExpiration'
	| 'notificationDocumentsDays'
	| 'notificationPlayerOperations'
	| 'notificationAppearanceFee'
	| 'notificationPerformanceFee'
	| 'notificationAppearanceBonuses'
	| 'notificationPerformanceBonuses'
	| 'notificationStandardTeamBonuses'
	| 'notificationValorization'
	| 'notificationBonusPaidOverdue'
	| 'notificationClubBonus'
	| 'notificationClubBonusPaidOverdue'
	| 'notificationInstallments'
	| 'notificationFinancialCapitalGainLoss'
	| 'notificationFinancialLossesByInjury'
	| 'notificationFinancialRoi'
	| 'notificationEwma'
>;
export type TeamPreferenceNotifications = Pick<Team, 'botGmt' | 'botHourMessage' | 'mobileWellnessNotification'>;
export type CustomerPreferenceNotifications = Pick<
	Customer,
	| 'notificationScouting'
	| 'notificationScoutingPlayers'
	| 'notificationScoutingMessages'
	| 'notificationScoutingMessagesPlayers'
	| 'notificationScoutingGameReport'
	| 'notificationScoutingGameInvitation'
	| 'notificationScoutingGameReminder'
	| 'notificationTransfers'
>;
export type CustomerPreferenceNotification = CustomerTeamSettingPreferenceNotifications &
	TeamPreferenceNotifications &
	CustomerPreferenceNotifications;

export type SectionToggle = { groupName?: string; controlName: string }[];

export const generalToggles: SectionToggle = [
	{ controlName: 'notificationInjury' },
	{ controlName: 'notificationImport' },
	{ controlName: 'notificationEventInvitation' },
	{ groupName: 'notificationEventReminder', controlName: 'active' },
	{ controlName: 'notificationVideoSharing' },
	{ controlName: 'notificationVideoComment' }
];

export const advancedToggles: SectionToggle = [
	{ controlName: 'notificationReadiness' },
	{ controlName: 'notificationRehab' },
	{ controlName: 'notificationPlayerVideoComment' },
	{ controlName: 'notificationEwma' },
	{ controlName: 'mobileWellnessNotification' }
];

export const administrationToggles: SectionToggle = [
	{ controlName: 'notificationPlayerOperations' },
	{ controlName: 'notificationTransfers' },
	{ controlName: 'notificationAppearanceFee' },
	{ controlName: 'notificationPerformanceFee' },
	{ controlName: 'notificationStandardTeamBonuses' },
	{ controlName: 'notificationValorization' },
	{ controlName: 'notificationBonusPaidOverdue' },
	{ controlName: 'notificationClubBonus' },
	{ controlName: 'notificationClubBonusPaidOverdue' },
	{ controlName: 'notificationInstallments' },
	{ controlName: 'notificationFinancialCapitalGainLoss' }
];
export const scoutingToggles: SectionToggle = [
	{ controlName: 'notificationScouting' },
	{ controlName: 'notificationScoutingMessages' },
	{ controlName: 'notificationScoutingGameReport' },
	{ controlName: 'notificationScoutingGameInvitation' },
	{ groupName: 'notificationScoutingGameReminder', controlName: 'active' }
];

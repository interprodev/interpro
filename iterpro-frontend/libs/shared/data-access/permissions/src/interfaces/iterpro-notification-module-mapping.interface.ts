import { NotificationModuleMapping } from '../consts/notifications-module-mapping.const';

export const notificationModuleMapping: NotificationModuleMapping = {
	notificationInjury: {
		modules: ['infirmary'],
		onlyOrgType: ['club', 'grassroots'],
		relation: 'or'
	},
	notificationImport: {
		modules: ['import-data'],
		onlyOrgType: ['club', 'grassroots'],
		relation: 'or'
	},
	notificationEventInvitation: {
		modules: ['planning'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationEventReminder: {
		modules: ['planning'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationVideoSharing: {
		modules: ['video-gallery'],
		onlyOrgType: ['club', 'grassroots'],
		relation: 'or'
	},
	notificationVideoComment: {
		modules: ['video-gallery'],
		onlyOrgType: ['club', 'grassroots'],
		relation: 'or'
	},
	notificationWorkloadScore: {
		modules: ['workload-analysis'],
		onlyOrgType: ['club', 'grassroots'],
		relation: 'or'
	},
	notificationReadiness: {
		modules: ['readiness', 'maintenance', 'tactics'],
		onlyOrgType: ['club', 'grassroots'],
		relation: 'or'
	},
	notificationRehab: {
		modules: ['infirmary'],
		onlyOrgType: ['club', 'grassroots'],
		relation: 'or'
	},
	notificationPlayerVideoComment: {
		modules: ['video-gallery'],
		onlyOrgType: ['club', 'grassroots'],
		relation: 'or'
	},
	notificationClinicalRecords: {
		modules: ['maintenance'],
		onlyOrgType: ['club', 'grassroots'],
		relation: 'or'
	},
	notificationContractExpiration: {
		modules: ['legal'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationCostItemExpiration: {
		modules: ['cost-items'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationDocumentsDays: {
		modules: ['squads'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationPlayerOperations: {
		modules: ['squads'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationAppearanceFee: {
		modules: ['legal', 'bonus'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationPerformanceFee: {
		modules: ['legal', 'bonus'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationAppearanceBonuses: {
		modules: ['legal', 'bonus'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationPerformanceBonuses: {
		modules: ['legal', 'bonus'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationStandardTeamBonuses: {
		modules: ['legal', 'bonus'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationValorization: {
		modules: ['legal', 'bonus'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationBonusPaidOverdue: {
		modules: ['legal', 'bonus'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationClubBonus: {
		modules: ['legal', 'bonus'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationClubBonusPaidOverdue: {
		modules: ['legal', 'bonus'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationInstallments: {
		modules: ['legal', 'bonus'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationFinancialCapitalGainLoss: {
		modules: ['finance-overview'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationFinancialLossesByInjury: {
		modules: ['finance-overview'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationFinancialRoi: {
		modules: ['finance-overview'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationEwma: {
		modules: ['workload-analysis'],
		onlyOrgType: ['club', 'grassroots'],
		relation: 'or'
	},
	mobileWellnessNotification: {
		modules: ['assessments'],
		onlyOrgType: ['club', 'grassroots'],
		relation: 'or'
	},
	botGmt: {
		modules: ['assessments'],
		onlyOrgType: ['club', 'grassroots'],
		relation: 'or'
	},
	botHourMessage: {
		modules: ['assessments'],
		onlyOrgType: ['club', 'grassroots'],
		relation: 'or'
	},
	notificationScouting: {
		modules: ['scouting'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationScoutingPlayers: {
		modules: ['scouting'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationScoutingMessages: {
		modules: ['scouting'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationScoutingMessagesPlayers: {
		modules: ['scouting'],
		onlyOrgType: [],
		relation: 'or'
	},
	notificationScoutingGameReport: {
		modules: ['scouting', 'scouting-games-report'],
		onlyOrgType: [],
		relation: 'and'
	},
	notificationScoutingGameInvitation: {
		modules: ['scouting', 'scouting-games'],
		onlyOrgType: [],
		relation: 'and'
	},
	notificationScoutingGameReminder: {
		modules: ['scouting', 'scouting-games'],
		onlyOrgType: [],
		relation: 'and'
	},
	notificationTransfers: {
		modules: ['transfers'],
		onlyOrgType: [],
		relation: 'or'
	}
};

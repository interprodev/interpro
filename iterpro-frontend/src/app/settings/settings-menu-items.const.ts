import { SettingSideMenu } from './models/settings-side-menu.type';

export const groupedSettingsMenuItems: SettingSideMenu[] = [
	/** User Preferences */
	{
		label: 'settings.userPreferences',
		routerLink: ['user-preferences'],
		teamModules: [],
		onlyAdmin: false,
		onlyWithPermissions: [],
		onlyOrgType: [],
		items: [
			{
				label: 'profile.personal',
				routerLink: ['user-preferences/general'],
				teamModules: [],
				onlyAdmin: false,
				onlyWithPermissions: [],
				onlyOrgType: []
			},
			{
				label: 'notifications',
				routerLink: ['user-preferences/notifications'],
				teamModules: [],
				onlyAdmin: false,
				onlyWithPermissions: [],
				onlyOrgType: []
			},
			{
				label: 'settings.userPreferences.security',
				routerLink: ['user-preferences/security'],
				teamModules: [],
				onlyAdmin: false,
				onlyWithPermissions: [],
				onlyOrgType: []
			},
			{
				label: 'settings.accountManagement.users&Permissions',
				routerLink: ['user-preferences/users-permissions'],
				teamModules: [],
				onlyAdmin: true,
				onlyWithPermissions: [],
				onlyOrgType: []
			}
		]
	},
	/*	/!** Account Management *!/
	{
		label: 'settings.accountManagement',
		routerLink: ['account-management'],
		onlyAdmin: true,
		onlyWithPermissions: [],
		items: [
			{
				label: 'settings.accountManagement.users&Permissions',
				routerLink: ['account-management/users-permissions'],
				onlyAdmin: true,
				onlyWithPermissions: [],
			},
			/!*	{
					label: 'Open Api',
					routerLink: ['account-management/open-api']
				},*!/
		]
	},*/
	/** Club Preferences */
	{
		label: 'settings.clubPreferences',
		routerLink: ['club-preferences'],
		onlyAdmin: true,
		teamModules: [],
		onlyWithPermissions: [],
		onlyOrgType: [],
		items: [
			{
				label: 'settings.general',
				routerLink: ['club-preferences/general'],
				teamModules: [],
				onlyAdmin: true,
				onlyWithPermissions: [],
				onlyOrgType: []
			},
			{
				label: 'club.settings.seasons',
				routerLink: ['club-preferences/seasons'],
				teamModules: [],
				onlyAdmin: true,
				onlyWithPermissions: [],
				onlyOrgType: []
			},
			{
				label: 'settings.scouting',
				routerLink: ['club-preferences/scouting'],
				teamModules: ['scouting'],
				onlyAdmin: true,
				onlyWithPermissions: [],
				onlyOrgType: []
			},
			{
				label: 'admin.dashboard.finance',
				routerLink: ['club-preferences/finance'],
				teamModules: [],
				onlyAdmin: true,
				onlyWithPermissions: [],
				onlyOrgType: []
			}
		]
	},
	/** Teams */
	{
		label: 'Teams',
		routerLink: ['teams'],
		onlyAdmin: false,
		onlyWithPermissions: [],
		onlyOrgType: [],
		teamModules: [],
		items: [
			{
				label: 'settings.general',
				routerLink: ['teams/general'],
				teamModules: [],
				onlyAdmin: false,
				onlyWithPermissions: [],
				onlyOrgType: []
			},
			{
				label: 'club.settings.seasons',
				routerLink: ['teams/seasons'],
				teamModules: [],
				onlyAdmin: true,
				onlyWithPermissions: [],
				onlyOrgType: ['club', 'grassroots']
			},
			{
				label: 'preferences.metrics',
				routerLink: ['teams/metrics'],
				teamModules: [],
				onlyAdmin: false,
				onlyWithPermissions: [],
				onlyOrgType: ['club', 'grassroots']
			},
			{
				label: 'settings.teams.playerGroups',
				routerLink: ['teams/player-groups'],
				teamModules: [],
				onlyAdmin: false,
				onlyWithPermissions: [],
				onlyOrgType: []
			},
			{
				label: 'settings.teams.integrations',
				routerLink: ['teams/integrations'],
				teamModules: [],
				onlyAdmin: false,
				onlyWithPermissions: [],
				onlyOrgType: ['club', 'grassroots']
			},
			{
				label: 'preferences.goScore',
				routerLink: ['teams/go-score'],
				teamModules: [],
				onlyAdmin: false,
				onlyWithPermissions: ['readiness'],
				onlyOrgType: ['club', 'grassroots']
			}
			/*	{
					label: 'Player App',
					routerLink: ['teams/player-app']
				},*/
		]
	},
	/** Thresholds */
	{
		label: 'profile.tabs.thresholds',
		routerLink: ['thresholds'],
		onlyAdmin: false,
		onlyWithPermissions: [],
		teamModules: [],
		onlyOrgType: ['club', 'grassroots'],
		items: [
			/*	{
		label: 'Individual',
		routerLink: ['thresholds/individual']
	},*/
			{
				label: 'Team',
				routerLink: ['thresholds/team'],
				onlyAdmin: false,
				teamModules: [],
				onlyWithPermissions: [],
				onlyOrgType: ['club', 'grassroots']
			}
		]
	}
];

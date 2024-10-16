import { MegaMenuItem } from 'primeng/api';

export const items: MegaMenuItem[] = [
	{
		id: 'dashboards',
		label: 'dashboards',
		routerLink: '/dashboards',
		items: [
			[
				{
					id: 'standings',
					label: 'home.dashboard',
					routerLink: '/dashboards/standings'
				},
				{
					id: 'custom-dashboard',
					label: 'bonus.type.custom',
					routerLink: '/dashboards/custom'
				}
			]
		]
	},
	{
		id: 'manager',
		label: 'home.manager',
		routerLink: '/manager',
		items: [
			[
				{
					id: 'tactics',
					label: 'navigator.tactics',
					routerLink: '/manager/tactics'
				},
				{
					id: 'video-gallery',
					label: 'navigator.videogallery',
					routerLink: '/manager/video-gallery'
				},
				{
					id: 'drills',
					label: 'navigator.drills',
					routerLink: '/manager/drills'
				},
				{
					id: 'planning',
					label: 'navigator.planning',
					routerLink: '/manager/planning'
				},
				{
					id: 'attendances',
					label: 'navigator.attendances',
					routerLink: '/manager/attendances'
				}
			]
		]
	},
	{
		id: 'performance',
		label: 'home.performance',
		routerLink: '/performance',
		items: [
			[
				{
					id: 'session-analysis',
					label: 'navigator.sessionAnalysis',
					routerLink: '/performance/session-analysis'
				},
				{
					id: 'workload-analysis',
					label: 'navigator.workloadAnalysis',
					routerLink: '/performance/workload-analysis'
				},
				{
					id: 'readiness',
					label: 'navigator.readiness',
					routerLink: '/performance/readiness'
				},
				{
					id: 'assessments',
					label: 'navigator.assessments',
					routerLink: '/performance/assessments'
				},
				{
					id: 'test-analysis',
					label: 'navigator.testAnalysis',
					routerLink: '/performance/test-analysis'
				}
			]
		]
	},
	{
		id: 'medical',
		label: 'home.medical',
		routerLink: '/medical',
		items: [
			[
				{
					id: 'maintenance',
					label: 'navigator.medicalRecords2',
					routerLink: '/medical/maintenance'
				},
				{
					id: 'infirmary',
					label: 'navigator.infirmary',
					routerLink: '/medical/infirmary'
				},
				{
					id: 'medical-statistics',
					label: 'navigator.medicalStatistics',
					routerLink: '/medical/medical-statistics'
				},
				{
					id: 'examination',
					label: 'navigator.examination',
					routerLink: '/medical/examination'
				},
				{
					id: 'medical-test-analysis',
					label: 'navigator.testAnalysis',
					routerLink: '/medical/medical-test-analysis'
				}
			]
		]
	},
	{
		id: 'players',
		label: 'home.players',
		routerLink: '/players',
		items: [
			[
				{
					id: 'my-team',
					label: 'navigator.myTeam',
					routerLink: '/players/my-team'
				},
				{
					id: 'compare-players',
					label: 'navigator.comparePlayers',
					routerLink: '/players/compare-players'
				},
				{
					id: 'scouting',
					label: 'navigator.scouting',
					routerLink: '/players/scouting'
				},
				{
					id: 'transfers',
					label: 'navigator.transfers',
					routerLink: '/players/transfers'
				}
			]
		]
	},
	{
		id: 'administration',
		label: 'home.admin',
		routerLink: '/administration',
		items: [
			[
				{
					id: 'squads',
					label: 'navigator.squads',
					routerLink: '/administration/squads'
				},
				{
					id: 'finance-overview',
					label: 'navigator.overview',
					routerLink: '/administration/finance-overview'
				},
				{
					id: 'bonus',
					label: 'navigator.bonusTracking',
					routerLink: '/administration/bonus'
				},
				{
					id: 'cash-flow',
					label: 'navigator.cashflow',
					routerLink: '/administration/cash-flow'
				},
				{
					id: 'cost-items',
					label: 'navigator.transactions',
					routerLink: '/administration/cost-items'
				}
			]
		]
	}
];

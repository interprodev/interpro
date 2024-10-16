import { IterproRouteSettings } from '@iterpro/shared/data-access/permissions';
import { IterproRoute } from '../interfaces/iterpro-routes.interface';

export const ROUTE_SETTINGS: { [key in IterproRoute]: IterproRouteSettings } = {
	/** Dashboard */
	'/dashboards': {
		teamModules: ['dashboards'],
		onlyAdmin: false,
		userPermission: []
	},
	'/dashboards/standings': {
		teamModules: ['dashboards', 'standings'],
		onlyAdmin: false,
		userPermission: []
	},
/*	'/dashboards/admin': {
		teamModules: ['dashboards', 'admin'],
		onlyAdmin: true,
		userPermission: []
	},*/
	/** Manager */
	'/manager': {
		teamModules: ['manager'],
		onlyAdmin: false,
		userPermission: ['manager']
	},
	'/manager/tactics': {
		teamModules: ['manager', 'tactics'],
		onlyAdmin: false,
		userPermission: ['tactics']
	},
	'/manager/video-gallery': {
		teamModules: ['manager', 'video-gallery'],
		onlyAdmin: false,
		userPermission: ['manager']
	},
	'/manager/drills': {
		teamModules: ['manager', 'drills'],
		onlyAdmin: false,
		userPermission: ['drills']
	},
	'/manager/planning': {
		teamModules: ['manager', 'planning'],
		onlyAdmin: false,
		userPermission: ['planning']
	},
	'/manager/attendances': {
		teamModules: ['manager', 'attendances'],
		onlyAdmin: false,
		userPermission: ['attendances']
	},
	/** Performance */
	'/performance': {
		teamModules: ['performance'],
		onlyAdmin: false,
		userPermission: ['performance']
	},
	'/performance/session-analysis': {
		teamModules: ['performance', 'session-analysis'],
		onlyAdmin: false,
		userPermission: ['session-analysis']
	},
	'/performance/workload-analysis': {
		teamModules: ['performance', 'workload-analysis'],
		onlyAdmin: false,
		userPermission: ['workload-analysis']
	},
	'/performance/readiness': {
		teamModules: ['performance', 'readiness'],
		onlyAdmin: false,
		userPermission: ['readiness']
	},
	'/performance/assessments': {
		teamModules: ['performance', 'assessments'],
		onlyAdmin: false,
		userPermission: ['assessments']
	},
	'/performance/test-analysis': {
		teamModules: ['performance', 'test-analysis'],
		onlyAdmin: false,
		userPermission: ['test-analysis']
	},
	/** Medical */
	'/medical': {
		teamModules: ['medical'],
		onlyAdmin: false,
		userPermission: ['medical']
	},
	'/medical/maintenance': {
		teamModules: ['medical', 'maintenance'],
		onlyAdmin: false,
		userPermission: ['maintenance']
	},
	'/medical/infirmary': {
		teamModules: ['medical', 'infirmary'],
		onlyAdmin: false,
		userPermission: ['infirmary']
	},
	'/medical/medical-statistics': {
		teamModules: ['medical', 'medical-statistics'],
		onlyAdmin: false,
		userPermission: ['medical-statistics']
	},
	'/medical/examination': {
		teamModules: ['medical', 'examination'],
		onlyAdmin: false,
		userPermission: ['examination']
	},
	'/medical/medical-test-analysis': {
		teamModules: ['medical', 'medical-test-analysis'],
		onlyAdmin: false,
		userPermission: ['medical-test-analysis']
	},
	/** Players */
	'/players': {
		teamModules: ['players'],
		onlyAdmin: false,
		userPermission: ['players']
	},
	'/players/my-team': {
		teamModules: ['players', 'my-team'],
		onlyAdmin: false,
		userPermission: ['my-team']
	},
	'/players/compare-players': {
		teamModules: ['players', 'compare-players'],
		onlyAdmin: false,
		userPermission: ['compare-players']
	},
	'/players/scouting': {
		teamModules: ['players', 'scouting'],
		onlyAdmin: false,
		userPermission: ['scouting']
	},
	'/players/transfers': {
		teamModules: ['players', 'transfers'],
		onlyAdmin: false,
		userPermission: ['transfers']
	},
	/** Administration */
	'/administration': {
		teamModules: [],
		onlyAdmin: false,
		userPermission: ['administration']
	},
	'/administration/squads': {
		teamModules: [],
		onlyAdmin: false,
		userPermission: ['squads']
	},
	'/administration/finance-overview': {
		teamModules: ['finance-overview'],
		onlyAdmin: false,
		userPermission: ['finance-overview']
	},
	'/administration/bonus': {
		teamModules: ['bonus'],
		onlyAdmin: false,
		userPermission: []
	},
	'/administration/cash-flow': {
		teamModules: ['cash-flow'],
		onlyAdmin: false,
		userPermission: []
	},
	'/administration/cost-items': {
		teamModules: ['cost-items'],
		onlyAdmin: false,
		userPermission: ['cost-items']
	},
	/** File Repository */
	'/repository': {
		teamModules: [],
		onlyAdmin: true,
		userPermission: []
	},
	/** Import Data */
	'/import-data': {
		teamModules: ['import-data'],
		onlyAdmin: false,
		userPermission: ['import-data']
	},
	/** Chat */
	'/inbox': {
		teamModules: [],
		onlyAdmin: false,
		userPermission: []
	},
	/** Notifications */
	'/notifications': {
		teamModules: [],
		onlyAdmin: false,
		userPermission: []
	},
	/** Settings */
	'/settings': {
		teamModules: [],
		onlyAdmin: false,
		userPermission: []
	},
	/** Settings */
	'/settings/user-preferences/users-permissions': {
		teamModules: [],
		onlyAdmin: true,
		userPermission: []
	},
	'/settings/club-preferences': {
		teamModules: [],
		onlyAdmin: true,
		userPermission: []
	},
	'/settings/club-preferences/general': {
		teamModules: [],
		onlyAdmin: true,
		userPermission: []
	},
	'/settings/club-preferences/seasons': {
		teamModules: [],
		onlyAdmin: true,
		userPermission: []
	},
	'/settings/club-preferences/scouting': {
		teamModules: ['scouting'],
		onlyAdmin: true,
		userPermission: ['scouting']
	},
	'/settings/club-preferences/finance': {
		teamModules: [],
		onlyAdmin: true,
		userPermission: []
	},
	'/settings/teams/seasons': {
		teamModules: [],
		onlyAdmin: true,
		userPermission: []
	},
	'/settings/teams/go-score': {
		teamModules: ['readiness'],
		onlyAdmin: false,
		userPermission: ['readiness']
	},
}

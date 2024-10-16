import { IterproTeamModule } from './iterpro-team-modules.interface';
import { IterproUserPermission } from './iterpro-user-permissions.interface';

export interface AuthResponse {
	response: boolean;
	error: PermissionError;
}

export type IterproRouteSettings = {
	teamModules: IterproTeamModule[];
	onlyAdmin: boolean;
	userPermission: IterproUserPermission[];
}

export type PermissionError =
	| 'noCurrentTeam'
	| 'noThirdPartyTactical'
	| 'noPermissions'
	| 'featureNotAvailable'
	| 'generic'
	| null;

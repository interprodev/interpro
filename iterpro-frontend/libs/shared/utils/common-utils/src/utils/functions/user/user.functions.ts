import { CustomerTeamSettings } from '@iterpro/shared/data-access/sdk';


export function getTeamSettings(teamSettings: CustomerTeamSettings[], teamId: string): CustomerTeamSettings | undefined {
	return (teamSettings || []).find(({ teamId: id }) => id === teamId);
}
export function userHasPermission(teamSettings: CustomerTeamSettings, path: string): boolean {
	return teamSettings?.permissions.includes(path);
}
export function getActiveTeams(teamSettings: CustomerTeamSettings[]): string[] {
	return teamSettings.map(({ teamId }) => teamId);
}

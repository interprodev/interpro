import { DeviceType, ProviderType } from '@iterpro/shared/data-access/sdk';


export function isGpsMappingDisabled(teamDevice: DeviceType): boolean {
	return teamDevice === 'Gpexe' || teamDevice === 'StatsportAPI' || teamDevice === 'Sonra' || teamDevice === 'Catapult' || teamDevice === 'Wimu';
}
export function isSecuritySettingDisabled(teamDevice: DeviceType): boolean {
	return teamDevice !== 'Gpexe' && teamDevice !== 'StatsportAPI' && teamDevice !== 'Catapult' && teamDevice !== 'Wimu'
}
export function isGameTeamMappingDisabled(providerTeam: ProviderType): boolean {
	return providerTeam === 'Wyscout' || providerTeam === 'InStat';
}

export function isGamePlayerMappingDisabled(providerPlayer: ProviderType): boolean {
	return providerPlayer === 'Wyscout' || providerPlayer === 'InStat';
}

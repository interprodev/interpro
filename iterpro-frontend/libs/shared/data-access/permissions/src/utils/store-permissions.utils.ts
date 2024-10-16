import { Team } from '@iterpro/shared/data-access/sdk';
import { ThirdPartiesIntegrationCheckService } from '@iterpro/shared/utils/common-utils';

export const parseModuleUrl = (rawModule: string) => rawModule.split('?')[0].split(';')[0];

export const isStandingModule = (modules: string[]) => {
	return modules.length > 0 && modules.includes('standings');
};

export const getStandingModuleError = (team: Team, service: ThirdPartiesIntegrationCheckService) => {
	return !team ? 'noCurrentTeam' : !service.hasAnyProviderTacticalIntegration(team) ? 'noThirdPartyTactical' : null;
};

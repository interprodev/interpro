import { Injectable } from '@angular/core';
import { Team } from '@iterpro/shared/data-access/sdk';

@Injectable({
	providedIn: 'root'
})
export class ThirdPartiesIntegrationCheckService {
	public hasAnyProviderGpsIntegration(team: Team): boolean {
		return (
			this.hasGpexeIntegration(team) ||
			this.hasStatsportApiIntegration(team) ||
			this.hasSonraApiIntegration(team) ||
			this.hasCatapultApiIntegration(team) ||
			this.hasFieldwizApiIntegration(team) ||
			this.hasWimuApiIntegration(team)
		);
	}

	public hasAnyProviderTacticalIntegration(team: Team): boolean {
		return this.hasWyscoutSyncIntegration(team) || this.hasInStatSyncIntegration(team);
	}

	public hasGpexeIntegration(team: Team): boolean {
		return team.thirdPartyCredentials?.gpexeUsername && team.thirdPartyCredentials?.gpexePassword;
	}

	public hasStatsportApiIntegration(team: Team): boolean {
		return team.thirdPartyCredentials?.statsportAccessKey && team.thirdPartyCredentials?.statsportSecretKey;
	}

	public hasSonraApiIntegration(team: Team): boolean {
		return team.thirdPartyCredentials?.sonraThirdPartyId;
	}

	public hasCatapultApiIntegration(team: Team): boolean {
		return team.thirdPartyCredentials?.catapultBaseUrl && team.thirdPartyCredentials?.catapultLongLivedToken;
	}

	public hasFieldwizApiIntegration(team: Team): boolean {
		return team.thirdPartyCredentials?.fieldwizClientId && team.thirdPartyCredentials?.fieldwizClientSecret;
	}

	public hasWimuApiIntegration(team: Team): boolean {
		return team.thirdPartyCredentials?.wimuUsername && team.thirdPartyCredentials?.wimuPassword;
	}

	public hasWyscoutIntegration(team: Team): boolean {
		return !!team.wyscoutId;
	}

	public hasWyscoutSyncIntegration(team: Team): boolean {
		return Boolean(team.wyscoutId) && team.providerTeam === 'Wyscout' && team.providerPlayer === 'Wyscout';
	}
	public hasInStatSyncIntegration(team: Team): boolean {
		return Boolean(team.instatId) && team.providerTeam === 'InStat' && team.providerPlayer === 'InStat';
	}
}

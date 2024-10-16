import { Pipe, PipeTransform } from '@angular/core';
import { TeamIntegration } from '../../team-integrations-third-parties/models/integrations-third-parties.type';

@Pipe({
	standalone: true,
	name: 'teamHasProvider'
})
export class TeamHasProviderPipe implements PipeTransform {

	transform(team: TeamIntegration): boolean {
		return team && (this.hasGPSProvider(team) || this.hasTacticalProvider(team));
	}

	private hasGPSProvider(team: TeamIntegration): boolean {
		return team.thirdPartyCredentials && this.hasGPSProviderID(team);
	}

	private hasGPSProviderID(team: TeamIntegration): boolean {
		return (
			team.gpexeId ||
			team.statsportId ||
			team.sonraId ||
			team.fieldwizId ||
			team.wimuId ||
			team.device === 'Catapult'
		);
	}

	private hasTacticalProvider(team: TeamIntegration): boolean {
		return !!team.wyscoutId || !!team.instatId;
	}
}

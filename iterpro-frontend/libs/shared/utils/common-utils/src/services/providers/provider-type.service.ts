import { Injectable } from '@angular/core';
import { DeviceType, Player, ProviderType, Team } from '@iterpro/shared/data-access/sdk';

@Injectable({
	providedIn: 'root'
})
export class ProviderTypeService {
	getGPSProviderType(team: Team): DeviceType {
		const { device } = team;
		return device as DeviceType;
	}

	getProviderType(team: Team): ProviderType {
		const { providerTeam, providerPlayer } = team;
		return (providerTeam || providerPlayer) as ProviderType;
	}

	getProviderTypeUsed(item: Team | Player | any): ProviderType {
		if (!!item.wyscoutId || !!item.wyId) {
			return 'Wyscout';
		}
		if (!!item.instatId || !!item.instId) {
			return 'InStat';
		}
		return 'Dynamic';
	}
}

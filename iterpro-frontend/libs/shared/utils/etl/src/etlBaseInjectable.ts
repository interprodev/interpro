import { Injector } from '@angular/core';
import { Team, ThirdPartyEtlPlayerService, ThirdPartyEtlTeamService } from '@iterpro/shared/data-access/sdk';
import { Subject, of } from 'rxjs';
import { EtlTeamObserverService } from './EtlTeamObserverService';
import { EtlDateDurationService } from './etlDateDurationService';
import { BaseEtlGpsService } from './gps/baseEtlGpsService';
import { EtlGpsCatapultAPIService } from './gps/etlGpsCatapultAPIService';
import { EtlGpsDynamicService } from './gps/etlGpsDynamicService';
import { EtlGpsFieldwizAPIService } from './gps/etlGpsFieldwizAPIService';
import { EtlGpsGpexeService } from './gps/etlGpsGpexeService';
import { EtlGpsSonraAPIService } from './gps/etlGpsSonraAPIService';
import { EtlGpsStatSportsAPIService } from './gps/etlGpsStatSportsAPIService';
import { EtlGpsWimuAPIService } from './gps/etlGpsWimuAPIService';
import { EtlPlayerDynamicService } from './player/etlPlayerDynamicService';
import { EtlPlayerInStatService } from './player/etlPlayerInStatService';
import { EtlPlayerWyscoutService } from './player/etlPlayerWyscoutService';
import { EtlTeamDynamicService } from './team/etlTeamDynamicService';
import { EtlTeamInStatService } from './team/etlTeamInStatService';
import { EtlTeamWyscoutService } from './team/etlTeamWyscoutService';

export class EtlBaseInjectable {
	etlGpsService!: BaseEtlGpsService;
	etlTeamService!: ThirdPartyEtlTeamService;
	etlPlayerService!: ThirdPartyEtlPlayerService;

	private ready$: Subject<void> = new Subject<void>();
	private isProviderInitialized = false;

	constructor(inj: Injector) {
		const teamObserverService = inj.get(EtlTeamObserverService);

		teamObserverService.listenToTeam().subscribe({
			next: team => {
				const etlDateService = inj.get(EtlDateDurationService);
				this.initProviderServices(team, etlDateService, team.club.b2cScouting);
				this.isProviderInitialized = true;
				this.ready$.next();
			}
		});
	}

	protected waitInitializationProviders() {
		return this.isProviderInitialized ? of(undefined) : this.ready$;
	}

	private initProviderServices(team: Team, etlDateService: EtlDateDurationService, isb2C = false) {
		switch (team.device) {
			case 'StatsportAPI':
				this.etlGpsService = new EtlGpsStatSportsAPIService(etlDateService, team);
				break;
			case 'Sonra':
				this.etlGpsService = new EtlGpsSonraAPIService(etlDateService, team);
				break;
			case 'Gpexe':
				this.etlGpsService = new EtlGpsGpexeService(etlDateService, team);
				break;
			case 'Catapult':
				this.etlGpsService = new EtlGpsCatapultAPIService(etlDateService, team);
				break;
			case 'Fieldwiz':
				this.etlGpsService = new EtlGpsFieldwizAPIService(etlDateService, team);
				break;
			case 'Wimu':
				this.etlGpsService = new EtlGpsWimuAPIService(etlDateService, team);
				break;
			case 'Dynamic':
				this.etlGpsService = new EtlGpsDynamicService(etlDateService, team);
				break;
			default:
				this.etlGpsService = new EtlGpsDynamicService(etlDateService, team);
				break;
		}

		const providerTeam = isb2C ? 'Wyscout' : team.providerTeam;

		switch (providerTeam) {
			case 'Dynamic':
				this.etlTeamService = new EtlTeamDynamicService(etlDateService, team);
				break;
			case 'Wyscout':
				this.etlTeamService = new EtlTeamWyscoutService();
				break;
			case 'InStat':
				this.etlTeamService = new EtlTeamInStatService();
				break;
			default:
				this.etlTeamService = new EtlTeamDynamicService(etlDateService, team);
				break;
		}

		const providerPlayer = isb2C ? 'Wyscout' : team.providerPlayer;

		switch (providerPlayer) {
			case 'Dynamic':
				this.etlPlayerService = new EtlPlayerDynamicService(etlDateService, team);
				break;
			case 'Wyscout':
				this.etlPlayerService = new EtlPlayerWyscoutService();
				break;
			case 'InStat':
				this.etlPlayerService = new EtlPlayerInStatService();
				break;
			default:
				this.etlPlayerService = new EtlPlayerDynamicService(etlDateService, team);
				break;
		}
	}
}

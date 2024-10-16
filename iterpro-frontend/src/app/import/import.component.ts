import { Component, OnDestroy, OnInit } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Team } from '@iterpro/shared/data-access/sdk';
import { ThirdPartiesIntegrationCheckService } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { ImportProvider } from '../+state/import-store/interfaces/import-store.interfaces';

export enum ImportDataViewState {
	Dashboard = 0,
	Gps = 1,
	Team = 2,
	Player = 3,
	GPexe = 4,
	Statsport = 5,
	Sonra = 6,
	Catapult = 7,
	Fieldwiz = 8,
	Wimu = 9
}

@UntilDestroy()
@Component({
	templateUrl: './import.component.html',
	styleUrls: ['./import.common.css']
})
export class ImportComponent implements OnInit, OnDestroy {
	currentTeam: Team;
	selectedViewState: ImportDataViewState = ImportDataViewState.Dashboard;
	inputs: SelectItem[] = [];
	selectedInput: SelectItem;
	provider: ImportProvider = 'gps';

	constructor(
		private thirdPartyService: ThirdPartiesIntegrationCheckService,
		private currentTeamServices: CurrentTeamService,
		private translate: TranslateService
	) {}

	ngOnDestroy() {}

	ngOnInit() {
		this.selectedViewState = ImportDataViewState.Dashboard;
		this.currentTeam = this.currentTeamServices.getCurrentTeam();
		const hasGPexe = this.thirdPartyService.hasGpexeIntegration(this.currentTeam);
		const hasStatsport = this.thirdPartyService.hasStatsportApiIntegration(this.currentTeam);
		const hasSonra = this.thirdPartyService.hasSonraApiIntegration(this.currentTeam);
		const hasCatapult = this.thirdPartyService.hasCatapultApiIntegration(this.currentTeam);
		const hasFieldwiz = this.thirdPartyService.hasFieldwizApiIntegration(this.currentTeam);
		const hasWimu = this.thirdPartyService.hasWimuApiIntegration(this.currentTeam);

		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(untilDestroyed(this))
			.subscribe(val => {
				this.inputs = [];
				let gpsInput = {
					label: this.translate.instant('datasources.gps'),
					value: 'GPS'
				};
				if (hasGPexe) {
					gpsInput = { label: 'GPEXE', value: 'GPexe' };
				} else if (hasStatsport) {
					gpsInput = { label: 'Statsport', value: 'Statsport' };
				} else if (hasSonra) {
					gpsInput = { label: 'Statsport Sonra', value: 'Sonra' };
				} else if (hasCatapult) {
					gpsInput = { label: 'Catapult', value: 'Catapult' };
				} else if (hasFieldwiz) {
					gpsInput = { label: 'Fieldwiz', value: 'Fieldwiz' };
				} else if (hasWimu) {
					gpsInput = { label: 'Wimu', value: 'Wimu' };
				}
				this.inputs.push(gpsInput);

				if (!['Wyscout', 'InStat'].includes(this.currentTeam.providerPlayer))
					this.inputs.push({
						label: this.translate.instant('datasources.playerStats'),
						value: 'Player Stats'
					});
				if (!['Wyscout', 'InStat'].includes(this.currentTeam.providerTeam))
					this.inputs.push({
						label: this.translate.instant('datasources.teamStats'),
						value: 'Team Stats'
					});
			});
	}

	onClickDashboard() {
		this.selectedInput = null;
		this.selectedViewState = ImportDataViewState.Dashboard;
	}

	selectInput({ value }: { value: string }) {
		switch (value) {
			case 'GPS': {
				this.onClickGps();
				break;
			}
			case 'GPexe': {
				this.onClickGPexe();
				break;
			}
			case 'Statsport': {
				this.onClickStatsport();
				break;
			}
			case 'Sonra': {
				this.onClickSonra();
				break;
			}
			case 'Catapult': {
				this.onClickCatapult();
				break;
			}
			case 'Fieldwiz': {
				this.onClickFieldwiz();
				break;
			}
			case 'Wimu': {
				this.onClickWimu();
				break;
			}
			case 'Team Stats': {
				this.onClickTeam();
				break;
			}
			case 'Player Stats': {
				this.onClickPlayer();
				break;
			}
		}
	}

	private onClickGps() {
		this.provider = 'gps';
		this.selectedViewState = ImportDataViewState.Gps;
	}

	private onClickGPexe() {
		this.provider = 'gpexe';
		this.selectedViewState = ImportDataViewState.GPexe;
	}

	private onClickStatsport() {
		this.provider = 'statsport';
		this.selectedViewState = ImportDataViewState.Statsport;
	}

	private onClickSonra() {
		this.provider = 'sonra';
		this.selectedViewState = ImportDataViewState.Sonra;
	}

	private onClickCatapult() {
		this.provider = 'catapult';
		this.selectedViewState = ImportDataViewState.Catapult;
	}

	private onClickFieldwiz() {
		this.provider = 'fieldwiz';
		this.selectedViewState = ImportDataViewState.Fieldwiz;
	}

	private onClickWimu() {
		this.provider = 'wimu';
		this.selectedViewState = ImportDataViewState.Wimu;
	}

	private onClickTeam() {
		this.provider = 'teamStats';
		this.selectedViewState = ImportDataViewState.Team;
	}

	private onClickPlayer() {
		this.provider = 'playersStats';
		this.selectedViewState = ImportDataViewState.Player;
	}
}

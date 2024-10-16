import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
	BlockUiInterceptorService,
	ErrorService,
	ProviderIntegrationService,
	ProviderService,
} from '@iterpro/shared/utils/common-utils';
import {
	DeviceType, FieldwizApi,
	ProviderType,
	Team,
	ThirdpartyApi
} from '@iterpro/shared/data-access/sdk';
import { filter, first, map } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SettingsStore } from '../../../../../../+state/settings.store';
import { TeamIntegration } from '../../../team-integrations-third-parties/models/integrations-third-parties.type';
import { SelectItem } from 'primeng/api';
import {
	FieldwizAthleteProfile,
	IntegrationApiPlayer, IntegrationApiPlayerMapping,
	SecondaryTeamInfo,
	ThirdPartyPlayer
} from '../../models/integrations-api.type';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { FormArray, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { SelectItemLabelPipe } from '@iterpro/shared/ui/pipes';
import { NgTemplateOutlet } from '@angular/common';
import { IconButtonComponent, SkeletonTableComponent } from '@iterpro/shared/ui/components';
import * as moment from 'moment/moment';
import { Observable } from 'rxjs';

@UntilDestroy()
@Component({
	selector: 'iterpro-team-integration-api-player-mapping',
	standalone: true,
	imports: [
		PrimeNgModule,
		TranslateModule,
		SelectItemLabelPipe,
		ReactiveFormsModule,
		NgTemplateOutlet,
		SkeletonTableComponent,
		IconButtonComponent
	],
	templateUrl: './team-integration-api-player-mapping.component.html'
})
export class TeamIntegrationApiPlayerMappingComponent implements OnChanges {
	@Input({required: true}) formGroupName: string;
	@Input({required: true}) players: IntegrationApiPlayer[];
	@Input({required: true}) team: TeamIntegration;
	@Input({required: true}) editMode: boolean;
	@Input({required: true}) saveClicked: boolean;
	// Services
	readonly #errorService = inject(ErrorService);
	readonly #settingsStore = inject(SettingsStore);
	readonly #thirdPartyApi = inject(ThirdpartyApi);
	readonly #providerService = inject(ProviderService);
	readonly #providerIntegrationService = inject(ProviderIntegrationService);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	readonly #fieldwizApi = inject(FieldwizApi);
	readonly #rootFormGroup = inject(FormGroupDirective);
	// Variables
	playersMappingForm: FormArray<FormGroup<IntegrationApiPlayerMapping>>;
	playersOptions: SelectItem[];
	isSecondaryTeamColumnLoading = false;
	provider: ProviderType;
	device: DeviceType;
	tacticalPlayers: ThirdPartyPlayer[] = [];
	tacticalPlayersOptions: SelectItem[];
	gpsPlayer: ThirdPartyPlayer[] = [];
	gpsPlayersOptions: SelectItem[];
	isNationalClub: boolean;
	teamOptions: SelectItem[];


	ngOnChanges(changes: SimpleChanges) {
		if (changes.players || changes.team) {
			this.initCommon();
		}
		if (changes.editMode && this.playersMappingForm) {
			this.playersMappingForm = this.#rootFormGroup.control.get(this.formGroupName) as FormArray<FormGroup<IntegrationApiPlayerMapping>>;
		}
	}

	private initCommon() {
		this.provider = this.#providerService.getProviderType(this.team as Team);
		this.device = this.team.device as DeviceType;
		this.isNationalClub = this.#settingsStore.isNationalClub();
		this.playersOptions = this.players.map(({id, displayName}) => ({label: displayName, value: id}));
		this.playersMappingForm = this.#rootFormGroup.control.get(this.formGroupName) as FormArray<FormGroup<IntegrationApiPlayerMapping>>;
		this.loadThirdPartyPlayers(this.team);
	}


	private loadThirdPartyPlayers(team: TeamIntegration) {
		this.loadGPSPlayers(team.id);
		switch (this.provider) {
			case 'Wyscout':
				this.loadTacticalPlayersFromWyscout(team);
				break;
			default:
				console.error('Provider not supported:', this.provider);
				break;
		}
	}

	private loadGPSPlayers(teamId: number) {
		this.#blockUiInterceptorService.disableOnce(this.#thirdPartyApi
			.getGPSPlayers(teamId))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (gps: ThirdPartyPlayer[]) => {
					this.gpsPlayersOptions = this.convertToSelectItem(gps);
					this.gpsPlayer = this.players.map(player => this.getPlayerFromProvider(gps, player));
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	private convertToSelectItem(providerPlayers: ThirdPartyPlayer[]): SelectItem[] {
		return (providerPlayers || []).map(providerPlayer => ({
			label: providerPlayer.shortName,
			value: providerPlayer._id
		}));
	}

	private getPlayerFromProvider(collection: ThirdPartyPlayer[], player: IntegrationApiPlayer): ThirdPartyPlayer {
		return collection.find(({ _id, playerKey }) => _id === player[playerKey]);
	}

	//region Tactical Players WyScout
	private loadTacticalPlayersFromWyscout(team: TeamIntegration) {
		this.#blockUiInterceptorService.disableOnce(this.#thirdPartyApi
			.getTacticalPlayers(team.id))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (tactical: ThirdPartyPlayer[]) => {
					if (this.isNationalClub) this.initSecondaryTeamInfo(team.id);
					this.tacticalPlayersOptions = this.convertToSelectItem(tactical);
					this.tacticalPlayers = this.players.map(player => this.getPlayerFromProvider(tactical, player));
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	private initSecondaryTeamInfo(teamId: number) {
		const providerIdField = this.#providerIntegrationService.fields.getProviderIdField();
		const syncedPlayers: number[] = this.players
			.filter(player => !!player[providerIdField])
			.map(player => player[providerIdField]);
		this.requestSecondaryTeamInfo(teamId, syncedPlayers);
	}

	private requestSecondaryTeamInfo(teamId: number, syncedPlayers: number[] = []) {
		this.isSecondaryTeamColumnLoading = true;
		if (syncedPlayers.length > 0) {
			this.loadSecondaryTeamInfo(teamId, syncedPlayers).subscribe({
				next: () => this.isSecondaryTeamColumnLoading = false
			});
		}
	}

	private loadSecondaryTeamInfo(teamId: number, syncedPlayers: number[]): Observable<SecondaryTeamInfo[]> {
		return this.#blockUiInterceptorService
			.disableOnce(this.#providerIntegrationService.getSecondaryTeamInfo(teamId, syncedPlayers))
			.pipe(
				first(),
				untilDestroyed(this),
				map((infos: SecondaryTeamInfo[] = []) => {
					this.teamOptions = infos.map(info => ({ label: info.currentTeamName, value: info.wyId }));
					return infos;
				})
			);
	}
	//endregion

	//region Fieldwiz Players
	addMappedFieldwizPlayer(playerId: string) {
		const player = this.players.find(({ id }) => id === playerId);
		const athlete: FieldwizAthleteProfile = {
			external_id: player.id,
			first_name: player.displayName,
			last_name: 'iterpro player',
			gender: player.gender,
			weight: player.weight,
			height: player.height,
			max_heart_rate: 140,
			birth_date: moment(player.birthDate).format('YYYY-MM-DD')
		};
		this.#blockUiInterceptorService.disableOnce(this.#fieldwizApi
			.createFieldwizAthlete(this.team.id, athlete))
			.pipe(first(), untilDestroyed(this), filter(Boolean))
			.subscribe({
				next: (result: { athlete_profile: {id: string} }) => {
					this.playersMappingForm.controls.find(({controls}) => controls.playerId.value === playerId).controls.fieldwizId.setValue(result.athlete_profile.id);
				},
				error: error => void this.#errorService.handleError(error)
			});
	}

	removeMappedFieldwizPlayer(playerId: string) {
		this.playersMappingForm.controls.find(({controls}) => controls.playerId.value === playerId).controls.fieldwizId.setValue(null);
	}

	//endregion
}

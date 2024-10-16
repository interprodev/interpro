import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ClubSeasonBasic, CompetitionInfoControl, TeamSeasonCompetitionsForm } from '../../models/seasons.type';
import { FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { BasicInputDialogComponent, FormFeedbackComponent, IconButtonComponent } from '@iterpro/shared/ui/components';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import {
	CompetitionInfo,
	DeviceType,
	Player,
	ProviderType,
	Team,
	TeamSeason,
	WyscoutCompetitionSeasons, WyscoutSeason
} from '@iterpro/shared/data-access/sdk';
import { sortBy, uniqBy } from 'lodash';
import {
	BlockUiInterceptorService,
	CompetitionsConstantsService, ErrorService,
	FormatDateUserSettingPipe, ProviderIntegrationService,
	ProviderTypeService, sortByName
} from '@iterpro/shared/utils/common-utils';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { BadgeModule } from 'primeng/badge';
import { LowerCasePipe } from '@angular/common';
import { CompetitionNamePipe, CompetitionSeasonsPipe } from '@iterpro/shared/ui/pipes';
import { from, Observable } from 'rxjs';
import { mergeAll } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MultiSelectChangeEvent } from 'primeng/multiselect';
import { toCompetitionInfoControl } from '../../models/seasons.form';
import { DynamicDialogRef } from 'primeng/dynamicdialog/dynamicdialog-ref';
import { DialogService } from 'primeng/dynamicdialog';
import { v4 as uuid } from 'uuid';

@UntilDestroy()
@Component({
	selector: 'iterpro-team-season-competitions',
	standalone: true,
	imports: [
		FormFeedbackComponent,
		ReactiveFormsModule,
		TranslateModule,
		PrimeNgModule,
		BadgeModule,
		FormatDateUserSettingPipe,
		LowerCasePipe,
		CompetitionNamePipe,
		CompetitionSeasonsPipe,
		IconButtonComponent
	],
	templateUrl: './team-season-competitions.component.html'
})
export class TeamSeasonCompetitionsComponent implements OnInit, OnChanges {
	// Input Properties
	@Input({required: true}) formGroupName: string;
	@Input({required: true}) teamSeason: TeamSeason;
	@Input({required: true}) clubSeasons: ClubSeasonBasic[];
	@Input({required: true}) seasonPlayerIds: string[];
	@Input({required: true}) saveClicked: boolean;
	@Input({required: true}) editMode: boolean;
	@Input({required: true}) team: Team;
	@Input({required: true}) clubPlayers: Player[];
	@Input({required: true}) isNationalClub: boolean;
	// Services
	#rootFormGroup = inject(FormGroupDirective);
	#providerTypeService = inject(ProviderTypeService);
	#competitionsService = inject(CompetitionsConstantsService);
	#blockUiInterceptorService = inject(BlockUiInterceptorService);
	#providerIntegrationService = inject(ProviderIntegrationService);
	#errorService = inject(ErrorService);
	#dialogService: DialogService = inject(DialogService);
	#translate = inject(TranslateService);
	// Variables
	selectedCompetitionsOptions: SelectItem[];
	thirdPartyCompetitions: SelectItem[] = [];
	competitionsForm: FormGroup<TeamSeasonCompetitionsForm>;
	#device: DeviceType;
	provider: ProviderType;
	areaIds: SelectItem[] = [];
	seasonPlayers: SelectItem[] = [];
	wyscoutSeasonOptions: SelectItem<WyscoutSeason>[] = [];
	isLoading = false;

	ngOnInit(): void {
		this.competitionsForm = this.#rootFormGroup.control.get(this.formGroupName) as FormGroup<TeamSeasonCompetitionsForm>;
		this.loadData();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (this.competitionsForm && changes.seasonPlayerIds && !changes.seasonPlayerIds.firstChange) {
			this.loadSeasonPlayers();
		}
	}

	private loadData() {
		this.isLoading = true;
		this.#device = this.team.device as DeviceType;
		this.provider = this.#providerTypeService.getProviderType(this.team);
		if (this.provider !== 'Dynamic') {
			this.areaIds = this.#competitionsService.withProvider(this.provider).getAllAreaIds();
		}
		this.loadSeasonPlayers();
		this.loadCompetitions();
		this.loadAllCompetitionsSeasons();
		this.isLoading = false;
	}

	private loadSeasonPlayers() {
		this.seasonPlayers = this.seasonPlayerIds.map(playerId => {
			const player = this.clubPlayers.find((({ id }) => id === playerId));
			return { label: player?.displayName, value: playerId };
		});
	}

	//region Competitions/Seasons for competitions

	onAreaIdsChange({ value }: SelectItem) {
		this.thirdPartyCompetitions = this.#competitionsService.withProvider(this.provider).getCompetitionsByAreas(value);
		this.loadSelectedAvailableCompetitions();
	}

	onCompetitionsChange(event: MultiSelectChangeEvent) {
		const competitionId = event.itemValue.value;
		const alreadyExist = this.competitionsForm.controls.competitionInfo.controls.find(({ value }) => value.competition === competitionId);
		if (!alreadyExist) {
			const competition: SelectItem = this.thirdPartyCompetitions.find(({ value }) => value === competitionId);
			this.competitionsForm.controls.competitionInfo.push(new FormGroup<CompetitionInfoControl>(toCompetitionInfoControl({
				competition: competitionId,
				season: null,
				lineup: null,
				sync: false,
				manual: typeof competition.value === 'string',
				name: typeof competition.value === 'string' ? competition.label : null
			}, false)));
			this.loadAllCompetitionsSeasons();
		} else {
			this.competitionsForm.controls.competitionInfo.removeAt(this.competitionsForm.controls.competitionInfo.controls.indexOf(alreadyExist));
		}
		this.loadSelectedAvailableCompetitions();
	}


	private loadCompetitions() {
		const competitions: SelectItem<CompetitionInfo>[] = [];
		const manualCompetitions = this.teamSeason.competitionInfo
			.filter(({ manual }) => manual)
			.map((item: CompetitionInfo) => ({ label: item.name, value: item.competition}));
		competitions.push(...manualCompetitions);
		if (this.provider !== 'Dynamic') {
			competitions.push(...this.#competitionsService.withProvider(this.provider).getCompetitionsByAreas(this.teamSeason.wyscoutAreas));
		}
		this.thirdPartyCompetitions = sortBy(uniqBy(competitions, 'value'), 'label');
		this.loadSelectedAvailableCompetitions();
	}

	private loadSelectedAvailableCompetitions() {
		this.selectedCompetitionsOptions = this.getSelectedAvailableCompetitions();
	}

	private getSelectedAvailableCompetitions(): SelectItem[] {
		return this.thirdPartyCompetitions
			.filter(({ value }) => this.competitionsForm.controls.selectedCompetitions.value.includes(value))
			.map(({ label, value }) => ({ label: label, value: value }));
	}

	private loadAllCompetitionsSeasons() {
		const thirdPartyCompetitions: number[] = this.competitionsForm.controls.competitionInfo.getRawValue()
			.filter(({ manual }) => !manual)
			.filter(({ competition }) => !this.isAlreadyLoaded(competition as number))
			.filter(({ competition }) => typeof competition === 'number' || this.getCompetitionFromJson(competition))
			.map(({ competition }) => competition) as number[];
		if (this.provider !== 'Dynamic' && thirdPartyCompetitions?.length > 0) {
			from(thirdPartyCompetitions.map(id => this.getCompetitionSeason(id)))
				.pipe(mergeAll(3), untilDestroyed(this))
				.subscribe({
					next: (results: WyscoutCompetitionSeasons[]) => {
						const seasons = results.map(({ seasons }) => seasons.map(item => ({ label: item.name, value: item})));
						this.updateSeasonsOptions(seasons.flat());
					},
					error: (error: Error) => this.#errorService.handleError(error)
				});
		}
	}

	private isAlreadyLoaded(competitionId: number): boolean {
		return this.wyscoutSeasonOptions.map(({ value }) => value.competitionId).includes(competitionId);
	}

	private updateSeasonsOptions(seasons: SelectItem<WyscoutSeason>[]) {
		const concatenated = this.wyscoutSeasonOptions.concat(seasons);
		this.wyscoutSeasonOptions = uniqBy(concatenated, 'value');
	}

	private getCompetitionFromJson(id: string) {
		return this.#competitionsService.withProvider(this.provider).getCompetitionFromJson(id);
	}

	private getCompetitionSeason(competitionId: string | number): Observable<any[]> {
		return this.#blockUiInterceptorService.disableOnce(
			this.#providerIntegrationService.withProviderApi(this.provider).seasonsForCompetitions(this.teamSeason.teamId, [competitionId], null)
		);
	}

	//endregion

	// region Custom Competition Dialog
	openCustomCompetitionDialog() {
		const ref = this.createCustomCompetitionDialog();
		ref.onClose.subscribe((customCompetitionName: string) => {
			if (customCompetitionName) {
				this.thirdPartyCompetitions = sortByName(
					[...this.thirdPartyCompetitions, { label: customCompetitionName, value: uuid()}],
					'label'
				);
			}
		});
	}

	private createCustomCompetitionDialog(): DynamicDialogRef {
		const header = this.#translate.instant('season.newCustomCompetition');
		return this.#dialogService.open(BasicInputDialogComponent, {
			data: {
				value: null,
				label: this.#translate.instant('season.customCompetitionName'),
				editMode: true
			},
			width: '50%',
			height: '40%',
			header,
			closable: true,
			modal: true,
			contentStyle: { overflowY: 'unset' },
			styleClass: 'dialog-header-padding-2 dialog-content-padding-2 dialog-shark-theme'
		});
	}
	// endregion
}

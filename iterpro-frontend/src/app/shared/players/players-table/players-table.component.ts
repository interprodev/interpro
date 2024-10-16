import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Injector, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import {
	ColumnPayload,
	CommonListViewPDF,
	FunctionalTestInstance,
	Player,
	PlayerAttribute,
	PlayerAttributesEntry,
	PlayerTableColumn,
	RobustnessData,
	StandardAttributes,
	Team,
	TeamSeason,
	Test,
	TestApi,
	TestInstance,
	TestInstanceApi,
	TestMetric,
	TreatmentMetric,
	attributeAvgCategory,
	PotentialLetter
} from '@iterpro/shared/data-access/sdk';
import {
	ColumnVisibilityOption,
	PlayerFlagComponent,
	TableColumnFilterComponent,
	PictureComponent, SkeletonTableComponent
} from '@iterpro/shared/ui/components';
import { AgePipe, ArrayFromNumberPipe, CapitalizePipe, PlayersPipe, ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AvailabiltyService,
	AzureStoragePipe,
	BlockUiInterceptorService,
	CustomTreatmentService,
	ErrorService,
	FormatDateUserSettingPipe,
	InjuryIconService,
	ReportService,
	RobustnessService,
	TreatmentsOfTheDayTooltipPipe,
	completeWithAdditionalFields,
	getColumnOptions,
	getColumns,
	getColumnsFields,
	getId,
	getInitialVisibility,
	getLetterColorClass,
	getLiteralAvg,
	getMappedStandardAttributes,
	getMomentFormatFromStorage,
	getNumericalAvg,
	getPDFv2Path,
	getPlayerTestInstances,
	getSpinnerColor,
	getTipssAttributes,
	isPlayerDescriptionSetting,
	playerAttributes,
	sortByDateDesc,
	tableToMixedTable,
	getTeamsPlayerAttributes,
	getCategoryValues
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { cloneDeep, last } from 'lodash';
import * as moment from 'moment';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { InjuryIconComponent } from '../../injury-icon/injury-icon.component';
import { FilterOptions } from '../../table-filter/models/table-filter.model';
import { TableFilterComponent } from '../../table-filter/table-filter.component';
import { MenuItem } from 'primeng/api';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [
		CommonModule,
		PrimeNgModule,
		TranslateModule,
		TableColumnFilterComponent,
		InjuryIconComponent,
		FormatDateUserSettingPipe,
		PlayerFlagComponent,
		ShortNumberPipe,
		AgePipe,
		ArrayFromNumberPipe,
		PictureComponent,
		TableFilterComponent,
		SkeletonTableComponent
	],
	selector: 'iterpro-players-table',
	templateUrl: './players-table.component.html',
	styleUrls: ['./players-table.component.scss'],
	providers: [
		ShortNumberPipe,
		DecimalPipe,
		PlayersPipe,
		AzureStoragePipe,
		CapitalizePipe,
		TreatmentsOfTheDayTooltipPipe,
		AgePipe,
		CustomTreatmentService
	]
})
export class PlayersTableComponent extends EtlBaseInjectable implements OnChanges, OnInit {
	@Input({required: true}) season: TeamSeason;
	@Input({required: true}) team: Team;
	@Input({required: true}) players: Player[];
	@Input({required: true}) showFilters: boolean;
	@Input({required: true}) filterPlayer: string;
	@Input() customMetrics: TreatmentMetric[] = [];
	@Input({required: true}) sportType: string;
	@Output() playerClickedEmitter: EventEmitter<Player> = new EventEmitter<Player>();
	playersBackup: Player[];
	isTableLoading: boolean;
	filterOptions: FilterOptions<Player> = {};
	readonly baseFilterOptions: FilterOptions<Player> = {
		position: { label: 'profile.position', type: 'multi' },
		birthDate: { label: 'profile.overview.age', type: 'age' },
		nationality: { label: 'profile.overview.nationality', type: 'multi' },
		height: { label: 'profile.overview.height', type: 'multi' },
		weight: { label: 'profile.overview.weight', type: 'multi' },
		foot: { label: 'profile.position.foot', type: 'multi' }
	};
	readonly filterOptionsAttributes: FilterOptions<Player & { offensive: string; defensive: string; attitude: string }> =
		{
			offensive: { label: 'profile.attributes.offensive', type: 'multi' },
			defensive: { label: 'profile.attributes.defensive', type: 'multi' },
			attitude: { label: 'profile.attributes.attitude', type: 'multi' }
		};
	readonly filterOptionsAttributesTipss: FilterOptions<
		Player & { performance: string; potential: string; prognosis: string }
	> = {
		performance: { label: 'home.performance', type: 'multi' },
		potential: { label: 'scouting.survey.potential', type: 'multi' },
		prognosis: { label: 'prognosis', type: 'multi' }
	};

	readonly filterOptionsRobustness: FilterOptions<Player & RobustnessData> = {
		healthStatusReadiness: { label: 'readiness.healthStatus', type: 'multi', translateLabelPrefix: 'tooltip' },
		injuriesNumber: { label: 'player.robustness.n_injuries', type: 'multi' },
		injurySeverity: { label: 'player.robustness.injury_severity', type: 'multi' },
		reinjuryRate: { label: 'player.robustness.reinjury_rate', type: 'multi' },
		availability: { label: 'player.robustness.availability', type: 'multi' },
		apps: { label: 'player.robustness.apps', type: 'multi' },
		gameMissed: { label: 'player.robustness.game_missed', type: 'multi' },
		sessionsMissed: { label: 'player.robustness.player.robustness.legend.training_missed', type: 'multi' }
	};
	columns: PlayerTableColumn[];
	visibleColumns: string[];
	columnOptions: ColumnVisibilityOption[];
	testColumns: string[] = [];
	testMetrics: TestMetric[] = [];
	tests: FunctionalTestInstance[];
	offensive: PlayerAttribute[] = [];
	defensive: PlayerAttribute[] = [];
	attitude: PlayerAttribute[] = [];
	tipssAttributes: PlayerAttribute[] = [];
	potential: PlayerAttribute[] = [];
	robustnessData: RobustnessData;

	filtersTabTypes: MenuItem[] = [
		{
			id: 'filters',
			label: 'Filters',
			command: () => this.activeFilterTabType = this.filtersTabTypes[0]
		},
		{
			id: 'tableColumns',
			label: 'Table columns',
			command: () => this.activeFilterTabType = this.filtersTabTypes[1]
		}
	];
	activeFilterTabType: MenuItem = this.filtersTabTypes[0];

	constructor(
		private agePipe: AgePipe,
		private testApi: TestApi,
		private error: ErrorService,
		private azurePipe: AzureStoragePipe,
		private translate: TranslateService,
		private reportService: ReportService,
		private testInstanceApi: TestInstanceApi,
		private injuryIconService: InjuryIconService,
		private robustnessService: RobustnessService,
		private availabilityService: AvailabiltyService,
		private treatmentsOfTheDayTooltipPipe: TreatmentsOfTheDayTooltipPipe,
		private blockUiInterceptorService: BlockUiInterceptorService,
		injector: Injector
	) {
		super(injector);
	}

	ngOnInit() {
		this.isTableLoading = true;
		this.loadFilterOptions();
		this.loadStandardAttributes();
		this.testMetrics = this.team.metricsTests || [];
		this.loadTestAndRobustnessData();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.players && changes.players.currentValue && this.tests) {
			this.loadTestAndRobustnessData();
		}
	}

	private loadTestAndRobustnessData() {
		const obs$ = [this.getTests(), this.getPlayersRobustness((this.players || []).map(({ id }) => id))];
		forkJoin(obs$)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (result: [FunctionalTestInstance[], RobustnessData]) => {
					this.tests = result[0];
					this.robustnessData = result[1];
					this.loadAll();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private loadAll() {
		this.testColumns = [];
		this.players.forEach(player => {
			const testResults = getPlayerTestInstances(player, this.tests, this.testMetrics);
			Object.keys(testResults).forEach(key => {
				if (!this.testColumns.includes(key)) {
					this.testColumns.push(key);
				}
			});
			player['testResults'] = testResults;
			if (this.robustnessData) {
				const whiteListedRobustness = [
					'healthStatusReadiness',
					'injuriesNumber',
					'injurySeverity',
					'reinjuryRate',
					'availability',
					'apps',
					'gameMissed',
					'sessionsMissed'
				];
				whiteListedRobustness.forEach(key => {
					let value = null;
					if (key === 'availability') {
						value =
							this.robustnessData[player.id][key] !== null ||
							this.robustnessData[player.id][key] !== undefined ||
							!isNaN(this.robustnessData[player.id][key])
								? +Number(this.robustnessData[player.id][key]).toFixed(1)
								: null;
					} else {
						value = player.id in this.robustnessData ? this.robustnessData[player.id][key] : null;
					}
					player[key] = value;
				});
			}
			const playerAttributesEntry: PlayerAttributesEntry = this.getPlayerAttributeEntry(player);
			if (playerAttributesEntry) {
				if (isPlayerDescriptionSetting('attributes', this.team?.club?.scoutingSettings)) {
					player = this.fillPlayerAttributes(player, playerAttributesEntry);
				} else {
					player = this.fillPlayerAttributesTipss(player, playerAttributesEntry);
				}
			}
		});
		this.columnOptions = this.getColumnOptions();
		this.visibleColumns = getColumnsFields({ ...this.getColumnPayload(), testHeaders: [] });
		this.loadColumns();
		this.playersBackup = cloneDeep(this.players);
		this.isTableLoading = false;
	}

	//#region Functional Tests

	private getTests() {
		const teamId = getId(this.team);
		return this.blockUiInterceptorService
			.disableOnce(
				this.testApi.find<Pick<Test, 'id' | 'name' | 'purpose'>>({
					where: {
						teamId: { inq: [teamId, 'GLOBAL'] }
					},
					fields: ['id', 'name', 'purpose']
				})
			)
			.pipe(
				switchMap((tests = []) => {
					const testMetrics: TestMetric[] = this.team.metricsTests || [];
					const ids = tests.map(test => getId(test)).filter(id => testMetrics.some(({ testId }) => testId === id));
					return ids.length > 0 ? this.getFunctionalTestInstances(ids, teamId, tests) : of([]);
				}),
				map((testInstances: FunctionalTestInstance[]) => sortByDateDesc(testInstances, 'date'))
			);
	}

	private getFunctionalTestInstances(
		ids: string[],
		teamId: string,
		tests: Pick<Test, 'id' | 'name' | 'purpose'>[]
	): Observable<FunctionalTestInstance[]> {
		return this.blockUiInterceptorService
			.disableOnce(
				this.testInstanceApi.find<Pick<TestInstance, 'id' | 'testId' | '_testResults' | 'date'>>({
					where: {
						testId: { inq: ids },
						teamId
					},
					fields: ['id', 'testId', '_testResults', 'date']
				})
			)
			.pipe(
				map(instances =>
					instances.map(instance => {
						const { name, purpose } = tests.find(({ id }) => id === instance.testId);
						return { ...instance, name, purpose };
					})
				)
			);
	}

	//#endregion

	//#region Robustness Data
	private getPlayersRobustness(playerIds: string[]): Observable<RobustnessData> {
		if (playerIds && playerIds.length > 0) {
			return this.robustnessService.profileRobustness(
				this.season.id,
				playerIds,
				this.season.offseason,
				this.season.inseasonEnd,
				this.etlPlayerService.getDurationField().metricName,
				2
			);
		}
		return of(null);
	}
	//#endregion

	//#region PlayerAttributes

	private fillPlayerAttributes(player: Player, playerAttributesEntry: PlayerAttributesEntry): Player {
		// Player Attributes (Offensive, Defensive, Attitude)
		player['playerAttributes'] = {};
		for (const category of attributeAvgCategory) {
			const avgValue = getNumericalAvg(
				10,
				getCategoryValues(playerAttributesEntry, category),
				this.team.club.scoutingSettings
			);
			player[category] = avgValue;
			player['playerAttributes'][category] = {
				value: avgValue,
				backgroundColor: getSpinnerColor(
					isPlayerDescriptionSetting('attributes', this.team?.club?.scoutingSettings),
					getCategoryValues(playerAttributesEntry, category),
					this.team.club.scoutingSettings
				),
				color: 'white'
			};
		}
		return player;
	}

	private fillPlayerAttributesTipss(player: Player, playerAttributesEntry: PlayerAttributesEntry): Player {
		// Player Attributes (performance, potential, prognosis)
		player['playerAttributes'] = {};
		// performance
		player['performance'] = getNumericalAvg(
			1,
			getCategoryValues(playerAttributesEntry, 'tipss'),
			this.team.club.scoutingSettings
		);
		player['playerAttributes']['performance'] = {
			value: player['performance'],
			backgroundColor: getSpinnerColor(
				isPlayerDescriptionSetting('attributes', this.team?.club?.scoutingSettings),
				getCategoryValues(playerAttributesEntry, 'tipss'),
				this.team.club.scoutingSettings
			),
			color: 'white'
		};
		// potential
		const potentialAvg = getLiteralAvg(playerAttributesEntry, 'potential');
		player['potential'] = potentialAvg;
		player['playerAttributes']['potential'] = {
			value: player['potential'],
			backgroundColor: this.getSpinnerColorPotential(potentialAvg),
			color: 'white'
		};
		player['prognosis'] = playerAttributesEntry['prognosisScore'];
		player['playerAttributes']['prognosis'] = {
			value: player['prognosis'],
			backgroundColor: this.getSpinnerColorPrognosis(playerAttributesEntry['prognosisScore']),
			color: 'white'
		};
		return player;
	}

	private loadStandardAttributes() {
		if (isPlayerDescriptionSetting('attributes', this.team?.club?.scoutingSettings)) {
			this.mapStandardAttributes();
		} else {
			this.mapTipssAttributes();
		}
	}

	private mapTipssAttributes() {
		this.tipssAttributes = getTipssAttributes(this.team.club.scoutingSettings);
		this.potential = playerAttributes.filter(({ category }) => category === 'potential');
	}

	private mapStandardAttributes() {
		const result: StandardAttributes = getMappedStandardAttributes(getTeamsPlayerAttributes([this.team]));
		this.offensive = result.offensive;
		this.defensive = result.defensive;
		this.attitude = result.attitude;
	}

	private getPlayerAttributeEntry(player: Player): PlayerAttributesEntry {
		return completeWithAdditionalFields(
			last(player?.attributes || []),
			getTeamsPlayerAttributes([this.team]),
			'Player',
			this.team?.club?.scoutingSettings
		);
	}

	//endregion

	//#region Columns
	private getColumnPayload(): ColumnPayload {
		const hasSomeArchivedPlayers = this.isThereAnyArchivedPlayer(this.players);
		return {
			testHeaders: this.testColumns,
			isTipss: isPlayerDescriptionSetting('tipss', this.team?.club?.scoutingSettings),
			hasSomeArchivedPlayers
		};
	}
	private loadColumns() {
		const colPayload = this.getColumnPayload();
		const columns: PlayerTableColumn[] = getColumns(colPayload);
		const columnsToTranslate =
			this.visibleColumns.length > 0
				? columns.filter((c: any) => this.visibleColumns.includes(c.column ? c.column : c.field))
				: columns;
		this.columns = columnsToTranslate.map(column => ({
			...column,
			header:
				(column as any).header.length > 0 ? this.translate.instant((column as any).header) : (column as any).header
		}));
	}

	private getColumnOptions() {
		const colPayload = this.getColumnPayload();
		return getColumnOptions(getInitialVisibility(colPayload.isTipss), colPayload);
	}

	onRowClick(player: Player) {
		this.playerClickedEmitter.emit(player);
	}

	private isThereAnyArchivedPlayer(players: Player[]): boolean {
		return players.some(({ archived }) => archived);
	}

	//endregion

	getReadinessColor(player: Player): string {
		return this.availabilityService.getCurrentHealthStatusColor(player);
	}

	getSpinnerColorPotential(potential: PotentialLetter): string {
		return getLetterColorClass(potential);
	}

	getSpinnerColorPrognosis(prognosis: PotentialLetter): string {
		return getLetterColorClass(prognosis);
	}

	//region Filters
	private loadFilterOptions() {
		if (isPlayerDescriptionSetting('attributes', this.team?.club?.scoutingSettings)) {
			this.filterOptions = { ...this.baseFilterOptions, ...this.filterOptionsAttributes };
		} else {
			this.filterOptions = { ...this.baseFilterOptions, ...this.filterOptionsAttributesTipss };
		}
		this.filterOptions = { ...this.filterOptions, ...this.filterOptionsRobustness };
	}
	filterPlayers(filteredItems: any[]) {
		this.players = filteredItems;
	}
	changeViewableColumns(visibleColumns: string[]) {
		this.visibleColumns = visibleColumns;
		this.loadColumns();
	}
	resetFilters() {
		this.playersBackup = cloneDeep(this.playersBackup);
	}
	//endregion

	//#region Report Functions
	getListReportPDF() {
		const title = `${this.translate.instant(`navigator.myTeam`).toUpperCase()} - ${this.translate
			.instant(`admin.squads.listView`)
			.toUpperCase()}`;
		const report: CommonListViewPDF = {
			header: {
				title: title,
				subTitle: `${this.season.name}`
			},
			metadata: {
				createdLabel: `${this.translate.instant('general.createdOn')} ${moment(new Date()).format(
					`${getMomentFormatFromStorage()} hh:mm`
				)}`
			},
			table: tableToMixedTable(
				this.visibleColumns,
				this.columns,
				this.players,
				this.translate,
				this.azurePipe,
				this.agePipe,
				this.injuryIconService,
				this.treatmentsOfTheDayTooltipPipe
			)
		};
		this.reportService.getReport(getPDFv2Path('my-team', 'my_team_list_view', false), report, '', null, `${title}`);
	}
	//endregion
}

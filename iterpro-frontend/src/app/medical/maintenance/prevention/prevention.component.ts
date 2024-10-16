import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import {
	Anamnesys,
	ClubApi,
	Customer,
	FunctionalTestInstance,
	GOScore,
	Injury,
	MedicalPreventionPlayer,
	MedicalTreatment,
	MedicalTreatmentApi,
	PdfBase,
	PdfMixedTable,
	Player,
	PlayerApi,
	PlayerRoleCategory,
	Team,
	TeamSeason,
	TeamSeasonApi,
	TeamTableFilterTemplate,
	Test,
	TestApi,
	TestInstance,
	TestInstanceApi,
	TestMetric,
	Treatment,
	TreatmentMetric,
	TreatmentMetricType,
	TreatmentStatus,
	TreatmentsByStatus,
	Wellness
} from '@iterpro/shared/data-access/sdk';
import { ColumnVisibilityOption, ISSUE_SORENESS } from '@iterpro/shared/ui/components';
import { AgePipe } from '@iterpro/shared/ui/pipes';
import {
	AlertService,
	AvailabiltyService,
	CustomTreatmentService,
	EditModeService,
	ErrorService,
	InjuryIconService,
	ReadinessService,
	ReportService,
	SportType,
	ToLocalEquivalentService,
	ToServerEquivalentService,
	TreatmentsOfTheDayTooltipPipe,
	getFieldPosition,
	getId,
	getMedicationName,
	getMomentFormatFromStorage,
	getPDFv2Path,
	getPlayerTestInstances,
	getPositionCategories,
	parseChronicInjuries,
	parseHtmlStringToText,
	sortByDateDesc,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { sortBy } from 'lodash';
import * as momentLib from 'moment';
import { extendMoment } from 'moment-range';
import * as Papa from 'papaparse';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { Observable, Observer, forkJoin, of, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, first, map, switchMap } from 'rxjs/operators';
import { PreventionPlayerComponent } from '../prevention-player/prevention-player.component';
import {
	MedicalPreventionColumnVisibility,
	getColumnOptions,
	getTreatmentColumns
} from '../ui/components/prevention-table-view/fields';
import { PreventionTableComponent } from '../ui/components/prevention-table-view/prevention-table-view.component';
import { RootStoreState } from '../../../+state/root-store.state';
import { FilterEmitter, FilterOptions } from '../../../shared/table-filter/models/table-filter.model';
import { getFiltersForTemplate, getUpdatedFilterOptions } from '../../../shared/table-filter/utils/table-filter.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const moment = extendMoment(momentLib);

const initialVisiblity: MedicalPreventionColumnVisibility = {
	general: ['downloadUrl', 'displayName', 'position', 'birthDateText', 'nationality', 'expiration'],
	readiness: ['readiness'],
	injury: ['injury', 'injuryStatus', '_chronicInjuries'],
	tests: [],
	treatments: []
};

export enum MedicalRecordsViewType {
	Card = 'card',
	List = 'list',
	Calendar = 'calendar',
	EventDetail = 'eventDetail'
}

interface DropdownElement {
	player: MedicalPreventionPlayer;
}

@UntilDestroy()
@Component({
	templateUrl: './prevention.component.html',
	styleUrls: ['./prevention.component.css']
})
export class PreventionComponent implements OnInit {
	players: Player[] = [];

	completedPlayers: MedicalPreventionPlayer[] = [];

	selected: MedicalPreventionPlayer;
	medicalTreatments: MedicalTreatment[];
	medicalRecordsViewTypes = MedicalRecordsViewType;
	chronicIdParam: string;

	customers$: Observable<Pick<Customer, 'firstName' | 'lastName' | 'id'>[]>;
	isLoading = true;
	showFilters = false;
	filterPlayer = '';
	filteredPlayers: MedicalPreventionPlayer[] = [];
	visibleColumns: string[] = this.columnVisibilityToArray(initialVisiblity);
	testColumns: string[] = [];
	columnOptions: ColumnVisibilityOption[] = [];
	filterOptions: FilterOptions<MedicalPreventionPlayer> = {
		nationality: {
			label: 'profile.overview.nationality',
			type: 'multi',
			translateLabelPrefix: 'nationalities'
		},
		birthDateText: {
			label: 'profile.overview.birth',
			type: 'multi'
		},
		position: {
			label: 'profile.position',
			type: 'multi'
		},
		readinessValue: {
			label: 'profile.player.readiness',
			type: 'range',
			defaultSelection: [0, 100]
		},
		weight: {
			type: 'range',
			label: 'profile.overview.weight',
			config: {
				min: 0,
				max: 200
			},
			defaultSelection: [0, 200]
		},
		height: {
			type: 'range',
			label: 'profile.overview.height',
			config: {
				min: 0,
				max: 300
			},
			defaultSelection: [0, 300]
		}
	};

	private customMetrics: TreatmentMetric[] = [];
	private defaultMetrics: TreatmentMetric[] = [];

	private from: Date;
	private to: Date;
	private secMetrics: TreatmentMetric[];
	private physiotherapyMetrics: TreatmentMetric[];

	private tests: FunctionalTestInstance[];
	searchDropdownElements: DropdownElement[];
	sorenessInjuries: Injury[];

	@ViewChild('playersTable', { static: false }) playersTableChild: PreventionTableComponent;
	@ViewChild(PreventionPlayerComponent, { static: false }) medicalPreventionPlayerComponent: PreventionPlayerComponent;
	team: Team;
	season: TeamSeason;
	sportType: SportType = 'football';
	categories: PlayerRoleCategory[] = [];
	showFilterTemplateSelection: boolean;
	filtersForTemplate: { [s: string]: unknown };
	categoryLabelForSkeletons: string[];
	readonly #currentTeam$ = this.authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());
	readonly #currentSeason$ = this.authStore.select(AuthSelectors.selectTeamSeason).pipe(takeUntilDestroyed());
	viewTypes: MenuItem[] = [
		{
			id: MedicalRecordsViewType.Card,
			label: 'admin.squads.cardView',
			icon: 'fas fa-id-card',
			command: () => (this.activeViewType = this.viewTypes[0])
		},
		{
			id: MedicalRecordsViewType.List,
			label: 'admin.squads.tableView',
			icon: 'fas fa-list',
			command: () => (this.activeViewType = this.viewTypes[1])
		},
		{
			id: MedicalRecordsViewType.Calendar,
			label: 'medical.prevention.dailytherapylist',
			icon: 'fas fa-calendar',
			command: () => (this.activeViewType = this.viewTypes[2])
		}
	];
	activeViewType: MenuItem = this.viewTypes[0];
	filtersTabTypes: MenuItem[];
	activeFilterTabType: MenuItem;
	constructor(
		private teamSeasonApi: TeamSeasonApi,
		private translate: TranslateService,
		private error: ErrorService,
		private route: ActivatedRoute,
		private reportService: ReportService,
		private treatmentsOfTheDayTooltipPipe: TreatmentsOfTheDayTooltipPipe,
		private customTreatmentService: CustomTreatmentService,
		private toServer: ToServerEquivalentService,
		private toLocal: ToLocalEquivalentService,
		private availabilityService: AvailabiltyService,
		private clubApi: ClubApi,
		private injuryIconService: InjuryIconService,
		private readinessService: ReadinessService,
		private testApi: TestApi,
		private testInstanceApi: TestInstanceApi,
		private playerApi: PlayerApi,
		private medicalTreatmentApi: MedicalTreatmentApi,
		private editService: EditModeService,
		private notificationService: AlertService,
		private confirmationService: ConfirmationService,
		private agePipe: AgePipe,
		private store$: Store<RootStoreState>,
		private authStore: Store<AuthState>
	) {
		this.generateFilterTabTypes();
		this.store$
			.select(AuthSelectors.selectSportType)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (type: SportType) => {
					this.sportType = type;
					this.categoryLabelForSkeletons = getPositionCategories(this.sportType).map((roleName: string) => roleName);
				}
			});
	}

	@HostListener('window:beforeunload')
	canDeactivate() {
		if (this.editService.editMode === false) {
			return true;
		}

		return new Observable((observer: Observer<boolean>) => {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.editGuard'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.editService.editMode = false;
					observer.next(true);
					observer.complete();
				},
				reject: () => {
					observer.next(false);
					observer.complete();
				}
			});
		});
	}

	ngOnInit() {
		combineLatest([this.#currentTeam$, this.#currentSeason$])
			.pipe(
				distinctUntilChanged(),
				filter(([team, season]) => !!team && !!season)
			)
			.subscribe({
				next: ([team, season]) => {
					this.team = team;
					this.season = season;
					this.initAll();
				}
			});
	}

	private generateFilterTabTypes() {
		const filterTabTypes: MenuItem[] = [
			{
				id: 'filters',
				label: 'Filters',
				command: () => (this.activeFilterTabType = this.filtersTabTypes.find(({ id }) => id === 'filters'))
			},
			{
				id: 'tableColumns',
				label: 'Table columns',
				command: () => (this.activeFilterTabType = this.filtersTabTypes.find(({ id }) => id === 'tableColumns'))
			}
		];
		this.filtersTabTypes = filterTabTypes;
		if (this.activeViewType.id === MedicalRecordsViewType.Card) {
			this.filtersTabTypes = this.filtersTabTypes.filter(({ id }) => id === 'filters');
		}
		this.activeFilterTabType = filterTabTypes[0];
	}

	private initAll() {
		// If player's id the route path found then store it in idParam field.
		let idParam: string;
		let tabIndex: number;
		this.route.paramMap.pipe(untilDestroyed(this)).subscribe((params: ParamMap) => {
			idParam = params['params'] ? params['params'].id : null;
			tabIndex = params['params'] ? params['params'].tabIndex : null;
			this.chronicIdParam = params['params'] ? params['params'].chronicInjuryId : null;
		});
		const { offseason, inseasonEnd } = this.season;
		const day = moment().isBetween(offseason, inseasonEnd) ? moment().toDate() : inseasonEnd;
		this.from = this.toServer.convert(moment(day).subtract(6, 'days').startOf('day').toDate());
		this.to = this.toServer.convert(moment(day).endOf('day').toDate());
		this.initializePlayers(idParam, tabIndex);
		this.customers$ = this.getCustomers();

		let { treatmentMetrics } = this.team;
		if (!treatmentMetrics || treatmentMetrics.length === 0) {
			treatmentMetrics = this.customTreatmentService.defaultTreatments();
		}
		this.secMetrics = treatmentMetrics.filter((treatment: TreatmentMetric) => treatment.type === 'sec');
		this.physiotherapyMetrics = treatmentMetrics.filter(
			(treatment: TreatmentMetric) => treatment.type === 'physiotherapy'
		);

		this.defaultMetrics = [];
		this.customMetrics = [];
		this.getPlayerTreatmentMetrics('sec').forEach(metric =>
			!metric.custom ? this.defaultMetrics.push(metric) : this.customMetrics.push(metric)
		);
		this.getPlayerTreatmentMetrics('physiotherapy').forEach(metric =>
			!metric.custom ? this.defaultMetrics.push(metric) : this.customMetrics.push(metric)
		);
	}

	setViewMode(type: MedicalRecordsViewType) {
		const newViewType = this.viewTypes.find(({ id }) => id === type);
		if (newViewType) {
			this.activeViewType = newViewType;
		}
	}

	viewTypeChanged(event: MenuItem) {
		this.showFilters = false;
		this.generateFilterTabTypes();
	}

	changeViewableColumns(visibleColumns: string[]) {
		this.visibleColumns = visibleColumns;
	}

	resetFilters() {
		this.filterPlayer = '';
		this.completedPlayers = this.completePlayers(this.players, this.tests);
		this.scaffoldPlayers(this.completedPlayers);
		this.columnOptions = this.getColumnOptions();
		this.visibleColumns = this.columnVisibilityToArray(initialVisiblity);
		this.filterPlayers(this.completedPlayers);
	}

	filterPlayers(players: MedicalPreventionPlayer[]) {
		this.filteredPlayers = [];
		this.scaffoldPlayers(players);
	}

	onCloseProfile() {
		this.selected = null;
	}

	private getCustomers(): Observable<Array<Pick<Customer, 'firstName' | 'lastName' | 'id'>>> {
		return this.clubApi.getCustomers(this.team.clubId, {
			fields: ['firstName', 'lastName', 'id']
		}) as Observable<Array<Pick<Customer, 'firstName' | 'lastName' | 'id'>>>;
	}

	private initializePlayers(idParam: string, tabIndex: number) {
		forkJoin([this.getPlayers(), this.getTests()])
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: ([players, tests]: [Player[], FunctionalTestInstance[]]) => {
					this.players = players;
					this.tests = tests;
					this.loadMedicalTreatments(players.map(({ id }) => id))
						.pipe(first(), untilDestroyed(this))
						.subscribe({
							next: (medicalTreatments: MedicalTreatment[]) => {
								this.medicalTreatments = medicalTreatments;
								this.completedPlayers = this.completePlayers(players, tests);
								this.columnOptions = this.getColumnOptions();
								this.visibleColumns = [...this.visibleColumns, ...this.testColumns];
								// If idParam(MedicalPreventionPlayer's Id) exist then find the corresponding player.
								if (idParam) {
									const player = this.completedPlayers.find(({ id }) => id.toString() === idParam);
									// If player found from the id above then open that player screen.(while Redirection from injury details to prevention)
									if (player) {
										this.filterPlayers(this.completedPlayers);
										this.onClickPlayer(player);
									} else {
										this.notificationService.notify('warn', 'Warning', 'alert.noPlayersFound');
									}
									if (tabIndex) {
										setTimeout(() => {
											this.medicalPreventionPlayerComponent.handleChangeTab({ index: tabIndex });
										}, 500);
									}
								}
								this.isLoading = false;
							},
							error: (error: Error) => this.error.handleError(error)
						});
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private loadMedicalTreatments(playerIds: string[]) {
		return this.medicalTreatmentApi.find({
			where: {
				playerId: { inq: playerIds }
			},
			order: 'date DESC'
		});
	}

	private getTests(): Observable<FunctionalTestInstance[]> {
		const teamId = getId(this.team);
		return this.testApi
			.find<Pick<Test, 'id' | 'name' | 'purpose'>>({
				where: {
					teamId: { inq: [teamId, 'GLOBAL'] }
				},
				fields: ['id', 'name', 'purpose']
			})
			.pipe(
				switchMap((tests = []) => {
					const testMetrics: TestMetric[] = this.team.metricsTests || [];
					const ids: string[] = tests
						.map(test => getId(test))
						.filter(id => testMetrics.some(({ testId }) => testId === id));
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
		return this.testInstanceApi
			.find<Pick<TestInstance, 'id' | 'testId' | '_testResults' | 'date'>>({
				where: {
					testId: { inq: ids },
					teamId
				},
				fields: ['id', 'testId', '_testResults', 'date']
			})
			.pipe(
				map(instances =>
					instances.map(instance => {
						const { name, purpose } = tests.find(x => x.id === instance.testId);
						return { ...instance, name, purpose };
					})
				)
			);
	}

	private getPlayers() {
		return (
			this.teamSeasonApi.getPlayers(this.season.id, {
				fields: {
					_thresholdsTeam: 0,
					_thresholdsPlayer: 0,
					_thresholdsAttendances: 0,
					_thresholdsMedical: 0,
					_attributes: 0,
					offensive_organization: 0,
					offensive_transition: 0,
					offensive_setPieces: 0,
					defensive_organization: 0,
					defensive_transition: 0,
					defensive_setPieces: 0,
					_thresholdsFinancial: 0,
					_thresholdsAgility: 0,
					_thresholdsPower: 0,
					_thresholdsSpeed: 0,
					_thresholdsMovement: 0,
					_thresholdsEndurance: 0,
					_thresholdsAnthropometry: 0,
					_thresholdsAncillary: 0,
					_thresholdsSleep: 0,
					_thresholdsCardiovascular: 0,
					_thresholdsHaematology: 0,
					_thresholdsMovementScreening: 0,
					_preventionTreatments: 0,
					documents: 0,
					sportPassport: 0,
					federalMembership: 0,
					_statusHistory: 0,
					_pastValues: 0,
					_pastAgentValues: 0,
					_pastClubValues: 0,
					_pastTransfermarktValues: 0,
					bankAccount: 0,
					address: 0,
					domocile: 0
				},
				where: { archived: false },
				include: [
					{
						relation: 'goScores',
						scope: {
							where: {
								and: [{ date: { gte: this.from } }, { date: { lte: this.to } }]
							},
							order: 'date DESC'
						}
					},
					{
						relation: 'wellnesses',
						scope: {
							where: {
								and: [
									{
										date: {
											gte: this.toServer.convert(moment(new Date()).startOf('day').toDate())
										}
									},
									{
										date: {
											lt: this.toServer.convert(moment(new Date()).endOf('day').toDate())
										}
									}
								]
							}
						}
					},
					{
						relation: 'injuries'
					}
				]
			}) as Observable<Player[]>
		).pipe(map((players: Player[]) => players.map(player => ({ ...player, age: player.birthDate }))));
	}

	private scaffoldPlayers(players: MedicalPreventionPlayer[]) {
		this.categories = [
			...getPositionCategories(this.sportType).map((roleName: string) => ({
				name: roleName,
				players: []
			})),
			{ name: 'noPosition', players: [] }
		];

		players.forEach((player: MedicalPreventionPlayer) => {
			this.filteredPlayers.push(player);
			const category = this.categorizeActivePlayer(player.position);
			this.categories = this.categories.map((item: PlayerRoleCategory) => {
				if (category === item.name) {
					return {
						...item,
						players: [...item.players, <Player>(<unknown>player)]
					};
				}
				return item;
			});
		});
	}

	private categorizeActivePlayer(position: string): string {
		if (!position) return 'noPosition';
		const category = getFieldPosition(position, this.sportType);
		return category ? category : 'noPosition';
	}

	private completePlayers(players: Player[] = [], tests: FunctionalTestInstance[] = []) {
		const testMetrics: TestMetric[] = this.team.metricsTests || [];
		const completedPlayers = sortByName(players, 'displayName').map((player: Player) => {
			const { goScoresMap, oldGoScoresMap } = this.mapGoScores(player); // TODO use server readiness logic
			const mean7d = this.readinessService.extractMeans(goScoresMap);
			const mean48h = this.readinessService.extractMeans(
				this.readinessService.filterGoScoresByDate({ goScoresMap }, [
					moment().subtract(1, 'days').startOf('day'),
					moment().subtract(2, 'days').startOf('day')
				])
			);
			const testResults = getPlayerTestInstances(player, tests, testMetrics);
			Object.keys(testResults).forEach(key => {
				if (!this.testColumns.includes(key)) {
					this.testColumns.push(key);
				}
			});
			const id = getId(player);

			const dayTreatments: Treatment[] = this.getTodayTreatments(player.id);
			const dayMedicalExams: Treatment[] = this.getExams(player);
			const dayFunctionalTests: FunctionalTestInstance[] = this.getFunctionalTests(tests);
			const parsedPlayer: MedicalPreventionPlayer = {
				...player,
				nationality: (player.nationality || '').toUpperCase(),
				birthDateText: moment(player.birthDate).format(getMomentFormatFromStorage()),
				goScoresMap,
				oldGoScoresMap,
				flaredUp: player.injuries.find(
					({ currentStatus, chronicInjuryId }) =>
						currentStatus !== 'medical.infirmary.details.statusList.healed' &&
						player._chronicInjuries.some(chronicInjury => chronicInjuryId === getId(chronicInjury))
				),
				...this.getPrescription(player),
				...this.getInjuriesStatus(player),
				...this.getAnamnesys(player.anamnesys),
				readiness: this.getPointColor(player),
				readinessValue: player.goScores && player.goScores.length ? player.goScores[0].score : 0,
				readiness48h: this.getColor(mean48h),
				readiness7d: this.getColor(mean7d),
				...testResults,
				dayTreatments: this.geTreatmentsByStaus(dayTreatments),
				dayMedicalExams: this.geTreatmentsByStaus(dayMedicalExams),
				dayFunctionalTests,
				id
			};
			return parsedPlayer;
		});

		return completedPlayers;
	}

	private getInjuriesStatus({ injuries }: Player): Pick<MedicalPreventionPlayer, 'injuryStatus'> {
		const injuryStatus = this.getInjuryStatusKey(injuries);
		return { injuryStatus: injuryStatus ? this.translate.instant(injuryStatus) : '' };
	}

	private getInjuryStatusKey(injuries: Injury[]) {
		let statusKey = '';
		const issueTypes = [
			'medical.infirmary.details.issue.injury',
			'medical.infirmary.details.issue.illness',
			'medical.infirmary.details.issue.complaint'
		];
		issueTypes.some(issueType => {
			const found = injuries.filter(({ issue }) => issue === issueType);
			statusKey = this.getWorstStatusKey(found);
			return found.length > 0;
		});

		return statusKey;
	}

	private getWorstStatusKey(injuries: Injury[] = []) {
		const statusTypes = [
			'medical.infirmary.details.statusList.therapy',
			'medical.infirmary.details.statusList.rehab',
			'medical.infirmary.details.statusList.reconditioning',
			'medical.infirmary.details.statusList.returnToPlay',
			'medical.infirmary.details.statusList.returnToGame'
		];
		return statusTypes.find(statusType => injuries.some(({ currentStatus }) => currentStatus === statusType)) || '';
	}

	private getAnamnesys(
		anamnesys: any[] = []
	): Pick<MedicalPreventionPlayer, 'anamnesys' | 'expiration' | 'expirationDescription'> {
		anamnesys = sortByDateDesc(anamnesys, 'date');
		return { anamnesys, ...this.getExpiration(anamnesys) };
	}

	private getExpiration(anamnesys: any[] = []) {
		let expirationDescription = '';
		let expired = false;
		let expiration = null;
		const orderedAn = sortByDateDesc(anamnesys, 'expirationDate');
		if (orderedAn && orderedAn.length > 0) {
			const expirationDate = moment(orderedAn[0].expirationDate);
			const isExpired = moment().isAfter(expirationDate);
			const translated = isExpired
				? this.translate.instant('medical.prevention.expiration')
				: this.translate.instant('medical.prevention.expirationActive');
			expiration = expirationDate.toDate();
			expirationDescription = `${translated} ${expirationDate.format(getMomentFormatFromStorage())}`;
			expired = isExpired && moment().diff(expirationDate) < 30;
		}
		return { expired, expiration, expirationDescription };
	}

	private getPlayerMedicalTreatments(playerId: string): MedicalTreatment[] {
		return this.medicalTreatments.filter(({ playerId: trtPlayerId }) => playerId === trtPlayerId);
	}

	private getInjuryMedicalTreatments(injuryIds: string[]): MedicalTreatment[] {
		return this.medicalTreatments.filter(({ injuryId: trtInjuryId }) => injuryIds.includes(trtInjuryId));
	}

	private getPrescription(
		player: Player
	): Pick<
		MedicalPreventionPlayer,
		'preventionPast' | 'preventionNext' | 'preventionPastDescription' | 'preventionNextDescription'
	> {
		const allTreatments = this.getPlayerMedicalTreatments(player.id);
		const preventionPast = this.findPastPrescription(allTreatments);
		const preventionNext = this.findNextPrescription(allTreatments);
		const preventionPastDescription = this.getPreventionTitle(preventionPast);
		const preventionNextDescription = this.getPreventionTitle(preventionNext);
		return { preventionPast, preventionPastDescription, preventionNext, preventionNextDescription };
	}

	private findPastPrescription(treatments: Treatment[]) {
		const today = moment();
		const yesterday = today.subtract(24, 'hour');
		const filtered = treatments.filter(
			({ complete, date }) => !complete && moment(date).isBetween(yesterday, today, null, '[]')
		);
		return filtered.length > 0 ? filtered : undefined;
	}

	private findNextPrescription(treatments: Treatment[]) {
		const today = moment();
		const tomorrow = today.add(24, 'hour');
		const filtered = treatments.filter(({ date }) => moment(date).isBetween(today, tomorrow, null, '[]'));
		return filtered.length > 0 ? filtered : undefined;
	}

	private mapGoScores(player: Player): { goScoresMap: Map<string, GOScore>; oldGoScoresMap: Map<string, GOScore> } {
		const thisWeek = Array.from(
			moment.range(this.toLocal.convert(this.from), this.toLocal.convert(this.to)).by('days')
		);
		const lastWeek = Array.from(
			moment
				.range(moment(this.toLocal.convert(this.from)).subtract(6, 'day'), moment(this.toLocal.convert(this.from)))
				.by('days')
		);
		const goScoresMap = new Map<string, GOScore>();
		const oldGoScoresMap = new Map<string, GOScore>();

		for (const day of thisWeek) {
			goScoresMap.set(
				moment(day).format(getMomentFormatFromStorage()),
				player.goScores.find(x => moment(this.toLocal.convert(x.date)).isSame(day, 'day'))
			);
		}

		for (const day of lastWeek) {
			oldGoScoresMap.set(
				moment(day).format(getMomentFormatFromStorage()),
				player.goScores.find(x => moment(this.toLocal.convert(x.date)).isSame(day, 'day'))
			);
		}

		return { goScoresMap, oldGoScoresMap };
	}

	private getPointColor(player: Player) {
		return this.availabilityService.getCurrentHealthStatusColor({
			...player,
			goScores: player.goScores.filter(x =>
				moment(x.date).isBetween(
					moment(this.toLocal.convert(this.to)).subtract(2, 'days').startOf('day'),
					moment(this.toLocal.convert(this.to)),
					undefined,
					'[]'
				)
			)
		});
	}

	private getLabel(items: any[], value, empty = '-') {
		if (!items) return empty;
		const field = items.find(f => f.value === value);
		if (field && field.label) return field.label;
		return empty;
	}

	private getPlayerTreatmentMetrics(type: TreatmentMetricType) {
		return type === 'physiotherapy' ? this.physiotherapyMetrics : this.secMetrics;
	}

	private getPreventionTitle(elements: any[] = []) {
		const start = '<ul>';
		const end = '</ul>';
		const middle = [];
		let res = null;
		if (elements.length > 0) {
			elements.forEach(element => {
				if ('exam' in element) {
					middle.push(
						'<li>',
						element.exam,
						' - ',
						moment(element.date).format(`${getMomentFormatFromStorage()} hh:mm`),
						'</li>'
					);
				} else {
					if (element.category === 'medicationSupplements') {
						middle.push(
							'<li>',
							getMedicationName(element.treatment, this.team),
							' - ',
							moment(element.date).format(`${getMomentFormatFromStorage()} hh:mm`),
							'</li>'
						);
					} else {
						try {
							if (!!element.treatment && element.treatment.length > 0) {
								middle.push(
									'<li>',
									element.treatment
										.map((treatment: string) =>
											treatment
												? !this.defaultMetrics.some(metric => treatment === metric.category)
													? this.getLabel(this.customMetrics, treatment, treatment)
													: this.translate.instant(
															`medical.prevention.treatments.${element.category.toLowerCase()}.${treatment}`
														)
												: ''
										)
										.join(', '),
									' - ',
									moment(element.date).format(`${getMomentFormatFromStorage()} hh:mm`),
									'</li>'
								);
							} else {
								middle.push(
									'<li>',
									this.translate.instant('medical.prevention.treatments.location.undefined'),
									'</li>'
								);
							}
						} catch (e) {
							// eslint-disable-next-line no-console
							console.error(element, e);
						}
					}
				}
			});
			res = start + middle.join('') + end;
		}

		return res;
	}

	updateList(player) {
		this.getPlayers()
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				error: (error: Error) => void this.error.handleError(error)
			});
	}

	updateAnamnesys(anamnesys: Anamnesys[]) {
		const player = { ...this.selected, anamnesys: anamnesys };
		this.playerApi
			.patchAttributes(player.id, player)
			.pipe(untilDestroyed(this))
			.subscribe(
				(res: Player) => {
					this.editService.editMode = false;
					this.getPlayers();
					this.notificationService.notify('success', 'clinicalRecords', 'alert.recordUpdated', false);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	getReport() {
		if (this.activeViewType.id === MedicalRecordsViewType.List) {
			this.getListReport();
		} else if (this.activeViewType.id === MedicalRecordsViewType.Card) {
			this.getCardReport();
		}
	}

	toggleFilters() {
		this.showFilters = !this.showFilters;
	}

	private getListReport() {
		const report: MedicalReportListViewPDF = {
			header: {
				title: this.translate.instant(`navigator.medicalRecords2`).toUpperCase(),
				subTitle: ''
			},
			metadata: {
				createdLabel: `${this.translate.instant('general.createdOn')} ${moment(new Date()).format(`${getMomentFormatFromStorage()} hh:mm`)}`
			},
			table: this.playersTableChild.getTable()
		};

		this.reportService.getReport(
			getPDFv2Path('medical-records', 'medical_records_list_view'),
			report,
			'',
			null,
			`${this.team.name} - Medical Record Profile Squad`
		);
	}

	private getCardReport() {
		const t = this.translate.instant.bind(this.translate);
		const toPlayer = (player: MedicalPreventionPlayer) => ({
			name: player.name,
			displayName: player.displayName,
			position: player.position,
			nationality: player.nationality,
			year: player.birthDate && moment(player.birthDate).format('YY'),
			readiness: this.getPointColor(player),
			icons: [
				player.preventionPast && { class: 'fas fa-close', color: 'red' },
				player.preventionNext && { class: 'fas fa-clock', color: 'black' },
				player.flaredUp && { class: 'fas fa-fire', color: 'var(--color-primary-500)' },
				player.expiration && { class: 'fas fa-file-certificate', color: 'black' },
				this.hasInjuries(player) && {
					class: this.injuryIconService.parsePlayer(player, new Date()).icon
				}
			].filter(Boolean)
		});
		const f = players => players.filter(Boolean);
		const categories = [
			...this.categories.map(({ name, players }) => ({
				title: t(`roles.categories.${name}${name === 'noPosition' ? '' : 's'}`),
				players: f(players).map(toPlayer)
			}))
		];
		const data = { categories };
		this.reportService.getReport('profile_squad', data, '', null, `${this.team.name} - Maintenance Profile Squad`);
	}

	private hasInjuries({ injuries = [] }: MedicalPreventionPlayer) {
		return (
			injuries.filter(({ currentStatus }) => currentStatus !== 'medical.infirmary.details.statusList.healed').length > 0
		);
	}

	private getColumnOptions(): ColumnVisibilityOption[] {
		const columnOptions: ColumnVisibilityOption[] = getColumnOptions(initialVisiblity);
		columnOptions.push({
			label: 'sidebar.tests',
			options: this.testColumns.map(column => ({ label: column, value: column })),
			model: undefined
		});
		columnOptions.push(getTreatmentColumns());
		return columnOptions;
	}

	private columnVisibilityToArray(visibleFields: MedicalPreventionColumnVisibility): string[] {
		return [...visibleFields.general, ...visibleFields.readiness, ...visibleFields.injury];
	}

	private getColor(val?: number): 'red' | 'yellow' | 'green' | 'lightgrey' {
		if (val) {
			if (val < 60) return 'red';
			if (val < 75) return 'yellow';
			return 'green';
		} else {
			return 'lightgrey';
		}
	}

	private getTodayTreatments(playerId: string): Treatment[] {
		const playerMedicalTreatments = this.getPlayerMedicalTreatments(playerId);
		const today = new Date();
		return ['SeC', 'physiotherapy', 'medicationSupplements'].reduce(
			(accumulator, treatmentCategory) => [
				...accumulator,
				...playerMedicalTreatments.filter(
					({ treatmentType, date }) => treatmentCategory === treatmentType && moment(date).isSame(today, 'day')
				)
			],
			[]
		);
	}

	private getExams({ injuries, _preventionExams }: Player): Treatment[] {
		const today = new Date();
		const exams: any[] = injuries.reduce(
			(accumulator, x) => [...accumulator, ...x._injuryExams.filter(({ date }) => moment(date).isSame(today, 'day'))],
			[]
		);
		return [...exams, ..._preventionExams.filter(({ date }) => moment(date).isSame(today, 'day'))];
	}

	private getFunctionalTests(tests: FunctionalTestInstance[]): FunctionalTestInstance[] {
		const today = new Date();
		return tests.filter(({ date }) => moment(date).isSame(today, 'day'));
	}

	private geTreatmentsByStaus(treatments: Treatment[]) {
		const treatmentsByStatus: TreatmentsByStatus = { done: [], undone: [], todo: [] };
		return treatments.reduce((status, treatment) => {
			status[this.getTreatmentStatus(treatment)].push(treatment);
			return status;
		}, treatmentsByStatus);
	}

	private getTreatmentStatus(element: Treatment): TreatmentStatus {
		if (element.complete) return 'done';
		return moment(element.date).isBefore(moment()) ? 'undone' : 'todo';
	}

	onClickPlayer(player: MedicalPreventionPlayer) {
		this.getSorenessForBodyChart(player.wellnesses);
		this.selected = player;
		this.searchDropdownElements = this.getSearchDropdownElements(this.filteredPlayers);
	}

	private getSorenessForBodyChart(wellnesses: Wellness[]) {
		const tempSorenessList: Injury[] = [];
		for (const wellness of wellnesses) {
			if (wellness?.locations && wellness.locations.length > 0) {
				wellness.locations.forEach((zone: string) => {
					tempSorenessList.push({
						location: `medical.infirmary.details.location.${zone}`,
						issue: ISSUE_SORENESS,
						currentStatus: 'medical.infirmary.details.statusList.soreness'
					} as any);
				});
			}
		}
		this.sorenessInjuries = tempSorenessList;
	}

	getSearchDropdownElements(persons: any[]): DropdownElement[] {
		return persons.filter(({ id }) => id !== this.selected.id).map(player => ({ player }));
	}

	onSelectFromDropdown(value: DropdownElement) {
		this.onClickPlayer(value.player);
	}

	downloadCsv() {
		const treatmentColumns = getTreatmentColumns().options.map(({ value }) => value);
		const csv = this.getMedicalRecordReportCSV(
			this.filteredPlayers,
			this.visibleColumns.filter(col => !['downloadUrl', 'injuries'].includes(col)),
			this.testColumns,
			treatmentColumns
		);
		const result = Papa.unparse(csv, {});
		const filename = `Medical Records - ${moment(new Date()).format(getMomentFormatFromStorage())}.csv`;
		const file = new Blob([result], { type: 'text/csv;charset=utf-8' });
		saveAs(file, filename);
	}

	getMedicalRecordReportCSV(
		players: MedicalPreventionPlayer[],
		columns: string[],
		testColumns: string[] = [],
		treatmentColumns: string[] = []
	): MedicalRecordsReportCSV[] {
		return sortBy(players, 'displayName').map(player => {
			const csvRow = {};
			columns.forEach(key => {
				switch (key) {
					case 'age':
						csvRow[key] = this.agePipe.transform(player.birthDate);
						break;
					case 'injury':
						// eslint-disable-next-line no-case-declarations
						const { tooltip, icon } = this.injuryIconService.parsePlayer(player, undefined);
						csvRow[key] = icon.length > 0 ? parseHtmlStringToText(tooltip.replace('</li><li>', '; ')) : '';
						break;
					case '_chronicInjuries':
						csvRow[key] = parseChronicInjuries(player[key], this.translate);
						break;
					case 'expiration':
						csvRow[key] = moment(player[key]).format(getMomentFormatFromStorage());
						break;
					default:
						csvRow[key] = player[key];
				}
			});
			testColumns.forEach(key => {
				csvRow[key] = player[key] ? player[key].currentValue : '';
			});
			treatmentColumns.forEach(key => {
				// eslint-disable-next-line no-case-declarations
				const treatments = [];
				// eslint-disable-next-line no-case-declarations
				const undone = player[key].undone;
				// eslint-disable-next-line no-case-declarations
				const done = player[key].done;
				// eslint-disable-next-line no-case-declarations
				const todo = player[key].todo;
				if (undone?.length > 0) treatments.push(this.treatmentsOfTheDayTooltipPipe.transform(undone));
				if (done?.length > 0) treatments.push(this.treatmentsOfTheDayTooltipPipe.transform(done));
				if (todo?.length > 0) treatments.push(this.treatmentsOfTheDayTooltipPipe.transform(todo));
				csvRow[key] = treatments.join('; ');
			});
			return csvRow;
		});
	}

	handleFilterStateUpdated(event: FilterEmitter) {
		setTimeout(() => {
			const state = event.state;
			this.filtersForTemplate = getFiltersForTemplate(state);
			this.filterPlayers(event.filteredItems);
			this.showFilterTemplateSelection = true;
		}, 10);
	}

	handleFilterTemplateChanged(event: TeamTableFilterTemplate) {
		setTimeout(() => {
			this.filterOptions = getUpdatedFilterOptions(event, this.filterOptions);
			this.visibleColumns = event.visibility;
			this.loadColumnOptions();
		}, 10);
	}

	private loadColumnOptions() {
		this.columnOptions = this.getColumnOptions().map((column: ColumnVisibilityOption) => ({
			...column,
			model: (column.model || []).filter((model: string) => this.visibleColumns.includes(model))
		}));
	}
}

interface MedicalRecordsReportCSV {
	[key: string]: any;
}

interface MedicalReportListViewPDF extends PdfBase {
	table: PdfMixedTable;
}

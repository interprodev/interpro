import { animate, state, style, transition, trigger } from '@angular/animations';
import { DecimalPipe } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Injector, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AuthSelectors, CurrentTeamService, SelectableTeam } from '@iterpro/shared/data-access/auth';
import {
	AlreadyImportedPlayer,
	Attachment,
	AvailableProviderIdField,
	ClubSeason,
	ClubTransferApi,
	Customer,
	SearchPlayerDropdownElement,
	ExtendedPlayerScouting,
	LoopBackAuth,
	MixedType,
	NotificationApi,
	ParsedInStatPlayer,
	PdfBase,
	PdfMixedTable,
	Player,
	PlayerAttributesEntry,
	PlayerDescriptionEntry,
	PlayerReportEntriesEmitter,
	PlayerScouting,
	PlayerScoutingApi,
	ProviderType,
	ReportDataAvg,
	ScoutingColumnVisibility,
	ScoutingGame,
	ScoutingGameInit,
	ScoutingLineup,
	ScoutingLineupApi,
	ScoutingSettings,
	TableColumn,
	TeamSeason,
	TeamTableFilterTemplate,
	TransferWindow,
	attributeAvgCategory,
	PlayerAttribute,
	ClubTransfer
} from '@iterpro/shared/data-access/sdk';
import { ColumnVisibilityOption } from '@iterpro/shared/ui/components';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import {
	AlertParams,
	AlertService,
	AzureStoragePipe,
	BlockUiInterceptorService,
	EditModeService,
	ErrorService,
	ProviderIntegrationService,
	ProviderTypeService,
	ReportService,
	ScoutingGamesService,
	SportType,
	completeWithAdditionalFields,
	copyValue,
	getCategoryValues,
	getColorClass,
	getColumnVisibility,
	getFieldPosition,
	getId,
	getLimb,
	getMappedStandardAttributesForColumns,
	getMomentFormatFromStorage,
	getPDFv2Path,
	getPlayerAttributesEntryValue,
	getPlayerLatestScenarioInfo,
	getPositionCategories,
	getReportColumns,
	getScoutingColumnOptions,
	getSpinnerColor,
	getUniqueReportDataArrayColumns,
	parseHtmlStringToText,
	sortByDate,
	sortByDateDesc,
	sortByName,
	getAvgValueForSpinner,
	getTeamSettings,
	userHasPermission,
	getTeamsPlayerAttributes, isBase64Image
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { assign, chunk, cloneDeep, differenceWith, isEqual, last, omit, uniq } from 'lodash';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import * as Papa from 'papaparse';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { Observable, Observer, forkJoin, of } from 'rxjs';
import { catchError, first, map, switchMap } from 'rxjs/operators';
import { RootStoreState } from 'src/app/+state/root-store.state';
import { FilterEmitter, FilterOptions } from 'src/app/shared/table-filter/models/table-filter.model';
import { getFiltersForTemplate, getUpdatedFilterOptions } from 'src/app/shared/table-filter/utils/table-filter.util';
import { PlayerRoleCategory } from '../my-team/my-team.component';
import { ScoutingService } from './_services/scouting.service';
import { SaveScoutingPlayerEmitter } from './scouting-player/scouting-player.component';
import { ScoutingTableComponent } from './scouting-table-view/scouting-table-view.component';
import { ToTransferResult } from './to-transfer-dialog/to-transfer-dialog.type';

const moment = extendMoment(Moment);

enum HeaderState {
	OVERVIEW,
	ATTRIBUTES_OR_REPORTS,
	CAREER,
	NOTES_OR_GAMES,
	NOTES
}

enum ScoutingViewType {
	CardView = 'cardView',
	TableView = 'tableView',
	FieldView = 'fieldView',
	CalendarView = 'calendarView',
	ReportsPerScoutView = 'reportsPerScoutView'
}

const initialVisibility: ScoutingColumnVisibility = {
	general: ['downloadUrl', 'displayName', 'position', 'birthDate', 'nationality', 'currentTeam', 'creationDate', 'birthYear'],
	attributes: ['foot'],
	deal: ['feeRange', 'wageRange'],
	reportData: ['prognosis']
};

@UntilDestroy()
@Component({
	selector: 'iterpro-scouting',
	templateUrl: './scouting.component.html',
	styleUrls: ['./scouting.component.scss'],
	animations: [
		trigger('toggleState', [
			state(
				'false',
				style({
					height: '0px'
				})
			),
			state(
				'true',
				style({
					height: '*'
				})
			),
			transition('true => false', animate('300ms cubic-bezier(0.86, 0, 0.07, 1)')),
			transition('false => true', animate('300ms cubic-bezier(0.86, 0, 0.07, 1)'))
		])
	],
	providers: [DecimalPipe, ShortNumberPipe]
})
export class ScoutingComponent extends EtlBaseInjectable implements OnInit {
	@Output() csvUploadEmitter: EventEmitter<any> = new EventEmitter<any>();
	@ViewChild('inputjson', { static: false })
	fileInput: ElementRef;

	players: PlayerScouting[];
	filterPlayer = '';

	selectedPlayer: ExtendedPlayerScouting;
	selectedPlayerTabIndex: number;
	filteredPlayers: ExtendedPlayerScouting[] = [];

	activeIndex: HeaderState = HeaderState.OVERVIEW;
	gameToEdit: ScoutingGameInit;
	showArchivedPlayers = false;
	visible = false;
	playerToArchive: ExtendedPlayerScouting;
	notes: any[];

	discarded: boolean;
	attributesEdit = false;
	form: NgForm;
	seasons: TeamSeason[];
	showFilters = false;

	thirdPartyPlayerSearchDialogVisible: boolean;
	alreadyImportedPlayers: AlreadyImportedPlayer[] = [];
	clubSeasons: ClubSeason[];
	clubPlayers: Player[];
	clubScoutingPlayers: PlayerScouting[];
	scoutCustomers: Customer[] = [];
	transferDialog = false;
	visibleAddPlayerDialog: boolean;

	scaffoldPlayerOrigin: ExtendedPlayerScouting[];

	games: ScoutingGame[] = [];
	isPlayerDescriptionTipss: boolean;
	isWatfordGameReport: boolean;
	isGameReportTipss: boolean;
	isSwissGameReport: boolean;

	canImportPlayers = false;
	filterOptions: FilterOptions<ExtendedPlayerScouting>;
	readonly filterOptionsDefault: FilterOptions<ExtendedPlayerScouting> = {
		archivedStatus: {
			label: 'admin.contracts.currentStatus',
			type: 'multi',
			translateLabelPrefix: '',
			defaultSelection: ['bonus.active', 'bonus.archived']
		},
		currentTeam: { label: 'profile.team', type: 'multi' },
		birthYear: { label: 'profile.overview.birthYear', type: 'multi' },
		nationality: {
			label: 'profile.overview.nationality',
			type: 'multi',
			translateLabelPrefix: 'nationalities'
		},
		nationalityOrigin: {
			label: 'profile.overview.nationalityOrigins',
			type: 'multi',
			translateLabelPrefix: ''
		}
	};
	readonly filterOptionsWage: FilterOptions<ExtendedPlayerScouting> = {
		feeRange: { label: 'profile.overview.fee', type: 'multi' },
		wageRange: { label: 'profile.overview.wage', type: 'multi' }
	};
	filterOptionsAdditional: FilterOptions<ExtendedPlayerScouting> = {
		position: { label: 'profile.position', type: 'multi' }
	};
	readonly filterOptionsAttributes: FilterOptions<ExtendedPlayerScouting> = {
		offensive: { label: 'profile.attributes.offensive', type: 'multi' },
		defensive: { label: 'profile.attributes.defensive', type: 'multi' },
		attitude: { label: 'profile.attributes.attitude', type: 'multi' }
	};
	readonly filterOptionsReportDataHistory: FilterOptions<ExtendedPlayerScouting> = {
		lastGameReportDate: { label: 'scouting.gameReport.lastReportDate', type: 'datetime' },
		lastGameReportAuthor: { label: 'scouting.gameReport.lastReportAuthor', type: 'multi' }
	};
	columnOptions: ColumnVisibilityOption[] = [];
	visibleColumns: string[] = this.columnVisibilityToArray(initialVisibility);

	isAddPlayerMenuOpened = false;
	importLimit: number;
	provider: ProviderType;

	private originalPlayers: PlayerScouting[];
	private uploadedPlayers: any[] = [];

	private tempPlayer: ExtendedPlayerScouting;
	private originalPlayer: ExtendedPlayerScouting; // check handleScoutingNotification commented code

	private fileReader: FileReader;

	private providerIdField: AvailableProviderIdField;

	@ViewChild('scoutingTable', { static: false }) scoutingTable: ScoutingTableComponent;
	scenarios: ScoutingLineup[] = [];
	tempScenarios: ScoutingLineup[] = [];
	diffScenarios: ScoutingLineup[] = [];
	swap: ExtendedPlayerScouting;
	scenarioRoles = false;
	archiveLimit: number;
	searchDropdownElements: SearchPlayerDropdownElement[];
	sportType: SportType = 'football';
	categories: PlayerRoleCategory[];
	categoryLabelForSkeletons: string[];
	archived: { players: ExtendedPlayerScouting[] } = { players: [] };
	reportDataColumns: ReportDataAvg[] = [];
	standardAttributes: PlayerAttribute[];
	isScoutingPlayersLoading = true;
	isScoutingAdmin: boolean;
	teamList: SelectableTeam[];
	showFilterTemplateSelection = false;
	filtersForTemplate: { [s: string]: unknown };

	addPlayerMenuItems: MenuItem[] = [];
	tabViewTypes: MenuItem[] = [
		{
			id: 'cardView',
			label: 'admin.squads.cardView',
			icon: 'fas fa-id-card',
			command: () => this.activeViewType = this.getViewType(ScoutingViewType.CardView)
		},
		{
			id: 'tableView',
			label: 'admin.squads.tableView',
			icon: 'fas fa-list',
			command: () => this.activeViewType = this.getViewType(ScoutingViewType.TableView)
		},
	];
	activeViewType: MenuItem;
	viewTypes = ScoutingViewType;

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
		private route: ActivatedRoute,
		public editService: EditModeService,
		private playerScoutingApi: PlayerScoutingApi,
		private scoutingGamesService: ScoutingGamesService,
		private error: ErrorService,
		private translate: TranslateService,
		private notificationService: AlertService,
		private auth: LoopBackAuth,
		private confirmationService: ConfirmationService,
		private currentTeamService: CurrentTeamService,
		private scoutingService: ScoutingService,
		private azurePipe: AzureStoragePipe,
		private notificationApi: NotificationApi,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private clubTransferApi: ClubTransferApi,
		private scoutingLineupApi: ScoutingLineupApi,
		private providerIntegrationService: ProviderIntegrationService,
		private reportService: ReportService,
		private store$: Store<RootStoreState>,
		providerService: ProviderTypeService,
		injector: Injector
	) {
		super(injector);
		const lastViewType = localStorage.getItem('lastScoutingViewType');
		if (lastViewType) {
			this.activeViewType = this.getViewType(JSON.parse(lastViewType) as ScoutingViewType);
		}
		this.store$
			.select(AuthSelectors.selectSportType)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (type: SportType) => {
					this.sportType = type;
					this.categoryLabelForSkeletons = getPositionCategories(this.sportType).map((roleName: string) => roleName);
				}
			});
		this.waitInitializationProviders().subscribe({
			next: () => {
				this.openArchiveDialog = this.openArchiveDialog.bind(this);
				this.openDeleteDialog = this.openDeleteDialog.bind(this);
				const team = this.currentTeamService.getCurrentTeam();
				this.isScoutingAdmin = this.checkIfIsScoutingAdmin();
				this.generateTabViews();
				this.provider = providerService.getProviderType(team);
				this.canImportPlayers = this.provider !== 'Dynamic' || team.club.b2cScouting;
				this.providerIdField = this.provider !== 'Dynamic' ? this.etlPlayerService.getProviderIdField() : null;
			},
			error: (error: Error) => void this.error.handleError(error)
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
		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: () => this.initComponent()
			});
		this.store$
			.select(AuthSelectors.selectTeamList)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: response => {
					this.teamList = response;
					this.setAddPlayerMenuItems();
				}
			});
	}

	private generateTabViews() {
		this.tabViewTypes = [{
			id: 'cardView',
			label: 'admin.squads.cardView',
			icon: 'fas fa-id-card',
			visible: this.isScoutingAdmin,
			command: () => this.activeViewType = this.getViewType(ScoutingViewType.CardView)
		},
		{
			id: 'tableView',
			label: 'admin.squads.tableView',
			icon: 'fas fa-list',
			visible: this.isScoutingAdmin,
			command: () => this.activeViewType = this.getViewType(ScoutingViewType.TableView)
		},
		{
			id: 'fieldView',
			label: 'admin.squads.fieldView',
			icon: 'fas fa-futbol',
			visible: this.canUserSeeThis(),
			command: () => this.activeViewType = this.getViewType(ScoutingViewType.FieldView)
		},
		{
			id: 'calendarView',
			label: 'admin.squads.calendarView',
			icon: 'fas fa-calendar',
			command: () => this.activeViewType = this.getViewType(ScoutingViewType.CalendarView)
		},
		{
			id: 'reportsPerScoutView',
			label: 'player.scouting.calendar.recap',
			icon: 'fas fa-clipboard',
			visible: this.isScoutingAdmin,
			command: () => this.activeViewType = this.getViewType(ScoutingViewType.ReportsPerScoutView)
		}];
	}

	private getViewType(id: ScoutingViewType): MenuItem {
		return this.tabViewTypes.find(({ id: tabId }) => tabId === id);
	}

	private listenForRouterParams() {
		this.route.paramMap.pipe(first()).subscribe((params: ParamMap) => {
			const gameId = params.get('gameId');
			const playerId = params.get('playerId');
			const tabIndex = params.get('tabIndex');
			const scenarioId = params.get('scenarioId');
			if (gameId) {
				this.activeViewType = this.tabViewTypes.find(({ id }) => id === 'calendarView');
				setTimeout(() => {
					this.scoutingGamesService.getCompletedGame(gameId);
				}, 300);
			} else if (playerId) {
				const player = this.players.find(({ id }) => id === playerId);
				this.onClickPlayer(player, tabIndex ? Number(tabIndex) : undefined);
			} else if (scenarioId) {
				this.scenarios = this.scenarios.filter(({ id }) => id === scenarioId);
				this.setViewType(ScoutingViewType.FieldView);
			}
		});
	}

	private setAddPlayerMenuItems() {
		this.addPlayerMenuItems = [
			{
				label: this.translate.instant('profile.player'),
				command: () => this.openAddPlayerDialog()
			}
		];
		if (this.canImportPlayers) {
			this.addPlayerMenuItems.push({
				label: this.translate.instant('playerFrom' + this.provider),
				command: () => this.openThirdPartySearchDialog()
			});
		}
	}

	openAddPlayerDialog() {
		this.visibleAddPlayerDialog = true;
	}

	closeAddPlayerDialog() {
		this.visibleAddPlayerDialog = false;
	}

	addNewPlayer({ name, surname }) {
		this.playerScoutingApi
			.create({
				archived: false,
				archivedStatus: 'bonus.active',
				clubId: this.auth.getCurrentUserData().clubId,
				teamId: this.auth.getCurrentUserData().currentTeamId,
				birthDate: moment('01/01/1990', 'dd/MM/YYYY').toDate(),
				name,
				lastName: surname,
				displayName: name + ' ' + surname,
				contractDetails: {
					agent: '',
					agentPhone: '',
					agentEmail: '',
					owner: '',
					currentlyPlaying: '',
					league: '',
					nation: '',
					contractType: '',
					wage: '',
					dateTo: null,
					marketValue: ''
				},
				address: {
					street: '',
					city: '',
					zipCode: '',
					state: '',
					nation: ''
				},
				domicile: {
					street: '',
					city: '',
					zipCode: '',
					state: '',
					nation: ''
				},
				currentStatus: 'inTeam',
				federalMembership: [],
				_statusHistory: [],
				recommended: 0,
				lastAuthor: this.auth.getCurrentUserId(),
				lastUpdate: moment().toDate()
			})
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (player: any) => {
					this.visibleAddPlayerDialog = false;
					this.players = [...this.players, player];
					this.scaffoldPlayerOrigin = this.players;
					this.filterPlayers(this.scaffoldPlayerOrigin);
					this.onClickPlayer(player);
				},
				error: (error: Error) => void this.error.handleError(error)
			});
	}

	private removeAdditionalFields(player: ExtendedPlayerScouting): PlayerScouting {
		const fieldsToRemove: string[] = [
			'_id',
			'birthYear',
			'wageRange',
			'feeRange',
			'associatedPlayerName',
			'offensive',
			'defensive',
			'attitude',
			'archivedStatus',
			'performance',
			'potential',
			'prognosis',
			'prognosisColor',
			'performanceColor',
			'potentialColor',
			'overallGrade',
			'performanceGrade',
			'potentialFor',
			'potentialGrade',
			'recommendation',
			'reportDataAvg',
			'reportDataAvgFlatted',
			'lastGameReportDate',
			'lastGameReportAuthor',
			'gameReportsNumber',
			'lastGameReportTeams',
			'selectedAttributePlayerDescription',
			'selectedAttributeDate',
			'selectedAttributeAuthor',
			'playerAttributes',
			'gameReports',
			'tipssPersonality',
			'tipssInsights',
			'prognosisTooltip',
			'tipssSpeed',
			'tipssInsight',
			'tipssStructure',
			'tipssTechnique',
			'tipssTotal',
			'prognosisTooltip',
			'performancePerformance',
			'performanceTotal',
			'potentialPotential'
		];

		// Use omit to create a new object with specified fields removed
		// @ts-ignore
		return omit(player, fieldsToRemove);
	}

	onSavePlayer(player: ExtendedPlayerScouting) {
		const selectedId = getId(player);
		const propertyPlayerToSave = this.removeAdditionalFields(player);
		let obs = [
			this.playerScoutingApi.patchAttributes(selectedId, {
				...propertyPlayerToSave,
				lastUpdate: new Date(),
				lastAuthor: this.auth.getCurrentUserId()
			})
		];

		obs = [...obs, ...this.diffScenarios.map(scenario => this.scoutingLineupApi.updateAttributes(scenario.id, scenario))];
		forkJoin(obs)
			.pipe(
				first(),
				map(() => this.requestPlayers()),
				untilDestroyed(this)
			)
			.subscribe({
				next: () => {
					this.notificationService.notify('success', 'Scouting', 'alert.recordUpdated', false);
					this.handleScoutingNotification(player);
					this.handleCheckVideoClipsPlayer(player);
					this.editService.editMode = false;
					this.diffScenarios = [];
					this.discarded = false;
					this.visible = false;
					this.updatePlayerDone(player);
				},
				error: (error: Error) => void this.error.handleError(error)
			});
	}

	private updatePlayerDone(player: PlayerScouting) {
		this.players = this.players.map((playerScouting: PlayerScouting) => {
			if (playerScouting.id === player.id) {
				return player;
			}
			return playerScouting;
		});
		this.scaffoldPlayerOrigin = this.players;
		this.filterPlayers(this.scaffoldPlayerOrigin);
	}

	hasCustomSaveButton() {
		return this.isOverviewTabActive() || this.isAttributeTabActive();
	}

	isOverviewTabActive() {
		return this.activeIndex === HeaderState.OVERVIEW;
	}

	isAttributeTabActive() {
		return !this.scenarioRoles && this.activeIndex === HeaderState.ATTRIBUTES_OR_REPORTS;
	}

	goToCalendar(game: ScoutingGameInit) {
		this.activeViewType = this.tabViewTypes.find(({ id }) => id === 'calendarView');
		this.gameToEdit = game;
		this.selectedPlayer = undefined;
	}

	private handleCheckVideoClipsPlayer(player: ExtendedPlayerScouting) {
		// TODO MATTEO
		/*		const tabName = this.getTabNameFromIndex();
		const diffsVideos = differenceWith(player._videoClips, this.tempPlayer._videoClips, isEqual);
		const hasMissingStreamingUrl = this.hasMissingStreamingUrl(player._videoClips);
		if (
			this.scenarioRoles &&
			tabName === 'Reports' &&
			((diffsVideos && diffsVideos.length > 0) || hasMissingStreamingUrl)
		) {
			this.blockUiInterceptorService
				.disableOnce(this.playerScoutingApi.checkForVideoClips(player.id))
				.pipe(first(), untilDestroyed(this))
				.subscribe({
					next: ({ _videoClips }: ExtendedPlayerScouting) => {
						player._videoClips = _videoClips;
					},
					error: (error: Error) => void this.error.handleError(error)
				});
		}*/
	}

	private hasMissingStreamingUrl(videoClips: Attachment[] = []) {
		return videoClips.some(
			({ downloadUrl, streamingUrl }) => !!downloadUrl && (!streamingUrl || streamingUrl !== `${downloadUrl}_mobile.mp4`)
		);
	}

	private handleScoutingNotification(player: PlayerScouting) {
		const tabName = this.getTabNameFromIndex();
		const customer = this.auth.getCurrentUserData();
		const customerString = `${customer.firstName} ${customer.lastName}`;
		const messages = [];

		if (tabName && tabName === 'Notes') {
			const diffsNotes = differenceWith(player.notesThreads, this.tempPlayer.notesThreads, isEqual).length;
			if (diffsNotes) {
				const ovMessages = `$${customerString}$|$${player.displayName}$|notification.message.scoutingMessage`;
				messages.push(ovMessages);
			}
		}

		if (tabName && tabName === 'Attributes') {
			const attrNotes = `$${customerString}$|$${player.displayName}$|notification.message.scoutingUpdateTabAttributes`;
			messages.push(attrNotes);
		}
		if ((!tabName && this.activeIndex === HeaderState.OVERVIEW) || (tabName && tabName === 'Overview')) {
			const ovNot = `$${customerString}$|$${player.displayName}$|notification.message.scoutingUpdateTabOverview`;
			messages.push(ovNot);
		}
		this.notificationApi
			.checkNotificationForPlayerScouting(getId(player), messages)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				error: (error: Error) => void this.error.handleError(error)
			});
	}

	private getTabNameFromIndex() {
		if (this.activeIndex === HeaderState.OVERVIEW) return 'Overview';
		if (this.activeIndex === HeaderState.ATTRIBUTES_OR_REPORTS) return this.scenarioRoles ? 'Reports' : 'Attributes';
		if (!this.checkIfIsScoutingAdmin() && this.activeIndex === HeaderState.NOTES_OR_GAMES) return 'Notes';
		if (this.checkIfIsScoutingAdmin() && this.activeIndex === HeaderState.NOTES) return 'Notes';
		return null;
	}

	private handleScoutingNotificationPlayersCreated(players) {
		const customer = this.auth.getCurrentUserData();
		const customerString = customer.firstName + ' ' + customer.lastName;
		const notifications$ = players.map(p => {
			const ovCreated = '$' + customerString + '$|$' + p.displayName + '$|notification.message.scoutingPlayerCreated';
			return this.notificationApi.checkNotificationForPlayerScouting(getId(p), [ovCreated]).pipe(
				first(),
				untilDestroyed(this),
				catchError(error => {
					return of({ severity: 'error', summary: 'Scouting', sticky: false, params: p.displayName });
				}),
				map(res => ({
					severity: 'success',
					summary: 'Scouting',
					detail: 'scouting.playerImported',
					sticky: false,
					params: p.displayName
				}))
			);
		});
		forkJoin(notifications$)
			.pipe(first(), untilDestroyed(this))
			.subscribe((alerts: AlertParams[]) => this.notificationService.notifyAll(alerts));
	}

	private setArchivedPlayers() {
		this.archived.players = this.players.filter(({ archived }) => !!archived);
	}

	getProfileUrl({ downloadUrl }: { downloadUrl: string }): string {
		return !!downloadUrl && isBase64Image(downloadUrl) ? downloadUrl : this.azurePipe.transform(downloadUrl);
	}

	onCloseProfile() {
		this.selectedPlayer = null;
		this.activeIndex = 0;
		this.requestPlayers();
	}

	onEditPlayer() {
		this.originalPlayer = cloneDeep(this.selectedPlayer);
		this.tempPlayer = copyValue(this.selectedPlayer);
		this.tempScenarios = cloneDeep(this.scenarios);
		this.editService.editMode = true;
		this.discarded = false;
	}

	onTabChange({ index }) {
		this.activeIndex = index;
		if (
			(this.checkIfIsScoutingAdmin() && this.activeIndex === HeaderState.NOTES) ||
			(!this.checkIfIsScoutingAdmin() && this.activeIndex === HeaderState.NOTES_OR_GAMES)
		) {
			// when saving a note the player is saved with this.onSavePlayer(player);
			// if tempPlayer isn't initialized then savePlayer function will break
			this.tempPlayer = copyValue(this.selectedPlayer);
		}
	}

	onDiscard() {
		this.selectedPlayer = copyValue(this.tempPlayer);
		this.scenarios = cloneDeep(this.tempScenarios);
		this.diffScenarios = [];
		this.editService.editMode = false;
		this.discarded = true;
	}

	closeAttributesEdit() {
		this.attributesEdit = false;
	}

	openArchiveDialog(player: ExtendedPlayerScouting) {
		this.notes = null;
		this.playerToArchive = player;
		this.visible = true;
	}

	saveArchived(player: ExtendedPlayerScouting) {
		this.tempPlayer = player;
		player.archived = true;
		player.archivedDate = moment().toDate();
		// player.archivedMotivation = this.notes;
		this.onSavePlayer(player);
	}

	openActivateDialog(player: ExtendedPlayerScouting) {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.edit'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				this.saveActivate(player);
			}
		});
	}

	private saveActivate(player: ExtendedPlayerScouting) {
		this.tempPlayer = player;
		player.archived = false;
		player.archivedDate = null;
		this.onSavePlayer(player);
	}

	discard() {
		this.visible = false;
	}

	onSavePlayerAttributes(event: SaveScoutingPlayerEmitter) {
		this.selectedPlayer = event.player;
		event.askForConfirmation ? this.confirmEdit(event.player) : this.onSavePlayer(event.player);
	}

	confirmPlayerFormSubmit(f: NgForm) {
		this.form = f;
		this.confirmEdit(this.selectedPlayer);
	}

	private confirmEdit(player: ExtendedPlayerScouting) {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.edit'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				this.onSavePlayer(player);
			}
		});
	}

	onChangeStar(player: ExtendedPlayerScouting, event: number) {
		player.recommended = event;
		this.onSavePlayer(player);
	}

	toggleFilters() {
		this.showFilters = !this.showFilters;
	}

	resetFilters() {
		this.players = this.checkIfIsScoutingAdmin() ? [...this.originalPlayers] : [...this.originalPlayers].filter(({ id }) => id); // TODO: maybe remove? (in requestPlayers() too)

		this.scaffoldPlayerOrigin = this.players;
		this.updateTableOptions();
	}

	changeViewableColumns(visibleColumns: string[]) {
		this.visibleColumns = visibleColumns;
	}

	setViewType(viewType: ScoutingViewType) {
		if (viewType === ScoutingViewType.TableView && this.activeViewType.id === ScoutingViewType.FieldView) {
			this.loadColumnOptions();
		}
		this.activeViewType = this.tabViewTypes.find(({ id }) => id === viewType);
		this.gameToEdit = undefined;
		// this.cd.detectChanges();
	}

	private loadColumnOptions() {
		const columns = getReportColumns(this.reportDataColumns, this.standardAttributes, this.isSwissGameReport, false, this.sportType);
		const actualVisibility: ScoutingColumnVisibility = getColumnVisibility(columns, this.visibleColumns);
		this.columnOptions = getScoutingColumnOptions(
			actualVisibility,
			this.reportDataColumns,
			this.standardAttributes,
			this.isSwissGameReport,
			this.isWatfordGameReport,
			this.sportType
		);
	}

	openTransferDialog() {
		this.transferDialog = true;
	}

	closeTransferDialog() {
		this.transferDialog = false;
	}

	sendToTransfer({ player, transferWindows }: { player: ExtendedPlayerScouting; transferWindows: ToTransferResult[] }) {
		const obs = transferWindows.map(transferWindow => {
			const clubTransfer = new ClubTransfer({
				personId: player.id,
				personType: 'PlayerScouting',
				isPurchase: true,
				clubId: player.clubId,
				offer: 0,
				currentStatus: 'recommended',
				transferWindowId: transferWindow.id,
				clubSeasonId: transferWindow.clubSeasonId,
				teamId: this.auth.getCurrentUserData().currentTeamId
			});
			return this.clubTransferApi.create(clubTransfer);
		});

		forkJoin(obs)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.onSavePlayer(player);
					this.closeTransferDialog();
				},
				error: (error: Error) => void this.error.handleError(error)
			});
	}

	openThirdPartySearchDialog() {
		this.thirdPartyPlayerSearchDialogVisible = true;
	}

	onSelectThirdPartySearchDialog(thirdPartyPlayers: any[]) {
		this.thirdPartyPlayerSearchDialogVisible = false;
		if (thirdPartyPlayers.some(({ img, transferValue, careerData }) => !careerData || !transferValue || !img)) {
			this.providerIntegrationService
				.getPlayerAdditionalInfo(thirdPartyPlayers.filter(({ img, transferValue, careerData }) => !careerData || !transferValue || !img))
				.pipe(first(), untilDestroyed(this))
				.subscribe({
					next: ({ players }: { players: any[] }) => {
						const providerShortIdField = this.etlPlayerService.getProviderShortIdField();
						players.forEach(detailedPlayer => {
							const i = thirdPartyPlayers.findIndex(
								({ [providerShortIdField]: providerIdValue }) => providerIdValue === detailedPlayer[this.providerIdField]
							);
							assign(thirdPartyPlayers[i], detailedPlayer);
						});
						this.wrapPlayerFromThirdParty(thirdPartyPlayers);
					},
					error: (error: Error) => void this.error.handleError(error)
				});
		} else {
			this.wrapPlayerFromThirdParty(thirdPartyPlayers);
		}
	}

	downloadPlayersReportPdf() {
		// const pages = Math.ceil(this.scoutingTable.table._totalRecords / this.scoutingTable.table._rows);
		const page = Math.floor(this.scoutingTable.table._first / this.scoutingTable.table._rows);
		const players: ExtendedPlayerScouting[] = chunk(this.scoutingTable.getData(), 200)[page];
		const columns: string[] = [...this.visibleColumns];
		const hasCustomColumnSelection = columns.length > 0;
		const columnDescriptors: Array<Required<Pick<TableColumn, 'header' | 'type' | 'field' | 'align'>>> = [];
		const cols = getReportColumns(this.reportDataColumns, this.standardAttributes, this.isSwissGameReport, false, this.sportType);
		cols.forEach(({ field, header, type, align }) => {
			if (!hasCustomColumnSelection || columns.includes(field)) {
				columnDescriptors.push({ type, field, align, header });
			}
		});
		const table: PdfMixedTable = {
			headers: columnDescriptors.map(({ field, header, type, align }) => {
				return {
					label: header ? this.translate.instant(header) : '',
					mode: 'text',
					alignment: align
				};
			}),
			rows: players.map((player: ExtendedPlayerScouting) => {
				return columnDescriptors.map((column: Required<Pick<TableColumn, 'type' | 'field' | 'align'>>) => {
					const item = this.getExportedValue(column, player);
					return {
						...item,
						alignment: column.align ? column.align : 'center'
					};
				});
			})
		};
		const report: ScoutingTableViewPDF = {
			header: {
				title: this.translate.instant('Scouting Players').toUpperCase(),
				subTitle: 'TABLE VIEW'
			},
			metadata: {
				createdLabel: `${this.translate.instant('general.createdOn')} ${moment(new Date()).format(`${getMomentFormatFromStorage()} hh:mm`)}`
			},
			table
		};
		this.reportService.getReport(getPDFv2Path('scouting', 'scouting_players_table_view'), report, '', null, 'Scouting Players');
	}

	downloadPlayerReportCsv() {
		const players: ExtendedPlayerScouting[] = this.filteredPlayers;
		const columns: string[] = [...this.visibleColumns];
		const hasCustomColumnSelection = columns.length > 0;

		const columnDescriptors: Array<Required<Pick<TableColumn, 'type' | 'field' | 'align'>>> = [];
		const headerObject: Partial<ExtendedPlayerScouting> = {};
		getReportColumns(this.reportDataColumns, this.standardAttributes, this.isSwissGameReport, false, this.sportType).forEach(
			({ field, header, type, align }) => {
				if (type !== 'image') {
					if (!hasCustomColumnSelection) {
						columns.push(field);
					}
					if (columns.includes(field)) {
						headerObject[field] = this.translate.instant(header);
						columnDescriptors.push({ type, field, align });
					}
				}
			}
		);
		let row: Partial<ExtendedPlayerScouting>;
		const rows = players.map((player: ExtendedPlayerScouting) => {
			row = {};
			columnDescriptors.forEach((column: Required<Pick<TableColumn, 'type' | 'field' | 'align'>>) => {
				row[column.field] = this.getExportedValue(column, player).value;
			});
			return row;
		});
		const results = Papa.unparse([headerObject, ...rows], {
			header: false,
			columns
		});
		const fileName = 'scouting-players.csv';

		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	private getExportedValue(column: Required<Pick<TableColumn, 'type' | 'field' | 'align'>>, player: ExtendedPlayerScouting): MixedType {
		switch (column.type) {
			case 'image':
				return {
					mode: 'image',
					label: null,
					value: player[column.field] ? this.getProfileUrl({ downloadUrl: player[column.field] }) : null
				};
			case 'translate':
				return {
					mode: 'text',
					label: player[column.field] ? this.translate.instant(player[column.field]) : null
				};
			case 'date':
				return {
					mode: 'text',
					label: player[column.field] ? moment(player[column.field]).format(getMomentFormatFromStorage()) : null
				};
			case 'report':
				return {
					mode: 'text',
					label: player[column.field] ? parseHtmlStringToText(player[column.field]) : null
				};
			case 'playerAttributes':
				return {
					mode: 'pointType',
					label: player.playerAttributes ? player.playerAttributes[column.field].value : null,
					cssStyle: player.playerAttributes ? 'background: ' + player.playerAttributes[column.field].backgroundColor : null
				};
		}
		return { label: player[column.field], mode: 'text' };
	}

	private wrapPlayerFromThirdParty(event: any[]) {
		const { clubId, currentTeamId } = this.auth.getCurrentUserData();

		const playersToAdd: any[] =
			this.provider === 'InStat'
				? event.map(thirdPartyPlayer => this.newPlayerScoutingFromInStat(thirdPartyPlayer, clubId, currentTeamId))
				: event.map(thirdPartyPlayer => this.newPlayerScoutingFromWyscout(thirdPartyPlayer, clubId, currentTeamId));
		this.playerScoutingApi
			.createMany(playersToAdd)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (players: ExtendedPlayerScouting[]) => {
					this.players = [...this.players, ...players];
					this.updateAlreadyImportedClubScoutingPlayers([...this.clubScoutingPlayers, ...players]);
					this.handleScoutingNotificationPlayersCreated(players);
					this.scaffoldPlayerOrigin = this.players;
					this.filterPlayers(this.scaffoldPlayerOrigin);
					if (players.length === 1) {
						this.onClickPlayer(players[0]);
					}
				},
				error: (error: Error) => void this.error.handleError(error)
			});
	}
	private newPlayerScoutingFromInStat(thirdPartyPlayer: ParsedInStatPlayer, clubId, teamId) {
		const player = {
			archived: false,
			archivedStatus: 'bonus.active',
			clubId,
			teamId,
			currentTeam: thirdPartyPlayer.currentTeamName ? thirdPartyPlayer.currentTeamName : null,
			downloadUrl: thirdPartyPlayer.img,
			name: thirdPartyPlayer.firstName,
			lastName: thirdPartyPlayer.lastName,
			displayName: thirdPartyPlayer.name,
			birthDate: null,
			nationality: thirdPartyPlayer.birthArea?.alpha2code || null,
			altNationality: thirdPartyPlayer.passportArea?.alpha2code || null,
			foot: thirdPartyPlayer.foot,
			gender: thirdPartyPlayer.gender,
			height: null,
			weight: null,
			position: thirdPartyPlayer.position,
			value: null,
			valueField: 'value',
			federalMembership: [],
			_statusHistory: [],
			currentStatus: 'inTeam',
			address: {
				street: '',
				city: '',
				zipCode: '',
				state: '',
				nation: ''
			},
			domicile: {
				street: '',
				city: '',
				zipCode: '',
				state: '',
				nation: ''
			},
			contractDetails: {
				agent: '',
				agentPhone: '',
				agentEmail: '',
				owner: '',
				currentlyPlaying: '',
				league: '',
				nation: '',
				contractType: '',
				wage: '',
				dateTo: null,
				marketValue: ''
			},
			recommended: 0
		};
		player[this.providerIdField] = this.providerIntegrationService.getPlayerThirdPartyId(thirdPartyPlayer);
		return player;
	}

	private newPlayerScoutingFromWyscout(thirdPartyPlayer, clubId, teamId) {
		const player = {
			archived: false,
			archivedStatus: 'bonus.active',
			clubId,
			teamId,
			currentTeam: thirdPartyPlayer.currentTeam ? thirdPartyPlayer.currentTeam.name : null,
			downloadUrl: thirdPartyPlayer.img,
			name: thirdPartyPlayer.firstName,
			lastName: thirdPartyPlayer.lastName,
			displayName: thirdPartyPlayer.shortName,
			birthDate: thirdPartyPlayer.birthDate,
			nationality: thirdPartyPlayer.birthArea.alpha2code,
			altNationality: thirdPartyPlayer.passport ? thirdPartyPlayer.passport.alpha2code : null,
			foot: thirdPartyPlayer.foot,
			gender: thirdPartyPlayer.gender,
			height: thirdPartyPlayer.height,
			weight: thirdPartyPlayer.weight,
			position: thirdPartyPlayer.role.code2,
			value: thirdPartyPlayer.transferValue,
			valueField: 'value',
			federalMembership: [],
			_statusHistory: [],
			currentStatus: 'inTeam',
			address: {
				street: '',
				city: '',
				zipCode: '',
				state: '',
				nation: ''
			},
			domicile: {
				street: '',
				city: '',
				zipCode: '',
				state: '',
				nation: ''
			},
			contractDetails: {
				agent: '',
				agentPhone: '',
				agentEmail: '',
				owner: '',
				currentlyPlaying: '',
				league: '',
				nation: '',
				contractType: '',
				wage: '',
				dateTo: null,
				marketValue: ''
			},
			recommended: 0
		};
		player[this.providerIdField] = this.providerIntegrationService.getPlayerThirdPartyId(thirdPartyPlayer);
		return player;
	}

	onDiscardThirdPartySearchDialog() {
		this.thirdPartyPlayerSearchDialogVisible = false;
	}

	openDeleteDialog(player: ExtendedPlayerScouting) {
		this.confirmationService.confirm({
			message: this.translate.instant('admin.squad.deleteDirectPlayer'),
			header: 'Iterpro',
			accept: () => {
				this.handleDelete(player);
			}
		});
	}

	private handleDelete(player: ExtendedPlayerScouting) {
		this.playerScoutingApi
			.deleteById(getId(player))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					const key = 'admin.squad.deleteDirectPlayerConfirm';
					this.notificationService.notify('success', 'Profile', key, false);
					const playerIndex = this.players.findIndex(target => getId(target) === getId(player));
					if (playerIndex !== -1) {
						this.players = [...this.players.slice(0, playerIndex), ...this.players.slice(playerIndex + 1)];
					}
					const clubScoutingIndex = this.clubScoutingPlayers.findIndex(target => getId(target) === getId(player));
					if (clubScoutingIndex !== -1) {
						this.clubScoutingPlayers = [
							...this.clubScoutingPlayers.slice(0, clubScoutingIndex),
							...this.clubScoutingPlayers.slice(clubScoutingIndex + 1)
						];
					}
					this.updateAlreadyImportedClubScoutingPlayers(this.clubScoutingPlayers);
					this.scaffoldPlayerOrigin = this.players;
					this.filterPlayers(this.scaffoldPlayerOrigin);
				},
				error: (error: Error) => void this.error.handleError(error)
			});
	}

	downloadEmptyCsv() {
		const headerObj = {};
		const playerScoutingProperties = [
			'name',
			'lastName',
			'displayName',
			'email',
			'phone',
			'birthDate',
			'nationality',
			'currentTeam',
			'agent',
			'agentEmail',
			'agentPhone',
			'feeFrom',
			'feeTo',
			'wageFrom',
			'wageTo',
			'weight',
			'height'
		];

		// leaving first column of header empty for numbering etc.
		headerObj['No.'] = '';

		// Adding all other properties to header.
		playerScoutingProperties.forEach(prop => {
			headerObj[prop] = '';
		});

		const results = Papa.unparse([headerObj]);
		const fileName = 'Player_Scouting_' + moment().format(getMomentFormatFromStorage()) + '_empty.csv';

		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	fileChanged(e) {
		this.uploadedPlayers = [];
		this.fileReader = new FileReader();

		// Reading from uploaded file.
		this.fileReader.onload = loadEvent => {
			const csvRead = this.fileReader.result;
			const resultsCsv: Papa.ParseResult<any> = Papa.parse(csvRead.toString(), {
				header: true,
				skipEmptyLines: true
			});
			const { clubId, currentTeamId } = this.auth.getCurrentUserData();
			// array of all the scouting player in uploaded file
			const csvData = resultsCsv.data;
			this.uploadedPlayers = csvData.map(csvDataValue => ({
				[this.providerIdField]: csvDataValue[this.providerIdField] ? parseInt(csvDataValue[this.providerIdField], 10) : null,
				gpexeId: csvDataValue.gpexeId ? parseInt(csvDataValue.gpexeId, 10) : null,
				catapultId: csvDataValue.catapultId ? parseInt(csvDataValue.catapultId, 10) : null,
				fieldwizId: csvDataValue.fieldwizId ? parseInt(csvDataValue.fieldwizId, 10) : null,
				statsportId: csvDataValue.statsportId ? parseInt(csvDataValue.statsportId, 10) : null,
				wimuId: csvDataValue.wimuId ? parseInt(csvDataValue.wimuId, 10) : null,
				name: csvDataValue.name,
				lastName: csvDataValue.lastName,
				displayName: csvDataValue.displayName,
				profilePhotoName: csvDataValue.profilePhotoName,
				profilePhotoUrl: csvDataValue.profilePhotoUrl,
				downloadUrl: csvDataValue.downloadUrl,
				gender: csvDataValue.gender,
				nationality: csvDataValue.nationality,
				altNationality: csvDataValue.altNationality,
				shoeSize: csvDataValue.shoeSize,
				captain: csvDataValue.captain === 'true' ? true : false,
				inTeamFrom: csvDataValue.inTeamFrom ? moment(csvDataValue.inTeamFrom, 'DD/MM/YYYY HH:mm').toDate() : null,
				inTeamTo: csvDataValue.inTeamTo ? moment(csvDataValue.inTeamTo, 'DD/MM/YYYY HH:mm').toDate() : null,
				facebook: csvDataValue.facebook,
				twitter: csvDataValue.twitter,
				instagram: csvDataValue.instagram,
				linkedin: csvDataValue.linkedin,
				snapchat: csvDataValue.snapchat,
				mobilePhone: csvDataValue.mobilePhone,
				otherMobile: [],
				education: csvDataValue.education,
				school: csvDataValue.school,
				birthDate: csvDataValue.birthDate ? moment(csvDataValue.birthDate, 'DD/MM/YYYY HH:mm').toDate() : null,
				birthPlace: csvDataValue.birthPlace,
				weight: csvDataValue.weight ? parseInt(csvDataValue.weight, 10) : null,
				height: csvDataValue.height ? parseInt(csvDataValue.height, 10) : null,
				position: csvDataValue.position,
				role1: [],
				position2: csvDataValue.position2,
				role2: [],
				position3: csvDataValue.position3,
				role3: [],
				foot: csvDataValue.foot,
				currentTeam: csvDataValue.currentTeam,
				agent: csvDataValue.agent,
				agentEmail: csvDataValue.agentEmail,
				agentPhone: csvDataValue.agentPhone,
				feeFrom: csvDataValue.feeFrom,
				feeTo: csvDataValue.feeTo,
				wageFrom: csvDataValue.wageFrom,
				wageTo: csvDataValue.wageTo,
				jersey: csvDataValue.jersey ? parseInt(csvDataValue.jersey, 10) : null,
				valueField: csvDataValue.valueField,
				value: csvDataValue.value ? parseInt(csvDataValue.value, 10) : null,
				clubValue: csvDataValue.clubValue ? parseInt(csvDataValue.clubValue, 10) : null,
				agentValue: csvDataValue.agentValue ? parseInt(csvDataValue.agentValue, 10) : null,
				wage: csvDataValue.wage ? parseInt(csvDataValue.wage, 10) : null,
				contractStart: csvDataValue.contractStart ? moment(csvDataValue.contractStart, 'DD/MM/YYYY HH:mm').toDate() : null,
				contractEnd: csvDataValue.contractEnd ? moment(csvDataValue.contractEnd, 'DD/MM/YYYY HH:mm').toDate() : null,
				phone: csvDataValue.phone,
				email: csvDataValue.email,
				address: {
					street: '',
					city: '',
					zipCode: '',
					state: '',
					nation: ''
				},
				domicile: {
					street: '',
					city: '',
					zipCode: '',
					state: '',
					nation: ''
				},
				botId: csvDataValue.botId,
				botMessageUrl: csvDataValue.botMessageUrl,
				anamnesys: [],
				archived: csvDataValue.archived === 'true' ? true : false,
				archivedStatus: 'bonus.active',
				archivedDate:
					csvDataValue.archivedDate && csvDataValue.archived === 'false'
						? moment(csvDataValue.archivedDate, 'DD/MM/YYYY HH:mm').toDate()
						: null,
				currentStatus: csvDataValue.currentStatus,
				statusDetails: [],
				movOnBall: [],
				movOffBall: [],
				passing: [],
				finishing: [],
				defending: [],
				technique: [],
				documents: [],
				nationalityOrigin: csvDataValue.nationalityOrigin,
				fiscalIssue: csvDataValue.fiscalIssue,
				ageGroup: csvDataValue.ageGroup,
				biography: csvDataValue.biography,
				federalMembership: [],
				maritalStatus: csvDataValue.maritalStatus,
				contractDetails: [],
				_statusHistory: [],
				recommended: csvDataValue.recommended ? parseInt(csvDataValue.recommended, 10) : null,
				teamId: currentTeamId,
				_attributes: [],
				_offensive_organization: [],
				_offensive_transition: [],
				_offensive_setPieces: [],
				_defensive_organization: [],
				_defensive_transition: [],
				_defensive_setPieces: [],
				lastAuthor: this.auth.getCurrentUserId(),
				lastUpdate: moment().toDate(),
				clubId // clubId is a required field for validation.
			}));
			this.fileInput.nativeElement.value = '';
			this.csvUploadEmitter.emit();
		};

		// Updating DB for newly uploaded scout players after file read option complete.
		this.fileReader.onloadend = () => this.updateDbForUplodedPlayers();

		// Error handling for file reader
		this.fileReader.onerror = ev => {
			// eslint-disable-next-line no-console
			console.error(ev);
			this.notificationService.notify('error', 'error', 'import.feedbacks.errorCSV');
		};
		// Reading first file uploaded.
		this.fileReader.readAsText(e.target.files[0]);
	}

	private updateDbForUplodedPlayers() {
		this.playerScoutingApi
			.createMany(this.uploadedPlayers)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.notificationService.notify('success', 'Scouting', 'scouting.playerCreated', false);
					this.requestPlayers();
				},
				error: (error: Error) => void this.error.handleError(error)
			});
	}

	// DEPRECATED - just for milan
	onSwapEmitter(player: ExtendedPlayerScouting) {
		this.swap = player;
	}

	onUpdateScenario(scenario: ScoutingLineup) {
		const index = this.scenarios.findIndex(({ id }) => scenario.id === id);
		if (index > -1)
			this.scenarios[index] = {
				...scenario
			};
		else this.scenarios.push(scenario);
		this.scenarios = cloneDeep(this.scenarios);
	}

	onDeleteScenario(scenario: ScoutingLineup) {
		const index = this.scenarios.findIndex(({ id }) => scenario.id === id);
		if (index > -1) this.scenarios.splice(index, 1);
		this.scenarios = cloneDeep(this.scenarios);
	}

	onUpdateScenariosMapping(scenario: ScoutingLineup) {
		this.updateDiffScenarios(scenario);
		this.updateLocalScenarios(scenario);
	}

	private updateDiffScenarios(scenario: ScoutingLineup) {
		const index = this.diffScenarios.findIndex(({ id }) => id === scenario.id);
		if (index > -1)
			this.diffScenarios[index] = {
				...scenario
			};
		else this.diffScenarios.push(scenario);
	}

	private updateLocalScenarios(scenario: ScoutingLineup) {
		const index = this.scenarios.findIndex(({ id }) => scenario.id === id);
		this.scenarios[index] = cloneDeep(scenario);
		this.scenarios = cloneDeep(this.scenarios);
	}

	addNewScoutingPlayerFromEvent(newScoutingPlayers: PlayerScouting[]) {
		if (newScoutingPlayers && newScoutingPlayers.length > 0) {
			this.players = [...this.players, ...newScoutingPlayers];
			this.clubScoutingPlayers = [...this.clubScoutingPlayers, ...newScoutingPlayers];
			this.scaffoldPlayerOrigin = [...this.scaffoldPlayerOrigin, ...newScoutingPlayers];
			this.filterPlayers(this.scaffoldPlayerOrigin);
		}
	}

	onRedirect(item: { playerId: string; tabIndex: number }) {
		this.gameToEdit = undefined;
		const found = this.players.find(player => getId(player) === item.playerId);
		if (!found) {
			this.notificationService.notify(
				'info',
				'navigator.scouting',
				"The player was not found in the current Team, please check if it's in another team"
			);
			return console.error('player with id: ' + item.playerId + ' was not found in this team');
		}
		this.onClickPlayer(found, item.tabIndex);
	}

	checkIfIsScoutingAdmin(): boolean {
		const { teamSettings, currentTeamId } = this.auth.getCurrentUserData();
		return userHasPermission(getTeamSettings(teamSettings, currentTeamId), 'scouting-games-report');
	}

	canBeTransferredToTeam({ [this.providerIdField]: id }: ExtendedPlayerScouting): boolean {
		if (!id) return false;
		return this.clubPlayers.some(player => player[this.providerIdField] === id);
	}

	private initComponent() {
		forkJoin([
			this.scoutingService.requestClubScoutingFlag(),
			this.scoutingService.requestClubScoutingPlayers(),
			this.scoutingService.requestTeamSeasons(),
			this.scoutingService.requestClubSeasons(),
			this.scoutingService.requestClubPlayers()
		])
			.pipe(
				map(([{ scoutingSettings, scoutCustomers }, clubScoutingPlayers, seasons, clubSeasons, clubPlayers]) => {
					this.setScoutingSettings(scoutingSettings);
					this.scoutCustomers = scoutCustomers;
					this.seasons = sortByDate(seasons, 'offseason').reverse();
					this.clubSeasons = clubSeasons;
					this.clubScoutingPlayers = clubScoutingPlayers;
					this.updateAlreadyImportedClubScoutingPlayers(clubScoutingPlayers);
					this.clubPlayers = clubPlayers.filter(({ archived }) => !archived);
				}),
				switchMap(() => this.requestPlayers()),
				first(),
				untilDestroyed(this)
			)
			.subscribe({
				next: () => {
					this.gameToEdit = undefined;
					this.activeViewType = this.checkIfIsScoutingAdmin() ?
						this.players.length > 100
							? this.getViewType(ScoutingViewType.TableView)
							: this.getViewType(ScoutingViewType.CardView)
						: this.getViewType(ScoutingViewType.CalendarView);
					localStorage.setItem('lastScoutingViewType', JSON.stringify(this.activeViewType.id));
					this.listenForRouterParams();
				},
				error: error => void this.error.handleError(error)
			});
	}

	private setScoutingSettings(scoutingSettings: ScoutingSettings) {
		this.scenarioRoles = scoutingSettings.scenario === 'roles';
		this.isPlayerDescriptionTipss = scoutingSettings.playerDescription === 'tipss';
		this.isGameReportTipss = scoutingSettings.gameReport === 'tipss';
		this.importLimit = scoutingSettings.importLimit;
		this.archiveLimit = scoutingSettings.archiveLimit;
		this.isSwissGameReport = scoutingSettings.survey === 'swiss';
		this.isWatfordGameReport = scoutingSettings.gameReport === 'watford';
	}

	private setFilterOptions() {
		this.filterOptionsAdditional = {
			...this.filterOptionsAdditional,
			foot: { label: `profile.position.${getLimb(this.sportType)}`, type: 'multi' }
		};
		const result: FilterOptions<ExtendedPlayerScouting> = {
			...this.filterOptionsDefault,
			...this.filterOptionsWage,
			...this.filterOptionsAdditional,
			...this.filterOptionsAttributes,
			...this.filterOptionsReportDataHistory,
			...this.getFilterOptionsForReportData()
		};
		if (this.isSwissGameReport || this.isWatfordGameReport) {
			delete result.feeRange;
			delete result.wageRange;

			delete result.offensive;
			delete result.defensive;
			delete result.attitude;
		}
		this.filterOptions = result;
	}

	private getFilterOptionsForReportData(): FilterOptions<ExtendedPlayerScouting> {
		const basic: FilterOptions<ExtendedPlayerScouting> = this.isSwissGameReport ? { prognosis: { label: 'prognosis', type: 'multi' } } : {};
		for (const column of this.reportDataColumns) {
			basic[column.key] = { label: column.label, type: 'multi' };
		}
		return basic;
	}

	requestPlayers(): Observable<ExtendedPlayerScouting[]> {
		const obs$: Observable<any>[] = [
			this.blockUiInterceptorService.disableOnce(this.scoutingService.requestScoutingPlayers()),
			this.blockUiInterceptorService.disableOnce(this.scoutingService.requestScoutingScenarios())
		];
		return forkJoin(obs$).pipe(
			map(([playerScoutingsResult, scenarios]: [PlayerScouting[], ScoutingLineup[]]) => {
				let playerScoutings: ExtendedPlayerScouting[] = playerScoutingsResult;
				this.reportDataColumns = getUniqueReportDataArrayColumns(
					playerScoutings.map(({ reportDataAvg }): ReportDataAvg[] => reportDataAvg)
				);
				this.setFilterOptions();
				this.scenarios = scenarios;
				playerScoutings = this.getPlayerScoutingsMappedWithAdditionalData(playerScoutings);
				this.originalPlayers = sortByName(playerScoutings, 'displayName');
				this.players = this.checkIfIsScoutingAdmin() ? this.originalPlayers : this.originalPlayers.filter(player => !!getId(player));
				this.setArchivedPlayers();
				this.scaffoldPlayerOrigin = this.players;
				this.updateTableOptions();
				return playerScoutings;
			})
		);
	}

	private getPlayerScoutingsMappedWithAdditionalData(playerScoutings: PlayerScouting[]): ExtendedPlayerScouting[] {
		const currentTeam = this.currentTeamService.getCurrentTeam();
		this.standardAttributes = getMappedStandardAttributesForColumns(getTeamsPlayerAttributes([currentTeam]), this.translate);
		const scoutingSettings = currentTeam && currentTeam.club.scoutingSettings;
		const isActiveAttributesDescriptionSettings = scoutingSettings && scoutingSettings.playerDescription === 'attributes';
		playerScoutings.forEach((playerScouting: ExtendedPlayerScouting) => {
			if (playerScouting.notesThreads) {
				playerScouting.notesThreads = sortByDateDesc(playerScouting.notesThreads, 'time');
			}
			if (playerScouting.birthDate && moment(playerScouting.birthDate).isValid()) {
				playerScouting.birthYear = playerScouting.birthDate.getFullYear().toString();
			}
			//#region Game Reports Info
			if (playerScouting?.reportDataAvg) {
				const lastReport = (playerScouting.gameReports || [])
					.filter(item => item?.denormalizedScoutingGameFields?.start)
					.sort((a, b) => b.denormalizedScoutingGameFields?.start - a.denormalizedScoutingGameFields?.start)[0];
				const lastHistory = lastReport?.history && lastReport?.history.length > 0 ? lastReport?.history[0] : undefined;
				playerScouting.lastGameReportDate = lastHistory?.updatedAt;
				playerScouting.lastGameReportAuthor = this.getUser(lastHistory?.author, this.scoutCustomers);
				playerScouting.gameReportsNumber = (playerScouting?.gameReports || []).length;
				playerScouting.lastGameReportTeams = lastReport?.denormalizedScoutingGameFields
					? `${lastReport.denormalizedScoutingGameFields?.homeTeam} - ${lastReport.denormalizedScoutingGameFields?.awayTeam}`
					: null;
				for (const reportData of playerScouting.reportDataAvg) {
					playerScouting[reportData.sectionId + reportData.key] = reportData.avg;
				}
			}
			//endregion

			//#region Player Attributes (lastSeasonAttributePlayerDescription, lastSeasonAttributeDate, lastSeasonAttributeAuthor)
			if (!this.isSwissGameReport && playerScouting?.attributes.length > 0) {
				const playerAttributesEntry: PlayerAttributesEntry = completeWithAdditionalFields(
					last(playerScouting?.attributes || []),
					getTeamsPlayerAttributes([currentTeam]),
					'PlayerScouting',
					currentTeam?.club?.scoutingSettings
				);
				const playerDescriptionEntry: PlayerDescriptionEntry = last(playerScouting?.descriptions || []);
				playerScouting.selectedAttributePlayerDescription = playerDescriptionEntry?.description;
				if (playerAttributesEntry) {
					playerScouting.selectedAttributeDate = playerAttributesEntry.date;
					playerScouting.selectedAttributeAuthor = this.getUser(playerAttributesEntry.authorId, this.scoutCustomers);
					//#region Player Attributes (Offensive, Defensive, Attitude)
					playerScouting.playerAttributes = {};
					for (const category of attributeAvgCategory) {
						playerScouting.playerAttributes[category] = {
							value: getAvgValueForSpinner(
								!this.isPlayerDescriptionTipss,
								getCategoryValues(playerAttributesEntry, category),
								currentTeam.club.scoutingSettings
							),
							backgroundColor: getSpinnerColor(
								isActiveAttributesDescriptionSettings,
								getCategoryValues(playerAttributesEntry, category),
								currentTeam.club.scoutingSettings
							),
							color: 'white'
						};
					}
					for (const field of this.standardAttributes) {
						playerScouting.playerAttributes[field.value] = {
							value: getPlayerAttributesEntryValue(playerAttributesEntry, field.value),
							backgroundColor: getColorClass(
								getPlayerAttributesEntryValue(playerAttributesEntry, field.value),
								1,
								isActiveAttributesDescriptionSettings,
								currentTeam.club.scoutingSettings
							),
							color: 'white',
							tooltip: field.description
						};
					}
					//endregion
				}
			}
			//endregion

			//#region Player Scenarios
			const playerScenarioInfo = getPlayerLatestScenarioInfo(this.scenarios, this.scenarioRoles, this.clubPlayers, playerScouting);
			playerScouting.associatedPosition = playerScenarioInfo?.associatedPosition;
			playerScouting.associatedPlayerName = playerScenarioInfo?.associatedPlayerName;
			//endregion
		});
		return playerScoutings;
	}

	private getUser(customerId: string, customers: Customer[]): string {
		const found = customers.find(({ id }) => id === customerId);
		return found ? `${found.firstName} ${found.lastName}` : null;
	}

	private updateAlreadyImportedClubScoutingPlayers(players: PlayerScouting[]) {
		this.alreadyImportedPlayers = uniq(
			players
				.map(({ [this.providerIdField]: providerId, teamId }) => ({
					providerId,
					teamName: (this.teamList || []).find(({ id }) => id === teamId)?.name
				}))
				.filter(({ providerId }) => providerId)
		);
	}

	private updateTableOptions() {
		this.columnOptions = getScoutingColumnOptions(
			initialVisibility,
			this.reportDataColumns,
			this.standardAttributes,
			this.isSwissGameReport,
			this.isWatfordGameReport,
			this.sportType
		);
		this.visibleColumns = this.columnVisibilityToArray(initialVisibility);
		if (this.activeViewType?.id === ScoutingViewType.CardView) {
			this.filterPlayers(this.scaffoldPlayerOrigin);
			this.isScoutingPlayersLoading = false;
		}
	}

	private scaffoldPlayers(players: ExtendedPlayerScouting[]) {
		this.categories = [
			...getPositionCategories(this.sportType).map((roleName: string) => ({
				name: roleName,
				players: []
			})),
			{ name: 'noPosition', players: [] }
		];
		players
			.filter(({ archived }) => !archived)
			.forEach((player: ExtendedPlayerScouting) => {
				this.handlePlayerAndCategorizedIt(player);
			});
		this.setArchivedPlayers();
	}

	private handlePlayerAndCategorizedIt(player: ExtendedPlayerScouting) {
		this.filteredPlayers.push(<ExtendedPlayerScouting>player);
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
	}

	private categorizeActivePlayer(position: string): string {
		if (!position) return 'noPosition';
		const category = getFieldPosition(position, this.sportType);
		return category ? category : 'noPosition';
	}

	private columnVisibilityToArray(visibleFields: ScoutingColumnVisibility): string[] {
		return [
			...visibleFields.general,
			...visibleFields.attributes,
			...visibleFields.deal,
			...visibleFields.reportData,
			...(this.reportDataColumns ? this.reportDataColumns?.map(({ key }) => key) : [])
		];
	}

	setOpen(isOpen: boolean) {
		this.isAddPlayerMenuOpened = isOpen;
	}

	hasReachedMaxImportablePlayers(): boolean {
		const clubScoutingArchivedPlayersNum = this.clubScoutingPlayers?.length;
		return this.importLimit && this.importLimit !== -1 && clubScoutingArchivedPlayersNum >= this.importLimit;
	}

	hasReachedMaxArchivablePlayers(): boolean {
		const clubScoutingArchivedPlayersNum = this.clubScoutingPlayers?.filter(({ archived }) => archived).length;
		return this.archiveLimit && this.archiveLimit !== -1 && clubScoutingArchivedPlayersNum >= this.archiveLimit;
	}

	onClickPlayer(player: ExtendedPlayerScouting, tabIndex?: number) {
		this.showFilters = false;
		this.selectedPlayerTabIndex = tabIndex;
		this.selectedPlayer = cloneDeep(player);
		this.searchDropdownElements = this.getSearchDropdownElements(this.filteredPlayers);
	}

	getSearchDropdownElements(persons: ExtendedPlayerScouting[]): SearchPlayerDropdownElement[] {
		return persons.filter(({ id }) => id !== this.selectedPlayer.id).map(player => ({ player, isTeam: false }));
	}

	onSelectFromDropdown(value: SearchPlayerDropdownElement) {
		this.onClickPlayer(value.player as ExtendedPlayerScouting);
	}

	hasScenariosSharedWithMe(): boolean {
		return this.scenarios?.some(({ sharedWithIds }) => sharedWithIds.includes(this.auth.getCurrentUserId()));
	}

	canUserSeeThis(): boolean {
		return this.isScoutingAdmin || this.hasScenariosSharedWithMe();
	}

	updatePlayerReportEntries(event: PlayerReportEntriesEmitter) {
		this.filteredPlayers = (this.filteredPlayers || []).map(player => {
			if (getId(player) === event.playerId) {
				if (event?.attributes) {
					player.attributes = event.attributes;
				}
				if (event?.descriptions) {
					player.descriptions = event.descriptions;
				}
			}
			return player;
		});
	}

	filterPlayers(players: ExtendedPlayerScouting[]) {
		this.filteredPlayers = [];
		this.scaffoldPlayers(players);
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
		this.isScoutingPlayersLoading = true;
		setTimeout(() => {
			this.filterOptions = getUpdatedFilterOptions(event, this.filterOptions);
			this.visibleColumns = event.visibility;
			this.loadColumnOptions();
			this.isScoutingPlayersLoading = false;
		}, 10);
	}
}

interface ScoutingTableViewPDF extends PdfBase {
	table: PdfMixedTable;
}

import {
	AfterViewChecked,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	SimpleChanges,
	TemplateRef,
	ViewChild
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '@iterpro/config';
import { DrillFiltersConfig } from '@iterpro/manager/drills/data-access';
import { AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { IterproUserPermission, PermissionsService } from '@iterpro/shared/data-access/permissions';
import {
	Attachment,
	Customer,
	DenormalizedEventFields,
	DeviceType,
	Drill,
	DrillApi,
	DrillInstance,
	Event,
	EventApi,
	PlayerReportHistory,
	Injury,
	InjuryApi,
	InjuryAvailability,
	JsonSchema,
	levels,
	LoopBackAuth,
	MatchProviderStats,
	MedicalEvent,
	MedicalFieldType,
	MedicalTreatment,
	MedicalTreatmentApi,
	MixedType,
	PdfBasicType,
	PdfMixedTable,
	Player,
	PlayerApi,
	PlayerGameReport,
	PlayerMatchStat,
	PlayerTrainingReport,
	ProviderType,
	Schema,
	ScoutingGameReportAttachmentType,
	ScoutingGameReportWithPlayer,
	SearchResultTeam,
	SessionPlayerData,
	Staff,
	StatsResult,
	Team,
	TeamApi,
	TeamGender,
	TeamSeason,
	TeamSeasonApi,
	Test,
	ThirdPartyClubGameInterface,
	ThirdPartyLinkedPlayer,
	VideoAsset,
	VideoCategory,
	TeamPerformanceReport,
	ExtendedPlanningGameReport,
	emptyTeamPerformanceReport,
	CompetitionInfo,
	WyscoutTeamSearchResult
} from '@iterpro/shared/data-access/sdk';
import {
	ConfirmationDialogComponent,
	EditorDialogComponent,
	CustomReportDataChangeOutput,
	ItemsGroup,
	SelectionDialogComponent
} from '@iterpro/shared/ui/components';
import {
	AlertService,
	AzureStoragePipe,
	BlockUiInterceptorService,
	CalendarService,
	ConstantService,
	DEFAULT_PERSON_IMAGE_BASE64,
	DrillsListMapping,
	DrillsMapping,
	DrillsMappingService,
	EVENT_THEME_LIST,
	EditModeService,
	ErrorService,
	InjuryService,
	MedicalEventLabelsService,
	ProviderIntegrationService,
	ProviderTypeService,
	ReportService,
	SportType,
	TINY_EDITOR_OPTIONS,
	ToLocalEquivalentService,
	VideoMatchesService,
	allPositionsCategories,
	copyValue,
	getFieldPosition,
	getMomentFormatFromStorage,
	getPositionCategories,
	getPositionCategoryIndex,
	getScoreIconTooltip,
	getSportParameters,
	isNotArchived,
	isNotEmpty,
	normalizePlayers,
	parseHtmlStringToText,
	sortByDate,
	SchemaConversionService,
	resetPlayerStatsFields,
	getOptionsByType,
	PlayerReportTemplateApiService,
	getPDFv2Path,
	getStats,
	VideoService,
	getResult
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, flatten, groupBy, isEmpty, last, sortBy, uniq, uniqBy } from 'lodash';
import * as momentLib from 'moment';
import 'moment-duration-format';
import { extendMoment } from 'moment-range';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ConfirmationService, MenuItem, SelectItem, SelectItemGroup } from 'primeng/api';
import { AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { Dialog } from 'primeng/dialog';
import { DropdownChangeEvent } from 'primeng/dropdown';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog/dynamicdialog-ref';
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { filter, first, map, switchMap, take, tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { EventFormat } from '../../../+state/event-viewer-store/ngrx/event-viewer-store.state';
import { RootStoreState } from '../../../+state/root-store.state';
import { MedicalTreatmentsComponent } from '../../../shared/treatments/components/medical-treatments/medical-treatments.component';
import { TreatmentType } from '../../../shared/treatments/interfaces/treatment-table.interface';
import { PlanningService } from '../services/planning.service';
import { EventViewerStoreActions, EventViewerStoreSelectors } from './../../../+state/event-viewer-store';
import * as TrtUtilsService from './../../../shared/treatments/utils/treatment-table-utils';
import { DrillListFilterPipe } from './pipes/drill-list-filter.pipe';
import { PlayersStatsEnabledPipe, PlayersStatsFilterByPositionPipe } from '@iterpro/shared/ui/pipes';
import { MatchDetailsService } from './services/match-details.service';
import { DrillThemesFilterPipe } from './pipes/drill-themes-filter.pipe';
import { EventGamePDFReport, PdfMatchInfo } from './pdf-utils/event-pdf.interface';
import {
	getGameHeaders,
	getMixedValueTypeFromHeader,
	getPlayerReportTableHeaders,
	getPlayerGameReportTableRows,
	getPlayerTrainingReportTableRows
} from './pdf-utils/event-pdf.util';
import { CloudUploadResult } from '@iterpro/shared/feature-components';

const moment = extendMoment(momentLib);

const getPlayerConditions = event => {
	return {
		include: [
			{
				relation: 'injuries',
				scope: {
					where: {
						date: { lte: moment(event.start).endOf('day').toDate() },
						or: [{ endDate: null }, { endDate: { gte: moment(event.end).endOf('day').toDate() } }]
					}
				}
			}
		],
		fields: [
			'id',
			'name',
			'lastName',
			'displayName',
			'nationality',
			'weight',
			'height',
			'foot',
			'jersey',
			'downloadUrl',
			'archived',
			'position',
			'injuries',
			'archivedDate',
			'wyscoutId',
			'instatId',
			'birthDate'
		]
	};
};

const getStaffConditions = () => {
	return {
		fields: ['id', 'firstName', 'lastName', 'downloadUrl', 'archived', 'position', 'archivedDate', 'customerId']
	};
};

interface DropDownOpponent {
	name: string;
	imageDataURL: string;
	instId: number;
	wyId: number;
}

export type PlayerWithHealthStatus = Player & {
	healthStatus: {
		healthStatus: any;
		available: InjuryAvailability;
		expected: any;
		injury: any;
	};
	modified: boolean;
	trainingReport?: ExtendedPlanningGameReport;
};

const allPositions = [...allPositionsCategories()] as const;
type PlayerPosition = (typeof allPositions)[number];
type StaffPosition = 'staff';
type NationalStage = 'nationalLeague' | 'nationalCup' | 'tournamentQualifiers' | 'tournamentFinalStages';

export interface SelectablePlayer {
	position: PlayerPosition;
	players: PlayerWithHealthStatus[];
	allSelected: boolean;
	hideInTemplate?: boolean;
}

interface SelectableStaff {
	position: StaffPosition;
	staff: Staff[];
	allSelected: boolean;
	hideInTemplate?: boolean;
}

export interface SaveEventViewerEmitter {
	event: MedicalEvent;
	isNewAndDuplicate?: boolean;
	notify: boolean; // keep it required
	playerIdsApplyTo?: string[];
	treatmentsIdsToDelete?: string[];
	playerReports?: {
		toUpsert: PlayerGameReport[] | PlayerTrainingReport[];
		toDeleteIds: string[];
	};
}

@UntilDestroy()
@Component({
	selector: 'iterpro-event',
	templateUrl: './event-viewer.component.html',
	styleUrls: ['./event-viewer.component.css'],
	providers: [EventApi]
})
export class EventViewerComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
	@Input() event: MedicalEvent | Event;
	@Input() events: MedicalEvent[] | Event[];
	@Input() newEvent: boolean;
	@Input() tests: Test[];
	@Input() customers: Customer[];
	@Input() isFromResourceTimelineDay: boolean;
	@Input() teams: Team[];
	@Input() prefilledPlayerIds: string[] = [];
	@Output() closeClicked: EventEmitter<any> = new EventEmitter<any>();
	@Output() saveClicked: EventEmitter<SaveEventViewerEmitter> = new EventEmitter<SaveEventViewerEmitter>();
	@Output() deleteClicked: EventEmitter<any> = new EventEmitter<any>();
	@Output() titleChanged: EventEmitter<any> = new EventEmitter<any>();
	@Output() resyncEmitter: EventEmitter<any> = new EventEmitter<any>();

	@ViewChild('videoDialog', { static: false }) dialog: Dialog;

	@BlockUI('event-details') blockEventDetail: NgBlockUI;

	// @ViewChild('footballRugby') footballRugby: TemplateRef<any>;
	// @ViewChild('volleyball') volleyball: TemplateRef<any>;
	// @ViewChild('footballRugbyRow') footballRugbyRow: TemplateRef<any>;
	// @ViewChild('volleyballRow') volleyballRow: TemplateRef<any>;

	isStagingEnv = !environment.production;
	plannedDrillList: any[] = [];
	actualDrillList: any[] = [];
	allPlayers: Player[] = [];
	individualOptions: SelectItem[] = [];

	effortList: SelectItem[] = [];
	themeList: SelectItem[] = [];
	medicalThemeList: SelectItem[] = [];
	nutritional: SelectItem[] = [];
	recovery: SelectItem[] = [];
	filteredDrillList: Drill[] = [];
	drillDuration: number;
	start_hour: string;
	end_hour: string;
	startDate: Date;
	endDate: Date;
	gameDay: string;
	selectedPlayers: PlayerWithHealthStatus[] = [];
	selectedPlayersByPosition: SelectablePlayer[] = [{ position: 'noPosition', players: [], allSelected: false }];
	selectablePlayers: SelectablePlayer[] = [{ position: 'noPosition', players: [], allSelected: false }];
	selectableStaff: SelectableStaff[] = [{ position: 'staff', staff: [], allSelected: false }];
	form: NgForm;
	selectedExtractedDrills: Array<{ name: string }> = [];
	selectedExtractedThemes: SelectItem[] = [];
	blockDate = false;
	results: SelectItem[] = [];
	competitionList: SelectItem[];
	fieldThemeList: SelectItem[];
	testList: SelectItem[];
	selectedCompetition: CompetitionInfo;
	opponents: SelectItem<DropDownOpponent>[] = [];
	opponent: DropDownOpponent;
	crestLoading = false;
	thirdPartySelected: MatchProviderStats;
	competitionIdsForSeeker: number[];
	sidesMatchStats: ThirdPartyClubGameInterface;
	sidesMatchStatsBackup: ThirdPartyClubGameInterface;

	private tempEvent: Event;
	private tempDrills: Drill[];
	private tempExecuted: DrillInstance[];
	private tempPlayersMatchStat: any[] = [];
	private tempMedicalTreatments: MedicalTreatment[];
	// private selectedDrillExecuted: DrillInstance;
	private updateBlockDate = false;
	private indexes = {};
	private tempSessionPlayers: SessionPlayerData[] = [];
	private selectedLineup: string[];
	private medicalField: MedicalFieldType;
	private allFlagsGame: { position: PlayerPosition; checked: boolean }[] = [];
	private players: PlayerWithHealthStatus[];
	private subformatList: SelectItem[] = [];
	drillsList: Drill[] = [];
	drillsListBackup: Drill[] = [];
	drillFiltersConfig: DrillFiltersConfig[] = ['theme', 'goal', 'duration', 'numberOfPlayers', 'pitchSize', 'ageGroup'];
	drillsMapping: DrillsMapping;
	drillFiltersListMapping: DrillsListMapping;
	allDrillThemeList: SelectItem[] = [];
	allDrillThemeListBackup: SelectItem[] = [];
	showDrillSearch: boolean;
	selectedDrillForSearch: any;
	staffs: Staff[] = [];
	selectedStaff: Staff[] = [];
	format$: Observable<string>;
	formatList$: Observable<SelectItem[]>;
	isReadOnlyFormat$: Observable<boolean>;
	isMedicalEventFormat$: Observable<boolean>;
	isAnyGameEventFormat$: Observable<boolean>;
	isGameEventFormat$: Observable<boolean>;
	isClubGameEventFormat$: Observable<boolean>;
	isTrainingEventFormat$: Observable<boolean>;
	isAssessmentEventFormat$: Observable<boolean>;
	isTravelEventFormat$: Observable<boolean>;
	competitions$: Observable<any[]>;
	isNationalClub$: Observable<boolean>;
	date$: Observable<Date>;
	isSynced$: Observable<boolean>;
	thirdPartyProviderSyncedPlayerDetails$: Observable<ThirdPartyClubGameInterface>;
	currentEventSeason: TeamSeason;
	thirdPartyProvider: ProviderType;
	gpsThirdPartyProvider: DeviceType;
	repeatOn = 'none';

	repeatList: SelectItem[] = [];
	allStaffs: any[];

	drillIndexes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	drillLetters = [
		'A',
		'B',
		'C',
		'D',
		'E',
		'F',
		'G',
		'H',
		'I',
		'J',
		'K',
		'L',
		'M',
		'N',
		'O',
		'P',
		'Q',
		'R',
		'S',
		'T',
		'U',
		'V',
		'W',
		'X',
		'Y',
		'Z'
	];
	sportType: SportType;
	sets: Array<string> = [];
	positionCategories: string[];
	allSharedWithOptions: SelectItemGroup[] = [];
	videoMatches$: Observable<VideoAsset[]>;
	videos$: Observable<VideoAsset[]>;
	videoSubscription: Subscription;
	videosLength = 0;
	videoRouterLink: string;
	maxNumberOnField: number;
	protected readonly tinyEditorInit = TINY_EDITOR_OPTIONS;
	@ViewChild(MedicalTreatmentsComponent, { static: false }) medicalTreatmentsComponent: MedicalTreatmentsComponent;
	tieredMenuItems: MenuItem[];
	injuryMap: Map<string, Injury[]> = new Map<string, Injury[]>();
	currentUserId: string;
	videoGalleryTieredMenuItems: MenuItem[];
	teamGender: TeamGender;
	teamName: string;
	clubCrest: string;
	gameTabsActiveIndex = 0;
	allPlayerReportTemplates: Schema[] = [];
	activePlayerReportTemplate!: Schema;
	clubId: string;
	gameReports: PlayerGameReport[];
	trainingReports: PlayerTrainingReport[];
	teamReportExpanded: boolean;
	teamReport: TeamPerformanceReport = emptyTeamPerformanceReport();
	videoGalleryForm: {
		visible: boolean;
		prefilledPlayerIds: string[];
		prefilledTitle: string;
		videoToEdit?: VideoAsset;
	};
	videoCategory: VideoCategory;
	eventRepository: {
		visible: boolean;
		prefilledPlayerIds: string[];
		attachments: Attachment[];
	};
	constructor(
		private store$: Store<RootStoreState>,
		private editService: EditModeService,
		private error: ErrorService,
		private authService: LoopBackAuth,
		private teamApi: TeamApi,
		private cdRef: ChangeDetectorRef,
		private calendar: CalendarService,
		private eventApi: EventApi,
		private notificationService: AlertService,
		private confirmationService: ConfirmationService,
		private translate: TranslateService,
		private constants: ConstantService,
		private reportService: ReportService,
		private currentTeamService: CurrentTeamService,
		private providerTypeService: ProviderTypeService,
		private providerIntegrationService: ProviderIntegrationService,
		private playerApi: PlayerApi,
		private medicalTreatmentApi: MedicalTreatmentApi,
		private injuryApi: InjuryApi,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private matchDetailService: MatchDetailsService,
		private toClient: ToLocalEquivalentService,
		private teamSeasonApi: TeamSeasonApi,
		private azureUrl: AzureStoragePipe,
		private videoService: VideoService,
		private videoMatchesService: VideoMatchesService,
		private router: Router,
		private medicalEventService: MedicalEventLabelsService,
		private dialogService: DialogService,
		private planningService: PlanningService,
		private injuryService: InjuryService,
		private readonly permissionsService: PermissionsService,
		private drillThemesFilterPipe: DrillThemesFilterPipe,
		private drillListFilterPipe: DrillListFilterPipe,
		private drillsMappingService: DrillsMappingService,
		private drillApi: DrillApi,
		private readonly playersStatsEnabledPipe: PlayersStatsEnabledPipe,
		private readonly playersStatsFilterByPositionPipe: PlayersStatsFilterByPositionPipe,
		private readonly playerReportTemplateApiService: PlayerReportTemplateApiService,
		private readonly schemaConversionService: SchemaConversionService
	) {}

	ngOnDestroy() {
		this.store$.dispatch(EventViewerStoreActions.componentDestroyed());
		if (this.videoSubscription) this.videoSubscription.unsubscribe();
	}

	ngOnInit() {
		this.currentUserId = this.authService.getCurrentUserId();
		this.clubId = this.currentTeamService.getCurrentTeam().clubId;
		this.thirdPartyProvider = this.providerTypeService.getProviderType(this.currentTeamService.getCurrentTeam());
		this.gpsThirdPartyProvider = this.providerTypeService.getGPSProviderType(this.currentTeamService.getCurrentTeam());
		this.teamGender = this.currentTeamService.getCurrentTeam()?.gender as TeamGender;
		this.teamName = this.currentTeamService.getCurrentTeam()?.name;
		this.clubCrest = this.currentTeamService.getCurrentTeam()?.club.crest;
		this.translate.getTranslation(this.translate.currentLang).subscribe();

		this.isNationalClub$ = this.store$.select(AuthSelectors.selectIsNationalClub);

		this.format$ = this.store$.select(EventViewerStoreSelectors.selectFormat);
		this.formatList$ = this.store$.select(EventViewerStoreSelectors.selectAvailableFormats);
		this.isReadOnlyFormat$ = this.store$.select(EventViewerStoreSelectors.selectIsReadOnlyFormat);
		this.isMedicalEventFormat$ = this.store$.select(EventViewerStoreSelectors.selectIsMedicalEventFormat);
		this.isAnyGameEventFormat$ = this.store$.select(EventViewerStoreSelectors.selectIsAnyGameEventFormat);
		this.isGameEventFormat$ = this.store$.select(EventViewerStoreSelectors.selectIsGameEventFormat);
		this.isClubGameEventFormat$ = this.store$.select(EventViewerStoreSelectors.selectIsClubGameEventFormat);
		this.isTrainingEventFormat$ = this.store$.select(EventViewerStoreSelectors.selectIsTrainingEventFormat);
		this.isAssessmentEventFormat$ = this.store$.select(EventViewerStoreSelectors.selectIsAssessmentEventFormat);
		this.isTravelEventFormat$ = this.store$.select(EventViewerStoreSelectors.selectIsTravelEventFormat);
		this.competitions$ = this.store$.select(EventViewerStoreSelectors.selectCompetitions);
		this.date$ = this.store$.select(EventViewerStoreSelectors.selectDate);
		this.thirdPartyProviderSyncedPlayerDetails$ = this.store$.select(
			EventViewerStoreSelectors.selectThirdpartySyncedPlayerDetails
		);
		this.videoCategory = this.event.format === 'training' ? VideoCategory.TRAINING : VideoCategory.GAMES;
		this.handleVideos();

		this.isSynced$ = this.store$.select(EventViewerStoreSelectors.selectIsSynced);
		// TODO: remove when onSelectCompetition() is in ngrx
		this.competitions$.pipe(untilDestroyed(this)).subscribe(competitions => (this.competitionList = competitions));

		this.store$
			.select(AuthSelectors.selectSportType)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (type: SportType) => {
					this.sportType = type;
					this.maxNumberOnField = getSportParameters(this.sportType).lineup;
					this.positionCategories = getPositionCategories(this.sportType);
					this.sets = Array.from(Array(getSportParameters(this.sportType).sets)).map(
						(val, index) => `scoreSet${index + 1}`
					);
					this.allFlagsGame = this.positionCategories.map(position => ({ position, checked: true }));
					this.selectedPlayersByPosition.unshift(
						...this.positionCategories.map(position => ({ position, players: [], allSelected: false }))
					);
					this.selectablePlayers.unshift(
						...this.positionCategories.map(position => ({ position, players: [], allSelected: false }))
					);
				}
			});

		this.getDropdownList();
		this.currentEventSeason = this.currentTeamService.getSeasonById(this.event.teamSeasonId);
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['event'] && !!this.event) {
			this.currentEventSeason = this.currentTeamService.getSeasonById(this.event.teamSeasonId);
			this.getServerData(this.event);
		}
		if (changes['tests']) {
			this.testList = (this.tests || []).map(({ name, id }) => ({ label: name, value: id }));
		}
	}

	private mapJsonSchemaToSchema(template: JsonSchema): Schema {
		const item = this.schemaConversionService.convertToFormStructure(template);
		item.sections.forEach(
			section =>
				(section.properties = this.schemaConversionService
					.getOrderedProperties(section.properties, section?.metadata?.order)
					.map(prop => ({
						...prop,
						options: getOptionsByType(prop)
					})))
		);
		return item;
	}

	private getActivePlayersOptions(players: Player[]): SelectItem[] {
		return players.map(player => ({
			label: player.displayName,
			value: player.id
		}));
	}

	private getActiveStaffsOptions(staffs: Staff[]): SelectItem[] {
		return staffs.map(staff => ({
			label: `${staff.firstName} ${staff.lastName}`,
			value: staff.id,
			customerId: staff.customerId
		}));
	}

	ngAfterViewChecked() {
		this.cdRef.detectChanges();
	}

	isOnEditMode(): boolean {
		return this.editService.editMode;
	}

	hasDrills() {
		return (
			this.event.format === 'training' || (this.event.format === 'medical' && this.event.theme === 'reconditioning')
		);
	}

	// getData(player: PlayerWithHealthStatus) {
	// 	const selected = this.isSelected(player);
	// 	const modified = this.isModified(player);
	// 	const selection = this.canBeSelectedObj(player);
	// 	const eventPlayer = this.getEventPlayer(player);
	// 	return {
	// 		player,
	// 		selected,
	// 		modified,
	// 		selection,
	// 		eventPlayer
	// 	};
	// }

	onAddPlayerToParticipants(player: PlayerWithHealthStatus) {
		const selectedPlayerIds = this.selectedPlayers.map(({ id }) => id);
		if (selectedPlayerIds.includes(player.id)) {
			player.modified = false;
			this.selectedPlayers = this.selectedPlayers.filter(({ id }) => id !== player.id);
		} else {
			player.modified = false;
			this.selectedPlayers.push(player);
		}
		this.event.playerIds = this.getPlayerIds();
		this.checkAllSelected();
	}

	onCheckModifiedPlayer(player: PlayerWithHealthStatus, modified: boolean) {
		if (this.event.format === 'training') {
			player.modified = modified;
			this.selectedPlayers = (this.selectedPlayers || []).map(p => {
				if (p.id === player.id) {
					p.modified = modified;
				}
				return p;
			});
			this.event.playerIds = this.getPlayerIds();
		}
	}

	onAddStaffToParticipants(staff: Staff) {
		this.selectedStaff = !this.selectedStaff.includes(staff)
			? [...this.selectedStaff, staff]
			: this.selectedStaff.filter(x => x !== staff);
		this.event.staffIds = this.getStaffIds();
		this.checkAllStaffSelected();
	}

	toggleAllPlayers(checked: boolean) {
		this.getSelectablePlayers().forEach(selectablePlayer => {
			this.selectAllPlayersForPosition(checked, selectablePlayer);
		});
	}

	selectAllPlayersForPosition(checked: boolean, selectablePlayer: SelectablePlayer) {
		selectablePlayer.allSelected = checked;
		if (checked) {
			selectablePlayer.players.forEach((player: PlayerWithHealthStatus) => {
				if (!this.selectedPlayers.includes(player) && this.canBeSelected(player)) {
					player.modified = false;
					this.selectedPlayers = [...this.selectedPlayers, player];
				}
			});
		} else {
			selectablePlayer.players.forEach(player => {
				this.selectedPlayers = this.selectedPlayers.filter(({ id }) => id !== player.id);
			});
		}
		this.event.playerIds = this.getPlayerIds();
	}

	selectAllStaffs({ checked }, selectableStaff: SelectableStaff) {
		selectableStaff.allSelected = checked;
		if (checked) {
			selectableStaff.staff.forEach((staff: Staff) => {
				if (!this.selectedStaff.includes(staff)) {
					this.selectedStaff = [...this.selectedStaff, staff];
				}
			});
		} else {
			selectableStaff.staff.forEach((staff: Staff) => {
				this.selectedStaff = this.selectedStaff.filter(({ id }) => id !== staff.id);
			});
		}
		this.event.staffIds = this.getStaffIds();
	}

	private setEnabledPlayers(checked: boolean, data: PlayerMatchStat) {
		const side = this.event.home ? 'home' : 'away';
		const enabledIds = this.playersStatsEnabledPipe
			.transform(this.sidesMatchStats, side)
			.map(({ playerId }) => playerId);
		this.selectedPlayers = this.players.filter(({ id }) => (enabledIds || []).includes(id));
		if (!checked) {
			data.minutesPlayed = null;
			data.substituteInMinute = null;
			data.substituteOutMinute = null;
			data.yellowCard = null;
			data.redCard = null;
			data.score = null;
			data.assists = null;
			data.conversion = null;
			data.startingRoster = null;
			data.scoreSet1 = null;
			data.scoreSet2 = null;
			data.scoreSet3 = null;
			data.scoreSet4 = null;
			data.scoreSet5 = null;
		}
	}

	isDisabledForGame(data: PlayerMatchStat): boolean {
		const player = this.players.find(({ id }) => id === data.playerId);
		return player ? player.healthStatus.available === InjuryAvailability.NotAvailable : true;
	}

	gameSelectAll(checked: boolean, position: PlayerPosition) {
		this.selectAllGameForPosition(position, checked);
	}

	getConfigTime(): string {
		const isMoreThanOneDay = moment(this.event.end).diff(moment(this.event.start), 'days') > 0;
		return isMoreThanOneDay ? null : moment(this.start_hour, 'HH:mm').format('HH:mm');
	}

	onStartDateChange(date: Date) {
		if (date && !this.seasonAtDateExists(date)) {
			this.notificationService.notify('info', 'navigator.planning', 'alert.noSeasonFoundForDate');
			this.askForCreatingNewSeason(date);
		} else if (
			date &&
			this.isDateInDifferentSeason(date) &&
			(this.hasSomeEventPlayersNotInSelectedSeason(date) || this.hasSomeEventStaffNotInSelectedSeason(date))
		) {
			const playersNotInSeason = this.getEventPlayersNotInSelectedSeason(date);
			const staffNotInSeason = this.getEventStaffNotInSelectedSeason(date);
			this.askForCopyEventPlayersAndStaffToSeason(date, playersNotInSeason, staffNotInSeason);
			const selectedDateSeason = this.currentTeamService.getSeasonAtDate(date);
			this.event.teamSeasonId = selectedDateSeason.id;
		} else {
			if (!date) {
				this.startDate = this.event.start;
			} else {
				this.startDate = date;
				if (this.isDateInDifferentSeason(date)) {
					const selectedDateSeason = this.currentTeamService.getSeasonAtDate(date);
					this.event.teamSeasonId = selectedDateSeason.id;
				}
			}
			this.startDateChecksDone();
		}
		// TODO FEATURE PAUSED this.setRepeatList(date);
	}

	private startDateChecksDone() {
		this.getDates();
		this.getEndDateAuto();
	}

	private isValidHourFormat(hour: string): boolean {
		return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hour);
	}

	getStartDate(value?: string) {
		if (this.isValidHourFormat(value)) {
			this.start_hour = value;
			this.getDates();
			this.getEndDateAuto();
		}
	}

	onEndDateChange(value: Date) {
		if (!value) {
			this.getEndDateAuto();
		} else {
			this.endDate = value;
		}
		this.getDates();
	}

	getEndDate(value?: string) {
		if (this.isValidHourFormat(value)) {
			this.end_hour = value;
			this.getDates();
			this.setEventDuration(this.event);
			this.getEventTime();
		}
	}

	//#region Check Event Date in Different Season
	private seasonAtDateExists(date: Date): boolean {
		const selectedDateSeason = this.currentTeamService.getSeasonAtDate(date);
		return !!selectedDateSeason;
	}

	private isDateInDifferentSeason(date: Date): boolean {
		const selectedDateSeason = this.currentTeamService.getSeasonAtDate(date);
		return selectedDateSeason.id !== this.currentEventSeason.id;
	}

	private hasSomeEventPlayersNotInSelectedSeason(date: Date): boolean {
		const selectedDateSeason = this.currentTeamService.getSeasonAtDate(date);
		return this.event.playerIds.some(playerId => !(selectedDateSeason?.playerIds || []).includes(playerId));
	}
	private getEventPlayersNotInSelectedSeason(date: Date): string[] {
		const selectedDateSeason = this.currentTeamService.getSeasonAtDate(date);
		return this.event.playerIds.filter(playerId => !(selectedDateSeason?.playerIds || []).includes(playerId));
	}

	private hasSomeEventStaffNotInSelectedSeason(date: Date): boolean {
		const selectedDateSeason = this.currentTeamService.getSeasonAtDate(date);
		return this.event.staffIds.some(staffId => !(selectedDateSeason?.staffIds || []).includes(staffId));
	}
	private getEventStaffNotInSelectedSeason(date: Date): string[] {
		const selectedDateSeason = this.currentTeamService.getSeasonAtDate(date);
		return this.event.staffIds.filter(staffId => !(selectedDateSeason?.staffIds || []).includes(staffId));
	}
	private askForCreatingNewSeason(eventDate: Date) {
		const ref = this.dialogService.open(ConfirmationDialogComponent, {
			data: {
				description: this.translate.instant('confirm.createNewSeason', { value: this.currentEventSeason.name }),
				actionTrueLabel: 'buttons.add'
			},
			width: '40%',
			closable: false
		});
		ref.onClose.pipe(take(1)).subscribe({
			next: (result: { choice: boolean }) => {
				if (result) {
					this.createNewSeason(this.currentEventSeason, eventDate);
				}
			}
		});
	}

	private createNewSeason(season: TeamSeason, eventDate: Date) {
		const currentTeam = this.currentTeamService.getCurrentTeam();
		this.teamApi
			.createTeamSeasons(
				currentTeam.id,
				new TeamSeason({
					...this.currentTeamService.getDefaultTeamSeasonData(eventDate),
					playerIds: season ? season?.playerIds : [],
					staffIds: season ? season?.staffIds : []
				})
			)
			.pipe(first(), untilDestroyed(this))
			.subscribe(
				result => {
					this.event.teamSeasonId = result.id;
					currentTeam.teamSeasons = [result, ...currentTeam.teamSeasons];
					this.currentTeamService.setCurrentTeam(currentTeam);
					this.notificationService.notify('success', 'home.clubSettings', 'alert.recordCreated', false);
					this.startDate = eventDate;
					this.startDateChecksDone();
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	private askForCopyEventPlayersAndStaffToSeason(
		eventDate: Date,
		missingSelectedPlayerIds: string[] = [],
		missingSelectedStaffIds: string[] = []
	) {
		const playersNotInSeasonDisplayNames = missingSelectedPlayerIds
			.map(playerId => this.allPlayers.find(({ id }) => id === playerId).displayName)
			.join(', ');
		const staffNotInSeasonDisplayNames = missingSelectedStaffIds
			.map(staffId => this.allStaffs.find(({ id }) => id === staffId).displayName)
			.join(', ');
		const selectedDateSeason = this.currentTeamService.getSeasonAtDate(eventDate);
		const ref = this.dialogService.open(ConfirmationDialogComponent, {
			data: {
				description: this.translate.instant('confirm.copyEventPlayersAndStaffToSeason', {
					value: selectedDateSeason.name,
					players: playersNotInSeasonDisplayNames,
					staff: staffNotInSeasonDisplayNames
				}),
				actionTrueLabel: 'buttons.copyAll',
				actionFalseLabel: 'buttons.copySelected'
			},
			width: '40%',
			closable: false
		});
		ref.onClose.pipe(take(1)).subscribe({
			next: (result: { choice: boolean }) => {
				if (result) {
					const copyAll = result.choice;
					const playerIdsToCopy: string[] = copyAll ? this.currentEventSeason.playerIds : missingSelectedPlayerIds;
					const staffIdsToCopy: string[] = copyAll ? this.currentEventSeason.staffIds : missingSelectedStaffIds;
					this.addPlayersToSeason(selectedDateSeason, playerIdsToCopy, staffIdsToCopy, eventDate);
				}
			}
		});
	}

	private addPlayersToSeason(season: TeamSeason, playerIds: string[], staffIds: string[], eventDate: Date) {
		const currentTeam = this.currentTeamService.getCurrentTeam();
		this.teamSeasonApi
			.updateAttributes(season.id, {
				...season,
				playerIds: uniq([...(season?.playerIds || []), ...playerIds]),
				staffIds: uniq([...(season?.staffIds || []), ...staffIds]),
				resync: true
			})
			.pipe(first(), untilDestroyed(this))
			.subscribe(
				result => {
					currentTeam.teamSeasons = currentTeam.teamSeasons.map(teamSeason => {
						if (teamSeason.id === season.id) {
							return result;
						}
						return teamSeason;
					});
					this.currentTeamService.setCurrentTeam(currentTeam);
					this.notificationService.notify('success', 'home.clubSettings', 'alert.recordCreated', false);
					this.startDate = eventDate;
					this.startDateChecksDone();
				},
				(error: Error) => this.error.handleError(error)
			);
	}
	//endregion

	checkTheme(event) {
		this.event.individual = this.tempEvent.individual;
		if (event.value === 'recovery') {
			this.event.workload = 1;
		} else if (event.value === 'reconditioning') {
			this.event.individual = true;
		}
	}

	save(f: NgForm) {
		this.form = f;
		this.confirmEdit();
	}

	filterThemes(event, rowData) {
		this.allDrillThemeList = this.allDrillThemeListBackup.filter(({ label }) => {
			return label.toLowerCase().indexOf(event.query.toLowerCase()) > -1;
		});
	}

	selectTheme(event: AutoCompleteSelectEvent, rowData, reset = true) {
		const model = this.allDrillThemeListBackup.find(({ value }) => value === event.value.value);
		rowData.themeModel = model || { label: '', value: null };

		if (reset) {
			rowData.drillDetail = null;
			rowData.drill.drillsId = null;
			rowData.drill.name = '';
		}
	}

	resetDrillsList(rowData?) {
		this.drillsList = this.drillsListBackup;
		this.allDrillThemeList = cloneDeep(this.allDrillThemeListBackup);
		if (rowData) {
			rowData.drill.tempSharedWithOptions = [];
			rowData.drill.tempSharedWithIds = [];
		}
	}

	filterDrills(event, rowData) {
		if (rowData.themeModel && rowData.themeModel.value) {
			this.drillsList = this.drillsListBackup
				.filter(({ theme }) => theme === rowData.themeModel.value)
				.filter(({ name }) => {
					return name.toLowerCase().indexOf(event.query.toLowerCase()) > -1;
				});
		} else {
			this.drillsList = this.drillsListBackup.filter(({ name }) => {
				return name.toLowerCase().indexOf(event.query.toLowerCase()) > -1;
			});
		}
	}

	selectDrill(event: Drill, rowData) {
		rowData.drill.drillsId = event.id;
		const drillDetail = (this.drillsListBackup || []).find(({ id }) => id === event.id);
		rowData.drill = {
			...rowData.drill,
			name: event.name,
			tempSharedWithOptions: this.getDrillSharedWithOptions(drillDetail)
		};
		rowData.drillDetail = drillDetail;
		const currentTheme = this.allDrillThemeListBackup.find(({ value }) => value === event.theme);
		rowData.themeModel = this.getThemeModel(currentTheme, event);
	}

	selectShareWith({ value }, rowData): void {
		rowData.drill.tempSharedWithIds = value;
	}

	private getOptionsIdsByGroup(group: 'players' | 'staffs', options: SelectItemGroup[]): string[] {
		return options.filter(({ value }) => value === group).map(({ items }) => items.map(({ value }) => value))[0];
	}

	selectParticipants({ value }, rowData) {
		rowData.drill.participantsIds = value;
	}

	handleClick(): void {
		// Puoi aggiungere qui la logica desiderata in risposta al clic
	}

	getLinkColor(val) {
		return val ? '#fafafa' : '#bbbbbb';
	}

	hasMissingResult() {
		const formatsWithMandatoryResults: EventFormat[] = ['game', 'clubGame'];
		return (
			!this.editService.editMode &&
			formatsWithMandatoryResults.indexOf(this.event.format as EventFormat) > -1 &&
			!this.event.result &&
			moment(this.event.start).isBefore(moment())
		);
	}

	onSelectCompetition({ value }) {
		// TODO: check wyscout clubGame players for National Club
		if (this.event.format === 'game') {
			const competition = this.competitionList.find(x => x.value === value);
			if (competition) {
				this.event.subformatDetails = competition.label;
			}
			let stage = value;
			if (
				value === 'nationalLeague' ||
				value === 'nationalCup' ||
				value === 'tournamentQualifiers' ||
				value === 'tournamentFinalStages'
			) {
				stage = this.getThirdPartyStage(value);
			}
			this.selectedCompetition = this.currentEventSeason.competitionInfo.find(
				x => x.competition.toString() === stage.toString()
			);
		}
		this.selectedLineup = this.selectedCompetition?.lineup || this.currentEventSeason.playerIds;

		if (this.selectedLineup && this.sidesMatchStats) {
			const side = this.event.home ? 'home' : 'away';
			(this.sidesMatchStats[side].players || []).forEach((player: ThirdPartyLinkedPlayer) => {
				if (!this.selectedLineup.includes(player.playerStats.playerId)) {
					player.playerStats.enabled = false;
					this.setEnabledPlayers(player.playerStats.enabled, player.playerStats);
				}
			});
		}
		// this.checkAllSelectedGame();
		this.loadOpponents(this.selectedCompetition);
	}

	private getThirdPartyStage(stageName: NationalStage): any[] {
		switch (stageName) {
			case 'nationalLeague':
				return this.currentEventSeason.wyscoutNationalLeague
					? this.currentEventSeason.wyscoutNationalLeague
					: this.currentEventSeason.instatNationalLeague;
			case 'nationalCup':
				return this.currentEventSeason.wyscoutNationalCup
					? this.currentEventSeason.wyscoutNationalCup
					: this.currentEventSeason.instatNationalCup;
			case 'tournamentQualifiers':
				return this.currentEventSeason.wyscoutTournamentQualifiers
					? this.currentEventSeason.wyscoutTournamentQualifiers
					: this.currentEventSeason.instatTournamentFinalStages;
			case 'tournamentFinalStages':
				return this.currentEventSeason.wyscoutTournamentFinalStages
					? this.currentEventSeason.wyscoutTournamentFinalStages
					: this.currentEventSeason.instatTournamentFinalStages;
			default:
				console.warn('the provided stageName is not supported');
		}
	}

	onChangeOpponent(opponent: SelectItem<DropDownOpponent>) {
		this.changeOpponent(opponent.value);
	}

	onRowReorder(e) {
		this.cdRef.markForCheck();
	}

	isFutureEvent(event) {
		return moment(event.start).isAfter(moment());
	}

	//region Training PDF Report

	downloadReportTraining() {
		const t = this.translate.instant.bind(this.translate);

		const start = moment(this.startDate).format(getMomentFormatFromStorage());
		const end = moment(this.endDate).format(getMomentFormatFromStorage());
		const hours = this.event.allDay ? '' : `${this.start_hour}-${this.end_hour}`;
		const data = {
			info: [
				[
					{ label: t('event.name'), value: this.event.title },
					{
						label: t('event.created'),
						value: this.event.author
					}
				],
				[
					{ label: t('sidebar.date'), value: `${start} ${hours} ${end}` },
					{
						label: t('event.duration'),
						value: this.event.duration
					}
				],
				[{ label: t('event.where'), value: this.event.where, colspan: 3 }],
				[
					{
						label: t('event.description'),
						value: this.event.description,
						colspan: 3
					}
				],
				[
					{
						label: t('event.format'),
						value: t('event.format.training')
					},
					{ label: t('event.type'), value: this.gameDay }
				],
				[
					{
						label: t('event.theme'),
						value: this.getLabel(this.themeList, this.event.theme)
					},
					{
						label: t('event.workload'),
						value: this.getLabel(this.effortList, this.event.workload)
					}
				],
				[
					{
						label: t('squads.players.tabs.notes'),
						value: parseHtmlStringToText(this.event.notes)
					}
				]
				// [
				// 	{
				// 		label: t('event.nutritionalStrategy'),
				// 		value:
				// 			t('event.nutritionalStrategy.pre').toUpperCase() +
				// 			': ' +
				// 			this.getLabels(this.nutritional, this.event.nutritionalPre),
				// 		colspan: 3
				// 	}
				// ],
				// [
				// 	{
				// 		label: '',
				// 		value:
				// 			t('event.nutritionalStrategy.during').toUpperCase() +
				// 			': ' +
				// 			this.getLabels(this.nutritional, this.event.nutritionalDuring),
				// 		colspan: 3
				// 	}
				// ],
				// [
				// 	{
				// 		label: '',
				// 		value:
				// 			t('event.nutritionalStrategy.post').toUpperCase() +
				// 			': ' +
				// 			this.getLabels(this.nutritional, this.event.nutritionalPost),
				// 		colspan: 3
				// 	}
				// ],
				// [
				// 	{
				// 		label: t('event.recoverySrategy'),
				// 		value: this.getLabels(this.recovery, this.event.recoveryStrategy),
				// 		colspan: 3
				// 	}
				// ]
			],
			headers: {
				player: `${this.selectedPlayers.length} ${t('event.partecipants')}`,
				planned: t('event.drill.planned'),
				actual: t('event.drill.actual'),
				teamTrainingReport: t('teamReport'),
				trainingReportTable: t('scouting.gameReports')
			},
			players: [
				{
					position: t('roles.categories.noPosition'),
					players: this.toPlayers('noPosition')
				},
				...this.positionCategories.map(category => ({
					position: t(`roles.categories.${category}s`),
					players: this.toPlayers(category)
				})),
				{
					position: 'Staff',
					players: this.toStaff('staff')
				}
			],
			drills: {
				planned: (this.plannedDrillList || []).map(({ drill, drillDetail }) => ({
					index: {
						label: null,
						value: this.getDrillGroupForPdf(drill)
					},
					theme: {
						label: t('drills.theme'),
						value: this.getLabel(this.allDrillThemeListBackup, drill.theme)
					},
					drill: {
						label: t('event.drill'),
						value: this.getLabel(this.drillsList, drill.name)
					},
					sets: {
						label: t('event.drill.sets'),
						value: drill.sets
					},
					reps: {
						label: t('event.drill.reps'),
						value: drill.reps
					},
					count: {
						label: t('event.drill.count'),
						value: drill.count
					},
					rest: {
						label: t('event.drill.rest'),
						value: drill.rest
					},
					duration: {
						label: t('event.drill.duration'),
						value: `${!isNaN(drill.duration / 60) ? `${drill.duration / 60} min` : '-'}`
					},
					details: {
						...{
							...drillDetail,
							description: parseHtmlStringToText(drillDetail?.description),
							rules: parseHtmlStringToText(drillDetail?.rules)
						},
						image: this.hasAttachment(drillDetail)
							? this.isImage(drillDetail._attachments[0].downloadUrl)
								? this.azureUrl.transform(drillDetail._attachments[0].downloadUrl)
								: null
							: null
					},
					players: {
						label: t('players'),
						value: this.getSelectablePlayers().map(value => ({
							label: t(`roles.categories.${value.position}s`),
							value: value.players
								.filter(({ id }) => (drill.participantsIds || []).includes(id))
								.map(({ downloadUrl, displayName }) => ({ downloadUrl, displayName }))
						}))
					}
				})),
				actual: (this.actualDrillList || []).map(drill => ({
					theme: {
						label: t('drills.theme'),
						value: this.getLabel(this.allDrillThemeListBackup, drill.theme)
					},
					drill: {
						label: t('event.drill'),
						value: this.getLabel(this.drillsList, drill.name)
					},
					sets: {
						label: t('event.drill.sets'),
						value: drill.sets
					},
					reps: {
						label: t('event.drill.reps'),
						value: drill.reps
					},
					count: {
						label: t('event.drill.count'),
						value: drill.count
					},
					rest: {
						label: t('event.drill.rest'),
						value: drill.rest
					},
					duration: {
						label: t('event.drill.duration'),
						value: this.getDuration(drill.duration)
					}
				}))
			},
			teamTrainingReport: this.teamReport,
			trainingReportTable: this.getMixedTableTrainingPlayerReport(t)
		};
		this.reportService.getReport('planning_training_v2', data, '', null, `Training Session - ${this.event.title}`);
	}

	private hasAttachment(drillDetail: Drill): boolean {
		return drillDetail && drillDetail._attachments[0] && drillDetail._attachments[0].downloadUrl;
	}

	private isImage(url: string): boolean {
		return last(url.split('.')) !== 'mp4';
	}

	private getMixedTableTrainingPlayerReport(t): PdfMixedTable {
		return {
			headers: getPlayerReportTableHeaders(t, this.activePlayerReportTemplate),
			rows: (this.getTrainingReports() || []).map(report => {
				const player = this.getCorrectPlayer(report.playerId);
				return getPlayerTrainingReportTableRows(report, this.activePlayerReportTemplate, player);
			})
		};
	}
	//endregion

	//region Game PDF Report
	downloadReportGame() {
		const t = this.translate.instant.bind(this.translate);
		const isCurrentTeamHome = this.event.home;
		const title = t('navigator.planning').toUpperCase();
		const subTitle = t('club.settings.scouting.gameReport').toUpperCase();
		const myTeamStats = isCurrentTeamHome ? this.sidesMatchStats.home.players : this.sidesMatchStats.away.players;
		const opponentStats = isCurrentTeamHome ? this.sidesMatchStats.away.players : this.sidesMatchStats.home.players;
		const report: EventGamePDFReport = {
			header: {
				title,
				subTitle
			},
			metadata: {
				createdLabel: `${t('general.createdOn')} ${moment(new Date()).format(`${getMomentFormatFromStorage()} hh:mm`)}`
			},
			headers: {
				overview: t('profile.overview'),
				matchStats: t('event.game.stats'),
				myTeamTable: t('profile.myTeam'),
				opponentTable: t('sidebar.opponent'),
				myTeamGameReport: t('teamReport'),
				myTeamGameReportTable: t('scouting.gameReports')
			},
			summary: this.getPdfGameSummary(),
			matchInfo: this.getMatchInfoForPdf(),
			matchStats: this.getMatchStatsForPdf(),
			myTeamTable: this.getMixedTableMatchStats(
				this.validPlayerStats(myTeamStats),
				getGameHeaders(t, this.sportType, true)
			),
			opponentTable: this.getMixedTableMatchStats(opponentStats, getGameHeaders(t, this.sportType, false)),
			myTeamGameReport: this.teamReport,
			myTeamGameReportTable: this.getMixedTableGamePlayerReport(this.validPlayerStats(myTeamStats), t)
		};
		this.reportService.getReport(getPDFv2Path('planning', 'planning_game', true), report, '', null, `${title}`);
	}

	private getMatchStatsForPdf(): StatsResult[] {
		return this.thirdPartySelected
			? getStats(this.thirdPartySelected).map(stat => ({
					...stat,
					item: {
						...stat.item,
						label: this.translate.instant(stat.item.label)
					}
				}))
			: null;
	}

	private getMatchInfoForPdf(): PdfMatchInfo {
		if (!this.thirdPartySelected) return null;
		return {
			home: {
				team: this.thirdPartySelected.home.officialName,
				score: this.thirdPartySelected.home.teamData.score,
				imageDataURL: this.thirdPartySelected.home.imageDataURL
			},
			away: {
				team: this.thirdPartySelected.away.officialName,
				score: this.thirdPartySelected.away.teamData.score,
				imageDataURL: this.thirdPartySelected.away.imageDataURL
			}
		};
	}

	private getMixedTableGamePlayerReport(stats: ThirdPartyLinkedPlayer[], t): PdfMixedTable {
		return {
			headers: getPlayerReportTableHeaders(t, this.activePlayerReportTemplate),
			rows: (stats || []).map(stats => getPlayerGameReportTableRows(stats, this.activePlayerReportTemplate))
		};
	}

	private getMixedTableMatchStats(players: ThirdPartyLinkedPlayer[], headers: MixedType[]): PdfMixedTable {
		const rows: MixedType[][] = players
			.filter(player => player.playerStats.enabled)
			.map(player => {
				return headers.map(({ value }) => {
					return getMixedValueTypeFromHeader(value as string, player, this.players);
				});
			});
		return { headers, rows };
	}

	private getPdfGameSummary(): (PdfBasicType & { colspan?: number })[][] {
		const t = this.translate.instant.bind(this.translate);
		const start = moment(this.startDate).format(getMomentFormatFromStorage());
		const end = moment(this.endDate).format(getMomentFormatFromStorage());
		const hours = this.event.allDay ? '' : `${this.start_hour}-${this.end_hour}`;
		return [
			[
				{ label: t('event.name'), value: this.event.title },
				{
					label: t('event.where'),
					value: this.event.where,
					colspan: 3
				}
			],
			[
				{ label: t('sidebar.date'), value: `${start} ${hours} ${end}` },
				{
					colspan: 3,
					label: t('event.duration'),
					value: this.event.duration
				}
			],
			[
				{
					colspan: 5,
					label: t('event.subformat'),
					value: this.getLabel(this.subformatList, this.event.subformatDetails)
				}
			],
			[
				{ label: t('event.opponent'), value: this.event.opponent },
				{ label: t('matchAnalysis.result'), value: this.event.result + '(' + t(getResult(this.event)) + ')' },
				{ label: null, value: t(this.event.home ? 'sidebar.homeValue' : 'sidebar.awayValue') }
			]
		];
	}
	//endregion

	// TODO: add american football and ice hockey
	private getReportTitle(sportType: string): string {
		switch (sportType) {
			case 'rugby':
			case 'rugbyLeague':
				return 'planning_game_rugby';
			case 'volleyball':
				return 'planning_game_volleyball';
			default:
				return 'planning_game';
		}
	}

	isIncludedInCompetitionList(playerId: string): boolean {
		return this.selectedLineup ? this.selectedLineup.includes(playerId) : true;
	}

	/**
	 * This is called on click on 'reset gps data' button. Visible on edit mode only.
	 * Call remote method 'resetGpsData' to "reset" gps data on button click of any of the event.
	 */
	onResetGpsButtonClick() {
		this.eventApi
			.resetGPSDataForSingleEvent(this.event.id)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (results: Event) => {
					this.event = results;
					this.saveTemp();
					this.notificationService.notify('success', 'buttons.reset.gps', 'alert.recordUpdated', false);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	getMedicalName(treatment, type: MedicalFieldType = 'treatment'): string {
		return this.medicalEventService.getTreatmentName(treatment, type as MedicalFieldType);
	}

	getMedicalDescription(treatment, type: MedicalFieldType = 'treatment'): string {
		return this.medicalEventService.getTreatmentCategory(treatment, type as MedicalFieldType);
	}

	getCompleteClass(rowData: TreatmentType): { class: string; color: string } {
		return TrtUtilsService.getCompleteStyle(rowData);
	}

	getCompleteTitle(rowData: TreatmentType): 'Not complete' | 'Pending' | 'Complete' {
		return TrtUtilsService.getCompleteTitle(rowData);
	}

	addDrillExecuted() {
		const drillInstance = {
			id: uuid(),
			drill: {},
			drillDetail: null,
			themeModel: null
		};
		this.actualDrillList = [...this.actualDrillList, drillInstance];
		this.resetDrillsList();
	}

	removeDrillExecutedInstance(rowData) {
		this.actualDrillList = this.actualDrillList.filter(({ id }) => id !== rowData.id);
	}

	removeDrillInstance(rowData) {
		this.plannedDrillList = this.plannedDrillList.filter(({ id }) => id !== rowData.id);
	}

	addDrillInstance(event) {
		const drillInstance = {
			id: uuid(),
			drill: {
				tempSharedWithIds: []
			},
			drillDetail: null,
			themeModel: null
		};
		this.plannedDrillList = [...this.plannedDrillList, drillInstance];
		this.resetDrillsList();
	}

	addNewDrill(name: string, rowData) {
		if (!!name && name.length > 0) {
			const newD = new Drill({
				name,
				theme: rowData?.themeModel?.value,
				_attachments: [],
				sharedWithIds: [this.authService.getCurrentUserId()],
				authorId: this.authService.getCurrentUserId()
			});
			this.teamApi
				.createDrills(this.authService.getCurrentUserData().currentTeamId, newD)
				.pipe(untilDestroyed(this))
				.subscribe({
					next: (newDrill: Drill) => {
						this.drillsList = [...this.drillsList, newDrill];
						this.drillsListBackup = [...this.drillsListBackup, newDrill];
						this.selectDrill(newDrill, rowData);
					},
					error: (error: Error) => this.error.handleError(error)
				});
		}
	}

	computeDrillDuration(rowData) {
		const drill = rowData.drill;
		if (drill.sets && drill.reps && drill.rest) {
			drill.duration =
				drill.sets *
					(moment.duration('00:' + drill.reps).asSeconds() + moment.duration('00:' + drill.rest).asSeconds()) -
				moment.duration('00:' + drill.rest).asSeconds();
			drill.durationMin = drill.duration / 60;
		} else {
			drill.durationMin = 0;
			drill.duration = 0;
		}
	}

	computeDrillMinDuration(rowData) {
		const drill = rowData.drill;
		drill.duration = drill.durationMin * 60;
	}

	// onPlannedReorder(e) {
	// 	this.event._drills = this.move(this.event._drills, e.dragIndex, e.dropIndex);
	// 	this.setPlannedData();
	// }

	onTitleChange(event: string) {
		this.event.title = event;
		this.titleChanged.emit(event);
	}

	confirmChangeFormat(event: DropdownChangeEvent) {
		const value = event.value as EventFormat;
		if (
			value === 'training' ||
			value === 'game' ||
			value === 'clubGame' ||
			value === 'friendly' ||
			value === 'medical'
		) {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.format'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.checkFormat(value);
				},
				reject: () => {
					this.event.format = this.tempEvent.format;
				}
			});
		} else {
			this.checkFormat(value);
		}
	}

	getSessionAnalysisParams(event: Event) {
		if (!this.isFutureEvent(event)) {
			if (event.gpsSessionLoaded) {
				return {
					id: event.id
				};
			} else {
				return {
					id: event.id,
					metric: 'rpe'
				};
			}
		}

		return null;
	}

	goToSessionAnalysis(event: Event): void {
		let params;

		if (!this.isFutureEvent(event)) {
			if (event.gpsSessionLoaded) {
				params = {
					season_id: event.teamSeasonId,
					session_id: event.id
				};
			} else {
				params = {
					season_id: event.teamSeasonId,
					session_id: event.id,
					metric: 'rpe'
				};
			}

			this.router.navigate(['/performance/session-analysis', params]);
		}
	}

	getLinkMAGame(event: Event) {
		if (event.match) {
			return [
				'/manager/tactics',
				{
					id: event.id
				}
			];
		} else {
			return null;
		}
	}

	getLinkTest(event: Event) {
		let params;
		if (event.testInstance) {
			if (!event.testModel) {
				return null;
			} else {
				params = {
					testId: event.testModel,
					id: event.testInstance.id
				};
				if (this.tests.find(({ id }) => id === event.testModel).medical === true) {
					return ['/medical/examination', params];
				} else {
					return ['/performance/assessments', params];
				}
			}
		} else return null;
	}

	checkIfDisabled(data): boolean {
		return !this.editService.editMode || !data.enabled;
	}

	getModifiedPlayers(): number {
		return this.selectedPlayers.filter(({ modified }) => modified)?.length;
	}

	emitResync() {
		this.resyncEmitter.emit(this.event);
	}

	getJerseyNumber(playerId: string): number {
		const player = this.players.find(({ id }) => id === playerId);
		return player ? player?.jersey : null;
	}

	createTestInstance({ value }: { value: string }) {
		const name = this.tests.find(({ id }) => id === value).name;
		this.event.title = `Assessment: ${name}`;
	}

	canBeSelectedObj(player: PlayerWithHealthStatus): { selectable: boolean; cause: string } {
		if (this.event.format === 'off') return { selectable: true, cause: '' };
		if (this.selectedPlayers.find(({ id }) => id === player.id)) {
			return { selectable: true, cause: '' };
		}
		const start = this.startDate || this.event.start;
		const end = this.endDate || this.event.end;
		const off = this.events.find(e => {
			if (
				e.id !== this.event.id &&
				(e.format === 'off' || e.format === 'international') &&
				e.playerIds.includes(player.id) &&
				moment(e.end).subtract(1, 'second').isAfter(start) &&
				e.start < end
			)
				return true;
			return false;
		});

		if (off) return { selectable: false, cause: off.format };
		if (this.event.individual) return { selectable: true, cause: '' };
		if (this.event.format === 'training' || this.event.format === 'game' || this.event.format === 'clubGame') {
			if (player.healthStatus.available === InjuryAvailability.NotAvailable) {
				return { selectable: false, cause: this.translate.instant('tooltip.injured') };
			}
		}
		return { selectable: true, cause: '' };
	}

	// public methods used by PlanningComponent

	edit() {
		this.saveTemp();
		this.editService.editMode = true;
		if (this.event.title !== this.event.format) {
			this.checkAllSelected();
		}
	}

	confirmDelete() {
		const videoReminder = ['game', 'training'].includes(this.event.format.toLowerCase())
			? ' ' + this.translate.instant('confirm.delete.videoLinked')
			: '';
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.delete') + videoReminder,
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				this.deleteEvent();
			}
		});
	}

	discard(confirmed: boolean = false) {
		this.editService.editMode = false;
		this.loadTemp();
		this.scaffoldGamePlayers();
		// this.checkAllSelectedGame();
		this.setTableData();
		this.getEventTime();
		this.selectedPlayers =
			this.players?.length > 0 ? this.players.filter((p: Player) => this.event.playerIds.includes(p.id)) : [];
		if (confirmed) this.closePanel(this.event);
	}

	confirmDiscard() {
		if (this.editService.editMode === true) {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.editPlanning'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					if (this.newEvent) this.deleteEvent();
					else this.discard(true);
				}
			});
		} else {
			this.closePanel();
		}
	}

	selectClubGameHomeTeam(team: SearchResultTeam) {
		this.event.clubGameHomeTeam = team?.name;
	}

	selectClubGameAwayTeam(team: SearchResultTeam) {
		this.event.clubGameAwayTeam = team?.name;
	}

	gameSideChanged() {
		this.loadSidesMatchStats();
	}

	private fixMinDuration(drill) {
		if (drill.duration && !drill.durationMin) {
			drill.durationMin = drill.duration / 60;
		}
	}

	private async confirmEdit() {
		const hasMedicalTreatmentChanged =
			this.isMedicalTreatmentEvent() && this.medicalTreatmentsComponent?.hasSomeRowsChanged();
		const eventHasChanged =
			JSON.stringify(this.tempEvent) !== JSON.stringify(this.event) ||
			JSON.stringify(this.tempDrills) !== JSON.stringify(this.plannedDrillList) ||
			JSON.stringify(this.tempExecuted) !== JSON.stringify(this.actualDrillList) ||
			JSON.stringify(this.tempPlayersMatchStat) !== JSON.stringify(this.event._playerMatchStats) ||
			JSON.stringify(this.tempSessionPlayers) !== JSON.stringify(this.event._sessionPlayers) ||
			JSON.stringify(this.sidesMatchStats) !== JSON.stringify(this.sidesMatchStatsBackup) ||
			JSON.stringify(this.trainingReports) !== JSON.stringify(this.getTrainingReports()) ||
			JSON.stringify(this.teamReport) !== JSON.stringify(this.event.teamReport) ||
			hasMedicalTreatmentChanged;
		if (eventHasChanged) {
			const ref = this.dialogService.open(ConfirmationDialogComponent, {
				data: {
					description: 'event.notifyDescription',
					actionTrueLabel: 'event.notify',
					actionTrueIcon: 'fa fa-bell',
					actionFalseLabel: 'event.noNotify'
				},
				closable: false
			});
			ref.onClose.pipe(take(1)).subscribe({
				next: (result: { choice: boolean }) => {
					if (result) this.checkSubmission(this.event, result.choice);
				}
			});
		} else {
			this.discard();
		}
	}

	private getGD(date: Date) {
		const matches = sortByDate(
			this.events.filter(({ format }) => format === 'game' || format === 'friendly'),
			'start'
		);
		const prevGame = matches.filter(event => moment(event.start).isSameOrBefore(moment(date)));
		const nextGame = matches.filter(event => moment(event.start).isSameOrAfter(moment(date)));
		return this.calendar.getGameDay([prevGame[prevGame.length - 1], nextGame[0]], date);
	}

	private getServerData({ id, format, medicalType, wyscoutId, instatId, gpsSessionLoaded }: MedicalEvent) {
		if (format === 'training' && gpsSessionLoaded) {
			this.blockDate = true;
		}
		const completeEvent$ = this.requestCompleteEvent(id);
		let event$: Observable<Event>;
		switch (format as EventFormat) {
			case 'medical':
				event$ = this.initMedicalEvent(completeEvent$);
				break;
			case 'assessment':
				event$ = this.initAssessmentEvent(completeEvent$).pipe(
					switchMap(this.initPlayersForNotMedicalEvent.bind(this))
				);
				break;
			case 'game':
				event$ = this.initGameEvent(completeEvent$).pipe(switchMap(this.initPlayersForNotMedicalEvent.bind(this)));
				break;
			case 'training':
				event$ = this.initTrainingEvent(completeEvent$).pipe(switchMap(this.initPlayersForNotMedicalEvent.bind(this)));
				break;
			default:
				event$ = completeEvent$.pipe(switchMap(this.initPlayersForNotMedicalEvent.bind(this)));
				break;
		}

		const drills$ = this.drillApi
			.find({
				where: {
					teamId: { inq: (this.teams || []).map(({ id }) => id) }
				}
			})
			.pipe(
				map((drills: Drill[]) => {
					this.drillsList = drills;
					this.drillsListBackup = drills;
					this.filteredDrillList = this.drillsList;
					this.drillsMapping.themes = this.drillThemesFilterPipe.transform(
						this.drillsMapping.themes,
						this.drillListFilterPipe.transform(this.drillsList, this.currentUserId)
					);
				}),
				untilDestroyed(this)
			);

		const injuries$ = this.injuryApi
			.find({
				where: { eventId: id },
				fields: ['id', 'playerId']
			})
			.pipe(
				map((injuries: Injury[]) => (this.injuryMap = new Map(Object.entries(groupBy(injuries, 'playerId'))))),
				untilDestroyed(this)
			);

		forkJoin([event$, drills$, injuries$])
			.pipe(
				tap(() => {
					this.setTableData();
					if (Number.isInteger(this.event.subformat)) {
						this.competitionIdsForSeeker = [this.event.subformat];
					} else {
						this.competitionIdsForSeeker = [];
					}
					if (this.event.format !== 'medical') {
						if (this.event.format === 'game' || this.event.format === 'friendly' || this.event.format === 'clubGame') {
							this.handleGameFormat();
						} else {
							this.handleNonGameFormat();
						}
						if (this.event.subformat) {
							if (!isNaN(Number(this.event.subformat))) this.event.subformat = Number(this.event.subformat);
							this.onSelectCompetition({ value: this.event.subformat });
						}

						if (this.event.format === 'clubGame') {
							this.loadSecondaryTeamMatchStats(this.event);
						}
					}
					this.saveTemp();
					if (this.newEvent && this.prefilledPlayerIds?.length > 0) {
						this.event.playerIds = this.prefilledPlayerIds;
						this.selectedPlayers = this.players.filter(({ id }) => this.event.playerIds.includes(id));
					}
					this.blockEventDetail.stop();
				}),
				first(),
				untilDestroyed(this)
			)
			.subscribe({
				error: (error: Error) => {
					this.blockEventDetail.stop();
					this.error.handleError(error);
				}
			});
		this.store$.dispatch(
			EventViewerStoreActions.inputEventChanged({
				format: format as EventFormat,
				medicalType: medicalType as MedicalFieldType,
				matchWyscoutId: wyscoutId,
				matchInstatId: instatId
			})
		);
	}

	private requestCompleteEvent(eventId: string) {
		return this.eventApi
			.findById(eventId, {
				include: [
					{
						relation: 'match',
						scope: {
							fields: ['id']
						}
					}
				]
			})
			.pipe(
				map((event: MedicalEvent) => {
					event.start = event.allDay ? this.toClient.convert(event.start) : moment(event.start).toDate();
					event.end = event.allDay ? this.toClient.convert(event.end) : moment(event.end).toDate();
					if (event.format === 'off' || event.format === 'international') this.setEventDuration(event);
					if (!event._drills) event._drills = [];
					if (!event._drillsExecuted) event._drillsExecuted = [];
					// if (this.players?.length > 0 && !!event.playerIds)
					// 	this.selectedPlayers = this.players.filter(({ id }) => event.playerIds.includes(id));
					// if (this.staffs?.length > 0 && !!event.staffIds)
					// 	this.selectedStaff = this.staffs.filter(({ id }) => event.staffIds.includes(id));
					this.opponent = { name: event.opponent, instId: -1, wyId: -1, imageDataURL: '' };
					this.gameDay = this.getGD(event.start);
					if (event?.teamReport) {
						this.teamReport = cloneDeep(event.teamReport);
					}
					this.event = event;
					this.getEventTime(true);
					return this.event;
				}),
				untilDestroyed(this)
			);
	}

	//region Event Videos
	private handleVideos() {
		this.loadVideoLength();
		this.videoService
			.listenReload()
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (result: boolean) => {
					if (result) {
						this.resetVideoFormProps();
						this.loadVideoLength();
					}
				}
			});
	}

	private loadVideoLength() {
		this.videos$ = this.videoMatchesService.load([this.videoCategory]);
		this.videoSubscription = this.videos$.pipe(first(), untilDestroyed(this)).subscribe({
			next: (videos: VideoAsset[]) => {
				if (videos) {
					this.videosLength = this.event.id ? videos.filter(({ linkedId }) => linkedId === this.event.id).length : 0;
				}
			}
		});
	}

	resetVideoFormProps() {
		this.videoGalleryForm = {
			visible: false,
			prefilledTitle: null,
			prefilledPlayerIds: null,
			videoToEdit: null
		};
	}
	//endregion

	private initGameEvent(event$: Observable<MedicalEvent>) {
		let eventResult: MedicalEvent;
		return event$.pipe(
			switchMap(event => {
				eventResult = event;
				return forkJoin([this.loadMatchStats(event), this.loadEventGameReports(event.id)]);
			}),
			map(() => {
				return eventResult;
			})
		);
	}

	private initTrainingEvent(event$: Observable<MedicalEvent>) {
		let eventResult: MedicalEvent;
		return event$.pipe(
			switchMap(event => {
				eventResult = event;
				return forkJoin([this.loadPlayerReportsTemplates(), this.loadEventTrainingReports(event.id)]);
			}),
			map(() => {
				return eventResult;
			})
		);
	}

	private initAssessmentEvent(event$: Observable<MedicalEvent>) {
		return event$.pipe(
			switchMap(event => this.eventApi.getTestInstance(event.id, null)),
			map(details => {
				this.event.testInstance = details;
				return this.event;
			})
		);
	}
	private loadMedicalExams(
		event: MedicalEvent,
		field: '_preventionExams' | '_injuryExams',
		eventField: 'preventionExams' | 'injuryExams'
	) {
		const medicalRequest$ =
			eventField === 'preventionExams'
				? this.playerApi.findById(event.playerIds[0], {
						fields: [field]
					})
				: this.injuryApi.find({
						where: {
							playerId: event.playerIds[0]
						}
					});
		medicalRequest$.pipe(first(), untilDestroyed(this)).subscribe({
			next: result => {
				const isInjury = eventField === 'injuryExams';
				if (isInjury) {
					this.event[eventField] = flatten((result as Injury[]).map(item => item[field])).filter(
						({ eventId }) => eventId === event.id
					);
				} else {
					this.event[eventField] = result[field].filter(({ eventId }) => eventId === event.id);
				}
			},
			error: (error: Error) => this.error.handleError(error)
		});
	}

	private loadMedicalTreatments(event: MedicalEvent) {
		const medicalRequest$ = this.medicalTreatmentApi.find({
			where: {
				playerId: event.playerIds[0],
				eventId: event.id
			},
			order: 'date DESC'
		});
		medicalRequest$.pipe(first(), untilDestroyed(this)).subscribe({
			next: (result: MedicalTreatment[]) => {
				(this.event as MedicalEvent).medicalTreatments = result;
			},
			error: (error: Error) => this.error.handleError(error)
		});
	}

	private initMedicalEvent(event$: Observable<MedicalEvent>) {
		return event$.pipe(
			switchMap(event => {
				this.medicalField = event.medicalType as MedicalFieldType;
				switch (this.medicalField) {
					case 'exam':
						this.loadMedicalExams(this.event, '_preventionExams', 'preventionExams');
						if (event.injuryId) {
							this.loadMedicalExams(this.event, '_injuryExams', 'injuryExams');
						}
						break;
					case 'treatment':
						this.loadMedicalTreatments(this.event);
						break;
					default:
						console.warn('medical field is not supported:', this.medicalField);
				}
				const season = this.currentTeamService.getCurrentSeason();
				return this.teamSeasonApi.getPlayers(season.id, getPlayerConditions(event));
			}),
			map(players => {
				if (players) {
					this.allPlayers = players;
					this.players = this.allPlayers
						.filter(player => isNotArchived(player, { date: this.event.start }))
						.map(player => ({
							...player,
							healthStatus: this.getHealthStatus(player),
							modified: this.getModifyFromSession(this.event._sessionPlayers, player)
						}));
					return this.event;
				}
			})
		);
	}

	private initPlayersForNotMedicalEvent(event: Event) {
		if (!this.blockEventDetail.isActive) {
			this.blockEventDetail.start();
		}
		const id = this.event.teamSeasonId || this.currentEventSeason.id;
		return forkJoin([
			this.teamSeasonApi.getPlayers(id, getPlayerConditions(event)).pipe(
				map((playerList: Array<Player & { injuryOccurred: boolean }>) => {
					playerList.forEach(player => {
						player.injuryOccurred = !!player.injuries.find(({ eventId }) => eventId === event.id);
					});
					this.allPlayers = sortBy(playerList, 'displayName');
					this.players = this.allPlayers
						.filter(player => isNotArchived(player, { date: this.event.start }))
						.map(player => ({
							...player,
							healthStatus: this.getHealthStatus(player),
							modified: this.getModifyFromSession(this.event._sessionPlayers, player)
						}));
					this.selectedPlayers = this.players.filter(player => this.event.playerIds.includes(player.id));
				})
			),
			this.teamSeasonApi.getStaffs(id, getStaffConditions()).pipe(
				map((staffList: Staff[]) => {
					this.allStaffs = sortBy(staffList, 'lastName');
					this.staffs = this.allStaffs.filter(staff => isNotArchived(staff, { date: this.event.start }));
					this.selectedStaff = this.staffs.filter(staff => this.event.staffIds.includes(staff.id));
				})
			)
		]).pipe(
			tap(() => {
				const activePlayers: SelectItem[] = this.getActivePlayersOptions(this.allPlayers);
				const activeStaffs: SelectItem[] = this.getActiveStaffsOptions(this.staffs);
				this.allSharedWithOptions = [
					{
						label: this.translate.instant('admin.squads.element.players'),
						value: 'players',
						items: activePlayers
					},
					{
						label: this.translate.instant('admin.squads.element.staff'),
						value: 'staffs',
						items: activeStaffs
					}
				];

				return event;
			})
		);
	}

	getDrillSharedWithOptions(drill: Drill): SelectItemGroup[] {
		return this.allSharedWithOptions.map((personGroup: SelectItemGroup) => {
			if (personGroup.value === 'staffs') {
				return {
					...personGroup,
					// @ts-ignore
					items: (personGroup?.items || []).filter(({ customerId }) =>
						(drill?.sharedWithIds || []).includes(customerId)
					)
				};
			}
			return personGroup;
		});
	}

	private getModifyFromSession(sessions: SessionPlayerData[], player: Player): boolean {
		return sessions.find(({ playerId }) => playerId === player.id)?.dirty;
	}

	private getDropdownList() {
		this.individualOptions = [
			{
				label: this.translate.instant('workloadAnalysis.options.individual.no'),
				value: false
			},
			{
				label: this.translate.instant('workloadAnalysis.options.individual.yes'),
				value: true
			}
		];

		this.subformatList = this.constants.getEventSubformat().map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));

		this.effortList = this.constants.getEventEffort().map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.themeList = EVENT_THEME_LIST.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.fieldThemeList = this.constants.getFieldThemeList().map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.medicalThemeList = this.constants.getEventMedicalTheme().map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.nutritional = this.constants.getNutritional().map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.recovery = this.constants.getRecovery().map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.loadDrillsMapping();
		this.results = [
			{ label: this.translate.instant('win'), value: true },
			{ label: this.translate.instant('lose'), value: false },
			{ label: this.translate.instant('draw'), value: null }
		];
	}

	private setTableData(resetPlanned = true) {
		if (resetPlanned) {
			this.setPlannedDrillList();
			this.setActualDrillList();
		}

		// if (!this.event.gpsSessionLoaded && !this.event.sessionImport) {
		// 	this.selectedExtractedThemes = this.event._drillsExecuted.map(({ theme }) => {
		// 		const themeEx = this.dThemeList.find(({ value }) => value === theme);
		// 		return { label: themeEx ? themeEx.label : '', value: theme };
		// 	});
		// }
		// this.selectedExtractedDrills = this.event._drillsExecuted.map(({ name, drillId }) => ({
		// 	name,
		// 	drillName: this.drillsList.find(({ id }) => id === drillId)?.name,
		// 	drillId
		// }));
	}

	private handleNonGameFormat() {
		(this.selectablePlayers || []).forEach(p => (p.players = []));
		(this.players || [])
			.filter(({ id }) => this.currentTeamService.getCurrentSeason().playerIds.includes(id))
			.forEach(player => {
				if (!player.position) {
					this.selectablePlayers.find(({ position }) => position === 'noPosition').players.push(player);
				} else {
					const positionGroup = getFieldPosition(player.position, this.sportType) || 'noPosition';
					if (this.event.format === 'training') {
						const trainingReport = (this.trainingReports || []).find(({ playerId }) => playerId === player.id);
						const report = trainingReport ? trainingReport : this.createPlayerReport(player);
						this.selectablePlayers
							.find(({ position }) => position === positionGroup)
							.players.push({
								...player,
								trainingReport: report
							});
					} else {
						this.selectablePlayers.find(({ position }) => position === positionGroup).players.push(player);
					}
				}
			});
		this.checkAllSelected();
		this.scaffoldStaff();
	}

	private handleGameFormat() {
		this.loadPlayerReportsTemplates()
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.players = this.players && this.players.length > 0 ? this.players : [];
					if (isEmpty(this.event._playerMatchStats)) {
						this.event._playerMatchStats = this.players.map(x => this.createPlayerMatchStat(x));
						this.saveTemp();
					} else if (moment(this.event.start).isSameOrAfter(moment())) {
						const newPlayers = this.players.filter(
							player =>
								!this.event._playerMatchStats.map(({ playerId }) => String(playerId)).includes(String(player.id))
						);
						newPlayers.forEach(player => {
							this.event._playerMatchStats = [...this.event._playerMatchStats, this.createPlayerMatchStat(player)];
						});
						const newArchived = this.event._playerMatchStats.filter(
							(stat, index) => !this.players.map(({ id }) => String(id)).includes(String(stat.playerId))
						);
						newArchived.forEach(player => {
							const i = this.event._playerMatchStats.findIndex(
								({ playerId }) => String(playerId) === String(player.playerId)
							);
							this.event._playerMatchStats.splice(i, 1);
						});
					}
					this.event._playerMatchStats = sortBy(this.event._playerMatchStats, 'playerName');
					this.scaffoldGamePlayers();
					// this.checkAllSelectedGame();
					this.scaffoldStaff();
					this.loadSidesMatchStats();
				}
			});
	}

	private scaffoldStaff() {
		this.selectableStaff.forEach(s => (s.staff = []));
		this.staffs
			.filter(({ id }) => (this.currentTeamService.getCurrentSeason().staffIds || []).includes(id))
			.forEach(staff => this.selectableStaff.find(({ position }) => position === 'staff').staff.push(staff));
		this.checkAllStaffSelected();
	}

	private scaffoldGamePlayers() {
		const playerMatchStats = sortBy(this.event._playerMatchStats, 'playerName');
		playerMatchStats
			.filter(({ position, order }) => !(position && order))
			.forEach(playerMatch => {
				const player = this.allPlayers.find(({ id }) => String(id) === playerMatch.playerId);
				if (player) {
					const category = getFieldPosition(player.position, this.sportType);
					const index = getPositionCategoryIndex(player.position, this.sportType);
					playerMatch.position = category;
					playerMatch.order = String(index);
				}
			});
		this.event._playerMatchStats = sortBy(playerMatchStats, 'order');
	}

	private createPlayerMatchStat(player: PlayerWithHealthStatus): PlayerMatchStat {
		return new PlayerMatchStat({
			enabled: false,
			playerId: player.id,
			playerName: player.displayName,
			position: player.position,
			minutesPlayed: null,
			substituteInMinute: null,
			substituteOutMinute: null,
			yellowCard: false,
			doubleYellowCard: false,
			redCard: false,
			score: null
		});
	}

	private createMainSessionPlayer(player: PlayerWithHealthStatus, alreadyPresentSession?: SessionPlayerData) {
		return new SessionPlayerData({
			...alreadyPresentSession,
			date: moment(this.event.start).startOf('day').toDate(),
			dirty: player.modified,
			complete: false,
			playerName: player.displayName,
			playerId: player.id,
			splitName: this.currentTeamService.getCurrentTeam().mainSplitName,
			mainSession: true,
			teamId: this.currentTeamService.getCurrentTeam().id,
			duration: alreadyPresentSession?.duration || this.event.duration,
			splitStartTime: alreadyPresentSession?.splitStartTime || this.event.start,
			splitEndTime: alreadyPresentSession?.splitEndTime || this.event.end,
			rpe: alreadyPresentSession?.rpe || null,
			rpeTl: alreadyPresentSession?.rpeTl || null
		});
	}

	private setAllFlag() {
		this.selectablePlayers = this.selectablePlayers.map(p => ({
			...p,
			allSelected: true
		}));
	}

	private setAllStaffFlag() {
		this.selectableStaff = this.selectableStaff.map(p => ({
			...p,
			allSelected: true
		}));
	}

	private checkAllSelected() {
		this.setAllFlag();
		this.selectablePlayers = this.selectablePlayers.map(p => ({
			...p,
			allSelected: p.allSelected && p.players.every(a => this.selectedPlayers.includes(a as PlayerWithHealthStatus))
		}));
	}

	private checkAllStaffSelected() {
		this.setAllStaffFlag();
		this.selectableStaff = this.selectableStaff.map(p => ({
			...p,
			allSelected: p.allSelected && p.staff.every(a => this.selectedStaff.includes(a as Staff))
		}));
	}

	getSelectablePlayers(): SelectablePlayer[] {
		return (
			this.selectablePlayers
				.filter(({ hideInTemplate }) => !hideInTemplate)
				.filter(a => a?.position !== 'noPosition' || a.players?.length > 0) || []
		);
	}

	getSelectableStaff(): SelectableStaff[] {
		return this.selectableStaff.filter(({ hideInTemplate }) => !hideInTemplate);
	}

	getSelectedStaffCount(): number {
		return (this.selectedStaff || []).map(item => this.isSelectedStaffForEvent(item)).length;
	}

	private selectAllGameForPosition(playerPosition: PlayerPosition, checked: boolean) {
		this.allFlagsGame.find(({ position }) => position === playerPosition).checked = checked;
		this.event._playerMatchStats.forEach(stat => {
			if (stat.position === playerPosition) {
				if (this.selectedCompetition)
					stat.enabled = checked === true ? this.selectedLineup.includes(stat.playerId) : checked;
				else
					stat.enabled =
						checked === true ? this.currentTeamService.getCurrentSeason().playerIds.includes(stat.playerId) : checked;
				this.setEnabledPlayers(checked, stat);
			}
		});
	}

	// private move(arr, from, to) {
	// 	const element = arr[from];
	// 	arr.splice(from, 1);
	// 	arr.splice(to, 0, element);

	// 	return arr;
	// }

	private getEventTime(fromServer: boolean = false) {
		// const { start, end } = fromServer ? this.planningService.fixEventDate(this.event) : this.event;
		this.startDate = moment(this.event.start, 'MM/DD/YYYY HH:mm').toDate();
		this.endDate = moment(this.event.end, 'MM/DD/YYYY HH:mm').toDate();
		this.start_hour = moment(this.event.start, 'MM/DD/YYYY HH:mm').format('HH:mm');
		this.end_hour = moment(this.event.end, 'MM/DD/YYYY HH:mm').format('HH:mm');
		// TODO FEATURE PAUSED this.setRepeatList(this.startDate);

		this.store$.dispatch(
			EventViewerStoreActions.eventDateUpdated({
				date: moment(this.startDate)
					// .utc(true)
					.toDate()
			})
		);
	}

	private getDates() {
		const momentStart = moment(this.start_hour, 'HH:mm a');
		this.event.start = moment(this.startDate)
			.set({
				hour: momentStart.get('hour'),
				minute: momentStart.get('minute')
			})
			.toDate();
		const momentEnd = moment(this.end_hour, 'HH:mm a');
		this.event.end = moment(this.endDate)
			.set({
				hour: momentEnd.get('hour'),
				minute: momentEnd.get('minute')
			})
			.toDate();
	}

	private getEndDateAuto() {
		this.endDate = moment(this.event.start).add(this.event.duration, 'minutes').toDate();
		this.event.end = moment(this.event.start).add(this.event.duration, 'minutes').toDate();
		this.getEventTime();
	}

	private setEventDuration(event: MedicalEvent) {
		const endDate = event.allDay
			? moment(event.end).add(1, 'days').set({ hour: 0, minute: 0, second: 0 })
			: moment(event.end);
		event.duration = moment.duration(endDate.diff(event.start)).asMinutes();
	}

	getDuration(num): string {
		return (moment.duration(Math.round(num), 'minutes') as any).format('h:mm', null, {
			forceLength: true,
			trim: false
		});
	}

	private checkSubmission(event: Event, notify: boolean) {
		let errorCode = '';
		if (event.format === 'travel') {
			if (!event.destination) {
				errorCode = 'alert.destinationRequired';
			}
		} else if (event.format === 'game') {
			if (!event.opponent) {
				errorCode = 'alert.opponentRequired';
			} else if (!event.result && moment(event.start).isBefore(moment())) {
				errorCode = 'event.missingResult';
			}
		} else if (event.format === 'clubGame') {
			if (!event.subformat || !event.clubGameHomeTeam || !event.clubGameAwayTeam) {
				errorCode = 'alert.competitionHomeAwayTeamRequired';
			}
		}

		const saveEvent = errorCode.length <= 0;
		if (saveEvent) {
			this.saveEvent(notify);
		} else {
			this.notifyError(errorCode);
		}
	}

	private notifyError(errorCode: string) {
		this.notificationService.notify('error', 'navigator.planning', errorCode, false);
	}

	private checkFormat(value: EventFormat) {
		this.event.format = value;
		this.updateBlockDate = false;
		switch (value) {
			case 'clubGame': {
				this.gameDay = this.getGD(this.event.start);
				this.event.workload = 5;
				this.event.home = true;
				this.event.allDay = false;
				this.handleGameFormat();
				break;
			}
			case 'game':
			case 'friendly': {
				this.gameDay = 'GD';
				this.event.workload = 5;
				this.event.home = true;
				this.event.allDay = false;
				this.handleGameFormat();
				break;
			}
			case 'training': {
				this.updateBlockDate = true;
				this.gameDay = this.getGD(this.event.start);
				this.event.allDay = false;
				if (this.event._drills.length === 0) this.event._drills = [];
				// this.addSessionPlayers();
				this.loadPlayerReportsTemplates()
					.pipe(first(), untilDestroyed(this))
					.subscribe({
						next: () => {
							this.handleNonGameFormat();
						}
					});
				break;
			}
			case 'travel': {
				this.gameDay = this.getGD(this.event.start);
				this.event.allDay = false;
				break;
			}
			case 'off': {
				this.gameDay = this.getGD(this.event.start);
				this.event.allDay = true;
				this.event.start = moment(this.event.start).startOf('day').toDate();
				if (this.event.end && moment(this.event.end).isSameOrBefore(moment(this.event.start).endOf('day')))
					this.event.end = moment(this.event.start).endOf('day').toDate();
				this.event.duration = moment.duration(moment(this.event.end).diff(this.event.start)).asMinutes();
				break;
			}
			case 'international': {
				this.gameDay = this.getGD(this.event.start);
				this.event.allDay = true;
				this.event.start = moment(this.event.start).startOf('day').toDate();
				if (this.event.end && moment(this.event.end).isSameOrBefore(moment(this.event.start).endOf('day')))
					this.event.end = moment(this.event.start).add(1, 'day').startOf('day').toDate();
				this.event.duration = moment.duration(moment(this.event.end).diff(this.event.start)).asMinutes();
				break;
			}
			case 'medical': {
				this.gameDay = this.getGD(this.event.start);
				this.event.allDay = false;
				const firstAvailablePlayer = this.players[0].id;
				this.event.playerIds =
					this.isFromResourceTimelineDay && this.event?.playerIds?.length
						? [this.event.playerIds[0]]
						: [firstAvailablePlayer];
				this.event.format = 'medical';
				this.event.medicalType = 'treatment';
				(this.event as MedicalEvent).medicalTreatments = [];
				const title = this.injuryService.getMedicalEventTitle(false, undefined, 'treatment');
				this.onTitleChange(title);
				break;
			}
			default: {
				this.event.allDay = false;
				this.gameDay = this.getGD(this.event.start);
				if (this.event.end === null) {
					this.event.end = moment(this.event.start).add(1, 'hour').toDate();
				}
				break;
			}
		}
		this.store$.dispatch(
			EventViewerStoreActions.eventFormatChanged({
				format: value,
				medicalType: this.event.medicalType as MedicalFieldType
			})
		);
	}

	private closePanel(event?) {
		this.closeClicked.emit(event);
	}

	private deleteEvent() {
		this.deleteClicked.emit(this.event);
	}

	private isMedicalTreatmentEvent(): boolean {
		return this.event.format === 'medical' && (this.event.medicalType as MedicalFieldType) === 'treatment';
	}

	private async getMedicalTreatmentFromTableComponent() {
		const medicalTreatments: MedicalTreatment[] = await this.medicalTreatmentsComponent?.getMultiplePreparedData(true);
		if (!medicalTreatments) {
			console.warn('cannot get medical treatments from table component');
			return undefined;
		}
		return medicalTreatments;
	}

	private async saveEvent(notify: boolean, isDuplicate?: boolean, playerIdsApplyTo?: string[]) {
		let playerReportsToUpsert: PlayerGameReport[] | PlayerTrainingReport[];
		let playerReportsIdsToDelete: string[];
		this.blockDate = this.updateBlockDate;
		if (this.isMedicalTreatmentEvent()) {
			(this.event as MedicalEvent).medicalTreatments = await this.getMedicalTreatmentFromTableComponent();
		}
		this.editService.editMode = false;
		this.event.playerIds = this.getPlayerIds();
		this.event.type = this.getGD(this.event.start);
		if (this.event.format === 'training') {
			this.event._drills = this.getDrillsPayload();
			if (!isDuplicate) {
				this.event._drillsExecuted = this.getActualDrillsPayload();
				this.event._sessionPlayers = flatten(
					this.selectedPlayers.map(player => {
						const alreadySessions = this.tempSessionPlayers.filter(({ playerId }) => playerId === player.id);
						const alreadyMainSession = alreadySessions.find(({ mainSession }) => mainSession);
						const alreadyNotMainSessions = alreadySessions.filter(({ mainSession }) => !mainSession);
						return [this.createMainSessionPlayer(player, alreadyMainSession), ...alreadyNotMainSessions];
					})
				);
				//region Team Game Report
				this.event.teamReport = this.teamReport;
				//endregion
			}
			//region Player Training Reports
			playerReportsToUpsert = this.getTrainingReports();
			playerReportsIdsToDelete = (this.trainingReports || [])
				.map(({ id }) => id)
				.filter(id => !playerReportsToUpsert.map(({ id }) => id).includes(id));
			//endregion
		} else if (this.event.format === 'game' || (this.event.format === 'clubGame' && !isDuplicate)) {
			//region Player Game Reports
			const isCurrentTeamHomeSide = this.event.home;
			this.event._playerMatchStats = this.getCurrentTeamMatchStats();
			this.event._opponentPlayerMatchStats = isCurrentTeamHomeSide
				? this.getMatchStatsForServer('away', false)
				: this.getMatchStatsForServer('home', false);
			playerReportsToUpsert = this.getCurrentTeamGameReports();
			playerReportsIdsToDelete = (this.gameReports || [])
				.map(({ id }) => id)
				.filter(id => !playerReportsToUpsert.map(({ id }) => id).includes(id));
			//endregion
			//region Team Game Report
			this.event.teamReport = this.teamReport;
			//endregion
		}
		this.saveTemp();
		this.saveClicked.emit({
			event: this.event,
			isNewAndDuplicate: isDuplicate,
			notify,
			playerIdsApplyTo,
			treatmentsIdsToDelete: this.isMedicalTreatmentEvent()
				? this.medicalTreatmentsComponent?.getTreatmentIdsToDelete()
				: [],
			playerReports: {
				toUpsert: playerReportsToUpsert,
				toDeleteIds: playerReportsIdsToDelete
			}
		});
	}

	private getDrillsPayload(): DrillInstance[] {
		const playerOptionsIds = this.getOptionsIdsByGroup('players', this.allSharedWithOptions);
		const staffOptionsIds = this.getOptionsIdsByGroup('staffs', this.allSharedWithOptions);
		const drillResults: DrillInstance[] = (this.plannedDrillList || [])
			.map(({ drill }) => drill)
			.map((item: DrillInstance & { tempSharedWithIds: string[] }) => {
				const drill: DrillInstance = {
					...item,
					sharedPlayerIds: (item?.tempSharedWithIds || []).filter((id: string) => playerOptionsIds.includes(id)),
					sharedStaffIds: (item?.tempSharedWithIds || []).filter((id: string) => staffOptionsIds.includes(id))
				};
				// @ts-ignore
				delete drill?.tempSharedWithIds;
				// @ts-ignore
				delete drill?.tempSharedWithOptions;
				return drill;
			});
		return sortBy(drillResults, ['index', 'letter']);
	}

	private getActualDrillsPayload(): DrillInstance[] {
		const drillResults: DrillInstance[] = (this.actualDrillList || [])
			.map(({ drill }) => drill)
			.map((item: DrillInstance) => {
				const drill: DrillInstance = {
					...item
				};
				// @ts-ignore
				delete drill?.tempSharedWithIds;
				// @ts-ignore
				delete drill?.tempSharedWithOptions;
				return drill;
			});
		return drillResults;
	}

	private getPlayerIds(): string[] {
		if (this.event.format === 'medical') {
			return this.event.playerIds;
		}
		return this.event.format === 'game' || this.event.format === 'clubGame'
			? this.event._playerMatchStats && this.event._playerMatchStats.length > 0
				? this.event._playerMatchStats.filter(({ enabled }) => !!enabled).map(({ playerId }) => playerId)
				: []
			: this.selectedPlayers && this.selectedPlayers.length > 0
				? this.selectedPlayers.map(({ id }) => id)
				: [];
	}

	private getStaffIds() {
		return this.selectedStaff && this.selectedStaff.length > 0 ? this.selectedStaff.map(({ id }) => id) : [];
	}

	// This method is called when we load event._drill from server and we assign to a local variable (plannedDrillList)
	private setPlannedDrillList() {
		this.plannedDrillList = this.event._drills.map(drill => {
			const drillDetail: Drill = (this.drillsListBackup || []).find(({ id }) => id === drill.drillsId);
			const currentTheme = drillDetail?.theme
				? this.allDrillThemeListBackup.find(({ value }) => value === drillDetail.theme)
				: undefined;
			this.fixMinDuration(drill);
			return {
				id: uuid(),
				drill: {
					...drill,
					tempSharedWithOptions: this.getDrillSharedWithOptions(drillDetail),
					tempSharedWithIds: [...(drill?.sharedPlayerIds || []), ...(drill?.sharedStaffIds || [])]
				},
				drillDetail,
				themeModel: this.getThemeModel(currentTheme, drillDetail)
			};
		});
	}

	private setActualDrillList() {
		this.actualDrillList = this.event._drillsExecuted.map(drill => {
			const drillDetail: Drill = (this.drillsListBackup || []).find(
				({ id }) => id === (drill.drillsId || drill.drillId)
			);
			const currentTheme = drillDetail?.theme
				? this.allDrillThemeListBackup.find(({ value }) => value === drillDetail.theme)
				: undefined;
			this.fixMinDuration(drill);
			return {
				id: uuid(),
				drill,
				drillDetail,
				themeModel: this.getThemeModel(currentTheme, drillDetail),
				duration: Number(Number(drill.duration).toFixed(2))
			};
		});
	}

	private loadDrillsMapping() {
		this.drillsMapping = this.drillsMappingService.getDrillsMapping(this.currentTeamService.getCurrentTeam());
		const drillThemes = flatten(this.teams.filter(team => team?.drillThemes).map(({ drillThemes }) => drillThemes));
		let activeDrillThemes = (drillThemes || [])?.filter(({ active }) => active);
		this.allDrillThemeList = uniqBy(
			activeDrillThemes.map(({ custom, label, value }) => ({
				label: custom ? label : this.translate.instant(label),
				value
			})),
			'value'
		);
		this.allDrillThemeListBackup = cloneDeep(this.allDrillThemeList);
	}

	isSelectedForEvent(playerId: string): boolean {
		return this.event.playerIds.includes(playerId);
	}

	isSelectedStaffForEvent(staff: Staff): boolean {
		return (this.event.staffIds || []).includes(staff.id);
	}

	getBackgroundColor(value: number): { 'background-color': string } {
		let color: string;
		switch (value) {
			case 1: {
				color = 'green';
				break;
			}
			case 2: {
				color = '#50D050';
				break;
			}
			case 3: {
				color = 'yellow';
				break;
			}
			case 4: {
				color = 'var(--color-primary-500)';
				break;
			}
			case 5: {
				color = 'red';
				break;
			}
		}
		return { 'background-color': color };
	}

	private saveTemp() {
		this.tempEvent = copyValue(this.event);
		this.tempDrills = JSON.parse(JSON.stringify(this.plannedDrillList));
		this.tempExecuted = JSON.parse(JSON.stringify(this.actualDrillList));
		if (isNotEmpty((this.event as MedicalEvent)?.medicalTreatments))
			this.tempMedicalTreatments = JSON.parse(JSON.stringify((this.event as MedicalEvent)?.medicalTreatments));
		if (isNotEmpty(this.event._playerMatchStats))
			this.tempPlayersMatchStat = JSON.parse(JSON.stringify(this.event._playerMatchStats || []));
		if (isNotEmpty(this.event._sessionPlayers))
			this.tempSessionPlayers = JSON.parse(JSON.stringify(this.event._sessionPlayers || []));
	}

	private loadTemp() {
		this.event = copyValue(this.tempEvent);
		// some event doesn't have an opponent (eg: training)
		if (this.event.opponent) {
			this.checkDropdownOpponent();
		}
		this.plannedDrillList = JSON.parse(JSON.stringify(this.tempDrills));
		this.actualDrillList = JSON.parse(JSON.stringify(this.tempExecuted));
		const isNotempty = isNotEmpty(this.tempPlayersMatchStat);
		if (isNotempty) this.event._playerMatchStats = JSON.parse(JSON.stringify(this.tempPlayersMatchStat));
		if (isNotEmpty(this.tempSessionPlayers))
			this.event._sessionPlayers = JSON.parse(JSON.stringify(this.tempSessionPlayers));
		if (isNotEmpty((this.event as MedicalEvent)?.medicalTreatments))
			(this.event as MedicalEvent).medicalTreatments = JSON.parse(JSON.stringify(this.tempMedicalTreatments));
		if (this.sidesMatchStatsBackup) {
			this.sidesMatchStats = JSON.parse(JSON.stringify(this.sidesMatchStatsBackup));
		}
	}

	private toPlayers(playerPosition: PlayerPosition) {
		const list = this.selectablePlayers.find(({ position }) => position === playerPosition).players;
		return list.map((player: PlayerWithHealthStatus) => ({
			name: player.name,
			displayName: player.displayName,
			selected: this.selectedPlayers.includes(player)
		}));
	}

	private toStaff(staffPosition: StaffPosition) {
		const list = this.selectableStaff.find(({ position }) => position === staffPosition).staff;
		return list.map((staff: Staff) => ({
			name: staff.firstName,
			displayName: staff.lastName,
			selected: this.selectedStaff.includes(staff)
		}));
	}

	private getLabels(list, items) {
		if (!items) return '';
		return items.map(item => this.getLabel(list, item)).join(', ');
	}

	private getLabel(list, item) {
		const opt = list.find(({ value }) => value === item);
		return opt ? opt.label : item;
	}

	private getHealthStatus(player: Player) {
		let healthStatus = null;
		let available = InjuryAvailability.Ok;
		let expected = null;
		let inj = null;
		for (const injury of player.injuries) {
			if (
				moment(injury.date).isSameOrBefore(moment()) &&
				injury.currentStatus !== 'medical.infirmary.details.statusList.healed'
			) {
				if (injury.issue === 'medical.infirmary.details.issue.injury') {
					healthStatus = 'injury';
					inj = injury;
				} else if (!healthStatus || healthStatus !== 'injury') {
					if (injury.issue === 'medical.infirmary.details.issue.complaint') {
						healthStatus = 'complaint';
						inj = injury;
					} else if (
						!healthStatus ||
						(healthStatus !== 'complaint' && injury.issue === 'medical.infirmary.details.issue.illness')
					) {
						healthStatus = 'illness';
						inj = injury;
					}
				}
				if (isNotEmpty(injury._injuryAssessments)) {
					injury._injuryAssessments = sortByDate(injury._injuryAssessments, 'date').reverse();
					const assessment = injury._injuryAssessments[0];
					if (moment(assessment.date).isSameOrBefore(moment(this.startDate))) {
						if (assessment.available !== 'yes') {
							if (assessment.available === 'careful' && available !== InjuryAvailability.NotAvailable) {
								available = InjuryAvailability.BeCareful;
							} else if (assessment.available === 'no') {
								available = InjuryAvailability.NotAvailable;
								expected = assessment.further === true ? true : assessment.expectation;
							}
						}
					}
				}
			}
		}
		return {
			healthStatus,
			available,
			expected,
			injury: inj
		};
	}

	private canBeSelected(player: PlayerWithHealthStatus): boolean {
		const { selectable } = this.canBeSelectedObj(player);
		return selectable;
	}

	private loadOpponents(selectedCompetition?: CompetitionInfo) {
		this.opponents = [];
		if (selectedCompetition && !selectedCompetition.manual) {
			const team = this.currentTeamService.getCurrentTeam();
			this.crestLoading = true;
			this.blockUiInterceptorService
				.disableOnce(this.providerIntegrationService.getTeamsFromCompetition(selectedCompetition, team))
				.pipe(first(), untilDestroyed(this))
				.subscribe({
					next: (data: { teams: WyscoutTeamSearchResult[] }) => {
						this.setOpponents(data.teams);
						this.crestLoading = false;
					},
					error: (error: Error) => this.error.handleError(error),
					complete() {
						this.crestLoading = false;
					}
				});
		} else if (!!this.opponent && this.opponent.name) {
			this.changeOpponent(this.opponent);
		}
	}

	private setOpponents(teams: WyscoutTeamSearchResult[]): void {
		this.opponents = teams.map(opponent => this.getSelectableOpponent(opponent));
		if (this.event.opponent && this.event.opponent.length > 0) {
			this.checkDropdownOpponent();
		}
	}

	private checkDropdownOpponent() {
		const found = this.opponents.find(({ value }) => {
			return (
				(value?.wyId && value.wyId === this.event?.opponentWyscoutId) ||
				(value?.instId && value.instId === this.event?.opponentInstatId) ||
				value.name.toLowerCase() === this.event?.opponent.toLowerCase()
			);
		});
		this.opponent = found ? found.value : undefined;
	}

	private getSelectableOpponent(competitionTeam: WyscoutTeamSearchResult): SelectItem<DropDownOpponent> {
		// @ts-ignore
		const { name, imageDataURL, instId, wyId } = competitionTeam;
		return {
			label: name,
			value: { name, imageDataURL, instId, wyId }
		};
	}

	private changeOpponent(opponent: DropDownOpponent) {
		this.event.opponent = opponent.name;
		if (opponent.instId) {
			this.event.opponentInstatId = opponent.instId || -1;
		}
		if (opponent.wyId) {
			this.event.opponentWyscoutId = opponent.wyId || -1;
		}
		this.event.opponentImageUrl = opponent.imageDataURL || '';
	}

	private loadMatchStats(event: Event) {
		const thirdPartyId = event.instatId || event.wyscoutId;
		if (thirdPartyId) {
			return this.blockUiInterceptorService
				.disableOnce(this.providerIntegrationService.getStandingsMatchStats(event, true))
				.pipe(
					map((matchDetails: MatchProviderStats) => {
						this.thirdPartySelected = matchDetails;
					})
				);
		}
		return of(null);
	}

	private loadPlayerReportsTemplates() {
		const teamId = this.currentTeamService.getCurrentTeam().id;
		const type = this.event.format === 'training' ? 'training' : 'game';
		const settingsField = type === 'training' ? 'trainingReportSettings' : 'gameReportSettings';
		const settingsIdField = type === 'training' ? 'activeTrainingReportTemplateId' : 'activeGameReportTemplateId';
		const settingsVersionField =
			type === 'training' ? 'activeTrainingReportTemplateVersion' : 'activeGameReportTemplateVersion';
		const templateId = this.currentTeamService.getCurrentTeam()[settingsField][settingsIdField];
		const templateVersion = this.currentTeamService.getCurrentTeam()[settingsField][settingsVersionField];
		return this.blockUiInterceptorService
			.disableOnce(this.playerReportTemplateApiService.getAllTeamTemplates(type, teamId))
			.pipe(
				first(),
				untilDestroyed(this),
				map((templateResult: JsonSchema[]) => {
					const allTemplates = (templateResult || []).map(template => this.mapJsonSchemaToSchema(template));
					const activeTemplate = allTemplates.find(
						({ id, version }) => id === templateId && version === templateVersion
					);
					this.allPlayerReportTemplates = allTemplates;
					this.activePlayerReportTemplate = activeTemplate;
				})
			);
	}

	private loadEventGameReports(eventId: string) {
		return this.blockUiInterceptorService
			.disableOnce(this.eventApi.getGameReports(eventId))
			.pipe(map(gameReports => (this.gameReports = gameReports)));
	}

	private loadEventTrainingReports(eventId: string) {
		return this.blockUiInterceptorService
			.disableOnce(this.eventApi.getTrainingReports(eventId))
			.pipe(map(gameReports => (this.trainingReports = gameReports)));
	}

	// TODO: port this function in ngrx (that means we should move all the event-viewer to ngrx ;) )
	private loadSecondaryTeamMatchStats(event: Event) {
		const id = this.providerIntegrationService.getThirdPartyEventId(event);
		if (id) {
			this.blockUiInterceptorService
				.disableOnce(this.matchDetailService.singleTeamStat(id))
				.pipe(untilDestroyed(this), first())
				.subscribe({
					next: thirdpartyClubGameDetails => {
						let thirdPartyPlayer: Player;
						const thirdpartyClubGameLinkedPlayerStats: ThirdPartyLinkedPlayer[] = this.event._playerMatchStats
							.map((playerStats: PlayerMatchStat) => {
								thirdPartyPlayer = this.players.find(({ id }) => playerStats.playerId === id);
								thirdPartyPlayer = this.players.find(({ id }) => playerStats.playerId === id);
								if (thirdPartyPlayer) {
									const { wyscoutId, instatId, downloadUrl } = thirdPartyPlayer;
									return { playerStats, wyscoutId, instatId, downloadUrl };
								}
							})
							.filter(Boolean);

						this.store$.dispatch(
							EventViewerStoreActions.secondaryTeamEventSelected({
								thirdpartyClubGameDetails,
								thirdpartyClubGameLinkedPlayerStats
							})
						);
					},
					error: (error: Error) => this.thirdPartyError(error)
				});
		}
	}

	private thirdPartyError(error: Error) {
		// eslint-disable-next-line no-console
		!!error && error.name !== 'EmptyError' ? this.error.handleError(error) : console.error(error);
	}

	hasImportData(event: Event): boolean {
		return event.gpsSessionLoaded;
	}

	duplicateEventConfirmation() {
		if (!this.event.gpsSessionLoaded) {
			this.duplicateEvent();
			return;
		}
		this.confirmationService.confirm({
			message: this.translate.instant('alert.duplicateEvent'),
			header: 'Confirm',
			icon: 'fas fa-triangle-exclamation',
			accept: () => {
				this.duplicateEvent();
			}
		});
	}

	async duplicateEvent() {
		this.event = this.getDataForDuplicatedEvent();
		await this.saveEvent(false, true);
		this.editService.editMode = true;
	}

	private getDataForDuplicatedEvent(): Event {
		return new Event({
			...this.event,
			id: null,
			author: this.authService.getCurrentUserData().firstName + ' ' + this.authService.getCurrentUserData().lastName,
			gpsSessionLoaded: false,
			_sessionPlayers: [],
			_playerMatchStats: [],
			_sessionImport: null,
			_drillsExecuted: []
		});
	}
	getScoreIconTooltip(): string {
		return getScoreIconTooltip(this.sportType);
	}

	openDialogNote(drill) {
		const ref = this.createEditorDialog(drill.notes);
		ref.onClose.subscribe((notes: string) => {
			if (notes) {
				drill.notes = notes;
			}
		});
	}

	private createEditorDialog(content: string): DynamicDialogRef {
		return this.dialogService.open(EditorDialogComponent, {
			data: { editable: this.editService.editMode, content: content },
			width: '50%',
			header: this.translate.instant('prevention.treatments.note'),
			closable: true
		});
	}

	/*  onRepeatOnChange(event: any) { // TODO FEATURE PAUSED
    if (event === 'custom') {
      this.openCustomRecurrenceDialog(); // TODO OPEN WITH SAVED CUSTOM RECURRENCE
    }
  }

  openCustomRecurrenceDialog() {
    const ref = this.createCustomRecurrenceDialog();
    ref.onClose.subscribe((recurrenceItem: RecurrenceItem) => {
      if (recurrenceItem) {
        // TODO HANDLE TO SERVER
      } else {
        this.repeatOn = 'none';
      }
    });
  }

  private createCustomRecurrenceDialog(): DynamicDialogRef {
    return this.dialogService.open(CustomRecurrenceComponent,
      {
        data: {selectedDate: this.event.start},
        width: '30%',
        header: this.translate.instant('Custom Recurrence'),
        closable: !this.editService.editMode
      });
  }

  private setRepeatList(selectedDate: Date) {
    const dayNumber = selectedDate.getDate();
    const monthWord = moment(selectedDate).format('MMMM');
    const weekNumber = getWeekOfMonth(moment(selectedDate));
    const wordFromNumber = getWordFromNumberUtil(weekNumber);
    const dayLabel = getDayLabelFromDate(selectedDate);
    this.repeatList = [
      {
        label: 'Doesn\'t repeat',
        value: 'none'
      },
      {
        label: 'Daily',
        value: 'daily'
      },
      {
        label: 'Weekly ' + dayLabel,
        value: 'weekly'
      },
      {
        label: 'Monthly on ' + wordFromNumber + ' ' + dayLabel,
        value: 'monthly'
      },
      {
        label: 'Annualy on ' + monthWord + ' ' + dayNumber,
        value: 'yearly'
      },
      {
        label: 'Every Weekday',
        value: 'weekday'
      },
      {
        label: 'Custom...',
        value: 'custom'
      }
    ]
  }*/

	getTemplateRef(type: string): TemplateRef<any> {
		return this[type.includes('football') || type.includes('rugby') ? 'footballRugby' : type];
	}

	getRowTemplateRef(type: string): TemplateRef<any> {
		return this[type.includes('football') || type.includes('rugby') ? 'footballRugbyRow' : `${type}Row`];
	}

	//#region Drill Search/Filter

	showSelectDrillDialog(rowData: any) {
		this.selectedDrillForSearch = rowData;
		this.showDrillSearch = true;
	}

	handleDrillSelected(event: Drill[]) {
		if (event) {
			this.selectedDrillForSearch.drill.drillsId = event[0].id;
			this.selectedDrillForSearch.drill.name = event[0].name;
			this.selectedDrillForSearch.drillDetail = event[0];
			this.selectedDrillForSearch.drill.tempSharedWithOptions = this.getDrillSharedWithOptions(event[0]);
			const currentTheme = this.allDrillThemeListBackup.find(({ value }) => value === event[0].theme);
			this.selectedDrillForSearch.themeModel = this.getThemeModel(currentTheme, event[0]);
		}
		this.showDrillSearch = false;
	}

	private getThemeModel(currentTheme: SelectItem, drillDetail: Drill): SelectItem {
		if (!currentTheme?.label && !drillDetail?.theme) return null;
		return {
			label: currentTheme && currentTheme?.label ? currentTheme.label : drillDetail?.theme,
			value: drillDetail?.theme
		};
	}

	//endregion

	private getDrillGroupForPdf(drill: any): string {
		let base = '';
		if (drill?.index) {
			base += drill.index;
		}
		if (drill?.letter) {
			base += drill.letter;
		}
		return base;
	}

	async redirectToPreventionTreatment(playerId: string) {
		this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
			this.router.navigate([`medical/maintenance`, { id: playerId, tabIndex: 3 }]);
		});
	}

	getCorrectPlayer(playerId: string): Player {
		return this.allPlayers.find(({ id }) => id === playerId);
	}

	onMedicalPlayerChanged(playerId: string) {
		this.event.playerIds = [playerId];
	}

	setupTieredMenuVideoGallery() {
		this.isTrainingEventFormat$.pipe(first(), untilDestroyed(this)).subscribe({
			next: isTrainingEvent => {
				const from = isTrainingEvent ? 'trainingEvent' : 'gameEvent';
				const redirectUrlPlaylist = ['/manager/video-gallery', { id: this.event.id, from }];
				this.videoGalleryTieredMenuItems = [
					{
						label: this.translate.instant('buttons.uploadNewVideo'),
						icon: 'fas fa-add',
						command: () => this.showVideoGalleryFormDialog(null)
					}
				];
				if (this.videosLength > 0) {
					this.videoGalleryTieredMenuItems.push({
						label: `${this.translate.instant('goToPlaylist')} (${this.videosLength} ${this.translate.instant('buttons.videos')})`,
						icon: 'fas fa-video',
						command: () => this.router.navigate(redirectUrlPlaylist)
					});
				}
			}
		});
	}

	//#region Apply To Menu

	setupTieredMenu() {
		this.tieredMenuItems = [
			{
				label: this.translate.instant('buttons.applyTo') + ' ' + this.translate.instant('players'),
				icon: 'fas fa-check-square',
				visible: this.event.format === 'medical' && (this.event.medicalType as MedicalFieldType) === 'treatment',
				command: () => this.openApplyToDialog()
			}
		];
	}

	private openApplyToDialog() {
		const dialogRef = this.createPlayerSelectionDialog();
		const conversation$ = dialogRef.onClose.pipe(
			untilDestroyed(this),
			filter((selectedPlayers: Player[]) => !!selectedPlayers)
		);

		conversation$.subscribe((players: Player[]) => this.applyToConfirmed(players));
	}

	private createPlayerSelectionDialog(): DynamicDialogRef {
		const itemsGroups: ItemsGroup[] = [
			{
				groupName: this.translate.instant('players'),
				groupItems:
					(this.allPlayers || [])
						.filter(({ id }) => id !== this.event.playerIds[0])
						.map(player => ({
							label: player.displayName,
							value: {
								...player,
								itemUrl:
									player?.downloadUrl && this.azureUrl.transform(player?.downloadUrl)
										? this.azureUrl.transform(player?.downloadUrl)
										: DEFAULT_PERSON_IMAGE_BASE64
							}
						})) || []
			}
		];
		return this.dialogService.open(SelectionDialogComponent, {
			header: this.translate.instant('confirm.selectPlayersToApplyEventTo'),
			data: {
				isMultipleSelection: true,
				itemsGroups
			},
			contentStyle: { overflow: 'auto' }
		});
	}

	private applyToConfirmed(playersApplyTo: Player[]) {
		if (playersApplyTo?.length === 0) return;
		this.confirmationService.confirm({
			message: this.translate.instant('events.applyTo', {
				value: playersApplyTo.map(({ displayName }) => displayName).join(', ')
			}),
			header: 'IterPRO',
			accept: async () => {
				this.event = this.getDataForDuplicatedEvent();
				await this.saveEvent(
					false,
					true,
					playersApplyTo.map(({ id }) => id)
				);
			}
		});
	}
	//#endregion

	isPlayerInjuredHere(playerId: string): boolean {
		return (<Player & { injuryOccurred: boolean }>this.allPlayers.find(({ id }) => id === playerId))?.injuryOccurred;
	}

	canAccessToModule(module: IterproUserPermission): boolean {
		return this.permissionsService.canUserAccessToModule(module, this.currentTeamService.getCurrentTeam()).response;
	}

	copyToActual(plannedDrill) {
		this.actualDrillList.push({
			...plannedDrill,
			drill: {
				...plannedDrill.drill,
				id: uuid()
			},
			id: uuid(),
			duration: plannedDrill.drill.durationMin * 60
		});
		// this.setTableData(false);
	}

	canSeeActual(): boolean {
		return this.event.format === 'training';
	}

	canCopyToActual(): boolean {
		return (
			(this.event.format === 'training' && this.event.theme === 'gym') ||
			this.gpsThirdPartyProvider === 'Dynamic' ||
			!this.event.gpsSessionLoaded
		);
	}

	//region Side Match Stats

	private loadSidesMatchStats() {
		const isCurrentTeamHomeSide = this.event.home;
		const currentTeam = this.currentTeamService.getCurrentTeam();
		const homePlayers = isCurrentTeamHomeSide ? this.getCurrentTeamPlayerStats() : this.getOpponentPlayerStats();
		const awayPlayers = isCurrentTeamHomeSide ? this.getOpponentPlayerStats() : this.getCurrentTeamPlayerStats();
		const normalizedPlayers = normalizePlayers(this.sportType, homePlayers, awayPlayers);

		this.sidesMatchStats = {
			home: {
				imageDataURL: this.thirdPartySelected
					? this.thirdPartySelected.home.imageDataURL
					: isCurrentTeamHomeSide
						? currentTeam.club.crest
						: this.opponent.imageDataURL,
				name: this.thirdPartySelected
					? this.thirdPartySelected.home.name
					: isCurrentTeamHomeSide
						? currentTeam.name
						: this.opponent.name,
				players: isCurrentTeamHomeSide ? this.setGameReports(normalizedPlayers.home) : normalizedPlayers.home
			},
			away: {
				imageDataURL: this.thirdPartySelected
					? this.thirdPartySelected.away.imageDataURL
					: isCurrentTeamHomeSide
						? this.opponent.imageDataURL
						: currentTeam.club.crest,
				name: this.thirdPartySelected
					? this.thirdPartySelected.away.name
					: isCurrentTeamHomeSide
						? this.opponent.name
						: currentTeam.name,
				players: !isCurrentTeamHomeSide ? this.setGameReports(normalizedPlayers.away) : normalizedPlayers.away
			},
			hideHome: this.getHideSideMatchStats(normalizedPlayers.home, isCurrentTeamHomeSide),
			hideAway: this.getHideSideMatchStats(normalizedPlayers.away, !isCurrentTeamHomeSide)
		};
		this.sidesMatchStatsBackup = cloneDeep(this.sidesMatchStats);
	}

	private setGameReports(players: ThirdPartyLinkedPlayer[]): ThirdPartyLinkedPlayer[] {
		return players.map(player => {
			const gameReport = (this.gameReports || []).find(({ playerId }) => playerId === player.playerStats.playerId);
			if (gameReport) {
				player.gameReport = gameReport;
			} else {
				const playerDetails = this.allPlayers.find(({ id }) => id === player.playerStats.playerId);
				if (playerDetails) {
					player.gameReport = this.createPlayerReport(playerDetails);
					player.playerStats.player = playerDetails;
				}
			}
			return player;
		});
	}

	private getHideSideMatchStats(sidePlayers: ThirdPartyLinkedPlayer[], targetTeam: boolean): boolean {
		const isFutureGame = moment(this.event.start).isAfter(moment());
		if (!this.event.wyscoutId && !this.event.instatId && isFutureGame) {
			return !targetTeam;
		}
		return (
			(this.event.wyscoutId || this.event.instatId) && sidePlayers.every(({ playerStats }) => !playerStats.playerId)
		);
	}

	private getCurrentTeamPlayerStats(): ThirdPartyLinkedPlayer[] {
		return ((this.event?._playerMatchStats || []) as PlayerMatchStat[]).map((stat: PlayerMatchStat) => ({
			forceDisabled: !this.isIncludedInCompetitionList(stat.playerId),
			isPlayerInjuredHere: this.isPlayerInjuredHere(stat.playerId),
			isDisabledForGame: this.isDisabledForGame(stat),
			jerseyNumber: this.getJerseyNumber(stat.playerId),
			wyscoutId: null,
			downloadUrl: this.allPlayers.find(({ id }) => id === stat.playerId)?.downloadUrl,
			playerStats: stat,
			gameReport: null
		}));
	}

	private getOpponentPlayerStats(): ThirdPartyLinkedPlayer[] {
		return ((this.event?._opponentPlayerMatchStats || []) as PlayerMatchStat[]).map((stat: PlayerMatchStat) => ({
			wyscoutId: null,
			downloadUrl: stat.downloadUrl,
			playerStats: stat,
			gameReport: null
		}));
	}

	private getMatchStatsForServer(side: 'home' | 'away', currentTeamStats: boolean): PlayerMatchStat[] {
		if (currentTeamStats || this.event?.wyscoutId || this.event?.instatId) {
			return this.sidesMatchStats[side].players
				.map(({ playerStats }) => playerStats)
				.filter(({ playerId }) => !!playerId);
		}
		// if the game is manually created, we need to filter out the players that are not enabled
		return this.sidesMatchStats[side].players.map(({ playerStats }) => playerStats).filter(({ enabled }) => !!enabled);
	}

	private getCurrentTeamMatchStats(): PlayerMatchStat[] {
		const isCurrentTeamHomeSide = this.event.home;
		return isCurrentTeamHomeSide
			? this.getMatchStatsForServer('home', true)
			: this.getMatchStatsForServer('away', true);
	}

	private getCurrentTeamGameReports(): PlayerGameReport[] {
		const side = this.event.home ? 'home' : 'away';
		return this.sidesMatchStats[side].players
			.filter(({ gameReport }) => this.isValidReport(gameReport))
			.map(({ gameReport }) => gameReport);
	}

	private isValidReport(playerReport: PlayerGameReport): boolean {
		return !isEmpty(playerReport?.reportData) || playerReport?.notes != null;
	}

	private getTrainingReports(): PlayerTrainingReport[] {
		return flatten(
			this.selectablePlayers.map(({ players }) =>
				flatten(players.filter(({ trainingReport }) => this.isValidReport(trainingReport))).map(
					({ trainingReport }) => trainingReport
				)
			)
		);
	}

	//endregion

	//region Game Participants
	getCurrentTeamSide(): ThirdPartyLinkedPlayer[] {
		const isCurrentTeamHomeSide = this.event.home;
		const players = isCurrentTeamHomeSide ? this.sidesMatchStats.home.players : this.sidesMatchStats.away.players;
		return players.filter(({ playerStats }) => playerStats.playerId);
	}

	selectPlayerForGame(playerId: string) {
		let player = this.getCurrentTeamSide().find(({ playerStats }) => playerStats.playerId === playerId);
		if (player?.playerStats) {
			const newStatus = !player.playerStats.enabled;
			player.playerStats.enabled = newStatus;
			if (!newStatus) {
				resetPlayerStatsFields(player);
			}
		}
	}

	toggleAllPlayersForGame(checked: boolean, role?: string) {
		if (role) {
			const currentTeamSide = this.playersStatsFilterByPositionPipe.transform(
				this.getCurrentTeamSide(),
				role,
				this.sportType
			);
			currentTeamSide.forEach(player => {
				player.playerStats.enabled = checked;
				if (!checked) {
					resetPlayerStatsFields(player);
				}
			});
		} else {
			this.getCurrentTeamSide().forEach(player => {
				player.playerStats.enabled = checked;
				if (!checked) {
					resetPlayerStatsFields(player);
				}
			});
		}
	}
	//endregion

	//region PlayerGameReport/PlayerTrainingReport

	getCorrectSchema(playerReport: ExtendedPlanningGameReport): Schema {
		if (!playerReport) return this.activePlayerReportTemplate;
		const { templateId, templateVersion } = playerReport;
		return this.allPlayerReportTemplates.find(({ id, version }) => id === templateId && version === templateVersion);
	}

	onReportDataChange(
		playerReport: ExtendedPlanningGameReport,
		{ sectionId, propertyName, eventValue }: CustomReportDataChangeOutput
	) {
		const reportData: Partial<ScoutingGameReportWithPlayer> = { [propertyName]: eventValue };
		playerReport.reportData[sectionId] = { ...playerReport.reportData[sectionId], ...reportData };
		// update history
		playerReport.reportDataHistory = [...(playerReport?.reportDataHistory || []), this.getHistoryRecord()];
	}

	private getHistoryRecord(): PlayerReportHistory {
		return {
			updatedAt: moment().toDate(),
			author: this.currentUserId
		};
	}

	private createPlayerReport(playerDetails: Player): PlayerGameReport | PlayerTrainingReport {
		if (!this.activePlayerReportTemplate) return null;
		const denormalizedEventFields: DenormalizedEventFields = {
			start: this.event.start,
			homeTeam: this.currentTeamService.getCurrentTeam().name,
			awayTeam: this.event.opponent,
			title: this.event.title
		};
		return new PlayerGameReport({
			templateId: this.activePlayerReportTemplate.id,
			templateVersion: this.activePlayerReportTemplate.version as number,
			playerId: playerDetails.id,
			eventId: this.event.id,
			displayName: playerDetails.displayName,
			position: playerDetails.position,
			downloadUrl: playerDetails.downloadUrl,
			nationality: playerDetails.nationality,
			birthDate: playerDetails.birthDate,
			teamId: this.currentTeamService.getCurrentTeam().id,
			authorId: this.currentUserId,
			denormalizedEventFields,
			reportData: {},
			reportDataShareWithPlayer: false,
			notesShareWithPlayer: false
		});
	}

	deleteGameReport(playerReport: ExtendedPlanningGameReport) {
		playerReport = null;
	}

	addAttachment(
		playerReport: ExtendedPlanningGameReport,
		attachment: Attachment,
		type: ScoutingGameReportAttachmentType
	) {
		playerReport[type] = [...playerReport[type], attachment];
	}

	deleteAttachment(
		playerReport: ExtendedPlanningGameReport,
		attachment: Attachment,
		type: ScoutingGameReportAttachmentType
	) {
		playerReport[type] = playerReport[type].filter(att => att.id !== attachment.id);
	}

	onClickPlayerLens(playerId: string) {
		const url = `/players/my-team;id=${playerId};tabIndex=0;`;
		this.router.navigateByUrl(url);
	}

	onGameReportNotesChange(playerReport: ExtendedPlanningGameReport, notes: string) {
		playerReport.notes = notes;
		// update history
		playerReport.notesHistory = [...(playerReport?.notesHistory || []), this.getHistoryRecord()];
	}

	private validPlayerStats(stats: ThirdPartyLinkedPlayer[]): ThirdPartyLinkedPlayer[] {
		return stats.filter(({ playerStats }) => playerStats?.player);
	}

	showVideoGalleryFormDialog(playerId?: string, video?: VideoAsset) {
		const type = this.event.format === 'training' ? 'event.format.training' : 'event.format.game';
		let title = this.translate.instant(type);
		if (playerId) {
			const player = this.allPlayers.find(({ id }) => id === playerId);
			title = `${player.displayName} - ${this.translate.instant(type)}`;
		}
		this.videoGalleryForm = {
			visible: true,
			prefilledPlayerIds: playerId ? [playerId] : null,
			prefilledTitle: title,
			videoToEdit: video
		};
	}
	//endregion

	//region Team Game Report
	teamReportNotesChanged(notes: string) {
		this.teamReport.notes = notes;
		// update history
		this.teamReport.notesHistory = [...(this.teamReport?.notesHistory || []), this.getHistoryRecord()];
	}

	//endregion

	// region Event File Repository
	showEventRepository(event?: MouseEvent, prefilledPlayerId?: string) {
		this.editService.editMode = true;
		event?.stopPropagation();
		this.eventRepository = {
			visible: true,
			prefilledPlayerIds: prefilledPlayerId ? [prefilledPlayerId] : [],
			attachments: this.event._attachments
		};
	}

	saveEventRepository(attachments: Attachment[]) {
		this.event._attachments = attachments;
		this.eventRepository = {
			visible: false,
			prefilledPlayerIds: [],
			attachments: []
		};
	}

	discardEventRepository() {
		this.eventRepository = {
			visible: false,
			prefilledPlayerIds: [],
			attachments: []
		};
	}
	// endregion
}

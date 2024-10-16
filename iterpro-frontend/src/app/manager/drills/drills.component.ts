import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { faChartSimple, faFilter, faIdCard, faList, faPenRuler, faPlus } from '@fortawesome/pro-solid-svg-icons';
import { DrillFilters, DrillFiltersConfig } from '@iterpro/manager/drills/data-access';
import { DrillsStatsState } from '../../../../libs/domains/manager/drills/stats/data-access/src/+state/drills-stats.state';
import { UIDrillStatsActions } from '../../../../libs/domains/manager/drills/stats/data-access/src/+state/drills-stats.actions';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import {
	Attachment,
	ClubApi,
	Customer,
	Drill,
	DrillApi,
	LoopBackAuth,
	Player,
	Team,
	TeamApi,
	TeamSeason,
	TeamSeasonApi
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	DrillsListMapping,
	DrillsMapping,
	DrillsMappingService,
	EditModeService,
	ErrorService,
	getMomentFormatFromStorage
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import * as Papa from 'papaparse';
import { ConfirmationService, MenuItem, SelectItem } from 'primeng/api';
import { Observable, Observer, forkJoin, switchMap } from 'rxjs';
import { distinctUntilChanged, filter, first, map } from 'rxjs/operators';
import { DrillsProfileStoreActions, DrillsProfileStoreSelectors } from 'src/app/+state/drills-profile-store';
import { RootStoreState } from 'src/app/+state/root-store.state';
const moment = extendMoment(Moment);

enum ViewModeEnum {
	Card = 'card',
	List = 'list',
	Stats = 'stats',
	Canvas = 'canvas'
}

@UntilDestroy()
@Component({
	templateUrl: 'drills.component.html',
	styleUrls: ['./drills.component.scss']
})
export class DrillsComponent implements CanComponentDeactivate, OnInit, OnDestroy {
	/** Services */
	readonly #router = inject(Router);

	@Output() onDownloadCSV = new EventEmitter();
	@Output() onDownloadPDF = new EventEmitter();
	readonly #store = inject(Store<DrillsStatsState>);
	searchFilterWords: string;
	uploadedFiles: any[];
	customers: Customer[] = [];
	drillListBackup: Drill[] = [];
	filteredDrillsList: SelectItem[] = [];
	selectedDrill: Drill;
	drillFiltersConfig: DrillFiltersConfig[] = [
		'theme',
		'duration',
		'numberOfPlayers',
		'pitchSize',
		'ageGroup',
		'technicalGoal',
		'tacticalGoal',
		'physicalGoal',
		'attachments'
	];
	drillsMapping: DrillsMapping;
	drillFiltersListMapping: DrillsListMapping;
	selectedTheme: string;
	selectedAgeGroup: string;

	currentTeamId: string;
	clubId: string;
	coachingPoint = '';

	radarData$: Observable<any>;
	radarOptions$: Observable<any>;
	drillsNumber$: Observable<number>;
	isLoading$: Observable<boolean>;

	drillAttachments: Attachment[] = [];
	showFilters: boolean;
	isLoading: boolean;
	private uploadedDrills: any[] = [];
	private fileReader: FileReader;
	@ViewChild('inputjson', { static: false })
	fileInput: ElementRef;
	lastAppliedFilters: DrillFilters;
	readonly #currentTeam$ = this.authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());
	readonly #currentSeason$ = this.authStore.select(AuthSelectors.selectTeamSeason).pipe(takeUntilDestroyed());

	/** Icons */
	readonly icons = {
		faPenRuler,
		faIdCard,
		faPlus,
		faList,
		faFilter,
		faChartSimple
	};

	viewModes = ViewModeEnum;
	viewTypes: MenuItem[] = [
		{
			id: ViewModeEnum.Card,
			label: 'admin.squads.cardView',
			faIcon: this.icons.faIdCard,
			command: () => (this.activeViewType = this.viewTypes[0])
		},
		{
			id: ViewModeEnum.List,
			label: 'admin.squads.tableView',
			icon: 'fas fa-list',
			faIcon: this.icons.faList,
			command: () => (this.activeViewType = this.viewTypes[1])
		},
		{
			id: ViewModeEnum.Stats,
			label: 'drillStats.statistics',
			icon: 'fas fa-chart-simple',
			faIcon: this.icons.faChartSimple,
			command: () => this.goToDrillsStats()
		},
		{
			id: ViewModeEnum.Canvas,
			label: 'drillCanvas.navigate',
			command: () => this.goToEditor()
		}
	];
	activeViewType: MenuItem = this.viewTypes[0];
	constructor(
		private drillApi: DrillApi,
		private teamApi: TeamApi,
		private clubApi: ClubApi,
		private error: ErrorService,
		private route: ActivatedRoute,
		private authService: LoopBackAuth,
		private editService: EditModeService,
		private authStore: Store<AuthState>,
		private translate: TranslateService,
		private teamSeasonApi: TeamSeasonApi,
		private store$: Store<RootStoreState>,
		private notificationService: AlertService,
		private confirmationService: ConfirmationService,
		private drillsMappingService: DrillsMappingService,
		private blockUiInterceptorService: BlockUiInterceptorService
	) {}

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

	ngOnDestroy() {
		this.store$.dispatch(DrillsProfileStoreActions.clearState());
	}

	ngOnInit() {
		this.radarData$ = this.store$.select(DrillsProfileStoreSelectors.selectChartData);
		this.radarOptions$ = this.store$.select(DrillsProfileStoreSelectors.selectChartOptions);
		this.drillsNumber$ = this.store$.select(DrillsProfileStoreSelectors.selectSplitNumbers);
		this.isLoading$ = this.store$.select(DrillsProfileStoreSelectors.selectIsLoading);
		this.uploadedFiles = [];

		this.#currentTeam$
			.pipe(
				distinctUntilChanged(),
				filter(team => !!team)
			)
			.subscribe({
				next: (team: Team) => {
					this.currentTeamId = team.id;
					this.clubId = team.clubId;
					this.loadDrillsMapping(team);
					this.listenForParam();
				}
			});
	}

	private listenForParam() {
		this.route.paramMap.pipe(first()).subscribe({
			next: (params: ParamMap) => {
				this.defaultMode(params.get('id'));
			}
		});
	}

	getEditMode(): boolean {
		return this.editService.editMode;
	}

	defaultMode(id?: string) {
		this.editService.editMode = false;
		this.getDrills(id);
	}

	private editMode() {
		this.editService.editMode = true;
	}

	private setReadonlyMode() {
		this.editService.editMode = false;
	}

	selectDrill(drill: SelectItem) {
		this.selectedDrill = drill.value;
		this.selectedTheme = this.selectedDrill.theme;
		// Handling of: If we found some empty strings in array then do not display them with bullet.
		if (this.selectedDrill.coachingPoint) {
			let temp = '';
			this.selectedDrill.coachingPoint.forEach(item => {
				if (item.trim() !== '') temp += '• ' + item;

				if (temp) temp += '\r\n';
			});

			this.coachingPoint = temp.trim();
		} else {
			this.coachingPoint = '';
		}
		this.selectedAgeGroup = this.selectedDrill.ageGroup;
		this.drillAttachments = this.selectedDrill._attachments ? [...this.selectedDrill._attachments] : [];

		this.store$.dispatch(DrillsProfileStoreActions.selectedDrill({ selectedDrillId: this.selectedDrill.id }));

		this.setReadonlyMode();
	}

	newDrill() {
		const newDrill = new Drill();
		newDrill._attachments = [];
		newDrill.sharedWithIds = [this.authService.getCurrentUserId()];
		newDrill.authorId = this.authService.getCurrentUserId();
		this.selectedDrill = newDrill;
		this.selectedTheme = null;
		this.selectedAgeGroup = null;
		this.coachingPoint = '';
		this.drillAttachments = [];
		this.store$.dispatch(DrillsProfileStoreActions.addNewDrillClicked());
		this.editMode();
	}

	getDrills(selectedId?: string) {
		this.isLoading = true;
		this.filteredDrillsList = [];
		this.blockUiInterceptorService
			.disableOnce(
				forkJoin([
					this.clubApi.getCustomers(this.clubId, {
						fields: ['_id', 'id', 'firstName', 'lastName']
					}),
					this.drillApi.find({
						where: {
							or: [
								{ authorId: this.authService.getCurrentUserId() },
								{ sharedWithIds: this.authService.getCurrentUserId() }
							]
						},
						order: 'name ASC',
						include: 'attachments'
					})
				])
			)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: ([customers, drills]: [Customer[], Drill[]]) => {
					this.customers = customers;
					this.drillListBackup = drills;
					this.filteredDrillsList = drills.map(item => ({ label: item.name, value: item }));
					this.drillFiltersListMapping = this.drillsMappingService.getDrillFiltersListMapping(
						drills,
						this.drillsMapping.themes
					);
					if (selectedId) {
						const selectedDrill = drills.find(({ id }) => id === selectedId);
						if (selectedDrill) {
							this.selectDrill({ label: selectedDrill.name, value: selectedDrill });
						}
					} else {
						if (this.lastAppliedFilters) {
							this.applyDrillFilters(this.lastAppliedFilters);
						}
					}
					this.isLoading = false;
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	applyDrillFilters(event: DrillFilters) {
		this.isLoading = true;
		this.lastAppliedFilters = event;
		this.filteredDrillsList = this.drillsMappingService
			.applyDrillFilters(event, this.drillListBackup)
			.map(item => ({ label: item.name, value: item }));
		setTimeout(() => {
			this.isLoading = false;
		}, 300);
	}

	private loadDrillsMapping(team: Team) {
		this.drillsMapping = this.drillsMappingService.getDrillsMapping(team);
	}

	back() {
		this.selectedDrill = undefined;
		this.editService.editMode = false;
		if (this.lastAppliedFilters) {
			this.applyDrillFilters(this.lastAppliedFilters);
		}
	}

	searchDrills(ev) {
		const val = ev.target.value;
		if (val && val.trim() !== '') {
			this.filteredDrillsList = this.drillListBackup
				.filter(item => {
					return item.name.toLowerCase().indexOf(val.toLowerCase()) > -1;
				})
				.map(item => ({ label: item.name, value: item }));
		} else {
			this.filteredDrillsList = this.drillListBackup.map(item => ({ label: item.name, value: item }));
		}
	}

	downloadCSV() {
		const t = this.translate.instant.bind(this.translate);
		const drillsData = this.drillListBackup;
	
		const drillProperties = [
			'name',
			'theme',
			'physicalGoals',
			'technicalGoals',
			'tacticalGoals',
			'ageGroup',
			'pitchSizeX',
			'pitchSizeY',
			'players',
			'duration'
		];

		const headerObj = {};
		headerObj[''] = '';
		drillProperties.forEach(prop => {
			headerObj[prop] = t(`drills.${prop}`);
		});
	
		// Recover data-Drills
		const csvData = drillsData.map((drill, index) => {
			const dataObj = {};
			dataObj[''] = index + 1;
	
			drillProperties.forEach(prop => {
				if (Array.isArray(drill[prop])) {
					dataObj[prop] = drill[prop].join(', ');
				} else {
					dataObj[prop] = drill[prop] || '';
				}
			});
			return dataObj;
		});
	
		const results = Papa.unparse([...csvData]);
		const fileName = 'Drills_' + moment().format(getMomentFormatFromStorage()) + '.csv';
		const blob = new Blob([results], { type: 'text/csv;charset=utf-8;' });
		saveAs(blob, fileName);
	}

	downloadEmptyCsv() {
		const headerObj = {};
		const drillProperties = [
			'name',
			'theme',
			'physicalGoals',
			'technicalGoals',
			'tacticalGoals',
			'ageGroup',
			'pitchSizeX',
			'pitchSizeY',
			'numberOfPlayers',
			'duration'
		];

		// leaving first column of header empty for numbering etc.
		headerObj['No.'] = '';

		// Adding all other properties to header.
		drillProperties.forEach(prop => {
			headerObj[prop] = '';
		});

		const results = Papa.unparse([headerObj]);
		const fileName = 'Drills_' + moment().format(getMomentFormatFromStorage()) + '_empty.csv';

		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	fileChanged(e) {
		this.uploadedDrills = [];
		this.fileReader = new FileReader();

		// Reading from uploaded file.
		this.fileReader.onload = loadEvent => {
			const csvRead = this.fileReader.result;
			const resultsCsv: Papa.ParseResult<any> = Papa.parse(csvRead.toString(), {
				header: true,
				skipEmptyLines: true
			});
			// array of all the scouting player in uploaded file
			const csvData = resultsCsv.data;
			this.uploadedDrills = csvData.map(csvDataValue => ({
				name: csvDataValue.name,
				theme: csvDataValue.theme,
				physicalGoals: csvDataValue.physicalGoals.includes(', ')
					? csvDataValue.physicalGoals.split(', ')
					: [csvDataValue.physicalGoals],
				technicalGoals: csvDataValue.technicalGoals.includes(', ')
					? csvDataValue.technicalGoals.split(', ')
					: [csvDataValue.technicalGoals],
				tacticalGoals: csvDataValue.tacticalGoals.includes(', ')
					? csvDataValue.tacticalGoals.split(', ')
					: [csvDataValue.tacticalGoals],
				ageGroup: csvDataValue.ageGroup,
				pitchSizeX: csvDataValue.pitchSizeX,
				pitchSizeY: csvDataValue.pitchSizeY,
				players: csvDataValue.numberOfPlayers ? Number(csvDataValue.numberOfPlayers) : undefined,
				duration: csvDataValue.duration
			}));
			this.fileInput.nativeElement.value = '';
		};

		// Updating DB for newly uploaded scout players after file read option complete.
		this.fileReader.onloadend = () => this.updateDbForUploadedDrills();

		// Error handling for file reader
		this.fileReader.onerror = ev => {
			this.notificationService.notify('error', 'error', 'import.feedbacks.errorCSV');
		};
		// Reading first file uploaded.
		this.fileReader.readAsText(e.target.files[0]);
	}

	private updateDbForUploadedDrills() {
		this.teamApi
			.createManyDrills(this.currentTeamId, this.uploadedDrills)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.notificationService.notify('success', 'drills', 'alert.recordCreated', false);
					this.getDrills();
				},
				error: (error: Error) => void this.error.handleError(error)
			});
	}
	goToEditor() {
		this.#router.navigate([`manager/drills/canvas`]);
	}

	goToDrillsStats() {
		this.#router.navigate([`manager/drills/stats`]);
	}
}

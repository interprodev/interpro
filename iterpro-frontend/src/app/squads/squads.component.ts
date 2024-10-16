import { ChangeDetectorRef, Component, ElementRef, HostListener, Injector, OnInit, ViewChild } from '@angular/core';
import { FormControl, NgForm } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { environment } from '@iterpro/config';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Agent,
	AgentApi,
	AgentWithDisplayName,
	AlreadyImportedPlayer,
	Club,
	CompetitionInfo,
	ContractPersonType,
	Customer,
	LoopBackAuth,
	NotificationApi,
	People,
	Player,
	PlayerApi,
	ProviderType,
	SquadPersonIndexEnum,
	Staff,
	StaffApi,
	StaffWithDisplayName,
	Team,
	TeamApi,
	TeamSeason,
	TeamSeasonApi,
	TestApi,
	Threshold
} from '@iterpro/shared/data-access/sdk';
import { CsvTable, FormStatus } from '@iterpro/shared/ui/components';
import {
	AlertService,
	AzureStorageService,
	CanComponentDeactivate,
	EditModeService,
	ErrorService,
	ImageService,
	ProviderIntegrationService,
	ProviderTypeService,
	ReportService,
	getId,
	sortByDateDesc,
	splitArrayInChunks,
	areAnyKeysPopulated
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { assign, cloneDeep, isEqual, pull, sortBy, uniq } from 'lodash';
import * as moment from 'moment';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as Papa from 'papaparse';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { Observable, Observer, forkJoin, of } from 'rxjs';
import { catchError, concatMap, debounceTime, distinctUntilChanged, first, map, switchMap, tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { SquadPeopleComponent } from '../shared/players/squad-people/squad-people.component';
import { PlayersService } from '../shared/players/services/players.service';
import { adminColumns, alwaysVisible } from '../shared/players/utils/headers';
import { CsvColumnNames, CsvColumnNamesService } from './service/csv-column-names.service';
import { ImportBulkPlayersCsv } from './service/import-bulk-players-csv.service';
import { SquadPlayersFilter, SquadPlayersPageInfo, SquadsService } from './service/squads.service';
import { SquadsPersonComponent } from './squads-person/squads-person.component';

export interface DropdownElement {
	team: Team;
	player: Player;
	isTeam: boolean;
}
interface ChangeTeamSettings {
	flag: boolean;
	newTeamId: string;
	oldTeamId: string;
	newCurrent: TeamSeason;
	oldCurrent: TeamSeason;
}

@UntilDestroy()
@Component({
	selector: 'iterpro-players-admin',
	templateUrl: './squads.component.html',
	styleUrls: ['./squads.component.css']
})
export class SquadsComponent extends EtlBaseInjectable implements CanComponentDeactivate, OnInit {
	@ViewChild(SquadsPersonComponent, { static: false })
	childTabs: SquadsPersonComponent;
	@ViewChild('players', { static: false })
	playersChild: SquadPeopleComponent;
	@ViewChild('playersPreview', { static: false })
	playersPreview: SquadPeopleComponent;

	personType: ContractPersonType = 'Player';
	providerTeams: Team[];
	selectedTeam: Team;
	players: Player[];
	clubAlreadyImportedPlayers: Player[] = [];
	staff: StaffWithDisplayName[] = [];
	currentTeamSettings: any;
	selected: Player | Staff | Agent;

	visible: boolean;
	toArchive: People;
	visibleUnarchive: boolean;
	toActivate: People;
	activeIndex: SquadPersonIndexEnum = SquadPersonIndexEnum.Overview;
	squadPersonViewEnum = SquadPersonIndexEnum;
	tabIndexParam!: number;
	contractIdParam: string;
	peopleTypeParam: 'player' | 'staff';
	updated: boolean;
	isNew: boolean;
	temp: Player | Staff | Agent;
	isTempPersonType: ContractPersonType;
	idParam: string = null;
	idStaffParam: string = null;

	thirdPartyPlayerSearchDialogVisible = false;
	alreadyImportedPlayers: AlreadyImportedPlayer[] = [];
	filterPlayer = '';
	filterPlayerText = new FormControl();
	agents: AgentWithDisplayName[];

	club: Club;

	provider: ProviderType;

	bulkPeopleTable: CsvTable;

	showFilters = false;

	@ViewChild('inputjson', { static: false }) myInput: ElementRef;
	fileReader: FileReader;
	selectedSeason: TeamSeason;
	isOpen = false;

	correctBulkPlayerUpload: FormStatus;
	errorsPerPageBulkPlayer: number[] = [];
	currentPageBulkPlayer = 0;

	changeTeamSettings: ChangeTeamSettings = null;
	pageInfo: SquadPlayersPageInfo;
	playerAppDialog = false;

	selectedPeople: People[] = [];
	bulkAction = false;
	// move to another team feature properties
	moveSelectedPeopleDialogVisible = false;
	selectedPlayerNames: string;
	teamToMoveSelectedPeople: Team;
	seasonToMoveSelectedPlayers: TeamSeason;
	// end move to another team feature properties

	initialized = false;

	@BlockUI('containerProf') blockUI: NgBlockUI;
	searchDropdownElements: DropdownElement[];

	private visibleToSeasonDialog: 'none' | 'player' | 'thirdparty' = 'none';
	private thirdPartyPlayersToAdd: any[] = [];
	private currentActivePlayersNumbers: number;
	private currentArchivedPlayersNumbers: number;
	customers: Customer[];
	allTeams: Team[];
	isLoading = true;
	addPlayerMenuItems: MenuItem[] = [];
	totalPeopleRows: number;

	constructor(
		injector: Injector,
		public editService: EditModeService,
		private notificationService: AlertService,
		private error: ErrorService,
		private auth: LoopBackAuth,
		private confirmationService: ConfirmationService,
		private translate: TranslateService,
		private staffApi: StaffApi,
		private playerApi: PlayerApi,
		private route: ActivatedRoute,
		private testApi: TestApi,
		private notificationApi: NotificationApi,
		private agentApi: AgentApi,
		private reportService: ReportService,
		private azureDownloadUploadService: AzureStorageService,
		private imageDownloadService: ImageService,
		private currentTeamService: CurrentTeamService,
		private teamSeasonApi: TeamSeasonApi,
		private squadsService: SquadsService,
		private teamApi: TeamApi,
		private importBulkPlayersCsv: ImportBulkPlayersCsv,
		private csvColumnNamesService: CsvColumnNamesService,
		private playersService: PlayersService,
		private changeDetectorRef: ChangeDetectorRef,
		private providerIntegrationService: ProviderIntegrationService,
		providerTypeService: ProviderTypeService
	) {
		super(injector);
		this.onSelectPlayer = this.onSelectPlayer.bind(this);
		this.onSelectStaff = this.select.bind(this, 'Staff');
		this.onSelectAgent = this.select.bind(this, 'Agent');
		this.openArchive = this.openArchive.bind(this);
		this.openArchiveDialog = this.openArchiveDialog.bind(this);
		this.openDelete = this.openDelete.bind(this);
		this.openActivateDialog = this.openActivateDialog.bind(this);
		this.handleDeleteFlagPlayer = this.handleDeleteFlagPlayer.bind(this);
		this.provider = providerTypeService.getProviderType(this.currentTeamService.getCurrentTeam());
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
		this.route.paramMap.pipe(untilDestroyed(this)).subscribe((params: ParamMap) => {
			const refresh = params.get('refresh');
			if (refresh) {
				this.select(null, null);
			}
			const paramsItem = params['params'];
			if (paramsItem) {
				this.idParam = paramsItem.playerId || null;
				this.idStaffParam = paramsItem.staffId || null;
				this.tabIndexParam = paramsItem.tabIndex || null;
				this.contractIdParam = paramsItem.contractId || null;
				this.peopleTypeParam = paramsItem.peopleType || null;
				if (params.has('archived')) {
					const playerArchived = params.get('archived').toLowerCase() === 'y' ? 'archived' : 'active';
					this.pageInfo = {
						...this.pageInfo,
						filter: { status: [playerArchived] }
					};
				}
			}
			this.translate
				.getTranslation(this.translate.currentLang)
				.pipe(first())
				.subscribe({
					next: () => {
						if (!this.initialized) {
							this.initialized = true;
							this.load();
							this.setAddPlayerMenuItems();
						}
					}
				});
		});
	}

	private setAddPlayerMenuItems() {
		this.addPlayerMenuItems = [
			{
				label: this.translate.instant('profile.player'),
				command: () => this.confirmCreateNewPlayer()
			},
			{
				label: this.translate.instant('admin.squads.element.staff'),
				command: () => this.confirmCreateNewStaff()
			},
			{
				label: this.translate.instant('admin.squads.player.agent'),
				command: () => this.confirmCreateNewAgent()
			}
		];
		if (this.provider !== 'Dynamic') {
			this.addPlayerMenuItems.push({
				label: this.translate.instant('playerFrom' + this.provider),
				command: () => this.openThirdPartySearchDialog()
			});
		}
	}

	private subscribeToSearchBar() {
		return this.filterPlayerText.valueChanges.pipe(
			debounceTime(400),
			distinctUntilChanged(),
			catchError(e => {
				console.error(e);
				return of(null);
			}),
			untilDestroyed(this)
		);
	}

	private filterPeopleByText(text: string) {
		const role = this.getRole();
		if (role === 'Player') {
			this.loadPlayerPage({ filter: { text } });
		} else if (role === 'Staff') {
			const staff = this.offlineTextFilter(this.staff, text);
			this.club = { ...this.club, staff };
		} else {
			const agents = this.offlineTextFilter(this.agents, text);
			this.club = { ...this.club, agents };
		}
	}

	private offlineTextFilter(results: any[] = [], text: string = '') {
		const searchText = text.toLowerCase();
		return text
			? results.filter(
					player =>
						(player.name || player.firstName || '').toLowerCase().indexOf(searchText) > -1 ||
						(player.displayName || '').toLowerCase().indexOf(searchText) > -1 ||
						(player.lastName || '').toLowerCase().indexOf(searchText) > -1 ||
						String(player.id) === text
				)
			: results;
	}

	setOpen(isOpen: boolean) {
		this.isOpen = isOpen;
	}

	private load() {
		const showPlayerDetail = !!this.idParam;
		this.getClub()
			.pipe(
				first(),
				switchMap((club: Club) => {
					this.club = club;
					this.allTeams = club.teams.map(team => ({
						...team,
						teamSeasons: sortByDateDesc(team?.teamSeasons || [], 'inseasonEnd')
					}));
					this.selectedTeam = this.allTeams.find(team => getId(team) === this.auth.getCurrentUserData().currentTeamId);

					if (this.provider === 'Dynamic') {
						this.providerTeams = club.teams;
					} else {
						const providerIdField = this.etlPlayerService.getProviderIdField();
						const teamsWithProvider = club.teams.filter(clubTeam => clubTeam[providerIdField]);
						const hasTeamsWithProvider = teamsWithProvider.length > 0;
						this.providerTeams = hasTeamsWithProvider ? teamsWithProvider : [club.teams[0]];
					}
					return forkJoin([this.getAgents(), showPlayerDetail ? of(true) : this.getRoleQuery(), this.getCustomers()]);
				}),
				switchMap(() => {
					this.club = { ...this.club, players: this.players, staff: this.staff, agents: this.agents };

					this.selectedSeason = this.currentTeamService.getCurrentSeason();

					if (showPlayerDetail) {
						this.onSelectPlayer({ id: this.idParam });
						this.activeIndex = this.tabIndexParam ? this.tabIndexParam : SquadPersonIndexEnum.Amortization;
					}
					if (this.idStaffParam) {
						this.select(
							'Staff',
							this.club.staff.find(staffItem => getId(staffItem) === this.idStaffParam)
						);
						this.idStaffParam = null;
						this.activeIndex = this.tabIndexParam ? this.tabIndexParam : SquadPersonIndexEnum.Overview;
					}
					return this.squadsService.getPlayersLimits(this.selectedTeam.id).pipe();
				}),
				map(({ activePlayersLimit, archivedPlayersLimit }) => {
					this.currentActivePlayersNumbers = activePlayersLimit;
					this.currentArchivedPlayersNumbers = archivedPlayersLimit;
					this.isLoading = false;
				}),
				switchMap(() => this.subscribeToSearchBar())
			)
			.subscribe({
				next: (filterPlayer: string) => {
					this.filterPeopleByText(filterPlayer);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	getSearchDropdownElements(persons: any[] = [], teams: Team[]): DropdownElement[] {
		let results: DropdownElement[] = [];
		for (const team of teams) {
			const teamPlayers = sortBy(persons, 'displayName')
				.filter(({ teamId }) => teamId === team.id)
				.filter(person => person.id !== this.selected.id);
			results = [
				...results,
				...(teamPlayers.length > 0 ? [{ team, player: null, isTeam: true }] : []),
				...teamPlayers.map(player => ({ team, player, isTeam: false }))
			];
		}
		return results;
	}

	updateFilterAndReload(filter: SquadPlayersFilter) {
		this.updatePageInfo({ filter });
		this.load();
	}

	loadPlayerPage(info: SquadPlayersPageInfo) {
		this.updatePageInfo(info);
		if (!!this.pageInfo.filter.team && this.pageInfo.filter.team.length === 0) {
			this.setSquadPlayersInClub();
		} else {
			forkJoin([
				this.squadsService.getSquadPeople(this.club, 'Player', this.pageInfo),
				this.squadsService.requestClubPlayers()
			])
				.pipe(
					map(([{ people, totalRows }, clubPlayers]) => {
						this.clubAlreadyImportedPlayers = clubPlayers;
						this.setSquadPlayersInClub(people as Player[], totalRows);
						this.updateAlreadyImportedClubPlayers();
					}),
					first(),
					untilDestroyed(this)
				)
				.subscribe({
					error: error => void this.error.handleError(error)
				});
		}
	}

	private setSquadPlayersInClub(players: Player[] = [], totalRows?: number) {
		this.setSquadPlayersResult(players, totalRows);
		this.club = { ...this.club, players };
	}

	private setSquadPlayersResult(players: Player[] = [], totalRows?: number) {
		this.players = players;
		this.totalPeopleRows = totalRows;
	}

	refreshClub() {
		this.club = { ...this.club, players: this.players, staff: this.staff, agents: this.agents };
	}

	toggleFilter() {
		this.showFilters = !this.showFilters;
	}

	onSelectFromDropdown(value: DropdownElement) {
		this.personType === 'Player' ? this.onSelectPlayer(value.player) : this.select(this.personType, value.player);
	}

	onSelectPlayer(clickedPlayer: any) {
		if (!clickedPlayer) return;
		const id = getId(clickedPlayer);
		if (id) {
			this.squadsService
				.getSinglePlayer(id)
				.pipe(first())
				.subscribe({
					next: (player: Player) => this.select('Player', player),
					error: (error: Error) => this.error.handleError(error)
				});
		}
	}

	onSelectStaff() {}

	onSelectAgent() {}

	select(mode: ContractPersonType, event) {
		this.personType = mode;
		this.selected = event;
		this.idParam = null;
		if (this.selected) {
			const people = mode === 'Player' ? this.players : mode === 'Agent' ? this.agents : this.staff;
			this.searchDropdownElements = this.getSearchDropdownElements(people, this.club.teams);
		} else if (!this.selected) {
			this.totalPeopleRows = undefined;
			this.load();
		}
	}

	onBack() {
		this.select(this.personType, null);
	}

	onEdit() {
		if (this.selected) this.temp = cloneDeep(this.selected);
		this.editService.editMode = true;
	}

	onDiscard() {
		if (this.selected) this.selected = cloneDeep(this.temp);
		this.temp = null;
		this.editService.editMode = false;
	}

	confirmEdit(f?: NgForm) {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.edit'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				if (this.selected) {
					if (this.personType === 'Player') {
						this.onSavePlayer({
							player: this.selected as Player,
							redirect: false
						});
					} else if (this.personType === 'Staff') {
						this.onSaveStaff({
							staff: this.selected,
							redirect: false
						});
					} else if (this.personType === 'Agent') {
						this.onSaveAgent({
							agent: this.selected,
							redirect: false
						});
					}
				}
			}
		});
	}
	private onSavePlayer(element: { player: Player; redirect: boolean }) {
		const player: Player = {
			...element.player,
			documents: (element.player?.documents || []).filter(doc => areAnyKeysPopulated(doc, 'id')),
			otherMobile: (element.player?.otherMobile || []).filter(doc => areAnyKeysPopulated(doc, 'id')),
			address: areAnyKeysPopulated(element.player?.address, 'id') ? element.player.address : null,
			domicile: areAnyKeysPopulated(element.player?.domicile, 'id') ? element.player.domicile : null
		};
		const obs = [this.playerApi.patchAttributes(getId(player), player)];
		if (this.changeTeamSettings) {
			if (this.changeTeamSettings.flag && this.changeTeamSettings.newCurrent) {
				obs.push(
					this.teamSeasonApi.updateAttributes(this.changeTeamSettings.newCurrent.id, this.changeTeamSettings.newCurrent)
				);
			}
			obs.push(
				this.teamSeasonApi.updateAttributes(this.changeTeamSettings.oldCurrent.id, this.changeTeamSettings.oldCurrent)
			);
		}
		forkJoin(obs)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (res: any[]) => {
					this.checkForPlayerOperation(player, false);
					this.checkForPlayerFinancialLossGain(player);
					this.squadsService.invalidCache(player.id);
					this.onSaved();
					this.changeTeamSettings = null;
					if (this.selected || element.redirect === true) {
						this.select(this.personType, res[0]);
						if (element.redirect === true) {
							this.activeIndex = SquadPersonIndexEnum.Details;
							this.isNew = true;
							this.onEdit();
						}
					}
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private onSaveStaff(element) {
		const staffId = getId(element.staff);
		delete element.staff?._id;
		this.staffApi
			.patchAttributes(staffId, element.staff)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (res: Staff) => {
					this.onSaved();
					if (this.selected || element.redirect === true) {
						this.select('Staff', res);
						if (element.redirect === true) {
							this.activeIndex = SquadPersonIndexEnum.Details;
							this.isNew = true;
							this.onEdit();
						}
					}
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private onSaveAgent(element) {
		this.agentApi
			.patchAttributes(getId(element.agent), element.agent)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (res: Agent) => {
					this.onSaved();
					const obs: Array<Observable<any>> = [];
					forkJoin(obs)
						.pipe(first(), untilDestroyed(this))
						.subscribe({
							next: () => {
								if (this.selected || element.redirect === true) {
									this.select('Agent', res);
									if (element.redirect === true) {
										this.activeIndex = SquadPersonIndexEnum.Details;
										this.isNew = true;
										this.onEdit();
									}
								}
							},
							error: (error: Error) => this.error.handleError(error)
						});
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private onSaved() {
		this.refreshClub();
		this.editService.editMode = false;
		this.visible = false;
		this.visibleUnarchive = false;
		this.updated = !this.updated;
		this.notificationService.notify('success', 'Profile', 'alert.recordUpdated', false);
	}

	isPlayerRole(): boolean {
		return !!this.playersChild && this.getRole() === 'Player';
	}

	// actions on selected players

	addSelectedPeople(id: string) {
		const role = this.getRole();
		const people: People[] = this.getPeople(role) as People[];
		const selectedPeople = people.find(dude => getId(dude) === id);
		if (selectedPeople) {
			this.selectedPeople.push(selectedPeople);
		}
	}

	removeSelectedPeople(peopleId: string) {
		this.selectedPeople = this.selectedPeople.filter(dude => getId(dude) !== peopleId);
	}

	resetSelectedPeople() {
		this.selectedPeople = [];
	}

	openMoveSelectedPlayersDialog() {
		this.selectedPlayerNames = this.getSelectedPeopleNames();
		this.moveSelectedPeopleDialogVisible = true;
	}

	closeMoveSelectedPeopleDialog() {
		this.moveSelectedPeopleDialogVisible = false;
		this.selectedPlayerNames = undefined;
	}

	moveSelectedPeople() {
		this.moveSelectedPeopleDialogVisible = false;
		const targetTeamId = getId(this.teamToMoveSelectedPeople);
		const targetTeamSeason = this.teamToMoveSelectedPeople.teamSeasons.find(({ offseason, inseasonEnd }) =>
			moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
		);
		if (targetTeamSeason) {
			const peopleToMoveByTeam: Map<string, People[]> = this.getPeopleByTeam(this.selectedPeople);

			const originTeamSeasons$: Array<Observable<any>> = [];
			const people$: Array<Observable<any>> = [];

			let teamId: string;
			let people: People[];
			const api = this.getApi(this.getRole());
			for ([teamId, people] of peopleToMoveByTeam) {
				const peopleToMoveIds = people.map(dude => getId(dude));
				people$.push(
					api.updateAll(
						{
							teamId,
							id: { inq: peopleToMoveIds }
						},
						{ teamId: targetTeamId }
					)
				);

				// remove moved staff from the seasonal and competitions lineup of the current season of the source team
				const fromTeam = this.allTeams.find(({ id }) => id === teamId);
				const fromSeason = fromTeam.teamSeasons.find(({ offseason, inseasonEnd }) =>
					moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
				);
				if (fromSeason) {
					fromSeason.competitionInfo.forEach((competition: CompetitionInfo) => {
						competition.lineup = pull(competition.lineup, ...peopleToMoveIds);
					});
					originTeamSeasons$.push(
						this.teamSeasonApi.patchAttributes(fromSeason.id, <TeamSeason>{
							playerIds: pull(fromSeason.playerIds, ...peopleToMoveIds),
							staffIds: pull(fromSeason.staffIds, ...peopleToMoveIds),
							competitionInfo: fromSeason.competitionInfo
						})
					);
				}
			}

			// add move players to the seasonal lineup of the current season of the target team
			const targetTeamSeason$ = this.teamSeasonApi.patchAttributes(targetTeamSeason.id, {
				playerIds: uniq([...targetTeamSeason.playerIds, ...this.selectedPeople.map(dude => getId(dude))]).filter(
					x => x
				),
				staffIds: uniq([...targetTeamSeason.staffIds, ...this.selectedPeople.map(dude => getId(dude))]).filter(x => x)
			});

			forkJoin([targetTeamSeason$, ...originTeamSeasons$, ...people$])
				.pipe(first(), untilDestroyed(this))
				.subscribe({
					next: () => {
						this.onSaved();
						this.load();
						this.resetSelectedPeople();
					},
					error: (error: Error) => this.error.handleError(error)
				});
		} else {
			this.notificationService.notify('error', 'error', 'admin.squads.move-to-team.no-season');
		}
	}

	hasActivePeopleSelected() {
		const people = this.getPeople(this.getRole()) as People[];
		return this.selectedPeople.some(({ id }) => {
			const dude = people.find(item => item.id === id);
			return !!dude && !dude.archived;
		});
	}
	hasArchivedPeopleSelected() {
		const people = this.getPeople(this.getRole()) as People[];
		return this.selectedPeople.some(({ id }) => {
			const dude = people.find(item => item.id === id);
			return !!dude && dude.archived;
		});
	}
	hasDeletablePeopleSelected() {
		const people = this.getPeople(this.getRole()) as People[];
		return this.selectedPeople.some(({ id }) => {
			const dude = people.find(item => item.id === id);
			return !!dude && !dude.deleted;
		});
	}

	getSelectedPeopleNames() {
		return this.selectedPeople.map(({ displayName }) => displayName).join(', ');
	}
	setArchivedState(toArchive: boolean) {
		const people = this.selectedPeople.filter(player => player.archived !== toArchive);

		this.isTempPersonType = this.getRole();

		if (people.length > 0) {
			this.bulkAction = true;

			const peopleData = {
				displayName: people.map(({ displayName }) => displayName).join(', '),
				firstName: '',
				lastName: people.map(({ firstName, lastName }) => firstName + ' ' + lastName).join(', '),
				currentStatus: people[0].currentStatus,
				archived: people[0].archived,
				deleted: people[0].deleted,
				archivedDate: people[0].archivedDate,
				archivedMotivation: people[0].archivedMotivation,
				_statusHistory: people[0]._statusHistory,
				teamId: people[0].teamId
			};

			if (toArchive) {
				this.toArchive = peopleData;
			} else {
				this.toActivate = peopleData;
			}

			this.visible = toArchive;
			this.visibleUnarchive = !toArchive;
		}
	}

	deleteSelectedPeople() {
		const people = this.selectedPeople.filter(people => !people.deleted);
		const role: ContractPersonType = this.getRole();
		const names: string[] =
			role === 'Player'
				? people.map(({ displayName }) => displayName)
				: people.map(({ firstName, lastName }) => firstName + ' ' + lastName);
		const askMessage =
			role === 'Player'
				? this.translate.instant('admin.squad.deleteSelectedPeople') + '<br>' + names.join(', ') + '?'
				: 'confirm.deleteAll';
		const successMessage = role === 'Player' ? 'admin.squad.deletePlayerConfirm' : 'alert.recordUpdated';
		this.confirmationService.confirm({
			message: this.translate.instant(askMessage),
			header: 'IterPRO',
			accept: () => {
				const delete$: Observable<any>[] =
					role === 'Player'
						? this.getSetAsDeletedObs(role, this.getPeopleByTeam(people))
						: this.getDeleteByIdObs(
								role,
								people.map(item => getId(item))
							);
				forkJoin(delete$)
					.pipe(first(), untilDestroyed(this))
					.subscribe({
						next: () => {
							this.removePeople(people, role);
							this.notificationService.notify('success', 'Profile', this.translate.instant(successMessage), false);
						},
						error: (error: Error) => this.error.handleError(error)
					});
			}
		});
	}

	private removePeople(people: People[], role: ContractPersonType) {
		switch (role) {
			case 'Player':
				people.forEach((dude: Player) => {
					dude.deleted = true;
					this.checkForPlayerOperation(dude, false);
					this.updateElementAfterPatch(dude, 'delete');
				});
				break;
			case 'Staff':
				people.forEach(dude => {
					this.removeStaffElement(dude);
				});
				break;
			case 'Agent':
				people.forEach(dude => {
					this.removeAgentElement(dude);
				});
		}
	}

	// create stuff

	confirmCreateNewPlayer() {
		this.visibleToSeasonDialog = 'player';
	}

	isPlayerToSeasonDialogVisible(): boolean {
		return this.visibleToSeasonDialog === 'player';
	}

	isThirdPartyToSeasonDialogVisible(): boolean {
		return this.visibleToSeasonDialog === 'thirdparty';
	}

	discardAddNewPlayer() {
		this.visibleToSeasonDialog = 'none';
	}

	confirmCreateNewStaff() {
		this.confirmationService.confirm({
			message: this.translate.instant('admin.squads.staff.confirmCreate'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => this.addNewStaff()
		});
	}

	confirmCreateNewAgent() {
		this.confirmationService.confirm({
			message: this.translate.instant('admin.squads.agent.confirmCreate'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => this.addNewAgent()
		});
	}

	async addThirdPartyPlayers() {
		this.visibleToSeasonDialog = 'none';
		this.blockUI.start();
		this.changeDetectorRef.detectChanges();
		const playersToAdd = await this.wrapPlayerFromThirdParty(
			this.thirdPartyPlayersToAdd,
			this.teamToMoveSelectedPeople
		);
		this.playerApi
			.createMany(playersToAdd)
			.pipe(
				switchMap((players: Player[]) =>
					this.teamSeasonApi
						.updateAttributes(this.seasonToMoveSelectedPlayers.id, {
							...this.seasonToMoveSelectedPlayers,
							playerIds: this.seasonToMoveSelectedPlayers.playerIds
								.concat(players.map(playerId => getId(playerId)))
								.filter(x => x),
							resync: true
						})
						.pipe(
							map((season: TeamSeason) => {
								if (season.id === this.currentTeamService.getCurrentSeason().id) {
									this.currentTeamService.setCurrentSeason(season);
								}
								return players;
							})
						)
				),
				first(),
				untilDestroyed(this)
			)
			.subscribe({
				next: (players: Player[]) => {
					this.players = [...this.players, ...players];
					this.clubAlreadyImportedPlayers = [...this.clubAlreadyImportedPlayers, ...players];
					this.updateAlreadyImportedClubPlayers();
					this.club.players = this.players;
					this.club = cloneDeep(this.club);
					this.notificationService.notify('success', 'admin.squads', 'alert.recordCreated', false);
					if (players.length === 1) {
						this.onSelectPlayer(players[0]);
					}
				},
				error: (error: Error) => this.error.handleError(error),
				complete: () => void this.blockUI.stop()
			});
	}

	async addNewPlayer() {
		this.visibleToSeasonDialog = 'none';
		this.blockUI.start();
		this.changeDetectorRef.detectChanges();
		const allGlobalTests: any[] = await this.testApi
			.find({ where: { teamId: 'GLOBAL' } })
			.pipe(first(), untilDestroyed(this))
			.toPromise();
		let newPlayer: Player;
		let globalTh = [];
		for (const t of allGlobalTests) {
			globalTh = [
				...globalTh,
				...t.customFields.map(field => ({
					id: uuid(),
					name: t.name,
					metric: typeof field === 'string' ? field : field.value,
					value: 1,
					hidden: false
				}))
			];
		}
		const defaultThresholds: Threshold[] = this.etlGpsService.getDefaultThresholds();
		const thresholds = [
			{ name: 'GEN', thresholds: defaultThresholds },
			{ name: 'GD', thresholds: defaultThresholds }
		];
		this.playerApi
			.create({
				teamId: this.teamToMoveSelectedPeople.id,
				clubId: this.auth.getCurrentUserData().clubId,
				birthDate: moment('01/01/1990', 'dd/MM/YYYY').toDate(),
				name: 'player',
				lastName: 'player',
				displayName: 'player',
				_thresholds: thresholds,
				_thresholdsPlayer: [],
				_thresholdsTests: globalTh,
				archived: false,
				_statusHistory: [],
				currentStatus: 'inTeam',
				federalMembership: [],
				sportPassport: [],
				documents: [],
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
				}
			})
			.pipe(
				tap((createdPlayer: Player) => {
					newPlayer = createdPlayer;
				}),
				concatMap((newPlayer: Player) => {
					this.players = [...this.players, newPlayer];
					this.clubAlreadyImportedPlayers = [...this.clubAlreadyImportedPlayers, newPlayer];
					this.updateAlreadyImportedClubPlayers();
					this.club.players = this.players;
					this.club = cloneDeep(this.club);
					this.seasonToMoveSelectedPlayers.playerIds.push(getId(newPlayer));
					this.checkForPlayerOperation(newPlayer, true);
					return this.teamSeasonApi.updateAttributes(
						this.seasonToMoveSelectedPlayers.id,
						this.seasonToMoveSelectedPlayers
					);
				}),
				first(),
				untilDestroyed(this)
			)
			.subscribe({
				next: (season: TeamSeason) => {
					if (season.id === this.currentTeamService.getCurrentSeason().id) {
						this.currentTeamService.setCurrentSeason(season);
					}
					this.onSelectPlayer(newPlayer);
				},
				error: (error: Error) => this.error.handleError(error),
				complete: () => void this.blockUI.stop()
			});
	}

	addNewStaff() {
		let newStaff: Staff;
		this.staffApi
			.create(
				new Staff({
					teamId: this.selectedTeam.id,
					clubId: this.auth.getCurrentUserData().clubId,
					birthDate: moment('01/01/1990', 'dd/MM/YYYY').toDate(),
					firstName: 'firstName',
					lastName: 'lastName',
					position: 'positions.headCoach',
					archived: false,
					_statusHistory: [],
					currentStatus: 'inTeam',
					federalMembership: [],
					documents: [],
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
					}
				})
			)
			.pipe(
				tap((createdStaff: Staff) => {
					newStaff = createdStaff;
				}),
				concatMap((staff: StaffWithDisplayName) => {
					this.staff.push({
						...staff,
						displayName: staff.displayName ? staff.displayName : staff.firstName + ' ' + staff.lastName
					});
					const season = this.currentTeamService.getCurrentSeason();
					const staffIds = uniq([...season.staffIds, getId(staff)]);

					this.club.staff = this.staff;
					this.club = cloneDeep(this.club);
					// TODO: maybe add a modal to ask confirm like players
					return this.teamSeasonApi.patchAttributes(season.id, { staffIds });
				}),
				first(),
				untilDestroyed(this)
			)
			.subscribe({
				next: (season: TeamSeason) => {
					this.currentTeamService.setCurrentSeason(season);
					this.select('Staff', newStaff);
				},
				error: (error: Error) => this.error.handleError(error)
			});
		// }
	}

	addNewAgent() {
		let newAgent: Agent;
		this.agentApi
			.create(
				new Agent({
					teamId: this.selectedTeam.id,
					clubId: this.auth.getCurrentUserData().clubId,
					birthDate: moment('01/01/1990', 'dd/MM/YYYY').toDate(),
					firstName: 'firstName',
					lastName: 'lastName',
					archived: false,
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
					}
				})
			)
			.pipe(
				tap((createdAgent: Agent) => {
					newAgent = createdAgent;
				}),
				first(),
				untilDestroyed(this)
			)
			.subscribe({
				next: (agent: AgentWithDisplayName) => {
					this.agents = [
						...this.agents,
						{ ...agent, displayName: agent.displayName ? agent.displayName : agent.firstName + ' ' + agent.lastName }
					];
					this.club.agents = this.agents;
					this.club = cloneDeep(this.club);
					this.select('Agent', newAgent);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	checkForPlayerFinancialLossGain(player: Player) {
		if (this.areDifferent(this.temp as Player, player)) {
			this.notificationApi
				.checkNotificationForPlayerValue(getId(player))
				.pipe(first(), untilDestroyed(this))
				.subscribe({ error: (error: Error) => this.error.handleError(error) });
		}
	}

	areDifferent(player1: Player, player2: Player): boolean {
		return (
			!!player1 &&
			!!player2 &&
			(player1.value !== player2.value ||
				player1.agentValue !== player2.agentValue ||
				player1.clubValue !== player2.clubValue ||
				player1.transfermarktValue !== player2.transfermarktValue ||
				!player1._thresholdsFinancial.every((thr, i) => isEqual(thr, player2._thresholdsFinancial[i])))
		);
	}

	private checkForPlayerOperation(player: Player, isNew: boolean) {
		let action = null;
		if (isNew) action = 'create';
		else if (player.archived && (!this.temp || (this.temp && !this.temp.archived))) action = 'archived';
		else if (player.deleted && (!this.temp || (this.temp && !this.temp['deleted']))) action = 'deleted';
		if (action) {
			this.notificationApi
				.checkNotificationForPlayerOperation(getId(player), action)
				.pipe(first(), untilDestroyed(this))
				.subscribe({ error: (error: Error) => this.error.handleError(error) });
		}
	}

	// archiviation/activation

	openArchive(e: any, element: People, isPlayer: ContractPersonType) {
		if (element.archived) this.openActivateDialog(e, element, isPlayer);
		else this.openArchiveDialog(e, element, isPlayer);
	}

	openArchiveDialog(e: any, element: People, isPlayer: ContractPersonType) {
		e.stopPropagation();
		this.isTempPersonType = isPlayer;
		this.toArchive = element;
		this.visible = true;
	}

	openActivateDialog(e: any, element: People, isPlayer: ContractPersonType) {
		e.stopPropagation();
		this.isTempPersonType = isPlayer;
		this.toActivate = element;
		this.visibleUnarchive = true;
	}

	onCloseDialog() {
		this.visible = false;
		this.visibleUnarchive = false;
	}

	onSaveArchiviation(element: People) {
		this.saveArchiveStatus(element);
	}

	onSaveActivation(element: People) {
		this.saveArchiveStatus(element, false);
	}

	private saveArchiveStatus(element: People, archive = true) {
		if (this.bulkAction) {
			this.archiveBulkPeople(element, this.isTempPersonType, archive);
		} else {
			this.onPatchPeople({ people: element, redirect: false, archive }, this.isTempPersonType);
		}
	}

	private archiveBulkPeople(peopleParameters: People, role: ContractPersonType, toArchive = true) {
		const propsToSave: object = {
			currentStatus: peopleParameters.currentStatus,
			archived: peopleParameters.archived,
			archivedDate: peopleParameters.archivedDate,
			archivedMotivation: peopleParameters.archivedMotivation,
			_statusHistory: peopleParameters._statusHistory
		};
		const people = this.selectedPeople.filter(player => player.archived !== toArchive);
		const peopleByTeam = this.getPeopleByTeam(people);
		const api = this.getApi(role);

		const update$: Array<Observable<any>> = [];
		let teamId: string;
		let peopleInTeam: People[];
		let where: any;
		for ([teamId, peopleInTeam] of peopleByTeam) {
			where = {
				teamId,
				id: { inq: peopleInTeam.map(dude => getId(dude)) }
			};
			update$.push(api.updateAll(where, propsToSave));
		}

		// if the players are not present in the current team season on activation, add them
		// NB: archived players usually stays in the current team season
		for (const person of people) {
			if (role === 'Player' && !toArchive) {
				this.teamApi
					.getTeamSeasons(person.teamId)
					.pipe(first(), untilDestroyed(this))
					.subscribe({
						next: seasons => {
							const targetTeamSeason = seasons.find(({ offseason, inseasonEnd }) =>
								moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
							);
							const notPresentInCurrentSeason = people.filter(
								personItem =>
									personItem.teamId === person.teamId && !(targetTeamSeason.playerIds || []).includes(getId(personItem))
							);
							let playerIds = [];
							if (notPresentInCurrentSeason.length > 0) {
								playerIds = [
									...targetTeamSeason.playerIds,
									...notPresentInCurrentSeason.map(person => getId(person))
								].filter(x => x);
								update$.push(this.teamSeasonApi.patchAttributes(targetTeamSeason.id, { resync: true, playerIds }));
							}
							this.handleBulkPersonUpdate(update$, person, propsToSave, role, toArchive);
						}
					});
			} else {
				this.handleBulkPersonUpdate(update$, person, propsToSave, role, toArchive);
			}
		}
	}

	private handleBulkPersonUpdate(
		update$: Array<Observable<any>>,
		person: People,
		propsToSave,
		role: ContractPersonType,
		toArchive: boolean
	) {
		forkJoin(update$)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					// update the reference inside this.selectedPeople
					person.archived = toArchive;
					// we lose the reference to this.selectedPeople because we are reassingning value to "person"
					person = { ...person, ...propsToSave };
					if (role === 'Player') {
						this.checkForPlayerOperation(person as Player, false);
					}
					this.updateElementAfterPatch(person, 'archive');
					this.bulkAction = false;
					this.onSaved();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private onPatchPeople(parameters: { people: People; redirect: boolean; archive: boolean }, role: ContractPersonType) {
		const update$ = [];
		const api = this.getApi(role);
		const { people } = parameters;
		const propToSaves: Partial<People> = {
			currentStatus: people.currentStatus,
			archived: people.archived,
			archivedDate: people.archivedDate,
			archivedMotivation: people.archivedMotivation,
			_statusHistory: people._statusHistory
		};

		update$.push(api.patchAttributes(getId(people), propToSaves));
		if (role === 'Player' && !people.archived) {
			this.teamApi
				.getTeamSeasons(people.teamId)
				.pipe(first(), untilDestroyed(this))
				.subscribe({
					next: seasons => {
						const targetTeamSeason = seasons.find(({ offseason, inseasonEnd }) =>
							moment().isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
						);
						let playerIds = [];
						if (!(targetTeamSeason.playerIds || []).includes(getId(people))) {
							playerIds = [...targetTeamSeason.playerIds, getId(people)].filter(x => x);
							update$.push(
								this.teamSeasonApi.patchAttributes(targetTeamSeason.id, {
									resync: true,
									playerIds
								})
							);
						}
						this.handlePersonUpdate(update$, role);
					},
					error: (error: Error) => this.error.handleError(error)
				});
		} else {
			this.handlePersonUpdate(update$, role);
		}
	}

	private handlePersonUpdate(update$: Array<Observable<any>>, role: ContractPersonType) {
		forkJoin(update$)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: ([patchedPeople]: [People]) => {
					if (role === 'Player') {
						this.checkForPlayerOperation(patchedPeople as Player, false);
					}
					this.updateElementAfterPatch(patchedPeople, 'archive');
					this.onSaved();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	// delete

	openDelete(e, element: People, isPlayer: ContractPersonType) {
		e.stopPropagation();
		if (isPlayer === 'Player') {
			this.openDeleteDialog(element);
		} else if (isPlayer === 'Staff') {
			this.openDeleteDialogStaff(element);
		} else {
			this.openDeleteDialogAgent(element);
		}
	}

	private openDeleteDialog(element: People) {
		this.confirmationService.confirm({
			message: !element.deleted
				? this.translate.instant('admin.squad.deletePlayer')
				: this.translate.instant('admin.squad.undeletePlayer'),
			header: 'IterPRO',
			accept: () => {
				this.handleDeleteFlagPlayer(element);
			}
		});
	}

	private handleDeleteFlagPlayer(player) {
		player.deleted = !player.deleted;
		this.playerApi
			.patchAttributes(getId(player), {
				deleted: player.deleted
			})
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (pl: Player) => {
					this.checkForPlayerOperation(player, false);
					this.updateElementAfterPatch(pl, 'delete');
					const key = player.deleted ? 'admin.squad.deletePlayerConfirm' : 'admin.squad.undeletePlayerConfirm';
					this.notificationService.notify('success', 'Profile', key, false);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private updateElementAfterPatch(element: People, type: 'delete' | 'archive') {
		const people = this.getPeople(this.getRole());
		const i = people.findIndex(({ id }) => id === getId(element));
		if (i > -1) {
			if (type === 'delete') {
				people[i] = {
					...people[i],
					deleted: element.deleted
				};
			} else {
				people[i] = {
					...people[i],
					archived: element.archived,
					archivedDate: element.archivedDate,
					archivedMotivation: element.archivedMotivation
				};
			}
		}
	}

	private openDeleteDialogStaff(element: People) {
		this.confirmationService.confirm({
			message: this.translate.instant('admin.squad.deleteStaff'),
			header: 'IterPRO',
			accept: () => {
				this.handleDeleteStaff(element);
			}
		});
	}

	private handleDeleteStaff(singleStaff: People) {
		this.staffApi
			.deleteById(getId(singleStaff))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					const key = 'admin.squad.deleteStaffConfirm';
					this.notificationService.notify('success', 'Profile', key, false);
					this.removeStaffElement(singleStaff);
					this.refreshClub();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private removeStaffElement(singleStaff: People) {
		this.staff = this.staff.filter(staffItem => getId(staffItem) !== getId(singleStaff));
		this.club.staff = this.staff;
		this.club = cloneDeep(this.club);
	}

	private openDeleteDialogAgent(element: People) {
		this.confirmationService.confirm({
			message: this.translate.instant('admin.squad.deleteAgent'),
			header: 'IterPRO',
			accept: () => {
				this.handleDeleteAgent(element);
			}
		});
	}

	private handleDeleteAgent(element: People) {
		this.agentApi
			.deleteById(getId(element))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					const key = 'admin.squad.deleteAgentConfirm';
					this.notificationService.notify('success', 'Profile', key, false);
					this.removeAgentElement(element);
					this.refreshClub();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private removeAgentElement(element: People) {
		this.agents = this.agents.filter(agentItem => getId(agentItem) !== getId(agentItem));
		this.club.agents = this.agents;
		this.club = cloneDeep(this.club);
	}

	onTabChange(event) {
		this.activeIndex = event.index;
	}

	// player list for mobile app

	hasPlayerApp(): boolean {
		const customer = this.auth.getCurrentUserData();
		const currentTeam = this.currentTeamService.getCurrentTeam();
		return customer.admin && currentTeam.playerApp;
	}

	openPlayerAppDialog() {
		this.playerAppDialog = true;
	}

	onClosePlayerAppDialog(player?: Player) {
		this.playerAppDialog = false;
		if (player) this.onSelectPlayer(player);
	}

	onDownloadCredentials() {
		// const filteredPlayers = this.players
		// 	.filter(x => x.displayName && !x.archived)
		// 	.map(x => ({ username: x.displayName, password: getId(x) }));
		// const fileName = 'playersApp.csv';
		// const results = Papa.unparse(filteredPlayers, {});
		// const blob = new Blob([results], { type: 'text/plain' });
		// saveAs(blob, fileName);
	}

	// wyscout

	openThirdPartySearchDialog() {
		this.thirdPartyPlayerSearchDialogVisible = true;
	}

	onDiscardThirdPartySearchDialog() {
		this.thirdPartyPlayerSearchDialogVisible = false;
	}

	// NB: implement the dedicated select handler for each provider
	onSelectThirdPartySearchDialog(thirdPartyPlayers: any[]) {
		this.thirdPartyPlayerSearchDialogVisible = false;
		const incompletePlayers = thirdPartyPlayers.filter(({ transferValue, img }) => !transferValue || !img);
		if (incompletePlayers.length > 0) {
			this.blockUI.start();
			this.providerIntegrationService
				.getPlayerAdditionalInfo(incompletePlayers)
				.pipe(first(), untilDestroyed(this))
				.subscribe({
					next: ({ players = [] }: { players: any[] }) => {
						players.forEach((info: any) => {
							const i = thirdPartyPlayers.findIndex(
								({ wyId, instId }) => wyId || instId === info[this.etlPlayerService.getProviderIdField()]
							);
							assign(thirdPartyPlayers[i], info);
						});
						this.completeSelectThirdPartySearchDialog(thirdPartyPlayers);
					},
					error: (error: Error) => this.error.handleError(error),
					complete: () => void this.blockUI.stop()
				});
		} else {
			this.completeSelectThirdPartySearchDialog(thirdPartyPlayers);
		}
	}

	private completeSelectThirdPartySearchDialog(thirdPartyPlayers: any[] = []) {
		if (thirdPartyPlayers.length > 0) {
			this.visibleToSeasonDialog = 'thirdparty';
			this.thirdPartyPlayersToAdd = thirdPartyPlayers;
		}
	}

	// NOTE: implement for each provider -> then move to a general service
	private async wrapPlayerFromThirdParty(thirdPartyPlayers: any[], team: Team) {
		const allGlobalTests: any[] = await this.testApi.find({ where: { teamId: 'GLOBAL' } }).toPromise();
		const globalTh = allGlobalTests.reduce(
			(accumulator, test) =>
				accumulator.concat(
					test.customFields.map(field => ({
						id: uuid(),
						name: test.name,
						metric: typeof field === 'string' ? field : field.value,
						value: 1,
						hidden: false
					}))
				),
			[]
		);

		const playersToAdd = [];
		for (const thirdPartyPlayer of thirdPartyPlayers) {
			const defaultThresholds: Threshold[] = this.etlGpsService.getDefaultThresholds();
			const _thresholds = [
				{ name: 'GEN', thresholds: defaultThresholds },
				{ name: 'GD', thresholds: defaultThresholds }
			];

			const providerIdField = this.etlPlayerService.getProviderIdField();
			const providerPlayerTeamIdField = this.etlPlayerService.getProviderTeamIdField();
			const providerPlayerSecondaryTeamIdField = this.etlPlayerService.getProviderSecondaryTeamIdField();

			const thirdPartyTeamId = team[providerIdField] ? team[providerIdField] : null;
			const thirdPartySecondaryTeamId = thirdPartyTeamId
				? thirdPartyTeamId === thirdPartyPlayer.currentTeamId
					? thirdPartyPlayer.currentNationalTeamId
					: thirdPartyPlayer.currentTeamId
				: null;

			const player = new Player({
				archived: false,
				clubId: this.auth.getCurrentUserData().clubId,
				teamId: team.id,
				downloadUrl: thirdPartyPlayer.img,
				name: thirdPartyPlayer.firstName,
				lastName: thirdPartyPlayer.lastName,
				displayName: thirdPartyPlayer.shortName,
				birthDate: thirdPartyPlayer.birthDate,
				nationality: thirdPartyPlayer?.birthArea?.alpha2code,
				altNationality: thirdPartyPlayer.passport ? thirdPartyPlayer.passport.alpha2code : null,
				foot: thirdPartyPlayer.foot,
				gender: thirdPartyPlayer.gender,
				height: thirdPartyPlayer.height,
				weight: thirdPartyPlayer.weight,
				position: thirdPartyPlayer.role.code2,
				clubValue: thirdPartyPlayer.transferValue,
				valueField: 'clubValue',
				federalMembership: [],
				sportPassport: [],
				documents: [],
				_thresholds,
				_thresholdsPlayer: [],
				_thresholdsTests: globalTh,
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
				}
			});
			player[providerIdField] = this.providerIntegrationService.getPlayerThirdPartyId(thirdPartyPlayer);
			player[providerPlayerTeamIdField] = thirdPartyTeamId;
			player[providerPlayerSecondaryTeamIdField] = thirdPartySecondaryTeamId;
			if (player.downloadUrl && !player.downloadUrl.includes('https://')) {
				const { url, filename } = await this.getProfileImageProperties(player);
				player.downloadUrl = url;
				player.profilePhotoUrl = url;
				player.profilePhotoName = filename;
			}
			playersToAdd.push(player);
		}

		return playersToAdd;
	}

	async getProfileImageProperties(player) {
		const newFilename = uuid();
		const file = this.imageDownloadService.dataURItoFilename(player.downloadUrl, newFilename);
		const res = await this.azureDownloadUploadService.uploadBrowserFileToAzureStore(file);
		return { filename: newFilename, url: res };
	}

	// report and csv

	getReport() {
		this.childTabs.getReport();
	}

	downloadPdf() {
		if (this.getRole() === 'Player') {
			this.downloadPlayersPdf();
		} else {
			this.downloadStaffOrAgentPdf();
		}
	}

	downloadCsv() {
		if (this.getRole() === 'Player') {
			this.downloadPlayersCsv();
		} else {
			this.downloadStaffOrAgentCsv();
		}
	}

	private downloadPlayersPdf() {
		this.squadsService
			.getSquadPeople(this.club, 'Player', { ...this.pageInfo, page: -1 })
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: ({ people }) => {
					const source = this.convertToTable(people as Player[]);
					const table = {
						...source,
						rows: source.rows.map(({ cells }) =>
							cells.map(cell => {
								const reportRawValue = source.headers.some(
									({ header }) => header.field === cell.field && !!header.pdfRaw
								);
								return { ...cell, value: reportRawValue ? cell.raw : cell.value };
							})
						)
					};
					const title = this.club.name;
					this.reportService.getReport('admin_squad_2', { title, table });
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private downloadStaffOrAgentPdf() {
		const playersTable = this.playersChild.getTable();
		const table = {
			...playersTable,
			rows: playersTable.rows.map(row => row.cells)
		};
		const title = this.club.name;

		this.reportService.getReport('admin_squad_2', { title, table });
	}

	private downloadPlayersCsv() {
		this.squadsService
			.getSquadPeople(this.club, 'Player', { ...this.pageInfo, page: -1 })
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: ({ people }) => {
					const table = this.convertToTable(people as Player[]);
					const playersCsv = this.playersService.toCSV(table);
					const results = Papa.unparse(playersCsv, {});
					const fileName = 'squadPlayers.csv';
					const contentDispositionHeader = 'Content-Disposition: attachment; filename=' + fileName;
					const blob = new Blob([results], { type: 'text/plain' });
					saveAs(blob, fileName);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private downloadStaffOrAgentCsv() {
		const playersCsv = this.playersChild.getCSV();
		const results = Papa.unparse(playersCsv, {});
		const fileName = 'squadPlayers.csv';
		const contentDispositionHeader = 'Content-Disposition: attachment; filename=' + fileName;
		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	/**
	 * Purpose : on csv doenload the salary and marketValue field should not
	 * be displayed with currency symbol and no suffix in short number format , instead
	 * the value should be displayed in full form big number.
	 * Exmaple : '<currency>1.5M' should be displayed as '1500000'
	 */
	getBigNumber(val) {
		let bigNumber = 0;
		const midVal = val ? val.slice(1, val.length - 1) : 0;
		const suffix = val ? val.slice(val.length - 1, val.length) : '';

		if (suffix === 'k' || suffix === 'K') {
			bigNumber = midVal * 1000;
		} else if (suffix === 'm' || suffix === 'M') {
			bigNumber = midVal * 1000000;
		} else if (suffix === 'b' || suffix === 'B') {
			bigNumber = midVal * 1000000000;
		} else if (suffix === 't' || suffix === 'T') {
			bigNumber = midVal * 1000000000000;
		}
		return bigNumber;
	}

	/**
	 * Called when 'Download Empty Csv' button is clicked.
	 * Allowing user to download an empty CSV file.
	 */
	downloadEmptyCsv() {
		const lang: string = this.auth.getCurrentUserData().currentLanguage;
		const url = `${environment.CDN_URL}/samples/${lang}/sample.csv`;
		window.open(url, '_blank');
	}

	/**
	 * Purpose : Creating player object for each file uploaded player.
	 * Pre-requisite
	 *  => the date format in CSV file should be as "DD/MM/YYYY or DD-MM-YYYY"
	 *  => In player object creation, teamId is required field for validation process on server.
	 *  => The true and false in CSV can be both "true"/"false" or true/false
	 */
	fileChanged(e) {
		this.bulkPeopleTable = undefined;
		this.fileReader = new FileReader();

		// Reading from uploaded file.
		this.fileReader.onload = () => {
			this.correctBulkPlayerUpload = undefined;
			this.errorsPerPageBulkPlayer = [];
			const csvRead = this.fileReader.result;
			const resultsCsv = Papa.parse(csvRead.toString(), {
				header: true,
				skipEmptyLines: true
			});

			const defaultThresholds: Threshold[] = this.etlGpsService.getDefaultThresholds();

			const columnNames: CsvColumnNames = this.csvColumnNamesService.getColumnNames();
			if (this.importBulkPlayersCsv.csvIsValid(resultsCsv.data, columnNames)) {
				this.importBulkPlayersCsv
					.csvToPlayerTable(resultsCsv.data, columnNames, defaultThresholds)
					.pipe(first())
					.subscribe({
						next: bulkPlayerTable => {
							this.myInput.nativeElement.value = '';
							this.bulkPeopleTable = bulkPlayerTable;
						},
						error: (error: Error) => this.error.handleError(error)
					});
			} else {
				this.notificationService.notify('error', 'error', 'import.feedbacks.errorCSV.header');
			}
		};
		// Error handling for file reader
		this.fileReader.onerror = ev => {
			// eslint-disable-next-line no-console
			console.error(ev);
			this.notificationService.notify('error', 'error', 'import.feedbacks.errorCSV');
		};
		// Reading first file uploaded.
		this.fileReader.readAsText(e.target.files[0]);
	}

	updateBulkPlayerImportStatus(formStatus: FormStatus) {
		this.correctBulkPlayerUpload = formStatus;
	}

	discardCsvUploadedPlayers() {
		this.bulkPeopleTable = undefined;
	}

	// Updating DB for newly file uploaded players
	updateCsvUplodedPlayers() {
		const defaultThresholds: Threshold[] = this.etlGpsService.getDefaultThresholds();
		const bulkPlayers = this.importBulkPlayersCsv.rawDataToPlayer(
			this.correctBulkPlayerUpload.value,
			defaultThresholds
		);

		const splitRequest = splitArrayInChunks<Player>(bulkPlayers, 100);
		forkJoin(splitRequest.map(req => this.playerApi.createMany(req).pipe(first())))
			.pipe(
				map(players => [].concat(...players)),
				first(),
				untilDestroyed(this)
			)
			.subscribe({
				next: (players: Player[]) => {
					this.players = [...this.players, ...players];
					this.clubAlreadyImportedPlayers = [...this.clubAlreadyImportedPlayers, ...players];
					this.updateAlreadyImportedClubPlayers();
					this.club.players = this.players;
					this.club = cloneDeep(this.club);
					this.confirmAddToCurrentSeason(
						players.filter(player => !player.archived),
						this.translate.instant('confirm.addBulkToCurrentSeason')
					);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private confirmAddToCurrentSeason(players: Player[], message: string, close = true) {
		this.confirmationService.confirm({
			message,
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				const currentSeason = this.currentTeamService.getCurrentSeason();
				const playerIds = [...currentSeason.playerIds, ...players.map(player => getId(player))].filter(x => x);
				this.teamSeasonApi
					.updateAttributes(currentSeason.id, { ...currentSeason, playerIds, resync: true })
					.pipe(first(), untilDestroyed(this))
					.subscribe({
						next: (season: TeamSeason) => {
							// Update UI as well after upload file action success.
							this.currentTeamService.setCurrentSeason(season);
							// Notify user that uploaded players are created successfully
							this.notificationService.notify('success', 'admin.squads', 'alert.recordCreated', false);
							if (close) {
								this.closeAddToCurrentSeason();
							}
						},
						error: (error: Error) => this.error.handleError(error)
					});
			},
			reject: () => {
				if (close) {
					this.closeAddToCurrentSeason();
				}
			}
		});
	}

	private closeAddToCurrentSeason() {
		this.editService.editMode = false;
		this.visible = false;
		this.visibleUnarchive = false;
		this.updated = !this.updated;
		this.bulkPeopleTable = undefined;
	}

	showBulkPlayerImportErrorPerPage(errorsPerPage: number[]) {
		this.errorsPerPageBulkPlayer = errorsPerPage;
	}
	setCurrentPageBulkPlayerImport(currentPage: number) {
		this.currentPageBulkPlayer = currentPage;
	}

	totalBulkErrors(errorsPerPage: number[]) {
		return errorsPerPage.reduce((accumulator, value) => accumulator + value, 0);
	}

	onRemoveFromSeasonTrigger(event) {
		this.changeTeamSettings = event;
	}

	private convertToTable(players: Player[]) {
		const columns = adminColumns.filter(c => this.playersChild.getCellVisibility(c.field)).map(column => column.field);
		const table = this.playersService.toTable({ people: players }, [...columns, ...alwaysVisible], this.club);
		return table;
	}

	private getSetAsDeletedObs(role: ContractPersonType, peopleByTeam: Map<string, People[]>): Observable<any>[] {
		// currently only used for Players
		const api = this.getApi(role);
		const delete$: Observable<any>[] = [];
		let teamId: string;
		let peopleInTeam: People[];
		let where: any;
		for ([teamId, peopleInTeam] of peopleByTeam) {
			where = {
				teamId,
				id: { inq: peopleInTeam.map(dude => getId(dude)) }
			};
			delete$.push(api.updateAll(where, { deleted: true }));
		}
		return delete$;
	}
	private getDeleteByIdObs(role: ContractPersonType, ids: string[]): Observable<any>[] {
		// currently only Agents and Staffs
		return ids.map(id => this.getApi(role).deleteById(id));
	}
	private getApi(role: ContractPersonType): PlayerApi | StaffApi | AgentApi {
		const apis = { player: this.playerApi, staff: this.staffApi, agent: this.agentApi };
		return apis[role.toLowerCase()];
	}
	getRole(): ContractPersonType {
		if (this.idStaffParam) return 'Staff';
		return !!this.playersChild && this.playersChild.filters && this.playersChild.filters.role
			? (this.playersChild.filters.role as ContractPersonType)
			: 'Player';
	}

	private getPeople(role: ContractPersonType) {
		switch (role) {
			case 'Player':
				return this.players;
			case 'Staff':
				return this.staff;
			case 'Agent':
				return this.agents;
		}
	}
	private getPeopleByTeam(people: People[]): Map<string, People[]> {
		const peopleByTeam: Map<string, People[]> = new Map<string, People[]>();

		people.forEach(dude => {
			if (!peopleByTeam.has(dude.teamId)) {
				peopleByTeam.set(dude.teamId, []);
			}
			peopleByTeam.get(dude.teamId).push(dude);
		});
		return peopleByTeam;
	}

	private updatePageInfo(info: SquadPlayersPageInfo) {
		this.bulkAction = false;
		this.totalPeopleRows = undefined;
		const availableFilter = this.pageInfo ? this.pageInfo.filter : undefined;
		const { filter } = info;
		this.pageInfo = {
			...this.pageInfo,
			...info,
			filter: { ...availableFilter, ...filter }
		};
	}

	private getRoleQuery(): Observable<any> {
		const roleToQuery = this.getRole();
		switch (roleToQuery) {
			case 'Staff': {
				return this.getStaff();
			}
			case 'Agent': {
				return of(true);
			}
			case 'Player':
			default: {
				return this.getPlayers();
			}
		}
	}

	private getStaff() {
		return this.squadsService.getSquadPeople(this.club, 'Staff', this.pageInfo, this.idParam).pipe(
			map(({ people, totalRows }) => {
				this.staff = people as Staff[];
				this.totalPeopleRows = totalRows;
				return this.staff;
			})
		);
	}

	private getAgents() {
		return this.squadsService.getAgents().pipe(
			map((agents: Agent[]) => {
				const extendedAgents = (agents || []).map((dude: AgentWithDisplayName) => ({
					...dude,
					displayName: dude.displayName ? dude.displayName : dude.firstName + ' ' + dude.lastName
				}));
				this.agents = extendedAgents;
				return this.agents;
			})
		);
	}

	private getPlayers() {
		return this.squadsService.getSquadPeople(this.club, 'Player', this.pageInfo, this.idParam).pipe(
			map(({ people, totalRows }) => {
				this.setSquadPlayersResult(people as Player[], totalRows);
				return people;
			})
		);
	}

	private updateAlreadyImportedClubPlayers() {
		if (this.provider !== 'Dynamic') {
			const providerIdField = this.etlPlayerService.getProviderIdField();
			this.alreadyImportedPlayers = uniq(
				this.clubAlreadyImportedPlayers
					.map(({ [providerIdField]: providerId, teamId }) => ({
						providerId,
						teamName: this.allTeams.find(({ id }) => id === teamId)?.name
					}))
					.filter(({ providerId }) => providerId)
			);
		}
	}

	private getCustomers() {
		return this.squadsService.getCustomers().pipe(
			first(),
			untilDestroyed(this),
			map((customers: Customer[]) => {
				this.customers = customers;
			})
		);
	}

	private getClub() {
		return this.squadsService.getClub().pipe(
			first(),
			untilDestroyed(this),
			map((club: Club) => {
				this.allTeams = club.teams.map(team => ({
					...team,
					teamSeasons: sortByDateDesc(team?.teamSeasons || [], 'inseasonEnd')
				}));
				this.selectedTeam = this.allTeams.find(team => getId(team) === this.auth.getCurrentUserData().currentTeamId);
				this.selectedSeason = this.currentTeamService.getCurrentSeason();
				return club;
			})
		);
	}

	private getSeasonInfo(): { seasonName: string; teamName: string } {
		return {
			seasonName: this.currentTeamService.getCurrentSeason().name,
			teamName: this.selectedTeam.name
		};
	}

	reachedMaxActivePlayers(): boolean {
		return this.selectedTeam
			? !this.selectedTeam.activePlayersLimit
				? false
				: this.currentActivePlayersNumbers >= this.selectedTeam.activePlayersLimit
			: null;
	}

	reachedMaxArchivedPlayers(): boolean {
		return this.selectedTeam
			? !this.selectedTeam.archivedPlayersLimit
				? false
				: this.currentArchivedPlayersNumbers >= this.selectedTeam.archivedPlayersLimit
			: null;
	}

	getThirdPartyPlayersAddTitle(): string {
		const baseLabel = this.translate.instant('scouting.addPlayers');
		return (
			baseLabel +
			': ' +
			(this.thirdPartyPlayersToAdd || []).map(({ firstName, lastName }) => `${firstName} ${lastName}`).join(', ')
		);
	}

	isEditableSection(): boolean {
		switch (this.personType) {
			case 'Agent':
			case 'Staff':
				return this.activeIndex === 0;
			case 'Player':
				return this.activeIndex === 0 || this.activeIndex === 2 || this.activeIndex === 4;
			default:
				console.error('Invalid person type: ' + this.personType);
				return false;
		}
	}
}

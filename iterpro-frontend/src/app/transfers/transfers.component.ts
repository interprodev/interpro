import { Component, HostListener, Injector, OnInit, inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { DrillStatsViews } from '@iterpro/manager/drills/stats/data-access';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Agent,
	AgentApi,
	AgentWithDisplayName,
	AlreadyImportedPlayer,
	Club,
	ClubApi,
	ClubSeason,
	ClubTransfer,
	ClubTransferApi,
	EmploymentContract,
	LoopBackAuth,
	NotificationApi,
	Player,
	PlayerScouting,
	PlayerScoutingApi,
	PlayerTransfer,
	SquadPersonIndexEnum,
	Team,
	TeamSeason,
	TeamSeasonApi,
	Test,
	TestApi,
	Threshold,
	TransferContract,
	TransferWindowItem
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	AzureStorageService,
	BlockUiInterceptorService,
	EditModeService,
	ErrorService,
	ImageService,
	ProviderIntegrationService,
	SportType,
	getActiveEmploymentContract,
	getActiveTransferContract,
	sortByDate,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, isEmpty } from 'lodash';
import { ConfirmationService, SelectItem, SelectItemGroup } from 'primeng/api';
import { AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { Observable, Observer, forkJoin, of } from 'rxjs';
import {
	concatMap,
	debounceTime,
	defaultIfEmpty,
	distinctUntilChanged,
	filter,
	first,
	map,
	switchMap
} from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { ContractService } from './../squads/squads-person/squads-person-legal/services/contract.service';
import { TransferDropdownElement, TransferType, TransfersBreakdown } from './shared/interfaces/transfers.interface';
import { TransfersService } from './shared/services/transfers.service';

type TransferAction = 'buy' | 'sell' | 'delete';

@UntilDestroy()
@Component({
	selector: 'iterpro-transfers',
	templateUrl: './transfers.component.html',
	styleUrls: ['./transfers.component.css']
})
export class TransfersComponent extends EtlBaseInjectable implements OnInit {
	/** Services */
	readonly #transfersService = inject(TransfersService);

	/** Data */
	clubTransfers$: Observable<ClubTransfer> | null = null;
	transfersBreakdown: TransfersBreakdown;
	purchases: ClubTransfer[] = [];
	sales: ClubTransfer[] = [];

	clubSeasons: ClubSeason[] = [];
	selectedTransferPlayer: PlayerTransfer;
	clubTransfers: ClubTransfer[] = [];
	teams: {
		name: string;
		players: Player[];
	}[];
	selectedTeam: Team;
	seasons: ClubSeason[];
	tempPlayer: PlayerTransfer;
	isNew: boolean;
	activeIndex: SquadPersonIndexEnum = SquadPersonIndexEnum.Overview;
	squadPersonIndexEnums = SquadPersonIndexEnum;
	teamPlayers: Player[];
	scoutingPlayers: PlayerScouting[];
	transferActionModal: {
		action: TransferAction;
		outward?: TransferContract;
		employmentContract?: EmploymentContract;
	};
	changePlayerStatusDialogVisibility = false;
	transferTeams: SelectItem[];
	selectedTransferTeam: Team;
	loanOptionItems: SelectItem[];
	selectedClubTransfer: ClubTransfer;
	agents: Agent[] = [];
	originalPlayers: Player[];
	originalScoutings: PlayerScouting[];
	selectedKanban: TransferType = 'sales';
	alreadyImportedPlayers: AlreadyImportedPlayer[] = [];
	club: Club;
	transferWindowId: string;
	clubSeasonId: string;
	deletedTransferContract: boolean;
	originalTeams: Team[];
	window: TransferWindowItem;
	clubSeasonsOptions: SelectItemGroup[];
	transferWindow: TransferWindowItem;
	currency: string;
	isUpdatingPlayerStatus = false;
	searchDropdownElements: TransferDropdownElement[];
	sportType: SportType;

	private readonly clubId: string;
	thirdPartyClubs: SelectItem[] = [];
	selectedClub: SelectItem;
	constructor(
		private testApi: TestApi,
		private clubApi: ClubApi,
		private agentApi: AgentApi,
		private auth: LoopBackAuth,
		private error: ErrorService,
		public editService: EditModeService,
		private seasonApi: TeamSeasonApi,
		private translate: TranslateService,
		private contractService: ContractService,
		private clubTransferApi: ClubTransferApi,
		private notificationApi: NotificationApi,
		private notificationService: AlertService,
		private imageDownloadService: ImageService,
		private playersScoutingApi: PlayerScoutingApi,
		private currentTeamService: CurrentTeamService,
		private confirmationService: ConfirmationService,
		private azureDownloadUploadService: AzureStorageService,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private providerIntegrationService: ProviderIntegrationService,
		injector: Injector
	) {
		super(injector);
		this.clubId = this.auth.getCurrentUserData().clubId;
	}

	ngOnInit() {
		this.initComponentData();
	}

	private initComponentData() {
		forkJoin([
			this.clubApi.findById(this.clubId, {
				include: [
					{
						relation: 'clubSeasons'
					},
					{
						relation: 'teams',
						scope: {
							fields: ['name', 'id']
						}
					},
					{
						relation: 'players',
						scope: {
							where: { archived: false },
							fields: [
								'wyscoutId',
								'gpexeId',
								'catapultId',
								'fieldwizId',
								'sonraId',
								'statsportId',
								'wimuId',
								'name',
								'lastName',
								'displayName',
								'profilePhotoName',
								'profilePhotoUrl',
								'downloadUrl',
								'gender',
								'nationality',
								'altNationality',
								'passport',
								'altPassport',
								'shoeSize',
								'captain',
								'inTeamFrom',
								'inTeamTo',
								'facebook',
								'twitter',
								'instagram',
								'linkedin',
								'snapchat',
								'mobilePhone',
								'otherMobile',
								'education',
								'school',
								'birthDate',
								'birthPlace',
								'weight',
								'height',
								'position',
								'role1',
								'position2',
								'role2',
								'position3',
								'role3',
								'foot',
								'jersey',
								'valueField',
								'value',
								'transfermarktValue',
								'clubValue',
								'agentValue',
								'wage',
								'contractStart',
								'contractEnd',
								'phone',
								'email',
								'address',
								'domicile',
								'botId',
								'botMessageUrl',
								'anamnesys',
								'archived',
								'archivedDate',
								'currentStatus',
								'statusDetails',
								'documents',
								'nationalityOrigin',
								'fiscalIssue',
								'ageGroup',
								'biography',
								'federalId',
								'federalMembership',
								'sportPassport',
								'maritalStatus',
								'_statusHistory',
								'deleted',
								'bankAccount',
								'firstFederalMembership',
								'id',
								'teamId',
								'_thresholdsFinancial',
								'clubId',
								'_pastValues',
								'_pastTransfermarktValues',
								'_pastAgentValues',
								'_pastClubValues'
							]
						}
					}
				]
			}),
			this.playersScoutingApi.find({
				where: {
					clubId: this.clubId,
					archived: false
				}
			}),
			this.agentApi.find({
				where: { teamId: this.auth.getCurrentUserData().currentTeamId }
			}),
			this.seasonApi.find({
				where: { teamId: this.auth.getCurrentUserData().currentTeamId },
				order: 'offseason ASC'
			})
		])
			.pipe(untilDestroyed(this))
			.subscribe({
				next: ([club, scoutingPlayers, agents, seasons]: [
					Club,
					PlayerScouting[],
					AgentWithDisplayName[],
					TeamSeason[]
				]) => {
					this.club = club;
					this.sportType = this.club.sportType as SportType;
					this.clubSeasons = this.club.clubSeasons;
					this.transferTeams = this.club.teams.map(team => ({ label: team.name, value: team }));
					this.originalPlayers = this.club.players;
					this.originalTeams = this.club.teams;
					this.originalScoutings = scoutingPlayers;
					this.agents = (agents || []).map((dude: AgentWithDisplayName) => ({
						...dude,
						displayName: dude.displayName ? dude.displayName : dude.firstName + ' ' + dude.lastName
					}));
					this.seasons = sortByDate(seasons, 'offseason').reverse();
					this.loanOptionItems = [
						{
							label: this.translate.instant('admin.contract.option.none'),
							value: 'none'
						},
						{
							label: this.translate.instant('admin.contract.option.right'),
							value: 'right'
						},
						{
							label: this.translate.instant('admin.contract.option.obligation'),
							value: 'obligation'
						}
					];
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	handleTransferWindowSelection(event?: TransferWindowItem) {
		this.transferWindow = event;
		if (event.clubSeasonId && event.transferWindowId) {
			this.transferWindowId = event.transferWindowId;
			this.clubSeasonId = event.clubSeasonId;
		} else {
			this.transferWindowId = null;
			this.clubSeasonId = null;
		}
		this.getTransfers();
	}

	public getTransfers() {
		this.#transfersService
			.getTransfers(this.club, this.transferWindow)
			.pipe(
				untilDestroyed(this),
				defaultIfEmpty([]),
				switchMap((transfers: ClubTransfer[]) => {
					this.clubTransfers = (transfers || []).filter(({ player }) => !!player);
					this.filterDropdownElements();
					this.scaffoldTransfers(this.clubTransfers);

					if (this.selectedClubTransfer) {
						this.onSelect(this.selectedClubTransfer.id);
					}

					return this.#transfersService.getTransferBalance(this.club.id, this.transferWindow.transferWindowId);
				})
			)
			.subscribe((breakdown: TransfersBreakdown) => (this.transfersBreakdown = breakdown));
	}

	private filterDropdownElements() {
		this.teamPlayers = this.originalPlayers.filter(
			({ id }) =>
				!this.clubTransfers
					.filter(({ isPurchase }) => isPurchase)
					.map(({ player }) => player.id)
					.includes(id)
		);
		this.scoutingPlayers = this.originalScoutings.filter(
			({ id }) =>
				!this.clubTransfers
					.filter(({ isPurchase }) => isPurchase)
					.map(({ player }) => player.id)
					.includes(id)
		);
		this.teams = this.originalTeams.map(({ name, id }) => ({
			name: name,
			players: sortByName(
				this.teamPlayers.filter(({ teamId }) => teamId === id),
				'displayName'
			)
		}));
	}

	onAddDeal() {
		this.onSaved();
	}

	private scaffoldTransfers(transfers: ClubTransfer[]) {
		this.purchases = [...transfers.filter(({ isPurchase }) => isPurchase)];
		this.sales = [...transfers.filter(({ isPurchase }) => !isPurchase)];
	}

	onBack() {
		this.selectedTransferPlayer = null;
		this.selectedClubTransfer = null;
		this.activeIndex = SquadPersonIndexEnum.Overview;
		this.filterDropdownElements();
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

	onEdit() {
		if (this.selectedTransferPlayer) this.tempPlayer = cloneDeep(this.selectedTransferPlayer);
		this.editService.editMode = true;
	}

	onDiscard() {
		if (this.selectedTransferPlayer) this.selectedTransferPlayer = cloneDeep(this.tempPlayer);
		this.tempPlayer = null;
		this.editService.editMode = false;
	}

	private saveClubTransfer() {
		const clubTransferToSave: ClubTransfer = cloneDeep(this.selectedClubTransfer);
		delete clubTransferToSave?.player;
		this.clubTransferApi
			.updateAttributes(this.selectedClubTransfer.id, clubTransferToSave)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (response: ClubTransfer) => {
					this.onSaved();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private savePlayerTransfer() {
		const playerTransferToSave: PlayerTransfer = cloneDeep(this.selectedTransferPlayer);
		this.clubTransferApi
			.updatePlayer(this.selectedClubTransfer.id, playerTransferToSave)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (response: PlayerTransfer) => {
					this.onSaved();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private onSaved() {
		this.notificationService.notify('success', 'Profile', 'alert.recordUpdated', false);
		this.editService.editMode = false;
		this.changePlayerStatusDialogVisibility = false;
		this.getTransfers();
	}

	confirmEdit(f?: NgForm) {
		if (f && !f.valid) {
			if (this.selectedTransferPlayer) f.controls.personStatus.markAsTouched();
			f.controls.duration_from.markAsTouched();
			f.controls.duration_to.markAsTouched();
		} else {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.edit'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					if (this.activeIndex === SquadPersonIndexEnum.Overview) {
						this.saveClubTransfer();
					} else {
						this.savePlayerTransfer();
					}
				}
			});
		}
	}

	onTabChange(event: { index: number }) {
		this.activeIndex = event.index;
	}

	onTransferAction(event: TransferAction) {
		this.transferActionModal = {
			action: event,
			outward: event === 'sell' ? getActiveTransferContract(this.selectedTransferPlayer, 'outward') : null,
			employmentContract: event === 'sell' ? getActiveEmploymentContract(this.selectedTransferPlayer) : null
		};
		this.mapPersistedClub();
		this.changePlayerStatusDialogVisibility = true;
	}

	closeDialog() {
		this.changePlayerStatusDialogVisibility = false;
		this.transferActionModal = null;
		this.selectedTransferTeam = null;
		this.isUpdatingPlayerStatus = false;
	}

	private checkForNotificationSellBuy(idTransfer: string, idPlayer: string) {
		this.notificationApi
			.checkNotificationForPlayerTransfer(idTransfer, false, ' ')
			.pipe(untilDestroyed(this))
			.subscribe(
				(res: any) => {},
				(error: Error) => this.error.handleError(error)
			);
	}

	async confirmDialog(action: TransferAction) {
		const player: PlayerTransfer = this.selectedTransferPlayer;
		delete player['sell'];
		let observable: Observable<void>;
		switch (action) {
			case 'buy':
				observable = await this.buyPlayer(player);
				break;
			case 'sell':
				observable = this.sellPlayer();
				break;
			case 'delete':
				observable = this.deletePlayer();
				break;
			default:
				console.warn('action not found');
				break;
		}
		this.isUpdatingPlayerStatus = true;
		observable.pipe(untilDestroyed(this), first()).subscribe({
			next: () => {
				this.closeDialog();
				this.onSaved();
				this.onBack();
			},
			error: (error: Error) => {
				this.error.handleError(error);
				this.isUpdatingPlayerStatus = false;
			}
		});
	}

	private deletePlayer(): Observable<any> {
		this.clubTransfers.splice(
			this.clubTransfers.findIndex(({ id }) => id === this.selectedClubTransfer.id),
			1
		);
		return this.clubTransferApi.deleteById(this.selectedClubTransfer.id);
	}

	private sellPlayer() {
		const { club, personStatus, amount } = this.transferActionModal.outward;
		return this.clubTransferApi.sellPlayer(this.selectedClubTransfer.id, String(club), amount, personStatus).pipe(
			map((myTeamPlayer: Player) => {
				this.checkForNotificationSellBuy(this.selectedClubTransfer.id, myTeamPlayer.id);
			})
		);
	}

	private async buyPlayer(playerTransfer: PlayerTransfer) {
		const playerData: Player = new Player({
			clubId: this.club.id
		});
		if (playerTransfer.downloadUrl) {
			const response: { filename: string; url: string } = await this.getProfileImageProperties(playerTransfer);
			playerData.downloadUrl = response.url;
			playerData.profilePhotoUrl = response.url;
			playerData.profilePhotoName = response.filename;
		}
		const allGlobalTests: Test[] = await this.testApi
			.find<Test>({ where: { teamId: 'GLOBAL' } })
			.pipe(untilDestroyed(this))
			.toPromise();
		// TODO: this code is duplicated a lot, check for globalTh. It should be moved to a shared service
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
		playerData._thresholds = [
			{ name: 'GEN', thresholds: defaultThresholds },
			{ name: 'GD', thresholds: defaultThresholds }
		];
		playerData._thresholdsTests = globalTh;
		return this.clubTransferApi.buyPlayer(this.selectedClubTransfer.id, this.selectedTransferTeam.id, playerData).pipe(
			concatMap((myTeamPlayer: Player) => {
				this.teamPlayers = [...this.teamPlayers, myTeamPlayer];
				const season: TeamSeason = this.currentTeamService.getCurrentSeason();
				const updatedSeason = { ...season, playerIds: [...season.playerIds, myTeamPlayer.id] };
				this.checkForNotificationSellBuy(this.selectedClubTransfer.id, myTeamPlayer.id);
				return this.seasonApi.updateAttributes(updatedSeason.id, updatedSeason);
			}),
			map((season: TeamSeason) => {
				this.currentTeamService.setCurrentSeason(season);
			})
		);
	}

	async getProfileImageProperties(player: PlayerTransfer): Promise<{ filename: string; url: string }> {
		const isWyscoutImage = player?.downloadUrl.includes('wyscout.com');
		if (isWyscoutImage) {
			return {
				filename: null,
				url: player.downloadUrl
			};
		}
		const newFilename = uuid();
		const base64 = await this.imageDownloadService.getBase64ImageFromURL(player.downloadUrl).toPromise();
		const file = this.imageDownloadService.dataURItoFilename(base64, newFilename);
		const res = await this.azureDownloadUploadService.uploadBrowserFileToAzureStore(file);
		return { filename: newFilename, url: res };
	}

	onDropEmitter(event: { transfer: ClubTransfer; type: TransferType }) {
		const i = this[event.type].findIndex(({ id }) => id === event.transfer.id);
		if (i > -1) this[event.type][i] = event.transfer;
		this.onSaved();
	}

	onSelectedKanban(event: TransferType) {
		this.activeIndex = SquadPersonIndexEnum.Overview;
		this.selectedKanban = event;
	}

	isEmpty(data: ClubSeason[]): boolean {
		return isEmpty(data);
	}

	// Message displayed when no team season or club season found.
	getMessageForNoTeamSeasons() {
		if (this.clubSeasons.length === 0) return this.translate.instant('information.clubSeason.notAvailable');
		else if (!this.seasons) return this.translate.instant('information.teamSeason.notAvailable');
		else return this.translate.instant('information.teamSeason.notAvailableToday');
	}

	// Redirecting to club setting if teamseason/player in team/ club season not found.
	getClubSettingsLink() {
		const url = '/settings/club-preferences/general';
		const params = {};
		return [url, params];
	}

	onSelect(transferId: string) {
		const clubTransfer = this.clubTransfers.find(({ id }) => id === transferId);
		this.selectedTransferPlayer = clubTransfer.player;
		this.selectedClubTransfer = clubTransfer;
		this.searchDropdownElements = this.getSearchDropdownElements(this.clubTransfers);
	}

	getSearchDropdownElements(transfers: ClubTransfer[]): TransferDropdownElement[] {
		return transfers
			.filter(({ id }) => id !== this.selectedTransferPlayer.id)
			.map(transfer => ({ player: transfer.player, transferId: transfer.id }));
	}

	onSelectFromDropdown(value: TransferDropdownElement) {
		this.onSelect(value.transferId);
	}

	getEditButtonVisibility(): boolean {
		return (
			!this.editService.editMode &&
			this.selectedClubTransfer &&
			(this.activeIndex === SquadPersonIndexEnum.Overview || this.activeIndex === SquadPersonIndexEnum.Details)
		);
	}

	getDiscardButtonVisibility(): boolean {
		return (
			this.editService.editMode &&
			this.selectedClubTransfer &&
			(this.activeIndex === SquadPersonIndexEnum.Overview || this.activeIndex === SquadPersonIndexEnum.Details)
		);
	}

	// region Third Party Clubs
	private mapPersistedClub() {
		if (this.transferActionModal?.outward?.club) {
			this.contractService
				.getClub(this.transferActionModal.outward)
				.pipe(untilDestroyed(this))
				.subscribe({
					next: data => {
						this.onThirdPartyClubsReceived(data, this.transferActionModal.outward.club);
						this.selectedClub = this.thirdPartyClubs.find(
							({ value, label }) =>
								String(value) === String(this.transferActionModal.outward.club) ||
								label === this.transferActionModal.outward.club
						);
					},
					error: (error: Error) => this.error.handleError(error)
				});
		} else {
			this.thirdPartyClubs = [];
			this.selectedClub = null;
		}
	}
	searchClub($event) {
		this.blockUiInterceptorService
			.disableOnce(
				of($event).pipe(
					map((event: any) => event.query),
					filter((query: string) => query && query.length > 2),
					distinctUntilChanged(),
					debounceTime(1000),
					switchMap(query => this.providerIntegrationService.searchTeam(query, false)),
					untilDestroyed(this)
				)
			)
			.subscribe({
				next: data => this.onThirdPartyClubsReceived(data, $event.query),
				error: error => void this.error.handleError(error)
			});
	}

	private onThirdPartyClubsReceived(data: any[], query: string) {
		if (data.length === 0) {
			this.thirdPartyClubs = [];
			this.transferActionModal.outward.club = query;
		} else {
			this.thirdPartyClubs = data.map(x => ({ label: x.officialName, value: x.wyId }));
		}
	}

	selectClub(event: AutoCompleteSelectEvent) {
		this.transferActionModal.outward.club = event.value.value.toString();
	}
	// endregion
	protected readonly VIEWS = DrillStatsViews;
}

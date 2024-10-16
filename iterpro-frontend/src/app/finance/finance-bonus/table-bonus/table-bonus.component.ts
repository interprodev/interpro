import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Agent,
	AgentContractApi,
	BasicWage,
	BasicWageApi,
	Bonus,
	BonusApi,
	Club,
	ClubApi,
	ClubSeason,
	ContractOptionCondition,
	ContractPersonStatus,
	ContractPersonType,
	ContractType,
	Customer,
	EmploymentContract,
	LoopBackAuth,
	Match,
	MatchApi,
	Player,
	Staff,
	StringBonus,
	Team,
	TeamBonus,
	TeamBonusApi,
	TeamSeason,
	TeamSeasonApi,
	TransferTypeString
} from '@iterpro/shared/data-access/sdk';
import { SelectItemLabelPipe, ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import {
	AlertService,
	BlockUiInterceptorService,
	ClubNameService,
	CompetitionsConstantsService,
	ErrorService,
	ReportService,
	getMomentFormatFromStorage,
	getPDFv2Path,
	sortByDate,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, isEmpty, sortBy, uniq, uniqBy } from 'lodash';
import * as moment from 'moment';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ConfirmationService, SelectItem, SortEvent } from 'primeng/api';
import { Observable, Subject, forkJoin, of } from 'rxjs';
import { first, map } from 'rxjs/operators';
import {
	BonusStringBuilderService,
	getVirtualGross
} from 'src/app/squads/squads-person/squads-person-legal/services/bonus-string-builder.service';
import {
	booleanRelationOptions,
	conditionsType,
	originItems,
	outwardItems
} from 'src/app/squads/squads-person/squads-person-legal/utils/contract-options';
import { PersonBonusState } from '../finance-bonus.component';
import {
	AdminFinanceBonusPlayerPDF,
	getPlayerCSVReport,
	getPlayersPDFReport,
	getTeamCSVReport,
	getTeamPDFReport
} from '../report';
import { BonusTableColumn, FinanceTableColumnsService } from './finance-table-columns.service';

@UntilDestroy()
@Component({
	selector: 'iterpro-table-bonus',
	templateUrl: './table-bonus.component.html',
	styleUrls: ['./table-bonus.component.css'],
	providers: [DecimalPipe, ShortNumberPipe]
})
export class TableBonusComponent implements OnInit, OnChanges {
	@Input({ required: true }) teams: Team[];
	@Input({ required: true }) club: Club;
	@Input({ required: true }) editMode: boolean;
	@Input({ required: true }) personBonusState: Subject<PersonBonusState>;
	@Input({ required: true }) taxes: { taxes: number; vat: number };
	@BlockUI('loadingPlayer') blockUIPeople: NgBlockUI;
	@BlockUI('loadingTeam') blockUITeam: NgBlockUI;
	@Output() emitToSave: EventEmitter<BonusItem[]> = new EventEmitter<BonusItem[]>();

	selectedView: 'player' | 'team' = 'player';
	clubSeason: ClubSeason;
	selectedTeam: Team;
	selectedSeason: TeamSeason;
	private allPlayers: Player[];
	players: SelectItem<Player>[];
	staff: SelectItem<Staff>[];
	private agents: Agent[];

	bonusComputed: BonusTotalComputed = {
		appFee: 0,
		appBonus: 0,
		perfFee: 0,
		perfBonus: 0,
		stdBonus: 0,
		signBonus: 0,
		customBonus: 0,
		total: 0,
		totalAppBonus: 0,
		totalPerfBonus: 0,
		totalStdBonus: 0,
		totalSignBonus: 0,
		totalCustomBonus: 0,
		totalTotal: 0,
		valorization: 0,
		totalValorization: 0
	};
	archived = false;
	toReceive = false; // true that the Club is the one that receives the money, to false means that the Club is the one that pays
	filteredPeopleBonuses: BonusItem[];
	private bonusToSave: BonusItem[] = [];
	matches: Match[];
	teamViewType: 'match' | 'other' = 'match';
	peopleTableColumns: BonusTableColumn[] = [];
	currency: string;
	netValuesFlag = true;
	teamTableColumns: BonusTableColumn[];
	teamBonusOnEdit: TeamBonus;
	private teamBonusOnEditBackup: TeamBonus;
	teamBonuses: TeamBonus[] = [];
	private teamBonusesBackup: TeamBonus[] = [];

	private allPeopleBonuses: BonusItem[] = [];
	private allPeopleBonusesBackup: BonusItem[];

	profileOptions: { label: string; value: ContractPersonType }[] = [
		{ label: 'admin.squads.element.players', value: 'Player' },
		{ label: 'admin.squads.element.staff', value: 'Staff' },
		{ label: 'admin.squads.element.agents', value: 'Agent' }
	];
	profile: ContractPersonType = 'Player';
	today: Date;
	customers: Customer[] = [];
	playerOptions: SelectItem<Player>[];
	selectedPlayers: Player[];
	staffOptions: SelectItem<Staff>[];
	selectedStaff: Staff[];
	agentOptions: SelectItem<Agent>[];
	selectedAgents: Agent[];
	showAdvancedFilters: boolean;
	bonusTypesOptions: SelectItem[];
	selectedBonusTypes: string[];
	contractTypesOptions: SelectItem[];
	selectedContractTypes: string[];
	agentPlayerContracts: AgentPlayerContract[];
	constructor(
		private clubApi: ClubApi,
		private auth: LoopBackAuth,
		private bonusApi: BonusApi,
		private matchApi: MatchApi,
		private error: ErrorService,
		private alert: AlertService,
		public translate: TranslateService,
		private teamBonusApi: TeamBonusApi,
		private basicWageApi: BasicWageApi,
		private reportService: ReportService,
		private teamSeasonApi: TeamSeasonApi,
		public clubNameService: ClubNameService,
		private notificationService: AlertService,
		private agentContractApi: AgentContractApi,
		public currentTeamService: CurrentTeamService,
		public selectItemLabelPipe: SelectItemLabelPipe,
		private confirmationService: ConfirmationService,
		private columnsService: FinanceTableColumnsService,
		public bonusStringBuilder: BonusStringBuilderService,
		private competitionsService: CompetitionsConstantsService,
		private blockUiInterceptorService: BlockUiInterceptorService
	) {}

	ngOnInit() {
		this.currency = this.currentTeamService.getCurrency();
		this.today = moment().endOf('day').toDate();
		this.getCustomers();
		this.listenForPersonBonusState();
		this.loadAgentOptions();
	}

	// must trigger the download of SEASONAL bonuses and matches when a season is selected AND we receive the list of players for that season
	ngOnChanges(changes: SimpleChanges) {
		if (changes['editMode']) {
			if (this.editMode) this.allPeopleBonusesBackup = cloneDeep(this.allPeopleBonuses);
		}
		if (changes['club'] && changes['club'].firstChange) {
			this.clubSeason = this.club.clubSeasons.find(({ start, end }) =>
				moment().isBetween(moment(start), moment(end), 'day', '[]')
			);
			this.agents = this.club.agents;
		}
		if (changes['teams'] && changes['teams'].firstChange) {
			this.selectedTeam = this.teams.find(({ id }) => id === this.auth.getCurrentUserData().currentTeamId);
			this.extractSeason(this.selectedTeam);
			this.loadTeamBonuses();
		}
	}

	//#region Listener
	private listenForPersonBonusState() {
		this.personBonusState
			.asObservable()
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (state: PersonBonusState) => {
					const registry: {
						[key in PersonBonusState]: () => void;
					} = {
						discarded: () => this.discardPeopleBonuses()
					};
					registry[state]();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}
	//#endregion

	//#region Load Options
	private loadPlayerOptions() {
		this.playerOptions = sortBy(this.players, 'label');
		this.selectedPlayers = this.players.map(({ value }) => value);
	}

	private loadStaffOptions() {
		this.staffOptions = sortBy(this.staff, 'label');
		this.selectedStaff = this.staff.map(({ value }) => value);
	}
	private loadAgentOptions() {
		this.agentOptions = sortBy(
			this.agents.map(agentItem => ({
				value: agentItem,
				label: `${agentItem.firstName} ${agentItem.lastName}`
			})),
			'label'
		);
		this.selectedAgents = this.agentOptions.map(({ value }) => value);
	}

	//#endregion

	private getPersonIds(profile: ContractPersonType): string[] {
		switch (profile) {
			case 'Player':
				return this.players.map(({ value }) => value.id);
			case 'Staff':
				return this.staff.map(({ value }) => value.id);
			case 'Agent':
				return this.agents.map(({ id }) => id);
			default:
				console.warn('profile not supported', this.profile);
				return [];
		}
	}

	private loadPeopleBonuses() {
		const allPersonIds = [...this.getPersonIds('Player'), ...this.getPersonIds('Staff')];
		this.blockUIPeople.start();
		const pipeline = {
			where: {
				or: [{ personId: { inq: allPersonIds } }, { agentId: { inq: this.getPersonIds('Agent') } }]
			},
			include: {
				relation: 'contract',
				scope: {
					fields: ['id', 'personStatus', 'club']
				}
			}
		};
		const obs$ = [
			this.bonusApi.find(pipeline),
			this.basicWageApi.find({
				...pipeline,
				where: {
					type: 'valorization',
					...pipeline.where
				}
			})
		];
		forkJoin(obs$)
			.pipe(
				first(),
				untilDestroyed(this),
				map(([bonuses, valorizations]: [Bonus[], BasicWage[]]) => [...bonuses, ...valorizations])
			)
			.subscribe({
				next: (result: BonusItem[]) => {
					this.allPeopleBonuses = this.getFilteredBySeasonPlayerBonuses(result);
					this.loadBonusTypeAndContractTypeOptions(this.allPeopleBonuses);
					this.onSelectProfile({ value: this.profile });
				},
				error: (error: Error) => this.error.handleError(error),
				complete: () => this.blockUIPeople.stop()
			});
	}

	private getFilteredBySeasonPlayerBonuses(bonuses: BonusItem[]): BonusItem[] {
		return (bonuses || []).filter(
			({
				type,
				achievedDate,
				conditions,
				contract
			}: {
				type: string;
				achievedDate: Date;
				conditions: ContractOptionCondition[];
				contract: EmploymentContract;
			}) => {
				if (achievedDate)
					return moment(achievedDate).isBetween(
						moment(this.selectedSeason.offseason),
						moment(this.selectedSeason.inseasonEnd),
						'day',
						'[]'
					);
				return (
					type === 'valorization' ||
					(conditions || []).some((condition: ContractOptionCondition) => {
						return (condition?.seasons || []).some((season: string | 'allContract') => {
							if (season === 'allContract') {
								return moment(contract.dateFrom).isBetween(
									moment(this.selectedSeason.offseason),
									moment(this.selectedSeason.inseasonEnd),
									'day',
									'[]'
								);
							}
							return season === this.selectedSeason.id;
						});
					})
				);
			}
		);
	}

	private getTeamBonusObs(): Observable<TeamBonus[]> {
		return this.teamBonusApi
			.find({ where: { teamId: this.selectedTeam.id, clubSeasonId: this.selectedSeason.clubSeasonId } })
			.pipe(
				map((teamBonuses: TeamBonus[]) => {
					this.teamBonuses = teamBonuses;
					this.teamBonusesBackup = cloneDeep(this.teamBonuses);
					return teamBonuses;
				})
			);
	}

	private getMatchObs(): Observable<Match[]> {
		return this.blockUiInterceptorService.disableOnce(
			this.matchApi
				.find({
					where: {
						teamId: this.selectedTeam.id,
						teamSeasonId: this.selectedSeason.id
					},
					fields: ['id', 'date', 'opponent', 'result', 'resultFlag', 'home'],
					include: [
						{
							relation: 'event',
							scope: {
								fields: ['resultFlag', 'id']
							}
						}
					]
				})
				.pipe(
					map((matches: Match[]) => {
						this.matches = sortByDate(matches || [], 'date').reverse();
					})
				)
		);
	}

	private loadTeamBonuses(alsoTeam = true) {
		this.blockUITeam.start();
		const obs$: Observable<unknown>[] = [this.getTeamBonusObs()];
		if (alsoTeam) {
			obs$.push(this.getMatchObs());
		}
		forkJoin(obs$)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				error: (error: Error) => this.error.handleError(error),
				next: () => {
					this.loadFilteredClubBonus();
					this.blockUITeam.stop();
				}
			});
	}

	private loadBonusTypeAndContractTypeOptions(personBonuses: BonusItem[]) {
		this.bonusTypesOptions = uniqBy<any>(personBonuses, 'type').map(({ type }) => {
			const label: string = [
				{ label: 'admin.contracts.appearanceFees', value: 'appearanceFee' },
				{ label: 'admin.contracts.performanceFee', value: 'performanceFee' },
				{ label: 'admin.contracts.signing', value: 'signing' },
				{ label: 'admin.contracts.valorization', value: 'valorization' },
				...conditionsType
			].find(({ value }) => value === type)?.label;
			return {
				value: type,
				label: label ? this.translate.instant(label) : type
			};
		});
		this.selectedBonusTypes = this.bonusTypesOptions.map(({ value }) => value);
		this.contractTypesOptions = uniqBy<any>(personBonuses, bonus => bonus?.contract.personStatus)
			.filter(({ contract }) => contract?.personStatus)
			.map(({ contract }) => {
				const label = [
					{ label: 'admin.contracts.type.inTeam', value: 'inTeam' },
					{ label: 'admin.contracts.type.trial', value: 'trial' },
					...originItems,
					...outwardItems
				].find(({ value }) => value === contract.personStatus)?.label;
				return {
					value: contract.personStatus,
					label: label ? this.translate.instant(label) : contract.personStatus
				};
			});
		this.selectedContractTypes = this.contractTypesOptions.map(({ value }) => value);
	}

	private getCustomers() {
		this.clubApi
			.getCustomers(this.auth.getCurrentUserData().clubId, { fields: ['id', 'firstName', 'lastName'] })
			.subscribe({
				next: (customers: Customer[]) => (this.customers = customers),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	getAmount(bonus: BonusItem): number {
		if ((bonus.type as StringBonus) === 'performanceFee' || (bonus.type as StringBonus) === 'appearanceFee') {
			const amount = bonus.progress?.amount || 0;
			if (!this.netValuesFlag) {
				return amount + amount * ((this.club.vat || 0) / 100) || 0;
			}
			return amount;
		}
		return this.getVatCorrection(bonus);
	}

	getVatCorrection(bonus: BonusItem): number {
		return getVirtualGross(bonus, !this.netValuesFlag, this.club, !!this.taxes);
	}

	private calcBonus(bonuses: BonusItem[], type: StringBonus, reached: boolean): number {
		let filteredBonuses = bonuses.filter(({ type: typeItem }) => typeItem === type);
		if (reached) {
			filteredBonuses = filteredBonuses.filter(({ progress, reached }) => progress.percentage >= 100 || reached);
		}
		return filteredBonuses.map(bonus => this.getVatCorrection(bonus)).reduce((a, b) => a + b, 0);
	}

	private computeTotal(bonuses: BonusItem[]) {
		this.bonusComputed.appFee = this.calcBonus(bonuses, 'appearanceFee', false);
		this.bonusComputed.perfFee = this.calcBonus(bonuses, 'performanceFee', false);
		this.bonusComputed.appBonus = this.calcBonus(bonuses, 'appearance', true);
		this.bonusComputed.perfBonus = this.calcBonus(bonuses, 'performance', true);
		this.bonusComputed.stdBonus = this.calcBonus(bonuses, 'standardTeam', true);
		this.bonusComputed.signBonus = this.calcBonus(bonuses, 'signing', true);
		this.bonusComputed.customBonus = this.calcBonus(bonuses, 'custom', true);
		this.bonusComputed.valorization = this.calcBonus(bonuses, 'valorization', true);
		this.bonusComputed.total =
			this.bonusComputed.appFee +
			this.bonusComputed.appBonus +
			this.bonusComputed.perfBonus +
			this.bonusComputed.stdBonus +
			this.bonusComputed.signBonus +
			this.bonusComputed.customBonus +
			this.bonusComputed.valorization;
		this.bonusComputed.totalAppBonus = this.calcBonus(bonuses, 'appearance', false);
		this.bonusComputed.totalPerfBonus = this.calcBonus(bonuses, 'performance', false);
		this.bonusComputed.totalStdBonus = this.calcBonus(bonuses, 'standardTeam', false);
		this.bonusComputed.totalSignBonus = this.calcBonus(bonuses, 'signing', false);
		this.bonusComputed.totalCustomBonus = this.calcBonus(bonuses, 'custom', false);
		this.bonusComputed.totalValorization = this.calcBonus(bonuses, 'valorization', false);
		this.bonusComputed.totalTotal =
			this.bonusComputed.appFee +
			this.bonusComputed.totalAppBonus +
			this.bonusComputed.totalPerfBonus +
			this.bonusComputed.totalStdBonus +
			this.bonusComputed.totalSignBonus +
			this.bonusComputed.totalCustomBonus +
			this.bonusComputed.totalValorization;
	}

	selectView(view: 'player' | 'team') {
		this.selectedView = view;
	}

	//#region Bonus Texts
	private getCheckConfirmedText(
		rowData: TeamBonus,
		confirmedlabel: string,
		afterLabel: string,
		defaultLabel: string
	): string {
		if (rowData.confirmed) return confirmedlabel;
		return moment().isAfter(rowData.confirmedDate) ? afterLabel : defaultLabel;
	}

	private getCheckPaidText(rowData: TeamBonus, paidLabel: string, afterLabel: string, defaultLabel: string): string {
		if (!rowData.reached) return '';
		if (rowData.paid) return paidLabel;
		return moment().isAfter(rowData.dueDate) ? afterLabel : defaultLabel;
	}

	private getCheckReachedText(
		rowData: TeamBonus,
		reachedLabel: string,
		afterLabel: string,
		defaultLabel: string
	): string {
		if (rowData.reached) return reachedLabel;
		return moment().isAfter(rowData.dueDate) ? afterLabel : defaultLabel;
	}

	getReceivedText(rowData: TeamBonus): string {
		return this.getCheckPaidText(rowData, 'bonus.received', 'bonus.overdue', 'bonus.toReceive');
	}

	getPaidText(rowData: TeamBonus): string {
		return this.getCheckPaidText(rowData, 'bonus.paid', 'bonus.overdue', 'bonus.toPay');
	}

	getPaidIcon(rowData: TeamBonus): string {
		return this.getCheckPaidText(rowData, 'fa-check', 'fa-close', 'fa-clock');
	}

	getConfirmedText(rowData: TeamBonus): string {
		return this.getCheckConfirmedText(rowData, 'bonus.confirmed', 'bonus.overdue', 'bonus.toConfirm');
	}

	getConfirmedIcon(rowData: TeamBonus): string {
		return this.getCheckConfirmedText(rowData, 'fa-check', 'fa-close', 'fa-clock');
	}

	getReachedText(rowData: TeamBonus): string {
		return this.getCheckReachedText(rowData, 'bonus.reached', 'bonus.overdue', 'bonus.toReach');
	}

	getReachedIcon(rowData: TeamBonus): string {
		return this.getCheckReachedText(rowData, 'fa-check', 'fa-close', 'fa-clock');
	}

	getReachableText(rowData: BonusItem): string {
		if (rowData.reachable) return 'bonus.reachable';
		return 'bonus.unreachable';
	}

	getReachableIcon(rowData: BonusItem): string {
		if (rowData.reachable) {
			return rowData.reached ? 'fa-check' : 'fa-clock';
		}
		return 'fa-close';
	}

	getBonusTypeText(bonus: BonusItem, index: number): string {
		return this.bonusStringBuilder.getBonusText(
			{ ...bonus, amount: this.getVatCorrection(bonus) },
			!!bonus?.transferType,
			this.selectedTeam.name,
			false,
			null,
			this.club,
			bonus.agentId,
			index
		);
	}

	getConditionType(bonusCondition: ContractOptionCondition, bonus: BonusItem): string {
		return this.bonusStringBuilder.getSingleConditionSimplified(bonusCondition, {
			...bonus,
			amount: this.getVatCorrection(bonus)
		}).description;
	}

	getTeamCondition(bonus: BonusItem | TeamBonus, index: number) {
		return this.bonusStringBuilder.getSingleConditionSimplified(bonus.conditions[index], bonus).description;
	}

	getConditionText(rowData: BonusItem): string {
		return this.translate.instant(
			rowData?.conditions.length > 1
				? 'bonus.team.total'
				: `${rowData.type === 'appearanceFee' ? 'admin.contracts.appearances.' : ''}${rowData?.conditions[0]?.goal}`
		);
	}
	//#endregion

	//#region Filters
	onSelectTeam(event: { value: Team }) {
		this.extractSeason(this.selectedTeam);
	}
	onSelectSeason(event: { value: TeamSeason }) {
		this.selectedSeason = event.value;
		this.loadPeopleInSeason(this.selectedSeason.id);
	}

	onOptionSelected() {
		this.loadFilteredPersonBonuses();
	}

	switchArchived(event: { checked: boolean }) {
		this.archived = event.checked;
		this.loadFilteredPersonBonuses();
	}

	switchPostTaxValues(event: any) {
		this.computeTotal(this.filteredPeopleBonuses);
	}

	switchToReceive(event: { checked: boolean }) {
		this.toReceive = event.checked;
		this.loadFilteredPersonBonuses();
	}

	onSelectProfile(event: { value: ContractPersonType }) {
		this.profile = event.value;
		this.loadFilteredPersonBonuses();
	}

	// called when a team is selected: select the current season or the one closest to today
	// trigger the on changes in the child components, which in turn will download seasonal players and data
	private extractSeason(team: Team) {
		if (isEmpty(team.teamSeasons)) {
			return this.alert.notify('warn', 'Admin Dashboard', 'alert.noSeasonsFound');
		} else {
			this.selectedSeason = this.currentTeamService.extractSeason(team.teamSeasons);
			if (!this.selectedSeason) return this.alert.notify('warn', 'Amin Dashboard', 'alert.noSeasonsFound');
			this.loadPeopleInSeason(this.selectedSeason.id);
		}
	}
	private loadPeopleInSeason(seasonId: string) {
		const $players = this.teamSeasonApi.getPlayers(seasonId, {
			fields: [
				'id',
				'name',
				'lastName',
				'displayName',
				'teamId',
				'currentStatus',
				'archived',
				'downloadUrl',
				'value',
				'valueField',
				'_pastValues',
				'_pastAgentValues',
				'_pastClubValues',
				'clubValue',
				'agentValue',
				'_thresholdsFinancial',
				'archived'
			]
		});
		const $staff = this.teamSeasonApi.getStaffs(seasonId, {
			fields: ['firstName', 'lastName', 'id', 'teamId', 'archived']
		});
		forkJoin([$players, $staff])
			.pipe(untilDestroyed(this))
			.subscribe({
				next: ([players, staff]: [Player[], Staff[]]) => {
					this.allPlayers = players;
					this.players = this.wrapPlayers(this.allPlayers, this.archived);
					this.staff = sortByName(staff, 'lastName').map(staff => ({
						label: `${staff.firstName} ${staff.lastName}`,
						value: staff
					}));
					this.loadPlayerOptions();
					this.loadStaffOptions();
					this.loadPeopleBonuses();
					this.loadTeamBonuses();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}
	private wrapPlayers(players: Player[], isArchived: boolean): SelectItem<Player>[] {
		return (
			sortByName(players, 'displayName')
				// .filter(({ archived }) => archived === isArchived)
				.map(player => ({ label: player.displayName, value: player }))
		);
	}

	private loadFilteredPersonBonuses() {
		this.filteredPeopleBonuses = this.allPeopleBonuses
			.filter(({ personType }) => this.profile === 'Agent' || personType === this.profile)
			.filter(({ personId, agentId }) => {
				switch (this.profile) {
					case 'Player':
						return this.selectedPlayers.find(({ id, archived }) => id === personId && archived === this.archived);
					case 'Staff':
						return this.selectedStaff.find(({ id, archived }) => id === personId && archived === this.archived);
					case 'Agent': {
						const associatedPlayer = this.players.find(({ value }) => value.id === personId)?.value;
						return this.selectedAgents.find(({ id }) => agentId === id && associatedPlayer?.archived === this.archived);
					}
					default:
						console.warn('profile not supported', this.profile);
				}
			})
			.filter(({ contractType, transferType, type }) => {
				if (this.profile === 'Agent') return contractType === 'AgentContract';
				const toPay: boolean =
					(contractType as ContractType) === 'EmploymentContract' ||
					((contractType as ContractType) === 'TransferContract' && (transferType as TransferTypeString) === 'inward');
				const toReceive: boolean =
					(contractType as ContractType) === 'TransferContract' && (transferType as TransferTypeString) === 'outward';
				if (type === 'valorization') {
					return this.toReceive
						? (transferType as TransferTypeString) === 'inward'
						: (transferType as TransferTypeString) === 'outward';
				}
				return this.toReceive ? toReceive : toPay;
			})
			.filter(({ type }) => !this.selectedBonusTypes || this.selectedBonusTypes.includes(type))
			.filter(
				({ contract }) =>
					this.profile === 'Agent' ||
					!this.selectedContractTypes ||
					this.selectedContractTypes.includes(contract.personStatus)
			)
			.map(item => ({
				...item,
				contract: {
					...item?.contract,
					club: !isNaN(item?.contract?.club) ? Number(item.contract.club) : item?.contract?.club
				},
				confirmedDate: item.confirmedDate ? moment(item.confirmedDate).toDate() : null
			}));
		switch (this.profile) {
			case 'Player':
				this.peopleTableColumns = this.columnsService.getPersonColumns(this.toReceive, false);
				break;
			case 'Staff':
				this.peopleTableColumns = this.columnsService.getPersonColumns(this.toReceive, true);
				break;
			case 'Agent':
				this.agentPlayerContracts = [];
				this.loadPlayerContractsFromAgentBonus();
				this.peopleTableColumns = this.columnsService.getAgentCols(this.toReceive);
		}
		this.computeTotal(this.filteredPeopleBonuses);
		if (!this.archived) {
			this.peopleTableColumns = this.peopleTableColumns.filter(({ field }) => field !== 'reachable');
		}
		this.teamTableColumns = this.columnsService.getMatchCols(this.toReceive);
		this.clubNameService.initClubNames(this.getClubIdsToLoad());
	}

	private loadPlayerContractsFromAgentBonus() {
		const agentBonusContractIds: string[] = uniq(this.filteredPeopleBonuses.map(({ contractId }) => contractId));
		const filter = {
			where: {
				id: { inq: agentBonusContractIds }
			},
			fields: ['id', 'contractType', 'contractId'],
			include: {
				relation: 'contract',
				scope: {
					fields: ['id', 'personType', 'personStatus', 'typeTransfer', 'contractType']
				}
			}
		};
		const getAgentContractFromPlayerContract$ =
			agentBonusContractIds.length === 0 ? of([]) : this.agentContractApi.find(filter);
		getAgentContractFromPlayerContract$
			.pipe(
				first(),
				untilDestroyed(this),
				map((result: AgentPlayerContractPipelineResult[]) => {
					return result.map(item => ({
						agentContractId: item.id,
						playerContract: {
							id: item.contract.id,
							personStatus: item.contract.personStatus,
							typeTransfer: item.contract.typeTransfer
						}
					}));
				})
			)
			.subscribe({
				next: (result: AgentPlayerContract[]) => {
					this.agentPlayerContracts = result;
					this.filteredPeopleBonuses = this.filteredPeopleBonuses.filter(({ contract }) => {
						const contractTypePersonStatus = (this.agentPlayerContracts || []).find(
							({ agentContractId }) => agentContractId === contract?.id
						).playerContract?.personStatus;
						return !this.selectedContractTypes || this.selectedContractTypes.includes(contractTypePersonStatus);
					});
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	toggleFilters() {
		this.showAdvancedFilters = !this.showAdvancedFilters;
	}
	//#endregion

	//region People Bonuses CRUD

	updateReached(rowData: BonusItem, event: { checked: boolean }) {
		if (event.checked) {
			rowData.reached = true;
			rowData.reachedCustomerId = this.auth.getCurrentUserId();
		} else {
			rowData.reached = false;
			rowData.reachedCustomerId = null;
		}
		if (rowData.reached && !rowData.achievedDate) {
			rowData.achievedDate = moment().toDate();
		}
		this.updateToSave(rowData);
	}

	updateConfirmed(rowData: BonusItem, event: { checked: boolean }) {
		if (event.checked) {
			rowData.confirmed = true;
			rowData.confirmedCustomerId = this.auth.getCurrentUserId();
		} else {
			rowData.confirmed = false;
			rowData.confirmedCustomerId = null;
		}
		if (rowData.confirmed && !rowData.confirmedDate) {
			rowData.confirmedDate = moment().toDate();
		}
		this.updateToSave(rowData);
	}

	updatePaid(rowData: BonusItem, event: { checked: boolean }) {
		if (event.checked) {
			rowData.paid = true;
			rowData.paidCustomerId = this.auth.getCurrentUserId();
		} else {
			rowData.paid = false;
			rowData.paidCustomerId = null;
		}
		if (rowData.paid && !rowData.paidDate) {
			rowData.paidDate = moment().toDate();
		}
		this.updateToSave(rowData);
	}

	updateToSave(rowData: BonusItem) {
		const bonus = this.bonusToSave.find(({ id }) => id === rowData.id);
		if (!bonus) {
			this.bonusToSave.push(rowData);
		} else {
			this.bonusToSave.map(item => {
				if (item.id === rowData.id) {
					return rowData;
				}
				return item;
			});
		}
		this.computeTotal(this.filteredPeopleBonuses);
		this.emitToSave.emit(this.bonusToSave);
	}

	//#endregion

	//#region Team Bonuses CRUD
	openTeamBonusDialog() {
		this.teamBonusOnEdit = new TeamBonus({
			amount: 0,
			conditionRelationFlag: booleanRelationOptions[0].value,
			conditions: [],
			installments: [],
			type: 'match'
		});
		this.teamBonusOnEdit.teamId = this.auth.getCurrentUserData().currentTeamId;
	}

	onTeamBonusDialogDiscarded() {
		if (this.teamBonusOnEditBackup) {
			this.teamBonuses = (this.teamBonuses || []).map(bonus => {
				if (bonus.id === this.teamBonusOnEditBackup.id) {
					return this.teamBonusOnEditBackup;
				}
				return bonus;
			});
		}
		this.teamBonusOnEdit = undefined;
	}

	onTeamBonusDialogSave(bonus: TeamBonus) {
		const alertKey = bonus?.id ? 'alert.recordUpdated' : 'alert.recordCreated';
		this.teamBonusApi
			.patchOrCreate(bonus)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (teamBonus: TeamBonus) => {
					this.loadTeamBonuses();
					this.teamBonusOnEdit = undefined;
					// if ((teamBonus.paid || teamBonus.confirmed) && !this.teamBonusOnEditBackup.paid)
					// 	this.checkForNotificationTeamBonus(this.clubSeason.id, teamBonus.id);
					this.notificationService.notify('success', 'financial', alertKey, false);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	editTeamBonus(bonus: TeamBonus) {
		this.teamBonusOnEdit = bonus;
		this.teamBonusOnEditBackup = cloneDeep(this.teamBonusOnEdit);
	}

	deleteTeamBonus(bonus: TeamBonus) {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.delete'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-trash',
			accept: () => {
				this.teamBonusApi
					.deleteById(bonus.id)
					.pipe(first(), untilDestroyed(this))
					.subscribe({
						next: () => {
							this.notificationService.notify('success', 'financial', 'alert.recordDeleted', false);
							this.teamBonuses = this.teamBonuses.filter(({ id }) => id !== bonus.id);
						},
						error: (error: Error) => this.error.handleError(error)
					});
			},
			reject: () => (this.teamBonusOnEdit = undefined)
		});
	}
	//#endregion

	//#region Match Info

	getMatchInfo(matchId: string): Match {
		return this.matches.find(({ id }) => id === matchId);
	}

	getMatchInfoText(condition: ContractOptionCondition): string {
		const info: Match = this.getMatchInfo(condition.matchId);
		if (!info) return this.translate.instant('not available').toLowerCase();
		const outcome: string = info?.event ? this.getOutcome(info.event.resultFlag) : '';
		return `${moment(info.date).format(getMomentFormatFromStorage())} - ${this.translate.instant(
			'sidebar.opponent'
		)}: ${info.opponent} (${this.translate.instant(info.home ? 'home' : 'away')}) - ${
			info.result
				? `${this.translate.instant('sidebar.result')}: ${info.result} (${
						outcome.length > 0 ? this.translate.instant(outcome) : ' - '
					}) - `
				: ''
		} ${this.translate.instant('bonus.team.condition')}: ${this.translate.instant(condition.action)}`;
	}

	getOutcome(flag: boolean): string {
		if (flag !== undefined) {
			return flag === null ? 'draw' : flag === true ? 'win' : 'lose';
		}
		return '';
	}

	changeTeamViewType(viewType: 'match' | 'other') {
		this.teamViewType = viewType;
		this.loadFilteredClubBonus();
	}

	private loadFilteredClubBonus() {
		switch (this.teamViewType) {
			case 'match':
				this.teamBonuses = this.getFilteredMatch().map(item => ({
					...item,
					confirmedDate: item.confirmedDate ? moment(item.confirmedDate).toDate() : null
				}));
				break;
			case 'other':
				this.teamBonuses = this.getFilteredOther().map(item => ({
					...item,
					confirmedDate: item.confirmedDate ? moment(item.confirmedDate).toDate() : null
				}));
				break;
			default:
				console.warn('teamViewType not supported', this.teamViewType);
				break;
		}
	}

	getFilteredMatch(): TeamBonus[] {
		const filtered: TeamBonus[] = (this.teamBonusesBackup || [])
			.filter(bonus => bonus.type === 'match')
			.filter(bonus =>
				bonus.conditions.some(condition => this.matches.map(({ id }) => id).includes(condition.matchId))
			);
		return sortBy(filtered, [
			bonus => this.getMatchInfo(bonus.conditions[0].matchId) && this.getMatchInfo(bonus.conditions[0].matchId).date
		]).reverse();
	}

	//#endregion

	getFilteredOther(): TeamBonus[] {
		return (this.teamBonusesBackup || []).filter((bonus: TeamBonus) => bonus.type !== 'match');
	}

	//#region Agent Utils
	private getAgentByPlayerId(playerId: string): Agent {
		return this.agents.find(({ assistedIds }) => assistedIds.includes(playerId));
	}

	getAgentName(playerId: string): string {
		const agentItem: Agent = this.getAgentByPlayerId(playerId);
		return agentItem ? `${agentItem.firstName} ${agentItem.lastName}` : '';
	}

	getAgentProfilePic(playerId: string): string {
		const agentItem = this.getAgentByPlayerId(playerId);
		return agentItem?.downloadUrl || null;
	}

	//#endregion

	//#region Report PDF/CSV
	downloadCsv() {
		if (this.selectedView === 'player') this.getCsvPlayersReport();
		if (this.selectedView === 'team') this.getCsvTeamReport();
	}

	private getCsvTeamReport() {
		const data = getTeamCSVReport(this);
		const csvData = [];
		[data.match, data.perf]
			.filter(({ values }) => !!values && values.length > 0)
			.forEach(dataCollection => {
				csvData.push([dataCollection.title]);
				csvData.push(dataCollection.headers.map(({ header }) => header));
				dataCollection.values.forEach(({ common, details }) => {
					csvData.push(common);
					csvData.push(...details);
					csvData.push([]);
				});
			});

		this.reportService.getReportCSV('Bonus Report - Team', csvData, { encoding: 'utf-8' });
	}

	private getCsvPlayersReport() {
		const data = getPlayerCSVReport(this);
		const csvData = [];
		csvData.push([data.title]);
		csvData.push([]);
		const aggregateValues: string[] = [
			'appearanceFee',
			'performanceFee',
			'appearanceBonus',
			'performanceBonus',
			'standardTeamBonus',
			'signingBonus',
			'customBonus',
			'valorization',
			'total'
		];
		let label: string;
		let value: string;
		aggregateValues.forEach((key: string) => {
			({ label, value } = data[key]);
			csvData.push([label + ':', value]);
		});
		csvData.push([]);
		csvData.push(data.headers.map(({ header }) => header));
		let playerValue: any;
		data.values.forEach(player => {
			const values = data.headers.map(element => {
				const key = element.field;
				playerValue = player[key];
				return this.isValidDate(playerValue) ? moment(playerValue).format(getMomentFormatFromStorage()) : playerValue;
			});
			csvData.push(values);
		});
		this.reportService.getReportCSV('Bonus Report - Players', csvData, { encoding: 'utf-8' });
	}

	isValidDate(date: any): boolean {
		return date && Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date);
	}

	downloadPDF() {
		if (this.selectedView === 'player') this.getPlayersPDFReport();
		if (this.selectedView === 'team') this.getTeamPDFReport();
	}

	private getTeamPDFReport() {
		const data = getTeamPDFReport(this);
		this.reportService.getReport(
			getPDFv2Path('admin', 'admin_finance_bonus_team'),
			data,
			'',
			null,
			'Bonus Report - Team'
		);
	}

	private getPlayersPDFReport() {
		const data: AdminFinanceBonusPlayerPDF = getPlayersPDFReport(this);
		this.reportService.getReport(
			getPDFv2Path('admin', 'admin_finance_bonus_players'),
			data,
			'',
			null,
			`Bonus Report - Players`
		);
	}

	//#endregion

	//#region Common Utils
	alreadyPaid(rowData: BonusItem): boolean {
		return this.allPeopleBonusesBackup.find(({ id }) => id === rowData.id).paid;
	}

	alreadyReached(rowData: BonusItem): boolean {
		const bonus = this.allPeopleBonusesBackup.find(({ id }) => id === rowData.id);
		return this.alreadyPaid(rowData) || bonus.reached;
	}

	private isEmploymentContract(contractType: ContractType): boolean {
		return contractType === 'EmploymentContract';
	}

	getContractLabel(transferType: TransferTypeString, contractType: ContractType, contractId: string): string {
		if (this.profile === 'Agent' && this.agentPlayerContracts?.length > 0) {
			transferType = this.getPlayerContractFromAgentContract(contractId).typeTransfer;
			contractType = (this.agentPlayerContracts || []).find(({ agentContractId }) => agentContractId === contractId)
				.playerContract?.contractType;
		}
		if (!transferType || this.isEmploymentContract(contractType)) return 'employment';
		switch (transferType) {
			case 'inward':
				return 'purchase';
			case 'outward':
				return 'sale';
			default:
				return null;
		}
	}

	private getPlayerContractFromAgentContract(agentContractId: string) {
		return this.agentPlayerContracts.find(
			({ agentContractId: agentContractIdItem }) => agentContractIdItem === agentContractId
		)?.playerContract;
	}

	getPersonStatusLabel(bonus: BonusItem): string {
		const base = 'admin.contracts.type.';
		if (this.profile === 'Agent') {
			return this.agentPlayerContracts?.length > 0
				? this.translate.instant(`${base}${this.getPlayerContractFromAgentContract(bonus.contractId).personStatus}`)
				: '';
		}
		return this.translate.instant(`${base}${bonus.contract.personStatus}`);
	}
	//#endregion

	private initPeopleBonuses() {
		this.loadFilteredClubBonus();
		this.bonusToSave = [];
	}

	private discardPeopleBonuses() {
		this.bonusToSave = [];
		this.allPeopleBonuses = cloneDeep(this.allPeopleBonusesBackup);
		this.loadFilteredPersonBonuses();
		this.initPeopleBonuses();
	}

	isNaN(num: number): boolean {
		return isNaN(num);
	}

	isReachedProgressBar(rowData: BonusItem): number {
		const percentage = Math.round(rowData.progress?.percentage);
		return percentage < 100 ? percentage : 100;
	}

	isReachedConditionProgressBar(rowData: BonusItem, condition: ContractOptionCondition): number {
		return rowData.type !== 'appearanceFee' &&
			rowData.type !== 'performanceFee' &&
			condition &&
			condition.progress.percentage < 100
			? Math.round(condition.progress.percentage)
			: 100;
	}

	isReachedConditionProgressBarTeam(condition: ContractOptionCondition): number {
		return condition && condition.progress.percentage
			? condition.progress.percentage < 100
				? Math.round(condition.progress.percentage)
				: 100
			: 0;
	}

	customSort(event: SortEvent) {
		event.data.sort((data1, data2) => {
			if (event.field === 'status') event.field = 'field';
			if (event.field === 'player') event.field = 'playerName';
			const value1 = data1[event.field];
			const value2 = data2[event.field];
			let result = null;

			if (value1 == null && value2 != null) result = -1;
			else if (value1 != null && value2 == null) result = 1;
			else if (value1 == null && value2 == null) result = 0;
			else if (typeof value1 === 'string' && typeof value2 === 'string') result = value1.localeCompare(value2);
			else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;

			return event.order * result;
		});
	}

	//#region Club Names
	private getClubIdsToLoad(): number[] {
		return this.allPeopleBonuses
			.filter(({ contract }) => !!contract?.club)
			.map(({ contract }) => Number(contract.club))
			.filter(value => !isNaN(value));
	}
	//#endregion

	//#region Competitions
	getCompetitionList(list) {
		if (list.length < 2) {
			const comp = this.competitionsService.getCompetitionFromJson(Number(list[0]));
			return comp && comp.name ? comp.name : '';
		} else
			return this.translate.instant('competitions.multiple', {
				value: list.length
			});
	}

	getCompetitionTooltip(list: any[]) {
		if (list.length > 1) return list.map(x => this.getCompNameById(x)).join(', ');
	}

	getCompetitionSeasons(list: any[] = []) {
		if (list.length < 2)
			return list
				.map(x => {
					if (x !== 'allContract') {
						const found = this.selectedTeam.teamSeasons.find(s => s.id === x);
						if (found) return found.name;
					}
					return this.translate.instant(`${x}`);
				})
				.join(', ');
		else return this.translate.instant('seasons.multiple', { value: list.length });
	}

	getCompNameById(idComp: string): string {
		const comp = this.competitionsService.getCompetitionFromJson(idComp);
		return comp?.name || '';
	}

	//#endregion

	isEmpty(data: TeamSeason[]) {
		return isEmpty(data);
	}
}

interface BonusTotalComputed {
	appFee: number;
	appBonus: number;
	perfFee: number;
	perfBonus: number;
	stdBonus: number;
	signBonus: number;
	customBonus: number;
	total: number;
	totalAppBonus: number;
	totalPerfBonus: number;
	totalStdBonus: number;
	totalSignBonus: number;
	totalCustomBonus: number;
	totalTotal: number;
	valorization: number;
	totalValorization: number;
}

interface AgentPlayerContractPipelineResult {
	id: string;
	contract: {
		id: string;
		personStatus: ContractPersonStatus;
		typeTransfer: TransferTypeString;
		contractType: ContractType;
	};
}
interface AgentPlayerContract {
	agentContractId: string;
	playerContract: {
		id: string;
		personStatus: ContractPersonStatus;
		typeTransfer: TransferTypeString;
		contractType: ContractType;
	};
}

export type BonusItem = Bonus | BasicWage;

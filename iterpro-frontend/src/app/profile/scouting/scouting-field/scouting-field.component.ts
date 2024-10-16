import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Attachment,
	Customer,
	ExtendedPlayerScouting,
	LoopBackAuth,
	Player,
	PlayerScouting,
	ScoutingLineup,
	ScoutingLineupApi,
	ScoutingLineupPlayerData,
	ScoutingLineupRoleData
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	Coordinate,
	ErrorService,
	ReportService,
	SportType,
	getBenchPlayersNumber,
	getFieldPlayersNumber,
	getMomentFormatFromStorage,
	getReportColumns,
	getRoleScenarioRoleName,
	getTactic,
	getTacticsList,
	AzureStoragePipe
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { chunk, cloneDeep, isEmpty, sortBy, uniqBy } from 'lodash';
import * as moment from 'moment';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { Observable, forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';
import { ScoutingFieldReportService } from '../_services/scouting-field-report.service';
import { ScoutingMapping } from '../scouting-details/scouting-details.component';
import { DropdownChangeEvent } from 'primeng/dropdown';

@UntilDestroy()
@Component({
	selector: 'iterpro-scouting-field',
	templateUrl: './scouting-field.component.html',
	styleUrls: ['./scouting-field.component.css']
})
export class ScoutingFieldComponent implements OnInit, OnChanges {
	@Input() scoutingPlayers: ExtendedPlayerScouting[];
	@Input() clubPlayers: Player[];
	@Input() scenarioRoles = false;
	@Input() scenarios: ScoutingLineup[] = [];
	@Input() saveEvent: Observable<void>;
	@Input() deleteEvent: Observable<void>;
	@Input() sportType: SportType;
	@Input() customers: Customer[] = [];
	@Input() isScoutingAdmin: boolean;

	@Input() visibleColumns: string[];
	@Input() isPlayerDescriptionTipss: boolean;
	@Input() isWatfordGameReport: boolean;

	@Output() deleteScenarioEmitter: EventEmitter<ScoutingLineup> = new EventEmitter<ScoutingLineup>();
	@Output() updateScenarioEmitter: EventEmitter<ScoutingLineup> = new EventEmitter<ScoutingLineup>();
	@Output() onClickPlayer: EventEmitter<ExtendedPlayerScouting> = new EventEmitter<ExtendedPlayerScouting>();
	@Output() visibleColumnsChange: EventEmitter<string[]> = new EventEmitter<string[]>();
	@Output() visibleColumnsResetRequest: EventEmitter<void> = new EventEmitter<void>();

	// general
	scenario: ScoutingLineup = null;
	activeScoutingPlayers: ExtendedPlayerScouting[];
	scenariosList: SelectItem[] = [];
	tacticsList: SelectItem<string>[] = [];
	shadowTeam = false;
	editMode = false;
	scenarioForDirector: ScoutingLineup;

	// shortlist
	shortlistPlayer: Player;
	shortlistRole: string;

	// CARDS
	tacticsPositions: Coordinate[] = [];
	selectedPlayerData: ScoutingLineupPlayerData;
	private filter: any = {
		name: '',
		re: new RegExp('', 'i'),
		age: [0, 99],
		pos: []
	};
	tempScenario: ScoutingLineup;
	tempScenarios: ScoutingLineup[];
	scenarioTitle: string;
	fieldPlayersNumber: number;
	benchPlayersNumber: number;
	lineup: ScoutingLineupPlayerData[];
	bench: ScoutingLineupPlayerData[];
	notCalled: ScoutingLineupPlayerData[];
	tactics: any;
	customersItem: SelectItem[];
	uploadDialogVisibility: boolean;
	//shortlistScoutings: ExtendedPlayerScouting[];

	constructor(
		private error: ErrorService,
		private currentTeamService: CurrentTeamService,
		private translate: TranslateService,
		private scoutingLineupApi: ScoutingLineupApi,
		private notificationService: AlertService,
		private confirmationService: ConfirmationService,
		private authService: LoopBackAuth,
		private report: ReportService,
		private azureStoragePipe: AzureStoragePipe,
		private scoutingFieldReportService: ScoutingFieldReportService
	) {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['sportType']) {
			this.fieldPlayersNumber = getFieldPlayersNumber(this.sportType);
			this.benchPlayersNumber = getBenchPlayersNumber(this.sportType);
		}
		if (changes['scoutingPlayers'] && this.scoutingPlayers.length > 0) {
			this.activeScoutingPlayers = this.scoutingPlayers.filter(({ archived }) => !archived);
		}
		if (changes['customers'] && this.customers.length > 0) {
			this.customersItem = this.customers.map(customer => ({
				label: `${customer.firstName} ${customer.lastName}`,
				value: customer.id
			}));
		}
		if (changes['scenarios'] && this.scenarios) {
			this.updateScenarioList();
			if (!this.scenario) {
				this.preselectScenario();
				this.preselectScenarioForDirector(this.scenarios);
			} else {
				this.setupForSport(this.sportType);
			}
		}
	}

	ngOnInit() {
		const mappedTactics: SelectItem<string>[] = getTacticsList().map(item => ({
			label: item.name as string,
			value: item.name as string
		}));
		this.tacticsList = sortBy(mappedTactics, 'label');
	}

	onSelectScenario() {
		this.scenario[this.scenarioRoles ? '_roles' : '_players'] = this.sortPositions(
			this.scenario[this.scenarioRoles ? '_roles' : '_players']
		);
		const scenarioIndex = this.scenariosList.findIndex(({ value }) => this.scenario.id === value.id);
		this.scenarioTitle = this.scenario.name || this.scenariosList[scenarioIndex].label;
		this.setupForSport(this.sportType);
	}

	onAddScenario() {
		if (this.scenarios.length === 0) {
			this.createScenario();
		} else {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.scouting.copyFromCurrent'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => this.createScenario(this.scenario),
				reject: () => this.createScenario()
			});
		}
	}

	onEditScenario() {
		this.tempScenario = cloneDeep(this.scenario);
		this.tempScenarios = cloneDeep(this.scenarios);
		this.editMode = true;
	}

	onDeleteScenario() {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.delete'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => this.deleteScenario(this.scenario),
			reject: () => null
		});
	}

	onDiscard() {
		this.editMode = false;
		if (this.scenario.id) {
			this.scenario = cloneDeep(this.tempScenario);
			this.scenarios = cloneDeep(this.tempScenarios);
			this.onSelectScenario();
		} else {
			this.preselectScenario();
		}
		this.preselectScenarioForDirector(this.scenarios);
		this.updateScenarioList();
	}

	onSaveScenario() {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.edit'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => this.saveScenario(this.scenario),
			reject: () => null
		});
	}

	onSelectCustomer() {
		if (!this.editMode) this.saveScenario(this.scenario);
	}

	onSelectTactic() {
		this.setupForSport(this.sportType);
		if (!this.editMode) this.saveScenario(this.scenario);
	}

	onSelectPlayer(playerId: string) {
		const playerScouting = this.activeScoutingPlayers.find(({ id }) => id === playerId);
		this.onClickPlayer.emit(playerScouting);
	}

	onVisibleColumnChange(visibleColumns: string[]) {
		this.visibleColumnsChange.emit(visibleColumns);
	}

	onVisibleColumnsResetRequest() {
		this.visibleColumnsResetRequest.emit();
	}

	private setupForSport(sportType: SportType) {
		this.scenario = this.fillScenarioWithMissingPlayers(this.scenario);
		this.tactics = getTactic(this.scenario.tactic, sportType);
		this.lineup = this.getLineup(this.scenario._players);
		this.bench = this.getBench(this.scenario._players);
		this.notCalled = this.getNotCalled(this.scenario._players);
		this.tacticsPositions = this.positionPlayers(this.scenario._players, this.tactics);
	}

	private fillScenarioWithMissingPlayers(scenario: ScoutingLineup): ScoutingLineup {
		const players = this.getScenarioPlayers(scenario);
		const notPresent = players.filter(
			player => !scenario._players.map(({ playerId }) => playerId).includes(player.playerId)
		);
		scenario._players = uniqBy([...scenario._players, ...notPresent], 'playerId');
		return scenario;
	}

	private getLineup(players: ScoutingLineupPlayerData[]): ScoutingLineupPlayerData[] {
		return players.slice(0, this.fieldPlayersNumber);
	}

	private getBench(players: ScoutingLineupPlayerData[]): ScoutingLineupPlayerData[] {
		return players.slice(this.fieldPlayersNumber, this.fieldPlayersNumber + this.benchPlayersNumber);
	}

	private getNotCalled(players: ScoutingLineupPlayerData[]): ScoutingLineupPlayerData[] {
		return players.slice(this.fieldPlayersNumber + this.benchPlayersNumber);
	}

	private updateScenarioList() {
		const filteredByPermissions = this.scenarios.filter(
			({ sharedWithIds }) => this.isScoutingAdmin || sharedWithIds.includes(this.authService.getCurrentUserId())
		);
		this.scenariosList = filteredByPermissions.map((scenario, index) => ({
			label: scenario.name || `Scenario ${index + 1}`,
			value: scenario
		}));
	}

	private preselectScenario() {
		if (!isEmpty(this.scenarios)) {
			this.scenario = this.scenarios[this.scenarios.length - 1];
			this.onSelectScenario();
		}
	}

	private getScenarioPlayers(scenarioFromCopy?: ScoutingLineup): ScoutingLineupPlayerData[] {
		const { playerIds } = this.currentTeamService.getCurrentSeason();
		return this.clubPlayers
			.filter(({ id }) => playerIds.map(playerId => String(playerId)).includes(id))
			.map(({ id }, orderingIndex) => {
				let mappings = [];
				if (scenarioFromCopy) {
					const playerData = scenarioFromCopy._players.find(({ playerId }) => id === playerId);
					mappings = playerData?.mappings || [];
				}
				return new ScoutingLineupPlayerData({
					playerId: id,
					orderingIndex,
					mappings
				});
			});
	}

	private getScenarioRoles(scenarioFromCopy?: ScoutingLineup): ScoutingLineupRoleData[] {
		const roles = Array.from(Array(this.fieldPlayersNumber), (_, i) => getRoleScenarioRoleName(this.sportType, i));
		return roles.map((roleName, orderingIndex) => {
			let mappings = [];
			if (scenarioFromCopy) {
				const roleData = scenarioFromCopy._roles.find(({ role }) => role === roleName);
				mappings = roleData?.mappings || [];
			}
			return new ScoutingLineupRoleData({
				role: roleName,
				orderingIndex,
				mappings
			});
		});
	}

	private positionPlayers(players: ScoutingLineupPlayerData[], tactics): Coordinate[] {
		return players && tactics ? chunk(Object.values(tactics), 2).map(([x, y]: [number, number]) => ({ x, y })) : [];
	}

	private createScenario(scenarioFromCopy?: ScoutingLineup) {
		this.scenario = new ScoutingLineup({
			name: null,
			teamId: this.authService.getCurrentUserData().currentTeamId,
			tactic: <any>getTactic(this.scenario?.tactic, this.sportType, false).name,
			_players: this.getScenarioPlayers(scenarioFromCopy),
			_roles: this.getScenarioRoles(scenarioFromCopy)
		});
		this.setupForSport(this.sportType);
		this.onEditScenario();
	}

	private saveScenario(scenario: ScoutingLineup) {
		this.scoutingLineupApi
			.patchOrCreate(scenario)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (res: ScoutingLineup) => {
					this.notificationService.notify('success', 'Scouting', 'alert.recordUpdated', false);
					this.scenario.id = res.id;
					this.editMode = false;
					this.updateScenarioEmitter.emit(this.scenario);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private deleteScenario(scenario: ScoutingLineup) {
		this.scoutingLineupApi
			.deleteById(scenario.id)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.scenario = null;
					this.deleteScenarioEmitter.emit(scenario);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	// CARDS
	getPlayerForCard(playerData: ScoutingLineupPlayerData): Player | PlayerScouting {
		return this.shadowTeam && (playerData.mappings || []).length > 0
			? this.getFirstMappedScouting(playerData)
			: this.clubPlayers.find(({ id }) => playerData.playerId === id);
	}

	getRoleForCard(roleData: ScoutingLineupRoleData): { role: string } | PlayerScouting {
		return this.shadowTeam && (roleData.mappings || []).length > 0
			? this.getFirstMappedScouting(roleData)
			: { role: roleData.role };
	}

	onShowShortlist(data: Player | string) {
		if (this.shadowTeam) return false;
		else if (this.scenarioRoles) this.shortlistRole = data as string;
		else this.shortlistPlayer = data as Player;
	}

	onChangeRoleName({ name, index }) {
		this.scenario._roles[index] = name;
		if (!this.editMode) this.saveScenario(this.scenario);
	}

	// CARDS - SWAPPING
	isHighlighted(playerData: ScoutingLineupPlayerData): boolean {
		return this.shadowTeam && (playerData.mappings || []).length > 0
			? !!this.getFirstMappedScouting(playerData)
			: false;
	}

	isActive({ playerId }: ScoutingLineupPlayerData): boolean {
		const player = this.clubPlayers.find(({ id }) => id === playerId);
		if (!player) return false;
		const { re, age, pos } = this.filter;
		const pAge = player.birthDate ? moment().diff(player.birthDate, 'years') : -1;
		const skipAge = age[0] === 0 && age[1] === 99;
		const skipPosition = !pos || pos.length === 0;
		return (
			(re.test(player.displayName) || re.test(player.lastName)) &&
			(skipAge || (pAge >= age[0] && pAge <= age[1])) &&
			(skipPosition || pos.find(pp => player.position === pp || player.position2 === pp || player.position3 === pp))
		);
	}

	isSelected({ playerId }: ScoutingLineupPlayerData): boolean {
		return this.selectedPlayerData?.playerId === playerId;
	}

	onSelectPlayerCard(playerData: ScoutingLineupPlayerData) {
		if (this.shortlistPlayer) return;

		if (!this.selectedPlayerData) {
			this.selectedPlayerData = playerData;
		} else {
			if (this.selectedPlayerData.playerId !== playerData.playerId) {
				this.swapPlayers(playerData, this.selectedPlayerData);
			}
			this.selectedPlayerData = null;
		}
	}

	private swapPlayers(target: ScoutingLineupPlayerData, source: ScoutingLineupPlayerData) {
		const targetIndex = this.scenario._players.findIndex(({ playerId }) => playerId === target.playerId);
		const sourceIndex = this.scenario._players.findIndex(({ playerId }) => playerId === source.playerId);
		this.scenario._players[sourceIndex] = {
			...source,
			orderingIndex: targetIndex
		};
		this.scenario._players[targetIndex] = {
			...target,
			orderingIndex: sourceIndex
		};
		this.scenario._players = this.sortPositions(this.scenario._players);
		if (!this.editMode) this.saveScenario(this.scenario);
	}

	private getFirstMappedScouting(data: ScoutingLineupPlayerData | ScoutingLineupRoleData): PlayerScouting {
		const mappings = data.mappings || [];
		if (mappings.length > 0) {
			const firstAssociated = (data.mappings || [])[0];
			return this.scoutingPlayers.find(({ id }) => id === firstAssociated.associatedScoutingId);
		} else return null;
	}

	// DIRECTOR
	onSelectScenarioForDirector(event: DropdownChangeEvent) {
		const selectedScenario = event.value as ScoutingLineup;
		const oldScenario = this.scenarioForDirector;
		const index = this.scenarios.findIndex(({ id }) => id === selectedScenario.id) + 1;
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.directorApp.scenario', {
				value: selectedScenario.name || (index > 0 ? index : '')
			}),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => this.changeScenarioForDirector(selectedScenario),
			reject: () => (this.scenarioForDirector = { ...oldScenario })
		});
	}

	private changeScenarioForDirector(selectedScenario: ScoutingLineup) {
		const { id } = selectedScenario;
		const updateQueries$ = this.scenarios.map(scenario =>
			this.scoutingLineupApi.patchOrCreate({ ...scenario, selectedDirectorAppScenario: scenario.id === id })
		);

		forkJoin(updateQueries$)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.scenarios.forEach(scenario => {
						scenario.selectedDirectorAppScenario = scenario.id === id;
					});
					this.scenarioForDirector = selectedScenario;
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private preselectScenarioForDirector(scenarios: ScoutingLineup[]) {
		this.scenarioForDirector = scenarios.find(({ selectedDirectorAppScenario }) => selectedDirectorAppScenario);
	}

	// ATTACHMENTS

	saveAttachments(event: Attachment[]) {
		this.uploadDialogVisibility = false;
		this.scenario._attachments = event;
		this.saveScenario(this.scenario);
	}

	// SHORTLIST
	onCloseShortlist(scenario: ScoutingLineup) {
		this.shortlistPlayer = null;
		this.shortlistRole = null;
		if (!this.editMode) this.saveScenario(scenario);
	}

	// ACCORDION
	getRoleAccordionHeader(roleData: ScoutingLineupRoleData): any {
		return { value: roleData.role, value2: roleData.mappings.length };
	}

	onSaveScenarioFromAccordion(scenario: ScoutingLineup) {
		this.saveScenario(scenario);
	}

	// UTILS
	private sortPositions(collection: Array<ScoutingLineupPlayerData | ScoutingLineupRoleData>) {
		return sortBy(collection, 'orderingIndex');
	}

	getPlayersForTable(players: ScoutingLineupPlayerData[]): Player[] {
		return players ? <Player[]>players.map(player => this.getPlayerForCard(player)) : [];
	}

	getRolesForTable(roles: ScoutingLineupRoleData[]): { role: string }[] {
		return roles ? <{ role: string }[]>roles.map(role => this.getRoleForCard(role)) : [];
	}

	downloadReport() {
		const playersIdInCurrentScenario = sortBy(this.scenario._players, 'orderingIndex').map(({ playerId }) => playerId);
		const players = playersIdInCurrentScenario
			.map(playerId => this.clubPlayers.find(({ id }) => id === playerId))
			.filter(x => x);

		const mappedPlayers = players
			.map(player => this.getMappedScoutingPlayers(player))
			.filter(({ associated }) => associated.length > 0);

		const report = this.scoutingFieldReportService.getReport(
			mappedPlayers,
			this.visibleColumns,
			getReportColumns([], undefined, this.isPlayerDescriptionTipss, false, this.sportType)
		);
		const data = {
			lineup: this.toPlayers(this.scenario._players.slice(0, 11)),
			subs: this.toPlayers(this.scenario._players.slice(11)),
			title: this.translate.instant('settings.scouting'),
			name: this.scenario.name,
			lineUpTranslation: this.translate.instant('admin.lineup'),
			substitutesTranslation: this.translate.instant('tactics.substitutes'),
			scoutingShortlistTranslation: this.translate.instant('scouting.shortlist'),
			date: {
				value: moment().format(getMomentFormatFromStorage()),
				label: this.translate.instant('sidebar.date')
			},
			team: { value: this.currentTeamService.getCurrentTeam().name, label: this.translate.instant('Team') },
			tactic: {
				value: this.scenario.tactic,
				label: this.translate.instant('sidebar.yourTactic')
			},
			table: report
		};
		this.report.getReport('scouting_scenario_v2', data);
	}

	getFieldUrl() {
		return `/assets/img/fields/${this.sportType}-perspective.svg`;
	}

	private getMappedScoutingPlayers(player: Player): { player: Player; associated: PlayerScouting[] } {
		const shortlist = this.getShortlist(player);
		return {
			player,
			associated: shortlist.map(({ associatedScoutingId, associatedPosition }) => ({
				...this.scoutingPlayers.find(({ id }) => id === associatedScoutingId),
				associatedPosition
			}))
		};
	}

	private getShortlist(element: Player | string): ScoutingMapping[] {
		const mappings =
			typeof element === 'string'
				? this.scenario._roles.find(({ role }) => role === (element as string)).mappings || []
				: this.scenario._players.find(({ playerId }) => playerId === (element as Player).id).mappings || [];
		return sortBy(mappings, 'associatedPosition');
	}

	private toPlayers(list: ScoutingLineupPlayerData[]) {
		const playerIds = this.clubPlayers.map(({ id }) => id);
		return list
			.filter(({ playerId }) => playerIds.includes(playerId))
			.map(({ playerId, mappings }, i) => {
				const player = this.clubPlayers.find(({ id }) => id === playerId);
				return {
					name: player.displayName,
					position: player.position,
					imgUrl: this.azureStoragePipe.transform(player.downloadUrl),
					hasMappings: mappings?.length > 0,
					mappingsLength: mappings?.length,
					x: this.tacticsPositions[i]?.x,
					y: this.tacticsPositions[i]?.y,
					playersAssociatedTranslation: this.translate.instant('scouting.playerAssociated'),
					mappings: (mappings || []).slice(0, 3).map(({ associatedScoutingId, associatedPosition }) => {
						const associatedPlayer = this.scoutingPlayers.find(({ id }) => id === associatedScoutingId);
						return {
							name: associatedPlayer.displayName,
							position: associatedPosition,
							imgUrl: this.azureStoragePipe.transform(associatedPlayer.downloadUrl)
						};
					})
				};
			});
	}
}

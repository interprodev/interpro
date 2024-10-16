import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { AuthSelectors, CurrentTeamService, SelectableTeam } from '@iterpro/shared/data-access/auth';
import {
	AvailableProviderIdField,
	AzureStorageApi,
	Customer,
	LoopBackAuth,
	Player,
	PlayerScouting,
	ProviderType,
	ScoutingGameWithReport,
	ScoutingLineup,
	ScoutingLineupPlayerData,
	ScoutingLineupRoleData
} from '@iterpro/shared/data-access/sdk';
import {
	AzureStoragePipe,
	ConstantService,
	ErrorService,
	ProviderTypeService,
	SportType,
	extractPlayerScenarios,
	getDateFormatConfig,
	getFormatFromStorage,
	getLimb,
	getMappedPlayerData,
	getMappedRoleData,
	getMapping,
	getMappingDropdownList,
	getMappingPlayer,
	getMappingPosition,
	getMappingRole,
	getMomentFormatFromStorage,
	getPositions,
	getPreferredMovesSelectItems,
	getRecommendedOptions,
	isNotEmpty,
	playerRolesByPosition,
	sortByDate,
	sortByDateDesc
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { sortBy } from 'lodash';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { RootStoreState } from 'src/app/+state/root-store.state';
import { DropdownChangeEvent } from 'primeng/dropdown';

export interface ScoutingMapping {
	associatedScoutingId: string;
	associatedPosition: number;
}
class FederalMembership {
	number: string;
	issueDate: Date;
	expiryDate: Date;
	filingDate: Date;
	type: string;
	status: string;
	from: string;
}

@UntilDestroy()
@Component({
	selector: 'iterpro-scouting-details',
	templateUrl: './scouting-details.component.html',
	styleUrls: ['./scouting-details.component.css']
})
export class ScoutingDetailsComponent implements OnChanges, OnInit, OnDestroy {
	SCOUTING_CAN_MAP_PLAYER_TO_WYSCOUT: boolean;
	SCOUTING_CAN_MAP_PLAYER_TO_INSTAT: boolean;
	@Input() player: PlayerScouting;
	@Input() editMode: boolean;
	@Input() players: Player[] = [];
	@Input() scoutingPlayers: PlayerScouting[] = [];
	@Input() scenarioRoles: boolean;
	@Input() customers: Customer[];
	@Input() scenarios: ScoutingLineup[];
	@Input() sportType: SportType;
	@Input() tableGames: ScoutingGameWithReport[] = [];

	@Output() scenariosEmitter: EventEmitter<ScoutingLineup> = new EventEmitter<ScoutingLineup>();
	@Output() onSavePlayer: EventEmitter<PlayerScouting> = new EventEmitter<PlayerScouting>();

	birthDate: string;
	nationalities: SelectItem[];
	altNationalities: SelectItem[];
	altPassport: SelectItem[];
	originStatus: SelectItem[] = this.constantService.nationalityOrigins.map(({ label, value }) => ({
		label: this.translate.instant(label),
		value
	}));

	preferredFoot: SelectItem[] = [];
	currentPosition: number;

	oldTeamId: string;
	changeTeamDialog: boolean;
	teamList$: Observable<SelectItem[]>;
	preferredMovesSelectItems: {
		movOnBall: SelectItem[];
		movOffBall: SelectItem[];
		passing: SelectItem[];
		finishing: SelectItem[];
		defending: SelectItem[];
		technique: SelectItem[];
	} = {
		movOnBall: [],
		movOffBall: [],
		passing: [],
		finishing: [],
		defending: [],
		technique: []
	};
	roles1: any[] = [];
	roles2: any[] = [];
	roles3: any[] = [];
	positions1: SelectItem[] = [];
	positions2: SelectItem[] = [];
	positions3: SelectItem[] = [];

	hoverPosition = '';

	playerScenarios: ScoutingLineup[] = [];
	showSwap = false;
	swapConfig: {
		scouting: PlayerScouting;
		scenario: ScoutingLineup;
		index: number;
		newScoutingIndex: number;
		oldScoutingIndex: number;
		newPosition: number;
		oldPosition: number;
	};
	scenariosList: SelectItem[] = [];
	addNewMappingFlag: boolean;
	scenarioToAdd: ScoutingLineup;
	newMappingElement: Player | string;
	elementsForNewMapping: SelectItem[] = [];
	mappedAssociablesFromPlayerScenarios: Array<Player | string> = [];
	availableAssociablesFromPlayerScenario: SelectItem[][];
	availablePositionsFromPlayerScenarios: SelectItem[][];
	mappedPositionsFromPlayerScenarios: number[];
	positionLegendItems: { label: string; tooltip: string }[];
	preferredLegendItems: { label: string; tooltip: string }[];
	thirdPartyPlayerSearchDialogVisible: boolean;
	thirdPartyProviderToMap: ProviderType;
	dateFormat: string;
	dateMask: string;
	constructor(
		private auth: LoopBackAuth,
		private constantService: ConstantService,
		public translate: TranslateService,
		private error: ErrorService,
		private azureStorageApi: AzureStorageApi,
		private azureUrlPipe: AzureStoragePipe,
		private store$: Store<RootStoreState>,
		private currentTeamService: CurrentTeamService,
		private providerService: ProviderTypeService
	) {
		const { primengConfig, primengInputMask } = getDateFormatConfig(getFormatFromStorage());
		this.dateFormat = String(primengConfig.dateFormat);
		this.dateMask = primengInputMask;
		this.onUploadImagePic = this.onUploadImagePic.bind(this);
		this.loadCanMapPlayerToProviders();
	}

	ngOnDestroy() {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['scenarios'] && this.scenarios) {
			this.updateLocalScenarios();
			this.getScenarioList(
				this.scenarios,
				this.playerScenarios.map(({ id }) => id)
			);
		}
	}

	ngOnInit() {
		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(first(), untilDestroyed(this))
			.subscribe(() => {
				this.currentPosition = this.player.associatedPosition;
				this.preferredFoot = this.constantService
					.getFeets()
					.map(({ label, value }) => ({ label: this.translate.instant(label), value }));
				this.nationalities = this.constantService
					.getNationalities()
					.map(({ label, value }) => ({ label: this.translate.instant(label), value }));
				this.altNationalities = this.nationalities.filter(({ value }) => value !== this.player.nationality);
				this.altPassport = this.nationalities.filter(({ value }) => value !== this.player.passport);

				this.birthDate = moment(this.player.birthDate).format(getMomentFormatFromStorage());

				this.positions1 = getPositions(this.sportType).map(({ label, value }) => ({
					label: this.translate.instant(label),
					value
				}));
				this.positions2 = this.positions1.filter(({ value }) => value !== this.player.position);
				this.positions3 = this.positions2.filter(({ value }) => value !== this.player.position2);

				if (this.player.position)
					this.roles1 = (playerRolesByPosition[this.player.position] || []).map(({ label, value, tooltip }) => ({
						label: this.translate.instant(label),
						value,
						tooltip: this.translate.instant(tooltip)
					}));
				if (this.player.position2)
					this.roles2 = (playerRolesByPosition[this.player.position2] || []).map(({ label, value, tooltip }) => ({
						label: this.translate.instant(label),
						value,
						tooltip: this.translate.instant(tooltip)
					}));
				if (this.player.position3)
					this.roles3 = (playerRolesByPosition[this.player.position3] || []).map(({ label, value, tooltip }) => ({
						label: this.translate.instant(label),
						value,
						tooltip: this.translate.instant(tooltip)
					}));
				if (!this.player.role1) this.player.role1 = [];
				if (!this.player.role3) this.player.role2 = [];
				if (!this.player.role2) this.player.role3 = [];

				this.positionLegendItems = this.constantService.getPositionLegendItems();
				this.preferredLegendItems = this.constantService.getPreferredLegendItems();
				this.preferredMovesSelectItems = getPreferredMovesSelectItems(this);

				if (!this.player.federalMembership || !Array.isArray(this.player.federalMembership)) {
					this.player.federalMembership = [new FederalMembership()];
				} else {
					this.player.federalMembership.forEach(federalMembership => {
						if (federalMembership.issueDate) federalMembership.issueDate = new Date(federalMembership.issueDate);
						if (federalMembership.expiryDate) federalMembership.expiryDate = new Date(federalMembership.expiryDate);
						if (federalMembership.filingDate) federalMembership.filingDate = new Date(federalMembership.filingDate);
					});
					this.player = {
						...this.player,
						federalMembership: sortByDateDesc(this.player.federalMembership, 'issueDate')
					};
				}

				if (!this.player.otherMobile) {
					this.player = {
						...this.player,
						otherMobile: []
					};
				}

				this.oldTeamId = this.player.teamId;

				this.teamList$ = this.store$
					.select(AuthSelectors.selectTeamList)
					.pipe(map((teams: SelectableTeam[]) => teams.map(({ id, name }) => ({ value: id, label: name }))));
			});
	}

	private loadCanMapPlayerToProviders() {
		const teamProvider = this.providerService.getProviderType(this.currentTeamService.getCurrentTeam());
		this.SCOUTING_CAN_MAP_PLAYER_TO_WYSCOUT = teamProvider === 'Wyscout';
		this.SCOUTING_CAN_MAP_PLAYER_TO_INSTAT = teamProvider === 'InStat';
	}

	onUploadImagePic(urlUpload: string, publicId: string, originalFilename: string) {
		this.updatePlayerPhoto(urlUpload, publicId, originalFilename);
	}

	updatePlayer() {
		this.player.birthDate = moment(this.birthDate, getMomentFormatFromStorage()).startOf('day').toDate();
	}

	savePlayer() {
		this.player.lastAuthor = this.auth.getCurrentUserData().id;
		this.player.lastUpdate = moment().toDate();
		this.onSavePlayer.emit(this.player);
	}

	onSelectNationality() {
		this.altNationalities = this.nationalities.filter(({ value }) => value !== this.player.nationality);
	}

	onSelectPassport() {
		this.altPassport = this.nationalities.filter(({ value }) => value !== this.player.passport);
	}

	deleteImage() {
		this.azureStorageApi
			.removeFile(this.player.clubId, this.player.profilePhotoUrl)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.player.profilePhotoName = null;
					this.player.profilePhotoUrl = null;
					this.player.downloadUrl = null;
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	getExpirationTitle(player: PlayerScouting) {
		const orderedAn = isNotEmpty(player.anamnesys) ? sortByDate(player.anamnesys, 'expirationDate').reverse() : [];
		if (orderedAn && orderedAn.length > 0) {
			const expDate = orderedAn[0].expirationDate;
			const preKey = this.translate.instant('medical.prevention.expiration');
			const stringDate = moment(expDate).format(getMomentFormatFromStorage());
			return preKey + stringDate;
		}
		return '';
	}

	private updatePlayerPhoto(photoUrl: string, photoPublicId: string, originalFilename: string) {
		this.player.profilePhotoUrl = photoPublicId;
		this.player.downloadUrl = photoUrl;
		this.player.profilePhotoName = originalFilename;
	}

	openChangeScoutingTeamDialog(selectedTeam: SelectItem) {
		this.changeTeamDialog = true;
	}

	closeTeamDialog(moveToOtherTeamAccepted: boolean) {
		this.changeTeamDialog = false;
		this.movePlayers(moveToOtherTeamAccepted);
	}

	private movePlayers(moveToOtherTeamAccepted: boolean) {
		if (!moveToOtherTeamAccepted) this.player.teamId = this.oldTeamId;
		else this.player.observerTeams = Object.assign({ [this.oldTeamId]: moment().toDate() }, this.player.observerTeams);
	}

	hover(position) {
		this.hoverPosition = position.value;
	}

	onSelectPosition1({ value }: SelectItem) {
		this.player.role1 = [];
		this.roles1 = (playerRolesByPosition[value] || []).map(({ label, value, tooltip }) => ({
			label: this.translate.instant(label),
			value,
			tooltip: this.translate.instant(tooltip)
		}));
		this.roles1 = sortBy(this.roles1, 'label');
		this.positions2 = this.positions1.filter(({ value }) => value !== this.player.position);
		if (this.player.position3) this.positions3 = this.positions2;
	}

	onSelectPosition2({ value }: SelectItem) {
		this.player.role2 = [];
		this.roles2 = (playerRolesByPosition[value] || []).map(({ label, value, tooltip }) => ({
			label: this.translate.instant(label),
			value,
			tooltip: this.translate.instant(tooltip)
		}));
		this.roles2 = sortBy(this.roles2, 'label');
		this.positions3 = this.positions2.filter(({ value }) => value !== this.player.position2);
	}

	onSelectPosition3({ value }: SelectItem) {
		this.player.role3 = [];
		this.roles3 = (playerRolesByPosition[value] || []).map(({ label, value, tooltip }) => ({
			label: this.translate.instant(label),
			value,
			tooltip: this.translate.instant(tooltip)
		}));
		this.roles3 = sortBy(this.roles3, 'label');
	}

	private updateLocalScenarios() {
		this.scenarios.forEach(scenario => {
			scenario._players.forEach(player => {
				if (!player.mappings) player.mappings = [];
			});
			scenario._roles.forEach(role => {
				if (!role.mappings) role.mappings = [];
			});
		});
		this.playerScenarios = extractPlayerScenarios(this.scenarios, this.scenarioRoles, this.player.id);
		this.availableAssociablesFromPlayerScenario = this.playerScenarios.map(scenario =>
			getMappingDropdownList(scenario, this.scenarioRoles, this.players)
		);
		this.mappedAssociablesFromPlayerScenarios = this.playerScenarios.map(scenario =>
			this.scenarioRoles ? getMappingRole(scenario, this.player) : getMappingPlayer(scenario, this.players, this.player)
		);
		this.availablePositionsFromPlayerScenarios = this.playerScenarios.map(scenario =>
			getRecommendedOptions(scenario, this.scenarioRoles, this.player)
		);
		this.mappedPositionsFromPlayerScenarios = this.playerScenarios.map(scenario =>
			getMappingPosition(scenario, this.scenarioRoles, this.player)
		);
	}

	private updateGlobalScenarios(scenario: ScoutingLineup) {
		this.scenariosEmitter.emit(scenario);
	}

	onSelectRole(event: DropdownChangeEvent, scenario: ScoutingLineup) {
		const selectedRole = event.value;
		scenario = this.removeOldMappingRole(scenario, this.player);
		scenario = this.addNewMappingRole(scenario, this.player, selectedRole);
		this.updateGlobalScenarios(scenario);
	}

	onSelectPlayer(event: DropdownChangeEvent, scenario: ScoutingLineup) {
		const selectedPlayer = event.value as Player;
		scenario = this.removeOldMappingPlayer(scenario, this.player);
		scenario = this.addNewMappingPlayer(scenario, this.player, selectedPlayer);
		this.updateGlobalScenarios(scenario);
	}

	private removeOldMappingPlayer(scenario: ScoutingLineup, player: PlayerScouting): ScoutingLineup {
		const currentPlayerIndex = this.getMappedPlayerDataIndex(scenario, player);
		const currentMappingIndex = scenario._players[currentPlayerIndex].mappings.findIndex(
			({ associatedScoutingId }) => associatedScoutingId === player.id
		);
		if (currentMappingIndex > -1) scenario._players[currentPlayerIndex].mappings.splice(currentMappingIndex, 1);
		return scenario;
	}

	private removeOldMappingRole(scenario: ScoutingLineup, player: PlayerScouting): ScoutingLineup {
		const currentRoleIndex = this.getMappedRoleDataIndex(scenario, player);
		const currentMappingIndex = scenario._roles[currentRoleIndex].mappings.findIndex(
			({ associatedScoutingId }) => associatedScoutingId === player.id
		);
		if (currentMappingIndex > -1) scenario._roles[currentRoleIndex].mappings.splice(currentMappingIndex, 1);
		return scenario;
	}

	private addNewMappingPlayer(
		scenario: ScoutingLineup,
		player: PlayerScouting,
		selectedPlayer: Player
	): ScoutingLineup {
		const newPlayerIndex = scenario._players.findIndex(
			({ playerId }) => String(playerId) === String(selectedPlayer.id)
		);
		if (newPlayerIndex > -1) {
			const newMappingIndex = scenario._players[newPlayerIndex].mappings.findIndex(
				({ associatedScoutingId }) => String(associatedScoutingId) === String(player.id)
			);
			if (newMappingIndex === -1) scenario._players[newPlayerIndex].mappings.push(this.newMapping(scenario, player));
		}
		return scenario;
	}

	private addNewMappingRole(scenario: ScoutingLineup, player: PlayerScouting, selectedRole: string) {
		const newRoleIndex = scenario._roles.findIndex(({ role }) => role === selectedRole);
		if (newRoleIndex > -1) {
			const newMappingIndex = scenario._roles[newRoleIndex].mappings.findIndex(
				({ associatedScoutingId }) => String(associatedScoutingId) === String(player.id)
			);
			if (newMappingIndex === -1) scenario._roles[newRoleIndex].mappings.push(this.newMapping(scenario, player));
		}
		return scenario;
	}

	private newMapping(scenario: ScoutingLineup, player: PlayerScouting): ScoutingMapping {
		const collection = this.scenarioRoles ? scenario._roles : scenario._players;
		return {
			associatedScoutingId: player.id,
			associatedPosition: null
		};
	}

	private getMappedPlayerDataIndex(scenario: ScoutingLineup, scouting: PlayerScouting): number {
		return scenario._players.findIndex(({ mappings }) =>
			mappings.map(({ associatedScoutingId }) => String(associatedScoutingId)).includes(String(scouting.id))
		);
	}

	private getMappedRoleDataIndex(scenario: ScoutingLineup, scouting: PlayerScouting): number {
		return scenario._roles.findIndex(({ mappings }) =>
			mappings.map(({ associatedScoutingId }) => String(associatedScoutingId)).includes(String(scouting.id))
		);
	}

	private getMappingIndex(data: ScoutingLineupPlayerData | ScoutingLineupRoleData, scouting: PlayerScouting): number {
		return data.mappings.findIndex(({ associatedScoutingId }) => String(associatedScoutingId) === String(scouting.id));
	}

	onChangeMappingPosition(event: DropdownChangeEvent, scenario: ScoutingLineup) {
		const selectedPosition = event.value;
		const mappedData = this.scenarioRoles
			? getMappedRoleData(scenario, this.player)
			: getMappedPlayerData(scenario, this.player);
		const mappedDataIndex = this.scenarioRoles
			? this.getMappedRoleDataIndex(scenario, this.player)
			: this.getMappedPlayerDataIndex(scenario, this.player);
		if (mappedData) {
			const occupiedIndex = mappedData.mappings.findIndex(
				({ associatedPosition }) => associatedPosition === selectedPosition
			);
			const currentIndex = this.getMappingIndex(mappedData, this.player);
			if (selectedPosition && selectedPosition <= 3) {
				if (occupiedIndex > -1) {
					this.swapConfig = {
						scenario,
						index: mappedDataIndex,
						scouting: this.scoutingPlayers.find(
							({ id }) => id === mappedData.mappings[occupiedIndex].associatedScoutingId
						),
						newScoutingIndex: currentIndex,
						oldScoutingIndex: occupiedIndex,
						newPosition: selectedPosition,
						oldPosition: getMapping(mappedData, this.player).associatedPosition
					};
					this.showSwap = true;
				} else {
					mappedData.mappings[currentIndex].associatedPosition = selectedPosition;
					mappedData.mappings = sortBy(mappedData.mappings, 'associatedPosition');
					this.updateGlobalScenarios(scenario);
				}
			} else {
				mappedData.mappings[currentIndex].associatedPosition = selectedPosition;
				mappedData.mappings = sortBy(mappedData.mappings, 'associatedPosition');
				this.updateGlobalScenarios(scenario);
			}
		}
	}

	onSwapEnd(confirm: boolean) {
		const scenarioIndex = this.playerScenarios.findIndex(({ id }) => id === this.swapConfig.scenario.id);
		if (confirm) {
			this.swapConfig.scenario = this.swapPlayers(this.swapConfig);
			this.playerScenarios[scenarioIndex] = {
				...this.swapConfig.scenario
			};
		} else {
			this.swapConfig = null;
		}
		this.showSwap = false;
		this.updateGlobalScenarios(this.playerScenarios[scenarioIndex]);
	}

	private swapPlayers({
		scenario,
		index,
		newScoutingIndex,
		oldScoutingIndex,
		newPosition,
		oldPosition
	}): ScoutingLineup {
		(this.scenarioRoles ? scenario._roles : scenario._players)[index].mappings[newScoutingIndex].associatedPosition =
			newPosition;
		(this.scenarioRoles ? scenario._roles : scenario._players)[index].mappings[oldScoutingIndex].associatedPosition =
			oldPosition;
		(this.scenarioRoles ? scenario._roles : scenario._players)[index].mappings = sortBy(
			(this.scenarioRoles ? scenario._roles : scenario._players)[index].mappings,
			'associatedPosition'
		);
		return scenario;
	}

	onDeleteScenario(scenario: ScoutingLineup) {
		const scenarioIndex = this.playerScenarios.findIndex(({ id }) => id === scenario.id);
		const dataIndex = this.scenarioRoles
			? this.getMappedRoleDataIndex(scenario, this.player)
			: this.getMappedPlayerDataIndex(scenario, this.player);
		const mappingIndex = this.getMappingIndex(
			(this.scenarioRoles ? scenario._roles : scenario._players)[dataIndex],
			this.player
		);
		(this.scenarioRoles ? scenario._roles : scenario._players)[dataIndex].mappings.splice(mappingIndex, 1);
		this.playerScenarios[scenarioIndex] = {
			...scenario
		};
		this.updateGlobalScenarios(scenario);
	}

	private getScenarioList(scenarios: ScoutingLineup[], playerScenarosId: string[]) {
		this.scenariosList = scenarios
			.filter(({ id }) => !playerScenarosId.includes(id))
			.map((scenario, index) => ({
				label: this.getScenarioName(scenario, index),
				value: scenario
			}));
	}

	getScenarioName(scenario: ScoutingLineup, i: number): string {
		return scenario.name || 'Scenario ' + (i + 1);
	}

	addNewScenarioMapping({ value }) {
		this.addNewMappingFlag = true;
		this.scenarioToAdd = value;
		this.elementsForNewMapping = getMappingDropdownList(this.scenarioToAdd, this.scenarioRoles, this.players);
	}

	confirmAddNewMapping(confirm: boolean) {
		if (confirm) {
			this.scenarioToAdd = this.scenarioRoles
				? this.addNewMappingRole(this.scenarioToAdd, this.player, this.newMappingElement as string)
				: this.addNewMappingPlayer(this.scenarioToAdd, this.player, this.newMappingElement as Player);
			this.scenariosEmitter.emit(this.scenarioToAdd);
		}
		this.addNewMappingFlag = false;
		this.scenarioToAdd = null;
	}

	getScenarioDropdownTooltip(): string {
		return this.translate.instant(
			this.scenariosList.length > 0 ? 'scouting.addNewScenarioMapping' : 'scouting.addNewScenarioMappingDisabled'
		);
	}

	onDiscardThirdPartySearchDialog() {
		this.thirdPartyPlayerSearchDialogVisible = false;
	}

	onSelectThirdPartySearchDialog(providerPlayer) {
		const providerIdField: AvailableProviderIdField =
			this.thirdPartyProviderToMap === 'InStat' ? 'instatId' : 'wyscoutId';
		const providerShortIdField = this.thirdPartyProviderToMap === 'InStat' ? 'instId' : 'wyId';
		this.player[providerIdField as string] = providerPlayer[providerShortIdField];
		const secondaryTeamIdField =
			this.thirdPartyProviderToMap === 'InStat' ? 'instatSecondaryTeamId' : 'wyscoutSecondaryTeamId';
		this.player[secondaryTeamIdField] = providerPlayer.currentTeamId;
		this.thirdPartyPlayerSearchDialogVisible = false;
	}

	openThirdPartyPlayerSearchDialog(provider: ProviderType) {
		this.thirdPartyProviderToMap = provider;
		this.thirdPartyPlayerSearchDialogVisible = true;
	}

	getLimb() {
		return getLimb(this.sportType);
	}
}

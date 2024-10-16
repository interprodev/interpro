import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
	Player,
	PlayerScouting,
	ScoutingLineup,
	ScoutingLineupPlayerData,
	ScoutingLineupRoleData
} from '@iterpro/shared/data-access/sdk';
import { flatten, max, sortBy, uniq } from 'lodash';
import { SelectItem } from 'primeng/api';
import { ScoutingMapping } from './../../scouting-details/scouting-details.component';
import { ScoutingFilterStatus } from './../scouting-shortlist-filters/interfaces';
import { ScoutingFilterService } from './../scouting-shortlist-filters/service/scouting-filter.service';

import { AzureStoragePipe, isBase64Image } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';
interface AssociatedItem {
	associatedScoutingId: string;
	associatedPosition: number;
	positions: SelectItem[];
	notAssignedOptions: Array<{
		player: PlayerScouting;
		label: string;
		value: any;
	}>;
}
interface PlayerScoutingMapping extends PlayerScouting {
	associatedPosition: number;
}
@Component({
	selector: 'iterpro-scouting-shortlist',
	templateUrl: './scouting-shortlist.component.html',
	styleUrls: ['./scouting-shortlist.component.css']
})
export class ScoutingShortlistComponent implements OnChanges {
	@Input() overlay = true;
	@Input() scenario: ScoutingLineup;
	@Input() player: Player;
	@Input() role: string;
	@Input() scoutingPlayers: PlayerScouting[];
	@Input() scenarioRoles = false;
	@Input() scenarioTitle: string;
	@Input() isScoutingAdmin: boolean;

	@Output() closeEmitter: EventEmitter<ScoutingLineup> = new EventEmitter<ScoutingLineup>();
	@Output() selectPlayerEmitter: EventEmitter<PlayerScouting> = new EventEmitter<PlayerScouting>();
	@Output() saveScenarioEmitter: EventEmitter<ScoutingLineup> = new EventEmitter<ScoutingLineup>();

	shortlist: ScoutingMapping[] = [];
	filteredShortlistScoutings: PlayerScoutingMapping[] = [];
	shortlistScoutings: PlayerScoutingMapping[] = [];
	item: AssociatedItem = null;
	scoutingFilterText = '';
	scoutingFilterStatus: ScoutingFilterStatus;

	private draggedPlayer: PlayerScouting = null;
	showFilters = false;

	constructor(private scoutingFilterService: ScoutingFilterService, private azurePipe: AzureStoragePipe) {}

	ngOnChanges(changes: SimpleChanges) {
		if ((changes['player'] && this.player) || (changes['role'] && this.role)) {
			this.getMappedScoutingPlayers(this.scenarioRoles ? this.role : this.player);
		}
	}

	onClose() {
		this.closeEmitter.emit(this.scenario);
	}

	onSelectPlayer(scouting: PlayerScouting) {
		if (this.isScoutingAdmin) this.selectPlayerEmitter.emit(scouting);
	}

	onAddNewMapping() {
		this.scenario = this.scenarioRoles ? this.addRoleMapping(this.scenario) : this.addPlayerMapping(this.scenario);
		this.getMappedScoutingPlayers(this.scenarioRoles ? this.role : this.player);
		this.filter();
	}

	private addRoleMapping(scenario: ScoutingLineup): ScoutingLineup {
		const index = scenario._roles.findIndex(({ role }) => role === this.role);
		if (!scenario._roles[index].mappings) scenario._roles[index].mappings = [];
		scenario._roles[index].mappings.push({
			associatedScoutingId: this.item.associatedScoutingId,
			associatedPosition: this.item.associatedPosition
		});
		return scenario;
	}

	private addPlayerMapping(scenario: ScoutingLineup): ScoutingLineup {
		const index = scenario._players.findIndex(({ playerId }) => playerId === this.player.id);
		if (!scenario._players[index].mappings) scenario._players[index].mappings = [];
		scenario._players[index].mappings.push({
			associatedScoutingId: this.item.associatedScoutingId,
			associatedPosition: this.item.associatedPosition
		});
		return scenario;
	}

	deletePlayerMapping(scoutingPlayer: PlayerScoutingMapping): void {
		const playerToRemove = this.filteredShortlistScoutings.findIndex(({ id }) => id === scoutingPlayer.id);
		this.filteredShortlistScoutings.splice(playerToRemove, 1);
		this.scenario._players.find(p => this.player.id === p.playerId).mappings.splice(playerToRemove, 1);
	}

	private getMappedScoutingPlayers(element: Player | string) {
		this.shortlist = this.getShortlist(element);
		this.shortlistScoutings = this.shortlist.map(({ associatedScoutingId, associatedPosition }) => ({
			...this.scoutingPlayers.find(({ id }) => id === associatedScoutingId),
			associatedPosition
		}));
		this.onResetFilter();
		this.setAssociatedItem();
		this.filteredShortlistScoutings = [...this.shortlistScoutings];
	}

	private getShortlist(element: Player | string): ScoutingMapping[] {
		const mappings =
			typeof element === 'string'
				? this.scenario._roles.find(({ role }) => role === (element as string)).mappings || []
				: this.scenario._players.find(({ playerId }) => playerId === (element as Player).id).mappings || [];
		return sortBy(mappings, 'associatedPosition');
	}

	private setAssociatedItem() {
		const occupiedPlayerIds = this.getOccupiedPlayerIds(
			this.scenarioRoles ? this.scenario._roles : this.scenario._players
		);
		const occupiedPositions = this.shortlist.map(({ associatedPosition }) => associatedPosition);
		const maxOccupiedPosition = max(occupiedPositions) || 0;
		const availablePositions = [];
		for (let i = 1; i <= maxOccupiedPosition + 1; i++) {
			if (occupiedPositions.indexOf(i) < 0) availablePositions.push({ value: i, label: i });
		}
		const notAssignedOptions = this.scoutingPlayers
			.filter(({ archived }) => !archived)
			.filter(({ id }) => !occupiedPlayerIds.includes(id))
			.map(player => ({
				label: player.displayName,
				value: player.id,
				player
			}));

		this.item = {
			associatedScoutingId: null,
			associatedPosition: null,
			positions: availablePositions,
			notAssignedOptions
		};
	}

	private getOccupiedPlayerIds(collection: Array<ScoutingLineupPlayerData | ScoutingLineupRoleData>): string[] {
		return uniq(
			flatten(collection.map(({ mappings }) => mappings)).map(({ associatedScoutingId }) => associatedScoutingId)
		);
	}

	// UTILS
	getScoutingDownloadUrl(playerId: string): string {
		const downloadUrl = playerId ? this.scoutingPlayers.find(({ id }) => id === playerId).downloadUrl : null;
		return this.getImageUrl(downloadUrl);
	}

	getImageUrl(downloadUrl: string) {
		return downloadUrl && isBase64Image(this.player.downloadUrl) ? downloadUrl : this.azurePipe.transform(downloadUrl);
	}

	getLangClass(lang: string): string {
		if (lang) {
			return 'flag-icon-' + lang.toLowerCase();
		} else {
			return '';
		}
	}

	getAge(player: Player | PlayerScouting): number {
		if (player.birthDate) return moment().diff(moment(player.birthDate), 'year');
	}

	getColor(player: PlayerScoutingMapping): string {
		if (player.associatedPosition === 1) return '#000000';
		if (player.associatedPosition === 2) return '#222222';
		if (player.associatedPosition === 3) return '#444444';
		if (!player.associatedPosition) return '#999';
		return 'var(--color-neutral-600)';
	}

	// FILTERS
	filter() {
		const filteredPlayers = this.filterByText(this.shortlistScoutings);
		this.filteredShortlistScoutings = this.filterByStatus(filteredPlayers);
	}

	onResetFilter() {
		this.scoutingFilterText = '';
		this.scoutingFilterStatus = this.scoutingFilterService.parse(this.shortlistScoutings);
		this.filteredShortlistScoutings = [...this.shortlistScoutings];
	}

	onSelectFilterField(filterStatus: ScoutingFilterStatus) {
		this.filter();
	}

	private filterByText(players: PlayerScouting[]): PlayerScouting[] {
		const regex = new RegExp(this.scoutingFilterText, 'i');
		return this.scoutingFilterText
			? players.filter(
					({ displayName, lastName, name }) => regex.test(displayName) || regex.test(lastName) || regex.test(name)
			  )
			: [...players];
	}

	private filterByStatus(players: PlayerScouting[]): PlayerScouting[] {
		return this.scoutingFilterService.filter(players, this.scoutingFilterStatus);
	}

	// DRAG
	onDragStart(player: PlayerScouting) {
		this.draggedPlayer = player;
	}

	onDragEnd() {
		this.draggedPlayer = null;
	}

	onDragEnter(player: PlayerScouting) {
		if (this.draggedPlayer.id === player.id) return;
		const sourceIndex = this.shortlist.findIndex(
			({ associatedScoutingId }) => associatedScoutingId === this.draggedPlayer.id
		);
		const targetIndex = this.shortlist.findIndex(({ associatedScoutingId }) => associatedScoutingId === player.id);
		this.shortlist = this.switchPlayers(sourceIndex, targetIndex, this.shortlist);
		this.updateScenarioFromShorlist(this.shortlist);
		this.getMappedScoutingPlayers(this.scenarioRoles ? this.role : this.player);
		this.filter();
		this.onDragEnd();
		if (!this.overlay) this.saveScenarioEmitter.emit(this.scenario);
	}

	private switchPlayers(sourceIndex: number, targetIndex: number, shortlist: ScoutingMapping[]): ScoutingMapping[] {
		const tempPosition = shortlist[targetIndex].associatedPosition;
		shortlist[targetIndex].associatedPosition = shortlist[sourceIndex].associatedPosition;
		shortlist[sourceIndex].associatedPosition = tempPosition;
		return sortBy(shortlist, 'associatedPosition');
	}

	private updateScenarioFromShorlist(mappings: ScoutingMapping[]) {
		if (this.scenarioRoles) {
			const index = this.scenario._roles.findIndex(({ role }) => role === this.role);
			this.scenario._roles[index] = {
				...this.scenario._roles[index],
				mappings
			};
		} else {
			const index = this.scenario._players.findIndex(({ playerId }) => playerId === this.player.id);
			this.scenario._players[index] = {
				...this.scenario._players[index],
				mappings
			};
		}
	}
}

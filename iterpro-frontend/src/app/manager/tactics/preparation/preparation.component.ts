import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import {
	Attachment,
	Match,
	Player,
	PlayerStatusLegendRow,
	TacticsData,
	TacticsPlayerData
} from '@iterpro/shared/data-access/sdk';
import {
	Coordinate,
	ReportService,
	SportType,
	TacticCoordinate,
	getBenchPlayersNumber,
	getFieldPlayersNumber,
	getPlayerStatusLegendConfiguration,
	getTactic
} from '@iterpro/shared/utils/common-utils';
import { chunk } from 'lodash';
import * as moment from 'moment';
import { v4 as uuid } from 'uuid';
import { InjuryAvailability } from '../tactics.component';

@Component({
	selector: 'iterpro-match-preparation',
	templateUrl: './preparation.component.html',
	styleUrls: ['./preparation.component.css']
})
export class PreparationComponent implements OnChanges {
	dialogOpened: boolean;
	@Input() phase: TacticsData;
	@Input() phaseType: string;
	@Input() injuryMap: Map<string, InjuryAvailability>;
	@Input() playerList: Player[];
	@Input() match: Match;
	@Input() getMatchReport: () => any;
	@Input() sportType: SportType;

	@Output() saveEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() showPlayerDialogEmitter: EventEmitter<TacticsPlayerData> = new EventEmitter<TacticsPlayerData>();
	@Output() saveAttachmentsEmitter: EventEmitter<void> = new EventEmitter<void>();

	tactics: TacticCoordinate;
	lineup: TacticsPlayerData[];
	bench: TacticsPlayerData[];
	notCalled: TacticsPlayerData[];

	tacticsPositions: Coordinate[] = [];
	positionType = 'absolute';

	currentSelectedPlayer: TacticsPlayerData;

	legendConfig: PlayerStatusLegendRow[] = getPlayerStatusLegendConfiguration(true);
	uploadDialogVisibility: boolean;
	fieldPlayersNumber: number;
	benchPlayersNumber: any;

	readonly #reportService = inject(ReportService);

	ngOnChanges(changes: SimpleChanges) {
		if (changes['phase'] && changes['phase'].currentValue) {
			this.setupForSport(this.sportType);
		}
	}

	onClickPlayer(player: TacticsPlayerData) {
		if (this.dialogOpened === false) {
			if (this.currentSelectedPlayer == null) {
				this.currentSelectedPlayer = player;
			} else {
				this.switchPlayers(this.currentSelectedPlayer, player);
				this.currentSelectedPlayer = null;
			}
		} else {
			this.dialogOpened = false;
		}
	}

	showPlayerDialog(player) {
		this.dialogOpened = true;
		this.showPlayerDialogEmitter.emit(player);
	}

	downloadReport() {
		const data = {
			lineup: this.toPlayers(this.lineup),
			subs: this.toPlayers(this.bench),
			...this.getMatchReport()
		};

		this.#reportService.getReport(this.getReportTitle(this.sportType), data);
	}

	private getReportTitle(sportType: string): string {
		return `match_preparation_${sportType === 'rugbyLeague' ? 'rugby' : sportType}`;
	}

	saveAttachments(event: Attachment[]) {
		this.uploadDialogVisibility = false;
		this.match.event._attachments = event;
		this.saveAttachmentsEmitter.emit();
	}

	isSelected(player: TacticsPlayerData, currentSelectedPlayer: TacticsPlayerData): boolean {
		return player && currentSelectedPlayer && currentSelectedPlayer.id === player.id;
	}

	getFieldUrl() {
		return `/assets/img/fields/${this.sportType}-perspective.svg`;
	}

	private setupForSport(sportType: SportType) {
		this.fieldPlayersNumber = getFieldPlayersNumber(this.sportType);
		this.benchPlayersNumber = getBenchPlayersNumber(this.sportType);
		this.tactics = getTactic(this.getTacticNameFromPhaseBySport(sportType), sportType);
		if (this.phase._players.length < this.fieldPlayersNumber) {
			this.phase._players = this.fillPhasePlayers(this.phase);
		}
		this.phase._players = this.phase._players.concat(this.getNotInListPlayers(this.phase._players.length));
		this.phase._players.forEach(tacticPlayerData => {
			if (!this.playerList.find(({ id }) => id === tacticPlayerData.playerId)) {
				delete tacticPlayerData.playerId;
			}
		});
		this.lineup = this.getLineup(this.phase._players);
		this.bench = this.getBench(this.phase._players);
		this.notCalled = this.getNotCalled(this.phase._players);
		this.tacticsPositions = this.positionPlayers(this.phase._players, this.tactics);
	}

	private getTacticNameFromPhaseBySport(sportType: string): string {
		switch (sportType) {
			case 'americanFootball':
				return this.phaseType;
			default:
				return this.phase.tactic;
		}
	}

	private getNotInListPlayers(startIndex: number): TacticsPlayerData[] {
		return this.playerList
			.filter(({ archived }) => this.isActiveAtDate(archived))
			.filter(({ id }) => !this.phase._players.map(({ playerId }) => playerId).includes(id))
			.map((player, index) => this.toTacticsPlayerData(player, startIndex + index));
	}

	private isActiveAtDate(archived: boolean): boolean {
		return moment(this.match.date).isBefore(moment()) || !archived;
	}

	private getLineup(players: TacticsPlayerData[]): TacticsPlayerData[] {
		return players.slice(0, this.fieldPlayersNumber);
	}

	private getBench(players: TacticsPlayerData[]): TacticsPlayerData[] {
		return players.slice(this.fieldPlayersNumber, this.fieldPlayersNumber + this.benchPlayersNumber);
	}

	private getNotCalled(players: TacticsPlayerData[]): TacticsPlayerData[] {
		return players.slice(this.fieldPlayersNumber + this.benchPlayersNumber);
	}

	private fillPhasePlayers(phase: TacticsData): TacticsPlayerData[] {
		const toAdd = Array.from(Array(this.fieldPlayersNumber - phase._players.length).keys()).map(
			(el, index) =>
				new TacticsPlayerData({
					id: uuid(),
					playerId: null,
					orderingIndex: phase._players.length + index
				})
		);
		phase._players = phase._players.concat(toAdd);
		phase._players.forEach((data, index) => {
			if (!data.orderingIndex) data.orderingIndex = index;
		});
		return phase._players;
	}

	private toPlayers(list: TacticsPlayerData[]) {
		const playerIds = this.playerList.map(({ id }) => id);
		return list
			.filter(({ playerId }) => playerIds.includes(playerId))
			.map(({ playerId }, i) => {
				const player = this.playerList.find(({ id }) => id === playerId);
				return {
					name: player.displayName,
					position: player.position,
					x: this.tacticsPositions[i] && this.tacticsPositions[i].x,
					y: this.tacticsPositions[i] && this.tacticsPositions[i].y
				};
			});
	}

	private toTacticsPlayerData(player: Player, orderingIndex: number): TacticsPlayerData {
		return new TacticsPlayerData({
			id: uuid(),
			playerId: player.id,
			organization: null,
			transition: null,
			orderingIndex,
			organizationVideoUrl: null,
			organizationAlternateVideoUrl: null,
			organizationVideoTags: null,
			transitionVideoUrl: null,
			transitionAlternateVideoUrl: null,
			transitionVideoTags: null,
			transitionComments: [],
			organizationComments: []
		});
	}

	private positionPlayers(players: TacticsPlayerData[], tactics): Coordinate[] {
		return players && tactics ? chunk(Object.values(tactics), 2).map(([x, y]: [number, number]) => ({ x, y })) : [];
	}

	private switchPlayers(p1: TacticsPlayerData, p2: TacticsPlayerData) {
		if (!p1.playerId || !p2.playerId) {
			this.shiftDeletedPlayers(p1, p2);
		} else {
			this.standardSwitch(p1, p2);
		}
		// setTimeout(() => this.saveEmitter.emit(this.phase), 2000);
		this.saveEmitter.emit(this.phase);
	}

	private shiftDeletedPlayers(p1: TacticsPlayerData, p2: TacticsPlayerData) {
		if (
			(!p1.playerId && !p2.playerId) ||
			(p1.orderingIndex < this.fieldPlayersNumber && p2.orderingIndex < this.fieldPlayersNumber)
		) {
			// if both are deleted or both are inside the lineup, just switch them
			this.standardSwitch(p1, p2);
		} else {
			const indexToReplace = !p1.playerId ? p1.orderingIndex : p2.orderingIndex;
			const indexToKeep = !p1.playerId ? p2.orderingIndex : p1.orderingIndex;
			this.phase._players[indexToReplace] = this.phase._players[indexToKeep];
			this.phase._players.splice(indexToKeep, 1);
			this.phase._players.forEach((player, index) => {
				player.orderingIndex = index;
			});
		}
	}

	private standardSwitch(p1: TacticsPlayerData, p2: TacticsPlayerData) {
		const temp = p1.orderingIndex;
		p1.orderingIndex = p2.orderingIndex;
		p2.orderingIndex = temp;

		[this.phase._players[p1.orderingIndex], this.phase._players[p2.orderingIndex]] = [
			this.phase._players[p2.orderingIndex],
			this.phase._players[p1.orderingIndex]
		];
	}
}

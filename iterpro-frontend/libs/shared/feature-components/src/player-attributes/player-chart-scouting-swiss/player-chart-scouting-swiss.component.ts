import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	Customer, ExtendedChartPoint,
	ExtendedPlayerScouting,
	PlayerItem,
	PlayerScouting, PlayerScoutingApi,
	ScoutingGameWithReport, SwissPlayerAttributeCompareFilter,
	Team,
	TeamSeason
} from '@iterpro/shared/data-access/sdk';
import { CustomerNamePipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	PRIMARIES,
	getId,
	loadAgeOptions,
	loadPositionOptions,
	loadCustomerOptions,
	convertPotentialToABC, countTrueValues, ErrorService, getMomentFormatFromStorage
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { flatten, sortBy, uniq } from 'lodash';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { forkJoin, mergeMap, toArray } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';


@UntilDestroy()
@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, TranslateModule, FormsModule],
	selector: 'iterpro-player-chart-scouting-swiss',
	templateUrl: './player-chart-scouting-swiss.component.html',
	styleUrls: ['./player-chart-scouting-swiss.component.css']
})
export class PlayerChartScoutingSwissComponent implements OnInit, OnChanges {
	@Input({required: true}) player!: ExtendedPlayerScouting;
	@Input({required: true}) scoutingGames: ScoutingGameWithReport[] = [];
	@Input({required: true}) customers!: Customer[];
	@Input({required: true}) seasons!: TeamSeason[];
	@Input({required: true}) scoutingPlayers: ExtendedPlayerScouting[] = [];
	@Input({required: true}) team!: Team;

	tipssOptions!: ChartOptions;
	tipssChartData!: ChartData;

	scoutingPlayerOptions!: SelectItem[];
	authorOptions!: SelectItem[];
	ageOptions!: SelectItem[];
	positionOptions!: SelectItem[];
	filters: SwissPlayerAttributeCompareFilter = {
		ages: [],
		positions: [],
		scoutingPlayerIds: [],
		customersIds: []
	};
	otherPlayersScoutingGames: ScoutingGameWithReport[] = [];
	readonly #customerNamePipe = inject(CustomerNamePipe);
	readonly #translateService = inject(TranslateService);
	readonly #playerScoutingApi = inject(PlayerScoutingApi);
	readonly #errorService = inject(ErrorService);
	ngOnInit(): void {
		this.loadOptions();
		this.initTipssChartData();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['scoutingGames'] || changes['player']) {
			this.scoutingGames = (this.scoutingGames || []).filter(item => this.filterByValidGameReport(item));
			this.loadOptions();
			this.initTipssChartData();
		}
	}

	private filterByValidGameReport(gameReport: ScoutingGameWithReport): boolean {
		return gameReport.completed && gameReport?.reportData?.performance?.some((item: any) => this.hasValueField(item)) &&
		gameReport?.reportData?.potential?.filter(({type}) => type === 'booleanType').some((item: any) => this.hasValueField(item));
	}

	private hasValueField(reportDataItem: any): boolean {
		return reportDataItem.hasOwnProperty('value') && reportDataItem.value !== null;
	}

	private getPlayerOptions(players: PlayerItem[]): SelectItem[] {
		return sortBy(
			(players || []).map(player => ({
				value: getId(player),
				label: player.displayName,
				teamId: player.teamId,
				disabled: getId(player) === getId(this.player)
			})),
			'label'
		);
	}

	private loadOptions() {
		this.ageOptions = loadAgeOptions(this.scoutingPlayers);
		this.positionOptions = loadPositionOptions(this.scoutingPlayers, this.#translateService);
		const scoutIds = (this.scoutingGames || []).map(({scoutId}) => scoutId as string);
		this.authorOptions = loadCustomerOptions(scoutIds, this.customers, this.#customerNamePipe);
		this.scoutingPlayerOptions = this.getPlayerOptions(this.scoutingPlayers);
	}

	private initTipssChartData() {
		this.updateTipssChartData();
		this.tipssOptions = this.getChartOptions();
	}

	private getChartOptions(): ChartOptions {
		const max = this.getMaxScale();
		return {
			responsive: true,
			animation: undefined,
			plugins: {
				datalabels: {
					display: false
				},
				legend: {
					display: true,
					labels: {
						color: '#ddd',
						padding: 10
					}
				},
				tooltip: {
					mode: 'point',
					intersect: true,
					callbacks: {
						title: ([{ dataset, raw }, ...{}]: any[]) =>
							raw.v.map(
								({ gameWithReport, title, date }) =>
									`${
										this.isComparablePlayerDataset(dataset.label)
											? gameWithReport.displayName
											: this.getLastReportScoutName(gameWithReport.scoutId)
									} (${title}) - ${moment(gameWithReport.start).format(getMomentFormatFromStorage())}`
							),
						label: ({ raw }: any) => `Performance: ${raw.x} - Potential: ${(raw.y)}`
					}
				}
			},
			scales: {
				x: {
					type: 'linear',
					position: 'bottom',
					beginAtZero: true,
					max,
					ticks: {
						color: '#ddd'
					}
				},
				y: {
					type: 'category',
					position: 'left',
					labels: ['A', 'B', 'C', '-'],
					max: 3,
					ticks: {
						color: '#ddd'
					}
				}
			}
		};
	}

	private updateTipssChartData() {
		const tipssMap = this.getTipssChartDataset();
		this.tipssChartData = {
			labels: [],
			// @ts-ignore
			datasets: Array.from(tipssMap.entries())
				.filter(([, data]) => data.length > 0)
				.sort(([label]) => (this.isComparablePlayerDataset(label) ? 0 : -1))
				.map(([label, data], index) => ({
					label,
					data,
					pointRadius: 4,
					borderWidth: 4,
					borderColor: this.isComparablePlayerDataset(label) ? '#AAA' : PRIMARIES[index],
					pointBorderColor: this.isComparablePlayerDataset(label) ? '#AAA' : PRIMARIES[index],
					pointBackgroundColor: this.isComparablePlayerDataset(label) ? '#AAA' : PRIMARIES[index],
					pointHoverBackgroundColor: this.isComparablePlayerDataset(label) ? '#AAA' : PRIMARIES[index],
					pointHoverBorderColor: '#fff',
					backgroundColor: 'transparent'
				}))
		};
	}
	private getScoutedPlayer(playerScoutingId: string): PlayerScouting | undefined {
		return this.scoutingPlayers.find(scoutedPlayer => getId(scoutedPlayer) === playerScoutingId);
	}

	private getMaxScale(): number {
		return this.team.club.scoutingSettings.tipssSettings.scale === 'fiveDouble' ? 5 : 10;
	}

	private isComparablePlayerDataset(label: string): boolean {
		return label.includes('Comparison') || label.includes('My Team');
	}
	private getLastReportScoutName(gameReportScoutId: string): string {
		return this.#customerNamePipe.transform(gameReportScoutId, this.customers);
	}

	private isComparablePlayer(gameReport: ScoutingGameWithReport): boolean {
		const otherPlayer =
			getId(this.player) !== gameReport.playerScoutingId &&
			this.filters.scoutingPlayerIds.includes(gameReport.playerScoutingId);
		const found = this.getScoutedPlayer(gameReport.playerScoutingId);
		return otherPlayer || !found || this.comparableAge(found) || this.comparablePosition(found);
	}

	private comparableAge(player: PlayerScouting): boolean {
		return this.filters.ages.length === 0 || this.filters.ages.includes(moment().diff(moment(player.birthDate), 'year'));
	}

	private comparablePosition(player: PlayerScouting): boolean {
		return this.filters.positions.length === 0 || this.filters.positions.includes(player.position);
	}

	private isObservedBySelectedAuthor(gameReportScoutId: string): boolean {
		return this.filters.customersIds.length === 0 || this.filters.customersIds.includes(gameReportScoutId);
	}

	onUpdateOrCompareTipssChart() {
		this.updateTipssChartData();
	}

	private getTipssChartDataset(): Map<string, ExtendedChartPoint[]> {
		const playerId = getId(this.player);
		const tipssMap = new Map<string, ExtendedChartPoint[]>();

		const insertGameReport = (label: string, gameReport: ScoutingGameWithReport, title: string) => {
			if (!tipssMap.get(label)) {
				tipssMap.set(label, []);
			}
			this.updateChartPoint(tipssMap.get(label) as ExtendedChartPoint[], gameReport, title);
		};

		[...this.scoutingGames, ...this.otherPlayersScoutingGames].forEach(gameWithReport => {
			const gameSeason = this.seasons.find(({ offseason, inseasonEnd }) =>
				moment(gameWithReport.start).isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
			);
			if (gameSeason) {
				if (gameWithReport.playerScoutingId === playerId && this.isObservedBySelectedAuthor(gameWithReport.scoutId)) {
					insertGameReport(gameSeason.name, gameWithReport, gameWithReport.title);
				} else if (this.isComparablePlayer(gameWithReport)) {
					insertGameReport('Comparison ' + gameSeason.name, gameWithReport, gameWithReport.title);
				}
			}
		});
		return tipssMap;
	}



	private updateChartPoint(points: ExtendedChartPoint[], gameReport: ScoutingGameWithReport, title: string): ExtendedChartPoint[] {
		const performance = gameReport?.reportData?.performance.find((item: any) => item?.key === 'Performance')?.value;
		const potentialValues = gameReport?.reportData?.potential.map((item: any) => item?.value) || [];
		const potentialSum = countTrueValues(potentialValues);
		const potential = convertPotentialToABC(potentialSum);
		const sameValues = points.find(point => point.x === performance && point.y === potential);
		if (sameValues) {
			sameValues.v.push({ gameWithReport: gameReport, title });
		} else {
			points.push({
				x: performance,
				y: potential,
				v: [{ gameWithReport: gameReport, title }]
			});
		}
		return points;
	}

	onScoutingPlayerIdsChange() {
		const existingScoutingPlayerIds: string[] = uniq(this.otherPlayersScoutingGames.map(({ playerScoutingId }) => playerScoutingId));
		const playersIdsToLoad: string[] = this.filters.scoutingPlayerIds.filter(id => !existingScoutingPlayerIds.includes(id));
		const obs$ = playersIdsToLoad.map(id => this.#playerScoutingApi.getPlayerGames(id, this.team.id));
		forkJoin(obs$).pipe(
			mergeMap(results => results),
			toArray(),
			untilDestroyed(this))
			.subscribe({
				next: (games: ScoutingGameWithReport[][]) => {
					this.otherPlayersScoutingGames = [...this.otherPlayersScoutingGames, ...flatten(games)];
					this.updateTipssChartData();
				},
			error: err => this.#errorService.handleError(err)
		});
	}
}

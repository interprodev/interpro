import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthSelectors, AuthState, CurrentTeamService, SelectableTeam } from '@iterpro/shared/data-access/auth';
import {
	AttributeCategory,
	AttributesAvgItems,
	Customer,
	ExtendedPlayerScouting,
	LoopBackAuth,
	Player,
	PlayerAttribute,
	PlayerAttributeCompareFilter,
	PlayerItem,
	PlayerScouting,
	ScoutingSettings,
	Team,
	attributeAvgCategory
} from '@iterpro/shared/data-access/sdk';
import { PictureComponent } from '@iterpro/shared/ui/components';
import { CustomerNamePipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AzureStoragePipe,
	ErrorService,
	getAge,
	getAllSelectItemGroupValues,
	getAttributesToMap,
	getTeamsPlayerAttributes,
	loadAgeOptions,
	loadCustomerOptions,
	loadPositionOptions
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { flatten, sortBy, uniq } from 'lodash';
import * as moment from 'moment';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import { CheckboxChangeEvent } from 'primeng/checkbox';
import { forkJoin } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { ApiService } from './services/api.service';
import { DistributionChartService } from './services/distribution-chart.service';
import { GaussianChartService } from './services/gaussian-chart.service';
import { ScatterChartService } from './services/scatter-chart.service';
import { UtilsService } from './services/utils.service';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, FormsModule, TranslateModule, AzureStoragePipe, PictureComponent],
	selector: 'iterpro-player-attributes-compare',
	templateUrl: './player-attributes-compare.component.html',
	styleUrls: ['./player-attributes-compare.component.scss']
})
export class PlayerAttributesCompareComponent implements OnInit, OnChanges {
	@Input({ required: true }) player!: Player | ExtendedPlayerScouting;
	@Input({ required: true }) type!: 'Player' | 'PlayerScouting';
	@Input({ required: true }) customers!: Customer[];
	teamsOptions: SelectItem[] = [];
	metricOptions!: SelectItemGroup[];
	selectedMetrics!: string[];
	includedCategories!: AttributeCategory[];
	agesOptions!: SelectItem[];
	birthSemesterOptions!: SelectItem[];
	positionOptions!: SelectItem[];
	customerOptions!: SelectItem[];
	chartsOptions: SelectItem[] = [
		{ label: 'Distribution', value: 'distribution' },
		{ label: 'Scatter', value: 'scatter' },
		{ label: 'Gaussian', value: 'gaussian' }
	];
	playerOptions: SelectItemGroup[] = [];
	scoutingOptions: SelectItem[] = [];
	selectedChart = 'distribution';

	dataDistribution!: ChartData;
	optionsDistribution!: ChartOptions;

	dataScatter!: ChartData;
	optionsScatter!: ChartOptions;

	dataGaussian!: ChartData;
	optionsGaussian!: ChartOptions;

	filters: PlayerAttributeCompareFilter = {
		teams: [],
		showTeamAvg: true,
		ages: [],
		birthSemester: [],
		positions: [],
		customersIds: [],
		playerIds: [],
		scoutingPlayerIds: []
	};
	private players: Player[] = [];
	private playersScouting: PlayerScouting[] = [];
	private currentTeam!: Team;
	scoutingSettings!: ScoutingSettings;
	clubCrest!: string;
	attributesAvg: AttributesAvgItems = {
		offensive: 0,
		defensive: 0,
		attitude: 0
	};
	resultFound!: number;
	customer!: Customer;
	constructor(
		private api: ApiService,
		private auth: LoopBackAuth,
		private utils: UtilsService,
		private error: ErrorService,
		private store$: Store<AuthState>,
		private translate: TranslateService,
		private customerNamePipe: CustomerNamePipe,
		private currentTeamService: CurrentTeamService,
		private scatterChartService: ScatterChartService,
		private gaussianChartService: GaussianChartService,
		private distributionChartService: DistributionChartService
	) {}

	ngOnInit() {
		this.currentTeam = this.currentTeamService.getCurrentTeam();
		this.customer = this.auth.getCurrentUserData();
		this.scoutingSettings = this.currentTeam?.club?.scoutingSettings;
		this.clubCrest = this.currentTeam?.club?.crest;
		this.store$
			.select(AuthSelectors.selectTeamList)
			.pipe(
				first(),
				switchMap((teams: SelectableTeam[]) => {
					this.teamsOptions = teams
						.filter(({ id }) => this.customer.teamSettings.find(({ teamId }) => teamId === id))
						.map(team => this.mapTeamToSelectItem(team));
					this.filters.teams = [this.mapTeamToSelectItem(this.currentTeam).value];
					this.loadMetricsOptions();
					return forkJoin([
						this.api.getPlayersTeam(this.teamsOptions, 'Player'),
						this.api.getPlayersTeam(this.teamsOptions, 'PlayerScouting')
					]);
				}),
				map(([players, playersScouting]) => {
					this.players = flatten(players as Player[][]).filter(player => player.attributes.length > 0);
					this.playersScouting = flatten(playersScouting as PlayerScouting[][]).filter(
						player => player.attributes.length > 0
					);
					this.loadOptions();
				})
			)
			.subscribe({
				next: () => this.filtersChanged(),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['player']) {
			this.loadOptions();
			this.filtersChanged();
		}
	}

	private loadOptions() {
		const allPlayers: PlayerItem[] = [...(this.players || []), ...(this.playersScouting || [])];
		this.agesOptions = loadAgeOptions(allPlayers);
		this.positionOptions = loadPositionOptions(allPlayers, this.translate);
		const authorIds = allPlayers
			.map(({ attributes }) => (attributes || []).map(({ authorId }) => authorId as string))
			.flat();
		this.customerOptions = loadCustomerOptions(authorIds, this.customers, this.customerNamePipe);
		this.loadSemesterOptions();
		this.loadPlayerOptions();
	}

	private loadPlayerOptions() {
		this.playerOptions = this.getMyTeamOptions(this.players);
		this.scoutingOptions = this.getPlayerOptions(this.playersScouting).filter(
			// @ts-ignore
			({ value, teamId }) => value === this.player.id || this.filters.teams.map(({ id }) => id).includes(teamId)
		);
		this.filters.playerIds = getAllSelectItemGroupValues(this.playerOptions).map(({ value }) => value);
		this.filters.scoutingPlayerIds = this.scoutingOptions.map(({ value }) => value);
	}

	private getMyTeamOptions(players: PlayerItem[]): SelectItemGroup[] {
		return this.teamsOptions.map(team => ({
			label: team.label as string,
			items: this.getPlayerOptions(players.filter(({ teamId }) => team.value.id === teamId))
		}));
	}
	private getPlayerOptions(players: PlayerItem[]): SelectItem[] {
		return sortBy(
			players.map(player => ({
				value: player.id,
				label: player.displayName,
				teamId: player.teamId,
				picture: player.downloadUrl,
				disabled: player.id === this.player.id
			})),
			'label'
		);
	}

	private loadMetricsOptions() {
		const attributes: PlayerAttribute[] = getAttributesToMap(
			getTeamsPlayerAttributes(this.getSelectedTeams()),
			this.scoutingSettings,
			this.type === 'PlayerScouting'
		);
		const categories: string[] = uniq(attributes.map(item => item.category));
		this.metricOptions = categories.map((category: string) => ({
			label: this.translate.instant(`profile.attributes.${category}`),
			value: category,
			items: attributes
				.filter((item: PlayerAttribute) => item.category === category)
				.map((item: PlayerAttribute) => ({
					label: this.translate.instant(item.label),
					value: item.value
				}))
		}));
		this.selectedMetrics = getAllSelectItemGroupValues(this.metricOptions).map(({ value }) => value);
		this.loadIncludedCategories();
	}

	private loadIncludedCategories() {
		this.includedCategories = this.metricOptions
			.filter(({ items }) => items.some(({ value }) => this.selectedMetrics.includes(value)))
			.map(({ value }) => value);
	}

	private loadSemesterOptions() {
		this.birthSemesterOptions = [
			{ value: 1, label: this.translate.instant('forecast.semesterI') },
			{ value: 2, label: this.translate.instant('forecast.semesterII') }
		];
	}
	private mapTeamToSelectItem({ id, name, playerAttributes }: SelectableTeam): SelectItem {
		return {
			value: {
				id,
				playerAttributes,
				club: { scoutingSettings: this.scoutingSettings },
				name
			},
			label: name
		};
	}

	private getSelectedTeams(): Team[] | undefined {
		// TODO MATTEO REMOVE IT IF DON'T USE IT
		if (!this.filters.teams || this.filters.teams.length === 0) {
			return undefined;
		}
		const selectedTeamIds: string[] = this.filters.teams.map(({ id }) => id);
		return this.teamsOptions.filter(({ value }) => selectedTeamIds.includes(value.id)).map(({ value }) => value);
	}

	onMetricsChange() {
		this.loadIncludedCategories();
		this.renderCharts();
	}

	renderCharts() {
		const players: PlayerItem[] = this.getFilteredPlayers();
		this.loadAttributesAvg(players);
		this.resultFound = players.length;
		switch (this.selectedChart) {
			case 'distribution':
			default:
				this.renderDistributionChart(players);
				break;
			case 'scatter':
				this.renderScatterChart(players);
				break;
			case 'gaussian':
				this.renderGaussianChart(players);
				break;
		}
	}

	private renderDistributionChart(players: PlayerItem[]) {
		const playerCategoriesValues = this.getPlayerCategoriesScores();
		this.dataDistribution = this.distributionChartService.getDistributionChartData(
			players,
			this.includedCategories,
			this.selectedMetrics,
			getTeamsPlayerAttributes(this.getSelectedTeams()),
			this.scoutingSettings
		);
		this.optionsDistribution = this.distributionChartService.getDistributionChartOptions(
			this.player,
			this.includedCategories,
			getTeamsPlayerAttributes(this.getSelectedTeams()),
			this.attributesAvg,
			playerCategoriesValues
		);
	}

	private renderScatterChart(players: PlayerItem[]) {
		this.dataScatter = this.scatterChartService.getScatterChartData(
			players,
			this.includedCategories,
			this.selectedMetrics,
			getTeamsPlayerAttributes(this.getSelectedTeams()),
			this.scoutingSettings,
			this.player.id
		);
		this.optionsScatter = this.scatterChartService.getScatterChartOptions(this.includedCategories, this.player);
	}

	private renderGaussianChart(players: PlayerItem[]) {
		this.dataGaussian = this.gaussianChartService.getGaussianChartData(
			this.player.id,
			players,
			this.includedCategories,
			this.selectedMetrics,
			getTeamsPlayerAttributes(this.getSelectedTeams()),
			this.scoutingSettings
		);
		this.optionsGaussian = this.gaussianChartService.getGaussianChartOptions(this.player);
	}

	private loadAttributesAvg(players: PlayerItem[]) {
		attributeAvgCategory.forEach((type: AttributeCategory) => {
			this.attributesAvg[type] = this.utils.getAttributesAverage(
				players,
				type,
				this.selectedMetrics,
				this.teamsOptions.map(({ value }) => value),
				this.scoutingSettings
			);
		});
	}

	filtersTeamChanged() {
		this.loadPlayerOptions();
		this.filtersChanged();
	}

	myTeamPlayerChanged(ids: string[]) {
		if (this.type === 'Player') {
			this.filters.playerIds = uniq([...(ids || []), this.player.id]);
		} else {
			this.filters.playerIds = ids || [];
		}
		this.filtersChanged();
	}

	scoutingPlayerChanged(ids: string[]) {
		if (this.type === 'PlayerScouting') {
			this.filters.scoutingPlayerIds = uniq([...(ids || []), this.player.id]);
		} else {
			this.filters.scoutingPlayerIds = ids || [];
		}
		this.filtersChanged();
	}

	filtersChanged() {
		this.renderCharts();
	}

	private getFilteredPlayers(): PlayerItem[] {
		const playersToFilter = [...this.players, ...this.playersScouting].filter(
			({ id }) => this.filters.playerIds.includes(id) || this.filters.scoutingPlayerIds.includes(id)
		);
		return playersToFilter.filter(
			item =>
				item.id === this.player.id ||
				((this.isUndefinedOrEmpty(this.filters.ages) || this.filters.ages.includes(getAge(item.birthDate))) &&
					(this.isUndefinedOrEmpty(this.filters.birthSemester) ||
						this.filters.birthSemester.includes(moment(item.birthDate).month() < 6 ? 1 : 2)) &&
					(this.isUndefinedOrEmpty(this.filters.positions) || this.filters.positions.includes(item.position)) &&
					(this.isUndefinedOrEmpty(this.filters.customersIds) ||
						item.attributes.some(({ authorId }) => this.filters.customersIds.includes(authorId))))
		);
	}

	private isUndefinedOrEmpty(value: any[]): boolean {
		return !value || value.length === 0;
	}

	private getPlayerCategoriesScores(): { category: AttributeCategory; value: number }[] {
		return (this.includedCategories || []).map(category => ({
			category,
			value: this.utils.getPlayerCategoryScore(
				this.player,
				category,
				this.selectedMetrics,
				this.type,
				getTeamsPlayerAttributes(this.getSelectedTeams()),
				this.scoutingSettings
			)
		}));
	}

	isMetricGroupSelected(group: SelectItemGroup): boolean {
		// Check if all items in the group are selected
		return group.items.every(item => this.selectedMetrics.includes(item.value));
	}

	toggleMetricGroupSelection(event: CheckboxChangeEvent, group: SelectItemGroup): void {
		// Toggle selection for all items in the group
		if (event.checked) {
			this.selectedMetrics = uniq([...this.selectedMetrics, ...group.items.map(item => item.value)]);
		} else {
			this.selectedMetrics = this.selectedMetrics.filter(value => !group.items.some(item => item.value === value));
		}
		this.loadIncludedCategories();
		this.filtersChanged();
	}

	isPlayerGroupSelected(group: SelectItemGroup): boolean {
		// Check if all items in the group are selected
		if (group.items.length === 0) return false;
		return group.items.every(item => this.filters.playerIds.includes(item.value));
	}

	togglePlayerGroupSelection(event: CheckboxChangeEvent, group: SelectItemGroup): void {
		// Toggle selection for all items in the group
		if (event.checked) {
			this.filters.playerIds = uniq([
				...this.filters.playerIds,
				...group.items.map(item => item.value),
				this.player.id
			]);
		} else {
			this.filters.playerIds = this.filters.playerIds.filter(
				value => value === this.player.id || !group.items.some(item => item.value === value)
			);
		}
		this.filtersChanged();
	}
}

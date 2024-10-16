import { DecimalPipe } from '@angular/common';
import { Component, Injector } from '@angular/core';
import { AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Customer,
	CustomerApi,
	Player,
	PlayerAttributesEntry,
	Team,
	TeamSeason
} from '@iterpro/shared/data-access/sdk';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import {
	AlertService,
	AzureStoragePipe,
	BlockUiInterceptorService,
	ConstantService,
	ErrorService,
	ReportService,
	SportType,
	completeWithAdditionalFields,
	copyValue,
	getLimb,
	getPositions,
	playerAttributes,
	sortByName,
	getTeamSettings,
	getActiveTeams,
	getTeamsPlayerAttributes
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { last } from 'lodash';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { BlockUI, BlockUIService, NgBlockUI } from 'ng-block-ui';
import { Subscription, forkJoin } from 'rxjs';
import { RootStoreState } from '../../+state/root-store.state';
import { ComparePlayersService } from './compare-players.service';
import CompareTable from './compare-table/compare-table';
import ComparedPlayer from './utils/compared-player';

const moment = extendMoment(Moment);
@UntilDestroy()
@Component({
	selector: 'iterpro-compare-players',
	templateUrl: './compare-players.component.html',
	styleUrls: ['./compare-players.component.css'],
	providers: [DecimalPipe, ShortNumberPipe]
})
export class ComparePlayersComponent extends EtlBaseInjectable {
	obs: Subscription[] = [];
	rightFlag: boolean;
	leftFlag: boolean;
	activeTeams: Team[] = [];
	tables: any = [];
	activePerformanceMetrics: any = [];
	activeTacticalMetrics: any = [];
	left: ComparedPlayer = null;
	right: ComparedPlayer = null;
	user: Customer = null;
	analysis = false;
	service: ComparePlayersService;
	blockService: BlockUIService;
	notificationService: AlertService;
	error: ErrorService;
	translate: TranslateService;
	report: ReportService;
	nationalities: any[] = [];
	positions: any[] = [];
	preferredLimb: any[] = [];
	years: any[] = [];
	constantService: ConstantService;
	selectedNationality: any = {};
	selectedLimb: any = {};
	selectedPositions: any = {};
	selectedYears: any = {};
	filters: any[] = [];
	showFilters = false;
	allSeasons: TeamSeason[] = [];
	@BlockUI('compare') blockUI: NgBlockUI;
	activeTeamsId: any[];
	currentTeam: Team;
	isArchived: false;
	offensive: any[] = [];
	defensive: any[] = [];
	attitude: any[] = [];
	sportType: SportType = 'football';

	constructor(
		private customerApi: CustomerApi,
		private currentTeamService: CurrentTeamService,
		private azureUrlPipe: AzureStoragePipe,
		private millionsPipe: ShortNumberPipe,
		private numberPipe: DecimalPipe,
		private store$: Store<RootStoreState>,
		injector: Injector,
		blockUiInterceptorService: BlockUiInterceptorService
	) {
		super(injector);
		blockUiInterceptorService.disableInterceptor();
		this.service = injector.get(ComparePlayersService);
		this.notificationService = injector.get(AlertService);
		this.error = injector.get(ErrorService);
		this.translate = injector.get(TranslateService);
		this.report = injector.get(ReportService);
		this.constantService = injector.get(ConstantService);
		this.store$
			.select(AuthSelectors.selectSportType)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (type: SportType) => {
					this.sportType = type;
					this.positions = getPositions(this.sportType);
				}
			});
		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(untilDestroyed(this))
			.subscribe(() => {
				this.customerApi
					.getCurrent({
						include: ['teamSettings']
					})
					.subscribe({
						next: (customer: Customer) => {
							this.activeTeamsId = getActiveTeams(customer.teamSettings);
							this.setup();
						}
					});
				this.currentTeam = this.currentTeamService.getCurrentTeam();
			});
	}

	setup() {
		this.left = new ComparedPlayer(this.currentTeamService.getCurrency());
		this.right = new ComparedPlayer(this.currentTeamService.getCurrency());
		this.left.azureUrlPipe = this.azureUrlPipe;
		this.right.azureUrlPipe = this.azureUrlPipe;

		this.preferredLimb = this.constantService.getFeets();
		this.preferredLimb = this.preferredLimb.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));

		this.nationalities = this.constantService.getNationalities();
		this.nationalities = this.nationalities.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		const initialYear = moment().subtract(50, 'year').startOf('year');
		const yearsInterval = Array.from(moment.range(initialYear, moment().startOf('year')).by('years')).reverse();
		this.years = yearsInterval.map(x => ({
			label: moment(x).format('YYYY'),
			value: x
		}));
		this.resetFilters();
		this.fetchInitialData();
	}

	toggleFilters() {
		this.showFilters = !this.showFilters;
	}

	resetFilters() {
		this.selectedNationality = {
			label: 'Nationalities',
			model: [],
			options: this.nationalities
		};
		this.selectedLimb = {
			label: this.translate.instant(`profile.position.${getLimb(this.sportType)}`),
			model: [],
			options: this.preferredLimb
		};
		this.selectedPositions = {
			label: 'Positions',
			model: [],
			options: this.positions
		};
		this.selectedYears = { label: 'Years', model: [], options: this.years };

		this.filters = [this.selectedNationality, this.selectedLimb, this.selectedPositions, this.selectedYears];
	}

	filterPlayers() {
		this.fetchPlayers(
			this.selectedNationality.model.map(({ value }) => value),
			this.selectedLimb.model.map(({ value }) => value),
			this.selectedPositions.model.map(({ value }) => value),
			this.selectedYears.model.map(({ value }) => value)
		);
	}

	fetchInitialData() {
		this.user = this.service.getCustomer();
		const currentClub = this.service.getCurrentClub();
		return forkJoin([this.service.fetchTeamSeasons(this.activeTeamsId), this.service.fetchTeams(this.activeTeamsId)])
			.pipe(untilDestroyed(this))
			.subscribe(([teamSeasons, teams]: [TeamSeason[], Team[]]) => {
				this.allSeasons = teamSeasons;
				this.activeTeams = teams.map(team => ({
					...team,
					club: currentClub
				}));
				this.fetchPlayers();
			});
	}

	fetchPlayers(selectedNationality = [], selectedFoot = [], selectedPositions = [], selectedYears = []) {
		const left = new ComparedPlayer(this.currentTeamService.getCurrency());
		const right = new ComparedPlayer(this.currentTeamService.getCurrency());
		const leftFull = new ComparedPlayer(this.currentTeamService.getCurrency());
		const rightFull = new ComparedPlayer(this.currentTeamService.getCurrency());
		left.allSeasons = this.allSeasons;
		right.allSeasons = this.allSeasons;
		leftFull.allSeasons = this.allSeasons;
		rightFull.allSeasons = this.allSeasons;

		this.activeTeams.forEach(team => {
			const allPlayers = sortByName(this.service.fetchPlayers(team), 'displayName');

			let filtered = allPlayers
				.filter(({ nationality }) => !selectedNationality.length || selectedNationality.find(x => nationality === x))
				.filter(({ foot }) => !selectedFoot.length || selectedFoot.find(x => foot === x))
				.filter(
					({ position, position2, position3 }) =>
						!selectedPositions.length ||
						selectedPositions.find(pos => position === pos) ||
						selectedPositions.find(pos => position2 === pos) ||
						selectedPositions.find(pos => position3 === pos)
				)
				.filter(
					({ birthDate }) => !selectedYears.length || selectedYears.find(y => moment(birthDate).format('YYYY') === y)
				);

			if (!this.isArchived) {
				filtered = filtered.filter(({ archived }) => !archived);
			}

			left.setDefaultPlayers(team, filtered);
			right.setDefaultPlayers(team, filtered, 1);
			leftFull.setDefaultPlayers(team, allPlayers);
			rightFull.setDefaultPlayers(team, allPlayers, 1);
		});

		this.left = left.hasPlayers() ? left : leftFull;
		this.right = right.hasPlayers() ? right : rightFull;

		if (!left.hasPlayers() && !right.hasPlayers())
			this.notificationService.notify('error', 'compare-players', 'alert.noFilteredPlayersFound', false);

		this.left.setFirstSelected();
		this.right.setSecondOrFirstSelected();

		this.fetchSeasons(this.left, 'left');
		this.fetchSeasons(this.right, 'right');
		this.setMetrics();
		this.fetchStats(this.left, 'left');
		this.fetchStats(this.right, 'right');
	}

	setMetrics() {
		this.activePerformanceMetrics = this.withMetrics(
			this.etlGpsService,
			getTeamSettings(this.user.teamSettings, this.currentTeam.id).metricsPerformance
		);
		this.activeTacticalMetrics = this.withMetrics(
			this.etlPlayerService,
			getTeamSettings(this.user.teamSettings, this.currentTeam.id).metricsIndividualTactical
		);
		this.left.performanceMetrics = this.activePerformanceMetrics;
		this.right.performanceMetrics = this.activePerformanceMetrics;
		this.left.tacticalMetrics = this.activeTacticalMetrics;
		this.right.tacticalMetrics = this.activeTacticalMetrics;
	}

	fetchSeasons(compared, which) {
		compared.seasons = this.allSeasons;
		// compared.seasons = this.service.fetchSeasons(compared.selected.team);
		this.setMetrics();
		if (compared.seasons.length) {
			compared.updateSeason();
			this.offensive = ((compared.season && compared.season.playerAttributes) || playerAttributes).filter(
				({ active, category }) => active && category === 'offensive'
			);
			this.defensive = ((compared.season && compared.season.playerAttributes) || playerAttributes).filter(
				({ active, category }) => active && category === 'defensive'
			);
			this.attitude = ((compared.season && compared.season.playerAttributes) || playerAttributes).filter(
				({ active, category }) => active && category === 'attitude'
			);
		} else {
			this.notificationService.notify('error', 'compare-players', 'alert.noSeasonsFound', false);
			this.blockUI.stop();
		}
	}

	fetchStats(compared, which) {
		if (!compared.season || !compared.selected || !compared.selected.player || !compared.selected.team) return;
		this.blockUI.start(this.translate.instant('spinner.comparePlayer'));
		const durationField = this.etlPlayerService.getDurationField().metricName;
		this.obs = [
			...this.obs,
			this.service
				.fetchStatsData(
					compared.selected.player,
					compared.selected.team,
					compared.season,
					this.activePerformanceMetrics.map(({ metric }) => {
						metric = metric.replace(/\./g, '_');
						return metric;
					}),
					this.activeTacticalMetrics.map(({ metric }) => {
						metric = metric.replace(/\./g, '_');
						return metric;
					}),
					durationField
				)
				.pipe(untilDestroyed(this))
				.subscribe({
					next: (data: any[]) => {
						this.blockUI.stop();
						const attributes: PlayerAttributesEntry = this.getAttributes(
							compared.selected.player,
							compared.selected.team
						);
						compared.selected = {
							...compared.selected,
							attributes: attributes?.values || [],
							performanceMetrics: data[0].gps[0],
							tacticalMetrics: data[0].playerStats[0],
							robustness: this.service.getRobustness(data[1], compared.selected.player.id)
						};

						if (which === 'left') {
							this.left.selected = copyValue(compared.selected);
							this.leftFlag = true;
						} else {
							this.right.selected = copyValue(compared.selected);
							this.rightFlag = true;
						}

						if (this.leftFlag && this.rightFlag) this.blockUI.stop();
						this.createCompareTables();
					},
					error: (error: Error) => this.error.handleError(error)
				})
		];
	}

	private getAttributes(player: Player, team: Team): PlayerAttributesEntry {
		return completeWithAdditionalFields(
			last(player?.attributes || []),
			getTeamsPlayerAttributes([team]),
			'Player',
			this.currentTeam?.club?.scoutingSettings
		);
	}

	withMetrics(service, metrics) {
		const mapping = service.getMetricsMapping();
		return metrics.map(metric => {
			const m = mapping.find(({ metricName }) => metricName === metric);
			const label = m?.metricLabel || metric;
			return { metric, label };
		});
	}

	toggleAnalysis() {
		this.analysis = !this.analysis;
	}

	onSelected(compare: ComparedPlayer, selected, which) {
		if (which === 'left') this.leftFlag = false;
		else this.rightFlag = false;
		compare.setSelected(selected);
		// this.fetchSeasons(compare, which);
		this.fetchStats(compare, which);
	}

	onSeasonChange(compared: ComparedPlayer, which) {
		if (which === 'left') this.leftFlag = false;
		else this.rightFlag = false;
		this.setMetrics();
		this.fetchStats(compared, which);
	}

	createCompareTables() {
		const tactical = new CompareTable(this.left.selected, this.right.selected, 'tactical', this.activeTacticalMetrics);
		const physical = new CompareTable(
			this.left.selected,
			this.right.selected,
			'physical',
			this.activePerformanceMetrics
		);
		const robustness = new CompareTable(this.left.selected, this.right.selected, 'robustness');
		const offensive = new CompareTable(this.left?.selected, this.right?.selected, 'offensive');
		const defensive = new CompareTable(this.left?.selected, this.right?.selected, 'defensive');
		const attitude = new CompareTable(this.left?.selected, this.right?.selected, 'attitude');
		this.tables = [tactical, physical, robustness, offensive, defensive, attitude];
	}

	downloadReport() {
		const t = this.translate.instant.bind(this.translate);

		const left = this.left.toReport(t, this.azureUrlPipe, this.millionsPipe, this.numberPipe, this.sportType);
		const right = this.right.toReport(t, this.azureUrlPipe, this.millionsPipe, this.numberPipe, this.sportType);

		this.report
			.getImages([left.image, right.image])
			.pipe(untilDestroyed(this))
			.subscribe(images => {
				const data = {
					left: { ...left, image: images[0] },
					right: { ...right, image: images[1] },
					tables: this.tables.map(table => table.export(t))
				};
				this.report.getReport('profile_compare', data);
			});
	}

	// This switch includes and excludes archived players from both left and right list of players in comparison.
	switchArchivedPlayer(event) {
		this.isArchived = event.checked;
		this.fetchPlayers();
	}
}

import { DecimalPipe } from '@angular/common';
import { Component, Injector, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Customer,
	DeviceMetricDescriptor,
	Event,
	EventApi,
	Match,
	Player,
	ProfilePlayersApi,
	TeamSeason
} from '@iterpro/shared/data-access/sdk';
import { CapitalizePipe } from '@iterpro/shared/ui/pipes';
import {
	CompetitionsConstantsService,
	ErrorService,
	PRIMARIES,
	copyValue,
	getDataLabels,
	getDefaultCartesianConfig,
	getMomentFormatFromStorage,
	sortByDate,
	getTeamSettings
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { MegaMenuItem, MenuItem } from 'primeng/api';
import { ContextMenu } from 'primeng/contextmenu';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { SeasonStoreSelectors, TeamType } from 'src/app/+state';
import { RootStoreState } from 'src/app/+state/root-store.state';
import { MultiSelectChangeEvent } from 'primeng/multiselect';

@UntilDestroy()
@Component({
	selector: 'iterpro-game-stats',
	templateUrl: './game-stats.component.html',
	styleUrls: ['./game-stats.component.css']
})
export class GameStatsComponent extends EtlBaseInjectable implements OnInit, OnDestroy, OnChanges {
	@Input() player: Player;
	@Input() customer: Customer;
	@Input() seasons: TeamSeason[];

	isNationalClub$: Observable<boolean>;

	yAxesIds = ['y', 'yB'];
	yAxisPositions = ['left', 'right'];

	tableMatches: any[] = [];
	options: ChartOptions;
	data: ChartData;
	matches: Match[] = [];

	selectedMetrics: DeviceMetricDescriptor[] = [];
	metrics: DeviceMetricDescriptor[] = [];
	labels = false;
	isOpen = -1;

	private selectedSeason: TeamSeason;

	panelIndex: TeamType = TeamType.PRIMARY;

	// items: MenuItem[] = [];
	selectedMatch: Match;

	constructor(
		private store$: Store<RootStoreState>,
		private translate: TranslateService,
		private error: ErrorService,
		private profilePlayersService: ProfilePlayersApi,
		private capitalize: CapitalizePipe,
		private currentTeamService: CurrentTeamService,
		private eventApi: EventApi,
		private decimalPipe: DecimalPipe,
		private competitionService: CompetitionsConstantsService,
		private router: Router,
		injector: Injector
	) {
		super(injector);
	}

	ngOnDestroy() {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['player'] && this.player) {
			this.init();
		}
	}

	ngOnInit() {
		this.translate.getTranslation(this.translate.currentLang).subscribe();
	}

	private init() {
		// TODO: when Wyscout integration is developed restore the store$.select
		this.isNationalClub$ = this.store$.select(AuthSelectors.selectIsNationalClub);
		this.store$
			.select(SeasonStoreSelectors.selectDefault)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (value: TeamSeason) => this.handleSeasonSelect({ value }),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	handleTabChange({ index }: { index: TeamType }) {
		this.panelIndex = index;
		this.handleSeasonSelect({ value: null });
	}

	handleSeasonSelect({ value }: { value: TeamSeason }) {
		this.selectedMetrics = [];
		this.selectedSeason = value ? value : this.currentTeamService.getCurrentSeason();
		this.getData()
			.pipe(first())
			.subscribe({
				next: results => {
					const _playerStats = results.avgMetrics;
					this.matches = sortByDate(results.matches, 'date').reverse();
					this.tableMatches = [
						{ name: 'average', _playerStats, pmstats: _playerStats },
						...this.matches.map(match => ({
							...match,
							menuItems: this.getMenuItem(match)
						}))
					];
					this.getMetrics();
					this.getMatchVideos(this.matches);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	handleMetricsSelect(metric: any) {
		this.selectedMetrics = metric.value;
		metric.originalEvent.originalEvent.preventDefault();
		if (this.selectedMetrics.length > 2) this.selectedMetrics = this.selectedMetrics.slice(0, 2);
		this.render(this.selectedMetrics);
	}

	onToggleLabels() {
		this.labels = !this.labels;
		const temp = copyValue(this.data);
		this.data.datasets.forEach((dataset: any) => {
			dataset.datalabels = getDataLabels(this.labels);
		});
		this.data = copyValue(temp);
	}

	getMetricValue(stats: any[], metric: string): string | number {
		return stats && stats[metric] !== undefined && stats[metric] !== null
			? this.decimalPipe.transform(stats[metric], '1.0-1')
			: '-';
	}

	getMatchDate(rowData: any): string {
		return moment(rowData.date).format(getMomentFormatFromStorage());
	}

	getMatchInfo(rowData: Event, index: number, type: string): string {
		return type === 'primary'
			? `Match ${index} vs ${rowData.opponent || '-'} (${this.translate.instant(rowData.home ? 'home' : 'away')}) ${rowData.result || ''}`
			: `Match ${index}: ${rowData.clubGameHomeTeam || '-'} vs ${rowData.clubGameAwayTeam || '-'} ${rowData.result || ''}`;
	}

	getMatchOpponent(rowData: Event, type: string): string {
		return type === 'primary'
			? rowData.opponent || '-'
			: `${rowData.clubGameHomeTeam || '-'} vs ${rowData.clubGameAwayTeam || '-'}`;
	}

	getMatchHomeOrAway(rowData: Event, type: string): string {
		return type === 'primary' ? this.translate.instant(rowData.home ? 'home' : 'away') : '-';
	}

	getMatchResult(rowData: Event): string {
		return rowData.result || '-';
	}

	getMatchCompetition(rowData: Event): string {
		const competition =
			rowData.subformat === 'friendly' || rowData.subformat === 'nationalLeague' || rowData.subformat === 'nationalCup'
				? { name: this.translate.instant(rowData.subformat) }
				: this.competitionService.getCompetitionFromJson(rowData.subformat);
		return `${competition?.name || ''}`;
	}

	getPointClass(data: Event): string {
		return data.resultFlag === false ? 'RED' : !data.resultFlag ? 'GREY' : 'GREEN';
	}

	setOpenPlayer(event: MouseEvent, match: Match, menu: ContextMenu) {
		event.stopPropagation();
		this.selectedMatch = match;
		menu.show(event);
	}

	private getMenuItem(event: Match) {
		return [
			{
				id: 'eventDetails',
				label: this.translate.instant('eventDetails'),
				icon: '',
				routerLink: [
					'/manager/planning',
					{
						id: event.eventId,
						start: moment(event.date).startOf('month').toDate()
					}
				]
			},
			{
				id: 'matchAnalysis',
				label: this.translate.instant('matchAnalysis'),
				icon: '',
				routerLink: [
					'/manager/tactics',
					{
						id: event.eventId
					}
				]
			},
			{
				id: 'sessionAnalysis',
				label: this.translate.instant('navigator.sessionAnalysis'),
				icon: '',
				routerLink: [
					'/performance/session-analysis',
					{
						session_id: event.eventId
					}
				]
			},
			{
				id: 'workloadAnalysis',
				label: this.translate.instant('workloadAnalysis'),
				icon: '',
				routerLink: [
					'/performance/workload-analysis',
					{
						id: event.eventId
					}
				]
			},
			{
				id: 'videogallery',
				label: this.translate.instant('navigator.videogallery'),
				icon: '',
				routerLink: [
					'/manager/video-gallery',
					{
						id: event.eventId,
						from: 'gameEvent'
					}
				]
			}
		];
	}

	downloadCSV(type: string) {
		const csvRows = this.tableMatches.map((match, index) => {
			const mapped = {
				date: index === 0 ? '' : this.getMatchDate(match),
				opponent: index === 0 ? 'average' : this.getMatchOpponent(match, type),
				competition: index === 0 ? '' : this.getMatchCompetition(match),
				home: index === 0 ? '' : this.getMatchHomeOrAway(match, type),
				result: index === 0 ? '-' : match.resultFlag === false ? 'lost' : !match.resultFlag ? 'draw' : 'won',
				minutesPlayed: this.getMetricValue(match.pmstats, 'minutesPlayed')
			};
			this.metrics.forEach(metric => {
				mapped[metric.metricName] = this.getMetricValue(match._playerStats, metric.metricName);
			});
			return mapped;
		});
		const results = Papa.unparse(csvRows, {});
		const fileName = `${this.player.displayName} - Game Stats - Season ${this.selectedSeason.name}.csv`;
		const blob = new Blob([results], { type: 'text/csv;charset=utf-8' });
		saveAs(blob, fileName);
	}

	private getMetrics() {
		this.metrics = getTeamSettings(
			this.customer.teamSettings,
			this.currentTeamService.getCurrentTeam().id
		).metricsIndividualTactical.map(metric =>
			this.etlPlayerService.getMetricsMapping().find(({ metricName }) => metricName === metric)
		);
		this.selectedMetrics = [...this.selectedMetrics, this.metrics[0]];
		this.render(this.selectedMetrics);
	}

	private withMetrics(service, metrics) {
		const mapping = service.getMetricsMapping();
		return metrics.map(metric => {
			const m = mapping.find(({ metricName }) => metricName === metric);
			return m.metricName;
		});
	}

	private getData() {
		return this.profilePlayersService.profileGameStats(
			this.selectedSeason.id,
			this.player.id,
			this.selectedSeason.offseason,
			this.selectedSeason.inseasonEnd,
			this.withMetrics(
				this.etlPlayerService,
				getTeamSettings(this.customer.teamSettings, this.currentTeamService.getCurrentTeam().id)
					.metricsIndividualTactical
			),
			this.panelIndex === TeamType.PRIMARY
		);
	}

	private render(metrics) {
		this.labels = false;
		this.options = this.getChartOptions(metrics, this.matches);
		this.data = this.getChartData(metrics);
	}

	private getChartOptions(metrics, matches) {
		const options: any = {
			...getDefaultCartesianConfig(),
			responsive: true
		};

		let axes = {};
		Object.keys(metrics).forEach((x, index) => {
			axes = {
				...axes,
				[this.yAxesIds[index]]: {
					id: this.yAxesIds[index],
					type: 'linear',
					position: this.yAxisPositions[index],
					grid: {
						drawBorder: false,
						color: index === 0 ? '#333333' : 'transparent',
						display: index === 0
					},
					ticks: {
						beginAtZero: true,
						callback: value => {
							if (value % 1 === 0) {
								return value;
							}
						},
						color: '#ddd',
						padding: 15
					},
					// suggestedMax: 100,
					stacked: false
				}
			};
		});

		options.scales = {
			...options.scales,
			...axes
		};

		options.plugins.tooltip = {
			mode: 'index',
			intersect: false,
			callbacks: {
				title: ([{ dataIndex }, ...{}]) => {
					return `${moment(matches[dataIndex].date).format(getMomentFormatFromStorage())} - ${
						matches[dataIndex].opponent
					} ${matches[dataIndex].result} (${matches[dataIndex].home === true ? 'H' : 'A'})`;
				}
				// afterLabel: tooltipItem => {
				// 	const percent = tooltipItem.dataset['data'][tooltipItem.dataIndex];
				// 	return `Game %: ${percent}%`;
				// }
			}
		};

		return options;
	}

	private getChartData(metrics) {
		let datasets = [];
		const categories = this.matches.map((x, index) => index + 1);

		metrics.forEach(({ metricLabel, metricName }, index) => {
			const data = this.matches.map(match => {
				return match._playerStats && match._playerStats[metricName] ? match._playerStats[metricName] : null;
			});
			datasets = [
				...datasets,
				{
					label: this.capitalize.transform(metricLabel),
					data,
					yAxisID: this.yAxesIds[index],
					borderColor: PRIMARIES[index],
					pointBorderColor: PRIMARIES[index],
					pointBackgroundColor: PRIMARIES[index],
					pointHoverBackgroundColor: PRIMARIES[index],
					pointHoverBorderColor: '#fff',
					pointRadius: 2,
					borderWidth: 2,
					spanGaps: true,
					cubicInterpolationMode: 'monotone'
				}
			];
		});

		return { labels: categories, datasets };
	}

	private getMatchVideos(matches: any[]) {
		const options = {
			where: {
				teamId: this.currentTeamService.getCurrentTeam().id,
				id: { inq: matches.map(({ eventId }) => eventId) },
				_video: { ne: null }
			},
			fields: { _video: true, id: true }
		};

		this.eventApi
			.find(options)
			.pipe(first())
			.subscribe((events: Array<Pick<Event, 'id' | '_video'>>) => {
				events.forEach(event => {
					const videoMatch = matches.find(match => match.eventId === event.id);
					videoMatch.video = event._video;
				});
			});
	}

	private redirectTo(url: string, params: any) {
		this.router.navigate([...url, params]);
	}
}

import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Injector, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Club, Player, Team, TeamSeason, TeamSeasonApi, UtilsApi } from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	ErrorService,
	PRIMARIES,
	ReportService,
	getDefaultPieConfig,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty } from 'lodash';
import { SelectItem } from 'primeng/api';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { RootStoreState } from 'src/app/+state/root-store.state';
import { getReport } from '../utils/report';

@UntilDestroy()
@Component({
	selector: 'iterpro-admin-dashboard-team',
	templateUrl: './admin-dashboard-team.component.html',
	styleUrls: ['./admin-dashboard-team.component.css'],
	providers: [DecimalPipe]
})
export class AdminDashboardTeamComponent extends EtlBaseInjectable implements OnInit, OnChanges {
	@Input() team: Team;
	@Input() teams: any[];
	@Input() selectedPlayerId: any;
	@Output() onBack: EventEmitter<any> = new EventEmitter<any>();

	selectedSeason: TeamSeason;
	players: Player[];
	teamData: any;
	dataPlayerSquad: any;
	dataSeason: any;
	dataMedical: any;
	optionsPlayerSquad: any;
	optionsSeason: any;
	optionsMedical: any;

	plugins = [
		{
			beforeDraw: chart => {
				if (chart.config.options.elements.center) {
					const ctx = chart.ctx;
					const centerConfig = chart.config.options.elements.center;
					const fontStyle = centerConfig.fontStyle || 'Gotham';
					const txt = centerConfig.text;
					const color = centerConfig.color || '#000';
					const sidePadding = centerConfig.sidePadding || 20;
					const sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2);
					ctx.font = '30px ' + fontStyle;
					const stringWidth = ctx.measureText(txt).width;
					const elementWidth = chart.innerRadius * 2 - sidePaddingCalculated;
					const widthRatio = elementWidth / stringWidth;
					const newFontSize = Math.floor(30 * widthRatio);
					const elementHeight = chart.innerRadius * 2;
					const fontSizeToUse = Math.min(newFontSize, elementHeight);
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
					const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
					ctx.font = '2.5vw ' + fontStyle;
					ctx.fillStyle = color;
					ctx.fillText(txt, centerX, centerY);
				}
			}
		}
	];

	paletteSeason = ['#008000', '#ffff00', '#ff0000'];

	paletteBorder = [
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)',
		'rgba(0, 0, 0, 0.6)'
	];
	selectedPlayer: Player;
	currency: string;
	sportType: string;
	club: Club;
	playerData: any;

	constructor(
		injector: Injector,
		private store$: Store<RootStoreState>,
		private reportService: ReportService,
		private error: ErrorService,
		public translate: TranslateService,
		private alert: AlertService,
		public currentTeamService: CurrentTeamService,
		private teamSeasonApi: TeamSeasonApi,
		private utils: UtilsApi
	) {
		super(injector);
		this.store$
			.select(AuthSelectors.selectSportType)
			.pipe(
				map((type: string) => {
					this.sportType = type;
				})
			)
			.subscribe();
		this.store$
			.select(AuthSelectors.selectClub)
			.pipe(
				map((club: Club) => {
					this.club = club;
				})
			)
			.subscribe();
	}

	ngOnInit() {
		this.translate.getTranslation(this.translate.currentLang).subscribe();
		this.currency = this.currentTeamService.getCurrency();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['team'] && this.team) {
			this.extractSeason();
		}
	}

	isEmpty(data) {
		return isEmpty(data);
	}

	resync() {
		this.utils
			.invalidateCache('AdminDashboard')
			.pipe(
				untilDestroyed(this),
				switchMap(() => this.getTeamStatistics())
			)
			.subscribe({
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private extractSeason() {
		if (isEmpty(this.team.teamSeasons)) {
			return this.alert.notify('warn', 'Admin Dashboard', 'alert.noSeasonsFound');
		} else {
			this.selectedSeason = this.currentTeamService.extractSeason(this.team.teamSeasons);
			if (this.selectedSeason) {
				this.getData();
			} else return this.alert.notify('warn', 'Amin Dashboard', 'alert.noSeasonsFound');
		}
	}

	private getData() {
		this.getTeamStatistics()
			.pipe(untilDestroyed(this))
			.subscribe({
				error: (error: Error) => this.error.handleError(error)
			});
		this.getPlayers(this.selectedSeason);
	}

	private getTeamStatistics(): Observable<any> {
		return this.teamSeasonApi.getAdministrationDashboardData(this.selectedSeason.id).pipe(
			map(results => (this.teamData = results)),
			tap(() => {
				this.extractResults();
				this.renderCharts();
			})
		);
	}

	private getPlayers(season) {
		this.teamSeasonApi
			.getPlayers(season.id, {
				fields: [
					'name',
					'lastName',
					'displayName',
					'id',
					'teamId',
					'downloadUrl',
					'archived',
					'birthDate',
					'nationality',
					'height',
					'weight',
					'jersey',
					'foot',
					'contractEnd',
					'valueField',
					'value',
					'transfermarktValue',
					'clubValue',
					'agentValue',
					'position',
					'position2',
					'position3'
				]
			})
			.pipe(
				map((results: Player[]) => {
					this.players = results;
					if (this.selectedPlayerId) {
						const found = this.players.find(({ id }) => id === this.selectedPlayerId);
						if (found) this.selectedPlayer = found;
					}
				}),
				untilDestroyed(this)
			)
			.subscribe({
				error: (error: Error) => this.error.handleError(error)
			});
	}

	onSelectTeam(event) {
		this.team = event.value;
		this.extractSeason();
	}

	onSelectSeason() {
		if (this.selectedPlayer && !this.selectedSeason.playerIds.includes(this.selectedPlayer.id)) {
			this.selectedPlayer = null;
			this.alert.notify('warn', 'Amin Dashboard', 'alert.season.noPlayer');
		}
		this.getData();
	}

	onSelectPlayer(playerId: string) {
		this.selectedPlayer = this.players.find(({ id }) => id === playerId);
		if (this.selectedPlayer) this.getPlayerData();
	}

	private getPlayerData() {
		this.teamSeasonApi
			.getAdministrationDashboardDataForPlayer(
				this.selectedSeason.id,
				this.selectedPlayer.id,
				this.etlPlayerService.getDurationField().metricName
			)
			.pipe(
				map(results => (this.playerData = results)),
				untilDestroyed(this)
			)
			.subscribe({ error: (error: Error) => this.error.handleError(error) });
	}

	backToTeam() {
		this.selectedPlayer = null;
	}

	playerReport() {
		const data = getReport(this, this.playerData, this.selectedPlayer);
		forkJoin([of(data), this.reportService.getImage(data.image)])
			.pipe(
				map(([data, image]) =>
					this.reportService.getReport('admin_player_2', { ...data, image }, 'positions.headCoach')
				),
				untilDestroyed(this)
			)
			.subscribe({
				error: (error: Error) => {
					this.error.handleError(error);
				}
			});
	}

	// Message displayed when no team season found.
	getMessageForNoTeamSeasons() {
		if (this.players && this.players.length === 0) {
			return this.translate.instant('information.empty.player.list');
		} else if (this.team.teamSeasons && this.team.teamSeasons.length > 0) {
			return this.translate.instant('information.teamSeason.notAvailable');
		} else {
			return this.translate.instant('information.teamSeason.notAvailableToday');
		}
	}

	// Redirecting to club setting if teamseason or player in team season not found.
	getClubSettingsLink() {
		const url = '/settings/club-preferences/general';
		const params = {};
		return [url, params];
	}

	// The text is dispalayed when a) No team season found or b) Team season found but no player in it.
	getRedirectText() {
		return this.translate.instant('redirect.to.clubsettings.text');
	}

	private extractResults() {
		this.teamData.fixtures.forEach(x => {
			x['homeScore'] = x.result ? Number(x.result.split('-')[0]) : '-';
			x['awayScore'] = x.result ? Number(x.result.split('-')[1]) : '-';
		});
		this.teamData.nextFixtures.forEach(x => {
			x['homeScore'] = '-';
			x['awayScore'] = '-';
		});
		this.teamData.fixtures = [...this.teamData.nextFixtures, ...this.teamData.fixtures];
	}

	private renderCharts() {
		[this.dataPlayerSquad, this.optionsPlayerSquad] = this.getChartPlayerSquad();
		[this.dataSeason, this.optionsSeason] = this.getChartSeason();
		[this.dataMedical, this.optionsMedical] = this.getChartMedical();
	}

	private getChartSeason() {
		const datasets = [
			{
				data: [
					Number(this.teamData.winPercentage).toFixed(0),
					Number(this.teamData.drawPercentage).toFixed(0),
					Number(this.teamData.lossesPercentage).toFixed(0)
				],
				backgroundColor: this.paletteSeason,
				borderColor: this.paletteBorder,
				borderWidth: 0,
				labels: [this.translate.instant('wins'), this.translate.instant('draws'), this.translate.instant('losses')]
			}
		];
		const data = { datasets, labels: ['wins', 'draws', 'losses'] };

		const options = this.getPieChartOptions(this.translate);
		return [data, options];
	}

	private getChartPlayerSquad() {
		const datasets = [
			{
				data: [
					Number(this.teamData.playersInSquad.abroad).toFixed(0),
					Number(this.teamData.playersInSquad.abroadExtra).toFixed(0),
					Number(this.teamData.playersInSquad.domestic).toFixed(0),
					Number(this.teamData.playersInSquad.homegrown).toFixed(0),
					Number(this.teamData.playersInSquad.notSpecified).toFixed(0)
				],
				backgroundColor: PRIMARIES,
				borderColor: this.paletteBorder,
				borderWidth: 0,
				labels: [
					this.translate.instant('nationalityOrigins.abroadCommunitary'),
					this.translate.instant('nationalityOrigins.abroadExtraCommunitary'),
					this.translate.instant('nationalityOrigins.domestic'),
					this.translate.instant('nationalityOrigins.homegrown'),
					this.translate.instant('not set')
				]
			}
		];
		const data = {
			datasets,
			labels: [
				this.translate.instant('nationalityOrigins.abroadCommunitary'),
				this.translate.instant('nationalityOrigins.abroadExtraCommunitary'),
				this.translate.instant('nationalityOrigins.domestic'),
				this.translate.instant('nationalityOrigins.homegrown'),
				this.translate.instant('not set')
			]
		};

		const options = this.getPieChartOptions(this.translate);
		options.plugins.legend = {
			position: 'right',
			labels: {
				color: '#ddd'
			}
		};
		options.elements = {
			center: {
				text: this.teamData.playersNumber,
				color: '#ddd',
				fontStyle: 'Gotham',
				sidePadding: 15
			}
		};

		return [data, options];
	}

	private getChartMedical() {
		const datasets = [
			{
				data: [
					Number(this.teamData.injuryBreakDownOveruse).toFixed(0),
					Number(this.teamData.injuryBreakDownTrauma).toFixed(0)
				],
				backgroundColor: PRIMARIES,
				borderColor: this.paletteBorder,
				borderWidth: 0,
				labels: [this.translate.instant('overuse'), this.translate.instant('trauma')]
			}
		];
		const data = { datasets, labels: ['overuse', 'trauma'] };

		const options = this.getPieChartOptions(this.translate);
		options.elements = {
			center: {
				text: this.teamData.totalInjuries,
				color: '#ddd',
				fontStyle: 'Gotham',
				sidePadding: 15
			}
		};
		return [data, options];
	}

	private getPieChartOptions(translate: TranslateService) {
		const options = {
			...getDefaultPieConfig(),
			responsive: true,
			maintainAspectRatio: true,
			cutout: '75%'
		};
		options.plugins.legend = {
			display: false
		};
		options.plugins.tooltip = {
			callbacks: {
				label: ({ label, formattedValue }) => `${translate.instant(label)}: ${Number(formattedValue).toFixed(0)}%`
			}
		};
		options.plugins.datalabels = {
			...options.plugins.datalabels,
			formatter: (value, context) => `${Math.round(value)}%`,
			display: context => context.dataset.data[context.dataIndex] > 0,
			font: {
				weight: 'bold',
				size: 12
			}
		};

		return options;
	}
}

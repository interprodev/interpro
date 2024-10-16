import { DecimalPipe } from '@angular/common';
import { Component, Injector, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Player, Team, TeamApi, TeamSeason, UtilsApi } from '@iterpro/shared/data-access/sdk';
import {
	ErrorService,
	PRIMARIES,
	ReportService,
	getMomentFormatFromStorage,
	getDefaultCartesianConfig,
	getDefaultPieConfig,
	hexToRgbA
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { Align, Anchor, Font } from 'chartjs-plugin-datalabels/types/options';
import moment from 'moment';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { FinancialDashboardPlayerComponent } from './financial-dashboard-player/financial-dashboard-player.component';
import {
	ContractData,
	ContractExpiring,
	ContractTypes,
	InvestmentPerformance,
	OfflinePlayerData,
	TotalSquadValue
} from './models/financial-dashboard.model';
import getReport from './report';
import { DropdownChangeEvent } from 'primeng/dropdown';

@UntilDestroy()
@Component({
	selector: 'iterpro-financial-dashboard',
	templateUrl: './financial-dashboard.component.html',
	styleUrls: ['./financial-dashboard.component.css']
})
export class FinancialDashboardComponent extends EtlBaseInjectable implements OnInit, OnChanges {
	@ViewChild(FinancialDashboardPlayerComponent, { static: false })
	child: FinancialDashboardPlayerComponent;

	@Input() team: Team;
	@Input() selectedSeason: TeamSeason;
	@Input() players: Player[] = [];

	@BlockUI('chart') chartBlockUI: NgBlockUI;
	// @BlockUI('general') generalBlockUI: NgBlockUI;

	expiringContractsChartData: ChartData;
	expiringContractChartOptions: ChartOptions;
	contractTypesChartData: any;
	contractTypesChartOptions: ChartOptions;
	teamValuesChartData: any;
	teamValuesChartOptions: ChartOptions;
	selectedPlayer: Player = null;
	taxesFlag = true;
	currency: string;
	futureMatches = 40;
	contractExpiry: ContractExpiring;
	contractTypes: ContractTypes;
	investmentPerformance: InvestmentPerformance;
	totalSquadValue: TotalSquadValue;
	contractsData: ContractData;
	offlinePlayersData: OfflinePlayerData;
	isLoading = true;
	singlePlayerData: any;
	taxesParam: { taxes: number; vat: number };

	constructor(
		private utils: UtilsApi,
		private teamApi: TeamApi,
		private error: ErrorService,
		public decimalPipe: DecimalPipe,
		public translate: TranslateService,
		private reportService: ReportService,
		public currentTeamService: CurrentTeamService,

		injector: Injector
	) {
		super(injector);
	}

	ngOnInit() {
		this.currency = this.currentTeamService.getCurrency();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['selectedSeason'] && this.selectedSeason) {
			this.getData();
		}
	}

	onResync() {
		this.isLoading = true;
		this.utils
			.invalidateCache('Financial')
			.pipe(
				untilDestroyed(this),
				switchMap(() => this.getTeamFinancialOverview())
			)
			.subscribe({
				next: () => this.updateChart(),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	onSelectPlayer(playerId: string) {
		this.selectedPlayer = this.players.find(({ id }) => id === playerId);
		this.singlePlayerData = this.selectedPlayer ? this.offlinePlayersData[this.selectedPlayer.id] : null;
	}

	backToTeam() {
		this.selectedPlayer = null;
		this.singlePlayerData = null;
	}

	getTeamReport() {
		const data = getReport(this);
		this.reportService.getReport('admin_finance_overview_1-0', data);
	}

	getPlayerReport() {
		this.child.getPlayerReport();
	}

	updateChart() {
		this.getContractExpiringChart(this.contractExpiry);
		this.getContractTypesChart(this.contractTypes);
		this.getTeamValueChart(this.taxesFlag ? this.totalSquadValue.roleValuesGross : this.totalSquadValue.roleValues);
	}

	// get dashboard data when selecting a season from parent component
	private getData() {
		this.isLoading = true;
		this.getTeamFinancialOverview().subscribe({
			next: () => this.updateChart(),
			error: (error: Error) => this.error.handleError(error)
		});
	}

	private getTeamFinancialOverview(): Observable<any> {
		return this.teamApi
			.getFinancialOverview(
				this.team.id,
				this.selectedSeason.id,
				this.etlPlayerService.getDurationField().metricName,
				this.futureMatches
			)
			.pipe(
				map((results: any) => {
					this.contractExpiry = results.contractExpiry;
					this.contractTypes = results.contractTypes;
					this.contractsData = results.contractsData;
					this.investmentPerformance = results.investmentPerformance;
					this.totalSquadValue = results.totalSquadValue;
					this.offlinePlayersData = results.offlinePlayersData;
					if (this.selectedPlayer) this.singlePlayerData = this.offlinePlayersData[this.selectedPlayer.id];
				}),
				tap(() => (this.isLoading = false)),
				untilDestroyed(this)
			);
	}

	private getContractExpiringChart({ contractsEndPerYear: chartData }: any) {
		const options = {
			...getDefaultCartesianConfig()
		};
		(options.scales.x as any).stacked = true;
		(options.scales.y as any).stacked = true;
		options.plugins.legend.position = 'bottom';
		options.plugins.datalabels = this.getDatalabels();

		let inTeam = [];
		let inTeamOnLoan = [];
		let trial = [];

		const categories = Object.keys(chartData);
		const labels =
			chartData && categories && Object.values(chartData).length > 0 ? Object.keys(Object.values(chartData)[0]) : [];

		Object.values(chartData).forEach((x, i) => {
			inTeam = [...inTeam, x['inTeam']];
			inTeamOnLoan = [...inTeamOnLoan, x['inTeamOnLoan']];
			trial = [...trial, x['trial']];
		});

		let datasets = [];
		datasets = [
			{
				data: inTeam,
				type: 'bar',
				yAxisID: 'y',
				label: this.translate.instant('admin.contracts.type.' + labels[0]),
				backgroundColor: PRIMARIES[0],
				borderColor: PRIMARIES[0],
				hoverBackgroundColor: PRIMARIES[0],
				hoverBorderColor: PRIMARIES[0]
			},
			{
				data: inTeamOnLoan,
				type: 'bar',
				yAxisID: 'y',
				label: this.translate.instant('admin.contracts.type.' + labels[1]),
				backgroundColor: PRIMARIES[1],
				borderColor: PRIMARIES[1],
				hoverBackgroundColor: PRIMARIES[1],
				hoverBorderColor: PRIMARIES[1]
			},
			{
				data: trial,
				type: 'bar',
				yAxisID: 'y',
				label: this.translate.instant('admin.contracts.type.' + labels[2]),
				backgroundColor: PRIMARIES[2],
				borderColor: PRIMARIES[2],
				hoverBackgroundColor: PRIMARIES[2],
				hoverBorderColor: PRIMARIES[2]
			}
		];

		this.expiringContractChartOptions = options;
		this.expiringContractsChartData = {
			labels: categories,
			datasets
		};
	}

	private getTeamValueChart(chartData: any) {
		const options = {
			...getDefaultCartesianConfig()
		};
		options.plugins.legend.display = false;
		options.plugins.datalabels = this.getDatalabels();

		if (chartData) {
			const categories = Object.keys(chartData).map(x => this.translate.instant(x));
			const data = {
				labels: categories,
				datasets: [
					{
						data: Object.values(chartData).map(x => Number(x).toFixed(1)),
						type: 'bar',
						yAxisID: 'y',
						backgroundColor: PRIMARIES,
						borderColor: PRIMARIES,
						hoverBackgroundColor: PRIMARIES,
						hoverBorderColor: PRIMARIES
					}
				]
			};
			this.teamValuesChartOptions = options;
			this.teamValuesChartData = data;
		}
	}

	private getContractTypesChart(chartData: any) {
		if ('null' in chartData) delete chartData.null;
		const datasets = [
			{
				data: Object.values(chartData),
				backgroundColor: PRIMARIES,
				borderWidth: 0,
				labels: Object.keys(chartData).map(x => this.translate.instant('admin.contracts.type.' + x))
			}
		];
		const data = {
			datasets,
			labels: Object.keys(chartData).map(x => this.translate.instant('admin.contracts.type.' + x))
		};
		const options = {
			...getDefaultPieConfig(),
			cutout: '75%'
		};
		options.plugins.legend.position = 'bottom';
		options.plugins.legend.labels.font = { color: '#ddd' };
		options.plugins.datalabels.display = context => context.dataset.data[context.dataIndex] > 0;
		options.plugins.datalabels.font = {
			weight: 'bold',
			size: 12
		};

		this.contractTypesChartOptions = options;
		this.contractTypesChartData = data;
	}

	private getDatalabels() {
		return {
			align: 'start' as Align,
			anchor: 'end' as Anchor,
			font: {
				weight: 'bold'
			} as Font,
			color: data => {
				const rgb = hexToRgbA(
					Array.isArray(data.dataset.backgroundColor)
						? data.dataset.backgroundColor[data.dataIndex]
						: data.dataset.backgroundColor
				);
				const threshold = 140;
				const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
				return luminance > threshold ? '#333333' : '#dddddd';
			},
			display: context => {
				return context.dataset.data[context.dataIndex] > 0;
			}
		};
	}

	getArchiveTooltip(player: Player): string {
		return `${this.translate.instant('admin.squads.player.archivedDate')} ${moment(player.archivedDate).format(
			getMomentFormatFromStorage()
		)}`;
	}
}

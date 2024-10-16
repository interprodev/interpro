import { DecimalPipe } from '@angular/common';
import { Component, Injector, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Player, PlayerApi, Team, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import {
	AlertService,
	ErrorService,
	PRIMARIES,
	ReportService,
	getDefaultCartesianConfig
} from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ChartData } from 'chart.js';
import * as moment from 'moment';
import { DifferencePipe } from 'ngx-moment';
import { SelectItem } from 'primeng/api';
import { map, tap } from 'rxjs/operators';
import { OfflinePlayerData } from '../models/financial-dashboard.model';
import getReport from './report';

@UntilDestroy()
@Component({
	selector: 'iterpro-financial-dashboard-player',
	templateUrl: './financial-dashboard-player.component.html',
	styleUrls: ['./financial-dashboard-player.component.css'],
	providers: [ShortNumberPipe, DecimalPipe, DifferencePipe]
})
export class FinancialDashboardPlayerComponent extends EtlBaseInjectable implements OnInit, OnChanges {
	@Input() player: Player;
	@Input() team: Team;
	@Input() taxesFlag: boolean;
	@Input() season: TeamSeason;
	@Input() offlinePlayerData: OfflinePlayerData;
	alerts: any[] = [];
	thresholdsAlertsSettings: any[] = [];
	futureMatches = 40;
	pastValuesChartData: ChartData;
	pastValuesChartOptions: any;
	investmentPerformanceChartData: ChartData;
	investmentPerformanceChartOptions: any;
	currency: string;
	settingLossesByInjuries: number[] = [];
	settingRoi: number[] = [];
	analysisModes: SelectItem[] = [
		{ value: 'currentSeason', label: 'financial.dashboard.params.currentSeason' },
		{ value: 'currentContract', label: 'financial.dashboard.params.currentContract' },
		{ value: 'history', label: 'financial.dashboard.params.history' }
	];
	selectedMode = 'currentSeason';
	isLoading = false;
	showParams = false;

	constructor(
		private error: ErrorService,
		private playerApi: PlayerApi,
		public decimalPipe: DecimalPipe,
		public translate: TranslateService,
		private shortNumber: ShortNumberPipe,
		private reportService: ReportService,
		private notificationService: AlertService,
		public currentTeamService: CurrentTeamService,
		injector: Injector
	) {
		super(injector);
	}

	ngOnInit() {
		this.currency = this.currentTeamService.getCurrency();
		this.translate.getTranslation(this.translate.currentLang).subscribe({
			next: () => {
				this.analysisModes.forEach(value => (value.label = this.translate.instant(value.label)));
			}
		});
	}

	ngOnChanges(changes: SimpleChanges) {
		if ((changes['player'] && this.player) || (changes['offlinePlayerData'] && this.offlinePlayerData)) {
			this.selectedMode = 'currentSeason';
			this.renderPastValuesChart(this.offlinePlayerData?.pastValues);
			this.renderInvestmentPerformanceChart(this.offlinePlayerData);
			this.setThresholdsAlerts(this.offlinePlayerData);
		}
		if (changes['team'] && this.team) {
			this.settingLossesByInjuries = (this.team['currentTeamSettings'].notificationFinancialLossesByInjury || []).reverse();
			this.settingRoi = (this.team['currentTeamSettings'].notificationFinancialRoi || []).reverse();
		}
	}

	onParamsChange() {
		this.notificationService.notify('info', 'Finance', 'Calculating new data...', true);
		this.isLoading = true;
		this.playerApi
			.getInvestmentPerformance(
				this.player.id,
				this.selectedMode,
				this.etlPlayerService.getDurationField().metricName,
				this.futureMatches
			)
			.pipe(
				map(results => (this.offlinePlayerData = { ...this.offlinePlayerData, ...results })),
				tap(() => this.renderInvestmentPerformanceChart(this.offlinePlayerData)),
				untilDestroyed(this)
			)
			.subscribe({
				next: () => {
					this.isLoading = false;
					this.notificationService.notify('success', 'Finance', 'New data available!');
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private setThresholdsAlerts({ losses, roi }) {
		this.alerts = [];
		this.player._thresholdsFinancial.forEach(({ name, value }) => {
			switch (name) {
				case 'Capital Loss': {
					const diff = this.getPercentageDiff(this.offlinePlayerData.marketValue, this.offlinePlayerData.purchaseCost);
					if (diff < value)
						this.alerts = [
							...this.alerts,
							{
								message: this.translate.instant('financial.dashboard.alerts.capitalLoss', { value })
							}
						];
					break;
				}
				case 'Capital Gain': {
					const diff = this.getPercentageDiff(this.offlinePlayerData.marketValue, this.offlinePlayerData.purchaseCost);
					if (diff > value)
						this.alerts = [
							...this.alerts,
							{
								message: this.translate.instant('financial.dashboard.alerts.capitalGain', { value })
							}
						];
					break;
				}
				case 'Losses by Injuries': {
					const diff = this.getPercentageDiff(losses, value);
					const isAbove = this.settingLossesByInjuries.reverse().find(thr => diff >= thr);
					if (isAbove)
						this.alerts = [
							...this.alerts,
							{
								message: this.translate.instant('financial.dashboard.alerts.lossesByInjuries', { value: isAbove })
							}
						];
					break;
				}
				case 'ROI': {
					const diff = this.getPercentageDiff(roi, value);
					const isAbove = this.settingRoi.reverse().find(thr => diff >= thr);
					if (isAbove)
						this.alerts = [
							...this.alerts,
							{
								message: this.translate.instant('financial.dashboard.alerts.roi', { value: isAbove })
							}
						];
					break;
				}
			}
		});
	}

	private getPercentageDiff(value: number, threshold: number): number {
		if (threshold !== 0) {
			return (value / threshold) * 100 - 100;
		} else {
			return 100;
		}
	}

	private renderPastValuesChart(pastValues: any[]) {
		this.pastValuesChartData = null;
		const values = (pastValues || []).reverse();
		this.pastValuesChartData = {
			labels: values.map(({ date }) => moment(date).toDate()),
			datasets: [
				{
					data: values.map(({ value }) => value),
					label: this.translate.instant(
						this.player.valueField ? `admin.evaluation.${this.player.valueField}` : `admin.evaluation.value`
					),
					pointHoverBorderColor: '#fff',
					borderColor: PRIMARIES[5],
					pointBorderColor: PRIMARIES[5],
					pointBackgroundColor: PRIMARIES[5],
					pointHoverBackgroundColor: PRIMARIES[5],
					cubicInterpolationMode: 'monotone',
					spanGaps: true
				}
			]
		};
		this.pastValuesChartOptions = getDefaultCartesianConfig();
		this.pastValuesChartOptions.responsive = true;
		this.pastValuesChartOptions.maintainAspectRatio = false;
		this.pastValuesChartOptions.animation = false;
		this.pastValuesChartOptions.plugins.legend.display = false;
		this.pastValuesChartOptions.scales.y.ticks.callback = (value, index, vals) =>
			`${this.currency}${this.shortNumber.transform(value, true)}`;
		this.pastValuesChartOptions.scales.x.ticks.autoSkip = true;
		this.pastValuesChartOptions.scales.x.ticks.source = 'data';
		this.pastValuesChartOptions.scales.x.type = 'time';
		this.pastValuesChartOptions.scales.x.offset = true;
		this.pastValuesChartOptions.scales.x.distribution = 'series';
		this.pastValuesChartOptions.scales.x.bounds = 'ticks';
		this.pastValuesChartOptions.scales.x.time = {
			minUnit: 'month',
			maxUnit: 'quarter',
			displayFormats: {
				month: 'MMM YY',
				quarter: 'MMM YY'
			}
		};
	}

	private renderInvestmentPerformanceChart({ roi_perc, losses_perc, untapped_perc, residualRoi_perc }) {
		const labels = [''];
		let datasets = [];

		datasets = [
			{
				data: [roi_perc],
				type: 'bar',
				barThickness: 30,
				backgroundColor: PRIMARIES[5],
				label: this.translate.instant('financial.dashboard.roi'),
				datalabels: {
					align: 'end',
					anchor: 'start'
				}
			},
			{
				data: [losses_perc],
				type: 'bar',
				barThickness: 30,
				backgroundColor: '#7030a0',
				label: this.translate.instant('financial.dashboard.losses'),
				datalabels: {
					align: 'center',
					anchor: 'center'
				}
			},
			{
				data: [untapped_perc],
				type: 'bar',
				barThickness: 30,
				backgroundColor: '#afabab',
				label: this.translate.instant('financial.dashboard.untapped'),
				datalabels: {
					align: 'center',
					anchor: 'center'
				}
			},
			{
				data: [residualRoi_perc],
				type: 'bar',
				barThickness: 30,
				backgroundColor: '#f2f2f2',
				label: this.translate.instant('financial.dashboard.residualRoi'),
				datalabels: {
					align: 'start',
					anchor: 'end'
				}
			}
		];

		this.investmentPerformanceChartData = {
			datasets,
			labels
		};

		this.investmentPerformanceChartOptions = {
			...getDefaultCartesianConfig(),
			layout: {
				padding: {
					left: -10,
					right: 0,
					top: 0,
					bottom: 25
				}
			},
			indexAxis: 'y',
			responsive: true,
			interaction: {
				intersect: false,
				mode: 'index'
			},
			scales: {
				x: {
					stacked: true,
					max: 100,
					display: false,
					ticks: {
						callback: (value, index, values) => (value % 1 === 0 && index === values.length - 1 ? value + '%' : value),
						color: '#333333',
						font: { color: '#ddd' }
					}
				},
				y: {
					stacked: true,
					display: false,
					ticks: {
						autoSkip: false,
						font: { color: '#ddd' },
						color: '#333333'
					}
				}
			}
		};

		this.investmentPerformanceChartOptions.plugins.legend.display = false;
		this.investmentPerformanceChartOptions.plugins.datalabels = this.getHorizontalBarDataLabels();
		this.investmentPerformanceChartOptions.plugins.tooltip = {
			callbacks: {
				title: () => false,
				label: tooltipItem => `${tooltipItem.dataset.label}: ${tooltipItem.formattedValue}%`
			}
		};
	}

	private getHorizontalBarDataLabels() {
		return {
			// align: 'start',
			// anchor: 'end',
			font: {
				weight: 'bold'
			},
			clamp: true,
			borderRadius: 5,
			backgroundColor: ({ datasetIndex }) => (datasetIndex < 3 ? '#f2f2f2' : '#333'),
			color: ({ datasetIndex }) => (datasetIndex < 3 ? 'black' : 'white'),
			display: context => {
				return context.dataset.data[context.dataIndex] > 0;
			},
			formatter: value => {
				return Number(value).toFixed(0) + '%';
			}
		};
	}

	toggleParamsBox() {
		this.showParams = !this.showParams;
	}

	getPlayerReport() {
		const data = getReport(this);
		this.reportService.getReport('admin_finance_overview_player', data);
	}

	getTotalInvestmentCostTooltip() {
		return `<span>${this.translate.instant('financial.tooltips.sumOf')}</span>
						<ul>
							<li>•${this.translate.instant('financial.dashboard.purchaseCost')}</li>
							<li>•${this.translate.instant('profile.contracts.agentFee')}</li>
							<li>•${this.translate.instant('financial.tooltips.salary')}</li>
							<li>•${this.translate.instant('financial.tooltips.bonus')}</li>
							<li>•${this.translate.instant('financial.tooltips.benefits')}</li>
						</ul>
						<span>${this.translate.instant('financial.tooltips.suffix')}</span>`;
	}

	getRoiTooltip() {
		return `${this.translate.instant('financial.dashboard.tooltip.roi')}<br><br>${this.translate.instant(
			'financial.dashboard.tooltip.percentageMinutes'
		)}<br><br>${this.translate.instant('financial.dashboard.tooltip.roiMinutes')}`;
	}
}

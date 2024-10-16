import { Component, Injector, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Player, Team, TeamApi, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { ErrorService, ReportService } from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import * as Papa from 'papaparse';
import { SelectItem } from 'primeng/api';
import { map } from 'rxjs/operators';
import { FinancialAnalysisCurrentComponent } from './financial-analysis-current/financial-analysis-current.component';

@UntilDestroy()
@Component({
	selector: 'iterpro-financial-analysis',
	templateUrl: './financial-analysis.component.html',
	styles: [`::ng-deep .p-datatable.p-datatable-scrollable td.p-frozen-column {
      width: 16%;}`],
	  })
export class FinancialAnalysisComponent extends EtlBaseInjectable implements OnChanges, OnInit {
	@Input() index: number;
	@Input() players: Player[];
	@Input() team: Team;
	@Input() selectedSeason: TeamSeason;
	@ViewChild(FinancialAnalysisCurrentComponent, { static: false }) financialAnalysisCurrentComponent: FinancialAnalysisCurrentComponent;
	view = 0;
	serverData: any;
	selectedPlayers: Player[] = [];
	selectedMetrics: string[] = [];
	metrics: SelectItem[] = [
		{ label: 'marketValue', value: 'marketValue' },
		{ label: 'purchaseCost', value: 'purchaseCost' },
		{ label: 'contractCost', value: 'contractCost' },
		{ label: 'totalInvestmentValue', value: 'totalInvestmentValue' },
		{ label: 'financialLossesByInjury', value: 'losses' },
		{ label: 'contractLength', value: 'contractLength' },
		{ label: 'productivity', value: 'productivity' },
		{ label: 'availability', value: 'availability' },
		{ label: 'roi', value: 'roi' },
		{ label: 'investmentPerformance', value: 'investmentPerformance' }
	];
	periodMetrics: SelectItem[] = [
		{ label: 'seasonBalance', value: 'seasonBalance' },
		{ label: 'tradingBalance', value: 'tradingBalance' },
		{ label: 'teamValue', value: 'teamValue' },
		{ label: 'teamCostForecast', value: 'teamCostForecast' }
	];
	labels: boolean;
	roa: boolean;
	metric1: string;
	metric2: string;
	metric3: string;
	order: boolean;
	isFullscreen = false;
	playerOptions: SelectItem[];
	constructor(
		private reportService: ReportService,
		private error: ErrorService,
		private translate: TranslateService,
		private teamApi: TeamApi,
		injector: Injector
	) {
		super(injector);
		this.translate.getTranslation(this.translate.currentLang).subscribe(t => {
			this.metrics = this.metrics.map(x => ({
				label: this.translate.instant(x.label),
				value: x.value
			}));
		});
	}

	ngOnInit() {
		this.selectedPlayers = this.players;
		this.playerOptions = this.players.map(value => ({ label: value.displayName, value: value }));
		this.selectedMetrics = [this.metrics[0].value];
		this.metric1 = this.metrics.find(({ value }) => value === 'productivity').value;
		this.metric2 = this.metrics.find(({ value }) => value === 'losses').value;
		this.metric3 = this.metrics.find(({ value }) => value === 'purchaseCost').value;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (
			(changes['players'] && this.players && this.index === 1) ||
			(changes['index'] && this.index === 1 && !this.serverData)
		) {
			this.getSeasonalData();
		}
	}

	getSeasonalData() {
		if (this.team.teamSeasons?.length > 0) {
			this.teamApi
				.getFinancialAnalysis(
					this.team.id,
					this.selectedSeason.id,
					this.etlPlayerService.getDurationField().metricName,
					40
				)
				.pipe(
					map(data => (this.serverData = data)),
					untilDestroyed(this)
				)
				.subscribe({
					error: (error: Error) => this.error.handleError(error)
				});
		}
	}

	onToggleBubble() {
		this.roa = !this.roa;
		if (this.roa) this.metrics.splice(this.metrics.length - 1, 1);
		else
			this.metrics = [
				...this.metrics,
				{ label: this.translate.instant('investmentPerformance'), value: 'investmentPerformance' }
			];
	}

	onToggleLabels() {
		this.labels = !this.labels;
	}

	onToggleOrder() {
		this.order = !this.order;
	}

	downloadCurrentCSV() {
		const results = [];
		const metrics = [
			'marketValue',
			'transferFee',
			'contractCost',
			'totalInvestmentValue',
			'lossesByInjury',
			'contractLength',
			'productivity',
			'availability',
			'roi',
			'investmentPerformance'
		];
		for (const keyPlayer in this.serverData) {
			if (this.serverData.hasOwnProperty(keyPlayer)) {
				const res = this.serverData[keyPlayer];
				const pl = this.playerOptions.find(x => x.value.id.toString() === keyPlayer.toString());
				if (pl) {
					const objTemp = {};
					objTemp['player'] = pl.value.displayName;
					for (const m of metrics) {
						if (m === 'contractCost') {
							let totalCost = 0;
							const obj = res[m];
							for (const val in obj) {
								totalCost += obj[val];
							}
							objTemp[m] = totalCost;
						} else if (m === 'roi') {
							const obj = res[m];
							for (const val in obj) {
								objTemp[val] = obj[val];
							}
						} else if (m === 'lossesByInjury') {
							objTemp[m] = res['losses'];
						} else if (m === 'investmentPerformance') {
							const obj = res[m];
							for (const val in obj) {
								if (val === 'losses' || val === 'roi' || val === 'residualRoi' || val === 'untapped') {
									const metricName = 'investmentPerformance: ' + val;
									objTemp[metricName] = obj[val];
								}
							}
						} else if (m === 'transferFee') {
							let totalCost = 0;
							const obj = res['purchaseCost'];
							for (const val in obj) {
								totalCost += obj[val];
							}
							objTemp[m] = totalCost;
						} else {
							objTemp[m] = res[m];
						}
					}
					results.push(objTemp);
				}
			}
		}
		const parsedResults = Papa.unparse(results, {});

		const fileName = `Financial Analysis Report.csv`;

		const contentDispositionHeader: string = 'Content-Disposition: attachment; filename=' + fileName;
		const blob = new Blob([parsedResults], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	downloadCurrentPDF(chart) {
		const metrics = this.metrics.filter(({ value }) => this.selectedMetrics.find(metric => value === metric));
		const t = this.translate.instant.bind(this.translate);
		const data = {
			title: t('financial.comparison'),
			partecipants: {
				label: t('sidebar.partecipants'),
				value: (this.selectedPlayers || []).length
			},
			showLabels: this.labels,
			analysis: {
				label: this.roa ? t('sidebar.size') : t('sidebar.analysis'),
				value: this.roa ? t(this.metric3 || ' ') : metrics.map(({ label }) => label).join(', '),
				metrics: metrics.map(({ value }) => value) || []
			},
			roa: this.roa ? true : false,
			...chart
		};
		this.reportService.getReport('admin_finance_analysis', data);
	}
}

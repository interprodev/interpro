import { DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Agent,
	Bonus,
	Club,
	ContractPersonType,
	EmploymentContract,
	Player,
	PlayerTransfer,
	TeamSeason
} from '@iterpro/shared/data-access/sdk';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import {
	AzureStoragePipe,
	ErrorService,
	ReportService,
	getMomentFormatFromStorage,
	sortByDate
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { last } from 'lodash';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { switchMap } from 'rxjs';
import { getReport } from './report';
import { AmortizationChartService } from './services/amortization-chart.service';
import { AmortizationCommonService } from './services/amortization-common.service';
import { AmortizationTableService } from './services/amortization-table.service';
const moment = extendMoment(Moment);

export interface ForecastData {
	on: Date;
	from: Date;
	to: Date;
	total: number;
	cost: number;
	agent: number;
	solidarityMechanism: number;
	valorization: number;
	bonuses: number;
	achievedBonuses: number;
	agentBonuses: number;
	agentAchievedBonuses: number;
	amortization: number;
	amortizationLength: number;
	chain: EmploymentContract[];
}

@UntilDestroy()
@Component({
	selector: 'iterpro-squads-person-amortization',
	templateUrl: './squads-person-amortization.component.html',
	styleUrls: ['./squads-person-amortization.component.css'],
	providers: [DecimalPipe, ShortNumberPipe, AmortizationChartService, AmortizationTableService]
})
export class SquadsPersonAmortizationComponent implements OnChanges, OnInit {
	@Input() personType: ContractPersonType;
	@Input() player: Player | PlayerTransfer;
	@Input() bonuses: Bonus[];
	@Input() agents: Agent[];
	@Input() seasons: TeamSeason[];
	@Input() isPurchase = false;
	@Input() club: Club;

	// LOGIC
	forecastData: ForecastData;
	private contract: EmploymentContract;
	private renewChain: EmploymentContract[] = [];
	private todayIndexMap: any;
	private achievedBonusesMap: any[] = [];
	private renewalsMap: any[] = [];
	private residualBonusesMap: any[] = [];
	private achievedPlayerBonuses: any[] = [];
	private residualPlayerBonuses: any[] = [];
	private achievedAgentBonuses: any[];
	private residualAgentBonuses: any[] = [];
	private tooltipTable: any;
	private startSeason: TeamSeason;

	// AMORTIZATION TABLE
	cols: any[] = [];
	amortization: any[] = [];
	residual: any[] = [];
	tableTotal: number;

	// CHARTS
	options: any;
	data: any;

	// VIEW VARIABLES
	currency: string;
	costFlag = true;
	solidarityFlag = true;
	valorizationFlag = false;
	agentFlag = true;
	residualBonusFlag = false;
	achievedBonusFlag = true;
	agentResidualBonusFlag = false;
	agentAchievedBonusFlag = true;
	units = [
		{ label: 'year', value: 1 },
		{ label: 'semester', value: 2 },
		{ label: 'quarter', value: 4 },
		{ label: 'month', value: 12 }
	];

	// REPORT TABLE
	selectedUnit = 1;
	amortizationToday: number;
	netBookValueToday: number;

	// OTHER
	translation: any;
	language = 'en-GB';

	constructor(
		private amortizationService: AmortizationCommonService,
		private amortizationChartService: AmortizationChartService,
		private amortizationTableService: AmortizationTableService,
		private translate: TranslateService,
		private reportService: ReportService,
		private numberPipe: DecimalPipe,
		private currentTeamService: CurrentTeamService,
		private error: ErrorService,
		private azureUrlPipe: AzureStoragePipe
	) {}

	ngOnInit() {
		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(untilDestroyed(this))
			.subscribe(res => {
				this.translation = res;
				this.language = this.translate.currentLang === 'it-IT' ? 'it-IT' : this.translate.currentLang.split('-')[0];
				this.units = this.units.map(x => ({ label: this.translate.instant(x.label), value: x.value }));
			});
		this.currency = this.currentTeamService.getCurrency();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (
			(changes['player'] || changes['seasons'] || changes['bonuses']) &&
			this.player &&
			this.seasons &&
			this.bonuses
		) {
			this.getAmortizationValues();
		}
	}

	private getAmortizationValues(): void {
		this.amortizationService
			.getEmploymentContracts(this.player.id, this.personType)
			.pipe(
				untilDestroyed(this),
				switchMap((contracts: EmploymentContract[]) => {
					this.contract = this.amortizationService.getCurrentContract(contracts);
					return this.amortizationService.getForecastData(this.isPurchase, this.player.id, this.personType);
				})
			)
			.subscribe({
				next: (data: ForecastData) => this.recalculateForecast(data),
				error: error => this.error.handleError(error)
			});
	}

	private resetData(): void {
		this.data = null;
		this.amortization = [];
		this.residual = [];
		this.cols = [];
		this.renewalsMap = [];
		this.achievedBonusesMap = [];
		this.residualBonusesMap = [];
		this.amortizationService.resetData();
	}

	recalculateForecast(data: ForecastData): void {
		this.resetData();
		this.forecastData = data;
		this.startSeason = this.amortizationService.getSeasonForDate(
			moment.min([moment(this.forecastData.on), moment(this.forecastData.from)]).toDate(),
			this.seasons
		);
		this.renewChain = this.forecastData.chain;
		this.forecastData.bonuses = this.amortizationService.getBonusAmount(this.bonuses, false, false);
		this.forecastData.achievedBonuses = this.amortizationService.getBonusAmount(this.bonuses, true, false);
		this.forecastData.agentBonuses = this.amortizationService.getBonusAmount(this.bonuses, false, true);
		this.forecastData.agentAchievedBonuses = this.amortizationService.getBonusAmount(this.bonuses, true, true);

		if (this.contract) {
			if (this.renewChain && this.renewChain.length) {
				this.tableTotal = Number(
					(this.costFlag && this.forecastData.cost) +
						(this.agentFlag && this.forecastData.agent) +
						(this.valorizationFlag && this.forecastData.valorization) +
						(this.solidarityFlag && this.forecastData.solidarityMechanism)
				);

				this.forecastData.total =
					this.tableTotal +
					(this.residualBonusFlag && this.forecastData.bonuses) +
					(this.achievedBonusFlag && this.forecastData.achievedBonuses) +
					(this.agentResidualBonusFlag && this.forecastData.agentBonuses) +
					(this.agentAchievedBonusFlag && this.forecastData.agentAchievedBonuses);

				this.forecastData.amortization = Number(
					(this.forecastData.total / (this.forecastData.amortizationLength * this.selectedUnit)).toFixed(0)
				);
				const days = moment(last(this.renewChain).dateTo).diff(moment(this.renewChain[0].dateFrom), 'days', true);
				let daysToday = moment().diff(moment(this.renewChain[0].dateFrom), 'days', true);
				if (daysToday > days) daysToday = days;
				this.amortizationToday = Number((this.forecastData.total / days) * daysToday);
				this.netBookValueToday =
					this.forecastData.total - this.amortizationToday < 0 ? 0 : this.forecastData.total - this.amortizationToday;
				this.createTableForAllContract(this.renewChain);
			}
		}
	}

	private populateBonuses(bonuses: any[]): void {
		const assetBonuses = this.amortizationService.getPurchaseBonuses(bonuses);
		this.achievedPlayerBonuses = this.amortizationService.getAchievedBonuses(assetBonuses, false);
		this.residualPlayerBonuses = this.amortizationService.getResidualBonuses(assetBonuses, false);
		this.achievedAgentBonuses = this.amortizationService.getAchievedBonuses(assetBonuses, true);
		this.residualAgentBonuses = this.amortizationService.getResidualBonuses(assetBonuses, true);
		const nextSeason = this.amortizationService.getSeasonForDate(moment().add(1, 'years').toDate(), this.seasons);
		this.residualPlayerBonuses.forEach(bonus => (bonus.achievedDate = nextSeason?.offseason));
		this.residualAgentBonuses.forEach(bonus => (bonus.achievedDate = nextSeason?.offseason));
	}

	// DO - NOT - TOUCH - THIS - !!!
	createTableForAllContract(chain: EmploymentContract[]): void {
		const tables = [];
		const startDate = moment.min([moment(this.startSeason.offseason), moment(this.forecastData.from)]).toDate();

		this.populateBonuses(this.bonuses);

		// today
		const todayIndex = this.amortizationTableService.getIndex(
			new Date(),
			this.startSeason?.offseason,
			this.selectedUnit,
			false
		);
		this.todayIndexMap = {
			i: Math.floor(todayIndex / this.selectedUnit),
			j: todayIndex - this.selectedUnit
		};

		chain.forEach((contract, index) => {
			const bonusesTable = [];

			// renewals
			const indexRenewal = this.amortizationTableService.getIndex(
				contract?.dateFrom,
				this.startSeason?.offseason,
				this.selectedUnit
			);
			if (index > 0) {
				this.renewalsMap.push({
					i: Math.floor(indexRenewal / this.selectedUnit),
					j: (indexRenewal - this.selectedUnit * 2) % this.selectedUnit,
					id: contract.id
				});
			}

			// achieved player bonuses
			if (this.achievedBonusFlag) {
				const achievedBonusesForContract = this.amortizationService.getAchievedBonusesForContract(
					chain,
					contract,
					this.achievedPlayerBonuses,
					false
				);
				achievedBonusesForContract.forEach(bonus => {
					const indexBonus = this.amortizationTableService.getIndex(
						bonus?.achievedDate,
						this.startSeason?.offseason,
						this.selectedUnit,
						false
					);
					this.achievedBonusesMap.push({
						i: Math.floor(indexBonus / this.selectedUnit),
						j: (indexBonus - this.selectedUnit * 2) % this.selectedUnit,
						id: bonus.id,
						amount: bonus.amount,
						agent: false
					});
					bonusesTable.push(
						this.amortizationTableService.createTableForBonus(contract, bonus, indexBonus, this.selectedUnit)
					);
				});
			}

			// achieved agent bonuses
			if (this.agentAchievedBonusFlag) {
				const achievedAgentBonusesForContract = this.amortizationService.getAchievedBonusesForContract(
					chain,
					contract,
					this.achievedAgentBonuses,
					true
				);
				achievedAgentBonusesForContract.forEach(bonus => {
					const indexBonus = this.amortizationTableService.getIndex(
						bonus?.achievedDate,
						this.startSeason?.offseason,
						this.selectedUnit,
						false
					);
					this.achievedBonusesMap.push({
						i: Math.floor(indexBonus / this.selectedUnit),
						j: (indexBonus - this.selectedUnit * 2) % this.selectedUnit,
						id: bonus.id,
						amount: bonus.amount,
						agent: true
					});
					bonusesTable.push(
						this.amortizationTableService.createTableForBonus(contract, bonus, indexBonus, this.selectedUnit)
					);
				});
			}

			// residual player bonuses
			if (this.residualBonusFlag) {
				this.residualPlayerBonuses.forEach(bonus => {
					const indexBonus = this.amortizationTableService.getIndex(
						bonus?.achievedDate,
						this.startSeason?.offseason,
						this.selectedUnit,
						false
					);
					this.residualBonusesMap.push({
						i: Math.floor(indexBonus / this.selectedUnit),
						j: (indexBonus - this.selectedUnit * 2) % this.selectedUnit,
						id: bonus.id,
						amount: bonus.amount,
						agent: false
					});
					bonusesTable.push(
						this.amortizationTableService.createTableForBonus(contract, bonus, indexBonus, this.selectedUnit)
					);
				});
			}

			// residual agent bonuses
			if (this.agentResidualBonusFlag) {
				this.residualAgentBonuses.forEach(bonus => {
					const indexBonus = this.amortizationTableService.getIndex(
						bonus?.achievedDate,
						this.startSeason?.offseason,
						this.selectedUnit,
						false
					);
					this.residualBonusesMap.push({
						i: Math.floor(indexBonus / this.selectedUnit),
						j: (indexBonus - this.selectedUnit * 2) % this.selectedUnit,
						id: bonus.id,
						amount: bonus.amount,
						agent: true
					});
					bonusesTable.push(
						this.amortizationTableService.createTableForBonus(contract, bonus, indexBonus, this.selectedUnit)
					);
				});
			}

			const contractTable = this.amortizationTableService.createTableForContract(
				contract,
				index,
				indexRenewal,
				index === 0 ? this.tableTotal : tables[index - 1][1][indexRenewal] || this.tableTotal,
				this.selectedUnit
			);

			const mergedBonusTable = this.amortizationTableService.sumAndFlattenTable(bonusesTable);

			let globalTable = contractTable;
			if (mergedBonusTable[0].length > 0) {
				globalTable = this.amortizationTableService.sumAndFlattenTable([contractTable, mergedBonusTable]);
			}

			tables.push(globalTable);
		});

		tables
			.map(x => [...x])
			.forEach(table => {
				this.amortization = [...this.amortization, table[0]];
				this.residual = [...this.residual, table[1]];
			});

		this.amortization = this.amortizationTableService.chunk(
			this.amortizationTableService.merge(this.amortization),
			this.selectedUnit
		);
		this.residual = this.amortizationTableService.chunk(
			this.amortizationTableService.merge(this.residual),
			this.selectedUnit
		);

		this.tooltipTable = this.createTooltipTable(this.amortization.length, this.selectedUnit);

		for (let i = 0; i < this.residual.length; i++) {
			this.cols = [...this.cols, this.amortizationService.getColLabel(startDate, i)];
		}
		this.data = this.amortizationChartService.getChartData(
			this.amortization,
			this.residual,
			this.renewChain,
			this.seasons,
			this.selectedUnit,
			this.cols,
			this.units
		);
		this.options = this.amortizationChartService.getChartOptions(this.selectedUnit, this.language);
	}

	onChangeUnit() {
		this.recalculateForecast(this.forecastData);
	}

	getReport(): void {
		const data = getReport(this, this.azureUrlPipe);
		this.reportService.getReport('admin_forecast', data);
	}

	getUnitLabel(): string {
		return this.amortizationService.getUnitLabel(this.units, this.selectedUnit);
	}

	isValidAmortization(value: number): boolean {
		return !isNaN(value);
	}

	isTodayCell(i: number, j: number): boolean {
		return this.todayIndexMap.i === i && this.todayIndexMap.j === j;
	}

	isRenewedCell(i: number, j: number): boolean {
		return this.renewalsMap.some(entry => entry.i === i && entry.j === j);
	}

	isBonusCell(i: number, j: number): boolean {
		return this.achievedBonusesMap.some(entry => entry.i === i && entry.j === j);
	}

	isResidualBonusCell(i: number, j: number): boolean {
		return this.residualBonusesMap.some(entry => entry.i === i && entry.j === j);
	}

	getTooltip(i: number, j: number): string {
		const middle = this.tooltipTable[i][j].join('');
		if (middle) {
			const start = `<ul>`;
			const end = `</ul>`;
			return `${start}${middle}${end}`;
		} else return ``;
	}

	getStringForTooltip(elementId: string, type: string, agent: boolean): string {
		switch (type) {
			case 'renewal': {
				const contract = this.renewChain.find(({ id }) => id === elementId);
				return `<li>• Contract Renewal on ${moment(contract?.dateFrom).format(getMomentFormatFromStorage())}</li>`;
			}
			case 'bonus': {
				const bonus = this.bonuses.find(({ id }) => id === elementId);
				return `<li>• ${agent ? 'Agent' : 'Player'} Bonus Achieved on ${moment(bonus?.achievedDate).format(
					getMomentFormatFromStorage()
				)} (€${this.numberPipe.transform(bonus?.amount, '0.0-3', this.translate.currentLang)})</li>`;
			}
			case 'residual': {
				const bonus = this.bonuses.find(({ id }) => id === elementId);
				return `<li>• ${agent ? 'Agent' : 'Player'} Residual Bonus on ${moment(bonus?.achievedDate).format(
					getMomentFormatFromStorage()
				)} (€${this.numberPipe.transform(bonus?.amount, '0.0-3', this.translate.currentLang)})</li>`;
			}
			default: {
				return '';
			}
		}
	}

	createTooltipTable(outerLen: number, innerLen: number): any {
		const map = {};
		for (let i = 0; i < outerLen; i++) {
			map[i] = {};
			for (let j = 0; j < innerLen; j++) {
				if (!map[i][j]) map[i][j] = [];
				if (this.isTodayCell(i, j)) {
					map[i][j].push(this.translate.instant('today'));
				}
				if (this.isRenewedCell(i, j)) {
					const val = this.renewalsMap.filter(entry => entry.i === i && entry.j === j);
					map[i][j].push(...val.map(x => this.getStringForTooltip(x.id, 'renewal', x.agent)));
				}
				if (this.isBonusCell(i, j)) {
					const val = this.achievedBonusesMap.filter(entry => entry.i === i && entry.j === j);
					map[i][j].push(...val.map(x => this.getStringForTooltip(x.id, 'bonus', x.agent)));
				}
				if (this.isResidualBonusCell(i, j)) {
					const val = this.residualBonusesMap.filter(entry => entry.i === i && entry.j === j);
					map[i][j].push(...val.map(x => this.getStringForTooltip(x.id, 'residual', x.agent)));
				}
			}
		}
		return map;
	}

	getStartSeason(i: number): string {
		if (this.startSeason) {
			const sorted = sortByDate(this.seasons, 'offseason');
			const startIndex = sorted.findIndex(({ id }) => id === this.startSeason.id);
			const sliced = sorted.slice(startIndex, this.seasons.length);
			return `Offseason: ${sliced[i] ? moment(sliced[i].offseason).format(getMomentFormatFromStorage()) : `undefined`}`;
		}
	}
}

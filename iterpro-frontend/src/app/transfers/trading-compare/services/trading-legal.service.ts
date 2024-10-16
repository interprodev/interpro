import { Injectable, inject } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { ClubTransfer, ContractOption, EmploymentContract, PlayerTransfer, TransferContract } from '@iterpro/shared/data-access/sdk';
import { ShortNumberPipe, toShortNumber } from '@iterpro/shared/ui/pipes';
import {
	PRIMARIES,
	getDefaultCartesianConfig,
	getMomentFormatFromStorage,
	legendMargin,
	verticalBarSumDatalabel
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions, Plugin } from 'chart.js';
import {
	getActiveEmploymentContract,
	getActiveTransferContract,
	getTotalElementsAmountForSeasonNew,
	getVirtualGross
} from 'libs/shared/utils/common-utils/src/utils/functions/finance/legal.functions';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { Observable, map, take } from 'rxjs';
import { TransfersService } from '../../shared/services/transfers.service';
import { TradingCompareItem } from '../models/trading-compare.types';

@Injectable()
export class TradingLegalService {
	/** Services */
	readonly #translateService = inject(TranslateService);
	readonly #shortNumberPipe = inject(ShortNumberPipe);
	readonly #transfersService = inject(TransfersService);
	readonly #currentTeamService = inject(CurrentTeamService);

	transferToPlayerData(transfer: ClubTransfer): Observable<TradingCompareItem> | null {
		if (!transfer || !transfer.player) {
			return null;
		}

		/** Get Club Name with API call and the create the player compare object */
		return this.#transfersService.getClubNameByTransfer(transfer).pipe(
			take(1),
			map(clubName => ({
				transfer: transfer,
				pic: transfer.player.downloadUrl,
				position: transfer.player.position,
				position2: transfer.player.position2,
				position3: transfer.player.position3,
				overview: this.getOverview(transfer, clubName),
				deal: this.getDeal(transfer, this.getTotalCost(transfer)),
				cost: this.getTotalCost(transfer)
			}))
		);
	}

	addDiff(data: TradingCompareItem, cost: number): void {
		/** Calculate diff betweek compare players */
		const diff = data.cost - cost;
		const sign = diff === 0 ? '' : diff > 0 ? '+ ' : '- ';

		/** Push new deal diff */
		const index = data.deal.findIndex(({ label }) => label === this.#translateService.instant('admin.contracts.diff'));
		if (index > -1) {
			data.deal.splice(index, 1);
		}

		data.deal.push({
			label: this.#translateService.instant('admin.contracts.diff'),
			value: sign + this.toMillion(Math.abs(diff), this.#currentTeamService.getCurrency())
		});
	}

	getType(transfer: ClubTransfer): string {
		const source = this.getSource(transfer);

		if (!source) {
			return '-';
		}

		const pre = transfer.isPurchase ? 'admin.contracts.origin' : 'admin.contracts.type';
		const transferContract = getActiveTransferContract(transfer.player, transfer.isPurchase ? 'inward' : 'outward');

		if (!transferContract.personStatus) {
			return '-';
		}

		return this.#translateService.instant(`${pre}.${transferContract.personStatus}`);
	}

	getDeal(transfer: ClubTransfer, cost: number): SelectItem[] {
		return [
			{
				label: this.#translateService.instant('admin.transfers.type'),
				value: this.getType(transfer)
			},
			{
				label: transfer.isPurchase
					? this.#translateService.instant('admin.transfers.trading.cost')
					: this.#translateService.instant('admin.transfers.trading.cost'),
				value: this.getTransferFee(transfer)
			},
			{
				label: this.#translateService.instant('admin.squads.player.salary'),
				value: this.getTotalSalary(transfer.player)
			},
			{
				label: this.#translateService.instant('admin.squads.player.bonus'),
				value: this.getBonus(transfer.player)
			},
			{
				label: this.#translateService.instant('admin.squads.player.benefits'),
				value: this.getBenefits(transfer.player)
			},
			{
				label: this.#translateService.instant('admin.squads.player.agent'),
				value: this.getAgentFeeAndBonus(transfer.player)
			},
			{
				label: this.#translateService.instant('admin.contracts.totalCost'),
				value: this.toMillion(cost, this.#currentTeamService.getCurrency())
			}
		];
	}

	getAgentFeeAndBonusValue(player: PlayerTransfer): number {
		const activeEmploymentContract = getActiveEmploymentContract(player);
		const activeInwardContract = getActiveTransferContract(player, 'inward');
		let sum = 0;
		if (activeEmploymentContract || activeInwardContract) {
			if (activeEmploymentContract && activeEmploymentContract.agentContracts.length > 0) {
				activeEmploymentContract.agentContracts.forEach(agentContract => {
					if (agentContract.bonuses) {
						sum = agentContract.bonuses.reduce((a, b) => Number(a) + Number(b.amount), sum);
					}
					if (agentContract.fee) {
						sum = agentContract.fee.reduce((a, b) => Number(a) + Number(b.amount), sum);
					}
				});
			}
			if (activeInwardContract && activeInwardContract.agentContracts.length > 0) {
				activeInwardContract.agentContracts.forEach(agentContract => {
					if (agentContract.bonuses) {
						sum = agentContract.bonuses.reduce((a, b) => Number(a) + Number(b.amount), sum);
					}
					if (agentContract.fee) {
						sum = agentContract.fee.reduce((a, b) => Number(a) + Number(b.amount), sum);
					}
				});
			}
			return sum;
		}
		return 0;
	}

	private getTransferFee(transfer: ClubTransfer): string {
		const n = this.getNumberFromSource(transfer, 'amount');
		return this.toMillion(n, this.#currentTeamService.getCurrency());
	}

	private getOverview(transfer: ClubTransfer, clubName: string): SelectItem[] {
		return [
			{
				label: this.#translateService.instant('profile.overview.name'),
				value: transfer.player.name
			},
			{
				label: this.#translateService.instant('profile.overview.surname'),
				value: transfer.player.lastName
			},
			{
				label: this.#translateService.instant('profile.overview.nationality'),
				value: transfer.player.nationality ? this.#translateService.instant(`nationalities.${transfer.player.nationality}`) : '-'
			},
			{
				label: this.#translateService.instant('profile.overview.birth'),
				value: transfer.player.birthDate ? moment(transfer.player.birthDate).format(getMomentFormatFromStorage()) : '-'
			},
			{
				label: this.#translateService.instant('admin.club'),
				value: clubName
			},
			{
				label: this.#translateService.instant('profile.overview.contractUntil'),
				value: getActiveEmploymentContract(transfer.player)
					? moment(getActiveEmploymentContract(transfer.player).dateTo).format(getMomentFormatFromStorage())
					: '-'
			}
		];
	}

	private getTotalCost = (transfer: ClubTransfer): number => {
		const cost = this.getNumberFromSource(transfer, 'amount');
		const wage = this.getTotalSalaryValue(transfer.player);
		const bonus = this.getBonusValue(transfer.player);
		const benefits = this.getBenefitsValue(transfer.player);
		const agent = this.getAgentFeeAndBonusValue(transfer.player);
		return Number(cost) + Number(wage) + Number(bonus) + Number(benefits) + Number(agent);
	};

	private getNumberFromSource = (transfer: ClubTransfer, prop: string) => {
		const source = this.getSource(transfer);
		if (!source) return null;
		return source[prop];
	};

	private getSource = (transfer: ClubTransfer): TransferContract =>
		transfer.isPurchase ? getActiveTransferContract(transfer.player, 'inward') : getActiveTransferContract(transfer.player, 'outward');

	private getTotalSalary(player: PlayerTransfer): string {
		const activeEmploymentContract = getActiveEmploymentContract(player);
		if (!activeEmploymentContract) {
			return '-';
		}

		const result: number = getTotalElementsAmountForSeasonNew(activeEmploymentContract, activeEmploymentContract.basicWages, false, null);

		return this.transformValue(result);
	}

	private getBonus(player: PlayerTransfer): string {
		const activeEmploymentContract = getActiveEmploymentContract(player);
		if (!activeEmploymentContract) {
			return '-';
		}

		const result: number = this.computeBonusCost(activeEmploymentContract);
		return this.transformValue(result);
	}

	private getBenefits(player: PlayerTransfer): string {
		const activeEmploymentContract = getActiveEmploymentContract(player);
		if (activeEmploymentContract) {
			const diff: number = moment(activeEmploymentContract.dateTo).diff(activeEmploymentContract.dateFrom, 'years');
			const duration: number = Math.ceil(diff);
			const sum: number = activeEmploymentContract.benefits
				.filter(({ enabled }) => enabled)
				.map(({ amount }) => amount)
				.reduce((a, b) => Number(a) + Number(b), 0);

			return this.transformValue(sum * duration);
		}
		return '-';
	}

	private getTotalSalaryValue(player: PlayerTransfer): number {
		const activeEmploymentContract = getActiveEmploymentContract(player);
		if (activeEmploymentContract) {
			return getTotalElementsAmountForSeasonNew(activeEmploymentContract, activeEmploymentContract.basicWages, false, null);
		}
		return 0;
	}

	private getBonusValue(player: PlayerTransfer): number {
		const activeEmploymentContract = getActiveEmploymentContract(player);
		return this.computeBonusCost(activeEmploymentContract);
	}

	private getBenefitsValue(player: PlayerTransfer) {
		const activeEmploymentContract = getActiveEmploymentContract(player);
		if (activeEmploymentContract) {
			const diff = moment(activeEmploymentContract.dateTo).diff(activeEmploymentContract.dateFrom, 'years');
			const duration = Math.ceil(diff);
			const sum = activeEmploymentContract.benefits
				.filter(x => x.enabled === true)
				.map(x => x.amount)
				.reduce((a, b) => Number(a) + Number(b), 0);
			return sum * duration;
		}
		return 0;
	}

	private getAgentFeeAndBonus(player: PlayerTransfer): string {
		const sum: number = this.getAgentFeeAndBonusValue(player);
		return this.transformValue(sum);
	}

	// region Chart
	public toChartData = (left: ClubTransfer, right: ClubTransfer): { data: ChartData; options: ChartOptions; plugins: Plugin[] } => {
		let data = null;
		let options = null;
		if (left && left.player && right && right.player) {
			data = {
				labels: [left.player.displayName, right.player.displayName],
				datasets: [
					{
						label: 'Transfer Fee',
						backgroundColor: PRIMARIES[0],
						borderColor: PRIMARIES[0],
						data: this.getTransferFeeData(left, right)
					},
					{
						label: 'Wage',
						backgroundColor: PRIMARIES[1],
						borderColor: PRIMARIES[1],
						data: this.getSalaryData(left, right)
					},
					{
						label: 'Bonus',
						backgroundColor: PRIMARIES[2],
						borderColor: PRIMARIES[2],
						data: this.getBonusData(left, right)
					},
					{
						label: 'Benefits',
						backgroundColor: PRIMARIES[3],
						borderColor: PRIMARIES[3],
						data: this.getBenefitsData(left, right)
					},
					{
						label: 'Agent',
						backgroundColor: PRIMARIES[4],
						borderColor: PRIMARIES[4],
						data: this.getAgentFeeData(left, right)
					}
				]
			};
			options = {
				...getDefaultCartesianConfig()
			};
			options.scales.x.stacked = true;
			options.scales.y.stacked = true;
			options.scales.x.grid = { display: false };
			options.scales.y.grid = { display: false };
			options.scales.x.ticks = { display: false };
			options.scales.y.ticks = { display: false };
			options.plugins.legend = { display: true, labels: { color: 'white' } };
			options.plugins.tooltip.axis = 'y';
			options.plugins.tooltip.callbacks = {
				label: ({ dataset, raw }) => dataset.label + ': ' + this.toMillion(raw, this.#currentTeamService.getCurrency())
			};
		}

		/** Add sumDatalabels plugin */
		const plugins: Plugin[] = [verticalBarSumDatalabel, legendMargin];

		return { data, options, plugins };
	};

	private getTransferFeeData = (left: ClubTransfer, right: ClubTransfer) => {
		const l = this.getNumberFromSource(left, 'amount');
		const r = this.getNumberFromSource(right, 'amount');
		return [l, r];
	};

	private getAgentFeeData = (left: ClubTransfer, right: ClubTransfer) => {
		const l = this.getAgentFeeAndBonusValue(left.player);
		const r = this.getAgentFeeAndBonusValue(right.player);
		return [l, r];
	};

	private getSalaryData = (left: ClubTransfer, right: ClubTransfer) => {
		const l = this.getTotalSalaryValue(left.player);
		const r = this.getTotalSalaryValue(right.player);
		return [l, r];
	};

	private getBonusData = (left: ClubTransfer, right: ClubTransfer) => {
		const l = this.getBenefitsValue(left.player);
		const r = this.getBenefitsValue(right.player);
		return [l, r];
	};

	private getBenefitsData = (left: ClubTransfer, right: ClubTransfer) => {
		const l = this.getBenefitsValue(left.player);
		const r = this.getBenefitsValue(right.player);
		return [l, r];
	};

	private computeBonusCost = (contract: EmploymentContract, asset?: boolean, gross?: boolean, vat?: number) => {
		if (!contract) return 0;
		return this.computeBonus(contract.bonuses, gross, vat, asset);
	};

	private computeBonus = (array: ContractOption[], gross: boolean, vat: number, asset: boolean) =>
		array.reduce(
			(a, b) =>
				asset
					? Number(a) + Number(b.asset ? (gross ? b.grossAmount || getVirtualGross(b.amount, vat) : b.amount) : 0)
					: Number(a) + Number(gross ? b.grossAmount || getVirtualGross(b.amount, vat) : b.amount),
			0
		);
	// endregion

	private toMillion(value: number, currency: string): string {
		if (!value) {
			return '-';
		}

		const result = this.#shortNumberPipe.transform(value, true);
		return result ? `${currency}${result}` : '-';
	}

	private transformValue(result: number): string {
		const value: string = toShortNumber(Number(result), true);
		return value ? `${this.#currentTeamService.getCurrency()}${value}` : '-';
	}
}

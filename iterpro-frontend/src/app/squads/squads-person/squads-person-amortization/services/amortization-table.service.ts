import { Injectable } from '@angular/core';
import { EmploymentContract } from '@iterpro/shared/data-access/sdk';
import { chunk, flatten, last, round, unzip } from 'lodash';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { AmortizationCommonService } from './amortization-common.service';
const moment = extendMoment(Moment);

@Injectable({
	providedIn: 'root'
})
export class AmortizationTableService {
	constructor(private amortizationCommonService: AmortizationCommonService) {}

	// LOGIC TOO MUCH COMPLEX FOR YOUR MORTAL MINDS
	// THIS IS FOR SURE AN ALIEN WORK
	// PLEASE TRUST THIS AS YOUR GOD AND MOVE ON
	createTableForContract(
		contract: EmploymentContract,
		contractIndex: number,
		insertingIndex: number,
		tableTotal: number,
		unit: number
	): any[] {
		const years = this.getLengthInYears(contract.dateFrom, contract.dateTo);
		const days = this.getLenghtInDays(contract.dateFrom, contract.dateTo);
		const additional = this.getAdditionalAmount(contract);
		const total = this.getRelativeTotal(contractIndex, tableTotal, contract, insertingIndex, additional);

		const amortizationValue = this.amortizationCommonService.getAmortizationValue(total, days, unit);
		const amortization = [];
		const residual = [];
		if (amortizationValue && amortizationValue !== 0) {
			for (let i = 0; i < unit * years + insertingIndex - 1; i++) {
				if (insertingIndex && i < insertingIndex) {
					amortization.push(null);
					residual.push(null);
				} else {
					const innerTotal = i === 0 || residual[i - 1] === null ? total : residual[i - 1];
					const tempAmortization = innerTotal - amortizationValue >= 0 ? amortizationValue : innerTotal;
					const tempResidual = innerTotal - tempAmortization >= 0 ? innerTotal - tempAmortization : innerTotal;
					amortization.push(tempAmortization);
					residual.push(tempResidual);
				}
			}

			while (last(residual) > 0) {
				const i = residual.length - 1;
				const tempAmortization = residual[i] - amortizationValue >= 0 ? amortizationValue : residual[i];
				const tempResidual = residual[i] - tempAmortization >= 0 ? residual[i] - tempAmortization : residual[i];
				amortization.push(tempAmortization);
				residual.push(tempResidual);
			}
		}

		return [amortization, residual];
	}

	createTableForBonus(contract: EmploymentContract, bonus: any, indexBonus: number, unit: number): any[] {
		const endDate = moment(bonus.achievedDate).isBefore(moment(contract.dateTo), 'day')
			? contract.dateTo
			: bonus.achievedDate;
		const years = this.getLengthInYears(bonus.achievedDate, endDate);
		const days = this.getLenghtInDays(bonus.achievedDate, endDate);
		const total = bonus.amount;

		const amortizationValue = this.amortizationCommonService.getAmortizationValue(total, days, unit);
		const amortization = [];
		const residual = [];
		if (amortizationValue && amortizationValue !== 0) {
			for (let i = 0; i < (unit * years || 1) + indexBonus; i++) {
				if (i < indexBonus) {
					amortization.push(null);
					residual.push(null);
				} else {
					const innerTotal = i === 0 || residual[i - 1] === null ? total : residual[i - 1];
					const tempAmortization = innerTotal - amortizationValue >= 0 ? amortizationValue : innerTotal;
					const tempResidual = innerTotal - tempAmortization >= 0 ? innerTotal - tempAmortization : innerTotal;
					amortization.push(tempAmortization);
					residual.push(tempResidual);
				}
			}

			while (last(residual) > 0) {
				const i = residual.length - 1;
				const tempAmortization = residual[i] - amortizationValue >= 0 ? amortizationValue : residual[i];
				const tempResidual = residual[i] - tempAmortization >= 0 ? residual[i] - tempAmortization : residual[i];
				amortization.push(tempAmortization);
				residual.push(tempResidual);
			}
		}

		return [amortization, residual];
	}

	combine(values: number[]): number {
		return values.reverse().reduce((a, b) => a || b || 0);
	}

	sum(values: number[]): number {
		return values.reduce((a, b) => a + b, 0);
	}

	merge(tables: any[]): number[] {
		return unzip(tables).map(this.combine) as number[];
	}

	chunk(table: number[], unit: number): any[] {
		return chunk(table, unit);
	}

	// DO NOT TOUCH THIS!!!!
	// mergeAndFlattenTable(table: any): any {
	// 	return flatten(zip(unzip(table).map((x: any) => unzip(x).map(y => y.reverse().reduce((a, b) => a || b)))));
	// }

	// DO NOT TOUCH THIS!!!!
	sumAndFlattenTable(tables: any): any {
		const amortization = unzip(tables.map(x => flatten(x[0]))).map(this.sum);
		const residual = unzip(tables.map(x => flatten(x[1]))).map(this.sum);
		return [amortization, residual];
	}

	private getUnitOffset(unit: number): number {
		switch (unit) {
			case 1:
				return 12;
			case 2:
				return 6;
			case 4:
				return 3;
			case 12:
				return 1;
		}
	}

	getIndex(date: Date, startSeasonDate: Date, unit: number, isContract = true): number {
		let diff = moment(date).diff(moment(startSeasonDate), 'months', true);
		if (isContract) diff = Math.round(diff);
		return Math.floor(diff / this.getUnitOffset(unit));
	}

	private getAdditionalAmount(contract: any): number {
		return contract.agent?.fee?.length > 0
			? contract.agent.fee.reduce((a, { asset, amount }) => a + (asset ? amount : 0), 0)
			: 0;
	}

	private getResidualAtRenewal(total: number, len: number, indexInserting: number, additional?: number): number {
		return Math.round(additional + (total - (total / len) * indexInserting));
	}

	private getRelativeTotal(
		index: number,
		tableTotal: any,
		contract: EmploymentContract,
		indexInserting: number,
		toSum: number
	): number {
		const lenDays = this.getLenghtInDays(contract.dateFrom, contract.dateTo);
		return index === 0 ? tableTotal : this.getResidualAtRenewal(tableTotal, lenDays, indexInserting, toSum);
	}

	private getLengthInYears(dateFrom: Date, dateTo: Date): number {
		return round(Number(moment(dateTo).diff(moment(dateFrom), 'years', true).toFixed(1)), 0.5);
	}

	private getLenghtInDays(dateFrom, dateTo): number {
		return Math.round(moment(dateTo).diff(moment(dateFrom), 'days', true));
	}
}

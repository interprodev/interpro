import { Injectable } from '@angular/core';
import {
	Bonus,
	ContractPersonType,
	EmploymentContract,
	PlayerApi,
	PlayerTransferApi,
	TeamSeason
} from '@iterpro/shared/data-access/sdk';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { Observable } from 'rxjs';
import { ForecastData } from '../squads-person-amortization.component';

const moment = extendMoment(Moment);

@Injectable({
	providedIn: 'root'
})
export class AmortizationCommonService {
	private bonusesAlreadyAdded: string[] = [];

	constructor(private playerApi: PlayerApi, private playerTransferApi: PlayerTransferApi) {}

	resetData() {
		this.bonusesAlreadyAdded = [];
	}

	getEmploymentContracts(playerId: string, personType: ContractPersonType): Observable<EmploymentContract[]> {
		const api = personType === 'Player' ? this.playerApi : this.playerTransferApi;
		return api.getEmploymentContracts(playerId);
	}

	getForecastData(isPurchase: boolean, personId: string, personType: ContractPersonType): Observable<ForecastData> {
		const api = personType === 'Player' ? this.playerApi : this.playerTransferApi;
		const id = isPurchase ? personId : personId;
		return api.getAmortizationData(id);
	}

	private getContract(contractType: string, transferType: string): string {
		if (contractType === 'EmploymentContract') return 'employment';
		if (contractType === 'TransferContract' && transferType === 'inward') return 'purchase';
		return 'sale';
	}

	getPurchaseBonuses(bonuses: Bonus[]): Bonus[] {
		return (bonuses || []).filter(
			({ contractType, transferType }) => this.getContract(contractType, transferType) === 'purchase'
		);
	}

	getAchievedBonuses(bonuses: Bonus[], agentFlag: boolean): Bonus[] {
		return (bonuses || [])
			.filter(({ agentId }) => (agentFlag ? !!agentId : !agentId))
			.filter(({ progress, reached }) => reached || progress?.percentage >= 100);
	}

	getResidualBonuses(bonuses: Bonus[], agentFlag: boolean): Bonus[] {
		return (bonuses || [])
			.filter(({ agentId }) => (agentFlag ? !!agentId : !agentId))
			.filter(({ progress, reached }) => !reached && !(progress?.percentage >= 100));
	}

	private isWithinThisContract(bonus: Bonus, contract: EmploymentContract): boolean {
		return moment(bonus.achievedDate).isBetween(moment(contract.dateFrom), moment(contract.dateTo), 'day', '[]');
	}

	getAchievedBonusesForContract(
		chain: EmploymentContract[],
		contract: EmploymentContract,
		bonuses: Bonus[],
		agent: boolean
	): Bonus[] {
		const contractIndexInChain = chain.findIndex(({ id }) => id === contract.id);
		const futureContracts = chain.slice(contractIndexInChain + 1, chain.length);
		const filtered = this.getAchievedBonuses(this.getPurchaseBonuses(bonuses), agent)
			.filter(
				bonus =>
					bonus.achievedDate &&
					this.isWithinThisContract(bonus, contract) &&
					!futureContracts.some(futureContract => this.isWithinThisContract(bonus, futureContract)) // if the bonus is within this contract AND ALSO not within a future contract -> otherwise, put it in the future contract.
			)
			.filter(({ id }) => !this.bonusesAlreadyAdded.includes(id));
		this.bonusesAlreadyAdded = [...this.bonusesAlreadyAdded, ...filtered.map(({ id }) => id)];
		return filtered;
	}

	getBonusAmount(bonuses: Bonus[], achievedFlag: boolean, agentFlag: boolean): number {
		bonuses = bonuses.filter(({ agentId }) => (agentFlag ? !!agentId : !agentId));
		const purchases = this.getPurchaseBonuses(bonuses);
		const achieved = this.getAchievedBonuses(purchases, agentFlag);
		if (achievedFlag) return achieved.reduce((a, { amount }) => a + amount, 0);
		else
			return purchases
				.filter(bonus => !achieved.map(({ id }) => id).includes(bonus.id))
				.reduce((a, b) => a + b.amount, 0);
	}

	getColLabel(startSeasonDate: Date, i: number): string {
		return `${moment(startSeasonDate).add(i, 'year').year()}/${moment(startSeasonDate)
			.add(i + 1, 'year')
			.year()}`;
	}

	getSeasonForDate(date: Date, seasons: TeamSeason[]): TeamSeason {
		const season = seasons.find(({ offseason, inseasonEnd }) =>
			moment(date).isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
		);
		return season;
	}

	getAmortizationValue(total: number, days: number, unit: number): number {
		if (days === 0) return total;
		return Math.round((total / days) * (365 / unit));
	}

	getCurrentContract(contracts: EmploymentContract[]): EmploymentContract {
		return contracts.find(({ status }) => status === true);
	}

	getUnitLabel(units: any[], unit: number): string {
		return units.find(({ value }) => value === unit).label.slice(0, 3);
	}
}

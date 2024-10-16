import { Injectable } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { CompetitionsConstantsService, getId } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';
import {
	AgentContractApi,
	BasicWage,
	Benefit,
	Bonus,
	ClauseStateElement,
	ContractOptionCondition,
	EmploymentContractApi,
	Insurance,
	LoanOption,
	PreCondition,
	StringBonus,
	StringBonusWithAgentContract,
	TransferClause,
	TransferContractApi
} from '@iterpro/shared/data-access/sdk';
import { isNullOrUndefined } from './bonus-string-builder.service';
import { isArray } from 'lodash';

@Injectable({
	providedIn: 'root'
})
export class BonusService {
	constructor(
		private competitionsService: CompetitionsConstantsService,
		private currentTeamService: CurrentTeamService,
		private translate: TranslateService
	) {}

	isValid(isNotarizedContract: boolean, bonus: Bonus | BasicWage | TransferClause): boolean {
		return this.hasAllDates(bonus) && !this.hasResidual(bonus) && !this.missingFields(isNotarizedContract, bonus);
	}

	private hasAllDates(bonus: Bonus | BasicWage | TransferClause): boolean {
		return bonus && bonus.installments && bonus.installments.length > 0
			? bonus.installments.every(x => x.date || x.season)
			: true;
	}

	private hasResidual(bonus: Bonus | BasicWage | TransferClause): boolean {
		if (bonus && bonus.installments && bonus.installments.length > 0) {
			const amount = bonus.amount || bonus.grossAmount;
			const installments = bonus.installments
				.map(x => x.value)
				.reduce((accumulator: number, currentValue: any) => (accumulator += Number(currentValue)), 0);
			return amount - installments !== 0;
		} else {
			return false;
		}
	}

	private missingFields(isNotarizedContract: boolean, bonus: Bonus | BasicWage | TransferClause): boolean {
		if (isNotarizedContract) return false;
		if (bonus) {
			switch (bonus.type as StringBonus) {
				case 'appearanceFee':
					return (
						(isNullOrUndefined(bonus.amount) && isNullOrUndefined(bonus.grossAmount)) ||
						(bonus.conditions || []).some(x => !x.goal) ||
						(bonus.conditions || []).some(x => !x.action) ||
						(bonus.conditions || []).some(x => x.seasons && x.seasons.length === 0) ||
						(bonus.conditions || [] || []).some(x => x.competitions && x.competitions.length === 0)
					);
				case 'appearance':
					return bonus.conditions
						? (isNullOrUndefined(bonus.amount) && isNullOrUndefined(bonus.grossAmount)) ||
								(bonus.conditions || []).some(x => !x.goal) ||
								(bonus.conditions || []).some(x => !x.action) ||
								(bonus.conditions || []).some(x => !x.count) ||
								(bonus.conditions || []).some(x => x.seasons && x.seasons.length === 0) ||
								(bonus.conditions || []).some(x => x.competitions && x.competitions.length === 0)
						: false;
				case 'performance':
				case 'standardTeam':
				case 'signing':
					return bonus.conditions
						? (isNullOrUndefined(bonus.amount) && isNullOrUndefined(bonus.grossAmount)) ||
								(bonus.conditions || []).some(x => !x.type) ||
								(bonus.conditions || []).some(x => !x.action) ||
								(bonus.conditions || []).some(x => x.type === 'makes' && !x.goal) ||
								(bonus.conditions || []).some(x => x.type === 'isInCompList' && x.seasons && x.seasons.length === 0) ||
								(bonus.conditions || []).some(
									x => x.type === 'isInCompList' && x.competitions && x.competitions.length === 0
								)
						: false;
				case 'custom':
					return bonus.conditions
						? (isNullOrUndefined(bonus.amount) && isNullOrUndefined(bonus.grossAmount)) ||
								(bonus.conditions || []).some(x => !x.custom) ||
								(bonus.conditions || []).some(x => x.seasons && x.seasons.length === 0) ||
								(bonus.conditions || []).some(x => x.competitions && x.competitions.length === 0)
						: false;
				case 'basicWage':
				case 'privateWriting':
				case 'valorization':
					return (
						(isNullOrUndefined(bonus.amount) && isNullOrUndefined(bonus.grossAmount)) ||
						((bonus as BasicWage).season && (bonus as BasicWage).season.length === 0)
					);
				case 'fee':
				case 'contribution':
				case 'transferFee':
				case 'buyout':
				case 'sellOnFee':
				case 'buyBack':
					return isNullOrUndefined(bonus.amount) && isNullOrUndefined(bonus.grossAmount);
				case 'insurance':
					return !isNullOrUndefined(bonus.amount) || !isNullOrUndefined(bonus.grossAmount)
						? !(bonus as unknown as Insurance).prize
						: false;
				case 'benefits':
					return (
						(bonus as unknown as Benefit).enabled &&
						isNullOrUndefined(bonus.amount) &&
						isNullOrUndefined(bonus.grossAmount)
					);
				case 'loanOption':
					return (bonus as unknown as LoanOption).option
						? !(bonus as unknown as LoanOption).action ||
								(isNullOrUndefined(bonus.amount) && isNullOrUndefined(bonus.grossAmount))
						: false;
				case 'additionalClauses':
				case 'commercialRights':
				case 'options':
					return !(bonus as any).value;
			}
		}
		return false;
	}

	completeBonus(bonus: BasicWage | Bonus | TransferClause | LoanOption, type: StringBonus): any {
		if (
			type === 'appearance' ||
			type === 'performance' ||
			type === 'standardTeam' ||
			type === 'signing' ||
			type === 'appearanceFee' ||
			type === 'performanceFee'
		) {
			(bonus.conditions || []).forEach(condition => {
				condition = this.completeBonusCondition(condition, type);
			});
			if (!(bonus as Bonus).precondition) (bonus as Bonus).precondition = new PreCondition();
		} else {
			if (!isArray((bonus as BasicWage).season)) (bonus as BasicWage).season = [(bonus as BasicWage).season];
			if (type === 'custom') if (!bonus.conditions) bonus.conditions = [];
		}
		if (!(bonus as BasicWage).repeat) (bonus as BasicWage).repeat = false;
		if (!bonus.withinMode) bonus.withinMode = 'days';
		if (type === 'loanOption' && !(bonus as LoanOption).counterOption) {
			(bonus as LoanOption).counterOption = {
				enabled: false,
				amount: null,
				dateFrom: null,
				dateTo: null
			};
		}
		return bonus;
	}

	private completeBonusCondition(condition: ContractOptionCondition, type: StringBonus): ContractOptionCondition {
		if (!getId(condition)) condition._id = uuid();
		if (!isArray(condition.seasons)) condition.seasons = [condition.seasons];
		if (!condition.seasonsRelationFlag) condition.seasonsRelationFlag = 'and';
		if (!condition.competitionsRelationFlag) condition.competitionsRelationFlag = 'and';
		if (type === 'appearanceFee' || type === 'performanceFee') condition.action = 'per';
		return condition;
	}

	getBonusCompetitions(standard: SelectItem[], teams: SelectItem[], outward: boolean): SelectItem[] {
		let competitions = standard;
		if (outward) {
			competitions = this.competitionsService.getCompetitions();
		} else {
			if (
				this.currentTeamService.getCurrentSeason().competitionInfo &&
				this.currentTeamService.getCurrentSeason().competitionInfo.length > 0
			) {
				competitions = this.currentTeamService
					.getCurrentSeason()
					.competitionInfo.map(compInfo =>
						this.competitionsService.getCompetition(compInfo.competition)
							? this.competitionsService.getCompetition(compInfo.competition)
							: compInfo
					)
					.map(({ name, wyId, competition }) => ({
						label: this.translate.instant(name),
						value: wyId || competition
					}));
			} else {
				if (
					this.currentTeamService.getCurrentSeason().wyscoutAreas &&
					this.currentTeamService.getCurrentSeason().wyscoutAreas.length > 0
				) {
					competitions = this.competitionsService
						.getCompetitionsByAreas(this.currentTeamService.getCurrentSeason().wyscoutAreas)
						.map(({ label, value }) => ({
							label: this.translate.instant(label),
							value
						}));
				} else {
					competitions = competitions.map(({ label, value }) => ({
						label: this.translate.instant(label),
						value
					}));
				}
			}
			competitions = [
				{
					label: this.translate.instant('allActiveCompetitions'),
					value: 'allActiveCompetitions'
				},
				...competitions
			];
		}

		return [...competitions, ...teams];
	}

	getClauseObservable(
		clause: ClauseStateElement,
		action: string,
		contractApi: EmploymentContractApi | TransferContractApi | AgentContractApi,
		contractId: string
	): Observable<BasicWage | Bonus | LoanOption | TransferClause> {
		switch (action) {
			case 'create':
				return this.getCreateContractOptionObservable(contractApi, contractId, clause.value, clause.type);
			case 'edit':
				return this.getUpdateContractOptionObservable(contractApi, contractId, clause.id, clause.value, clause.type);
			case 'delete':
				return this.getDeleteContractOptionObservable(contractApi, contractId, clause.id, clause.type);
			default:
				console.error('Invalid action');
		}
	}

	private getCreateContractOptionObservable(
		contractApi: EmploymentContractApi | TransferContractApi | AgentContractApi,
		contractId: string,
		option: BasicWage | Bonus | LoanOption | TransferClause,
		type: StringBonusWithAgentContract
	): Observable<BasicWage | Bonus | LoanOption | TransferClause> {
		delete option['localId'];
		switch (type) {
			case 'basicWage':
			case 'contribution':
			case 'privateWriting':
				return (contractApi as EmploymentContractApi).createBasicWages(contractId, option);
			case 'fee':
				return (contractApi as AgentContractApi).createFee(contractId, option);
			case 'appearanceFee':
			case 'appearance':
			case 'performance':
			case 'performanceFee':
			case 'standardTeam':
			case 'signing':
			case 'custom':
				return contractApi.createBonuses(contractId, option);
			case 'loanOption':
				return (contractApi as TransferContractApi).createLoanOption(contractId, option);
			case 'sellOnFee':
				return (contractApi as TransferContractApi).createSellOnFee(contractId, option);
			case 'buyBack':
				return (contractApi as TransferContractApi).createBuyBack(contractId, option);
			case 'valorization':
				return (contractApi as TransferContractApi).createValorization(contractId, option);
			default:
				console.error('Invalid type');
		}
	}

	private getUpdateContractOptionObservable(
		contractApi: EmploymentContractApi | TransferContractApi | AgentContractApi,
		contractId: string,
		optionId: string,
		option: BasicWage | Bonus | LoanOption | TransferClause,
		type: StringBonusWithAgentContract
	): Observable<BasicWage | Bonus | LoanOption | TransferClause> {
		switch (type) {
			case 'basicWage':
			case 'contribution':
			case 'privateWriting':
				return (contractApi as EmploymentContractApi).updateByIdBasicWages(contractId, optionId, option);
			case 'fee':
				return (contractApi as AgentContractApi).updateByIdFee(contractId, optionId, option);
			case 'appearanceFee':
			case 'appearance':
			case 'performance':
			case 'performanceFee':
			case 'standardTeam':
			case 'signing':
			case 'custom':
				return contractApi.updateByIdBonuses(contractId, optionId, option);
			case 'loanOption':
				return (contractApi as TransferContractApi).updateByIdLoanOption(contractId, optionId, option);
			case 'sellOnFee':
				return (contractApi as TransferContractApi).updateByIdSellOnFee(contractId, optionId, option);
			case 'buyBack':
				return (contractApi as TransferContractApi).updateByIdBuyBack(contractId, optionId, option);
			case 'valorization':
				return (contractApi as TransferContractApi).updateByIdValorization(contractId, optionId, option);
			default:
				console.error('Invalid type');
		}
	}

	private getDeleteContractOptionObservable(
		contractApi: EmploymentContractApi | TransferContractApi | AgentContractApi,
		contractId: string,
		optionId: string,
		type: string
	): Observable<BasicWage | Bonus | LoanOption | TransferClause> {
		switch (type) {
			case 'basicWage':
			case 'contribution':
			case 'privateWriting':
				return (contractApi as EmploymentContractApi).destroyByIdBasicWages(contractId, optionId);
			case 'fee':
				return (contractApi as AgentContractApi).destroyByIdFee(contractId, optionId);
			case 'appearanceFee':
			case 'appearance':
			case 'performance':
			case 'standardTeam':
			case 'signing':
			case 'custom':
				return contractApi.destroyByIdBonuses(contractId, optionId);
			case 'loanOption':
				return (contractApi as TransferContractApi).destroyByIdLoanOption(contractId, optionId);
			case 'sellOnFee':
				return (contractApi as TransferContractApi).destroyByIdSellOnFee(contractId, optionId);
			case 'buyBack':
				return (contractApi as TransferContractApi).destroyByIdBuyBack(contractId, optionId);
			case 'valorization':
				return (contractApi as TransferContractApi).destroyByIdValorization(contractId, optionId);
			case 'agentContract':
				return (
					(contractApi as TransferContractApi) || (contractApi as EmploymentContractApi)
				).destroyByIdAgentContracts(contractId, optionId);
			default:
				console.error('Invalid type');
		}
	}
}

import {
	employmentContractPipeline,
	transferContractPipeline
} from './../../../../../../libs/shared/utils/common-utils/src/utils/functions/transfers/transfers.functions';
import { Injectable } from '@angular/core';
import {
	AgentContract,
	AgentContractApi,
	BasicWage,
	BasicWageApi,
	Benefit,
	Bonus,
	ClauseState,
	ContractPersonModel,
	ContractPersonType,
	EmploymentContract,
	EmploymentContractApi,
	Insurance,
	LoanOption,
	PlayerApi,
	PlayerTransferApi,
	StaffApi,
	StringBonus,
	StringBonusWithAgentContract,
	TransferClause,
	TransferContract,
	TransferContractApi,
	TransferTypeString,
	WyscoutApi
} from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, isArray, isEmpty } from 'lodash';
import moment from 'moment';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { BonusService } from './bonus.service';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { BlockUiInterceptorService, createChangeLog, getChangeLogLabel } from '@iterpro/shared/utils/common-utils';
import { isNullOrUndefined } from './bonus-string-builder.service';

export let clauseState: ClauseState = {
	added: [],
	updated: [],
	deleted: []
};
export type ContractTypeForApi = 'employment' | 'transfer' | 'agent';

interface ContractChangeHistory {
	date: Date;
	author: string;
	action: string;
	details?: string;
}

const addContractTimestamp = (action, customerId, details?): ContractChangeHistory => ({
	date: moment().toDate(),
	author: customerId,
	action,
	details
});

@Injectable({
	providedIn: 'root'
})
export class ContractService {
	constructor(
		private staffApi: StaffApi,
		private playerApi: PlayerApi,
		private wyscoutApi: WyscoutApi,
		private basicWageApi: BasicWageApi,
		private bonusService: BonusService,
		private translate: TranslateService,
		private agentContractApi: AgentContractApi,
		private playerTransferApi: PlayerTransferApi,
		private currentTeamService: CurrentTeamService,
		private transferContractApi: TransferContractApi,
		private employmentContractApi: EmploymentContractApi,
		private blockUiInterceptorService: BlockUiInterceptorService
	) {}

	private getApi(contractType: ContractTypeForApi): EmploymentContractApi | TransferContractApi | AgentContractApi {
		switch (contractType) {
			case 'employment':
				return this.employmentContractApi;
			case 'transfer':
				return this.transferContractApi;
			case 'agent':
				return this.agentContractApi;
			default:
				console.error(`Invalid contract type ${contractType}`);
		}
	}

	getPersonContracts(person: ContractPersonModel, personType: ContractPersonType): Observable<any> {
		const obs$: Array<Observable<any>> = [];
		switch (personType) {
			case 'Player':
			case 'PlayerTransfer':
			case 'Agent': {
				const api: PlayerApi | PlayerTransferApi =
					personType === 'PlayerTransfer' ? this.playerTransferApi : this.playerApi;
				obs$.push(
					this.getPersonContractPipe(person.id, 'Employment', api, {
						...employmentContractPipeline
					})
				);
				obs$.push(
					this.getPersonContractPipe(person.id, 'Transfer', api, {
						...transferContractPipeline
					})
				);
				break;
			}
			case 'Staff': {
				obs$.push(this.getPersonContractPipe(person.id, 'Employment', this.staffApi));
				break;
			}
			default: {
				break;
			}
		}
		return forkJoin(obs$);
	}

	private getPersonContractPipe(
		personId: string,
		contractType: 'Employment' | 'Transfer',
		personApi: PlayerApi | StaffApi | PlayerTransferApi,
		filter?: any
	): Observable<any> {
		return personApi[`get${contractType}Contracts`](personId, filter);
	}

	getContractOptions(
		contract: EmploymentContract | TransferContract | AgentContract,
		contractType: ContractTypeForApi
	): Observable<any> {
		const api = this.getApi(contractType);
		let obs$ = [api.getBonuses(contract.id)];
		switch (contractType) {
			case 'employment': {
				obs$ = [
					...obs$,
					this.basicWageApi.find({ where: { contractId: contract.id, type: 'basicWage' } }),
					this.basicWageApi.find({ where: { contractId: contract.id, type: 'contribution' } }),
					this.basicWageApi.find({ where: { contractId: contract.id, type: 'privateWriting' } }),
					(api as EmploymentContractApi).getAgentContracts(contract.id)
				];
				break;
			}
			case 'transfer': {
				obs$ = [
					...obs$,
					(api as TransferContractApi).getBuyBack(contract.id),
					(api as TransferContractApi).getSellOnFee(contract.id),
					(api as TransferContractApi).getLoanOption(contract.id),
					(api as TransferContractApi).getValorization(contract.id),
					(api as TransferContractApi).getAgentContracts(contract.id)
				];
				break;
			}
			case 'agent': {
				obs$ = [...obs$, (api as AgentContractApi).getFee(contract.id)];
			}
		}
		return forkJoin(obs$);
	}

	createEmploymentContract(author: string, renewContractId?: string): EmploymentContract {
		return new EmploymentContract({
			number: null,
			status: false,
			validated: false,
			currency: this.currentTeamService.getCurrency(),
			personStatus: '',
			dateFrom: null,
			dateTo: null,
			signatureDate: null,
			extension: false,
			extensionNotes: null,
			basicWages: [],
			additionalClauses: [],
			benefits: [
				new Benefit('house'),
				new Benefit('car'),
				new Benefit('phone'),
				new Benefit('travels'),
				new Benefit('school'),
				new Benefit('expensesReimbursement')
			],
			contributions: [],
			options: [],
			commercialRights: [],
			termination: [],
			buyout: [],
			insurance: new Insurance(),
			bonusCap: null,
			notes: null,
			renew: !!renewContractId,
			renewContractId,
			_attachments: [],
			contractCloudUrl: null,
			contractUrl: null,
			contractPublicId: null,
			contractFilename: null,
			transferContractId: null,
			changeHistory: [addContractTimestamp('creation', author)]
		});
	}

	createTransferContract(
		typeTransfer: TransferTypeString,
		authorId: string,
		renewContractId?: string
	): TransferContract {
		return new TransferContract({
			amount: null,
			typeTransfer,
			number: null,
			status: false,
			validated: false,
			currency: this.currentTeamService.getCurrency(),
			personStatus: null,
			on: null,
			signatureDate: null,
			extension: false,
			extensionNotes: null,
			additionalClauses: [],
			installments: [],
			options: [],
			bonusCap: null,
			notes: null,
			renew: !!renewContractId,
			renewContractId,
			_attachments: [],
			contractCloudUrl: null,
			contractUrl: null,
			contractPublicId: null,
			contractFilename: null,
			changeHistory: [addContractTimestamp('creation', authorId)]
		});
	}

	createAgentContract(author: string): AgentContract {
		return new AgentContract({
			conflict: false,
			number: null,
			status: false,
			validated: false,
			currency: this.currentTeamService.getCurrency(),
			contractType: '',
			signatureDate: null,
			extension: false,
			extensionNotes: null,
			fee: [],
			additionalClauses: [],
			bonusCap: null,
			notes: null,
			_attachments: [],
			contractCloudUrl: null,
			contractUrl: null,
			contractPublicId: null,
			contractFilename: null,
			changeHistory: [addContractTimestamp('creation', author)]
		});
	}

	getAgentContract(
		contract: EmploymentContract | TransferContract,
		contractType: ContractTypeForApi,
		author: string
	): Observable<AgentContract[]> {
		return contract.renew && contract['copy']
			? this.cloneAgentContract(contract.renewContractId, contractType)
			: of([this.createAgentContract(author)]);
	}

	cloneAgentContract(renewContractId: string, contractType: ContractTypeForApi): Observable<AgentContract[]> {
		const api = this.getApi(contractType);
		return ((api as EmploymentContractApi) || (api as TransferContractApi)).getAgentContracts(renewContractId).pipe(
			switchMap((contracts: AgentContract[]) => {
				const clones = cloneDeep(contracts);
				clones.forEach(clone => delete clone.id);
				return of(clones);
			})
		);
	}

	cloneOrRenewContract(
		contract: EmploymentContract | TransferContract,
		contractType: ContractTypeForApi,
		isRenew: boolean,
		copyDataForRenew: boolean
	): Observable<EmploymentContract | TransferContract | AgentContract> {
		const api: EmploymentContractApi | TransferContractApi | AgentContractApi = this.getApi(contractType);
		return api.clone(contract.id, this.getContractTypeParam(contractType), isRenew, copyDataForRenew);
	}

	private getContractTypeParam(
		contractType: ContractTypeForApi
	): 'EmploymentContract' | 'TransferContract' | 'AgentContract' {
		switch (contractType) {
			case 'employment':
				return 'EmploymentContract';
			case 'transfer':
				return 'TransferContract';
			case 'agent':
				return 'AgentContract';
		}
	}

	saveContract(
		person: ContractPersonModel,
		contract: EmploymentContract | TransferContract,
		agentContracts: AgentContract[],
		personType: ContractPersonType,
		contractType: ContractTypeForApi
	): Observable<any> {
		let parentToReturn: EmploymentContract | TransferContract;
		const api = this.getApi(contractType) as EmploymentContractApi | TransferContractApi;
		return (
			contract.id
				? this.getUpdatePlayerContractPipe(api, person, contract, personType, contractType)
				: this.getCreatePlayerContractPipe(api, person, contract, personType, contractType)
		).pipe(
			switchMap(([persisted, ...options]) => {
				parentToReturn = persisted;
				return agentContracts?.length > 0
					? forkJoin(
							agentContracts.map(agentContract =>
								agentContract.id
									? this.getUpdateAgentContractPipe(api, agentContract, persisted)
									: this.getCreateAgentContractPipe(api, agentContract, persisted)
							)
						)
					: of([]);
			}),
			switchMap(() => of(parentToReturn))
		);
	}

	private getUpdatePlayerContractPipe(
		api: EmploymentContractApi | TransferContractApi,
		person: ContractPersonModel,
		contract: EmploymentContract | TransferContract,
		personType: ContractPersonType,
		contractType: ContractTypeForApi
	): Observable<any[]> {
		let obs$: Observable<EmploymentContract | TransferContract>;
		switch (personType) {
			case 'Player': {
				obs$ =
					contractType === 'employment'
						? this.playerApi.updateByIdEmploymentContracts(person.id, contract.id, contract)
						: this.playerApi.updateByIdTransferContracts(person.id, contract.id, contract);
				break;
			}
			case 'PlayerTransfer': {
				obs$ =
					contractType === 'employment'
						? this.playerTransferApi.updateByIdEmploymentContracts(person.id, contract.id, contract)
						: this.playerTransferApi.updateByIdTransferContracts(person.id, contract.id, contract);
				break;
			}
			case 'Staff': {
				obs$ = this.staffApi.updateByIdEmploymentContracts(person.id, contract.id, contract);
				break;
			}
			default: {
				console.warn('format not supported', personType);
				break;
			}
		}
		return obs$.pipe(
			switchMap((persisted: EmploymentContract | TransferContract) =>
				this.getUpdateContractOptionsPipe(api, persisted, false)
			),
			catchError(err => {
				console.error(err);
				return of(err);
			})
		);
	}

	private getCreatePlayerContractPipe(
		api: EmploymentContractApi | TransferContractApi,
		person: ContractPersonModel,
		contract: EmploymentContract | TransferContract,
		personType: ContractPersonType,
		contractType: string
	): Observable<any[]> {
		let obs$: Observable<EmploymentContract | TransferContract>;
		switch (personType) {
			case 'Player': {
				obs$ =
					contractType === 'employment'
						? this.playerApi.createEmploymentContracts(person.id, contract)
						: this.playerApi.createTransferContracts(person.id, contract);
				break;
			}
			case 'PlayerTransfer': {
				obs$ =
					contractType === 'employment'
						? this.playerTransferApi.createEmploymentContracts(person.id, contract)
						: this.playerTransferApi.createTransferContracts(person.id, contract);
				break;
			}
			case 'Staff': {
				obs$ = this.staffApi.createEmploymentContracts(person.id, contract);
				break;
			}
			default: {
				obs$ = of(contract);
				break;
			}
		}
		return obs$.pipe(
			switchMap((persisted: EmploymentContract | TransferContract) =>
				this.getCreateContractOptionsPipe(api, persisted, false)
			)
		);
	}

	private getUpdateAgentContractPipe(
		api: EmploymentContractApi | TransferContractApi,
		contract: AgentContract,
		parent: EmploymentContract | TransferContract
	) {
		return api
			.updateByIdAgentContracts(parent.id, contract.id, contract)
			.pipe(
				switchMap((persisted: AgentContract) =>
					this.getUpdateContractOptionsPipe(this.agentContractApi, persisted, true)
				)
			);
	}

	private getCreateAgentContractPipe(
		api: EmploymentContractApi | TransferContractApi,
		contract: AgentContract,
		persistedParent: EmploymentContract | TransferContract
	): Observable<any[]> {
		return api
			.createAgentContracts(persistedParent.id, contract)
			.pipe(
				switchMap((persisted: AgentContract) =>
					this.getCreateContractOptionsPipe(this.agentContractApi, persisted, true)
				)
			);
	}

	private getUpdateContractOptionsPipe(
		api: EmploymentContractApi | TransferContractApi | AgentContractApi,
		persisted: EmploymentContract | TransferContract | AgentContract,
		agentFlag: boolean
	): Observable<any[]> {
		const obs$ = [
			of(persisted),
			...clauseState.added
				.filter(({ agent }) => agent === agentFlag)
				.map(clause => this.bonusService.getClauseObservable(clause, 'create', api, persisted.id)),
			...clauseState.updated
				.filter(({ agent }) => agent === agentFlag)
				.map(clause => this.bonusService.getClauseObservable(clause, 'edit', api, persisted.id)),
			...clauseState.deleted
				.filter(({ agent }) => agent === agentFlag)
				.map(clause => this.bonusService.getClauseObservable(clause, 'delete', api, persisted.id))
		];
		return forkJoin(obs$);
	}

	private getCreateContractOptionsPipe(
		api: EmploymentContractApi | TransferContractApi | AgentContractApi,
		persisted: EmploymentContract | TransferContract | AgentContract,
		agentFlag: boolean
	): Observable<any[]> {
		const obs$ = [
			of(persisted),
			...clauseState.added
				.filter(({ agent }) => agent === agentFlag)
				.map(clause => this.bonusService.getClauseObservable(clause, 'create', api, persisted.id))
		];
		return forkJoin(obs$);
	}

	deleteContract(contract: EmploymentContract | TransferContract, contractType: ContractTypeForApi): Observable<any> {
		const api = this.getApi(contractType);
		return api.deleteById(contract.id);
	}

	prepareContractForSave(
		contract: EmploymentContract | TransferContract | AgentContract,
		temp: EmploymentContract | TransferContract | AgentContract,
		others: EmploymentContract[] | TransferContract[],
		author: string
	): EmploymentContract | TransferContract | AgentContract {
		if (contract.id) {
			contract.changeHistory = [
				...(contract?.changeHistory || []),
				...this.getContractChangeHistory(temp, contract, author)
			];
		} else {
			if (isEmpty(others)) contract.status = true;
		}
		delete contract['copy'];
		return contract;
	}

	private getContractChangeHistory(
		oldContract: EmploymentContract | TransferContract | AgentContract,
		contract: EmploymentContract | TransferContract | AgentContract,
		authorId: string
	): ContractChangeHistory[] {
		const changeLogsItems: string[] = createChangeLog(
			oldContract,
			contract,
			['changeHistory', 'validated'],
			this.translate,
			'contract'
		);
		const contractHistoryChangeLog: ContractChangeHistory[] = [];
		if (changeLogsItems && changeLogsItems.length > 0) {
			contractHistoryChangeLog.push(addContractTimestamp('update', authorId, (changeLogsItems || []).join(', ')));
		}
		Object.keys(clauseState).forEach(key => {
			for (const clause of clauseState[key]) {
				let label = this.translate.instant(getChangeLogLabel(clause.type, 'contract'));
				if (clause.agent) {
					label = this.translate.instant('admin.contracts.agent') + ': ' + label;
				}
				contractHistoryChangeLog.push(addContractTimestamp(key, authorId, label));
			}
		});
		if (oldContract?.validated !== contract?.validated) {
			contractHistoryChangeLog.push(
				addContractTimestamp(contract.validated ? 'notarization added' : 'notarization removed', authorId)
			);
		}
		return contractHistoryChangeLog;
	}

	searchClub($event: any): Observable<any> {
		return this.blockUiInterceptorService.disableOnce(
			of($event).pipe(
				map((event: any) => event.query),
				filter((query: string) => query && query.length > 2),
				distinctUntilChanged(),
				debounceTime(1000),
				switchMap(query => this.wyscoutApi.searchTeam(query, false))
			)
		);
	}

	getClub(contract: TransferContract): Observable<any> {
		return this.blockUiInterceptorService.disableOnce(
			of(contract.club).pipe(
				distinctUntilChanged(),
				debounceTime(1000),
				switchMap(query => this.wyscoutApi.searchTeam(query.toString(), true))
			)
		);
	}

	addNewClauseToState(value: BasicWage | Bonus | LoanOption | TransferClause, type: StringBonus, agent: boolean) {
		const index = clauseState.added.findIndex(clause => clause.value['localId'] === value['localId']);
		if (index === -1) clauseState.added.push({ type, value, agent });
		else clauseState.added[index] = { ...clauseState.added[index], value };
	}

	addEditClauseToState(value: BasicWage | Bonus | LoanOption | TransferClause, type: StringBonus, agent: boolean) {
		const index = clauseState.updated.findIndex(clause => clause.value.id === value.id);
		if (index === -1) clauseState.updated.push({ id: value.id, type, value, agent });
		else clauseState.updated[index] = { ...clauseState.updated[index], value };
	}

	addRemoveClauseToState(
		value: BasicWage | Bonus | LoanOption | TransferClause | AgentContract,
		type: StringBonusWithAgentContract,
		agent: boolean
	) {
		const index = clauseState.deleted.findIndex(clause => clause.value.id === value.id);
		if (index === -1) clauseState.deleted.push({ id: value.id, type, agent });
	}

	removeClauseFromState(clauseId: string): void {
		const addedIndex = clauseState.added.findIndex(({ id }) => id === clauseId);
		clauseState.added.splice(addedIndex, 1);
		const updatedIndex = clauseState.updated.findIndex(({ id }) => id === clauseId);
		clauseState.updated.splice(updatedIndex, 1);
	}

	resetClauseState() {
		clauseState = {
			added: [],
			updated: [],
			deleted: []
		};
	}

	completeContract(
		contract: EmploymentContract | TransferContract | AgentContract,
		type: ContractTypeForApi
	): EmploymentContract | TransferContract | AgentContract {
		if (contract) {
			contract = this.completeCommonFields(contract);
			switch (type) {
				case 'employment':
					return this.completeEmploymentContract(contract as EmploymentContract);
				case 'transfer':
					return this.completeTransferContract(contract as TransferContract);
				case 'agent':
					return this.completeAgentContract(contract as AgentContract);
				default:
					return contract;
			}
		} else {
			return contract;
		}
	}

	private completeCommonFields(
		contract: EmploymentContract | TransferContract | AgentContract
	): EmploymentContract | TransferContract | AgentContract {
		if (!contract._attachments) contract._attachments = [];
		if (!contract.changeHistory) contract.changeHistory = [];
		return contract;
	}

	private completeAgentContractForOthers(
		contract: EmploymentContract | TransferContract
	): EmploymentContract | TransferContract {
		if (!contract.agentContracts || isEmpty(contract.agentContracts)) {
			contract.agentContracts = [new AgentContract()];
		} else {
			contract.agentContracts.forEach(agentContract => {
				agentContract = { ...new AgentContract(), ...agentContract };
				if (!agentContract.fee) agentContract.fee = [];
				if (!isArray(agentContract.fee)) agentContract.fee = [agentContract.fee];
			});
		}
		return contract;
	}

	private completeTransferContract(contract: TransferContract): TransferContract {
		if (!contract.valorization) contract.valorization = [];
		if (contract.amountAsset === undefined || contract.amountAsset === null) contract.amountAsset = true;
		if (contract.mechanismSolidarity) {
			if (!contract.mechanismSolidarityType) contract.mechanismSolidarityType = 'remove';
			else if (contract.mechanismSolidarityType === 'add') {
				if (!contract.mechanismSolidarityAsset === undefined || contract.mechanismSolidarityAsset === null)
					contract.mechanismSolidarityAsset = true;
			}
		}
		contract = this.completeAgentContractForOthers(contract) as TransferContract;
		return contract;
	}

	completeEmploymentContract(contract: EmploymentContract): EmploymentContract {
		contract.insurance = { ...new Insurance(), ...contract.insurance };
		if (contract.insurance && !contract.insurance.amount) contract.insurance = null;
		if (!contract.benefits || contract.benefits.length === 0) {
			contract.benefits = [
				new Benefit('house'),
				new Benefit('car'),
				new Benefit('phone'),
				new Benefit('travels'),
				new Benefit('school'),
				new Benefit('expensesReimbursement')
			];
		} else {
			contract.benefits.forEach(x => (x.season = x.season ? x.season.filter(s => s) : []));
		}
		if (!contract.additionalClauses) contract.additionalClauses = [];
		if (!contract.options) contract.options = [];
		if (!contract.commercialRights) contract.commercialRights = [];
		contract = this.completeAgentContractForOthers(contract) as EmploymentContract;
		return contract;
	}

	private completeAgentContract(contract: AgentContract): AgentContract {
		return contract;
	}

	isValidAgentContract(contract: AgentContract): boolean {
		return true;
	}

	isValidTransferContract(contract: TransferContract): boolean {
		return contract ? !!contract.personStatus && this.isValidAmount(contract) && !!contract.on : true;
	}

	private isValidAmount(contract: TransferContract): boolean {
		return contract.personStatus === 'onLoan' || contract.personStatus === 'freeTransfer' ? true : !!contract.amount;
	}

	isValidEmploymentContract(contract: EmploymentContract): boolean {
		return contract
			? !!contract.personStatus &&
					!!contract.dateFrom &&
					!!contract.dateTo &&
					!this.hasMissingFieldsEmployment(contract)
			: true;
	}

	private hasMissingFieldsEmployment(contract: EmploymentContract): boolean {
		const hasIncompleteBenefits = contract.benefits.some(
			benefit => benefit.enabled && isNullOrUndefined(benefit.amount) && isNullOrUndefined(benefit.grossAmount)
		);
		const hasIncompleteInsurance: boolean =
			contract.insurance &&
			(!isNullOrUndefined(contract.insurance.amount) || !isNullOrUndefined(contract.insurance.grossAmount)) &&
			!contract.insurance.prize;
		const hasIncompleteAdditionalClauses = contract.additionalClauses.some(x => !x.value);
		const hasIncompleteCommercialRights = contract.commercialRights.some(x => !x.value);
		const hasIncompleteOptions = contract.options.some(x => !x.value);
		const hasIncompleteBuyout = contract.buyout.some(
			x => isNullOrUndefined(x.amount) && isNullOrUndefined(x.grossAmount)
		);
		return (
			hasIncompleteBenefits ||
			hasIncompleteInsurance ||
			hasIncompleteAdditionalClauses ||
			hasIncompleteCommercialRights ||
			hasIncompleteOptions ||
			hasIncompleteBuyout
		);
	}
}

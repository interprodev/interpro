import { DecimalPipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { v4 as uuid } from 'uuid';
import {
	Agent,
	AgentContract,
	BasicWage,
	Bonus,
	Club,
	EmploymentContract,
	LoanOption,
	Player,
	PlayerTransfer,
	Staff,
	Team,
	TransferClause,
	TransferContract
} from '../../lib';
import { CompetitionsConstantsService } from './../../../../../utils/common-utils/src/services/competitions/competitions.service';
import { CurrentTeamService } from './../../../../auth/src/services/current-team.service';
export class Benefit {
	id: string = null;
	enabled = false;
	name: string = null;
	amount: string = null;
	grossAmount: number = null;
	installments: Installment[] = [];
	season: any[] = [];
	asset = false;
	notes = '';
	constructor(name) {
		this.name = name;
		this.id = uuid();
	}
}
export class BuyOutClause {
	id: any = null;
	amount: number = null;
	grossAmount: number = null;
	where: string = null;
	from: Date = null;
	to: Date = null;
}
export class Insurance {
	id: any = null;
	amount: number = null;
	grossAmount: number = null;
	asset: string = null;
	frequency: string = null;
	prize: number = null;
}
export class StringControl {
	id: string = null;
	value = '';
	constructor() {
		this.id = uuid();
	}
}
export class Installment {
	id: string = null;
	date: Date = null;
	value: number = null;
	season: string = null;
	constructor() {
		this.id = uuid();
	}
}
export class Contribution {
	id: string = null;
	amount: number = null;
	grossAmount: number = null;
	startDate: Date = null;
	untilDate: Date = null;
	season: any[] = [];
	asset: boolean = false;
	installments: Installment[] = [];
	constructor() {
		this.id = uuid();
	}
}
export class PreCondition {
	date: Date = null;
	competition: string[] = [];
}
export class BonusCap {
	amount: number = null;
	grossAmount: number = null;
	bonuses: any[] = [];
}
export interface ClauseStateElement {
	id?: string;
	type: StringBonusWithAgentContract;
	value?: BasicWage | Bonus | LoanOption | TransferClause;
	agent?: boolean;
}
export interface ClauseState {
	added: ClauseStateElement[];
	updated: ClauseStateElement[];
	deleted: ClauseStateElement[];
}
export type ContractPersonType = 'Player' | 'Staff' | 'Agent' | 'PlayerTransfer';
export type ContractPersonModel = Player | Staff | Agent | PlayerTransfer;
export type ContractPersonStatus = 'freeTransfer' | 'purchased' | 'inTeamOnLoan' | 'homegrown' | 'sell' | 'onLoan';
export type StringBonus =
	| 'appearanceFee'
	| 'appearance'
	| 'performance'
	| 'performanceFee'
	| 'standardTeam'
	| 'signing'
	| 'custom'
	| 'basicWage'
	| 'contribution'
	| 'privateWriting'
	| 'valorization'
	| 'fee'
	| 'transferFee'
	| 'buyout'
	| 'sellOnFee'
	| 'buyBack'
	| 'insurance'
	| 'benefits'
	| 'loanOption'
	| 'additionalClauses'
	| 'commercialRights'
	| 'options';
export type StringBonusWithAgentContract = StringBonus | 'agentContract';
export interface ContractFormValue {
	contract: EmploymentContract | TransferContract;
	agentContracts: AgentContract[];
}
export interface EditContractEvent {
	showConfirmationDialog?: boolean;
	contractType?: ContractTypeString;
	transferType?: TransferTypeString;
	contractData?: TransferContract | EmploymentContract;
	copyData?: boolean;
}
export type ContractTypeString = 'employment' | 'transfer';
export type TransferTypeString = 'inward' | 'outward';
export type ContractType = 'EmploymentContract' | 'TransferContract' | 'AgentContract';
export interface ContractReportDeps {
	numberPipe: DecimalPipe;
	translate: TranslateService;
	competitionService: CompetitionsConstantsService;
	club: Club;
	team: Team;
	postTaxes: boolean;
	translation: any;
	currentTeamService: CurrentTeamService;
}

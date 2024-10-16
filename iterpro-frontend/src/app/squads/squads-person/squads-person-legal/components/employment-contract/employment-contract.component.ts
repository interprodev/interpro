import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgForm } from '@angular/forms';
import {
	Agent,
	AgentContract,
	Attachment,
	BasicWage,
	Benefit,
	Bonus,
	BuyOutClause,
	Club,
	ContractFormValue,
	ContractPersonType,
	Customer,
	EmploymentContract,
	Insurance,
	LoopBackAuth,
	StringBonus,
	StringBonusWithAgentContract,
	StringControl,
	Team,
	TeamSeason,
	TransferContract,
	TransferTypeString
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	ErrorService,
	getChangeLogLabel, getTeamSettings,
	insertAtIndex,
	sortByDateDesc,
	TINY_EDITOR_OPTIONS, userHasPermission
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { getTotalElementsAmountForSeasonNew } from 'libs/shared/utils/common-utils/src/utils/functions/finance/legal.functions';
import { cloneDeep } from 'lodash';
import * as moment from 'moment';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { v4 as uuid } from 'uuid';
import { booleanRelationOptions, conditionalTypes, terminationItems, types } from '../../utils/contract-options';
import { BonusStringBuilderService } from '../../services/bonus-string-builder.service';
import { ContractService } from '../../services/contract.service';
import { BonusService } from '../../services/bonus.service';

export const frequencyOptions = [
	{ label: 'none', value: null },
	{ label: 'monthly', value: 'monthly' },
	{ label: 'yearly', value: 'yearly' },
	{ label: 'contractDuration', value: 'contractDuration' }
];

@UntilDestroy()
@Component({
	selector: 'iterpro-employment-contract',
	templateUrl: './employment-contract.component.html',
	styleUrls: ['./employment-contract.component.css'],
	providers: [
		DecimalPipe,
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => EmploymentContractComponent),
			multi: true
		}
	]
})
export class EmploymentContractComponent implements ControlValueAccessor, OnInit, OnChanges {
	@Input() _contract: EmploymentContract;
	@Input({required: true}) personType: ContractPersonType = null;
	@Input({required: true}) personId: string;
	@Input({required: true}) editMode = false;
	@Input({required: true}) financial = false;
	@Input({required: true}) team: Team;
	@Input({required: true}) currency: string;
	@Input({required: true}) seasons: TeamSeason[];
	@Input({required: true}) agents: Agent[];
	@Input({required: true}) club: Club;
	@Input({required: true}) customers: Customer[] = [];
	@Input({required: true}) extended = false;
	@Input({required: true}) postTaxes = false;
	@Input({required: true}) translation: object;
	@Input({required: true}) employments: EmploymentContract[] = [];
	@Input({required: true}) inwards: TransferContract[] = [];
	@Input({required: true}) outwards: TransferContract[] = [];
	@Output() submitContract: EventEmitter<ContractFormValue> = new EventEmitter<ContractFormValue>();
	status = true;
	validated = false;
	linkRenew = false;
	linkRenewContractId: string = null;
	tempTransferContractId: string = null;
	contractsList: SelectItem[] = [];
	outwardsList: SelectItem[] = [];
	inwardsList: SelectItem[] = [];
	totalWages = 0;
	totalYearlyAvgWage = 0;
	agentContracts: AgentContract[];
	basicWageBonuses: BasicWage[] = [];
	contributionBonuses: BasicWage[] = [];
	privateWritingBonuses: BasicWage[] = [];
	appearanceFeeBonuses: Bonus[] = [];
	appearanceBonuses: Bonus[] = [];
	performanceBonuses: Bonus[] = [];
	performanceFeeBonuses: Bonus[] = [];
	standardTeamBonuses: Bonus[] = [];
	signingBonuses: Bonus[] = [];
	customBonuses: Bonus[] = [];
	selectedBonus: BasicWage | Bonus | BuyOutClause | Insurance | Benefit | StringControl = null;
	visibleBonusPanel = false;
	type: StringBonus = null;
	newBonus = true;
	tempIndex: number = null;
	visibleAttachments = false;
	viewHistory = false;
	types: SelectItem[] = types;
	agentActiveIndex = 0;
	bonusDataLoading = false;
	contractDataLoading = false;
	private frequencyOptions: SelectItem[] = frequencyOptions;
	private terminationItems: SelectItem[] = terminationItems;
	private tempStatus: boolean;
	private tempValidated: boolean;
	private tempRenew: boolean;
	private tempRenewContractId: string = null;
	private isAgentContractComplete = true;
	protected readonly tinyEditorInit = TINY_EDITOR_OPTIONS;
	constructor(
		private error: ErrorService,
		private translate: TranslateService,
		private confirmationService: ConfirmationService,
		private auth: LoopBackAuth,
		private contractService: ContractService,
		private bonusService: BonusService,
		private bonusStringBuilder: BonusStringBuilderService,
		private notificationService: AlertService
	) {}

	ngOnInit() {
		this.mapDropdownElements();
		if (!this.personId || !this.personType) {
			console.error('personId or personType is not defined, please check the component');
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		// if (changes['employments'] && this.employments) {
		// 	this.contractsList = this.getContractList(this.employments);
		// }

		if (changes['inwards'] && this.inwards) {
			if (this.personType === 'Player' || this.personType === 'PlayerTransfer') {
				this.inwardsList = this.getTransfersList(this.inwards);
			}
		}

		if (changes['outwards'] && this.outwards) {
			if (this.personType === 'Player' || this.personType === 'PlayerTransfer') {
				this.outwardsList = this.getTransfersList(this.outwards);
			}
		}

		if (changes['editMode']) {
			if (this.editMode) {
				this.tempTransferContractId = this._contract?.transferContractId || null;
				this.tempRenew = this._contract?.renew;
				this.tempRenewContractId = this._contract?.renewContractId || null;
			}
			this.contractService.resetClauseState();
		}

		if (changes['postTaxes']) {
			this.updateHelperSalary();
		}
	}

	get contract(): EmploymentContract {
		return this._contract;
	}

	set contract(contract: EmploymentContract) {
		this.contractDataLoading = true;
		this._contract = this.contractService.completeContract(contract, 'employment') as EmploymentContract;
		this.status = this._contract ? this._contract.status : false;
		this.validated = this._contract ? this._contract.validated : false;
		this.linkRenew = this._contract ? this._contract.renew : false;
		this.linkRenewContractId = this._contract ? this._contract.renewContractId : null;
		this.contractsList = this.getContractList(this.employments);
		setTimeout(() => {
			this.contractDataLoading = false;
		}, 500);
		this.getContractOptions(this._contract);
	}

	writeValue(value: EmploymentContract) {
		this.contract = value;
	}

	propagateChange = (contract: EmploymentContract) => {};

	registerOnChange(fn: (x: any) => {}) {
		this.propagateChange = fn;
	}

	registerOnTouched() {}

	private mapDropdownElements() {
		this.frequencyOptions = this.frequencyOptions.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.terminationItems = this.terminationItems.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.types = this.types.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
	}

	private getContractOptions(contract: EmploymentContract) {
		this.bonusDataLoading = true;
		if (contract?.id) {
			this.contractService
				.getContractOptions(contract, 'employment')
				.pipe(untilDestroyed(this))
				.subscribe({
					next: ([bonuses, basicWages, contributions, privateWritings, agentContracts]: [
						Bonus[],
						BasicWage[],
						BasicWage[],
						BasicWage[],
						AgentContract[]
					]) => {
						this.agentContracts = agentContracts || [];
						this.basicWageBonuses = basicWages;
						this.contributionBonuses = contributions;
						this.privateWritingBonuses = privateWritings;
						this.appearanceFeeBonuses = bonuses.filter(bonus => bonus.type === 'appearanceFee');
						this.appearanceBonuses = bonuses.filter(bonus => bonus.type === 'appearance');
						this.performanceBonuses = bonuses.filter(bonus => bonus.type === 'performance');
						this.performanceFeeBonuses = bonuses.filter(bonus => bonus.type === 'performanceFee');
						this.standardTeamBonuses = bonuses.filter(bonus => bonus.type === 'standardTeam');
						this.signingBonuses = bonuses.filter(bonus => bonus.type === 'signing');
						this.customBonuses = bonuses.filter(bonus => bonus.type === 'custom');
						this.updateHelperSalary();
						this.bonusDataLoading = false;
					},
					error: (error: Error) => this.error.handleError(error)
				});
		} else {
			this.agentContracts = [];
			this.basicWageBonuses = [];
			this.contributionBonuses = [];
			this.privateWritingBonuses = [];
			this.appearanceFeeBonuses = [];
			this.appearanceBonuses = [];
			this.performanceBonuses = [];
			this.performanceFeeBonuses = [];
			this.standardTeamBonuses = [];
			this.signingBonuses = [];
			this.customBonuses = [];
			this.updateHelperSalary();
			this.bonusDataLoading = false;
		}
	}

	private getContractList(contracts: EmploymentContract[]): SelectItem[] {
		return sortByDateDesc(contracts, 'dateFrom')
			.filter(({ id }) => !this._contract || id !== this._contract.id)
			.map(contract => ({
				label: `${moment(contract.dateFrom).format('DD/MM/YYYY')} - ${this.translate.instant(
					'admin.contracts.type.' + contract.personStatus
				)}`,
				value: contract.id
			}));
	}

	private getTransfersList(contracts: TransferContract[]): SelectItem[] {
		return sortByDateDesc(contracts, 'on').map(contract => ({
			label: `${moment(contract.on).format('DD/MM/YYYY')} - ${this.translate.instant(
				'admin.contracts.type.' + contract.personStatus
			)}`,
			value: contract.id
		}));
	}

	addAgentContract() {
		this.agentContracts = [
			...(this.agentContracts || []),
			this.contractService.createAgentContract(this.auth.getCurrentUserId())
		];
		this.agentActiveIndex = this.agentContracts.length - 1;
	}

	onSubmit(form: NgForm) {
		if (form.valid) {
			this.contractDataLoading = true;
			this.bonusDataLoading = true;
			this.submitContract.emit({ contract: this._contract, agentContracts: this.agentContracts });
		} else {
			const firstInvalidControl: string = Object.keys(form.controls).find(key => form.controls[key].invalid);
			const changelogLabel = getChangeLogLabel(firstInvalidControl, 'contract');
			this.notificationService.notify(
				'warn',
				'warning',
				this.translate.instant('formField.isRequired', {
					value: changelogLabel ? this.translate.instant(changelogLabel) : firstInvalidControl
				})
			);
		}
	}

	updateHelperSalary() {
		if (!this.contract?.dateFrom || !this.contract?.dateTo) return;
		const duration = Math.round(
			Math.ceil(moment(this.contract?.dateTo).diff(moment(this.contract?.dateFrom), 'days')) / 365
		);
		this.totalWages = getTotalElementsAmountForSeasonNew(
			this.contract,
			this.basicWageBonuses,
			this.postTaxes,
			this.club.taxes
		);
		this.totalYearlyAvgWage = this.totalWages / (duration && duration > 0 ? duration : 1);
	}

	addContractClause(type: StringBonus) {
		let bonus: BasicWage | Bonus | BuyOutClause | Insurance | Benefit | StringControl;
		switch (type) {
			case 'basicWage':
			case 'contribution':
			case 'privateWriting':
				bonus = new BasicWage({
					type,
					season: [],
					amount: null,
					installments: [],
					conditions: [],
					personId: this.personId,
					personType: this.personType,
					conditionRelationFlag: booleanRelationOptions[0].value
				});
				break;
			case 'appearanceFee':
			case 'appearance':
			case 'performance':
			case 'standardTeam':
			case 'signing':
			case 'performanceFee':
			case 'custom':
				bonus = new Bonus({
					type,
					amount: null,
					installments: [],
					conditions: [],
					personId: this.personId,
					personType: this.personType,
					conditionRelationFlag: booleanRelationOptions[0].value
				});
				break;
			case 'buyout':
				bonus = new BuyOutClause();
				break;
			case 'insurance':
				bonus = new Insurance();
				break;
			case 'benefits': {
				bonus = new Benefit('');
				this.tempIndex = cloneDeep(this.contract[type].length);
				break;
			}
			default:
				bonus = new StringControl();
				break;
		}
		this.selectedBonus = bonus;
		this.newBonus = true;
		this.type = type;
		this.visibleBonusPanel = true;
	}

	editContractClause(
		bonus: BasicWage | Bonus | BuyOutClause | Insurance | Benefit | StringControl,
		type: StringBonus,
		index?: number
	) {
		this.selectedBonus = cloneDeep(bonus);
		this.tempIndex = index;
		this.type = type;
		this.newBonus = false;
		this.visibleBonusPanel = true;
	}

	onCloseBonusDialog() {
		if (this.newBonus) {
			if (conditionalTypes.includes(this.type)) {
				this.selectedBonus['localId'] = uuid();
				this.contractService.addNewClauseToState(this.selectedBonus as BasicWage | Bonus, this.type, false);
				this[this.type + 'Bonuses'].push(this.selectedBonus);
			} else {
				if (this.type !== 'insurance') this.contract[this.type].push(this.selectedBonus);
				else this.contract[this.type] = this.selectedBonus;
			}
		} else {
			if (conditionalTypes.includes(this.type)) {
				if (!this.selectedBonus.id) {
					this.contractService.addNewClauseToState(this.selectedBonus as BasicWage | Bonus, this.type, false);
				} else {
					this.contractService.addEditClauseToState(this.selectedBonus as BasicWage | Bonus, this.type, false);
				}
				this[this.type + 'Bonuses'][this.tempIndex] = this.selectedBonus;
			} else {
				this.contract[this.type][this.tempIndex] = this.selectedBonus;
			}
		}
		this.closePanel();
	}

	deleteContractClause(
		value: BasicWage | Bonus | BuyOutClause | Insurance | Benefit | StringControl | AgentContract,
		field: StringBonusWithAgentContract,
		index?: number
	) {
		if (field === 'agentContract') {
			if (value.id) {
				this.contractService.addRemoveClauseToState(value as AgentContract, field, false);
			}
			this.agentContracts.splice(index, 1);
		} else if (conditionalTypes.includes(field)) {
			if (value.id) {
				this.contractService.addRemoveClauseToState(value as BasicWage | Bonus, field, false);
			}
			this.contractService.removeClauseFromState(value.id || value['localId']);
			this[field + 'Bonuses'].splice(index, 1);
		} else {
			if (field === 'insurance') this.contract.insurance = null;
			else this.contract[field].splice(index, 1);
			this.updateHelperSalary();
		}
	}

	cloneContractClause(
		value: BasicWage | Bonus | BuyOutClause | Insurance | Benefit | StringControl,
		field: StringBonus,
		index: number
	) {
		const cloned = cloneDeep(value);
		cloned['localId'] = uuid();
		delete cloned.id;
		if (conditionalTypes.includes(field)) {
			this.contractService.addNewClauseToState(cloned as BasicWage | Bonus, field, false);
			this[field + 'Bonuses'] = insertAtIndex(this[field + 'Bonuses'], cloned, index);
		} else {
			this.contract[field] = insertAtIndex(this.contract[field], cloned, index);
		}
	}

	closePanel() {
		this.visibleBonusPanel = null;
		this.tempIndex = null;
		this.type = null;
		this.newBonus = null;
		this.selectedBonus = null;
		this.updateHelperSalary();
	}

	confirmStatusChange(event) {
		event.originalEvent.stopPropagation();
		this.confirmationService.confirm({
			message: event.checked
				? this.translate.instant('admin.contracts.confirmStatus')
				: this.translate.instant('admin.contracts.confirmStatusUnactive'),
			header: 'IterPRO',
			accept: () => {
				this.contract.status = this.status;
			},
			reject: () => {
				this.status = this.tempStatus;
				this.contract.status = this.status;
			}
		});
	}

	confirmRenewChange(event: string) {
		this.confirmationService.confirm({
			message: event
				? this.translate.instant('admin.contracts.confirmRenew')
				: this.translate.instant('admin.contracts.confirmRenewUnactive'),
			header: 'IterPRO',
			accept: () => {
				this.linkRenew = !!event;
				this.linkRenewContractId = event;
				this.contract.renew = !!event;
				this.contract.renewContractId = this.linkRenewContractId;
			},
			reject: () => {
				this.linkRenew = this.tempRenew;
				this.linkRenewContractId = this.tempRenewContractId;
				this.contract.renew = this.linkRenew;
				this.contract.renewContractId = this.linkRenewContractId;
			}
		});
	}

	confirmTransferContractChange(contractId: string, contractType: TransferTypeString) {
		let message: string;
		switch (contractType) {
			case 'inward':
				message = contractId
					? this.translate.instant('admin.contracts.confirmInward')
					: this.translate.instant('admin.contracts.confirmInwardUnactive');
				break;
			case 'outward':
				message = contractId
					? this.translate.instant('admin.contracts.confirmOutward')
					: this.translate.instant('admin.contracts.confirmOutwardUnactive');
				break;
		}
		this.confirmationService.confirm({
			message,
			header: 'IterPRO',
			accept: () => {
				this.contract.transferContractId = contractId;
			},
			reject: () => {
				this.contract.transferContractId = this.tempTransferContractId;
			}
		});
	}
	confirmValidateChange(event) {
		event.originalEvent.stopPropagation();
		this.confirmationService.confirm({
			message: event.checked
				? this.translate.instant('admin.contracts.confirmValidate')
				: this.translate.instant('admin.contracts.confirmValidateUnactive'),
			header: 'IterPRO',
			accept: () => {
				this.contract.validated = event.checked;
			},
			reject: () => {
				this.validated = this.tempValidated;
				this.contract.validated = this.validated;
			}
		});
	}

	canViewNotarize(): boolean {
		return this.checkPermission('notarize') || this.checkPermission('legal-admin');
	}
	canViewDeNotarize(): boolean {
		return this.checkPermission('legal-admin');
	}

	getBasicWageText(wage: BasicWage, type: 'basicWage' | 'valorization', index: number): string {
		return this.bonusStringBuilder.getBasicWageText(
			wage,
			type,
			false,
			this.extended,
			this.postTaxes,
			this.club,
			false,
			index,
			null
		);
	}
	getBonusText(bonus: Bonus, index: number): string {
		return this.bonusStringBuilder.getBonusText(
			bonus,
			false,
			null,
			this.extended,
			this.postTaxes,
			this.club,
			null,
			index
		);
	}

	getBuyoutText(buyout: BuyOutClause): string {
		return this.bonusStringBuilder.getBuyoutText(buyout, this.postTaxes, this.club);
	}

	getInsuranceText(insurance: Insurance): string {
		if (insurance) return this.bonusStringBuilder.getInsuranceText(insurance, this.postTaxes, this.club);
	}

	getBenefitText(benefit: Benefit, index: number) {
		return this.bonusStringBuilder.getBenefitText(benefit, index, this.extended, this.postTaxes, this.club);
	}

	getContributionText(bonus: BasicWage, index: number): string {
		return this.bonusStringBuilder.getContributionText(
			bonus,
			'contribution',
			false,
			this.extended,
			this.postTaxes,
			this.club,
			index
		);
	}

	onChangeAgentContract(flag: boolean) {
		this.isAgentContractComplete = flag;
	}

	isContractComplete(): boolean {
		if (!this.contractService.isValidEmploymentContract(this.contract)) {
			return false;
		}
		const allBonuses: (Bonus | BasicWage)[] = [
			...this.appearanceBonuses,
			...this.performanceBonuses,
			...this.standardTeamBonuses,
			...this.signingBonuses,
			...this.customBonuses,
			...this.basicWageBonuses,
			...this.privateWritingBonuses
		];
		return this.areValidBonuses(allBonuses) && this.isAgentContractComplete;
	}

	private areValidBonuses(bonuses: (Bonus | BasicWage)[]): boolean {
		return bonuses.every(bonus => this.bonusService.isValid(this.contract.validated, bonus));
	}

	isValid(bonus: Bonus | BasicWage): boolean {
		return this.bonusService.isValid(this.contract.validated, bonus);
	}

	openHistory() {
		this.viewHistory = true;
	}

	openFileDialog() {
		this.visibleAttachments = true;
	}

	onSaveAttachments(event: Attachment[]) {
		this.visibleAttachments = false;
		this.contract._attachments = event;
	}

	onDiscardAttachments() {
		this.visibleAttachments = false;
	}

	checkDateInsideSeasons(date: Date): boolean {
		return (
			date &&
			!(this.seasons || []).some(season =>
				moment(date).isBetween(moment(season.offseason), moment(season.inseasonEnd), 'day', '[]')
			)
		);
	}
	private checkPermission(permission: string): boolean {
		const user = this.auth.getCurrentUserData();
		const teamSettings = getTeamSettings(user?.teamSettings, user.currentTeamId);
		return userHasPermission(teamSettings, permission);
	}

	filterAgents(agents: Agent[], contractId: string, index: number): Agent[] {
		const otherContractsAgentIds = this.agentContracts
			.filter(({ id }, i) => (id && id !== contractId) || i !== index)
			.map(({ agentId }) => agentId);
		return agents.filter(({ id }) => !otherContractsAgentIds.includes(id));
	}

	// From Piercarlo Serena: not sure about this, it is duplicated code from financial-utils.js but I don't see any alternatives
}

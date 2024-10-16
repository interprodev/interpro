import { Component, EventEmitter, forwardRef, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgForm } from '@angular/forms';
import {
	Agent,
	AgentContract,
	Attachment,
	BasicWage,
	Bonus,
	Club,
	ContractFormValue,
	ContractPersonType,
	Customer,
	LoanOption,
	LoopBackAuth,
	StringBonus,
	StringBonusWithAgentContract,
	Team,
	TeamSeason,
	TransferClause,
	TransferContract
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	BlockUiInterceptorService,
	ErrorService,
	getChangeLogLabel, getTeamSettings,
	insertAtIndex,
	ProviderIntegrationService,
	TINY_EDITOR_OPTIONS, userHasPermission
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import * as moment from 'moment';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { BonusStringBuilderService, isNullOrUndefined } from '../../services/bonus-string-builder.service';
import { BonusService } from '../../services/bonus.service';
import { ContractService } from '../../services/contract.service';
import { booleanRelationOptions, conditionalTypes } from '../../utils/contract-options';
import { AutoCompleteSelectEvent } from 'primeng/autocomplete';

export const optionItems: SelectItem[] = [
	{ label: 'admin.contract.option.none', value: 'none' },
	{ label: 'admin.contract.option.right', value: 'right' },
	{ label: 'admin.contract.option.obligation', value: 'obligation' }
];
export const optionActions: SelectItem[] = [
	{ label: 'admin.contract.option.purchase', value: 'purchase' },
	{ label: 'admin.contract.option.loanRenewal', value: 'loanRenewal' }
];
export const originItems: SelectItem[] = [
	{ label: 'admin.contracts.origin.freeTransfer', value: 'freeTransfer' },
	{ label: 'admin.contracts.origin.purchased', value: 'purchased' },
	{ label: 'admin.contracts.origin.inTeamOnLoan', value: 'inTeamOnLoan' },
	{ label: 'admin.contracts.origin.homegrown', value: 'homegrown' }
];
export const outwardItems: SelectItem[] = [
	{ label: 'admin.contracts.type.sell', value: 'sell' },
	{ label: 'admin.contracts.type.onLoan', value: 'onLoan' }
	// { label: "admin.contracts.type.swap", value: "swap" }
];

export const optionOptionsItems: SelectItem[] = [
	{ label: '€', value: false },
	{ label: '%', value: true }
];

@UntilDestroy()
@Component({
	selector: 'iterpro-transfer-contract',
	templateUrl: './transfer-contract.component.html',
	styleUrls: ['./transfer-contract.component.css'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => TransferContractComponent),
			multi: true
		}
	]
})
export class TransferContractComponent implements ControlValueAccessor, OnInit, OnChanges {
	@Input({required: true}) personType: ContractPersonType = null;
	@Input({required: true}) personId: string;
	@Input() _contract: TransferContract;
	@Input({required: true}) editMode = false;
	@Input({required: true}) financial = false;
	@Input({required: true}) team: Team;
	@Input({required: true}) currency: string;
	@Input({required: true}) seasons: TeamSeason[];
	@Input({required: true}) agents: Agent[];
	@Input({required: true}) outward = false;
	@Input({required: true}) club: Club;
	@Input({required: true}) translation: any;
	@Input({required: true}) extended = false;
	@Input({required: true}) postTaxes = false;
	@Input({required: true}) customers: Customer[];

	@Output() submitContract: EventEmitter<ContractFormValue> = new EventEmitter<ContractFormValue>();

	visible = false;
	visibleBonusPanel: any = false;
	newBonus = true;
	viewHistory = false;
	agentContracts: AgentContract[];
	appearanceBonuses: Bonus[] = [];
	performanceBonuses: Bonus[] = [];
	standardTeamBonuses: Bonus[] = [];
	signingBonuses: Bonus[] = [];
	customBonuses: Bonus[] = [];
	buyBackBonuses: TransferClause[] = [];
	sellOnFeeBonuses: TransferClause[] = [];
	loanOptionBonuses: LoanOption[] = [];
	valorizationBonuses: BasicWage[] = [];
	originItems: SelectItem[] = originItems;
	outwardItems: SelectItem[] = outwardItems;
	validated: boolean;

	tempIndex: number = null;
	type: StringBonus;
	selectedBonus: BasicWage | Bonus | TransferClause | LoanOption | TransferContract = null;
	thirdPartyClubs: SelectItem[] = [];
	selectedClub: SelectItem;
	agentActiveIndex = 0;
	protected readonly tinyEditorInit = TINY_EDITOR_OPTIONS;
	isAgentContractComplete = true;
	bonusDataLoading = false;
	contractDataLoading = false;
	constructor(
		private translate: TranslateService,
		private confirmationService: ConfirmationService,
		private auth: LoopBackAuth,
		private error: ErrorService,
		private contractService: ContractService,
		private bonusService: BonusService,
		private providerIntegrationService: ProviderIntegrationService,
		private blockUiInterceptorService: BlockUiInterceptorService,
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
		if (changes['editMode']) {
			this.contractService.resetClauseState();
		}
	}

	get contract(): TransferContract {
		return this._contract;
	}

	set contract(contract: TransferContract) {
		this.contractDataLoading = true;
		this._contract = this.contractService.completeContract(contract, 'transfer') as TransferContract;
		this.validated = this._contract ? this._contract.validated : false;
		if (this._contract) this.mapPersistedClub();
		setTimeout(() => {
			this.contractDataLoading = false;
		}, 500);
		this.getContractOptions(this._contract);
	}

	writeValue(value: TransferContract) {
		this.contract = value;
	}

	propagateChange = (contract: TransferContract) => {};

	registerOnChange(fn: (x: any) => {}) {
		this.propagateChange = fn;
	}

	registerOnTouched() {}

	private mapDropdownElements() {
		this.originItems = this.originItems.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.outwardItems = this.outwardItems.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
	}

	private getContractOptions(contract: TransferContract) {
		this.bonusDataLoading = true;
		if (contract?.id) {
			this.contractService
				.getContractOptions(contract, 'transfer')
				.pipe(untilDestroyed(this))
				.subscribe({
					next: ([bonuses, buyBacks, sellOnFees, loanOptions, valorizations, agentContracts]: [
						Bonus[],
						TransferClause[],
						TransferClause[],
						LoanOption[],
						BasicWage[],
						AgentContract[]
					]) => {
						this.agentContracts = agentContracts || [];
						this.appearanceBonuses = bonuses.filter(bonus => bonus.type === 'appearance');
						this.performanceBonuses = bonuses.filter(bonus => bonus.type === 'performance');
						this.standardTeamBonuses = bonuses.filter(bonus => bonus.type === 'standardTeam');
						this.signingBonuses = bonuses.filter(bonus => bonus.type === 'signing');
						this.customBonuses = bonuses.filter(bonus => bonus.type === 'custom');
						this.buyBackBonuses = buyBacks.filter(x => x.type === 'buyBack');
						this.sellOnFeeBonuses = sellOnFees.filter(x => x.type === 'sellOnFee');
						this.loanOptionBonuses = loanOptions;
						this.valorizationBonuses = valorizations;
						this.bonusDataLoading = false;
					},
					error: (error: Error) => this.error.handleError(error)
				});
		} else {
			this.agentContracts = [];
			this.appearanceBonuses = [];
			this.performanceBonuses = [];
			this.standardTeamBonuses = [];
			this.signingBonuses = [];
			this.customBonuses = [];
			this.buyBackBonuses = [];
			this.sellOnFeeBonuses = [];
			this.loanOptionBonuses = [];
			this.valorizationBonuses = [];
			this.bonusDataLoading = false;
		}
	}

	private mapPersistedClub() {
		if (this.contract.club) {
			this.selectedClub = { label: this.contract.club, value: this.contract.club };
			this.contractService
				.getClub(this.contract)
				.pipe(untilDestroyed(this))
				.subscribe({
					next: data => {
						this.onThirdPartyClubsReceived(data, this.contract.club);
						this.selectedClub = this.thirdPartyClubs.find(
							({ value, label }) => String(value) === String(this.contract.club) || label === this.contract.club
						);
					},
					error: (error: Error) => this.error.handleError(error)
				});
		}
	}

	addContractClause(type: StringBonus) {
		let bonus: BasicWage | Bonus | TransferClause | LoanOption;
		switch (type) {
			case 'transferFee':
			case 'valorization':
				bonus = new BasicWage();
				break;
			case 'appearance':
			case 'performance':
			case 'standardTeam':
			case 'signing':
			case 'custom':
				bonus = new Bonus();
				break;
			case 'sellOnFee':
			case 'buyBack':
				bonus = new TransferClause();
				break;
			case 'loanOption':
				bonus = new LoanOption();
				break;
		}
		bonus = {
			...bonus,
			type,
			amount: null,
			asset: true,
			installments: [],
			conditions: [],
			personId: this.personId,
			personType: this.personType,
			transferType: this.outward ? 'outward' : 'inward',
			conditionRelationFlag: booleanRelationOptions[0].value
		};
		this.selectedBonus = bonus;
		this.newBonus = true;
		this.type = type;
		this.visibleBonusPanel = true;
	}

	editContractClause(
		bonus: BasicWage | Bonus | TransferClause | LoanOption | TransferContract,
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
		// if (this.type === 'appearance') {
		// 	this.selectedBonus.conditions.forEach(x => {
		// 		if (x.type !== 'makes') {
		// 			x.type = 'makes';
		// 		}
		// 	});
		// }
		if (this.type === 'transferFee') {
			this.contract.amount = this.selectedBonus.amount;
			this.contract.grossAmount = this.selectedBonus.grossAmount;
			this.contract.mechanismSolidarity = this.selectedBonus.mechanismSolidarity;
			this.contract.mechanismSolidarityType = this.selectedBonus['mechanismSolidarityType'];
			this.contract.mechanismSolidarityAsset = this.selectedBonus['mechanismSolidarityAsset'];
			this.contract.amountAsset = this.selectedBonus['amountAsset'];
			this.contract.installments = this.selectedBonus.installments;
			this.contract.within = this.selectedBonus.within;
			this.contract.withinDays = this.selectedBonus.withinDays;
			this.contract.withinMode = this.selectedBonus.withinMode;
		} else if (this.newBonus) {
			if (conditionalTypes.includes(this.type)) {
				this.selectedBonus['localId'] = uuid();
				this.contractService.addNewClauseToState(
					this.selectedBonus as BasicWage | Bonus | LoanOption | TransferClause,
					this.type,
					false
				);
				this[this.type + 'Bonuses'].push(this.selectedBonus);
			} else {
				this.contract[this.type].push(this.selectedBonus);
			}
		} else {
			if (conditionalTypes.includes(this.type)) {
				if (!this.selectedBonus.id) {
					this.contractService.addNewClauseToState(
						this.selectedBonus as BasicWage | Bonus | LoanOption | TransferClause,
						this.type,
						false
					);
				} else {
					this.contractService.addEditClauseToState(
						this.selectedBonus as BasicWage | Bonus | LoanOption | TransferClause,
						this.type,
						false
					);
				}
				this[this.type + 'Bonuses'][this.tempIndex] = this.selectedBonus;
			} else {
				this.contract[this.type][this.tempIndex] = this.selectedBonus;
			}
		}
		this.closePanel();
	}

	closePanel() {
		this.visibleBonusPanel = false;
		this.tempIndex = null;
		this.type = null;
		this.newBonus = null;
		this.selectedBonus = null;
	}

	cloneContractClause(value: BasicWage | Bonus | LoanOption | TransferClause, field: StringBonus, index: number) {
		const cloned = cloneDeep(value);
		delete cloned.id;
		cloned['localId'] = uuid();
		if (conditionalTypes.includes(field)) {
			this.contractService.addNewClauseToState(cloned as BasicWage | Bonus, field, false);
			this[field + 'Bonuses'] = insertAtIndex(this[field + 'Bonuses'], cloned, index);
		} else {
			this.contract[field] = insertAtIndex(this.contract[field], cloned, index);
		}
	}

	deleteContractClause(
		value: BasicWage | Bonus | LoanOption | TransferClause | AgentContract,
		field: StringBonusWithAgentContract,
		index: number
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
			this.contract[field].splice(index, 1);
		}
	}

	openFileDialog() {
		this.visible = true;
	}

	onSaveAttachments(event: Attachment[]) {
		this.contract._attachments = event;
		this.visible = false;
	}

	onDiscardAttachments() {
		this.visible = false;
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
				this.contract.validated = cloneDeep(this.validated);
			}
		});
	}

	getParams() {
		return {
			option: this.translate.instant(
				this.loanOptionBonuses && this.loanOptionBonuses[0] && this.loanOptionBonuses[0].option
					? 'admin.contract.option.' + this.loanOptionBonuses[0].option
					: 'emptyString'
			),
			action: this.translate.instant(
				this.loanOptionBonuses && this.loanOptionBonuses[0] && this.loanOptionBonuses[0].action
					? 'admin.contract.option.' + this.loanOptionBonuses[0].action
					: 'emptyString'
			)
		};
	}
	private checkPermission(permission: string): boolean {
		const user = this.auth.getCurrentUserData();
		const teamSettings = getTeamSettings(user?.teamSettings, user.currentTeamId);
		return userHasPermission(teamSettings, permission);
	}

	canViewNotarize(): boolean {
		return this.checkPermission('notarize') || this.checkPermission('legal-admin');
	}

	canViewDeNotarize(): boolean {
		return this.checkPermission('legal-admin');
	}

	getBasicWageText(wage: BasicWage, type: 'basicWage' | 'valorization', index: number): string {
		const club = this.thirdPartyClubs.find(
			({ value, label }) => value === this.contract.club || label === this.contract.club
		);
		return this.bonusStringBuilder.getBasicWageText(
			wage,
			type,
			true,
			this.extended,
			this.postTaxes,
			this.club,
			this.outward,
			index,
			club?.label || this.contract.club
		);
	}

	getBonusText(bonus: Bonus, index: number): string {
		return this.bonusStringBuilder.getBonusText(
			bonus,
			true,
			(!this.outward && this.selectedClub && this.selectedClub.label) || this.club.name,
			this.extended,
			this.postTaxes,
			this.club,
			null,
			index
		);
	}

	getTransferOptionText(bonus: TransferClause, percentage: boolean, index: number): string {
		return this.bonusStringBuilder.getTransferOptionText(
			bonus,
			percentage,
			(!this.outward && this.selectedClub && this.selectedClub.label) || this.club.name,
			this.extended,
			this.postTaxes,
			this.club,
			null,
			true,
			index
		);
	}

	getLoanOptionText(bonus: LoanOption, index: number): string {
		return this.bonusStringBuilder.getLoanOptionText(
			bonus,
			(!this.outward && this.selectedClub && this.selectedClub.label) || this.club.name,
			this.extended,
			this.postTaxes,
			this.club,
			null,
			true,
			index
		);
	}

	getTransferFee(contract: TransferContract): string {
		return this.bonusStringBuilder.getTransferFeeText(
			contract,
			(!this.outward && this.selectedClub && this.selectedClub.label) || this.club.name,
			this.extended,
			this.postTaxes,
			this.club,
			null,
			true
		);
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

	openHistory() {
		this.viewHistory = true;
	}

	onChangeAgentContract(flag: boolean) {
		this.isAgentContractComplete = flag;
	}
	isContractComplete(): boolean {
		if (!this.contractService.isValidTransferContract(this.contract)) {
			return false;
		}
		const allBonuses: (Bonus | BasicWage | TransferClause)[] = [
			...this.appearanceBonuses,
			...this.performanceBonuses,
			...this.standardTeamBonuses,
			...this.signingBonuses,
			...this.customBonuses,
			...this.buyBackBonuses,
			...this.sellOnFeeBonuses,
			...this.loanOptionBonuses,
			...this.valorizationBonuses
		];
		return this.areValidBonuses(allBonuses) && this.isAgentContractComplete;
	}

	private areValidBonuses(bonuses: (Bonus | BasicWage | TransferClause)[]): boolean {
		return bonuses.every(bonus => this.bonusService.isValid(this.contract.validated, bonus));
	}

	isValid(bonus: Bonus | BasicWage | TransferClause): boolean {
		return this.bonusService.isValid(this.contract.validated, bonus);
	}

	searchClub($event) {
		this.blockUiInterceptorService
			.disableOnce(
				of($event).pipe(
					map((event: any) => event.query),
					filter((query: string) => query && query.length > 2),
					distinctUntilChanged(),
					debounceTime(1000),
					switchMap(query => this.providerIntegrationService.searchTeam(query, false)),
					untilDestroyed(this)
				)
			)
			.subscribe({
				next: data => this.onThirdPartyClubsReceived(data, $event.query),
				error: error => void this.error.handleError(error)
			});
	}

	private onThirdPartyClubsReceived(data: any[], query: string) {
		if (data.length === 0) {
			this.thirdPartyClubs = [];
			this.contract.club = query;
		} else {
			this.thirdPartyClubs = data.map(x => ({ label: x.officialName, value: x.wyId }));
		}
	}

	selectClub(event: AutoCompleteSelectEvent) {
		this.contract.club = event.value.value.toString();
	}
	isNullOrUndefined(value: number): boolean {
		return isNullOrUndefined(value);
	}

	checkDateInsideSeasons(date: Date): boolean {
		return (
			date &&
			!(this.seasons || []).some(season =>
				moment(date).isBetween(moment(season.offseason), moment(season.inseasonEnd), 'day', '[]')
			)
		);
	}
}

import { Component, EventEmitter, forwardRef, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
	AgentContract,
	Bonus,
	Team,
	TeamSeason,
	Agent,
	BasicWage,
	Club,
	StringBonus,
	StringControl,
	ContractPersonType
} from '@iterpro/shared/data-access/sdk';
import { v4 as uuid } from 'uuid';
import { BonusService } from '../../services/bonus.service';
import { cloneDeep, isEmpty } from 'lodash';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SelectItem } from 'primeng/api';
import { AlertService, ErrorService, insertAtIndex, TINY_EDITOR_OPTIONS } from '@iterpro/shared/utils/common-utils';
import { ContractService } from '../../services/contract.service';
import { BonusStringBuilderService } from '../../services/bonus-string-builder.service';
import { conditionalTypes } from '../../utils/contract-options';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';
import { NgForOf, NgIf, NgStyle } from '@angular/common';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { BonusPanelComponent } from '../bonus-panel/bonus-panel.component';
import { MarkedPipe } from '@iterpro/shared/ui/pipes';
import { MaskDirective } from '@iterpro/shared/ui/directives';

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-agent-contract',
	templateUrl: './agent-contract.component.html',
	styleUrls: ['./agent-contract.component.css'],
	imports: [
		PrimeNgModule,
		TranslateModule,
		FormsModule,
		NgForOf,
		NgIf,
		EditorComponent,
		BonusPanelComponent,
		MarkedPipe,
		NgStyle,
		MaskDirective
	],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => AgentContractComponent),
			multi: true
		}
	]
})
export class AgentContractComponent implements ControlValueAccessor, OnChanges {
	@Input() _contract: AgentContract;
	@Input() disabled: boolean;
	@Input() currency: string;
	@Input() seasons: TeamSeason[];
	@Input() financial = false;
	@Input() team: Team;
	@Input() agents: Agent[] = [];
	@Input() outward = false;
	@Input() isTypeTransferContract = false;
	@Input() extended = false;
	@Input() translation: any;
	@Input() postTaxes: boolean;
	@Input() club: Club;
	@Output() contractChange: EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output() agentContractDelete: EventEmitter<AgentContract> = new EventEmitter<AgentContract>();

	agentsList: SelectItem[] = [];
	conditioned: boolean;
	tempIndex: number = null;
	type: StringBonus;
	newBonus: boolean;
	visibleBonusPanel: boolean;
	selectedBonus: BasicWage | Bonus | StringControl;
	feeBonuses: BasicWage[] = [];
	appearanceBonuses: Bonus[] = [];
	performanceBonuses: Bonus[] = [];
	standardTeamBonuses: Bonus[] = [];
	signingBonuses: Bonus[] = [];
	customBonuses: Bonus[] = [];

	protected readonly tinyEditorInit = TINY_EDITOR_OPTIONS;
	constructor(
		private error: ErrorService,
		private bonusService: BonusService,
		private contractService: ContractService,
		private notificationService: AlertService,
		private bonusStringBuilder: BonusStringBuilderService
	) {}

	ngOnChanges(changes: SimpleChanges) {
		const currentAgents = changes.agents?.currentValue;
		const previousAgents = changes.agents?.previousValue;
		if (currentAgents && currentAgents !== previousAgents) {
			this.mapDropdownElements();
		}
	}

	private mapDropdownElements() {
		this.agentsList = (this.agents || []).map(({ firstName, lastName, id }) => ({
			label: `${firstName} ${lastName}`,
			value: id
		}));
	}

	get contract() {
		return this._contract;
	}

	set contract(val: AgentContract) {
		this._contract = val;
		this.getContractOptions(this._contract);
	}

	writeValue(value: any) {
		if (value) {
			this.contract = value;
		}
	}

	propagateChange = (_: any) => {};

	registerOnTouched() {}

	registerOnChange(fn) {
		this.propagateChange = fn;
	}

	deleteAgentContract() {
		this.agentContractDelete.emit(this._contract);
	}

	private getContractOptions(contract: AgentContract) {
		if (contract && contract.id) {
			this.contractService
				.getContractOptions(contract, 'agent')
				.pipe(untilDestroyed(this))
				.subscribe({
					next: ([bonuses, basicWages]: [Bonus[], BasicWage[]]) => {
						this.feeBonuses = basicWages;
						this.appearanceBonuses = bonuses.filter(bonus => bonus.type === 'appearance');
						this.performanceBonuses = bonuses.filter(bonus => bonus.type === 'performance');
						this.standardTeamBonuses = bonuses.filter(bonus => bonus.type === 'standardTeam');
						this.signingBonuses = bonuses.filter(bonus => bonus.type === 'signing');
						this.customBonuses = bonuses.filter(bonus => bonus.type === 'custom');
					},
					error: (error: Error) => this.error.handleError(error)
				});
		}
	}

	addContractClause(type: StringBonus) {
		if (!this.contract?.agentId) {
			return this.notificationService.notify('warn', 'alert.missingFields', 'alert.missingAgent');
		}
		let bonus: BasicWage | Bonus | StringControl;
		switch (type) {
			case 'fee':
				bonus = new BasicWage();
				bonus = {
					...bonus,
					asset: this.isTypeTransferContract,
					season: [],
					amount: null,
					installments: [],
					conditions: []
				};
				break;
			case 'appearance':
			case 'performance':
			case 'standardTeam':
			case 'signing':
			case 'custom':
				bonus = new Bonus();
				bonus = {
					...bonus,
					type,
					asset: this.isTypeTransferContract,
					amount: null,
					installments: [],
					conditions: []
				};
				break;
			default:
				bonus = new StringControl();
				break;
		}
		bonus = {
			...bonus,
			personId: this.contract.agentId,
			personType: 'Agent' as ContractPersonType
		};
		this.selectedBonus = bonus;
		this.newBonus = true;
		this.type = type;
		this.visibleBonusPanel = true;
	}

	editContractClause(bonus: BasicWage | Bonus | StringControl, type: StringBonus, index?: number) {
		this.selectedBonus = cloneDeep(bonus);
		this.tempIndex = index;
		this.type = type;
		this.newBonus = false;
		this.visibleBonusPanel = true;
	}

	onCloseBonusDialog() {
		this.selectedBonus = {
			...this.selectedBonus,
			personId: this.contract.agentId,
			personType: 'Agent'
		};
		if (this.newBonus) {
			if (conditionalTypes.includes(this.type)) {
				this.selectedBonus['localId'] = uuid();
				this.contractService.addNewClauseToState(this.selectedBonus as BasicWage | Bonus, this.type, true);
				this[this.type + 'Bonuses'].push(this.selectedBonus);
			} else {
				this.contract[this.type] = this.selectedBonus;
			}
		} else {
			if (conditionalTypes.includes(this.type)) {
				if (!this.selectedBonus.id) {
					this.contractService.addNewClauseToState(this.selectedBonus as BasicWage | Bonus, this.type, true);
				} else {
					this.contractService.addEditClauseToState(this.selectedBonus as BasicWage | Bonus, this.type, true);
				}
				this[this.type + 'Bonuses'][this.tempIndex] = this.selectedBonus;
			} else {
				this.contract[this.type][this.tempIndex] = this.selectedBonus;
			}
		}
		this.closePanel();
	}

	deleteContractClause(value: BasicWage | Bonus | StringControl, field: StringBonus, index: number) {
		if (conditionalTypes.includes(field)) {
			if (value.id) {
				this.contractService.addRemoveClauseToState(value as BasicWage | Bonus, field, true);
			}
			this.contractService.removeClauseFromState(value.id || value['localId']);
			this[field + 'Bonuses'].splice(index, 1);
		} else {
			this.contract[field].splice(index, 1);
		}
	}

	cloneContractClause(value: BasicWage | Bonus | StringControl, field: StringBonus, index: number) {
		const cloned = cloneDeep(value);
		delete cloned.id;
		cloned['localId'] = uuid();
		if (conditionalTypes.includes(field)) {
			this.contractService.addNewClauseToState(cloned as BasicWage | Bonus, field, true);
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
	}
	getBasicWageText(wage: BasicWage, index: number): string {
		return this.bonusStringBuilder.getBasicWageText(
			wage,
			'fee',
			this.isTypeTransferContract,
			this.extended,
			this.postTaxes,
			this.club,
			this.outward,
			index,
			null,
			true
		);
	}

	getBonusText(bonus: Bonus, index: number): string {
		return this.bonusStringBuilder.getBonusText(
			bonus,
			this.isTypeTransferContract,
			this.club.name,
			this.extended,
			this.postTaxes,
			this.club,
			this.getAgentCompleteName(this._contract.agentId),
			index
		);
	}

	isContractComplete() {
		this.contractChange.emit(
			this.contractService.isValidAgentContract(this.contract) &&
				!this.missingAgentWhileOptionsDefined() &&
				this.areValidBonuses([
					...this.appearanceBonuses,
					...this.performanceBonuses,
					...this.standardTeamBonuses,
					...this.signingBonuses,
					...this.customBonuses,
					...this.feeBonuses
				])
		);
	}

	missingAgentWhileOptionsDefined(): boolean {
		return (
			!this.contract.agentId &&
			(!isEmpty(this.appearanceBonuses) ||
				!isEmpty(this.performanceBonuses) ||
				!isEmpty(this.standardTeamBonuses) ||
				!isEmpty(this.signingBonuses) ||
				!isEmpty(this.customBonuses) ||
				!isEmpty(this.feeBonuses))
		);
	}

	private areValidBonuses(bonuses: (Bonus | BasicWage)[]): boolean {
		return bonuses.every(bonus => this.bonusService.isValid(this.contract.validated, bonus));
	}

	isValid(bonus: Bonus | BasicWage): boolean {
		return this.bonusService.isValid(this.contract.validated, bonus);
	}
	getAgent(agentId: string): Agent {
		return this.agents.find(({ id }) => id === agentId);
	}
	private getAgentCompleteName(agentId: string): string {
		return agentId ? `${this.getAgent(agentId)?.firstName} ${this.getAgent(agentId)?.lastName}` : null;
	}

	onAgentChange(event: any) {
		this.changeAgentIdInBonuses(event.value);
	}

	private changeAgentIdInBonuses(agentId: string) {
		[
			...this.appearanceBonuses,
			...this.performanceBonuses,
			...this.standardTeamBonuses,
			...this.signingBonuses,
			...this.customBonuses,
			...this.feeBonuses
		].forEach(bonus => {
			bonus.personId = agentId;
		});
	}
}

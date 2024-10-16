import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import {
	Agent,
	ContractPersonType,
	ContractTypeString,
	EditContractEvent,
	EmploymentContract,
	TransferContract,
	TransferTypeString
} from '@iterpro/shared/data-access/sdk';
import { MenuItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'iterpro-contract-list-item',
	templateUrl: './contract-list-item.component.html',
	styleUrls: ['./contract-list-item.component.css']
})
export class ContractListItemComponent implements OnInit {
	@Input() personType: ContractPersonType;
	@Input() contract: TransferContract | EmploymentContract;
	@Input() current: boolean;
	@Input() isNew: boolean;
	@Input() agents: Agent[];
	@Input() hovered: string = null;
	@Input() valid = true;
	@Input() contractType: ContractTypeString;
	@Input() transferType: TransferTypeString;
	@Input() showRenewButton: boolean;
	@Output() selectContract: EventEmitter<TransferContract | EmploymentContract> = new EventEmitter<
		TransferContract | EmploymentContract
	>();
	@Output() newContract: EventEmitter<EditContractEvent> = new EventEmitter<EditContractEvent>();
	@Output() renewContract: EventEmitter<EditContractEvent> = new EventEmitter<EditContractEvent>();
	@Output() hoverContract: EventEmitter<string> = new EventEmitter<string>();
	@Output() deleteContract: EventEmitter<EditContractEvent> = new EventEmitter<EditContractEvent>();
	agent: Agent;
	contractAgentsLabel: string;

	dropdownItems: MenuItem[];
	readonly #translate = inject(TranslateService);
	constructor() {
		this.dropdownItems = [
			{
				label: this.#translate.instant('buttons.copy'),
				icon: 'fas fa-copy',
				command: () => {
					this.newContract.emit({
						contractType: this.contractType,
						transferType: this.transferType,
						contractData: this.contract,
						showConfirmationDialog: false,
						copyData: true
					});
				}
			},
			{
				label: this.#translate.instant('buttons.delete'),
				icon: 'fas fa-trash',
				command: () => {
					this.deleteContract.emit({
						contractType: this.contractType,
						transferType: this.transferType,
						contractData: this.contract,
						showConfirmationDialog: false
					});
				}
			}
		];
	}

	ngOnInit() {
		if (this.agents && this.contract) {
			this.contractAgentsLabel = (this.agents || [])
				.filter(({ id }) => (this.contract?.agentContracts || []).map(({ agentId }) => agentId).includes(id))
				.map(({ firstName, lastName }) => `${firstName} ${lastName}`)
				.join(', ');
		}
		if (this.showRenewButton) {
			this.dropdownItems.unshift({
				label: this.#translate.instant('admin.contracts.renew'),
				icon: 'fas fa-paste',
				command: () => {
					this.renewContract.emit({
						contractType: this.contractType,
						transferType: this.transferType,
						contractData: this.contract,
						copyData: true,
						showConfirmationDialog: true
					});
				}
			});
		}
	}

	itemClicked() {
		this.isNew
			? this.newContract.emit({
					contractType: this.contractType,
					transferType: this.transferType,
					showConfirmationDialog: false
			  })
			: this.selectContract.emit(this.contract);
	}

	isHovered(id: string): boolean {
		return id === this.hovered;
	}

	onHoverContract(enter: boolean) {
		if (this.contract && this.contract.renewContractId) {
			return this.hoverContract.emit(enter ? this.contract.renewContractId : null);
		} else {
			return this.hoverContract.emit(null);
		}
	}
}

import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Agent,
	AgentApi,
	AgentContract,
	Club,
	ClubApi,
	ContractFormValue,
	ContractPersonModel,
	ContractPersonType,
	ContractReportDeps,
	ContractTypeString,
	Customer,
	EditContractEvent,
	EmploymentContract,
	LoopBackAuth,
	NotificationApi,
	Player,
	Team,
	TeamSeason,
	TransferContract,
	TransferTypeString
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	ClubNameService,
	CompetitionsConstantsService,
	ErrorService,
	ReportService,
	getMomentFormatFromStorage,
	getPDFv2Path,
	sortByDateDesc, getTeamSettings, userHasPermission
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import * as moment from 'moment';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { first, map, switchMap } from 'rxjs/operators';
import { SquadsService } from '../../service/squads.service';
import { EmploymentContractComponent } from './components/employment-contract/employment-contract.component';
import { TransferContractComponent } from './components/transfer-contract/transfer-contract.component';
import getReport, { PlayerContractPDF } from './report';
import { ContractService } from './services/contract.service';
import { BonusStringBuilderService } from './services/bonus-string-builder.service';
import { SideTabComponent } from 'libs/shared/ui/components/src/lib/side-tabs/side-tab.component';
import { of } from 'rxjs';

@UntilDestroy()
@Component({
	selector: 'iterpro-squads-person-legal',
	templateUrl: './squads-person-legal.component.html',
	styleUrls: ['./squads-person-legal.component.css'],
	providers: [DecimalPipe, SquadsService]
})
export class SquadsPersonLegalComponent implements OnChanges, OnInit {
	@Input({required: true}) personType: ContractPersonType;
	@Input({required: true}) person: ContractPersonModel;
	@Input({required: true}) editMode = false;
	@Input({required: true}) isNew = false;
	@Input({required: true}) seasons: TeamSeason[];
	@Input({required: true}) isTransferSection = false;
	@Input({required: true}) agents: Agent[];
	@Input({required: true}) team: Team;
	@Input({required: true}) club: Club;
	@Input({required: true}) players: Player[];
	@Input({required: true}) deletedTransferContract = false;
	@Input({required: true}) isActiveTab = false;
	@Input({required: true}) contractIdParam: string;
	@Output() contractsChangedEmitter: EventEmitter<void> = new EventEmitter<void>();
	@ViewChild(TransferContractComponent, { static: false }) childTransfer: TransferContractComponent;
	@ViewChild(EmploymentContractComponent, { static: false }) childEmployment: EmploymentContractComponent;
	contractForm: FormGroup;
	currency: string;
	financialMode = false;
	translation: any;
	isOpen = false;
	active: number = null;
	hoveredContractId: string;
	newContractDialog: EditContractEvent & { visible: boolean } = {
		visible: false
	};
	renewContractDialog: EditContractEvent & { visible: boolean } = {
		visible: false
	};
	customers: Customer[];
	assistedPlayers: Player[] = [];
	visibleNotify = false;
	extended = false;
	postTaxes = false;
	localPlayers: Player[];
	employments: EmploymentContract[] = [];
	inwards: TransferContract[] = [];
	outwards: TransferContract[] = [];
	tempContract: EmploymentContract | TransferContract;
	selectedContract: EmploymentContract | TransferContract;
	selectedContractType: ContractTypeString;
	selectedTransferType: TransferTypeString;
	dropdownContractList: SelectItem[];
	constructor(
		private clubApi: ClubApi,
		private agentApi: AgentApi,
		private auth: LoopBackAuth,
		private error: ErrorService,
		private numberPipe: DecimalPipe,
		private translate: TranslateService,
		private reportService: ReportService,
		private notificationApi: NotificationApi,
		private contractService: ContractService,
		public clubNameService: ClubNameService,
		private notificationService: AlertService,
		private currentTeamService: CurrentTeamService,
		private confirmationService: ConfirmationService,
		public bonusStringBuilder: BonusStringBuilderService, // need to be public for Report PDF,
		private competitionService: CompetitionsConstantsService
	) {
		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(untilDestroyed(this))
			.subscribe(res => {
				this.translation = res;
			});
		this.currency = this.currentTeamService.getCurrency();
	}

	ngOnInit() {
		this.clubApi
			.getCustomers(this.club.id, { fields: ['id', 'firstName', 'lastName', 'teamSettings'] })
			.pipe(
				map((customers: Customer[]) => (this.customers = customers)),
				untilDestroyed(this)
			)
			.subscribe({
				error: (error: Error) => this.error.handleError(error)
			});
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['editMode'] && changes['editMode'].previousValue === true && this.editMode === false) {
			this.financialMode = false;
		}
		if (changes['person'] && this.person && this.personType && this.personType !== 'Agent') {
			this.onSelectContract(null, null);
			this.getPersonContracts(this.person);
		}
		if (changes['personType'] && this.personType === 'Agent' && this.players) {
			this.localPlayers = cloneDeep(this.players);
			this.getAgentAssisted(this.person as Agent);
		}
	}

	private getPersonContracts(person: ContractPersonModel) {
		this.contractService
			.getPersonContracts(person, this.personType)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: ([employments, transfers]: [EmploymentContract[], TransferContract[]]) =>
					this.onContractsReceived(employments, transfers),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private onContractsReceived(employments: EmploymentContract[], transfers: TransferContract[] = []) {
		this.employments = sortByDateDesc(employments, 'dateFrom');
		this.inwards = sortByDateDesc(transfers, 'on').filter(({ typeTransfer }) => typeTransfer === 'inward');
		this.outwards = sortByDateDesc(transfers, 'on').filter(({ typeTransfer }) => typeTransfer === 'outward');
		if (this.contractIdParam) {
			this.handleContractIdParam();
		}
		const clubIds: number[] = [...this.inwards, ...this.outwards]
			.filter(({ club }) => club)
			.map(({ club }) => Number(club));
		this.clubNameService.initClubNames(clubIds);
	}

	private handleContractIdParam() {
		if ((this.employments || []).find(({ id }) => id === this.contractIdParam)) {
			this.selectedContractType = 'employment';
			this.selectedContract = this.employments.find(({ id }) => id === this.contractIdParam);
		} else if ((this.inwards || []).find(({ id }) => id === this.contractIdParam)) {
			this.selectedContractType = 'transfer';
			this.selectedTransferType = 'inward';
			this.selectedContract = this.inwards.find(({ id }) => id === this.contractIdParam);
		} else if ((this.outwards || []).find(({ id }) => id === this.contractIdParam)) {
			this.selectedContractType = 'transfer';
			this.selectedTransferType = 'outward';
			this.selectedContract = this.outwards.find(({ id }) => id === this.contractIdParam);
		}
	}

	onBack() {
		switch (this.personType) {
			case 'Agent':
				this.selectedContract = null;
				this.selectedContractType = null;
				break;
			default:
				this.onSelectContract(null, null);
		}
	}

	onSelectContract(event: EmploymentContract | TransferContract, contractType: ContractTypeString) {
		this.selectedContract = event;
		this.selectedContractType = contractType;
		this.selectedTransferType = (this.selectedContract as TransferContract)
			? ((event as TransferContract).typeTransfer as TransferTypeString)
			: null;
		if (this.selectedContract) {
			this.dropdownContractList = this.getContractListForDropdown();
		}
		if (!this.selectedContract) this.getPersonContracts(this.person);
	}

	private getContractListForDropdown(): SelectItem[] {
		const filteredContracts =
			this.selectedContractType === 'employment'
				? this.employments
				: this.selectedTransferType === 'inward'
				? this.inwards
				: this.outwards;
		return (filteredContracts || []).map((contract: TransferContract | EmploymentContract) => {
			const dateFrom = this.selectedContractType
				? (contract as EmploymentContract).dateFrom
				: (contract as TransferContract).on;
			return {
				label: `${moment(dateFrom).format(getMomentFormatFromStorage())} - ${this.translate.instant(
					'admin.contracts.type.' + contract.personStatus
				)}`,
				value: contract
			};
		});
	}

	confirmNewContract(event: EditContractEvent) {
		if (event.showConfirmationDialog) {
			this.newContractDialog = { ...event, visible: true };
		} else {
			this.onNewContract(event);
		}
	}

	onNewContract(event: EditContractEvent, copyDataForRenewal = false) {
		this.selectedContractType = event.contractType as ContractTypeString;
		this.selectedTransferType = event.transferType as TransferTypeString;
		if (event.copyData || copyDataForRenewal) {
			this.contractService
				.cloneOrRenewContract(event.contractData, event.contractType, false, copyDataForRenewal)
				.pipe(first(), untilDestroyed(this))
				.subscribe((contract: EmploymentContract | TransferContract) => {
					this.selectedContract = contract;
					this.discardRenewContract();
					this.onEdit();
				});
		} else {
			this.selectedContract =
				event.contractType === 'employment'
					? this.contractService.createEmploymentContract(this.auth.getCurrentUserId())
					: this.contractService.createTransferContract(this.selectedTransferType, this.auth.getCurrentUserId());
		}
		this.discardNewContractDialog();
		this.onEdit();
	}

	confirmRenewContract(event: EditContractEvent) {
		if (event.showConfirmationDialog) {
			this.renewContractDialog = { ...event, visible: true };
		} else {
			this.onRenewContract(event);
		}
	}

	onRenewContract(event: EditContractEvent, copyDataForRenewal = false) {
		this.selectedContractType = event.contractType as ContractTypeString;
		this.selectedTransferType = event.transferType as TransferTypeString;
		if (event.copyData || copyDataForRenewal) {
			this.contractService
				.cloneOrRenewContract(event.contractData, event.contractType, true, copyDataForRenewal)
				.pipe(first(), untilDestroyed(this))
				.subscribe((contract: EmploymentContract | TransferContract) => {
					this.selectedContract = contract;
					this.discardRenewContract();
					this.onEdit();
				});
		} else {
			this.selectedContract =
				event.contractType === 'employment'
					? this.contractService.createEmploymentContract(this.auth.getCurrentUserId(), this.selectedContract.id)
					: this.contractService.createTransferContract(
							event.transferType,
							this.auth.getCurrentUserId(),
							this.selectedContract.id
					  );
			this.discardRenewContract();
			this.onEdit();
		}
	}

	discardRenewContract() {
		this.renewContractDialog = {
			visible: false
		};
	}

	onEdit() {
		this.tempContract = cloneDeep(this.selectedContract);
		this.editMode = true;
	}

	onDiscard() {
		this.selectedContract = this.selectedContract.id ? cloneDeep(this.tempContract) : null;
		this.editMode = false;
	}

	onSubmit(formValue: ContractFormValue) {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.edit'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => this.save(formValue),
			reject: () => {
				if (this.childTransfer) {
					this.childTransfer.contractDataLoading = false;
					this.childTransfer.bonusDataLoading = false;
				}
				if (this.childEmployment) {
					this.childEmployment.contractDataLoading = false;
					this.childEmployment.bonusDataLoading = false;
				}
			}
		});
	}

	private save(formValue: ContractFormValue) {
		const otherSameContracts =
			this.selectedContractType === 'employment'
				? this.employments
				: this.selectedTransferType === 'inward'
				? this.inwards
				: this.outwards;
		const contract = this.contractService.prepareContractForSave(
			formValue.contract,
			this.tempContract,
			otherSameContracts,
			this.auth.getCurrentUserId()
		) as EmploymentContract | TransferContract;
		const agentContracts = (formValue?.agentContracts || []).map(
			agent =>
				this.contractService.prepareContractForSave(agent, null, [], this.auth.getCurrentUserId()) as AgentContract
		);
		const result = this.contractService.saveContract(
			this.person,
			contract,
			agentContracts,
			this.personType,
			this.selectedContractType
		);
		result.pipe(untilDestroyed(this)).subscribe({
			next: (persisted: EmploymentContract | TransferContract) => {
				this.editMode = false;
				this.onSelectContract(persisted, this.selectedContractType);
				this.showConfirmationMessage(!this.tempContract?.id);
				this.contractsChangedEmitter.emit();
			},
			error: (error: Error) => {
				this.error.handleError(error);
			}
		});
	}

	private showConfirmationMessage(isNew: boolean) {
		const message = isNew ? 'alert.recordCreated' : 'alert.recordUpdated';
		this.notificationService.notify('success', 'profile.contract', message, false);
	}

	getReportData(): PlayerContractPDF {
		const deps: ContractReportDeps = {
			numberPipe: this.numberPipe,
			translate: this.translate,
			competitionService: this.competitionService,
			postTaxes: this.postTaxes,
			club: this.club,
			team: this.team,
			translation: this.translation,
			currentTeamService: this.currentTeamService
		};
		return getReport(this, deps);
	}

	getReport() {
		const data: PlayerContractPDF = this.getReportData();
		this.reportService.getReport(
			getPDFv2Path('admin', 'admin_player_contracts', false),
			data,
			'',
			null,
			'Player Contracts'
		);
	}

	onDeleteContract(event: EditContractEvent) {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.delete'),
			header: 'IterPRO',
			accept: () => this.delete(event.contractData, event.contractType)
		});
	}

	private delete(contract: EmploymentContract | TransferContract, contractType: ContractTypeString) {
		this.contractService
			.deleteContract(contract, contractType)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: () => {
					this.onSelectContract(null, null);
					this.notificationService.notify('success', 'profile.contract', 'alert.recordDeleted', false);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	existsInvalidEmploymentContracts(contracts: EmploymentContract[]): boolean {
		return contracts ? (contracts.length > 0 ? contracts.some(({ valid }) => !valid) : false) : false;
	}

	existsInvalidTransferContracts(contracts: TransferContract[]): boolean {
		return contracts ? (contracts.length > 0 ? contracts.some(({ valid }) => !valid) : false) : false;
	}

	isValidated(contract: EmploymentContract | TransferContract): boolean {
		return contract && contract.validated;
	}

	onTabChange(event: { index: number }) {
		this.active = event.index;
	}

	onHoverContract(id: string) {
		this.hoveredContractId = id;
	}

	setOpen(isOpen: boolean) {
		this.isOpen = isOpen;
	}

	canViewNotify(): boolean {
		const user = this.auth.getCurrentUserData();
		const teamSettings = getTeamSettings(user.teamSettings, user.currentTeamId);
		return userHasPermission(teamSettings, 'notifyContract');
	}

	openNotify() {
		this.visibleNotify = true;
	}

	onNotifyCustomers(customerIds: string[]) {
		this.notificationApi
			.checkNotificationForPlayerContract(this.person.id, customerIds)
			.pipe(untilDestroyed(this))
			.subscribe({
				error: (error: Error) => this.error.handleError(error),
				complete: () => (this.visibleNotify = false)
			});
	}

	onDiscardNotifyEmitter() {
		this.visibleNotify = false;
	}

	// AGENT
	private getAgentAssisted(agent: Agent) {
		this.agentApi
			.getAssisted(agent.id, { fields: ['id', 'displayName'] })
			.pipe(
				switchMap((players: Player[]) => {
					this.assistedPlayers = players;
					return this.assistedPlayers.length > 0 ?
						this.contractService.getPersonContracts(this.assistedPlayers[0], this.personType)
						: of([[], []] as [EmploymentContract[], TransferContract[]])
				})
			)
			.subscribe({
				next: ([employments, transfers]: [EmploymentContract[], TransferContract[]]) =>
					this.onContractsReceived(employments, transfers),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	onSelectAssisted(tab: SideTabComponent) {
		if (tab?.tabTitle) {
			this.getPersonContracts(this.assistedPlayers.find(({ displayName }) => displayName === tab.tabTitle));
		}
	}

	discardNewContractDialog() {
		this.newContractDialog = {
			visible: false
		};
	}
}

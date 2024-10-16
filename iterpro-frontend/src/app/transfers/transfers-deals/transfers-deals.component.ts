import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import {
	AlreadyImportedPlayer,
	ClubSeason,
	ClubTransfer,
	ClubTransferApi,
	EmploymentContract,
	LoopBackAuth,
	Player,
	PlayerScouting,
	TransferContract,
	TransferWindowItem,
	WyscoutApi,
} from '@iterpro/shared/data-access/sdk';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import {
	ErrorService,
	getActiveEmploymentContract,
	getActiveTransferContract,
	getTotalElementsAmountForSeasonNew,
	getTransferFee
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { isEmpty } from 'lodash';
import moment from 'moment';
import {
	PurchaseBreakdown,
	SaleBreakdown,
	TransferType,
	TransfersBreakdown
} from './../shared/interfaces/transfers.interface';
import { TransfersDealsFilters } from './models/transfers-deals.types';

@UntilDestroy()
@Component({
	selector: 'iterpro-transfers-deals',
	templateUrl: './transfers-deals.component.html',
	styleUrls: ['./transfers-deals.component.css'],
	providers: [DecimalPipe, ShortNumberPipe, DatePipe]
})
export class TransfersDealsComponent {
	/** Services */
	readonly #authStore = inject(Store<AuthState>);
	readonly #errorService = inject(ErrorService);
	readonly #wyscoutApi = inject(WyscoutApi);
	readonly #clubTransferApi = inject(ClubTransferApi);
	readonly #auth = inject(LoopBackAuth);

	/** Inputs & Outputs */
	@Input({ required: true }) readonly teams: { name: string; players: Player[] }[];
	@Input({ required: true }) readonly clubTransfers: ClubTransfer[];
	@Input({ required: true }) set transfersBreakdown(value: TransfersBreakdown) {
		if (value) {
			this.breakdown = value;
			this.salesBreakdown = value.salesBreakdown;
			this.purchasesBreakdown = value.purchasesBreakdown;
		}
	}
	@Input({ required: true }) readonly clubSeasons: ClubSeason[];
	@Input({ required: true }) readonly transferWindow: TransferWindowItem;
	@Input({ required: true }) readonly players: Player[];
	@Input({ required: true }) selectedKanban: TransferType = 'sales';
	@Input() alreadyImportedPlayers: AlreadyImportedPlayer[];

	/** Data */
	readonly currencyCode$ = this.#authStore.select(AuthSelectors.selectClubCurrencyCode);
	readonly currentTeam$ = this.#authStore.select(AuthSelectors.selectTeam);

	breakdown: TransfersBreakdown | null = null;
	salesBreakdown: SaleBreakdown | null = null;
	purchasesBreakdown: PurchaseBreakdown | null = null;

	/** Inputs & Outputs */
	@Input() sales: ClubTransfer[];
	@Input() purchases: ClubTransfer[];
	@Input() readonly scoutings: PlayerScouting[] = [];

	@Output() windowChanged: EventEmitter<TransferWindowItem> = new EventEmitter<TransferWindowItem>();
	@Output() selectedEmitter: EventEmitter<string> = new EventEmitter<string>();
	@Output() addDealEmitter: EventEmitter<void> = new EventEmitter();
	@Output() dropEmitter: EventEmitter<{ transfer: ClubTransfer; type: TransferType }> = new EventEmitter<{
		transfer: ClubTransfer;
		type: TransferType;
	}>();
	@Output() selectedKanbanEmitter: EventEmitter<TransferType> = new EventEmitter<TransferType>();

	/** Emit Transfer Window Changed */
	chooseTransferWindowByClubSeason(transferWindow: TransferWindowItem) {
		this.windowChanged.emit(transferWindow);
	}

	addDeal(clubTransfers: ClubTransfer[]) {
		this.#clubTransferApi
			.createMany(clubTransfers)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: () => this.addDealEmitter.emit(),
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	onClickKanbanElement(transfer: ClubTransfer) {
		this.selectedEmitter.emit(transfer.id);
	}

	onDropKanbanElement(transfer: ClubTransfer): void {
		this.dropEmitter.emit({ transfer, type: this.selectedKanban });
	}

	selectKanban(kanbanType: TransferType): void {
		this.selectedKanban = kanbanType;
	}



	/**
	 * Filter transfers based on the provided filters.
	 *
	 * @param {TransfersDealsFilters} filters - the filters to apply
	 * @return {void}
	 */
	filterTransfers(filters: TransfersDealsFilters): void {
		const filteredTransfers: ClubTransfer[] = [...this.clubTransfers].filter(deal => {
			/** Get the player */
			const player = deal.player;

			/** Get age condition */
			const ageCondition =
				player.birthDate == null ||
				(moment().diff(moment(player.birthDate), 'years') >= filters.ageRange[0] &&
					moment().diff(moment(player.birthDate), 'years') <= filters.ageRange[1]);

			/** Get contract type condition */
			const activeEmploymentContract: EmploymentContract = getActiveEmploymentContract(player);
			const contractTypeCondition =
				isEmpty(filters.contractTypes) || filters.contractTypes.includes(activeEmploymentContract?.personStatus);

			/** Get position condition */
			const positionFilter = isEmpty(filters.positions) || !!filters.positions.find((position: string) => player.position === position);

			/** Check cost range condition */
			const activeTransferContract: TransferContract = getActiveTransferContract(deal.player, 'inward');
			const transferFee = activeTransferContract ? getTransferFee(activeTransferContract) : null;
			const totalCost = activeEmploymentContract
				? getTotalElementsAmountForSeasonNew(activeEmploymentContract, activeEmploymentContract.basicWages, false, null)
				: null;

			let feeCondition: boolean;
			if (feeCondition || (transferFee === 0 && totalCost) || (totalCost === 0 && filters.costRange.length > 0)) {
				feeCondition = transferFee + totalCost >= filters.costRange[0] && transferFee + totalCost <= filters.costRange[1];
			} else {
				feeCondition = !!deal;
			}

			return contractTypeCondition && positionFilter && ageCondition && feeCondition;
		});

		/** Update the club transfers (sales & purchases) */
		this.purchases = [...filteredTransfers.filter(({ isPurchase }) => isPurchase)];
		this.sales = [...filteredTransfers.filter(({ isPurchase }) => !isPurchase)];
	}
}

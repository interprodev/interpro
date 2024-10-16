import { Component, EventEmitter, Injector, Input, Output, inject } from '@angular/core';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import {
	AvailableProviderIdField,
	ClubSeason,
	ClubSeasonApi,
	ClubTransfer,
	PlayerTransfer,
	TransferWindowItem
} from '@iterpro/shared/data-access/sdk';
import { MillionsPipe, ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import { AlertService, ConstantService, ErrorService, ThirdPartiesIntegrationCheckService } from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { orderBy, pick } from 'lodash';
import { SelectItem } from 'primeng/api';
import { Observable, map, switchMap, take } from 'rxjs';
import {
	PurchaseBreakdown,
	PurchaseStatusType,
	SaleBreakdown,
	SaleStatusType,
	TransfersBreakdown,
	purchaseStatus,
	saleStatus
} from '../shared/interfaces/transfers.interface';
import { TransfersService } from '../shared/services/transfers.service';

@UntilDestroy()
@Component({
	selector: 'iterpro-trading-balance',
	templateUrl: './trading-balance.component.html',
	styleUrls: ['./trading-balance.component.css'],
	providers: [ShortNumberPipe, MillionsPipe]
})
export class TradingBalanceComponent extends EtlBaseInjectable {
	/** Services */
	readonly #translateService = inject(TranslateService);
	readonly #authStore = inject(Store<AuthState>);
	readonly #constantService = inject(ConstantService);
	readonly #transfersService = inject(TransfersService);

	/** Input & Outputs */
	@Input({ required: true }) clubSeasons: ClubSeason[];
	@Input({ required: true }) transferWindow: TransferWindowItem;
	@Input({ required: true }) set clubTransfers(value: ClubTransfer[]) {
		if (value) {
			/** Set filtered transfers locally */
			this.filteredTransfers = value;

			/** Set Sales & Purchases */
			this.sales = [...value.filter(({ isPurchase }) => !isPurchase)];
			this.purchases = [...value.filter(({ isPurchase }) => isPurchase)];

			/** Init Selected Players */
			this.initSalesPlayers();
			this.initPurchasePlayers();
		}
	}

	@Input({ required: true }) set transfersBreakdown(value: TransfersBreakdown) {
		if (value) {
			this.breakdown = value;
			this.salesBreakdown = value.salesBreakdown;
			this.purchasesBreakdown = value.purchasesBreakdown;
		}
	}
	@Output() windowUpdate: EventEmitter<any> = new EventEmitter<any>();

	/** Data */
	readonly currency$: Observable<string> = this.#authStore
		.select(AuthSelectors.selectClubCurrencyCode)
		.pipe(switchMap(code => this.#constantService.getCurrencySymbol(code)));
	readonly salesStatuses: SelectItem<SaleStatusType>[] = this.mapSaleStatusesToLabels(saleStatus);
	readonly purchaseStatuses: SelectItem<PurchaseStatusType>[] = this.mapPurchaseStatusesToLabels(purchaseStatus);

	providerId: AvailableProviderIdField | null = null;
	filteredTransfers: ClubTransfer[] = [];
	sales: ClubTransfer[] = [];
	purchases: ClubTransfer[] = [];
	breakdown: TransfersBreakdown | null = null;
	salesBreakdown: SaleBreakdown | null = null;
	purchasesBreakdown: PurchaseBreakdown | null = null;

	/** Init Selected Status Filters */
	selectedSaleStatuses: SaleStatusType[] = (Object.keys(saleStatus) as SaleStatusType[]).filter(x => x !== 'rejected');
	selectedPurchaseStatuses: PurchaseStatusType[] = (Object.keys(purchaseStatus) as PurchaseStatusType[]).filter(x => x !== 'rejected');

	/** Players Lists Filters */
	salesPlayers: PlayerTransfer[] | null = null;
	selectedSalesPlayers: PlayerTransfer[] = [];
	purchasesPlayers: PlayerTransfer[] = [];
	selectedPurchasesPlayers: PlayerTransfer[] = [];

	constructor(
		private alert: AlertService,
		private error: ErrorService,
		private clubSeasonApi: ClubSeasonApi,
		private thirdPartyService: ThirdPartiesIntegrationCheckService,
		injector: Injector
	) {
		super(injector);

		/** Init Provider Id */
		this.getProviderId()
			.pipe(take(1))
			.subscribe(providerId => (this.providerId = providerId));
	}

	onPlayerSaleSelect(event: { value: PlayerTransfer[] }) {
		this.selectedSalesPlayers = event.value;
		this.getBalanceData();
	}

	onPlayerPurchaseSelect(event: { value: PlayerTransfer[] }) {
		this.selectedPurchasesPlayers = event.value;
		this.getBalanceData();
	}

	chooseTransferWindowByClubSeason(event: TransferWindowItem): void {
		/** Reset Transfers & Players */
		this.salesPlayers = [];
		this.purchasesPlayers = [];
		this.filteredTransfers = [];

		/** Emit Window */
		this.windowUpdate.emit(event);
	}

	private getBalanceData() {
		/** Get Transfer Players Ids */
		const playerIdsSale = this.selectedSalesPlayers?.map(x => x.clubTransferId);
		const playerIdsPurchase = this.selectedPurchasesPlayers?.map(x => x.clubTransferId);

		/** Make API Call */
		this.#transfersService.getTransferBalance(this.clubSeasons[0].clubId, null, [...playerIdsSale, ...playerIdsPurchase]).subscribe({
			next: (result: TransfersBreakdown) => {
				this.transfersBreakdown = result;
				this.salesBreakdown = result.salesBreakdown;
				this.purchasesBreakdown = result.purchasesBreakdown;
			},
			error: (error: Error) => this.error.handleError(error)
		});
	}

	private initSalesPlayers(): void {
		/** Get Filtered Players */
		const filteredPlayers: PlayerTransfer[] = orderBy(
			this.sales
				.filter(({ currentStatus }) => currentStatus !== 'rejected')
				.filter(({ player, personId }) => !!player && !!personId)
				.map(x => x.player),
			'displayName'
		);

		/** Init Sales and Selected */
		this.salesPlayers = filteredPlayers;
		this.selectedSalesPlayers = [...filteredPlayers];
	}

	private initPurchasePlayers(): void {
		/** Get Scouting Players */
		const playersScouting = this.purchases
			.filter(x => x.currentStatus !== 'rejected')
			.filter(x => x.player && (!this.providerId || !x.player[this.providerId])) // player.wyscoutId
			.map(x => x.player);

		/** Get wyscout players referenced in the clubTransfers purchase */
		const wyscoutPlayers = this.purchases
			.filter(x => x.currentStatus !== 'rejected')
			.filter(x => x.player && this.providerId && x.player[this.providerId]) // player.wyscoutId
			.map(x => x.player);

		const filteredPlayers = [...playersScouting, ...wyscoutPlayers];

		/** Populate Selected Purchases Players Filters and Options */
		this.purchasesPlayers = orderBy(filteredPlayers, 'displayName');
		this.selectedPurchasesPlayers = [...filteredPlayers];
	}

	onTransferWindowBudgetUpdate(budget: number): void {
		this.clubSeasonApi
			.updateByIdTransferWindows(this.transferWindow.clubSeasonId, this.transferWindow.transferWindowId, {
				budget
			})
			.subscribe({
				next: (res: TransferWindowItem) => {
					this.alert.notify('success', 'Profile', 'alert.recordUpdated', false);
					this.transferWindow = { ...this.transferWindow, ...res };
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	onSaleStatusSelect(event: { value: SaleStatusType[] }) {
		this.selectedSaleStatuses = event.value;
		this.salesBreakdown = this.recalculateSalesBreakdown(this.selectedSaleStatuses);

		/** Retrigger the calculation of clubTransfers filtering by status */
		this.filteredTransfers = [
			...[...this.sales.filter(({ currentStatus }) => this.selectedPurchaseStatuses.includes(currentStatus as PurchaseStatusType))],
			...this.purchases
		];
	}

	onPurchaseStatusSelect(event: { value: PurchaseStatusType[] }) {
		this.selectedPurchaseStatuses = event.value;
		this.purchasesBreakdown = this.recalculatePurchasesBreakdown(this.selectedPurchaseStatuses);

		/** Retrigger the calculation of clubTransfers filtering by status */
		this.filteredTransfers = [
			...this.sales,
			...[...this.purchases.filter(({ currentStatus }) => this.selectedPurchaseStatuses.includes(currentStatus as PurchaseStatusType))]
		];
	}

	/**
	 * Recalculates the purchases breakdown based on the provided statuses.
	 *
	 * @param {PurchaseStatusType[]} statuses - The array of purchase statuses to recalculate breakdown for.
	 * @return {PurchaseBreakdown} The recalculated purchases breakdown.
	 */
	private recalculatePurchasesBreakdown(statuses: PurchaseStatusType[]): PurchaseBreakdown {
		return {
			...(this.breakdown.purchasesBreakdown ? pick(this.breakdown.purchasesBreakdown, statuses) : this.breakdown.purchasesBreakdown)
		};
	}

	/**
	 * Recalculates the sales breakdown based on the provided statuses.
	 *
	 * @param {SaleStatusType[]} statuses - Array of sale statuses to recalculate the breakdown for.
	 * @return {SaleBreakdown} The recalculated sales breakdown.
	 */
	private recalculateSalesBreakdown(statuses: SaleStatusType[]): SaleBreakdown {
		return {
			...(this.breakdown.salesBreakdown ? pick(this.breakdown.salesBreakdown, statuses) : this.breakdown.salesBreakdown)
		};
	}

	private mapSaleStatusesToLabels(statuses: Record<SaleStatusType, string>): SelectItem<SaleStatusType>[] {
		return (Object.keys(statuses) as SaleStatusType[])
			.filter(status => status !== 'rejected')
			.map(x => ({
				label: this.#translateService.instant(`admin.transfers.deals.${x}`),
				value: x
			}));
	}

	private mapPurchaseStatusesToLabels(statuses: Record<PurchaseStatusType, string>): SelectItem<PurchaseStatusType>[] {
		return (Object.keys(statuses) as PurchaseStatusType[])
			.filter(status => status !== 'rejected')
			.map(x => ({
				label: this.#translateService.instant(`admin.transfers.deals.${x}`),
				value: x
			}));
	}

	private getProviderId(): Observable<AvailableProviderIdField | null> {
		return this.#authStore
			.select(AuthSelectors.selectTeam)
			.pipe(
				map(team =>
					this.thirdPartyService.hasAnyProviderTacticalIntegration(team)
						? (this.etlPlayerService.getProviderIdField() as AvailableProviderIdField)
						: null
				)
			);
	}
}

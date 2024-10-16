import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TransferWindow } from '@iterpro/shared/data-access/sdk';
import { PurchaseBreakdown, SaleBreakdown, TransfersBreakdown } from 'src/app/transfers/shared/interfaces/transfers.interface';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'iterpro-trading-balance-window-budget',
	templateUrl: 'trading-balance-window-budget.component.html'
})
export class TradingBalanceWindowBudgetComponent implements OnChanges {
	/** Input & Outputs */
	@Input({ required: true }) currency: string = 'EUR';
	@Input({ required: true }) transferWindow: TransferWindow | null = null;
	@Input({ required: true }) transfersBreakdown: TransfersBreakdown | null = null;

	@Output() saveBudget = new EventEmitter<number>();

	/** Data */
	isEditing: boolean = false;
	transferWindowBudget: number = 0;
	residualBudget: number = 0;

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['transferWindow'] || changes['transfersBreakdown']) {
			if (this.transferWindow) {
				this.transferWindowBudget = this.transferWindow.budget;
				if (this.transfersBreakdown) {
					this.calculateResidualBudget();
				}
			}
		}
	}

	edit(): void {
		this.isEditing = true;
	}

	discard(): void {
		this.isEditing = false;
	}

	save(): void {
		this.isEditing = false;
		this.saveBudget.emit(this.transferWindowBudget);
	}

	private calculateResidualBudget() {
		const amountPurchases: number = this.getAmount(this.transfersBreakdown.purchasesBreakdown);
		const amountSales: number = this.getAmount(this.transfersBreakdown.salesBreakdown);
		const balance: number = amountSales - amountPurchases;

		/**
		 * Residual budget logic
		 * Budget + Balance ---> Balance: Sales - Purchases
		 */
		this.residualBudget = this.transferWindow.budget + balance;
	}

	private getAmount(breakdown: SaleBreakdown | PurchaseBreakdown): number {
		if (!breakdown) {
			return 0;
		}

		/** Exclude "rejected" deals */
		delete breakdown.rejected;

		/** Get BreakdownItem amount */
		return Object.values(breakdown)
			.map(({ transferFee }) => transferFee)
			.reduce((a, b) => a + b, 0);
	}
}

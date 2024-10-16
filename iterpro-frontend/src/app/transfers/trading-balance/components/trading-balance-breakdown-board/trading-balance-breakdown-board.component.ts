import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PurchaseBreakdown, SaleBreakdown } from 'src/app/transfers/shared/interfaces/transfers.interface';

type BreakdownBoard = {
	deals: number;
	loans: number;
	purchases: number;
	amount: number;
};

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'iterpro-trading-balance-breakdown-board',
	templateUrl: 'trading-balance-breakdown-board.component.html',
	host: { class: 'pflex-block pflex-h-full' }
})
export class TradingBalanceBreakdownBoardComponent {
	/** Input & Outputs */
	@Input({ required: true }) currency: string;
	@Input({ required: true }) isPurchase: boolean;
	@Input({ required: true }) set breakdown(value: SaleBreakdown & PurchaseBreakdown) {
		if (value) {
			this.extractData(value);
		}
	}

	/** Data */
	boardData: BreakdownBoard | null = null;

	private extractData(breakdown: SaleBreakdown & PurchaseBreakdown) {
		/** Exclude "rejected" deals */
		delete breakdown.rejected;

		/** Init BoardData */
		this.boardData = {
			deals: 0,
			loans: 0,
			purchases: 0,
			amount: 0
		};

		/** Get BreakdownItem values */
		this.boardData.deals = Object.values(breakdown)
			.map(({ count }) => count)
			.reduce((a, b) => a + b, 0);
		this.boardData.amount = Object.values(breakdown)
			.map(({ transferFee }) => transferFee)
			.reduce((a, b) => a + b, 0);
		this.boardData.loans = Object.values(breakdown)
			.map(({ loan }) => loan)
			.reduce((a, b) => a + b, 0);
		this.boardData.purchases = Object.values(breakdown)
			.map(({ purchase }) => purchase)
			.reduce((a, b) => a + b, 0);
	}
}

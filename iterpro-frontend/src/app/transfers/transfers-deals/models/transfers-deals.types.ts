import { FormControl } from '@angular/forms';
import { ClubTransfer } from '@iterpro/shared/data-access/sdk';
import { PurchaseStatusType, SaleStatusType, purchaseStatus, saleStatus } from '../../shared/interfaces/transfers.interface';

/** Filters */
export type TransfersDealsFilters = {
	contractTypes: string[] | null;
	positions: string[] | null;
	ageRange: number[];
	costRange: number[];
};

export type TransfersDealsFiltersForm = {
	contractTypes: FormControl<string[] | null>;
	positions: FormControl<string[] | null>;
	ageRange: FormControl<number[]>;
	costRange: FormControl<number[]>;
};

export type Range = {
	min: number;
	max: number;
	step?: number;
};

/** Breakdowns */

/** Kanban */
// -- SALES
const saleStatusColor: Record<SaleStatusType, string> = {
	transferable: 'red',
	contacted: 'orange',
	negotiation: 'yellow',
	sold: 'green',
	rejected: 'blue'
} as const;
export type SaleStatusColor = (typeof saleStatusColor)[keyof typeof saleStatusColor];
export type SaleStatusLabel = (typeof saleStatus)[keyof typeof saleStatus];

export const salesTransferStatuses: {
	color: SaleStatusColor;
	status: SaleStatusLabel;
}[] = Object.keys(saleStatus).map(key => ({
	color: saleStatusColor[key],
	status: saleStatus[key]
}));

// -- PURCHASE
const purchaseStatusColor: Record<PurchaseStatusType, string> = {
	recommended: 'red',
	contacted: 'orange',
	negotiation: 'yellow',
	signed: 'green',
	rejected: 'blue'
} as const;
export type PurchaseStatusColor = (typeof purchaseStatusColor)[keyof typeof purchaseStatusColor];
export type PurchaseStatusLabel = (typeof purchaseStatus)[keyof typeof purchaseStatus];
export const purchasesTransferStatuses: {
	color: PurchaseStatusColor;
	status: PurchaseStatusLabel;
}[] = Object.keys(purchaseStatus).map(key => ({
	color: purchaseStatusColor[key],
	status: purchaseStatus[key]
}));

export type TransferKanbanStatus = {
	color: SaleStatusColor | PurchaseStatusColor;
	transfers: ClubTransfer[];
};

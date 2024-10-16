import { PlayerTransfer } from '@iterpro/shared/data-access/sdk';
import { SelectItem } from 'primeng/api';
export interface TransferDropdownElement {
	player: PlayerTransfer;
	transferId: string;
}
export type TransferAction = 'buy' | 'sell' | 'delete';
export type ClubTransferPersonType = 'Player' | 'PlayerScouting';
export interface LabelModelOptions {
	label: string;
	model: any;
	options: any;
}
export interface BreakdownItem {
	agent: number;
	benefits: number;
	count: number;
	loan: number;
	purchase: number;
	transferFee: number;
	wage: number;
	wageBonus: number;
}
export type TransferType = 'sales' | 'purchases';

export enum salesPhasesOrder {
	'transferable' = 0,
	'contacted' = 1,
	'negotiation' = 2,
	'sold' = 3
}
export enum purchasesPhasesOrder {
	'recommended' = 0,
	'contacted' = 1,
	'negotiation' = 2,
	'signed' = 3
}
export interface Phase {
	model: string[];
	options: SelectItem[];
	breakdown: string[];
}
export interface Balance {
	salesBreakdown: string[];
	purchasesBreakdown: string[];
}

/** Sales & Purchases */
export type SaleStatusType = 'transferable' | 'contacted' | 'negotiation' | 'sold' | 'rejected';
export const saleStatus: Record<SaleStatusType, string> = {
	transferable: 'transferable',
	contacted: 'contacted',
	negotiation: 'negotiation',
	sold: 'sold',
	rejected: 'rejected'
} as const;

export type PurchaseStatusType = 'recommended' | 'contacted' | 'negotiation' | 'signed' | 'rejected';
export const purchaseStatus: Record<PurchaseStatusType, string> = {
	recommended: 'recommended',
	contacted: 'contacted',
	negotiation: 'negotiation',
	signed: 'signed',
	rejected: 'rejected'
} as const;

export type SaleBreakdown = Record<SaleStatusType, BreakdownItem>;
export type PurchaseBreakdown = Record<PurchaseStatusType, BreakdownItem>;
export type TransfersBreakdown = {
	salesBreakdown: SaleBreakdown;
	purchasesBreakdown: PurchaseBreakdown;
};

import { ClubTransfer } from '@iterpro/shared/data-access/sdk';
import { SelectItem } from 'primeng/api';

export type ComparisonTransfers = {
	leftTransfer: ClubTransfer;
	rightTransfer: ClubTransfer;
};

export type OverviewType = SelectItem<string>[];
export type CompareDealType = SelectItem<string>[];

export type TradingCompareItem = {
	transfer: ClubTransfer;
	pic: string;
	position: string;
	position2: string;
	position3: string;
	overview: OverviewType;
	deal: CompareDealType;
	cost: number;
};

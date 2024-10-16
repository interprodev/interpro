import { ClubSeason } from '@iterpro/shared/data-access/sdk';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
export const cashFlowStoreFeatureKey = 'cashFlowStore';

export interface CashFlowTableData {
	date: Date;
	season: string;
	sales: {
		transferFee: number;
		bonus: number;
		agentFee: number;
		bonusAgent: number;
	};
	purchases: {
		transferFee: number;
		bonus: number;
		agentFee: number;
		bonusAgent: number;
	};
	tradingBalance: number;
	operatingCashFlow: number;
}

export interface CashFlowData {
	id: {
		national: boolean;
		international: boolean;
		achieved: boolean;
	};
	tableData: CashFlowTableData[];
}

export interface State extends EntityState<CashFlowData> {
	selectedCombination: {
		national: boolean;
		international: boolean;
		achieved: boolean;
	};
	selectedCashFlowData: CashFlowData;
	clubSeasons: ClubSeason[];
	clubSeasonsToShow: ClubSeason[];
	tempSeasons: ClubSeason[];
	isLoading: boolean;
	readonly error: string;
}

export const adapter: EntityAdapter<CashFlowData> = createEntityAdapter<CashFlowData>();

export const initialState: State = adapter.getInitialState({
	selectedCombination: {
		national: true,
		international: true,
		achieved: false
	},
	selectedCashFlowData: null,
	clubSeasons: [],
	clubSeasonsToShow: [],
	tempSeasons: [],
	isLoading: false,
	error: null
});

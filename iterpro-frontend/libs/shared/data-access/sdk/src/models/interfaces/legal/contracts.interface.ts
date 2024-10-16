export interface ContractChangeHistory {
	date: Date;
	author: string;
	action: string;
	details?: string;
}

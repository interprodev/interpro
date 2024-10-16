export type HealthStatus = 'notAvailable' | 'careful' | 'injury' | 'complaint' | 'illness' | 'fit';

export interface Availability {
	available: 'yes' | 'no' | 'careful';
	expectation?: any;
	further?: any;
}

export enum TacticsViewState {
	Preparation = 0,
	Analysis = 1
}

export enum InjuryAvailability {
	Ok = 0,
	NotAvailable = 1,
	BeCareful = 2
}

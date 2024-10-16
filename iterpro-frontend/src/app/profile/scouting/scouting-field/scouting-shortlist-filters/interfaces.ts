export type ScoutingFilterLabel = 'age' | 'nationality' | 'fee' | 'wage';

export interface ScoutingFilterOption {
	age: string;
	nationality: string;
	fee: string;
	wage: string;
}

export interface ScoutingFilter<T> {
	options: T[];
	value: T[];
}

export interface ScoutingFilterStatus {
	age: ScoutingFilter<Pick<ScoutingFilterOption, 'age'>>;
	nationality: ScoutingFilter<Pick<ScoutingFilterOption, 'nationality'>>;
	fee: ScoutingFilter<Pick<ScoutingFilterOption, 'fee'>>;
	wage: ScoutingFilter<Pick<ScoutingFilterOption, 'wage'>>;
}

export const DEFAULT_SCOUTING_FILTER_STATUS: ScoutingFilterStatus = {
	age: { options: [], value: null },
	nationality: { options: [], value: null },
	fee: { options: [], value: null },
	wage: { options: [], value: null }
};

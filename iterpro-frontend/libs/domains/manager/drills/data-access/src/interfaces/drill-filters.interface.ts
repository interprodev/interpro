export type DrillFiltersConfig =
	| 'theme'
	| 'goal'
	| 'duration'
	| 'numberOfPlayers'
	| 'pitchSize'
	| 'ageGroup'
	| 'technicalGoal'
	| 'tacticalGoal'
	| 'physicalGoal'
	| 'attachments';

export interface DrillFilters {
	theme: string[];
	goal?: string[];
	duration: number[];
	numberOfPlayers: number[];
	pitchSize: string[];
	ageGroup: string[];
	technicalGoal?: string[];
	tacticalGoal?: string[];
	physicalGoal?: string[];
}

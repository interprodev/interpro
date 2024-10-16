import { Threshold } from '@iterpro/shared/data-access/sdk';

export type MetricThreshold = Threshold & { absIntervals: number[]; metric: string; format: ThresholdActiveFormat };

export interface GpsThresholdSet {
	name: string;
	thresholds: Threshold[];
}
export interface ThresholdsToUpdate {
	type: ThresholdType;
	category: ThresholdCategory;
	thresholds: MetricThreshold[];
	thresholdFormat?: ThresholdActiveFormat;
}

export type ThresholdCategory =
	| '_thresholds'
	| '_thresholdsTests'
	| '_thresholdsPlayer'
	| '_thresholdsAttendances'
	| '_thresholdsMedical'
	| '_thresholdsFinancial';

export type ThresholdActiveFormatLabel = 'Custom' | 'Last Month' | 'Season' | 'Best Score';
export type ThresholdActiveFormat = 'customValue' | 'last30Value' | 'seasonValue' | 'bestValue' | 'value'; // value only for financial
export const thresholdActiveFormats: ThresholdActiveFormat[] = [
	'customValue',
	'last30Value',
	'seasonValue',
	'bestValue'
];

export type ThresholdType = 'gps' | 'tactical' | 'test' | 'financial';

export interface Apply {
	type: 'player' | 'all' | 'group' | 'playerId';
	label: string;
	key?: string;
}

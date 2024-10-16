import { FormControl } from '@angular/forms';

export type ComparePlayersTeamThresholds = {
	dateFrom: Date;
	dateTo: Date;
	metricsTeamStats: string[];
	teamId: string;
};

export type Statistics = {
	last30: ComparePlayersTeamThresholds;
	lastSeason: ComparePlayersTeamThresholds;
};

export type ThresholdFormElement = {
	name: FormControl<string>;
	metricLabel: FormControl<string>;
	value: FormControl<number>;
	last30: FormControl<number>;
	lastSeason: FormControl<number>;
}

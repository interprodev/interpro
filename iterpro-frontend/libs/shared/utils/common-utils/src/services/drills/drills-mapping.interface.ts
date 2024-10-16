import { SelectItem } from 'primeng/api';

export type DrillsMapping = {
	themes: SelectItem[];
	tacticalGoals: SelectItem[];
	technicalGoals: SelectItem[];
	physicalGoals: SelectItem[];
	ageGroups: SelectItem[];
	goals: SelectItem[];
}

export type DrillsListMapping = {
	durationList: SelectItem[];
	numberOfPlayerList: SelectItem[];
	drillThemeForFilter: SelectItem[];
	pitchSizeList: SelectItem[];
}

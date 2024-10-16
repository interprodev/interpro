import { SelectItem } from 'primeng/api';

export interface GameStatsConfig<T> extends SelectItem<T> {
	type: string;
}

export const gameStatsConfig: GameStatsConfig<string>[] = [
	{ value: 'possessionPercent', type: 'average', label: 'dashboard.details.possession' },
	{ value: 'successfulPasses', type: 'percent', label: 'dashboard.details.successfullPasses' },
	{ value: 'shots', type: 'total', label: 'dashboard.details.shots' },
	{ value: 'shotsOnTarget', type: 'percent', label: 'dashboard.details.shotsOnTarget' },
	{ value: 'duelsWon', type: 'percent', label: 'dashboard.details.duelsWon' },
	{ value: 'fouls', type: 'total', label: 'dashboard.details.fouls' },
	{ value: 'offsides', type: 'total', label: 'dashboard.details.offsides' },
	{ value: 'corners', type: 'total', label: 'dashboard.details.corners' }
];

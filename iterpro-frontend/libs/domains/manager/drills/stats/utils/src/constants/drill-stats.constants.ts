import { SelectItem } from 'primeng/api';

export const DRILL_STATS_METRICS: SelectItem<string>[] = [
	{ label: 'drillStats.themeMins', value: 'themeMins' },
	{ label: 'drillStats.themeNumber', value: 'themeNumber' },
	{ label: 'drillStats.goalMins', value: 'goalMins' },
	{ label: 'drillStats.goalNumber', value: 'goalNumber' },
	{ label: 'drillStats.techinicalDEFMins', value: 'techinicalDEFMins' },
	{ label: 'drillStats.techinicalDEFNumber', value: 'techinicalDEFNumber' },
	{ label: 'drillStats.techinicalATTMins', value: 'techinicalATTMins' },
	{ label: 'drillStats.techinicalATTNumber', value: 'techinicalATTNumber' },
	{ label: 'drillStats.tacticalMins', value: 'tacticalMins' },
	{ label: 'drillStats.tacticalNumber', value: 'tacticalNumber' },
	{ label: 'drillStats.physicalMins', value: 'physicalMins' },
	{ label: 'drillStats.physicalNumber', value: 'physicalNumber' }
];

export const DRILL_STATS_TITLE = 'DRILL STATS';
export const REPORT_TEMPLATE_KEY = 'drill_stats';

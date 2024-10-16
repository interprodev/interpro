import { ReadinessColumn } from '@iterpro/shared/data-access/sdk';

export const READINESS_TABLE_COLUMNS: ReadinessColumn[] = [
	{
		field: 'downloadUrl',
		header: '',
		sortable: false,
		width: '80px',
		type: 'image',
	},
	{
		field: 'jersey',
		header: 'profile.positon.jerseyNumber',
		sortable: false,
		align: 'center',
		type: 'jerseyNumber'
	},
	{
		field: 'displayName',
		header: 'profile.overview.displayName',
		alternativeHeader: 'profile.overview.name',
		sortable: true,
		align: 'left',
		type: 'text',
		frozen: true
	},
	{
		field: 'birthDate',
		header: 'profile.overview.birth',
		sortable: true,
		align: 'center',
		type: 'date'
	},
	{
		field: 'nationality',
		header: 'profile.overview.nationality',
		sortable: true,
		align: 'center',
		type: 'flag'
	},
	{
		field: 'position',
		header: 'profile.position',
		sortable: true,
		align: 'center',
		type: 'text'
	},
	{
		field: 'goscore',
		header: 'readiness.goScore',
		sortable: true,
		align: 'center',
		type: 'goScore'
	},
	{
		field: 'injuryIcon',
		header: 'notifications.injury',
		sortable: true,
		align: 'center',
		type: 'injuryStatus'
	},
	{
		field: 'sleep',
		header: 'wellness.sleep',
		sortable: true,
		align: 'center',
		type: 'wellnessBase'
	},
	{
		field: 'sleepTime',
		header: 'wellness.sleepTime',
		sortable: true,
		align: 'center',
		type: 'sleepTime'
	},
	{
		field: 'stress',
		header: 'wellness.stress',
		sortable: true,
		align: 'center',
		type: 'wellnessBase'
	},
	{
		field: 'fatigue',
		header: 'wellness.fatigue',
		sortable: true,
		align: 'center',
		type: 'wellnessBase'
	},
	{
		field: 'soreness',
		header: 'wellness.soreness',
		sortable: true,
		align: 'center',
		type: 'wellnessBase'
	},
	{
		field: 'locations',
		header: 'wellness.sorenessLocation',
		sortable: true,
		align: 'center',
		type: 'wellnessSorenessLocation'
	},
	{
		field: 'mood',
		header: 'wellness.mood',
		sortable: true,
		align: 'center',
		type: 'wellnessBase'
	}
];

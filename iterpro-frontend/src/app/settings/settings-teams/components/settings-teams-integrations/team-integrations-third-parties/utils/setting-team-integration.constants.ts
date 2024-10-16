import { GpsMetricMapping } from '@iterpro/shared/data-access/sdk';

export const DEFAULT_GPS_METRIC_MAPPING: GpsMetricMapping[] = [
	new GpsMetricMapping({
		columnLabel: 'Duration',
		columnName: 'duration'
	}),
	new GpsMetricMapping({ columnLabel: 'RPE', columnName: 'rpe' }),
	new GpsMetricMapping({ columnLabel: 'RPE TL', columnName: 'rpeTl' }),
	new GpsMetricMapping({
		columnLabel: 'HR 85-90 (min)',
		columnName: 'heartRate85to90'
	}),
	new GpsMetricMapping({
		columnLabel: 'HR >90 (min)',
		columnName: 'heartRateGr90'
	}),
	new GpsMetricMapping({
		columnLabel: 'Total Distance (Km)',
		columnName: 'totalDistance'
	}),
	new GpsMetricMapping({
		columnLabel: 'Sprint Distance (m)',
		columnName: 'sprintDistance'
	}),
	new GpsMetricMapping({
		columnLabel: 'High Speed Running Distance (m)',
		columnName: 'highspeedRunningDistance'
	}),
	new GpsMetricMapping({
		columnLabel: 'Power Distance (m)',
		columnName: 'powerDistance'
	}),
	new GpsMetricMapping({
		columnLabel: 'High Power Distance (m)',
		columnName: 'highPowerDistance'
	}),
	new GpsMetricMapping({
		columnLabel: 'Power Plays (No)',
		columnName: 'powerPlays'
	}),
	new GpsMetricMapping({
		columnLabel: 'High Intensity Decel (No)',
		columnName: 'highIntensityDeceleration'
	}),
	new GpsMetricMapping({
		columnLabel: 'High Intensity Accel (No)',
		columnName: 'highIntensityAcceleration'
	}),
	new GpsMetricMapping({
		columnLabel: 'Explosive Distance (m)',
		columnName: 'explosiveDistance'
	}),
	new GpsMetricMapping({
		columnLabel: 'AVG Metabolic Power (W/Kg)',
		columnName: 'averageMetabolicPower'
	}),
	new GpsMetricMapping({
		columnLabel: 'Distance per minute (m)',
		columnName: 'distancePerMinute'
	}),
	new GpsMetricMapping({
		columnLabel: 'Workload Score',
		columnName: 'workload'
	})
]

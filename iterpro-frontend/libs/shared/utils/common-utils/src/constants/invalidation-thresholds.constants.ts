interface IThreshold {
	tName: string;
	tMetric: string;
	tType: string;
}

export const thresholds: IThreshold[] = [
	{ tName: 'Counter Movement Jump', tMetric: 'CMJ Arm Locked HT(cm)', tType: '_thresholdsPower' },
	{ tName: 'Mobility', tMetric: 'Hip', tType: '_thresholdsMovement' },
	{ tName: 'Salivary', tMetric: 'T/C Ratio', tType: '_thresholdsAncillary' },
	{ tName: 'Urine', tMetric: 'Osm/L', tType: '_thresholdsAncillary' },
	{ tName: 'Blood', tMetric: 'Creatin Kinasi', tType: '_thresholdsHaematology' },
	{ tName: 'HRV', tMetric: 'rMSSD', tType: '_thresholdsCardiovascular' },
	{ tName: 'Sleep', tMetric: 'Minutes in bed', tType: '_thresholdsSleep' }
];

export const getInvalidationThresholds = () => thresholds;

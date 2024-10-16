import { PlayerStat, Team, Threshold } from '../../../lib';
import { DeviceMetricDescriptor } from '../../classes/metrics.model';

export interface IBaseEtlPlayerService {
	getDefaultThresholds(): Threshold[];
	getMetricLabel(metricName: string): string;
	getMetricsMapping(): DeviceMetricDescriptor[];
	getPlayerStatsFromCsv(csvData: any[], team: Team): PlayerStat[] | null;
	getSplitColumnMetric(): DeviceMetricDescriptor | null;
	getPlayerNameColumnMetric(): DeviceMetricDescriptor | null;
	getDurationField(): DeviceMetricDescriptor;
}

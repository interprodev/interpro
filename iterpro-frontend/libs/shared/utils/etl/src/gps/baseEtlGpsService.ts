import { DeviceMetricDescriptor, SessionPlayerData, Team, Threshold } from '@iterpro/shared/data-access/sdk';

export abstract class BaseEtlGpsService {
	abstract getDefaultThresholds(): Threshold[];
	abstract getMetricLabel(metricName: string): string;
	abstract getMetricsMapping(): DeviceMetricDescriptor[];
	abstract getSessionsFromCsv(data: any[], team: Team): SessionPlayerData[] | null;
}

import { Team, TeamProviderMapping, TeamStat, Threshold } from '../../../lib';
import { DeviceMetricDescriptor } from '../../classes/metrics.model';

export interface IBaseEtlTeamService {
	getDefaultThresholds(): Threshold[];
	getMetricLabel(metricName: string): string;
	getMetricsMapping(): DeviceMetricDescriptor[];
	getTeamStatsFromCsv(csvData: any, team: Team): TeamStat | null;
	getMatchResultFields(home: boolean, teamProviderMapping: TeamProviderMapping): any;
}

import { PlayerGameReport, PlayerTrainingReport } from '@iterpro/shared/data-access/sdk';
import { SelectItemGroup } from 'primeng/api';

export interface DenormalizedEventFields {
	start: Date;
	homeTeam: string;
	awayTeam: string;
	title: string;
}

export type ExtendedPlanningGameReport = PlayerGameReport & PlayerTrainingReport;

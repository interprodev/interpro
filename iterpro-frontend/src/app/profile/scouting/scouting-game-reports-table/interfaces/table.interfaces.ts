import {
	DenormalizedScoutingGameFields,
	ScoutingGameReport,
	TableColumnBase
} from '@iterpro/shared/data-access/sdk';

export interface Column extends TableColumnBase {
	filterLabel?: string; // if present shows as filter label
	type?: string; // default behaviour is 	{{ element[column.field] }}
	group?: string;
	color?: string;
	hideInTable?: boolean; // example visible in csv but not in table
}

export enum CompletionStatus {
	Completed = 1,
	NotCompleted = 2,
	Pending = 3
}

export interface TableFilters {
	birthYear: number[];
	competition: number[];
	lastUpdate: string[];
	lastUpdateAuthor: string[];
	level: string[];
	nationality: string[];
	player: { displayName: string; playerScoutingId: string }[];
	position: string[];
	scout: string[];
	teams: string[];
}

export type GameReportWithAdditionalData = ScoutingGameReport & {
	birthYear: number;
	lastUpdate: string;
	lastUpdateAuthor: string;
	denormalizedScoutingGameFields: DenormalizedScoutingGameFields;
};

import { TableColumn } from './table-column';

export interface PlayerTableColumn extends TableColumn {
	column?: string; // identify column when field is not unique
	group?: 'general' | 'attributes' | 'fitness' | 'robustness'; // group to which column belongs
}

export type ColumnVisibility = Record<'general' | 'attributes' | 'fitness' | 'robustness', string[]>;

export interface ColumnPayload {
	testHeaders: string[];
	isTipss: boolean;
	hasSomeArchivedPlayers: boolean;
}

import { TableColumn } from '@iterpro/shared/data-access/sdk';

export const getVisibleColumnsForGroup = (groupToFind: string, columns: TableColumn[], visibleColumns: string[]) =>
	columns
		.filter(({ group, field }) => group === groupToFind && visibleColumns.includes(field))
		.map(({ field }) => field);

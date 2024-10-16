export interface TableColumnBase {
	field: string; // object property
	header: string; // to show in table headers
	sortable: boolean;
	align?: 'left' | 'center' | 'right';
	width?: string;
	frozen?: boolean;
}

export interface TableColumn extends TableColumnBase {
	filterLabel?: string; // if present shows as filter label
	translateValuePrefix?: string; // if present, the label is translated with this prefix
	type?: ColumnType; // default behaviour is 	{{ element[column.field] }}
	group?: string;
	alternativeHeader?: string; // if this is setted, the pdf report take it istead of header
}

export declare type ColumnType =
	| 'text'
	| 'image'
	| 'flag'
	| 'date'
	| 'prognosis'
	| 'withTooltip'
	| 'translate'
	| 'report'
	| 'reportData'
	| 'playerAttributes'
	| 'age'
	| 'year'
	| 'pending'
	| 'readiness'
	| 'injury'
	| 'expiration'
	| 'test'
	| 'chronicInjuries'
	| 'treatment'
	| 'functionalTest'
	| 'percentage'
	| 'number';

import { SelectItem } from 'primeng/api';

export type FilterType = 'single' | 'multi' | 'range' | 'datetime' | 'age' | 'player';

export interface FilterOption<T> {
	label: string;
	type: FilterType;
	filterFn?: (item: T, validValues?: any[]) => boolean;
	translateLabelPrefix?: string;
	defaultSelection?: any[];
	config?: any;
	interpolateScoutFn?: (item: string, collection: any[]) => string;
	interpolateCompetitionFn?: (item: string, collection: any[]) => string;
}

export type FilterOptions<T> = {
	[key in keyof T]?: FilterOption<T>;
};

export interface FilterState<T> {
	key: string;
	options: SelectItem[];
	selection?: {
		items: any[] | undefined;
		type: 'default' | 'user';
	};
	filter: FilterOption<T>;
	config: any;
}

export interface FilterEmitter {
	filteredItems: any[];
	state: Array<FilterState<any>>;
}

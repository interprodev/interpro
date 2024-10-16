import { TeamTableFilterTemplate } from '@iterpro/shared/data-access/sdk';
import { FilterOptions, FilterState } from '../models/table-filter.model';

/**
 * Filters the templates for a specific table.
 * @param state the filter state of the table-filter.component.
 * @returns the filters for the template to set as input to the table-filter-template.component.
 */
export function getFiltersForTemplate(state: FilterState<any>[]): { [s: string]: unknown } {
	return Object.assign({}, ...(state || []).map(({ key, selection }) => ({ [key]: selection.items })));
}

/**
 * Filters the templates for a specific table.
 * @param event the emitted event from the table-filter.component.
 * @param filterOptions the current component filter options.
 * @returns the updated filter options.
 */
export function getUpdatedFilterOptions(
	event: TeamTableFilterTemplate,
	filterOptions: FilterOptions<any>
): FilterOptions<any> {
	const newFilterOptions = { ...filterOptions };
	Object.keys(event.filters).forEach(key => {
		if (event.filters[key]) {
			newFilterOptions[key].defaultSelection = event.filters[key];
		}
	});
	return newFilterOptions;
}

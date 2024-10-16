import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Customer } from '@iterpro/shared/data-access/sdk';
import { AgePipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { sortBy } from 'lodash';
import { SelectItem } from 'primeng/api';
import { FilterEmitter, FilterOption, FilterOptions, FilterState, FilterType } from './models/table-filter.model';

@Component({
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModule, TranslateModule],
	selector: 'iterpro-table-filter',
	templateUrl: './table-filter.component.html'
})
export class TableFilterComponent implements OnChanges {
	// basic usage variables
	@Input() options: FilterOptions<any>; // the filter options
	@Input() items: any[] = []; // the items to be filtered
	@Input() periodDates: Date[] = []; //dates range, is not part of the filterstate
	@Output() filterEmitter: EventEmitter<FilterEmitter> = new EventEmitter<FilterEmitter>(); // the filtered items and the filter state
	@Output() extractedEmitter: EventEmitter<FilterEmitter> = new EventEmitter<FilterEmitter>();
	@Output() periodChangedEmitter: EventEmitter<Date[]> = new EventEmitter<Date[]>();
	filtersState: Array<FilterState<any>> = []; // the filter state

	// additional usage variables, customizations
	@Input() hideReset = false;
	@Input() customers: Customer[] = [];
	@Input() competitions: SelectItem[] = [];
	@Input() extractedSource: any; // object or array containing the options already extracted - useful for lazy loaded tables where the server also returns these options
	constructor(
		private datePipe: DatePipe,
		private agePipe: AgePipe,
		private translate: TranslateService
	) {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['extractedSource']) {
			if (this.hasReallyChanged(changes, 'extractedSource')) {
				this.filtersState = [];
				this.initFiltersStateExtracted();
			}
		}
		if (!this.extractedSource && ((changes.items && this.items) || (changes.options && this.options))) {
			this.filtersState = [];
			this.initFilterState();
		}
	}

	private hasReallyChanged(changes: SimpleChanges, field: string): boolean {
		const currentExtractedSource = changes[field].currentValue;
		const previousExtractedSource = changes[field].previousValue;
		return JSON.stringify(currentExtractedSource) !== JSON.stringify(previousExtractedSource);
	}

	//#region Basic usage
	emitFilterResult() {
		const result: any[] = (this.items || []).filter(item => this.passAllFilters(item));
		this.filterEmitter.emit({ filteredItems: result, state: this.filtersState });
	}

	private emitExtractedResult() {
		const result: any[] = (this.items || []).filter(item => this.passAllFilters(item));
		this.extractedEmitter.emit({ filteredItems: result, state: this.filtersState });
	}

	private initFilterState() {
		const optionKeys: string[] = Object.keys(this.options);
		const optionMapper: Map<string, string[]> = this.mapOptions(optionKeys, this.items);
		this.filtersState = optionKeys.map((key: string) => {
			const selection = this.getStateSelectedValue(key, this.options[key]);
			return {
				key,
				selection,
				options: sortBy(optionMapper.get(key))
					.filter(value => (Array.isArray(value) ? value.length > 0 : value))
					.map(value => ({
						label: this.getOptionLabel(value, this.options[key].type, this.options[key].translateLabelPrefix),
						value
					})),
				config: this.options[key].config,
				filter: this.options[key]
			};
		});
		this.emitFilterResult();
	}
	private mapOptions(keys: string[], items: any[]): Map<string, any[]> {
		const optionMapper: Map<string, string[]> = new Map<string, string[]>();
		keys.forEach(key => {
			optionMapper.set(key, []);
		});
		let reference: string[];
		(items || []).forEach(item => {
			keys.forEach(key => {
				if (item[key]) {
					reference = optionMapper.get(key);
					this.insertOption(reference, item[key]);
				}
			});
		});
		return optionMapper;
	}

	private insertOption(ref: string[], val: string | string[]) {
		if (Array.isArray(val)) {
			ref.push(...val.filter(item => !ref.includes(item)));
		} else if (!ref.includes(val)) {
			ref.push(val);
		}
	}

	private getStateSelectedValue(key: string, options: FilterOption<any>): { items: any[] | undefined; type: 'default' | 'user' } {
		const found: FilterState<any> = (this.filtersState || []).find(state => state.key === key);
		if (found && found.selection) {
			if (found.selection.type === 'user') {
				return { items: found.selection.items, type: 'user' };
			}
		}
		return { items: [...(options?.defaultSelection?.length ? options.defaultSelection : [])], type: 'default' };
	}

	private getOptionLabel(value: any, type: FilterType, prefix?: string): string {
		if (type === 'datetime') return this.datePipe.transform(value, `${getMomentFormatFromStorage()} HH:mm:ss`);
		if (type === 'age') return String(this.agePipe.transform(value));
		if (type === 'player') return value.displayName;
		return !this.isDefined(prefix) ? value : this.translate.instant(prefix.length > 0 ? prefix + '.' + value : value);
	}

	private isDefined(value: string): boolean {
		return ![null, undefined].includes(value);
	}

	private passAllFilters(item: any): boolean {
		return this.filtersState.every((filterState: FilterState<any>) => this.passFilter(item, filterState));
	}

	private passFilter(item: any, { key, filter, selection = { items: [], type: 'default' } }: FilterState<any>): boolean {
		const validValues: any[] = Array.isArray(selection.items) ? selection.items : [selection.items];
		const { filterFn } = filter;
		return filterFn ? filterFn(item, validValues) : this.defaultFilter(filter.type, item[key], validValues);
	}

	private defaultFilter = (type: FilterType, itemValue: any, validValues: any[] = []): boolean => {
		if (validValues.filter(Boolean).length === 0) return true;
		if (validValues.length === 0 && !this.isDefined(itemValue)) return true;
		return type === 'range' ? this.isInsideRange(itemValue, validValues) : validValues.includes(itemValue);
	};

	private isInsideRange(itemValue: any, [min, max]: any[]): boolean {
		if (!itemValue) return true;
		return itemValue >= min && itemValue <= max;
	}

	//endRegion

	//#region Additional usage, customizations
	private initFiltersStateExtracted() {
		const optionKeys: string[] = Object.keys(this.options);
		const optionMapper: Map<string, string[]> = new Map(Object.entries(this.extractedSource));
		this.filtersState = optionKeys.map(key => {
			const selection = this.getStateSelectedValue(key, this.options[key]);
			return {
				key,
				selection,
				options: sortBy(optionMapper.get(key)).map(value => ({
					label: this.options[key].interpolateScoutFn
						? this.options[key].interpolateScoutFn(value, this.customers)
						: this.options[key].interpolateCompetitionFn
							? this.options[key].interpolateCompetitionFn(value, this.competitions)
							: this.getOptionLabel(value, this.options[key].type, this.options[key].translateLabelPrefix),
					value
				})),
				config: this.options[key].config,
				filter: this.options[key]
			};
		});
		this.emitExtractedResult();
	}

	private handleResetStateSelectedItems() {
		this.filtersState.forEach(state => {
			state.selection = null;
		});
	}
	resetFilters() {
		this.handleResetStateSelectedItems();
	}
	//endRegion
}

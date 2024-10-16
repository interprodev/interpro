/* eslint-disable @angular-eslint/no-output-on-prefix */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';

export interface ColumnVisibilityOption {
	label: string;
	options: SelectItem[];
	model: string[];
}

@Component({
	standalone: true,
	imports: [CommonModule, TranslateModule, FormsModule, PrimeNgModule],
	selector: 'iterpro-table-column-filter',
	templateUrl: './table-column-filter.component.html'
})
export class TableColumnFilterComponent implements OnChanges {
	@Input() options: ColumnVisibilityOption[] = [];
	@Input() hideReset = false;

	@Output() onChange: EventEmitter<string[]> = new EventEmitter<string[]>();

	columns: ColumnVisibilityOption[] = [];

	constructor(private translate: TranslateService) {}

	ngOnChanges(changes: SimpleChanges) {
		if (['options'].some(input => !!changes[input] && !!changes[input].currentValue)) {
			this.initColumns(this.options);
		}
	}

	updateFilters() {
		const result: string[] = this.columns.reduce(
			(accumulator, { model }) => (model ? accumulator.concat(model as []) : accumulator),
			[]
		);
		this.onChange.emit(result);
	}

	resetFilters() {
		this.columns.forEach(column => {
			column.model = column.options.map(({ value }) => value);
		});
		this.updateFilters();
	}

	private initColumns(configs: ColumnVisibilityOption[] = []) {
		this.columns = configs.map(config => ({
			...config,
			options: config.options.map(({ value, label }) => ({ label: this.translate.instant(label as string), value })),
			model: Array.isArray(config.model)
				? config.model.length > 0
					? config.model
					: config.options.map(({ value }) => value)
				: []
		}));
	}
}

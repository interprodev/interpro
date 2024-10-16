import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
	DEFAULT_SCOUTING_FILTER_STATUS,
	ScoutingFilter,
	ScoutingFilterLabel,
	ScoutingFilterStatus
} from './interfaces';

@Component({
	selector: 'iterpro-scouting-shortlist-filters',
	templateUrl: './scouting-shortlist-filters.component.html',
	styleUrls: ['./scouting-shortlist-filters.component.css']
})
export class ScoutingShortlistFiltersComponent {
	@Input() status: ScoutingFilterStatus = DEFAULT_SCOUTING_FILTER_STATUS;
	@Output() filter: EventEmitter<ScoutingFilterStatus> = new EventEmitter<ScoutingFilterStatus>();

	emitFilterValues() {
		this.filter.emit(this.status);
	}

	// Utility function to preserve original property order when | keyValue is used in template
	originalOrder = (
		a: KeyValue<ScoutingFilterLabel, ScoutingFilter<any>>,
		b: KeyValue<ScoutingFilterLabel, ScoutingFilter<any>>
	): number => 0;
}

import { Injectable, inject } from '@angular/core';
import { Player } from '@iterpro/shared/data-access/sdk';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import {
	DrillStatsFilters,
	DrillStatsViews,
	OrderType,
	drillsStatsFeature,
	selectComparisonData,
	selectPeriodData,
	selectSelectedFilters
} from '..';
import { FiltersDrillStatsActions, UIDrillStatsActions } from './drills-stats.actions';
import { DrillsStatsState } from './drills-stats.state';

@Injectable({ providedIn: 'root' })
export class DrillsStatsFacade {
	readonly #store = inject(Store<DrillsStatsState>);

	readonly ui$ = this.#store.select(drillsStatsFeature.selectUi);
	readonly comparisonData$ = this.#store.select(selectComparisonData);
	readonly periodData$ = this.#store.select(selectPeriodData);
	readonly filters$ = this.#store.select(drillsStatsFeature.selectFilters);
	readonly filtersData$ = this.#store.select(drillsStatsFeature.selectFilters).pipe(map(filters => filters.data));
	readonly selectedFilters$ = this.#store.select(selectSelectedFilters);

	/** UI Actions */
	toggleSidebar(isFullscreen: boolean): void {
		this.#store.dispatch(UIDrillStatsActions.toggleSidebar(isFullscreen));
	}

	toggleOrder(order: OrderType): void {
		this.#store.dispatch(UIDrillStatsActions.toggleOrder(order));
	}

	selectView(selectedView: DrillStatsViews): void {
		this.#store.dispatch(UIDrillStatsActions.selectView(selectedView));
	}

	toggleLabels(labels: boolean): void {
		this.#store.dispatch(UIDrillStatsActions.toggleLabels(labels));
	}

	togglePercentage(percentage: boolean): void {
		this.#store.dispatch(UIDrillStatsActions.togglePercentage(percentage));
	}

	triggerExportPDF(): void {
		this.#store.dispatch(UIDrillStatsActions.exportPDF());
	}

	triggerExportCSV(): void {
		this.#store.dispatch(UIDrillStatsActions.exportCSV());
	}

	/** Filters Actions */
	initFilters(): void {
		this.#store.dispatch(FiltersDrillStatsActions.initFilters());
	}

	updateFilters(filters: DrillStatsFilters): void {
		this.#store.dispatch(FiltersDrillStatsActions.updateFilters(filters));
	}
}

import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { DrillStatsViews, DrillsStatsFacade, OrderType } from '@iterpro/manager/drills/stats/data-access';
import { DrillsStatsFeatureComparisonComponent } from '@iterpro/manager/drills/stats/stats-feature-comparison';
import { DrillsStatsFeatureFiltersComponent } from '@iterpro/manager/drills/stats/stats-feature-filters';
import { DrillsStatsFeaturePeriodComponent } from '@iterpro/manager/drills/stats/stats-feature-period';
import { DrillsActionsComponent, DrillsTableComponent } from '@iterpro/manager/drills/ui';
import { Player } from '@iterpro/shared/data-access/sdk';
import { AlertComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest, map } from 'rxjs';

@Component({
	standalone: true,
	imports: [
		CommonModule,
		PrimeNgModule,
		TranslateModule,
		DrillsStatsFeatureFiltersComponent,
		DrillsStatsFeatureComparisonComponent,
		DrillsStatsFeaturePeriodComponent,
		DrillsActionsComponent,
		DrillsTableComponent,
		AlertComponent
	],
	selector: 'iterpro-drills-stats-shell',
	templateUrl: './drills-stats-shell.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	styles: [
		`
			p-tabView {
				position: relative;
			}

			iterpro-drills-actions {
				position: absolute;
				top: 3rem;
				right: 1rem;
			}
		`
	]
})
export class DrillsStatsShellComponent implements OnInit {

	readonly VIEWS = DrillStatsViews;
	readonly #facade = inject(DrillsStatsFacade);
	readonly location = inject(Location);
	readonly context$ = combineLatest([
		this.#facade.ui$,
		this.#facade.filters$,
		this.#facade.comparisonData$,
		this.#facade.periodData$
	]).pipe(map(([ui, filters, comparison, period]) => ({ ui, filters, comparison, period })));

	ngOnInit(): void {
		this.#facade.initFilters();
	}

	changeSelectedView(event: { index: number }): void {
		this.#facade.selectView(event.index ? DrillStatsViews.Period : DrillStatsViews.Comparison);
	}

	toggleSidebar(isFullscreen: boolean): void {
		this.#facade.toggleSidebar(isFullscreen);
	}

	toggleOrder(order: OrderType): void {
		this.#facade.toggleOrder(order);
	}

	togglePercentage(percentage: boolean): void {
		this.#facade.togglePercentage(percentage);
	}

	toggleLabels(labels: boolean): void {
		this.#facade.toggleLabels(labels);
	}

	downloadCSV(): void {
		this.#facade.triggerExportCSV();
	}

	downloadPDF(): void {
		this.#facade.triggerExportPDF();
	}
}

import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, inject } from '@angular/core';
import { DrillStatsChartService, DrillStatsData, DrillsStatsUI } from '@iterpro/manager/drills/stats/data-access';
import { DrillsChartComponent } from '@iterpro/manager/drills/ui';
import { Player } from '@iterpro/shared/data-access/sdk';
import { TranslateModule } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import { DrillsMapping } from '@iterpro/shared/utils/common-utils';

@Component({
	standalone: true,
	imports: [NgIf, TranslateModule, DrillsChartComponent],
	selector: 'iterpro-drills-stats-feature-comparison',
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<ng-container *ngIf="!drillStatsMap && !ui.loading; else comparisonChart">
			<div class="pflex-h-6rem">
				<p class="pflex-text-base pflex-text-center pflex-mt-7">{{ 'drillStats.noData' | translate }}</p>
			</div>
		</ng-container>

		<ng-template #comparisonChart>
			<iterpro-drills-chart [isLoading]="ui.loading" [chartData]="chartData" [chartOptions]="chartOptions" />
		</ng-template>
	`
})
export class DrillsStatsFeatureComparisonComponent implements OnChanges {
	@Input({ required: true }) ui!: DrillsStatsUI;
	@Input({ required: true }) drillStatsMap!: Map<string, DrillStatsData[]> | null;
	@Input({ required: true }) selectedPlayers!: Partial<Player>[];
	@Input({ required: true }) drillsMapping!: DrillsMapping | undefined;

	chartData!: ChartData;
	chartOptions!: ChartOptions;

	readonly #chartService = inject(DrillStatsChartService);

	ngOnChanges(): void {
		if (this.drillStatsMap && this.selectedPlayers && this.ui.chartFlags && this.drillsMapping) {
			this.chartData = this.#chartService.buildComparisonChart(
				this.drillStatsMap,
				this.selectedPlayers,
				this.ui.chartFlags,
				this.drillsMapping
			);
			this.chartOptions = this.#chartService.getChartOptions(this.ui.chartFlags);
		}
	}
}

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { DrillStatsData, DrillStatsDataService, DrillStatsViews } from '@iterpro/manager/drills/stats/data-access';
import { Player } from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { DrillsMapping } from '@iterpro/shared/utils/common-utils';

@Component({
	standalone: true,
	imports: [CommonModule, TranslateModule, PrimeNgModule],
	selector: 'iterpro-drills-table',
	templateUrl: './drills-table.component.html',
	styleUrls: ['./drills-table.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DrillsTableComponent implements OnChanges {
	@Input() selectedView!: DrillStatsViews;
	@Input() drillStatistics!: Map<string, DrillStatsData[]> | null;
	@Input() drillsMapping!: DrillsMapping | undefined;
	@Input() selectedPlayers!: Partial<Player>[];

	statsMap!: Map<string, (number | string)[]>;
	headers!: SelectItem<string>[];

	readonly #dataService = inject(DrillStatsDataService);

	ngOnChanges(_: SimpleChanges): void {
		if (this.drillStatistics && this.selectedPlayers && this.drillsMapping) {
			this.headers = this.#dataService.getMetrics(this.drillStatistics, this.drillsMapping);
			this.statsMap =
				this.selectedView === DrillStatsViews.Comparison
					? this.#dataService.getComparisonStatsMap(this.selectedPlayers, this.drillStatistics, this.drillsMapping)
					: this.#dataService.getPeriodTrendStatsMap(this.drillStatistics, this.drillsMapping);
		}
	}
}

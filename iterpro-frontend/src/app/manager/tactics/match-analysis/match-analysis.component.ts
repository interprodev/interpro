import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { DeviceMetricDescriptor, Match, PlayerStat, Threshold } from '@iterpro/shared/data-access/sdk';
import { uniqBy } from 'lodash';

export const cleanJSON = data => {
	return Object.assign({}, data, {
		datasets: data.datasets.map(dataset => {
			const d = Object.assign({}, dataset);
			delete d._meta;
			return d;
		})
	});
};

@Component({
	selector: 'iterpro-match-analysis',
	templateUrl: './match-analysis.component.html'
})
export class MatchAnalysisComponent implements OnChanges {
	@Input() selectedType: string;
	@Input() match: Match;
	@Input() playerView: boolean;
	@Input() thresholds: Threshold[];
	@Input() matches: Match[];
	@Input() metricsTeam: DeviceMetricDescriptor[];
	@Input() metricsPlayer: DeviceMetricDescriptor[];
	@Input() playerStat: PlayerStat;
	@Input() sidebarOpen: boolean;
	@Input() playerStatsForComparison: PlayerStat[];
	@Input() comparisonThresholdsMap: any;
	@Input() allPlayersStats: PlayerStat[];
	@Input() metrics: DeviceMetricDescriptor[];

	@Output() sidebarEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output() saveAttachmentsEmitter: EventEmitter<void> = new EventEmitter<void>();

	ngOnChanges(changes: SimpleChanges) {
		if (changes['metrics'] && this.metrics && this.metrics.length) {
			this.metrics = uniqBy(this.metrics, 'metricName');
		}
	}
}

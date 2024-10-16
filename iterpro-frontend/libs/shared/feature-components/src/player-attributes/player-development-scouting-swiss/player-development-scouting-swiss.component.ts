import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import {
	ScoutingGameWithReport,
	Team
} from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	developmentSwissChartDataset,
} from '@iterpro/shared/utils/common-utils';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
	standalone: true,
	imports: [PrimeNgModule],
	selector: 'iterpro-player-development-scouting-swiss',
	template: `
		<p-chart type="line" [options]="chartOptions" [data]="chartData" [height]="'500px'"></p-chart> `
})
export class PlayerDevelopmentScoutingSwissComponent implements OnInit, OnChanges {
	@Input({required: true}) scoutingGames: ScoutingGameWithReport[] = [];
	@Input({required: true}) team!: Team;
	chartOptions!: ChartOptions;
	chartData!: ChartData;
	ngOnInit(): void {
		this.loadChartData();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['scoutingGames']) {
			this.loadChartData();
		}
	}
	private loadChartData() {
		const { data, options } = developmentSwissChartDataset(this.scoutingGames, this.team.club.scoutingSettings);
		this.chartData = data;
		this.chartOptions = options;
	}
}

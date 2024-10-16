import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChartComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { ChartData, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, ChartComponent],
	selector: 'iterpro-drills-chart',
	templateUrl: './drills-chart.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DrillsChartComponent {
	chartPlugins = [ChartDataLabels];
	@Input() isLoading!: boolean;
	@Input() chartData!: ChartData;
	@Input() chartOptions!: ChartOptions;
}

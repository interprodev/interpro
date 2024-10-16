import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChartInterfaceData } from '../utils/session-analysis-chart.service';
import { ViewFlags } from '../../../+state/session-analysis-store/ngrx/session-analysis-store.interfaces';

@Component({
	selector: 'iterpro-session-analysis-chart',
	templateUrl: './session-analysis-chart.component.html',
	styleUrls: ['./session-analysis-chart.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionAnalysisChartComponent {
	@Input() viewFlags: ViewFlags;
	@Input() chartData: ChartInterfaceData;
}

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChartInterfaceData } from '../utils/session-analysis-chart.service';

@Component({
	selector: 'iterpro-session-profile',
	templateUrl: './session-profile.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionProfileComponent {
	@Input() radarChart: ChartInterfaceData;
}

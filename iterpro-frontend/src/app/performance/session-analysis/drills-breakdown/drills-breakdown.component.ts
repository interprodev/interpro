import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Event } from '@iterpro/shared/data-access/sdk';
import { ChartFlags, ViewFlags } from 'src/app/+state/session-analysis-store/ngrx/session-analysis-store.interfaces';
import { ChartInterfaceData } from '../utils/session-analysis-chart.service';

@Component({
	selector: 'iterpro-drills-breakdown',
	templateUrl: './drills-breakdown.component.html',
	styleUrls: ['./drills-breakdown.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DrillsBreakdownComponent {
	@Input() chartData: ChartInterfaceData;
	@Input() chartFlags: ChartFlags;
	@Input() viewFlags: ViewFlags;
	@Input() selectedSession: Event;

	@Output() onCalendarClick = new EventEmitter<void>();
	@Output() onTogglePercentage = new EventEmitter<boolean>();
	@Output() onToggleLabels = new EventEmitter<boolean>();
	@Output() onShowUploadDialog = new EventEmitter<void>();
	@Output() onHideUploadDialog = new EventEmitter<void>();

	constructor() {}

	goToCalendar(): void {
		this.onCalendarClick.emit();
	}

	toggleLabels(): void {
		this.onToggleLabels.emit(!this.chartFlags.labels);
	}

	togglePercentage(): void {
		this.onTogglePercentage.emit(!this.chartFlags.percent);
	}

	showUploadDialog(): void {
		this.onShowUploadDialog.emit();
	}

	hideUploadDialog(): void {
		this.onHideUploadDialog.emit();
	}
}

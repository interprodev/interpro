import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { SummaryMetric, ViewFlags } from 'src/app/+state/session-analysis-store/ngrx/session-analysis-store.interfaces';

@Component({
	selector: 'iterpro-session-summary',
	templateUrl: './session-summary.component.html',
	styleUrls: ['./session-summary.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionSummaryComponent {
	@Input() viewFlags: ViewFlags;
	@Input() summaryMetrics: SummaryMetric[];

	@Output() toggleSidebar = new EventEmitter<boolean>();
	@Output() downloadPDF = new EventEmitter<void>();

	showThresholds = false;
	showHelper = false;

	@ViewChild('opSessionSummary') opSessionSummary: OverlayPanel;

	toggleHelper(e): void {
		this.opSessionSummary.toggle(e);
	}

	onThresholdsClick(): void {
		this.showThresholds = !this.showThresholds;
	}

	onSidebarClick(): void {
		this.toggleSidebar.emit(!this.viewFlags.sidebar);
	}

	onReportClick(): void {
		this.downloadPDF.emit();
	}
}

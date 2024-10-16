import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DeviceMetricDescriptor } from '@iterpro/shared/data-access/sdk';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'iterpro-pdf-metrics',
	templateUrl: './pdf-metrics.component.html'
})
export class PDFMetricsComponent {
	readonly metrics!: DeviceMetricDescriptor[];
	selectedPDFMetrics!: DeviceMetricDescriptor[];

	constructor(public dialogRef: DynamicDialogRef, public config: DynamicDialogConfig) {
		this.metrics = this.config.data.metrics;
		this.selectedPDFMetrics = this.metrics;
	}

	applyMetrics(): void {
		this.dialogRef.close(this.selectedPDFMetrics);
	}
}

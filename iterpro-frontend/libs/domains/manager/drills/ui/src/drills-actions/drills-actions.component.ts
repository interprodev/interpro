import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ChartFlags, DrillStatsViews, OrderType } from '@iterpro/manager/drills/stats/data-access';
import { ReportDownloadComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, TranslateModule, ReportDownloadComponent],
	selector: 'iterpro-drills-actions',
	templateUrl: './drills-actions.component.html',
	styleUrls: ['./drills-actions.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DrillsActionsComponent {
	ORDER_TYPES = OrderType;
	VIEW_TYPES = DrillStatsViews;

	@Input() selectedView!: DrillStatsViews;
	@Input() chartFlags!: ChartFlags;
	@Input() isFullscreen!: boolean;

	@Output() toggleSidebar = new EventEmitter<boolean>();
	@Output() toggleLabels = new EventEmitter<boolean>();
	@Output() togglePercentage = new EventEmitter<boolean>();
	@Output() toggleOrder = new EventEmitter<OrderType>();
	@Output() downloadCSV = new EventEmitter();
	@Output() downloadPDF = new EventEmitter();

	sidebarClick(): void {
		this.toggleSidebar.emit(!this.isFullscreen);
	}

	percentageClick(): void {
		this.togglePercentage.emit(!this.chartFlags.percentage);
	}

	labelsClick(): void {
		this.toggleLabels.emit(!this.chartFlags.labels);
	}

	orderClick(): void {
		switch (this.chartFlags.order) {
			case OrderType.Asc:
				this.toggleOrder.emit(OrderType.Desc);
				break;

			case OrderType.Desc:
				this.toggleOrder.emit(OrderType.Unordered);
				break;

			case OrderType.Unordered:
				this.toggleOrder.emit(OrderType.Asc);
				break;
		}
	}

	onDownloadPDF() {
		this.downloadPDF.emit();
	}

	onDownloadCSV() {
		this.downloadCSV.emit();
	}
}

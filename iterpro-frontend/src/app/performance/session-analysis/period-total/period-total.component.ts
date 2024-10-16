import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	OnChanges,
	Output,
	SimpleChanges
} from '@angular/core';
import { DeviceMetricDescriptor, Player, Team } from '@iterpro/shared/data-access/sdk';
import { isNotEmpty } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { take } from 'rxjs/operators';
import {
	ChartFlags,
	PeriodAnalysis,
	PeriodReportDataCSV,
	PeriodTotalReportDataPDF,
	PeriodTotalSession,
	SemaphoreMetricValue,
	SplitSelectItem,
	ViewFlags,
	Views
} from 'src/app/+state/session-analysis-store/ngrx/session-analysis-store.interfaces';
import { PDFMetricsComponent } from '../pdf-metrics/pdf-metrics.component';
import { ChartInterfaceData } from '../utils/session-analysis-chart.service';
import { SessionAnalysisReportService } from '../utils/session-analysis-report.service';
import { SessionAnalysisService } from '../utils/session-analysis.service';

@Component({
	selector: 'iterpro-period-total',
	templateUrl: './period-total.component.html',
	styleUrls: ['./period-total.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PeriodTotalComponent implements OnChanges {
	VIEWS = Views;
	PERIOD_VIEWS = PeriodAnalysis;

	@Input() viewFlags: ViewFlags;
	@Input() selectedTeam: Team;
	@Input() playersStatistics: Map<string, SemaphoreMetricValue[]>;
	@Input() selectedPlayers: SelectItem<Player>[];
	@Input() periodSessions: PeriodTotalSession[];
	@Input() metrics: DeviceMetricDescriptor[];
	@Input() selectedMetrics: DeviceMetricDescriptor[];
	@Input() datePeriod: Date[];
	@Input() selectedSplits: SplitSelectItem[];
	@Input() chartFlags: ChartFlags;

	@Output() onToggleSidebar = new EventEmitter<boolean>();
	@Output() onTogglePercentage = new EventEmitter<boolean>();
	@Output() onToggleOrder = new EventEmitter<boolean>();
	@Output() onToggleLabels = new EventEmitter<boolean>();
	@Output() onDownloadPDF = new EventEmitter<PeriodTotalReportDataPDF>();
	@Output() onDownloadCSV = new EventEmitter<PeriodReportDataCSV>();

	chartData: ChartInterfaceData;
	reportDataPDF: PeriodTotalReportDataPDF;
	reportDataCSV: PeriodReportDataCSV;

	constructor(
		private readonly daService: SessionAnalysisService,
		private readonly reportService: SessionAnalysisReportService,
		private readonly dialogService: DialogService,
		private readonly translateService: TranslateService
	) {}

	ngOnChanges(_: SimpleChanges): void {
		if (
			isNotEmpty(this.selectedMetrics) &&
			isNotEmpty(this.periodSessions) &&
			isNotEmpty(this.selectedPlayers) &&
			!this.viewFlags.isLoading
		) {
			this.chartData = this._buildChartData();
		} else {
			this.chartData = null;
		}
	}

	toggleSidebar(): void {
		this.onToggleSidebar.emit(!this.viewFlags.sidebar);
	}

	togglePercentage(): void {
		this.onTogglePercentage.emit(!this.chartFlags.percent);
	}

	toggleOrder(): void {
		this.onToggleOrder.emit(!this.chartFlags.order);
	}

	toggleLabels(): void {
		this.onToggleLabels.emit(!this.chartFlags.labels);
	}

	downloadPDF(): void {
		const dialogRef: DynamicDialogRef = this.dialogService.open(PDFMetricsComponent, {
			header: `PDF - ${this.translateService.instant('sidebar.metrics')}`,
			data: {
				metrics: this.metrics
			}
		});

		dialogRef.onClose.pipe(take(1)).subscribe((selectedPDFMetrics: DeviceMetricDescriptor[]) => {
			if (selectedPDFMetrics?.length) {
				this.reportDataPDF = this._createPDFReport(selectedPDFMetrics);
				this.onDownloadPDF.emit(this.reportDataPDF);
			}
		});
	}

	downloadCSV(): void {
		this.reportDataCSV = this._createCSVReport();
		this.onDownloadCSV.emit(this.reportDataCSV);
	}

	private _createPDFReport(selectedPDFMetrics: DeviceMetricDescriptor[]): PeriodTotalReportDataPDF {
		return this.reportService.getReportDataPeriodTotalPDF(
			this.metrics,
			selectedPDFMetrics,
			this.selectedMetrics,
			this.playersStatistics,
			this.datePeriod,
			this.selectedSplits,
			this.chartData
		);
	}

	private _createCSVReport(): PeriodReportDataCSV {
		return this.reportService.getReportDataPeriodCSV(
			this.selectedTeam,
			this.datePeriod,
			this.selectedPlayers.map(item => item.value),
			this.selectedSplits
		);
	}

	private _buildChartData(): ChartInterfaceData {
		return this.daService.getChartDataPeriodTotal(
			this.selectedPlayers.map(item => item.value),
			this.periodSessions,
			this.selectedMetrics,
			this.chartFlags
		);
	}

	get metricsLabels(): string[] {
		return this.metrics.map(m => m.metricLabel);
	}
}

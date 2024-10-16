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
import { PDFMetricsComponent } from '../pdf-metrics/pdf-metrics.component';
import { AdvancedAnalysisService } from '../utils/advanced-analysis.service';
import { ChartInterfaceData } from '../utils/session-analysis-chart.service';
import { SessionAnalysisReportService } from '../utils/session-analysis-report.service';
import { SessionAnalysisService } from '../utils/session-analysis.service';
import {
	AdvancedEnum,
	AdvancedMetricData,
	ChartFlags,
	PeriodAnalysis,
	PeriodMatch,
	PeriodReportDataCSV,
	PeriodTrendReportDataPDF,
	PeriodTrendSession,
	SemaphoreMetricValue,
	SplitSelectItem,
	ViewFlags,
	Views
} from '../../../+state/session-analysis-store/ngrx/session-analysis-store.interfaces';

@Component({
	selector: 'iterpro-period-trend',
	templateUrl: './period-trend.component.html',
	styleUrls: ['./period-trend.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PeriodTrendComponent implements OnChanges {
	VIEWS = Views;
	PERIOD_VIEWS = PeriodAnalysis;

	chartData: ChartInterfaceData;
	advancedChartData: ChartInterfaceData;
	reportDataPDF: PeriodTrendReportDataPDF;
	reportDataCSV: PeriodReportDataCSV;

	@Input() selectedTeam: Team;
	@Input() selectedPlayers: SelectItem<Player>[];
	@Input() metrics: DeviceMetricDescriptor[];
	@Input() selectedMetrics: DeviceMetricDescriptor[];
	@Input() periodStatistics: Map<string, SemaphoreMetricValue[]>;
	@Input() datePeriod: Date[];
	@Input() selectedSplits: SplitSelectItem[];
	@Input() periodSessions: PeriodTrendSession[];
	@Input() periodTableData: Map<string, Map<string, { [key: string]: number }[]>>; // Map<Player01, Map<01/01/2022, { rpe: 10, ... }>>
	@Input() eventData: Map<string, PeriodMatch>;
	@Input() selectedAdvanced: AdvancedEnum;
	@Input() advancedData: Map<string, AdvancedMetricData[]>;
	@Input() viewFlags: ViewFlags;
	@Input() chartFlags: ChartFlags;

	@Output() onToggleSidebar = new EventEmitter<boolean>();
	@Output() onToggleLabels = new EventEmitter<boolean>();
	@Output() onDownloadPDF = new EventEmitter<PeriodTrendReportDataPDF>();
	@Output() onDownloadCSV = new EventEmitter<PeriodReportDataCSV>();

	constructor(
		private readonly daService: SessionAnalysisService,
		private readonly advancedService: AdvancedAnalysisService,
		private readonly reportService: SessionAnalysisReportService,
		private readonly translateService: TranslateService,
		private readonly dialogService: DialogService
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		if ('selectedAdvanced' in changes || (this.selectedAdvanced && this._labelsHasChanged(changes))) {
			if (this.selectedAdvanced) {
				// RESET OLD CHART & CREATE ADVANCED
				this.chartData = this._periodCheck() ? this._buildChartData() : this.chartData;
				this.advancedChartData = this._advancedCheck() ? this._buildAdvancedChartData() : this.chartData;
			} else {
				this._checkPeriodChanges(changes);
			}
		} else {
			this._checkPeriodChanges(changes);
		}
	}

	toggleSidebar(): void {
		this.onToggleSidebar.emit(!this.viewFlags.sidebar);
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

	private _periodCheck(): boolean {
		return (
			!!this.eventData &&
			!!this.selectedMetrics &&
			!!this.selectedPlayers &&
			isNotEmpty(this.periodSessions) &&
			!this.viewFlags.isLoading
		);
	}

	private _advancedCheck(): boolean {
		return this.selectedAdvanced && !!this.advancedData && !!this.advancedData.size && !!this.chartData;
	}

	private _checkPeriodChanges(changes: SimpleChanges): void {
		if (
			'eventData' in changes ||
			'selectedPlayers' in changes ||
			'selectedSplit' in changes ||
			'selectedFilter' in changes ||
			'selectedMetrics' in changes ||
			'chartFlags' in changes
		) {
			this.chartData = this._periodCheck() ? this._buildChartData() : this.chartData;
		}
	}

	private _createPDFReport(selectedPDFMetrics: DeviceMetricDescriptor[]): PeriodTrendReportDataPDF {
		return this.reportService.getReportDataPeriodTrendPDF(
			this.periodSessions,
			this.periodStatistics,
			this.metrics,
			selectedPDFMetrics,
			this.selectedMetrics,
			this.selectedPlayers.map(item => item.value),
			this.datePeriod,
			this.selectedSplits,
			this.chartData,
			this.eventData,
			this.periodTableData
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
		return this.daService.getChartDataPeriodTrend(
			this.periodSessions,
			this.selectedPlayers.map(item => item.value),
			this.selectedMetrics,
			this.eventData,
			this.chartFlags
		);
	}

	private _buildAdvancedChartData(): ChartInterfaceData {
		return this.advancedService.triggerAdvancedAnalysis(
			this.chartData.data,
			this.advancedData,
			this.selectedAdvanced,
			this.selectedMetrics[0],
			this.selectedPlayers.map(item => item.value),
			Views.Period,
			this.chartFlags,
			this.datePeriod
		);
	}

	private _labelsHasChanged(changes: SimpleChanges): boolean {
		return !!changes.chartFlags && changes.chartFlags.previousValue.labels !== changes.chartFlags.currentValue.labels;
	}
}

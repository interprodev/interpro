import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	OnChanges,
	Output,
	SimpleChanges
} from '@angular/core';
import { DeviceMetricDescriptor, Event, Player, SessionPlayerData, TeamGroup } from '@iterpro/shared/data-access/sdk';
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
	BubbleMetrics,
	ChartFlags,
	FiltersType,
	SemaphoreMetricValue,
	SessionAnalysis,
	SplitSelectItem,
	TeamSessionReportDataCSV,
	TeamSessionReportDataPDF,
	ViewFlags,
	Views
} from '../../../+state/session-analysis-store/ngrx/session-analysis-store.interfaces';

@Component({
	selector: 'iterpro-session-team',
	templateUrl: './session-team.component.html',
	styleUrls: ['./session-team.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionTeamComponent implements OnChanges {
	VIEWS = Views;
	SESSION_VIEWS = SessionAnalysis;

	chartData: ChartInterfaceData;
	advancedChartData: ChartInterfaceData;
	uploadDialogVisibility = false;
	reportDataPDF: TeamSessionReportDataPDF;
	reportDataCSV: TeamSessionReportDataCSV[];

	@Input() selectedSession: Event;
	@Input() selectedPlayersOptions: SelectItem<Player | TeamGroup>[];
	@Input() selectedFilter: FiltersType;
	@Input() selectedSplit: SplitSelectItem;
	@Input() metrics: DeviceMetricDescriptor[];
	@Input() selectedMetrics: DeviceMetricDescriptor[];
	@Input() chartFlags: ChartFlags;
	@Input() chartFlagsEnable: ChartFlags;
	@Input() playersSessions: SessionPlayerData[];
	@Input() playersStatistics: Map<string, SemaphoreMetricValue[]>;
	@Input() bubbleMetrics: BubbleMetrics;
	@Input() viewFlags: ViewFlags;
	@Input() selectedAdvanced: AdvancedEnum;
	@Input() advancedData: Map<string, AdvancedMetricData[]>;

	@Output() onCalendarClick = new EventEmitter<void>();
	@Output() onShowUploadDialog = new EventEmitter<void>();
	@Output() onToggleSidebar = new EventEmitter<boolean>();
	@Output() onToggleThresholds = new EventEmitter<boolean>();
	@Output() onTogglePercentage = new EventEmitter<boolean>();
	@Output() onToggleOrder = new EventEmitter<boolean>();
	@Output() onToggleLabels = new EventEmitter<boolean>();
	@Output() onToggleBubble = new EventEmitter<boolean>();
	@Output() onDownloadPDF = new EventEmitter<TeamSessionReportDataPDF>();
	@Output() onDownloadCSV = new EventEmitter<TeamSessionReportDataCSV[]>();

	constructor(
		private readonly daService: SessionAnalysisService,
		private readonly advancedService: AdvancedAnalysisService,
		private readonly reportService: SessionAnalysisReportService,
		private readonly dialogService: DialogService,
		private readonly translateService: TranslateService
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		if (
			'selectedAdvanced' in changes ||
			(this.selectedAdvanced && this._orderHasChanged(changes)) ||
			(this.selectedAdvanced && this._labelsHasChanged(changes))
		) {
			if (this.selectedAdvanced) {
				// RESET OLD CHART & CREATE ADVANCED
				this.chartData = this._sessionCheck() ? this._buildChartData() : this.chartData;
				this.advancedChartData = this._advancedCheck() ? this._buildAdvancedChartData() : this.chartData;
			} else {
				this._checkSessionChanges(changes);
			}
		} else {
			this._checkSessionChanges(changes);
		}
	}

	toggleSidebar(): void {
		this.onToggleSidebar.emit(!this.viewFlags.sidebar);
	}

	toggleThresholds(event): void {
		if (!this.chartFlagsEnable.thresholds) event.stopPropagation();
		else this.onToggleThresholds.emit(!this.chartFlags.thresholds);
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

	toggleBubble(): void {
		this.onToggleBubble.emit(!this.chartFlags.bubble);
	}

	goToCalendar(): void {
		this.onCalendarClick.emit();
	}

	showUploadDialog(): void {
		this.onShowUploadDialog.emit();
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

	private _createPDFReport(selectedPDFMetrics: DeviceMetricDescriptor[]): TeamSessionReportDataPDF {
		return this.reportService.getReportDataSessionTeamPDF(
			this.selectedMetrics,
			selectedPDFMetrics,
			this.metrics,
			this.playersStatistics,
			this.selectedSession,
			this.selectedSplit,
			this.chartData.data,
			this.chartData.options,
			this.chartFlags.bubble
		);
	}

	private _createCSVReport(): TeamSessionReportDataCSV[] {
		return this.reportService.getReportDataSessionTeamCSV(
			this.selectedSession,
			this.selectedMetrics,
			this.playersSessions
		);
	}

	private _buildChartData(): ChartInterfaceData {
		if (this.chartFlags.bubble) {
			return this.daService.getChartDataSessionTeamBubble(
				this.playersSessions,
				this.selectedPlayersOptions.map(p => p.value),
				Object.values(this.bubbleMetrics),
				this.selectedSplit,
				this.selectedFilter
			);
		} else {
			return this.daService.getChartDataSessionTeam(
				this.selectedSession,
				this.playersSessions,
				this.selectedPlayersOptions.map(p => p.value),
				this.selectedFilter,
				this.selectedMetrics,
				this.selectedSplit,
				this.chartFlags
			);
		}
	}

	private _buildAdvancedChartData(): ChartInterfaceData {
		return this.advancedService.triggerAdvancedAnalysis(
			this.chartData.data,
			this.advancedData,
			this.selectedAdvanced,
			this.selectedMetrics[0],
			this.selectedPlayersOptions.map(p => p.value),
			Views.Session,
			this.chartFlags
		);
	}

	private _checkSessionChanges(changes: SimpleChanges): void {
		if (
			'playersSessions' in changes ||
			'selectedPlayersOptions' in changes ||
			'selectedSplit' in changes ||
			'selectedFilter' in changes ||
			'selectedMetrics' in changes ||
			'chartFlags' in changes ||
			'bubbleMetrics' in changes
		) {
			this.chartData = this._sessionCheck() ? this._buildChartData() : this.chartData;
		}
	}

	private _sessionCheck(): boolean {
		return (
			this.chartFlags &&
			!!this.playersSessions &&
			!!this.selectedMetrics &&
			!!this.selectedPlayersOptions &&
			!this.viewFlags.isLoading
		);
	}

	private _advancedCheck(): boolean {
		return this.selectedAdvanced && !!this.advancedData && !!this.advancedData.size && !!this.chartData;
	}

	private _orderHasChanged(changes: SimpleChanges): boolean {
		return !!changes.chartFlags && changes.chartFlags.previousValue.order !== changes.chartFlags.currentValue.order;
	}

	private _labelsHasChanged(changes: SimpleChanges): boolean {
		return !!changes.chartFlags && changes.chartFlags.previousValue.labels !== changes.chartFlags.currentValue.labels;
	}
}

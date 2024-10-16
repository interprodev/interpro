import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	OnChanges,
	Output,
	SimpleChanges
} from '@angular/core';

import {
	DeviceMetricDescriptor,
	Event,
	LoopBackAuth,
	Player,
	SessionPlayerData,
	Team,
	Threshold
} from '@iterpro/shared/data-access/sdk';
import { ThresholdsService, isNotEmpty, getTeamSettings } from '@iterpro/shared/utils/common-utils';
import {
	ALCLIndividual,
	AdvancedFlags,
	ChartFlags,
	SplitSelectItem,
	SummaryMetric,
	ViewFlags
} from 'src/app/+state/session-analysis-store/ngrx/session-analysis-store.interfaces';
import { ChartInterfaceData } from '../utils/session-analysis-chart.service';
import { SessionAnalysisReportService } from '../utils/session-analysis-report.service';
import { SessionAnalysisService } from '../utils/session-analysis.service';

@Component({
	selector: 'iterpro-session-individual',
	templateUrl: './session-individual.component.html',
	styleUrls: ['./session-individual.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionIndividualComponent implements OnChanges {
	thresholdPlayer: Threshold[];
	radarChart: ChartInterfaceData;
	chartData: ChartInterfaceData;
	activePerformance: string[];
	summaryMetrics: SummaryMetric[];
	reportDataPDF: any;

	// -------- SESSION DATA
	@Input() selectedTeam: Team;
	@Input() mainSession: SessionPlayerData;
	@Input() selectedSession: Event;
	@Input() selectedPlayer: Player;
	@Input() playersSessions: SessionPlayerData[];
	@Input() metrics: DeviceMetricDescriptor[];
	@Input() viewFlags: ViewFlags;
	@Input() chartFlags: ChartFlags;
	@Input() canLoadAdvanced: boolean;

	// -------- ADVANCED DATA
	@Input() individualALCL: ALCLIndividual[];
	@Input() advancedFlags: AdvancedFlags;

	// -------- CHART
	@Input() playerStatistics: Map<string, string[]>;
	@Input() selectedSplits: SplitSelectItem[];
	@Input() selectedMetrics: DeviceMetricDescriptor[];

	@Output() onDownloadPDF: EventEmitter<any> = new EventEmitter();
	@Output() onToggleSidebar: EventEmitter<boolean> = new EventEmitter();
	@Output() onToggleThresholds: EventEmitter<boolean> = new EventEmitter();
	@Output() onCalendarClick = new EventEmitter<void>();
	@Output() onTogglePercentage = new EventEmitter<boolean>();
	@Output() onToggleLabels = new EventEmitter<boolean>();
	@Output() onShowUploadDialog = new EventEmitter<void>();
	@Output() onSaveAttachments = new EventEmitter<Event>();

	constructor(
		private auth: LoopBackAuth,
		private daService: SessionAnalysisService,
		private sessionAnalysisService: SessionAnalysisService,
		private thresholdsService: ThresholdsService,
		private reportService: SessionAnalysisReportService
	) {}

	ngOnChanges(_: SimpleChanges): void {
		this.activePerformance = this._getActivePerformance();
		this.radarChart = this._buildRadaChartData();
		this.chartData = this._buildChartData();
		this.summaryMetrics = this._getSummaryMetrics();
	}

	toggleSidebar(sidebar: boolean): void {
		this.onToggleSidebar.emit(sidebar);
	}

	toggleThresholds(thresholds: boolean): void {
		this.onToggleThresholds.emit(thresholds);
	}

	downloadReport(): void {
		this.reportDataPDF = this._createPDFReport();
		this.onDownloadPDF.emit(this.reportDataPDF);
	}

	goToCalendar(): void {
		this.onCalendarClick.emit();
	}

	toggleLabels(labels: boolean): void {
		this.onToggleLabels.emit(labels);
	}

	togglePercentage(percentage: boolean): void {
		this.onTogglePercentage.emit(percentage);
	}

	showUploadDialog(): void {
		this.onShowUploadDialog.emit();
	}

	private _getActivePerformance(): string[] {
		return getTeamSettings(this.auth.getCurrentUserData()?.teamSettings, this.selectedTeam.id)?.metricsPerformance;
	}

	private _getSummaryMetrics(): SummaryMetric[] {
		if (this.selectedPlayer && this.mainSession && this.selectedTeam) {
			return this.sessionAnalysisService.getSummaryValues(
				this.mainSession,
				this.selectedPlayer,
				this.activePerformance
			);
		}
	}

	private _initThresholds(): Threshold[] {
		return this.thresholdsService.getGpsThresholdsForDate(
			this.mainSession ? this.mainSession.date : new Date(),
			this.selectedPlayer._thresholds || []
		);
	}

	private _buildRadaChartData(): ChartInterfaceData {
		if (this.selectedPlayer) {
			this.thresholdPlayer = this._initThresholds();
			if (this.mainSession && this.metrics) {
				return this.sessionAnalysisService.getRadarChartSessionIndividual(
					this.mainSession,
					this.thresholdPlayer,
					this.metrics
				);
			}
		}
	}

	private _buildChartData(): ChartInterfaceData {
		if (
			this.selectedSession &&
			this.selectedPlayer &&
			this.chartFlags &&
			isNotEmpty(this.playersSessions) &&
			isNotEmpty(this.selectedSplits) &&
			isNotEmpty(this.selectedMetrics)
		) {
			return this.daService.getChartDataSessionIndividual(
				this.playersSessions,
				this.selectedPlayer,
				this.selectedSplits,
				this.selectedMetrics,
				this.chartFlags
			);
		}

		return null;
	}

	private _createPDFReport(): any {
		return this.reportService.getReportDataSessionIndividual(
			this.selectedMetrics,
			this.summaryMetrics,
			this.selectedSession,
			this.playersSessions,
			this.selectedPlayer,
			this.chartData?.data,
			this.radarChart?.data,
			this.chartData?.options,
			this.radarChart?.options
		);
	}
}

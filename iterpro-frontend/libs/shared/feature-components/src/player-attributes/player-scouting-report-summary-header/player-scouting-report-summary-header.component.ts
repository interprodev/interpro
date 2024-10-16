import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ExtendedPlayerScouting, ReportDataAvg } from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	getCorrectTextColorUtil,
	getPotentialScore,
	swissPerformanceCalculatedByWhitelist,
	swissPlayerAttributesWhitelist,
	swissPotentialCalculatedByWhitelist
} from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { RoundProgressModule } from 'angular-svg-round-progressbar';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, TranslateModule, RoundProgressModule],
	selector: 'iterpro-player-scouting-report-summary-header',
	templateUrl: './player-scouting-report-summary-header.component.html',
	styleUrls: ['./player-scouting-report-summary-header.component.scss']
})
export class PlayerScoutingReportSummaryHeaderComponent implements OnChanges {
	@Input() player!: ExtendedPlayerScouting;
	@Input() showCalculatedBy = true;
	@Input() mode: 'redirectToReports' | 'showAttributes' = 'redirectToReports';
	reportDataAvg: { mainField: ReportDataAvg; calculatedBy: ReportDataAvg[] }[] = [];
	@Output() redirect: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();
	protected readonly getPotentialScore = getPotentialScore;

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['player'] && changes['player'].currentValue) {
			this.loadReportDataAvg();
		}
	}

	private loadReportDataAvg() {
		this.reportDataAvg = (this.player?.reportDataAvg || [])
			.filter(({ key }) => swissPlayerAttributesWhitelist.includes(key))
			.map(item => {
				const whiteList =
					item.sectionId === 'performance'
						? swissPerformanceCalculatedByWhitelist
						: swissPotentialCalculatedByWhitelist;
				return {
					mainField: item,
					calculatedBy: this.player.reportDataAvg?.filter(({ sectionId, key }) => whiteList.includes(sectionId + key))
				};
			}) as any;
	}

	typeOf(value: number | string): string {
		return typeof value;
	}

	getStyleForInputNumber(color: string | undefined): { [key: string]: string } {
		return {
			padding: '2px 2px 1px',
			'font-size': 'small',
			'font-weight': 'bold',
			width: '25px',
			'text-align': 'center',
			color: color ? getCorrectTextColorUtil(color) : '',
			'background-color': color || ''
		};
	}

	onClickIcon(event: MouseEvent) {
		if (this.mode === 'showAttributes') {
			this.showCalculatedBy = !this.showCalculatedBy;
		} else {
			this.redirect.emit(event);
		}
	}
}

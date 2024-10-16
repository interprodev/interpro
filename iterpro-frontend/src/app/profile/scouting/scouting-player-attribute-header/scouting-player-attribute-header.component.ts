import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import {
	AttributeChar,
	AttributeColor,
	ExtendedPlayerScouting,
	PlayerScouting, PotentialLetter,
	ReportDataAvg
} from '@iterpro/shared/data-access/sdk';
import {
	AzureStoragePipe,
	getCorrectTextColorUtil,
	getPlayerAttributesEntryValue,
	getPotentialScore, isBase64Image,
	swissPerformanceCalculatedByWhitelist,
	swissPlayerAttributesWhitelist,
	swissPotentialCalculatedByWhitelist
} from '@iterpro/shared/utils/common-utils';
import { last } from 'lodash';

export interface PrognosisEmitterModel {
	prognosisScore: AttributeChar;
	prognosisDescription: string;
	prognosisColor: AttributeColor;
}

@Component({
	selector: 'iterpro-scouting-player-attribute-header',
	templateUrl: './scouting-player-attribute-header.component.html',
	styleUrls: ['./scouting-player-attribute-header.component.scss']
})
export class ScoutingPlayerAttributeHeaderComponent implements OnInit, OnChanges {
	@Input() player: ExtendedPlayerScouting;
	@Input() enableRedirect = true;
	@Input() mode: 'redirectToReports' | 'showAttributes' = 'redirectToReports';
	@Input() editMode: boolean;
	@Input() showAttributeTable = true;
	@Output() prognosisUpdated: EventEmitter<PrognosisEmitterModel> = new EventEmitter<PrognosisEmitterModel>();
	@Output() redirect: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();
	profileUrl: string;
	prognosisLabel: AttributeChar;
	prognosisScore: number;
	prognosisColor: AttributeColor;
	prognosisDescription: string;
	inputValidatorPrognosis: RegExp = /^[A|B|C|a|b|c]*$/;
	reportDataAvg: { mainField: ReportDataAvg; calculatedBy: ReportDataAvg[] }[] = [];

	readonly #azureUrlPipe = inject(AzureStoragePipe);

	ngOnInit() {
		this.initComponent();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['player']) {
			this.loadReportDataAvg();
			this.parsePrognosis(this.player);
		}
	}

	private initComponent() {
		this.profileUrl = this.getProfileUrl();
		this.parsePrognosis(this.player);
	}

	private loadReportDataAvg() {
		this.reportDataAvg = this.player.reportDataAvg
			.filter(({ key }) => swissPlayerAttributesWhitelist.includes(key))
			.map(item => {
				const whiteList =
					item.sectionId === 'performance'
						? swissPerformanceCalculatedByWhitelist
						: swissPotentialCalculatedByWhitelist;
				return {
					mainField: item,
					calculatedBy: this.player.reportDataAvg.filter(({ sectionId, key }) => whiteList.includes(sectionId + key))
				};
			});
	}

	onClickIcon(event: MouseEvent) {
		if (this.mode === 'showAttributes') {
			this.showAttributeTable = !this.showAttributeTable;
		} else {
			this.redirect.emit(event);
		}
	}

	private getProfileUrl() {
		return this.player && this.player.downloadUrl && isBase64Image(this.player.downloadUrl)
			? this.player.downloadUrl
			: this.#azureUrlPipe.transform(this.player.downloadUrl);
	}

	private parsePrognosis(player: PlayerScouting) {
		const attributesEntry = last(player.attributes);
		if (attributesEntry) {
			this.prognosisLabel =
				<AttributeChar>String(getPlayerAttributesEntryValue(attributesEntry, 'prognosisScore')) || '-';
			this.prognosisScore = this.getPrognosisScore(this.prognosisLabel);
			this.prognosisColor = this.getPrognosisColor(this.prognosisScore);
			this.prognosisDescription = String(getPlayerAttributesEntryValue(attributesEntry, 'prognosisDescription'));
		}
	}

	private getPrognosisScore(prognosisLabel: string) {
		return ['-', 'C', 'B', 'A'].indexOf(prognosisLabel);
	}

	getPrognosisColor(score: number): AttributeColor {
		return ['#dddddd', 'red', 'yellow', 'green'][score] as AttributeColor;
	}

	typeOf(value): string {
		return typeof value;
	}

	getPotentialScore(avg: PotentialLetter): number {
		return getPotentialScore(avg);
	}

	updatePrognosisLabel(event: any) {
		const prognosisLabel = !!event ? event.toUpperCase() : '';
		this.updatePrognosis(prognosisLabel, this.prognosisDescription);
	}

	updatePrognosisDescription(event: any) {
		const prognosisDescription = !!event ? event.toUpperCase() : '';
		this.updatePrognosis(this.prognosisLabel, prognosisDescription);
	}

	updatePrognosis(label: AttributeChar, description: string) {
		const prognosisEvent: PrognosisEmitterModel = {
			prognosisScore: label,
			prognosisColor: this.getPrognosisColor(['-', 'C', 'B', 'A'].indexOf(label)),
			prognosisDescription: description
		};
		this.prognosisUpdated.emit(prognosisEvent);
	}

	recalculatePrognosisScore(prognosisScore: AttributeChar = '-') {
		if (prognosisScore.length > 0) {
			this.prognosisLabel = prognosisScore;
			this.prognosisScore = ['-', 'C', 'B', 'A'].indexOf(this.prognosisLabel);
			this.prognosisColor = ['#dddddd', 'red', 'yellow', 'green'][this.prognosisScore] as AttributeColor;
		}
	}

	getStyleForInputNumber(color: string) {
		return {
			padding: '2px 2px 1px',
			'font-size': 'small',
			'font-weight': 'bold',
			width: '25px',
			'text-align': 'center',
			color: getCorrectTextColorUtil(color),
			'background-color': color
		};
	}
}

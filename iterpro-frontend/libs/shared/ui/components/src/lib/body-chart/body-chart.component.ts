import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChronicInjury, Injury } from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { convertInjuryFields } from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import { OverlayPanel } from 'primeng/overlaypanel';
import { BodyChartBackComponent } from './back/body-chart-back.component';
import { BodyChartFrontComponent } from './front/body-chart-front.component';
import InjuryZone, {
	ISSUE_SORENESS,
	STATUS_CHRONIC,
	STATUS_CLOSED,
	STATUS_COMPLAINT,
	STATUS_INJURY,
	STATUS_SORENESS,
	fillColors,
	isInjuryArchived
} from './utils/injury-zone';
import { BodyLegendConfiguration } from './utils/interfaces';
import { fullPoints, singlePoints } from './utils/points';
import computeStyle from './utils/style';

let uuid = 0;

@Component({
	standalone: true,
	imports: [CommonModule, TranslateModule, PrimeNgModule, BodyChartFrontComponent, BodyChartBackComponent],
	selector: 'iterpro-body-chart',
	templateUrl: './body-chart.component.html',
	styleUrls: ['./body-chart.component.css']
})
export class BodyChartComponent implements OnChanges {
	@Input() emitZoneClicked!: boolean;
	@Input() showSwitch = true;
	@Input() showLegend = true;
	@Input() injuries: Injury[] = [];
	@Input() chronic: ChronicInjury[] = [];
	@Input() hidePast = true;

	legendConfiguration!: BodyLegendConfiguration[];
	uuid = '';
	zones: any = {};
	frontPoints: any = [];
	backPoints: any = [];
	tooltips: any = { front: null, back: null };
	pointsMode = false;
	style: SafeHtml = '<style></style>';

	@ViewChild(OverlayPanel, { static: false }) overlayPanel!: OverlayPanel;

	constructor(private translate: TranslateService, private domSanitizer: DomSanitizer) {
		this.zoneClicked = this.zoneClicked.bind(this);
		this.zoneIn = this.zoneIn.bind(this);
		this.zoneOut = this.zoneOut.bind(this);
		this.uuid = `bc${uuid++}`;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['injuries']) {
			this.injuries = [];
			this.initInjuries(changes['injuries'].currentValue);
		}
		if (changes['chronic']) {
			this.chronic = [];
			this.initChronic(changes['chronic'].currentValue);
		}
	}

	private initInjuries(injuries: Injury[]) {
		Object.keys(this.zones).forEach(key => {
			if (this.zones[key].status !== STATUS_CHRONIC) {
				delete this.zones[key];
			}
		});
		(injuries || []).forEach(injury => this.addInjury(injury, false));
		this.setup();
	}

	private initChronic(chronics: ChronicInjury[]) {
		Object.keys(this.zones).forEach(key => {
			if (this.zones[key].status === STATUS_CHRONIC) {
				delete this.zones[key];
			}
		});
		(chronics || []).forEach(chronic => this.addInjury(chronic, true));
		this.setup();
	}

	private setup() {
		const zonesArray: any = Object.values(this.zones);
		this.frontPoints = zonesArray
			// .filter(x => x.status === 'STATUS_INJURY')
			.map(z => z.toPoint(singlePoints.front))
			.filter(z => z && z.value);
		this.backPoints = zonesArray
			// .filter(x => x.status === 'STATUS_INJURY')
			.map(z => z.toPoint(singlePoints.back))
			.filter(z => z && z.value);
		this.style = this.domSanitizer.bypassSecurityTrustHtml(computeStyle(this.uuid, zonesArray));
	}

	private addInjury(injury, isChronic: boolean) {
		if (injury?.location) {
			let zone = this.zones[injury.location];
			if (this.hidePast && isInjuryArchived(injury.endDate)) return;
			if (zone) {
				const tempZone = cloneDeep(zone);
				zone.addInjury(injury, isChronic);
				if (
					tempZone.status !== STATUS_SORENESS &&
					zone.injuries.filter(({ issue }) => issue === ISSUE_SORENESS).length > 0
				) {
					zone.updateSorenessStatusColor(tempZone.status);
				}
			} else {
				injury = convertInjuryFields(injury);
				zone = new InjuryZone(injury.location);
				zone.translate = this.translate;
				this.zones[injury.location] = zone;
				zone.addInjury(injury, isChronic, this.hidePast);
			}
			this.injuries.push(injury);
		}
	}

	togglePointMode() {
		this.pointsMode = !this.pointsMode;
	}

	getCurrentStyle(id = null) {
		const zonesArray: any = Object.values(this.zones);
		return computeStyle(id || this.uuid, zonesArray);
	}

	getZone(id) {
		return this.zones[`medical.infirmary.details.location.${id}`];
	}

	zoneClicked(pos, zone) {
		const selectedLocation = `medical.infirmary.details.location.${zone}`;
		const found = this.injuries.find(({ location }) => location === selectedLocation);
		if (!found) {
			this.injuries.push({
				location: selectedLocation,
				issue: 'medical.infirmary.details.issue.injury',
				currentStatus: 'medical.infirmary.details.statusList.rehab'
			} as any);
		} else {
			this.injuries = this.injuries.filter(({ location }) => location !== found.location);
		}
		this.zones = {};
		this.initInjuries(this.injuries);
	}

	zoneIn(pos, zone) {
		// console.warn('zone', zone, pos);
		// console.warn('fullPoints', fullPoints[pos][zone]);

		if (fullPoints[pos][zone]) {
			const injuryZone = this.getZone(zone);
			if (injuryZone) {
				// console.warn('injuryZone', injuryZone);

				const label = this.pointsMode ? injuryZone.pointsLabel : injuryZone.label;
				if (label) {
					// console.warn('label', label);
					this.tooltips[pos] = {
						id: zone,
						position: fullPoints[pos][zone],
						label
					};
				}
			}
		}
	}

	zoneOut(pos, zone) {
		if (fullPoints[pos][zone] && this.tooltips[pos] && this.tooltips[pos].id === zone) {
			this.tooltips = Object.assign({}, this.tooltips, {
				[pos]: null
			});
		}
	}

	resetAllData() {
		this.zones = {};
		this.injuries = [];
		this.chronic = [];
		this.setup();
	}

	setLegendConfiguration() {
		this.legendConfiguration = this.getLegendConfiguration();
	}

	getLegendConfiguration(): BodyLegendConfiguration[] {
		const basicSoreness = this.translate.instant('medical.infirmary.details.issue.soreness');
		return [
			{ label: this.translate.instant('general'), patternClass: 'legend-general' },
			{
				label: this.translate.instant('medical.infirmary.details.issue.activeInjury'),
				background: fillColors[STATUS_INJURY]
			},
			{
				label: this.translate.instant('medical.infirmary.details.issue.complaint'),
				background: fillColors[STATUS_COMPLAINT]
			},
			{
				label: this.translate.instant('chronicInjuries.chronicIssue'),
				background: fillColors[STATUS_CHRONIC]
			},
			{
				label: this.translate.instant('Closed'),
				background: fillColors[STATUS_CLOSED]
			},
			{
				label: basicSoreness,
				patternClass: 'sorenessPattern'
			},
			{
				label: basicSoreness + ' - ' + this.translate.instant('medical.infirmary.details.issue.activeInjury'),
				patternClass: 'sorenessInjuryPattern'
			},
			{
				label: basicSoreness + ' - ' + this.translate.instant('medical.infirmary.details.issue.complaint'),
				patternClass: 'sorenessComplaintPattern'
			},
			{
				label: basicSoreness + ' - ' + this.translate.instant('chronicInjuries.chronicIssue'),
				patternClass: 'sorenessChronicPattern'
			},
			{
				label: basicSoreness + ' - ' + this.translate.instant('Closed'),
				patternClass: 'sorenessClosedPattern'
			}
		];
	}

	private getPatternClassFromZone(zone): string {
		// Input: url(#sorenessPattern) --> Output sorenessPattern
		return zone.color.split('(#')[1].split(')')[0];
	}

	openLegend(event) {
		this.setLegendConfiguration();
		this.overlayPanel.toggle(event);
	}
}

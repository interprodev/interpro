import { Component, Input, ViewChild } from '@angular/core';
import { ReadinessPlayerData, TestInstancePlayerData } from '@iterpro/shared/data-access/sdk';
import { ReadinessService, ReportService, getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';

@UntilDestroy()
@Component({
	selector: 'iterpro-readiness-session',
	templateUrl: './readiness-session.component.html',
	styleUrls: ['./readiness-session.component.css']
})
export class ReadinessSessionComponent {
	@Input() playerData: ReadinessPlayerData;
	@Input() wellnessEnabled: boolean;
	@ViewChild('bodyChart', { static: false }) bodyChart: any;

	wellbeingKeys: Array<{ label: string; key: string }> = [
		{ label: 'wellness.sleep', key: 'sleep' },
		{ label: 'wellness.sleepDuration', key: 'sleep_duration' },
		{ label: 'wellness.sleepTimeWithoutHours', key: 'sleep_start' },
		{ label: 'wellness.wakeUpTime', key: 'sleep_end' },
		{ label: 'wellness.stress', key: 'stress' },
		{ label: 'wellness.fatigue', key: 'fatigue' },
		{ label: 'wellness.soreness', key: 'soreness' },
		{ label: 'wellness.sorenessLocation', key: 'locations' },
		{ label: 'wellness.mood', key: 'mood' }
	];

	constructor(
		private readonly translate: TranslateService,
		private readonly reportService: ReportService,
		private readonly readinessService: ReadinessService
	) {}

	downloadPDF() {
		const data = {
			player: this.playerData.displayName,
			image: this.playerData.downloadUrl,
			bodyChartStyle: this.bodyChart.getCurrentStyle('report'),
			date: {
				label: this.translate.instant('sidebar.date'),
				value: moment(this.playerData.date).format(getMomentFormatFromStorage())
			},
			type: {
				label: this.translate.instant('sidebar.type'),
				value: this.readinessService.getDateFormat(this.playerData.date)
			},
			goScore: {
				today: {
					value: this.playerData.goscore.today.value,
					color: this.playerData.goscore.today.color
				},
				last48h: {
					label: this.translate.instant('readiness.last48h'),
					value: this.playerData.goscore.last48h.value,
					increment: this.playerData.goscore.last48h.increment,
					color: this.playerData.goscore.last48h.color
				},
				last7d: {
					label: this.translate.instant('readiness.last7d'),
					value: this.playerData.goscore.last7d.value,
					increment: this.playerData.goscore.last7d.increment,
					color: this.playerData.goscore.last7d.color
				},
				injuryRisk: {
					label: this.translate.instant('readiness.injuryRisk'),
					value: this.playerData.goscore.injuryRisk,
					color: this.playerData.goscore.today.color
				}
			},
			healthStatus: {
				label: this.translate.instant('readiness.healthStatus'),
				values: [
					...this.playerData.healthStatus.injuries.map(injury => ({
						label: this.translate.instant(injury.issue || '-'),
						value: this.translate.instant(injury.location || '-'),
						color: 'null'
					})),
					{
						label: this.translate.instant('readiness.healthStatus.availability'),
						value: this.translate.instant(this.playerData.healthStatus.available || '-'),
						color: this.playerData.healthStatus.color
					}
				]
			},
			wellbeing: {
				label: this.translate.instant('goScore.wellbeing'),
				values: this.wellbeingKeys.map(item => {
					if (this.isStandardField(item.key))
						return {
							label: this.translate.instant(item.label),
							value: this.playerData.wellness[item.key]?.value,
							increment48h: this.playerData.wellness[item.key]?.increment
						};
					if (this.isSleepField(item.key) || this.isLocationField(item.key))
						return {
							label: this.translate.instant(item.label),
							value: this.playerData.wellness[item.key]
						};
				})
			},
			readiness: {
				label: this.translate.instant('navigator.readiness'),
				values: this.playerData.readiness.map((item: TestInstancePlayerData) => ({
					test: this.translate.instant(item.test),
					label: this.translate.instant(item.label),
					value: item.value,
					increment48h: item.increment
				}))
			}
		};
		if (this.playerData.healthStatus.available === 'no') {
			data.healthStatus.values.push({
				label: this.translate.instant('readiness.healthStatus.expectation'),
				value: this.playerData.healthStatus.expectation,
				color: null
			});
		}

		this.reportService
			.getImage(data.image)
			.pipe(untilDestroyed(this))
			.subscribe(image => {
				this.reportService.getReport(
					'readiness_details',
					{ ...data, image },
					'',
					null,
					`Readiness - ${this.playerData.displayName} - ${moment(this.playerData.date).format(
						getMomentFormatFromStorage()
					)}`
				);
			});
	}

	getSorenessLocations(locations: string[]): string {
		return (locations || [])
			.map(location =>
				this.translate.instant(
					location === 'general' || location === 'none' ? location : `medical.infirmary.details.location.${location}`
				)
			)
			.join(', ');
	}

	getLocationsNumberString(n: number): string {
		return `(${n} ${this.translate.instant(
			n !== 1 ? 'medical.infirmary.details.locations' : 'medical.infirmary.details.location'
		)})`;
	}

	isStandardField(key: string): boolean {
		return key !== 'sleep_start' && key !== 'sleep_end' && key !== 'sleep_duration' && key !== 'locations';
	}

	isLocationField(key: string): boolean {
		return key === 'locations';
	}

	isSleepField(key: string): boolean {
		return key === 'sleep_start' || key === 'sleep_end' || key === 'sleep_duration';
	}
}

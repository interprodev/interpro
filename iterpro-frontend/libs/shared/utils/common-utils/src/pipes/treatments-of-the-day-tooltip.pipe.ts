import { Pipe, PipeTransform } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { TreatmentMetric } from '@iterpro/shared/data-access/sdk';
import { CustomTreatmentService, getMedicationName } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { isArray } from 'lodash';
import * as moment from 'moment';

@Pipe({
	name: 'treatmentsOfTheDayTooltip'
})
export class TreatmentsOfTheDayTooltipPipe implements PipeTransform {
	private defaultMetrics: TreatmentMetric[];
	private customMetrics: TreatmentMetric[];

	constructor(
		private translate: TranslateService,
		private currentTeamService: CurrentTeamService,
		private customTreatmentService: CustomTreatmentService
	) {
		const { treatmentMetrics } = this.currentTeamService.getCurrentTeam();
		const { defaultMetrics, customMetrics } =
			!treatmentMetrics || treatmentMetrics.length === 0
				? this.scaffoldTreatmentMetrics()
				: this.parseTreatmentMetrics(treatmentMetrics);

		this.defaultMetrics = defaultMetrics;
		this.customMetrics = customMetrics;
	}

	private scaffoldTreatmentMetrics() {
		return { defaultMetrics: this.customTreatmentService.defaultTreatments(), customMetrics: [] };
	}

	private parseTreatmentMetrics(treatmentMetrics: TreatmentMetric[]) {
		const defaultMetrics: TreatmentMetric[] = [];
		const customMetrics: TreatmentMetric[] = [];

		const secMetrics: TreatmentMetric[] = treatmentMetrics.filter(
			(treatment: TreatmentMetric) => treatment.type === 'sec'
		);
		const physiotherapyMetrics: TreatmentMetric[] = treatmentMetrics.filter(
			(treatment: TreatmentMetric) => treatment.type === 'physiotherapy'
		);

		physiotherapyMetrics.forEach(
			metric => void (!metric.custom ? defaultMetrics.push(metric) : customMetrics.push(metric))
		);
		secMetrics.forEach(metric => void (!metric.custom ? defaultMetrics.push(metric) : customMetrics.push(metric)));
		return { defaultMetrics, customMetrics };
	}

	transform(treatments: any[] = []) {
		return treatments
			.map(({ category, treatment, exam, injuryId, date, description }) => {
				if (exam) return moment(date).format('HH:mm') + ' - ' + exam;
				const type = injuryId
					? this.translate.instant('medical.infirmary.details.issue.injury')
					: this.translate.instant('prevention.treatments.prescription');
				const treatmentDetail = treatment ? this.getTreatmentDetail(treatment, category) : '';
				return (
					type +
					': ' +
					moment(date).format('HH:mm') +
					(treatmentDetail.length ? ' - ' + treatmentDetail : '') +
					(description ? ' - ' + description : '')
				);
			})
			.join('\n\n');
	}
	private getTreatmentDetail(treatment: any, category: string) {
		if (category === 'medicationSupplements') {
			return getMedicationName(isArray(treatment) ? treatment[0] : treatment, this.currentTeamService.getCurrentTeam());
		}
		try {
			if (!!treatment && treatment.length > 0) {
				return treatment
					.map((tr: string) =>
						tr
							? !this.defaultMetrics.some(metric => tr === metric.category)
								? this.getLabel(this.customMetrics, tr, tr)
								: this.translate.instant(`medical.prevention.treatments.${category.toLowerCase()}.${tr}`)
							: ''
					)
					.join(', ');
			}
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error(category, treatment, e);
		}
		return '';
	}

	private getLabel(items: TreatmentMetric[] = [], itemValue: string, empty = '-') {
		const field = items.find(({ value }) => value === itemValue);
		return field && field.label ? field.label : empty;
	}
}

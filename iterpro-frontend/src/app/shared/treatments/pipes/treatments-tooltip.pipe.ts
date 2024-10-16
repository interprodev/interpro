import { Pipe, PipeTransform } from '@angular/core';
import { MedicalTreatment, TreatmentMetric, TreatmentMetricType } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import * as TrtUtilsService from '../utils/treatment-table-utils';
@Pipe({
	name: 'treatmentsTooltip'
})
export class TreatmentsTooltipPipe implements PipeTransform {
	constructor(private readonly translate: TranslateService) {}

	transform(treatmentItem: MedicalTreatment, metrics: TreatmentMetric[]): string {
		// metrics can be SecMetrics ot PhysioterapyMetrics
		return this.getTreatmentTooltip(treatmentItem, metrics);
	}

	getTreatmentTooltip(treatmentItem: MedicalTreatment, metrics: TreatmentMetric[] = []): string {
		const trtType: TreatmentMetricType = treatmentItem?.treatmentType?.toLowerCase() as TreatmentMetricType;
		const defaultMetrics = [];
		const customMetrics = [];
		metrics.forEach((metric: TreatmentMetric) =>
			!metric.custom ? defaultMetrics.push(metric) : customMetrics.push(metric)
		);
		return (treatmentItem.treatment || [])
			.map((treatment: string) => {
				const keyLabel =
					(treatmentItem.treatmentType.toLowerCase() as TreatmentMetricType) === 'physiotherapy'
						? this.translate.instant(`medical.prevention.treatments.physiotherapy.options.${treatment}`)
						: this.translate.instant(`medical.prevention.treatments.${trtType}.${treatment}`);
				return treatment
					? !defaultMetrics.some(({ value }) => treatment === value)
						? TrtUtilsService.getLabel(customMetrics, treatment, treatment)
						: this.translate.instant(keyLabel)
					: '';
			})
			.join(', ');
	}
}

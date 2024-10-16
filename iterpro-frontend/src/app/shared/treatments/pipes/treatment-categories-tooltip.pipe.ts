import { Pipe, PipeTransform } from '@angular/core';
import { TreatmentMetric } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import * as TrtUtilsService from '../utils/treatment-table-utils';

@Pipe({
	name: 'treatmentCategoriesTooltip'
})
export class TreatmentCategoriesTooltipPipe implements PipeTransform {
	constructor(private readonly translate: TranslateService) {}

	transform(categories: string[], physiotherapyMetrics: TreatmentMetric[]): string {
		return this.getCategoryTooltip(categories, physiotherapyMetrics);
	}

	private getCategoryTooltip(categories: string[], physiotherapyMetrics: TreatmentMetric[] = []): string {
		const defaultMetrics = [];
		const customMetrics = [];
		physiotherapyMetrics.forEach((metric: TreatmentMetric) =>
			!metric.custom ? defaultMetrics.push(metric) : customMetrics.push(metric)
		);
		return (categories || [])
			.map((category: string) =>
				category
					? !defaultMetrics.some(({ value }) => category === value)
						? this.translate.instant(
								`medical.prevention.treatments.physiotherapy.${TrtUtilsService.getLabel(
									customMetrics,
									category,
									category
								)}`
						  )
						: this.translate.instant(`medical.prevention.treatments.physiotherapy.options.${category}`)
					: ''
			)
			.join(', ');
	}
}

import { Injectable } from '@angular/core';
import { MEDICAL_FIELDS, TreatmentMetric } from '@iterpro/shared/data-access/sdk';
import { SelectItem } from 'primeng/api';

@Injectable()
export class CustomTreatmentService {
	defaultTreatments(): TreatmentMetric[] {
		const { SeC, physiotherapy, ...physiotherapyCategories } = MEDICAL_FIELDS;
		const parsedTreatments: TreatmentMetric[] = [];
		SeC.forEach((treatment: any) => {
			parsedTreatments.push({
				value: treatment.value,
				label: treatment.label,
				custom: false,
				active: true,
				type: 'sec',
				category: 'sec',
				description: '',
				protocol: ''
			});
		});
		const categories = Object.keys(physiotherapyCategories);
		categories.forEach(category => {
			(physiotherapyCategories as any)[category].forEach((treatment: SelectItem) => {
				parsedTreatments.push({
					value: treatment.value,
					label: treatment.label as string,
					custom: false,
					active: true,
					type: 'physiotherapy',
					category,
					description: '',
					protocol: ''
				});
			});
		});
		return parsedTreatments;
	}
}

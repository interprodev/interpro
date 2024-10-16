import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'treatmentTypeLabel'
})
export class TreatmentTypeLabelPipe implements PipeTransform {
	transform(type: 'physiotherapy' | 'medicationSupplements' | 'SeC'): string {
		if (!type) return null;
		switch (type) {
			case 'physiotherapy':
				return 'prevention.treatments.physiotherapy';
			case 'medicationSupplements':
				return 'prevention.treatments.medicationSupplements';
			case 'SeC':
				return 'prevention.treatments.sec';
			default:
				console.warn('TreatmentTypeLabelPipe: unknown type', type);
				return null;
		}
	}
}

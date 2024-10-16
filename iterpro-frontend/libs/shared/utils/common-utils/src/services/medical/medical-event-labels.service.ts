import { Injectable } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	InjuryExam,
	MedicalFieldType,
	MedicalTreatment,
	PreventionExam,
	TreatmentMetric
} from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import { getMedicationName } from '../../utils/functions/medical/medication.functions';
import { CustomTreatmentService } from './custom-treatment.service';

@Injectable()
export class MedicalEventLabelsService {
	constructor(
		private currentTeamService: CurrentTeamService,
		private customTreatmentService: CustomTreatmentService,
		private translate: TranslateService
	) {}

	private getTreatmentTypeField(medicalType: MedicalFieldType): 'treatmentType' | 'category' {
		return medicalType === 'exam' ? 'category' : 'treatmentType';
	}

	getTreatmentType(medicalType: MedicalFieldType, element: any): string {
		const field = this.getTreatmentTypeField(medicalType);
		return element[field]
			? this.translate.instant(`prevention.treatments.${element[field] === 'SeC' ? 'sec' : element[field]}`)
			: '';
	}

	getTreatmentCategory(row: any, type: MedicalFieldType): string {
		if (!row) return '';
		if (type === 'exam') return (row as InjuryExam | PreventionExam).description;
		const medicalTreatment = row as MedicalTreatment;
		if (medicalTreatment.treatmentType === 'SeC') {
			return ``;
		} else if (medicalTreatment.treatmentType === 'medicationSupplements') {
			return medicalTreatment.drugDose;
		} else {
			if (Array.isArray(medicalTreatment.category)) {
				return medicalTreatment.category
					.map((item: string) =>
						item ? this.translate.instant(`medical.prevention.treatments.physiotherapy.${item}`) : ''
					)
					.join(', ');
			}
			return this.translate.instant(`medical.prevention.treatments.physiotherapy.${medicalTreatment.category}`);
		}
	}

	getTreatmentName(rowData: any, type: MedicalFieldType): string {
		if (!rowData) return '';
		if (type === 'exam') {
			return (rowData as InjuryExam | PreventionExam)?.exam;
		}
		const medicalTreatment = rowData as MedicalTreatment;
		const defaultMetrics: any[] = [];
		const customMetrics: any[] = [];
		let { treatmentMetrics } = this.currentTeamService.getCurrentTeam();
		if (!treatmentMetrics || treatmentMetrics.length === 0) {
			treatmentMetrics = this.customTreatmentService.defaultTreatments();
		}
		treatmentMetrics
			.filter((treatment: TreatmentMetric) => treatment.type === 'sec')
			.forEach((metric: TreatmentMetric) =>
				!metric.custom ? defaultMetrics.push(metric) : customMetrics.push(metric)
			);
		treatmentMetrics
			.filter((treatment: TreatmentMetric) => treatment.type === 'physiotherapy')
			.forEach((metric: TreatmentMetric) =>
				!metric.custom ? defaultMetrics.push(metric) : customMetrics.push(metric)
			);
		if (medicalTreatment.treatmentType === 'medicationSupplements') {
			return getMedicationName(medicalTreatment.drug, this.currentTeamService.getCurrentTeam());
		} else if (!!medicalTreatment.treatment && medicalTreatment.treatment.length > 0) {
			return medicalTreatment.treatment
				.map((treatment: string) => {
					if (!treatment) return '';
					return !defaultMetrics.some(
						({ treatmentType, value }) =>
							(medicalTreatment.treatmentType === 'SeC' && treatment === value) || treatment === treatmentType
					)
						? this.getTreatmentLabel(customMetrics, treatment, treatment)
						: this.translate.instant(
								`medical.prevention.treatments.${medicalTreatment.treatmentType.toLowerCase()}.${treatment}`
						  );
				})
				.join(', ');
		}
		return '';
	}

	private getTreatmentLabel(items: any[], value: any, empty = '-'): string {
		if (!items) return empty;
		const field = items.find(f => f.value === value);
		if (field && field.label) return field.label;
		return empty;
	}
}

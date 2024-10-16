import { Attachment, Customer, Injury, MedicalTreatment, Team, TreatmentMetric } from '@iterpro/shared/data-access/sdk';
import {
	getMomentFormatFromStorage,
	parseHtmlStringToText
} from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { TreatmentType } from '../interfaces/treatment-table.interface';
import { TreatmentsTooltipPipe } from '../pipes/treatments-tooltip.pipe';
import { TreatmentCategoriesTooltipPipe } from '../pipes/treatment-categories-tooltip.pipe';
import { CustomerNamePipe, SelectItemLabelPipe } from '@iterpro/shared/ui/pipes';
import { MedicationLabelPipe } from '../pipes/medication-label.pipe';
import { TreatmentCompletePipe } from '../pipes/treatment-complete.pipe';

export function getLabel(items: SelectItem<MedicalTreatment>[], itemValue, empty = '-'): string {
	if (!items) return empty;
	const field = items.find(({ value }) => value === itemValue);
	if (field && field.label) return field.label;
	return empty;
}


export function sortByPinned(treatments: TreatmentMetric[], pinnedTreatments: string[]): TreatmentMetric[] {
	return (treatments || []).sort((a, b) => {
		if (pinnedTreatments && pinnedTreatments.includes(a.value) && pinnedTreatments.includes(b.value)) {
			return 0;
		}
		if (pinnedTreatments && pinnedTreatments.includes(a.value)) {
			return -1;
		}
		if (pinnedTreatments && pinnedTreatments.includes(b.value)) {
			return 1;
		}
	});
}

export function getTime(event: Date): string {
	return moment(event).format('HH:mm');
}

export function getCompleteStyle(rowData: MedicalTreatment): {
	class: string;
	color: string;
	label: 'Not complete' | 'Pending' | 'Complete';
} {
	if (moment(rowData.date).isBefore(moment())) {
		if (!rowData.complete) return { class: 'fa-times', color: 'red', label: 'Not complete' };
		else return { class: 'fa-check', color: 'green', label: 'Complete' };
	} else {
		if (!rowData.complete) return { class: 'fa-clock', color: 'unset', label: 'Pending' };
		else return { class: 'fa-check', color: 'green', label: 'Complete' };
	}
}

export function getCompleteTitle(rowData: MedicalTreatment): 'Not complete' | 'Pending' | 'Complete' {
	return getCompleteStyle(rowData).label;
}

export function getAttachmentToUpload(
	url: string,
	publicId: string,
	originalFilename: string,
	authorId: string,
	date: Date
): Attachment {
	return new Attachment({
		name: originalFilename,
		url: publicId,
		downloadUrl: url,
		date: date,
		authorId: authorId
	});
}

export function getInjuryList(injuries: Injury[], translate, bindById = true): SelectItem[] {
	return (injuries || []).map(injury => {
		const location = injury?.location ? translate.instant(injury.location) : '';
		return {
			label: `${moment(injury.date).format(getMomentFormatFromStorage())} - ${location}${
				injury.osics ? ` - ${injury.osics}` : ``
			}`,
			value: bindById ? injury.id : injury
		};
	});
}

export function completeWithMissingFields(instance: TreatmentType): TreatmentType {
	// As 'Description' is array type, for medical section the dose or description is taken as input text/string type from UI and this need to be converted into single valued array to save.
	if (instance && instance.category === 'medicationSupplements') {
		if (!Array.isArray(instance.description)) instance.description = [instance.description];
	}
	return instance;
}

export function hasMissingRequiredFields(instance: MedicalTreatment, notificationService): boolean {
	if (!instance.date || !instance.treatmentType) {
		notificationService.notify('warn', 'medical.prevention.treatment', 'alert.treatment.required.fields', false);
		return true;
	}
	return false;
}

export function hasUnsavedChanges(
	tempTreatment: MedicalTreatment,
	currentTreatment: MedicalTreatment,
	notificationService
): boolean {
	if (JSON.stringify(tempTreatment) !== JSON.stringify(currentTreatment)) {
		notificationService.notify('warn', 'medical.prevention.treatment', 'You have unsaved changes', false);
		return true;
	}
	return false;
}

//region PDF report
export function getSecHeadersForPDF(t): string[] {
	return [
		t('prevention.treatments.data'),
		t('prevention.treatments.time'),
		t('prevention.treatments.treatment'),
		t('prevention.treatments.prescription'),
		t('prevention.treatments.author'),
		t('prevention.treatments.location'),
		t('prevention.treatments.note'),
		t('prevention.treatments.complete')
	];
}

export function getSecValuesForPDF(
	t,
	treatmentsTooltipPipe: TreatmentsTooltipPipe,
	customerNamePipe: CustomerNamePipe,
	selectItemLabelPipe: SelectItemLabelPipe,
	treatmentCompletePipe: TreatmentCompletePipe,
	secItems: TreatmentType[],
	locationOptions: SelectItem[],
	secMetrics: TreatmentMetric[],
	customers: Customer[]
): string[][] {
	return secItems.map((treatment: MedicalTreatment) => [
		moment(treatment.date).format(getMomentFormatFromStorage()),
		getTime(treatment.date),
		treatmentsTooltipPipe.transform(treatment, secMetrics),
		customerNamePipe.transform(treatment.prescriptor, customers),
		customerNamePipe.transform(treatment.author, customers),
		!treatment.location ? '' : t(selectItemLabelPipe.transform(treatment.location, locationOptions)),
		parseHtmlStringToText(treatment.notes),
		t(treatmentCompletePipe.transform(treatment).label)
	]);
}

export function getMedSuppHeadersForPDF(t): string[] {
	return [
		t('prevention.treatments.data'),
		t('prevention.treatments.time'),
		t('prevention.treatments.drug'),
		t('prevention.treatments.dose'),
		t('prevention.treatments.prescription'),
		t('prevention.treatments.author'),
		t('prevention.treatments.location'),
		t('prevention.treatments.note'),
		t('prevention.treatments.complete')
	];
}

export function getMedSuppValuesForPDF(
	t,
	medicationLabelPipe: MedicationLabelPipe,
	customerNamePipe: CustomerNamePipe,
	selectItemLabelPipe: SelectItemLabelPipe,
	treatmentCompletePipe: TreatmentCompletePipe,
	team: Team,
	medItems: TreatmentType[],
	locationOptions: SelectItem[],
	customers: Customer[]
): string[][] {
	return medItems.map((treatment: MedicalTreatment) => [
		moment(treatment.date).format(getMomentFormatFromStorage()),
		getTime(treatment.date),
		medicationLabelPipe.transform(treatment.drug, team),
		treatment.drugDose,
		customerNamePipe.transform(treatment.prescriptor, customers),
		customerNamePipe.transform(treatment.author, customers),
		!treatment.location ? '' : t(selectItemLabelPipe.transform(treatment.location, locationOptions)),
		parseHtmlStringToText(treatment.notes),
		t(treatmentCompletePipe.transform(treatment).label)
	]);
}

export function getPhyHeadersForPDF(t): string[] {
	return [
		t('prevention.treatments.data'),
		t('prevention.treatments.time'),
		t('medical.infirmary.details.category'),
		t('prevention.treatments.treatment'),
		t('prevention.treatments.prescription'),
		t('prevention.treatments.author'),
		t('prevention.treatments.location'),
		t('prevention.treatments.type'),
		t('prevention.treatments.note'),
		t('prevention.treatments.complete')
	];
}

export function getPhyValuesForPDF(
	t,
	treatmentsTooltipPipe: TreatmentsTooltipPipe,
	treatmentCategoriesTooltipPipe: TreatmentCategoriesTooltipPipe,
	customerNamePipe: CustomerNamePipe,
	selectItemLabelPipe: SelectItemLabelPipe,
	treatmentCompletePipe: TreatmentCompletePipe,
	phyItems: TreatmentType[],
	physioMetrics: TreatmentMetric[],
	locationOptions: SelectItem[],
	typeOptions: SelectItem[],
	customers: Customer[]
): string[][] {
	return phyItems.map((treatment: TreatmentType) => [
		moment(treatment.date).format(getMomentFormatFromStorage()),
		getTime(treatment.date),
		treatmentCategoriesTooltipPipe.transform(treatment.category, physioMetrics),
		treatmentsTooltipPipe.transform(treatment, physioMetrics),
		customerNamePipe.transform(treatment.prescriptor, customers),
		customerNamePipe.transform(treatment.author, customers),
		!treatment.location ? '' : t(selectItemLabelPipe.transform(treatment.location, locationOptions)),
		!treatment.injuryType ? '' : t(selectItemLabelPipe.transform(treatment.injuryType, typeOptions)),
		parseHtmlStringToText(treatment.notes),
		t(treatmentCompletePipe.transform(treatment).label)
	]);
}

export function getCustomerName(item: string, customers: Customer[]): string {
	// item can be customer id or customer name
	const customer = (customers || []).find(({ id }) => id === item);
	return customer ? `${customer.firstName} ${customer.lastName}` : item;
}
//endregion

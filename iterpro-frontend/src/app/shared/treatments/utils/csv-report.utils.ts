import { Team } from '@iterpro/shared/data-access/sdk';
import {
	getMedicationName,
	getMomentFormatFromStorage,
	parseHtmlStringToText
} from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment/moment';
import { TreatmentType } from '../interfaces/treatment-table.interface';
import { getCompleteTitle, getLabel, getTime } from './treatment-table-utils';

export function getReportCSV(
	isFromInjurySection: boolean,
	translate,
	secOptions,
	physioOptions,
	locationOptions,
	typeOptions,
	currentTeam: Team,
	injury,
	treatmentsRows
) {
	const t = translate.instant.bind(translate);

	const injuryTreatmentHeaders = [
		t('prevention.treatments.data'),
		t('prevention.treatments.time'),
		t('prevention.treatments.type'),
		t('prevention.treatments.treatment'),
		t('prevention.treatments.description'),
		t('prevention.treatments.prescription'),
		t('prevention.treatments.author'),
		t('prevention.treatments.location'),
		t('prevention.treatments.type'),
		t('prevention.treatments.complete')
	];

	const preventionTreatmentHeaders = [
		t('prevention.treatments.data'),
		t('prevention.treatments.time'),
		t('prevention.treatments.type'),
		t('prevention.treatments.treatment'),
		t('prevention.treatments.description'),
		t('prevention.treatments.prescription'),
		t('prevention.treatments.author'),
		t('prevention.treatments.location'),
		t('prevention.treatments.type'),
		t('prevention.treatments.note'),
		t('prevention.treatments.complete')
	];

	const headers = isFromInjurySection ? injuryTreatmentHeaders : preventionTreatmentHeaders;
	const getTreatment = treatment => {
		switch (treatment.treatmentType) {
			case 'SeC':
				return (treatment.treatment || []).map(v => getLabel(secOptions, v)).join(', ');
			case 'physiotherapy':
				return (treatment.treatment || []).map(v => getLabel(physioOptions, v)).join(', ');
			case 'medicationSupplements':
				return getMedicationName(treatment.treatment, currentTeam);
			default:
				return '';
		}
	};

	const getDescription = (treatment: TreatmentType) => {
		switch (treatment.treatmentType) {
			case 'physiotherapy':
				// @ts-ignore
				return t(getLabel(treatment.filteredPhysioTreatmentOptions || [], treatment.description));
			default:
				return treatment.description;
		}
	};

	const getCategory = (treatment: TreatmentType) => {
		switch (treatment.treatmentType) {
			case 'SeC':
				return t('prevention.treatments.sec');
			case 'physiotherapy':
				return t('prevention.treatments.physiotherapy');
			case 'medicationSupplements':
				return t('prevention.treatments.medicationSupplements');
			default:
				return '';
		}
	};
	const getInjuryTreatmentRows = treatments => {
		return treatments.map(treatment => [
			moment(treatment.date).format(getMomentFormatFromStorage()),
			getTime(treatment.date),
			getCategory(treatment),
			getTreatment(treatment),
			getDescription(treatment),
			treatment.prescriptor,
			treatment.author,
			t(getLabel(locationOptions, injury.location, ' ')),
			t(getLabel(typeOptions, injury.type, ' ')),
			getCompleteTitle(treatment)
		]);
	};

	const getPreventionTreatmentRows = treatments => {
		return treatments.map(treatment => [
			moment(treatment.date).format(getMomentFormatFromStorage()),
			getTime(treatment.date),
			getCategory(treatment),
			getTreatment(treatment),
			getDescription(treatment),
			treatment.prescriptor,
			treatment.author,
			t(getLabel(locationOptions, treatment.location, ' ')),
			t(getLabel(typeOptions, treatment.type, ' ')),
			parseHtmlStringToText(treatment.notes),
			getCompleteTitle(treatment)
		]);
	};

	const categories = ['SeC', 'physiotherapy', 'medicationSupplements'];
	const treatments = treatmentsRows
		.filter(treatment => categories.includes(treatment.treatmentType))
		.sort((a, b) => b.date - a.date);

	const rows = isFromInjurySection ? getInjuryTreatmentRows(treatments) : getPreventionTreatmentRows(treatments);

	return [headers, ...rows];
}

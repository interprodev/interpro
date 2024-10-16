import { SelectItem } from 'primeng/api';
import { MEDICAL_FIELDS } from './medical-fields';

const defaultMedical = MEDICAL_FIELDS;

export const MEDICAL_TREATMENTS = {
	...defaultMedical,
	SeC: defaultMedical.SeC.filter((item: SelectItem) => item.value !== 'cod')
};

import { FormControl } from '@angular/forms';
import { Attachment, TreatmentMetricType } from '@iterpro/shared/data-access/sdk';

export interface TreatmentMetricForm {
	value: FormControl<string>;
	label: FormControl<string>;
	type: FormControl<TreatmentMetricType>;
	category: FormControl<string>;
	description: FormControl<string>;
	video: FormControl<Attachment>;
	doc: FormControl<Attachment>;
}

export interface TreatmentMetricBlackList  {value: string, category: string, type: string}[];

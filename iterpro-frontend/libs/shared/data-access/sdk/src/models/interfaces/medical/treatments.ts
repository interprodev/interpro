import { Attachment } from '../../../lib';

export type TreatmentMetricType = 'sec' | 'physiotherapy';
export interface TreatmentMetric {
	id?: string;
	value: string;
	label: string;
	custom: boolean;
	active: boolean;
	type: TreatmentMetricType;
	category?: string;
	description?: string;
	protocol?: string;
	video?: Attachment;
	doc?: Attachment;
}

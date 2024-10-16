import { AttributeCategory } from '@iterpro/shared/data-access/sdk';

export interface CustomMetric {
	active: boolean;
	custom: boolean;
	label: string;
	value: string;
	// only for technical goals
	category?: AttributeCategory;
	description?: string;
}

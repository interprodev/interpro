import { PropertySchema } from '@iterpro/shared/data-access/sdk';

export interface CustomReportDataChangeOutput {
	sectionId: string;
	propertyName: string;
	eventValue: any;
}

export interface CustomReportCommentChangeOutput {
	sectionId: string;
	property: PropertySchema;
}

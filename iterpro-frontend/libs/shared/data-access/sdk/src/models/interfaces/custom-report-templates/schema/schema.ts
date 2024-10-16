import { SelectItem } from 'primeng/api';
import { Color } from './color';
import { Metadata } from './json-schema';

export interface Schema {
	title: string;
	version?: string | number;
	id?: string;
	sections: SectionSchema[];
}

export interface SectionSchema {
	id: string;
	title: string;
	properties: PropertySchema[];
	metadata: Metadata;
}

export interface PropertySchema {
	name: string;
	type: PropertyType;
	label: string;
	description: string;
	range: [number, number] | [null, null];
	fields: string[];
	enum: string[];
	operation: OperationSchema;
	colorMapping: ColorMappingSchema[];
	hasComment: boolean;
	options?: SelectItem[];
}

export interface OperationSchema {
	name: OperationType;
	parameters: string[];
}

export interface ColorMappingSchema {
	color: Color;
	min: number;
	max: number;
	values: number[] | string[];
	label: string;
}

export type OperationType = 'sum' | 'average' | 'occurrence' | '';

export type PropertyType = 'int16' | 'float32' | 'string' | 'boolean' | 'enum' | 'Function';

export type StyleResult = { color?: string; label?: string; value?: string };

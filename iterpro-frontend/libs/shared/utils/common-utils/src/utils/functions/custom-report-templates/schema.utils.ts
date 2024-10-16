import { Color, OperationSchema, PropertySchema, StyleResult } from '@iterpro/shared/data-access/sdk';
import { mean, pick } from 'lodash';
import { SelectItem } from 'primeng/api';

export function getOptionsByType(property: PropertySchema): SelectItem[] {
	switch (property.type) {
		case 'int16':
			return getIntOptions((property.range || []) as number[]);
		case 'float32':
			return getFloatOptions((property.range || []) as number[]);
		case 'string':
			return getStringOptions(property.fields || []);
		default:
			console.log('No options for type', property.type);
			return [];
	}
}

function getIntOptions(range: number[]): SelectItem[] {
	return Array(range[1] - range[0] + 1)
		.fill(range[0] || 0)
		.map((x, y) => x + y)
		.map(num => ({ label: num, value: num }));
}

function getFloatOptions(range: number[]): SelectItem[] {
	const inital = range[1] && range[0] ? range[1] - range[0] : 0;
	return Array(Math.ceil(inital / 0.5 + 0.5))
		.fill(range[0] || 0)
		.map((x, y) => x + y * 0.5)
		.map(num => ({ label: num, value: num }));
}

function getStringOptions(range: string[]): SelectItem[] {
	const alphabet = [...Array(26)].map((_, i) => String.fromCharCode('A'.charCodeAt(0) + i));
	return alphabet
		.slice(alphabet.indexOf(range[0]), alphabet.indexOf(range[1]) + 1) // Corrected this line
		.map(num => ({ label: num, value: num }));
}

export function getComputedValue(data: any, property: PropertySchema) {
	const { name, parameters }: OperationSchema = property.operation;
	const values: any = Object.values(pick(data, parameters));
	switch (name) {
		case 'sum': {
			return Math.round(values.reduce((a: number, b: number) => a + b, 0));
		}
		case 'average': {
			return Math.round(mean(values));
		}
		case 'occurrence': {
			const result = values.reduce((acc: any, curr: string) => {
				// ~ will add 1 and flip the sign
				// but I don't understand really well what happens here
				acc[curr] = -~acc[curr];
				return acc;
			}, {});
			return result;
		}
	}
}

export function getStyle({ colorMapping }: PropertySchema, item: SelectItem): StyleResult {
	const color: Color = '#000';
	if (item) {
		const { value } = item;
		const found =
			typeof value === 'number'
				? colorMapping.find(({ min, max }) => value >= min && value <= max)
				: colorMapping.find(({ values }) => (values as string[]).includes(value));
		return {
			color: found?.color,
			label: found?.label,
			value: value
		};
	}
	return {
		color: color,
		label: undefined,
		value: undefined
	};
}

export function getStyleForFunction(
	sectionProperties: PropertySchema[],
	property: PropertySchema,
	computedValue: any
): StyleResult {
	const otherPropertiesType = (sectionProperties || []).filter(({ type }) => type !== 'Function')[0]?.type;
	const color: Color = '#ffffff';
	let value;
	if (otherPropertiesType === 'boolean') {
		value = computedValue?.true ? computedValue.true : computedValue?.false > 0 ? 1 : undefined;
	} else {
		// TODO HANDLE CASE WITH DISCRIMINANT
		value = computedValue;
	}

	const found = getStyle(property, { value });

	if (found) return found;
	return {
		color: color,
		label: '-',
		value: '-'
	};
}

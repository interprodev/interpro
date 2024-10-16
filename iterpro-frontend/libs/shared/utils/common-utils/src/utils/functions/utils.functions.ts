import { isEqual, isObject, transform } from 'lodash';
import { SelectItem } from 'primeng/api';

export const getId = (object: any): string | null =>
	object?.id || object?._id ? (object.id || object._id).toString() : null;

export const isNotEmpty = (array: any[]) => typeof array !== 'undefined' && array != null && array.length > 0;
export const removeDuplicates = (array: SelectItem[]) =>
	array.filter((el, index, self) => index === self.findIndex(t => t.label === el.label && t.value === el.value));
export const copyValue = (object: any) => ({ ...object });

export const sortByName = (array: any[], field: string) => {
	if (array) {
		return array.sort((a: any, b: any) => {
			if (!a[field] && !!b[field]) return -1;
			if (!!a[field] && !b[field]) return 1;
			if (!a[field] && !b[field]) return 0;

			return a[field].toLowerCase() < b[field].toLowerCase()
				? -1
				: a[field].toLowerCase() > b[field].toLowerCase()
				? 1
				: 0;
		});
	}

	return [];
};

export const isNotNull = <T>(value: T): value is NonNullable<T> =>
	!!value && String(value) !== 'null' && value !== undefined;

export const isDefined = object => object !== null && object !== undefined;

export const convertToNumber = val => (!val || isNaN(val) || val === '0' || val === '-' ? 0 : Number(val));

export const compareValues = (value1: any, value2: any) => {
	if (!value1 && value2) return -1;
	if (value1 && !value2) return 1;
	if (!value1 && !value2) return 0;
	if (typeof value1 === 'string' && typeof value2 === 'string') return value1.localeCompare(value2);
	return value1 < value2 ? -1 : value1 > value2 ? 1 : 0;
};

export const splitArrayInChunks = <T>(array: T[], chunkSize: number): T[][] => {
	const spliced: T[][] = [];
	let size = Math.min(array.length, chunkSize);
	while (array.length > 0) {
		spliced.push(array.splice(0, size));
		size = Math.min(array.length, chunkSize);
	}
	return spliced;
};

export const insertAtIndex = (collection: any[], element: any, index: number): any[] => {
	return [...collection.slice(0, index + 1), element, ...collection.slice(index + 1)];
};

export const difference = (object, base) => {
	function changes(o, b) {
		return transform(o, (result: any, value, key) => {
			if (!isEqual(value, b[key])) {
				result[key] = isObject(value) && isObject(b[key]) ? changes(value, b[key]) : value;
			}
		});
	}
	return changes(object, base);
};

export const isEmptyObj = obj => {
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) return false;
	}
	return true;
};

export function areAnyKeysPopulated(obj, excludedField: string): boolean {
	return Object.entries(obj).some(
		([key, value]) => key !== excludedField && value !== undefined && value !== null && value !== ''
	);
}

export const findBySelector = (element: HTMLElement, selector: string): Element | null => {
	if (!element) return null;
	if (element.matches(selector)) return element;

	return element.parentElement ? findBySelector(element.parentElement, selector) : null;
};

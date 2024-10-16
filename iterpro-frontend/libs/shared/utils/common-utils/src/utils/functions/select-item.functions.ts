import { SelectItemGroup } from 'primeng/api';

export function getAllSelectItemGroupValues(personOptions: SelectItemGroup[]) {
	return personOptions.reduce((accumulator: any[], option) => {
		const items = option.items.map(item => item);
		return [...accumulator, ...items];
	}, []);
}

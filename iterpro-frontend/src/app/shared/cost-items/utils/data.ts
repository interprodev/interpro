import { PersonCostItem } from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment/moment';

export function getPaymentStatusIcon(rowData: PersonCostItem, isForPdf?: boolean): { icon: string; color: string } {
	if (rowData.paid) return { icon: 'fa fa-check-circle', color: 'green' };
	return {
		icon: 'fa fa-clock',
		color: isPaymentExpired(rowData?.expiryDate) ? 'red' : isForPdf ? 'black' : 'white'
	};
}

function isPaymentExpired(expiryDate: Date): boolean {
	return moment().isAfter(moment(expiryDate));
}

export function calcTotalAmount(
	items: PersonCostItem[],
	status: 'pending' | 'paid' | 'outstanding',
	costType: 'subscription' | 'costNote'
): number {
	// Calculate the sum of every value of every item
	let filtered = (items || []).filter(({ type }) => type === costType);
	switch (status) {
		case 'pending':
			filtered = filtered.filter(({ paid }) => !paid);
			break;
		case 'paid':
			filtered = filtered.filter(({ paid }) => paid);
			break;
		case 'outstanding':
			filtered = filtered.filter(({ paid, expiryDate }) => expiryDate && !paid && isPaymentExpired(expiryDate));
			break;
	}
	return (filtered || []).reduce((acc, item) => acc + item.value, 0);
}

import { formatAmount, getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';

export const isDisabled = (value, transfer, editMode, player) => {
	if (transfer === true) {
		if (player['sell'] === true) {
			return value === true ? !editMode : true;
		} else {
			return !editMode;
		}
	} else {
		return !editMode;
	}
};

export const getTooltip = (el1, translate, visible, el2?, contract?, currency?) => {
	let element: any;
	if (el1 === 'benefit') element = contract.benefits[el2];
	else if (el2) element = contract.options[el2];
	else element = contract;

	if (element.installments && !visible) {
		const text = `<ul>${element.installments
			.map(
				x =>
					`<li>${currency}${formatAmount(x.value)} ${translate.instant('contracts.at')} ${moment(x.date).format(
						getMomentFormatFromStorage()
					)}</li>`
			)
			.join('')}</ul>`;
		return text;
	} else return null;
};

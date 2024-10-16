import { Pipe, PipeTransform, inject } from '@angular/core';
import { Notification } from '@iterpro/shared/data-access/sdk';
import { getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';

@Pipe({
	standalone: true,
	pure: false,
	name: 'notificationMessage'
})
export class NotificationMessagePipe implements PipeTransform {
	readonly #translateService = inject(TranslateService);

	transform({ message, type, eventDate }: Notification): string {
		const paramRegEx1 = new RegExp(/(?!\$).*(?=\$)/, 'gi');
		const paramRegEx2 = new RegExp(
			/(?<=\$)([A-Za-z0-9_\u00C0-\u024F\u1E00-\u1EFF]*.*[A-Za-z0-9_\u00C0-\u024F\u1E00-\u1EFF]*)(?=\$)/,
			'gi'
		);

		const params: string[] = message?.split('|').filter(x => x[0] === '$') || [];
		const translationKey: string = message?.split('|').filter(x => x[0] !== '$')[0] || '';

		let parameters: any = [];

		params.forEach(p => {
			parameters = [
				...parameters,
				type === 'videoSharing' || type === 'eventReminder' || type === 'scoutingGameReminder'
					? p.match(paramRegEx1)
					: p.match(paramRegEx2)
			];
		});

		if (eventDate) {
			parameters = [...parameters, [moment(eventDate).format(getMomentFormatFromStorage())]];
		}

		let parObj = {};
		parameters
			? parameters.forEach((x, index) => {
					const i = 'value' + (index + 1);
					parObj[i] = x && (x as any).map(y => (y && y !== '' ? this.#translateService.instant(y) : y));
			  })
			: (parObj = {});
		if (!translationKey) return '';
		return this.#translateService.instant(translationKey, parObj);
	}
}

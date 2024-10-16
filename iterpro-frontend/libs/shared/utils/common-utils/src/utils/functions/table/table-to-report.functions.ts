import { Injury, MixedType, PdfMixedTable, TableColumn } from '@iterpro/shared/data-access/sdk';
import { AgePipe } from '@iterpro/shared/ui/pipes';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { DEFAULT_PERSON_IMAGE_BASE64 } from '../../../constants/assets/default-player-image.constants';
import { AzureStoragePipe } from '../../../pipes/azure-storage.pipe';
import { TreatmentsOfTheDayTooltipPipe } from '../../../pipes/treatments-of-the-day-tooltip.pipe';
import { InjuryIconService } from '../../../services/medical/injury-icon.service';
import { getMomentFormatFromStorage } from '../../dates/date-format.util';
import { getFlag } from '../../translations/flag.util';
import { parseHtmlStringToText } from '../../views/html-to-string.util';

const isColumnVisible = (columns: string[], key: string) => columns.includes(key);
const formatDate = (date: Date, format = getMomentFormatFromStorage()) => (date ? moment(date).format(format) : '');
const getRows = (
	headers: TableColumn[],
	items: any[],
	translateService: TranslateService,
	azurePipe: AzureStoragePipe,
	agePipe: AgePipe,
	injuryIconService: InjuryIconService,
	treatmentsTooltipPipe: TreatmentsOfTheDayTooltipPipe
): MixedType[][] => {
	return items.map(player =>
		headers.map(({ field, type, translateValuePrefix }) => {
			switch (type) {
				case 'image':
					return <MixedType>{
						mode: 'image',
						value: player[field] ? azurePipe.transform(player[field]) : DEFAULT_PERSON_IMAGE_BASE64,
						alignment: 'center'
					};
				case 'translate': {
					let label = '';
					if (field && player[field]) {
						if (translateValuePrefix) {
							label = translateService.instant(translateValuePrefix + String(player[field]));
						} else {
							label = translateService.instant(String(player[field]));
						}
					}
					return <MixedType>{
						mode: 'text',
						label,
						alignment: 'center'
					};
				}
				case 'percentage':
					return <MixedType>{
						mode: 'text',
						label: field && player[field] ? Number(player[field]).toFixed(2) + '%' : '',
						alignment: 'center'
					};
				case 'test':
					return <MixedType>{
						mode: 'pointType',
						label: player[field] ? player[field].currentValue : '',
						alignment: 'center',
						cssStyle:
							!!player[field] && player[field].interval
								? `background-color: ${player[field].interval}`
								: 'background-color: lightgrey'
					};
				case 'readiness':
					return <MixedType>{
						mode: 'pointType',
						value: player[field] ? player[field] : '',
						alignment: 'center',
						cssStyle:
							!!player[field] && player[field] ? `background-color: ${player[field]}` : 'background-color: lightgrey'
					};
				case 'expiration':
					return <MixedType>{
						mode: 'text',
						label: player.expiration ? player.expirationDescription : '',
						alignment: 'center'
					};
				case 'injury': {
					const { tooltip, icon } = injuryIconService.parsePlayer(player, new Date());
					return <MixedType>{
						mode: 'text',
						label: icon.length > 0 ? parseHtmlStringToText(tooltip.replace('</li><li>', '; ')) : '',
						alignment: 'center'
					};
				}
				case 'age':
					return <MixedType>{ mode: 'text', label: agePipe.transform(player[field]), alignment: 'center' };
				case 'year':
					return <MixedType>{ mode: 'text', label: formatDate(player[field], 'YYYY'), alignment: 'center' };
				case 'pending': {
					const iconClass = player.preventionPast ? 'fas fa-times' : player.preventionNext ? 'fas fa-clock' : '';
					return <MixedType>{ mode: 'fa-icon', label: iconClass, value: iconClass };
				}
				case 'flag':
					return <MixedType>{
						mode: 'flag',
						label: player[field],
						value: getFlag(player[field]),
						alignment: 'center'
					};
				case 'playerAttributes':
					return <MixedType>{
						mode: 'pointType',
						label: player.playerAttributes ? player.playerAttributes[field].value : null,
						cssStyle: player.playerAttributes ? 'background: ' + player.playerAttributes[field].backgroundColor : null
					};
				case 'treatment': {
					const treatments: string[] = [];
					const undone = player[field].undone;
					const done = player[field].done;
					const todo = player[field].todo;
					if (undone.length > 0) treatments.push(treatmentsTooltipPipe.transform(undone));
					if (done.length > 0) treatments.push(treatmentsTooltipPipe.transform(done));
					if (todo.length > 0) treatments.push(treatmentsTooltipPipe.transform(todo));
					return <MixedType>{
						mode: 'text',
						label: treatments.join('; '),
						alignment: 'center'
					};
				}
				case 'chronicInjuries':
					return <MixedType>{
						mode: 'text',
						label: parseChronicInjuries(player[field], translateService),
						alignment: 'center'
					};
				default:
					return <MixedType>{ mode: 'text', label: player[field], alignment: 'center' };
			}
		})
	);
};

export const tableToMixedTable = (
	visibleColumns: string[],
	columns: any[],
	items = [],
	translateService: TranslateService,
	azurePipe: AzureStoragePipe,
	agePipe: AgePipe,
	injuryIconService: InjuryIconService,
	treatmentsTooltipPipe: TreatmentsOfTheDayTooltipPipe
): PdfMixedTable => {
	const headers = columns.filter(({ field }) => isColumnVisible(visibleColumns, field));
	return {
		headers: headers.map((col: TableColumn) => ({
			label: col.header,
			alignment: <any>col.align || 'center',
			mode: 'text'
		})),
		rows: getRows(headers, items, translateService, azurePipe, agePipe, injuryIconService, treatmentsTooltipPipe)
	};
};

export const parseChronicInjuries = (value: Injury[] = [], translateService: TranslateService) => {
	return value
		.map(
			({ date, location, osics }) =>
				`${formatDate(date)}: ${translateService.instant(location)}${osics ? ` - ${osics}` : ``}`
		)
		.join('; ');
};

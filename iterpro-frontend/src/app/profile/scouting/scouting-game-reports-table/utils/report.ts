import { GameReportRow } from '@iterpro/shared/data-access/sdk';
import { getMomentFormatFromStorage, parseHtmlStringToText } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment/moment';
import { Column, CompletionStatus } from '../interfaces/table.interfaces';

export function getTableRowsData(tableValues: GameReportRow[], columns: Column[], visibleColumns: string[], translate) {
	const visibleFields = columns.filter(
		({ field, type, hideInTable }) =>
			(visibleColumns.includes(field) || hideInTable) && !['video', 'doc'].includes(type)
	);
	let o: any;
	let value: any;
	return tableValues.map(item => {
		o = {};
		visibleFields
			.filter(({ hideInTable }) => !hideInTable)
			.forEach(({ field, header, type, group }) => {
				if (group === 'reportData') {
					value = item[field] ? item[field].value : '';
				} else {
					switch (type) {
						case 'translate':
							value = item[field] ? translate.instant(item[field]) : '';
							break;
						case 'date':
							value = item[field] ? moment(item[field]).format(getMomentFormatFromStorage()) : '';
							break;
						case 'datetime':
							value = item[field] ? moment(item[field]).format(`${getMomentFormatFromStorage()} HH:mm:ss`) : '';
							break;
						case 'report':
							value = item[field] ? parseHtmlStringToText(item[field]) : '';
							break;
						case 'completion':
							value = item[field] ? getCompletionStatusLabel(item[field], translate) : '';
							break;
						default:
							value = item[field];
					}
				}
				o[header] = value || '-';
			});
		return o;
	});
}

function getCompletionStatusLabel(completion: CompletionStatus, translate: TranslateService): string {
	switch (completion) {
		case CompletionStatus.Completed:
			return translate.instant('import.wizard.label.completed');
		case CompletionStatus.NotCompleted:
			return translate.instant('alert.missingFields');
		case CompletionStatus.Pending:
			return translate.instant('Pending');
	}
}

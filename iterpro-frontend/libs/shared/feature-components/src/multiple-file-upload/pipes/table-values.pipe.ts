import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment/moment';
import { ExtendedAttachment, Filters } from '../models/file-upload.type';
import { getExtensionFromFileName } from '@iterpro/shared/utils/common-utils';

@Pipe({
	standalone: true,
	name: 'tableValues'
})
export class TableValuesPipe implements PipeTransform {
	transform(attachments: ExtendedAttachment[], filters: Filters): ExtendedAttachment[] {
		return (attachments || []).filter((attachment: ExtendedAttachment) => {
			return (
				(filters.selectedAuthorIds.length === 0 || filters.selectedAuthorIds.includes(attachment.authorId)) &&
				(filters.selectedSections.length === 0 ||
					(attachment.sections && attachment.sections.some(section => filters.selectedSections.includes(section)))) &&
				(!filters.datePeriod ||
					filters.datePeriod.length === 0 ||
					(attachment.date &&
						moment(attachment.date).isBetween(moment(filters.datePeriod[0]), moment(filters.datePeriod[1]), 'day', '[]'))) &&
				(filters.selectedFileTypes.length === 0 ||
					filters.selectedFileTypes.includes(getExtensionFromFileName(attachment.name)?.toUpperCase() as string))
			);
		});
	}
}

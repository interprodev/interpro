import { Pipe, PipeTransform } from '@angular/core';
import { PlayerReportHistory } from '@iterpro/shared/data-access/sdk';
import { last, sortBy } from 'lodash';

@Pipe({
	standalone: true,
	name: 'lastAuthor'
})
export class LastAuthorPipe implements PipeTransform {
	transform(history: PlayerReportHistory[]): PlayerReportHistory {
		return last(sortBy(history || [], 'updatedAt')) as PlayerReportHistory;
	}
}

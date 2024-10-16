import { Pipe, PipeTransform } from '@angular/core';
import { Drill } from '@iterpro/shared/data-access/sdk';

@Pipe({
	name: 'drillListFilter'
})
export class DrillListFilterPipe implements PipeTransform {
	transform(drills: Drill[], currentUserId: string): Drill[] {
		return (drills || []).filter(({ sharedWithIds, authorId }) => {
			return (sharedWithIds || []).includes(currentUserId) || authorId === currentUserId;
		});
	}
}

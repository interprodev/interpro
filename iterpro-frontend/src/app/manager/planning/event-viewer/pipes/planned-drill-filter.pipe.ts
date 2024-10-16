import { Pipe, PipeTransform } from '@angular/core';
import { Customer, Drill } from '@iterpro/shared/data-access/sdk';

@Pipe({
	name: 'plannedDrillFilter'
})
export class PlannedDrillFilterPipe implements PipeTransform {
	transform(plannedDrillList: any[], customers: Customer[], currentUserId: string): any[] {
		const currentCustomer: Customer = (customers || []).find(({ id }) => id === currentUserId);
		return (plannedDrillList || []).filter(({ drillDetail }) => {
			if (!drillDetail) return true;
			return (
				(drillDetail as Drill).sharedWithIds.includes(currentCustomer?.id) ||
				(drillDetail as Drill).authorId === currentCustomer?.id
			);
		});
	}
}

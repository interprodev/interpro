import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Customer } from '@iterpro/shared/data-access/sdk';
import { getTeamSettings, sortByName, userHasPermission } from '@iterpro/shared/utils/common-utils';

@Component({
	selector: 'iterpro-notify-customers-dialog',
	templateUrl: './notify-customers-dialog.component.html',
	styleUrls: ['./notify-customers-dialog.component.css']
})
export class NotifyCustomersDialogComponent implements OnChanges {
	@Input() customers: Customer[];
	@Input() visible: boolean = false;
	@Output() discardEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() saveEmitter: EventEmitter<any> = new EventEmitter<any>();

	selectedCustomers: any = [];
	customerOptions: any = [];

	readonly #currentTeamService = inject(CurrentTeamService);

	ngOnChanges(changes: SimpleChanges) {
		if (changes && this.customers) {
			this.customerOptions = sortByName(
				this.customers.filter(customer => {
					const teamSettings = getTeamSettings((customer?.teamSettings || []), this.#currentTeamService.getCurrentTeam().id);
					if (
						customer &&
						teamSettings &&
						userHasPermission(teamSettings, 'notifyContract')
					)
						return customer;
				}),
				'lastName'
			).map(customer => ({
				label: `${customer.firstName} ${customer.lastName}`,
				value: customer.id
			}));
		}
	}
	save() {
		this.saveEmitter.emit(this.selectedCustomers);
	}

	discard() {
		this.discardEmitter.emit();
	}
}

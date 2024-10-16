import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Staff } from '@iterpro/shared/data-access/sdk';

@Component({
	selector: 'iterpro-planning-event-staff',
	templateUrl: './event-staff.component.html'
})
export class EventStaffComponent {
	@Input({required: true}) displayName: string;
	@Input({required: true}) photoUrl: string;
	@Input({required: true}) selected: boolean;
	@Input({required: true}) editable: boolean;
	@Output() staffSelect: EventEmitter<void> = new EventEmitter<void>();
}

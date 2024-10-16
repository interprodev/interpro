import { Component, Input } from '@angular/core';
import { SessionEvent, SessionMessage } from 'src/app/+state/import-store/interfaces/import-store.interfaces';

@Component({
	selector: 'iterpro-import-messages',
	templateUrl: './import-messages.component.html',
	styleUrls: ['./import-messages.component.css']
})
export class ImportMessagesComponent {
	@Input() messages: SessionMessage[];

	getLinkParams({ eventId, start }: SessionEvent) {
		return {
			id: eventId,
			start
		};
	}
}

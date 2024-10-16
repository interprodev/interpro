import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ContractPersonType, LoopBackAuth, People } from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment';

@Component({
	selector: 'iterpro-activate-dialog',
	templateUrl: './activate-dialog.component.html',
	styleUrls: ['./activate-dialog.component.css']
})
export class ActivateDialogComponent {
	@Input() element: People;
	@Input() personType: ContractPersonType;
	@Output() onSave: EventEmitter<People> = new EventEmitter<People>();
	@Output() onDiscard: EventEmitter<void> = new EventEmitter<void>();
	toMotivation: string;

	readonly #auth = inject(LoopBackAuth);

	isOutOfTeam(element: People): boolean {
		let el;
		if (element._statusHistory && element._statusHistory.length > 0) {
			el = element._statusHistory.find(x => x.active === true);
		}
		const motivation = el ? el.fromMotivation : element.currentStatus;
		return !motivation || motivation === 'disciplinary' || false;
	}

	isExpiredSoldSwapLoan(element: People): boolean {
		let el;
		if (element._statusHistory && element._statusHistory.length > 0) {
			el = element._statusHistory.find(x => x.active === true);
		}
		const motivation = el ? el.fromMotivation : element.currentStatus;
		return !motivation || motivation === 'expired' || motivation === 'sold' || motivation === 'swap' || false;
	}

	isNotCalledUp(element: People): boolean {
		let el;
		if (element._statusHistory && element._statusHistory.length > 0) {
			el = element._statusHistory.find(x => x.active === true);
		}
		const motivation = el ? el.fromMotivation : element.currentStatus;
		return !motivation || motivation === 'notCalled' || false;
	}

	isOnLoan(element: People): boolean {
		let el;
		if (element._statusHistory && element._statusHistory.length > 0) {
			el = element._statusHistory.find(x => x.active === true);
		}
		const motivation = el ? el.fromMotivation : element.currentStatus;
		return !motivation || motivation === 'onLoan' || false;
	}

	save(element: People) {
		element.archived = false;
		element.archivedDate = null;
		element.archivedMotivation = null;
		element.currentStatus = 'inTeam';
		element._statusHistory = [
			...(element._statusHistory || []),
			{
				date: moment().toDate(),
				archived: false,
				status: element.currentStatus,
				motivation: this.toMotivation,
				author: this.#auth.getCurrentUserId()
			}
		];
		// element = this.manageContract(element, this.toMotivation);
		this.onSave.emit(element);
	}

	discard() {
		this.onDiscard.emit();
	}
}

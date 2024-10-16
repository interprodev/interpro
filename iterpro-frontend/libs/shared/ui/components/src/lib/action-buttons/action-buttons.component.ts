import { NgIf, NgStyle } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
@Component({
	standalone: true,
	imports: [NgIf, ButtonModule, TranslateModule, NgStyle],
	selector: 'iterpro-action-buttons',
	templateUrl: './action-buttons.component.html'
})
export class ActionButtonsComponent {
	// Input Properties
	@Input({ required: true }) editMode!: boolean;
	@Input() deleteCounter!: number;
	@Input() cloneCounter!: number;
	@Input() deleteLabel = 'buttons.delete';
	@Input() cloneLabel = 'buttons.copy';
	@Input() deleteAskConfirmation = false;
	@Input() deleteConfirmationMessage: string = 'confirm.delete';
	@Input() discardLabel = 'buttons.discard';
	@Input() discardIcon = 'fas fa-close';
	@Input() addNewLabel = 'buttons.add';
	@Input() buttonTypes: ButtonType[] = ['edit', 'save', 'discard'];
	@Input() showDiscard = true;
	@Input() loading = false;
	// Output Events
	@Output() edit: EventEmitter<void> = new EventEmitter<void>();
	@Output() create: EventEmitter<void> = new EventEmitter<void>();
	@Output() discard: EventEmitter<void> = new EventEmitter<void>();
	@Output() clone: EventEmitter<void> = new EventEmitter<void>();
	@Output() save: EventEmitter<void> = new EventEmitter<void>();
	@Output() delete: EventEmitter<void> = new EventEmitter<void>();
	// Services
	#confirmationService = inject(ConfirmationService);
	#translateService = inject(TranslateService);

	onDelete() {
		if (!this.deleteAskConfirmation) return this.delete.emit();
		this.#confirmationService.confirm({
			message: this.#translateService.instant(this.deleteConfirmationMessage),
			header: 'IterPRO',
			icon: 'fa fa-warning',
			accept: () => this.delete.emit(),
			acceptButtonStyleClass: 'p-button-danger'
		});
	}
}

export type ButtonType = 'edit' | 'discard' | 'save' | 'addNew' | 'delete' | 'clone';

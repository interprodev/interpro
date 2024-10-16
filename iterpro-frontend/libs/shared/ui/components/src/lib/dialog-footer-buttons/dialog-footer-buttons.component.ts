import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgStyle } from '@angular/common';
import { ConfirmationService } from 'primeng/api';

@Component({
	selector: 'iterpro-dialog-footer-buttons',
	standalone: true,
	imports: [ButtonModule, TranslateModule, NgStyle],
	templateUrl: './dialog-footer-buttons.component.html'
})
export class DialogFooterButtonsComponent {
	// Input Properties
	@Input() confirmDisabled = false;
	@Input() confirmLabel = 'buttons.save';
	@Input() confirmationMessage = 'confirm.edit';
	@Input() confirmAskConfirmation = false;
	// Output Events
	@Output() confirmClicked = new EventEmitter<void>();
	@Output() discardClicked = new EventEmitter<void>();
	// Services
	#confirmationService = inject(ConfirmationService);
	#translateService = inject(TranslateService);

	onConfirm() {
		if (!this.confirmAskConfirmation) return this.confirmClicked.emit();
		this.#confirmationService.confirm({
			message: this.#translateService.instant(this.confirmationMessage),
			header: 'IterPRO',
			accept: () => this.confirmClicked.emit()
		});
	}
}

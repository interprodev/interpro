import { NgIf } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
	standalone: true,
	imports: [NgIf, ButtonModule, TranslateModule],
	selector: 'iterpro-confirmation-dialog',
	templateUrl: './confirmation-dialog.component.html',
	encapsulation: ViewEncapsulation.None,
	styles: [
		`.description {
				font-size: 1rem;
				font-weight: 400;
			}
		`
	]
})
export class ConfirmationDialogComponent {
	description: string | undefined;
	actionTrueLabel: string | undefined;
	actionTrueIcon: string | undefined;
	actionFalseLabel: string | undefined;

	constructor(private readonly config: DynamicDialogConfig, private readonly dialogRef: DynamicDialogRef) {
		if (this.config && this.config.data) {
			this.description = config.data.description;
			this.actionTrueLabel = config.data.actionTrueLabel;
			this.actionTrueIcon = config.data.actionTrueIcon;
			this.actionFalseLabel = config.data.actionFalseLabel;
		} else {
			console.warn('No data passed to confirmation dialog');
		}
	}

	confirmationAction(choice: boolean) {
		this.dialogRef.close({ choice });
	}

	cancel(): void {
		this.dialogRef.close();
	}
}

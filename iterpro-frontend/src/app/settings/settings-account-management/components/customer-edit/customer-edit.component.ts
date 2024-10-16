import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DialogOutput, DialogOutputAction } from '@iterpro/shared/data-access/sdk';
import {
	ActionButtonsComponent,
	DialogFooterButtonsComponent,
	DialogHeaderComponent,
	FormFeedbackComponent
} from '@iterpro/shared/ui/components';
import { UniqueValuesErrorPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AlertService } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { toCustomerEditForm } from './models/customer-edit.form';
import { CustomerEdit, CustomerEditForm } from './models/customer-edit.type';

@Component({
	selector: 'iterpro-customer-edit',
	standalone: true,
	templateUrl: './customer-edit.component.html',
	imports: [
		FormFeedbackComponent,
		ReactiveFormsModule,
		PrimeNgModule,
		TranslateModule,
		DialogFooterButtonsComponent,
		UniqueValuesErrorPipe,
		ActionButtonsComponent,
		DialogHeaderComponent
	]
})
export class CustomerEditComponent {
	// Input properties
	customer: CustomerEdit;
	currentUserAdmin: boolean;
	alreadyUsedFirstNames: string[];
	alreadyUsedLastNames: string[];
	alreadyUsedEmails: string[];
	header: string;
	// Services
	readonly #ref: DynamicDialogRef = inject(DynamicDialogRef);
	readonly #config: DynamicDialogConfig = inject(DynamicDialogConfig);
	readonly #alertService: AlertService = inject(AlertService);
	readonly #fb: FormBuilder = inject(FormBuilder);
	// Variables
	customerForm: FormGroup<CustomerEditForm>;
	saveClicked = false;
	constructor() {
		if (this.#config.data) {
			this.customer = this.#config.data.customer;
			this.currentUserAdmin = this.#config.data.currentUserAdmin;
			this.alreadyUsedFirstNames = this.#config.data.alreadyUsedFirstNames;
			this.alreadyUsedLastNames = this.#config.data.alreadyUsedLastNames;
			this.alreadyUsedEmails = this.#config.data.alreadyUsedEmails;
			this.header = this.#config.data.header;
		}
		this.initFormValues();
		this.customerForm.enable();
	}

	private initFormValues(): void {
		this.customerForm = this.#fb.nonNullable.group(
			toCustomerEditForm(this.alreadyUsedFirstNames, this.alreadyUsedLastNames, this.alreadyUsedEmails)
		);
		this.customerForm.patchValue(this.customer);
	}

	private isFormValid(): boolean {
		return this.customerForm && !this.customerForm.invalid;
	}

	onConfirm() {
		this.saveClicked = true;
		if (!this.isFormValid()) return this.#alertService.notify('warn', 'settings', 'alert.formNotValid', false);
		this.closeDialog({ data: this.fromFormGroup(), action: DialogOutputAction.Edit });
	}

	onDiscard() {
		this.closeDialog();
	}

	onDelete() {
		this.closeDialog({ data: this.customer, action: DialogOutputAction.Delete });
	}

	private fromFormGroup(): CustomerEdit {
		const jsonPayload = this.customerForm.getRawValue();
		return Object.assign(jsonPayload, {
			id: this.customer?.id
		});
	}

	private closeDialog(payload?: DialogOutput<CustomerEdit>) {
		this.#ref.close(payload);
	}
}

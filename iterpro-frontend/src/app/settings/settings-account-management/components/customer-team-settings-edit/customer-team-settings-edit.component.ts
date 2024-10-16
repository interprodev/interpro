import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IterproUserPermission } from '@iterpro/shared/data-access/permissions';
import { Customer, DialogOutput, DialogOutputAction } from '@iterpro/shared/data-access/sdk';
import {
	ActionButtonsComponent,
	DialogFooterButtonsComponent,
	DialogHeaderComponent,
	FormFeedbackComponent
} from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AlertService, PermissionConstantService } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { customerTeamSettingEditForm } from './models/customer-team-setting-edit.form';
import { CustomerTeamSettingEdit, CustomerTeamSettingEditForm } from './models/customer-team-setting-edit.type';

@Component({
	selector: 'iterpro-customer-team-settings-edit',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		PrimeNgModule,
		TranslateModule,
		FormFeedbackComponent,
		DialogFooterButtonsComponent,
		ActionButtonsComponent,
		DialogHeaderComponent
	],
	templateUrl: './customer-team-settings-edit.component.html'
})
export class CustomerTeamSettingsEditComponent {
	// Input properties
	positionsOptions: SelectItem[];
	permissionsOptions: SelectItemGroup[];
	mobilePermissionsOptions: SelectItem[];
	customer: Customer;
	teamSettings: CustomerTeamSettingEdit;
	hasAnyMobileAppEnabled: boolean;
	header: string;
	teamName: string;
	// Services
	readonly #ref: DynamicDialogRef = inject(DynamicDialogRef);
	readonly #config: DynamicDialogConfig = inject(DynamicDialogConfig);
	readonly #alertService: AlertService = inject(AlertService);
	readonly #fb = inject(FormBuilder);
	readonly #permissionService: PermissionConstantService = inject(PermissionConstantService);
	// Variables
	teamSettingForm: FormGroup<CustomerTeamSettingEditForm>;
	saveClicked = false;
	constructor() {
		this.teamSettings = this.#config.data.teamSettings;
		this.customer = this.#config.data.customer;
		this.positionsOptions = this.#config.data.positionsOptions;
		this.permissionsOptions = this.#config.data.permissionsOptions;
		this.mobilePermissionsOptions = this.#config.data.mobilePermissionsOptions;
		this.hasAnyMobileAppEnabled = this.#config.data.hasAnyMobileAppEnabled;
		this.header = this.#config.data.header;
		this.teamName = this.#config.data.teamName;
		this.initFormValues();
		this.teamSettingForm.enable();
	}

	private initFormValues(): void {
		this.teamSettingForm = this.#fb.nonNullable.group(customerTeamSettingEditForm);
		const parentPermissions: IterproUserPermission[] = this.permissionsOptions.map(
			({ label }) => label.toLowerCase() as IterproUserPermission
		);
		this.teamSettingForm.patchValue({
			...this.teamSettings,
			permissions: (this.teamSettings?.permissions || []).filter(
				(permission: IterproUserPermission) => !parentPermissions.includes(permission)
			)
		});
	}

	private isFormValid(): boolean {
		return this.teamSettingForm && !this.teamSettingForm.invalid;
	}

	onConfirm() {
		this.saveClicked = true;
		if (!this.isFormValid()) return this.#alertService.notify('warn', 'Settings', 'alert.formNotValid', false);
		this.closeDialog({ data: this.fromFormGroup(), action: DialogOutputAction.Edit });
	}

	private fromFormGroup(): CustomerTeamSettingEdit {
		const jsonPayload = this.teamSettingForm.getRawValue();
		jsonPayload.permissions = this.#permissionService.getParentModules(jsonPayload.permissions);
		return Object.assign(jsonPayload, {
			id: this.teamSettings?.id
		});
	}

	onDiscard() {
		this.closeDialog();
	}

	onDelete() {
		this.closeDialog({ data: this.teamSettings, action: DialogOutputAction.Delete });
	}

	private closeDialog(payload?: DialogOutput<CustomerTeamSettingEdit>) {
		this.#ref.close(payload);
	}
}

import { NgStyle } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IterproOrgType } from '@iterpro/shared/data-access/permissions';
import { DialogOutput, DialogOutputAction } from '@iterpro/shared/data-access/sdk';
import {
	ActionButtonsComponent,
	DialogFooterButtonsComponent,
	DialogHeaderComponent,
	FormFeedbackComponent
} from '@iterpro/shared/ui/components';
import { MaskDirective } from '@iterpro/shared/ui/directives';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AlertService, FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { v4 as uuid } from 'uuid';
import { clubPreferenceSeasonForm, toTransferWindowFormElement } from '../models/seasons.form';
import { ClubPreferenceSeasonForm, ClubSeasonEdit, TransferWindowEdit } from '../models/seasons.type';

@Component({
	selector: 'iterpro-club-season-edit',
	standalone: true,
	imports: [
		FormFeedbackComponent,
		FormsModule,
		ReactiveFormsModule,
		TranslateModule,
		ActionButtonsComponent,
		FormatDateUserSettingPipe,
		NgStyle,
		MaskDirective,
		PrimeNgModule,
		DialogFooterButtonsComponent,
		DialogHeaderComponent
	],
	templateUrl: './club-season-edit.component.html'
})
export class ClubSeasonEditComponent {
	// Services
	readonly #ref: DynamicDialogRef = inject(DynamicDialogRef);
	readonly #config: DynamicDialogConfig = inject(DynamicDialogConfig);
	readonly #alertService: AlertService = inject(AlertService);
	readonly #fb = inject(FormBuilder);
	// Input Properties
	clubSeason: ClubSeasonEdit;
	currencyCode: string;
	orgType: IterproOrgType;
	header: string;
	// Variables
	saveClicked = false;
	seasonForm: FormGroup<ClubPreferenceSeasonForm>;
	constructor() {
		this.seasonForm?.reset();
		if (this.#config.data) {
			this.clubSeason = this.#config.data.clubSeason;
			this.currencyCode = this.#config.data.currencyCode;
			this.orgType = this.#config.data.orgType;
			this.header = this.#config.data.header;
		}
		if (this.clubSeason) {
			this.loadForm();
		} else {
			this.createForm();
		}
	}

	private loadForm(): void {
		const transferWindowControls = (this.clubSeason?._transferWindows || []).map(window =>
			this.#fb.group(toTransferWindowFormElement(window, this.orgType))
		);
		this.seasonForm = this.#fb.nonNullable.group<ClubPreferenceSeasonForm>({
			...clubPreferenceSeasonForm,
			_transferWindows:
				this.orgType === 'agent'
					? this.#fb.array(transferWindowControls)
					: this.#fb.nonNullable.array(transferWindowControls)
		});
		this.seasonForm.patchValue(this.clubSeason);
		this.seasonForm.enable();
	}

	private createForm() {
		const defaultTransferWindows: TransferWindowEdit[] = [
			{
				id: uuid(),
				name: 'summer',
				start: null,
				end: null,
				budget: null
			},
			{
				id: uuid(),
				name: 'winter',
				start: null,
				end: null,
				budget: null
			}
		];
		const transferWindowControls = defaultTransferWindows.map(window =>
			this.#fb.group(toTransferWindowFormElement(window, this.orgType))
		);
		this.seasonForm = this.#fb.nonNullable.group<ClubPreferenceSeasonForm>({
			...clubPreferenceSeasonForm,
			_transferWindows:
				this.orgType === 'agent'
					? this.#fb.array(transferWindowControls)
					: this.#fb.nonNullable.array(transferWindowControls)
		});
		this.seasonForm.enable();
		this.seasonForm.reset();
	}

	onConfirm() {
		this.saveClicked = true;
		if (!this.seasonForm.valid) return this.#alertService.notify('warn', 'Settings', 'alert.formNotValid', false);
		this.closeDialog({ data: this.seasonForm.getRawValue(), action: DialogOutputAction.Edit });
	}

	onDiscard() {
		this.closeDialog();
	}

	onDelete() {
		this.closeDialog({ data: this.clubSeason, action: DialogOutputAction.Delete });
	}

	private closeDialog(payload?: DialogOutput<ClubSeasonEdit>) {
		this.#ref.close(payload);
	}
}

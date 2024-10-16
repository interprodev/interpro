import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { isArray } from 'lodash';
import { SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ListboxModule } from 'primeng/listbox';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogFooterButtonsComponent } from '../dialog-footer-buttons/dialog-footer-buttons.component';

@Component({
	standalone: true,
	imports: [
		TranslateModule,
		ProgressSpinnerModule,
		ListboxModule,
		DialogFooterButtonsComponent,
		FormsModule,
		ButtonModule,
		NgStyle
	],
	selector: 'iterpro-selection-dialog',
	templateUrl: './selection-dialog.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectionDialogComponent implements OnInit {
	saveButtonLabel!: string;
	isMultipleSelection = false;
	itemsGroups: ItemsGroup[] = [];
	selectedItems: SelectItem[] = [];
	subtitle!: string;

	readonly #dialogConfig = inject(DynamicDialogConfig);
	readonly #dialogReference = inject(DynamicDialogRef);

	ngOnInit(): void {
		this.isMultipleSelection = this.#dialogConfig.data.isMultipleSelection;
		this.itemsGroups = this.#dialogConfig.data.itemsGroups;
		this.saveButtonLabel = this.#dialogConfig.data?.saveButtonLabel || 'buttons.save';
		this.subtitle = this.#dialogConfig.data?.subtitle;
	}

	save(): void {
		const items = isArray(this.selectedItems) ? this.selectedItems || [] : (this.selectedItems as SelectItem);
		const values = isArray(items) ? items.map(item => item.value) : items.value;
		this.#dialogReference.close(values);
	}

	canSave(): boolean {
		return this.isMultipleSelection
			? this.selectedItems.length > 0
			: !isArray(this.selectedItems) && !!this.selectedItems;
	}

	discard(): void {
		this.#dialogReference.close();
	}
}

export interface ItemsGroup {
	groupName: string;
	groupItems: SelectItem[];
}

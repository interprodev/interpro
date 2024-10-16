import { Component, inject } from '@angular/core';
import { PeopleBulkChangeItem } from './model/people-bulk-change.model';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { DialogFooterButtonsComponent, PictureComponent } from '@iterpro/shared/ui/components';
import { TranslateModule } from '@ngx-translate/core';
import { NgStyle } from '@angular/common';

@Component({
	selector: 'iterpro-people-bulk-change',
	standalone: true,
	imports: [
		PrimeNgModule,
		PictureComponent,
		TranslateModule,
		NgStyle,
		DialogFooterButtonsComponent
	],
	templateUrl: './people-bulk-change.component.html',
})
export class PeopleBulkChangeComponent {
	// Input Properties
	sourceHeader: string;
	targetHeader: string;
	editMode: boolean;
	sourceItems: PeopleBulkChangeItem[];
	targetItems: PeopleBulkChangeItem[];
	// Services
	readonly #ref: DynamicDialogRef = inject(DynamicDialogRef);
	readonly #config: DynamicDialogConfig = inject(DynamicDialogConfig);
	constructor() {
		if (this.#config.data) {
			this.sourceItems = this.#config.data.sourceItems;
			this.targetItems = this.#config.data.targetItems;
			this.editMode = this.#config.data.editMode;
			this.sourceHeader = this.#config.data.sourceHeader;
			this.targetHeader = this.#config.data.targetHeader;
		}
	}

	onDiscard() {
		this.#ref.close();
	}

	onConfirm() {
		this.#ref.close(this.targetItems.map(({id}) => id));
	}
}

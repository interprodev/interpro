import { JsonPipe, NgStyle } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DrillCanvas } from '../../models/drills-canvas.types';
import { SelectItem } from 'primeng/api';

@Component({
	standalone: true,
	imports: [NgStyle, ButtonModule, DropdownModule, FormsModule, TranslateModule, JsonPipe],
	selector: 'iterpro-drill-canvas-wizard',
	templateUrl: 'drill-canvas-wizard.component.html'
})
export class DrillCanvasWizardComponent {
	/** Services */
	readonly #dialogRef = inject(DynamicDialogRef);
	readonly #dialogConfig = inject(DynamicDialogConfig);

	/** Data */
	readonly drillCanvasOptions = this.#dialogConfig.data.drillCanvasOptions as SelectItem[];
	selectedDrillCanvasId: string = 'new';

	/** Methods */
	cancel(): void {
		this.#dialogRef.close(false);
	}

	createNew(): void {
		this.#dialogRef.close(this.selectedDrillCanvasId);
	}
}

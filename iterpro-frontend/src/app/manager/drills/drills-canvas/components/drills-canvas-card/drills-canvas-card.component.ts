import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AzureStoragePipe, FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { CheckboxChangeEvent, CheckboxModule } from 'primeng/checkbox';
import { DrillCanvas } from '../../models/drills-canvas.types';

@Component({
	selector: 'iterpro-drill-canvas-card',
	standalone: true,
	imports: [CheckboxModule, AzureStoragePipe, FormatDateUserSettingPipe],
	templateUrl: './drills-canvas-card.component.html',
	styles: [
		`
			div:hover img {
				transform: scale(1.1);
			}
			div:hover .text-box {
				transform: translateX(-0.1rem);
			}
		`
	]
})
export class DrillCanvasCardComponent {
	@Input({ required: true }) template: DrillCanvas;
	@Input({ required: true }) editMode: boolean;
	@Output() cardSelected: EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output() cardClicked: EventEmitter<void> = new EventEmitter<void>();

	onCheckedChange(event: CheckboxChangeEvent) {
		event.originalEvent.stopPropagation();
		this.cardSelected.emit(event.checked);
	}
}

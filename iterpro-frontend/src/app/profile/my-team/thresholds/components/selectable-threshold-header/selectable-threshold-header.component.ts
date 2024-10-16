import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'iterpro-selectable-threshold-header',
	templateUrl: './selectable-threshold-header.component.html',
	styleUrls: ['./selectable-threshold-header.component.css']
})
export class SelectableThresholdHeaderComponent {
	@Input() label: string;
	@Input() selected: boolean;
	@Input() clickable: boolean;
	@Output() click: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();

	selectHeader(event: MouseEvent) {
		this.click.emit(event);
	}
}

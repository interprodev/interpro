import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'iterpro-new-scouting-player-dialog',
	templateUrl: './scouting-new-player-dialog.component.html',
	styleUrls: ['./scouting-new-player-dialog.component.css']
})
export class ScoutingNewPlayerDialogComponent {
	@Input() visible: boolean = false;
	@Output() confirm: EventEmitter<{
		name: string;
		surname: string;
	}> = new EventEmitter<{ name: string; surname: string }>();
	@Output() close: EventEmitter<void> = new EventEmitter<void>();

	name: string = '';
	surname: string = '';

	onConfirm() {
		this.confirm.emit({ name: this.name, surname: this.surname });
	}

	discard() {
		this.close.emit();
	}
}

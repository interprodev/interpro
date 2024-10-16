import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PlayerScouting } from '@iterpro/shared/data-access/sdk';

@Component({
	selector: 'iterpro-scouting-notes',
	template: `
		<iterpro-comment-threaded [comments]="player.notesThreads" [editMode]="true" (onUpdate)="update($event)" />
	`,
	styleUrls: ['./scouting-notes.component.css']
})
export class ScoutingNotesComponent {
	@Input() player: PlayerScouting;
	@Input() editMode: boolean;
	@Output() onSavePlayer: EventEmitter<PlayerScouting> = new EventEmitter<PlayerScouting>();

	update(comments: Comment[]) {
		this.player.notesThreads = comments;
		this.onSavePlayer.emit(this.player);
	}
}

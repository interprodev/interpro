import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	standalone: true,
	name: 'playerTacticClass'
})
export class PlayerTacticClassPipe implements PipeTransform {
	transform(
		coordinates: { x: number; y: number },
		isSelected: boolean,
		isDisabled: boolean,
		isHighlighted: boolean
	): string {
		let playerClass = 'player-card';
		const rowClass: string = coordinates?.x !== undefined ? `player-row-${String(coordinates?.x)}` : '';
		const colClass: string = coordinates?.y !== undefined ? `player-col-${String(coordinates?.y)}` : '';

		if (rowClass !== '' && colClass !== '') {
			playerClass = `${playerClass} on-field-player-card ${rowClass} ${colClass}`;
		}
		if (isSelected) {
			playerClass = `${playerClass} player-card-selected`;
		}
		if (isDisabled) {
			playerClass = `${playerClass} player-card-disabled`;
		}
		if (isHighlighted) {
			playerClass = `${playerClass} player-card-highlighted`;
		}

		return playerClass;
	}
}

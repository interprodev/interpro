import { Injectable } from '@angular/core';
import { Event } from '@iterpro/shared/data-access/sdk';

export enum ColorEventPalette {
	general = '#0078D7',
	travel = '#e6addb',
	training = '#00CC6A',
	game = '#FF4343',
	assessment = '#b0bec5',
	friendly = '#FF8C00',
	administration = '#7f8c8d',
	medical = '#9b59b6',
	off = '#847545',
	international = '#00B7C3',
	clubGame = '#00B7C3',
	gym = '#018574',
	reconditioning = '#f1c40f',
	recovery = '#add8e6'
}

@Injectable({
	providedIn: 'root'
})
export class EventPaletteService {
	getColor(format: string): string {
		return ColorEventPalette[format];
	}

	getEventColor(event: Event): string {
		switch (event.format) {
			case 'training':
				return this.getTrainingEventColor(event.theme);
			case 'game':
				return event.subformat === 'friendly' ? ColorEventPalette.friendly : ColorEventPalette.game;
		}
		return this.getColor(event.format) || '#0078D7';
	}

	private getTrainingEventColor(theme: string): string {
		return ['gym', 'reconditioning', 'recovery'].indexOf(theme) > -1
			? this.getColor(theme)
			: ColorEventPalette.training;
	}
}

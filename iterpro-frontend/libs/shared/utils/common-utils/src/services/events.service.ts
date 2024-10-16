import { Injectable, inject } from '@angular/core';
import { Event, InjuryApi } from '@iterpro/shared/data-access/sdk';

const dateActive = (from: Date, to: Date) => ({
	date: { lte: to },
	or: [{ endDate: null }, { endDate: { gte: from } }]
});

@Injectable({
	providedIn: 'root'
})
export class EventsService {
	readonly #injuryApi = inject(InjuryApi);

	findInjuries(playerIds: string[], from: Date, to: Date, fields?: string[]) {
		const toReturn: any = {
			where: {
				playerId: {
					inq: playerIds
				},
				...dateActive(from, to)
			},
			order: 'start ASC',
			include: ['player']
		};
		if (fields) toReturn['fields'] = fields;
		return this.#injuryApi.find(toReturn);
	}

	getEvents(events: Event[]) {
		const international = events.filter(({ format }) => format === 'international');
		const trainings = events.filter(({ format, _sessionImport }) => format === 'training' && _sessionImport);
		const matches = events.filter(({ format, match }) => format === 'game' && match);

		return {
			events,
			international,
			trainings,
			matches
		};
	}
}

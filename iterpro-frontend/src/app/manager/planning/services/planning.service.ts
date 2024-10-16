import { Injectable } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Customer,
	Event,
	EventApi,
	InjuryApi,
	MedicalEvent,
	MedicalFieldType,
	MedicalTreatment,
	MedicalTreatmentApi,
	PlayerApi
} from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class PlanningService {
	constructor(
		private currentTeamService: CurrentTeamService,
		private eventApi: EventApi,
		private injuryApi: InjuryApi,
		private playerApi: PlayerApi,
		private medicalTreatmentApi: MedicalTreatmentApi
	) {}

	// From what I understood:
	// - before release date 10/18/2019 events was saved in local time
	// - after release date events are saved in utc time
	// - event.lastUpdateDate is stored only uploading CSV files to Planning
	// With this fix lastUpdateDate is stored even when an event is manually added
	// if lastUpdateDate is NOT present we assume that the insertion has been done before release date
	// convert dates with utc(false) for old dates, utc(true) for the new ones.

	fixEventDate(event: Event, format: string = 'MM/DD/YYYY HH:mm') {
		const switchReleaseDate = !event.csvGps && this.isUtc(event.lastUpdateDate);

		const start = moment(event.start).utc(switchReleaseDate).format(format);
		const end = moment(event.end).utc(switchReleaseDate).format(format);

		return { start, end };
	}

	isUtc(date: Date): boolean {
		return !!date && moment(date).isAfter(moment('10/18/2019 18:00', 'MM/DD/YYYY HH:mm'));
	}

	getEventList(start: Date, end: Date): Observable<Event[]> {
		const { id, teamSeasons } = this.currentTeamService.getCurrentTeam();

		const options = {
			where: {
				teamId: id,
				teamSeasonId: {
					inq: teamSeasons.map(season => season.id)
				},
				start: { lte: end },
				end: { gte: start }
			},
			fields: {
				_attachments: false,
				_drills: false,
				_drillsExecuted: false,
				_playerMatchStats: false,
				_sessionImport: false,
				_sessionPlayers: false
			}
			// include: [
			// {
			// 	relation: 'match',
			// 	scope: {
			// 		fields: ['id']
			// 	}
			// },
			// {
			// 	relation: 'testInstance',
			// 	scope: {
			// 		fields: ['id']
			// 	}
			// }
			// ]
		};

		return this.eventApi.find(options);
	}

	getAdditionalInfo(event: Event): Observable<any> {
		switch (event.format) {
			case 'game':
				return this.eventApi.findById(event.id, {
					fields: { _playerMatchStats: true }
				});
			case 'medical': {
				const medicalField = event.medicalType as MedicalFieldType;
				switch (medicalField) {
					case 'exam':
						if (!event.injuryId) {
							return this.getCompletedMedicalExams(event as any, '_preventionExams', 'preventionExams');
						}
						return this.getCompletedMedicalExams(event as any, '_injuryExams', 'injuryExams');
					case 'treatment':
						return this.getCompletedMedicalTreatments(event as any);
					default:
						console.warn('medical field is not supported:', medicalField);
				}
				break;
			}
			default:
				return of(true);
		}
	}

	private getCompletedMedicalTreatments(event: MedicalEvent) {
		const medicalRequest$ = this.medicalTreatmentApi.find({
			where: {
				playerId: (event as any).playerIds[0],
				eventId: (event as any).id
			}
		});
		return medicalRequest$.pipe(
			switchMap((result: MedicalTreatment[]) => {
				event.medicalTreatments = result;
				return of(event);
			})
		);
	}

	private getCompletedMedicalExams(
		event: MedicalEvent,
		field: '_preventionExams' | '_injuryExams',
		eventField: 'preventionExams' | 'injuryExams'
	): Observable<Event> {
		const medicalRequest$ = !(event as any).injuryId
			? this.playerApi.findById((event as any).playerIds[0], {
					fields: [field]
			  })
			: this.injuryApi.findById((event as any).injuryId, {
					fields: [field]
			  });
		return medicalRequest$.pipe(
			switchMap(result => {
				event[eventField] = result[field].filter(({ eventId }) => eventId === (event as any).id);
				return of(event as any);
			})
		);
	}

	syncDateRangeEvents(start: Date, end: Date): Observable<Event[]> {
		const { id } = this.currentTeamService.getCurrentTeam();
		return this.eventApi.syncPeriod(id, start, end);
	}

	getCustomerName(item: string, customers: Customer[]): string {
		if (item) {
			// item can be customer id or customer name
			const customer = (customers || []).find(({ id }) => id === item);
			return customer ? `${customer.firstName} ${customer.lastName}` : item;
		}
	}
}

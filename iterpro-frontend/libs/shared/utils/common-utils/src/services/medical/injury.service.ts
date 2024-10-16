import { Injectable } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Event,
	EventApi,
	Injury,
	InjuryApi,
	InjuryExam,
	LoopBackAuth,
	MedicalTreatment,
	MedicalTreatmentApi,
	Player,
	PlayerApi,
	PreventionExam,
	ResultWithQueueMessage
} from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { Observable, of } from 'rxjs';
import { exhaustMap, first } from 'rxjs/operators';
import { CalendarService } from '../calendar.service';

@Injectable({
	providedIn: 'root'
})
export class InjuryService {
	constructor(
		private injApi: InjuryApi,
		private eventApi: EventApi,
		private auth: LoopBackAuth,
		private playerApi: PlayerApi,
		private calendar: CalendarService,
		private translate: TranslateService,
		private currentTeamService: CurrentTeamService,
		private medicalTreatmentService: MedicalTreatmentApi
	) {}

	updateEvent(
		instance: MedicalTreatment | InjuryExam | PreventionExam,
		type: 'treatment' | 'exam',
		eventInjury: Injury,
		notify: boolean,
		player?: Player,
		isMultipleTreatment?: boolean
	) {
		const event: Partial<Event> = {
			id: instance.eventId,
			...this.getCommonForEvent(
				instance,
				!!isMultipleTreatment,
				type,
				eventInjury ? eventInjury.playerId : player?.id,
				eventInjury ? eventInjury.id : null
			)
		};
		return this.eventApi.saveEvent(event, notify);
	}

	createMultipleMedicalTreatmentEvent(
		instance: MedicalTreatment,
		multipleTreatments: boolean,
		player: Player,
		eventInjuryId: string
	): Observable<ResultWithQueueMessage> {
		const event: Partial<Event> = this.getCommonForEvent(
			instance,
			multipleTreatments,
			'treatment',
			player.id,
			eventInjuryId
		);
		return this.eventApi.saveEvent(event, true).pipe(
			first(),
			exhaustMap((result: ResultWithQueueMessage) => {
				return of(result);
			})
		);
	}

	createEventAndUpdateInstance(
		instance: MedicalTreatment | InjuryExam | PreventionExam,
		eventInjury: Injury,
		type: 'treatment' | 'exam',
		notify: boolean,
		player?: Player
	): Observable<any> {
		const event: Partial<Event> = {
			...this.getCommonForEvent(
				instance,
				false,
				type as 'treatment' | 'exam',
				eventInjury ? eventInjury.playerId : player?.id,
				eventInjury ? eventInjury.id : null
			)
		};
		return this.eventApi.saveEvent(event, notify).pipe(
			exhaustMap((result: ResultWithQueueMessage) => {
				instance.eventId = result.result.id;
				if (type === 'treatment') {
					return this.medicalTreatmentService.patchAttributes(instance.id, { eventId: result.result.id });
				} else {
					return !eventInjury
						? this.playerApi.updateByIdPreventionExams(player?.id, instance.id, instance)
						: this.injApi.updateByIdInjuryExams(eventInjury.id, instance.id, instance);
				}
			})
		);
	}

	private getCommonForEvent(
		instance: MedicalTreatment | InjuryExam | PreventionExam,
		multipleTreatments: boolean,
		type: 'treatment' | 'exam',
		playerId: string,
		eventInjuryId: string
	): Partial<Event> {
		const instanceCategory = this.getMedicalEventCategory(multipleTreatments, instance, type);
		const instanceDate = instance.date;
		return {
			medicalType: type,
			injuryId: eventInjuryId,
			start: instanceDate,
			end: moment(instanceDate).add(30, 'minutes').toDate(),
			duration: 30,
			allDay: false,
			playerIds: [playerId],
			format: 'medical',
			author: this.auth.getCurrentUserId(),
			type: this.calendar.getGD(instanceDate),
			teamSeasonId: this.currentTeamService.getCurrentSeason()?.id,
			teamId: this.currentTeamService.getCurrentTeam().id,
			title: this.getMedicalEventTitle(multipleTreatments, instanceCategory || '', type)
		};
	}

	deleteEvent(id: string) {
		return this.eventApi.deleteEvent(id);
	}

	getMedicalEventCategory(
		multipleTreatments: boolean,
		instance: MedicalTreatment | PreventionExam | InjuryExam,
		type: 'exam' | 'treatment'
	): string | undefined {
		if (type === 'exam') return (instance as PreventionExam | InjuryExam)?.exam;
		return multipleTreatments ? undefined : (instance as MedicalTreatment)?.treatmentType;
	}

	getMedicalEventTitle(
		multipleTreatments: boolean,
		instanceCategory: string,
		type: 'exam' | 'treatment',
		currentEventTitle?: string
	): string {
		const availableTitles = [
			`Medical Exam: ${instanceCategory}`,
			`${this.translate.instant(`medical.prevention.multipleTreatments`)}`,
			`${this.translate.instant(
				`prevention.treatments.${instanceCategory === 'SeC' ? instanceCategory.toLowerCase() : instanceCategory}`
			)}`,
			'Medical treatment'
		];
		let result: string;
		if (type === 'exam') {
			result = availableTitles[0];
		} else if (multipleTreatments) {
			result = availableTitles[1];
		} else {
			result = instanceCategory ? availableTitles[2] : availableTitles[3];
		}
		if (currentEventTitle && currentEventTitle !== result && !availableTitles.includes(currentEventTitle)) {
			return currentEventTitle;
		}
		return result;
	}
}

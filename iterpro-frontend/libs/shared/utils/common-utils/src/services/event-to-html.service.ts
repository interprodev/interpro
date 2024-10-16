import { inject, Injectable } from '@angular/core';
import {
	Customer,
	Event,
	ExtendedPlayerScouting,
	MedicalEvent,
	MedicalFieldType,
	MedicalTreatment,
	Player,
	ScoutingGame
} from '@iterpro/shared/data-access/sdk';
import { CustomerNamePipe } from '@iterpro/shared/ui/pipes';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { getMomentFormatFromStorage } from '../utils/dates/date-format.util';
import { getGameDurationString } from '../utils/functions/scouting/utils';
import { getId } from '../utils/functions/utils.functions';
import { ConstantService } from './constant.service';
import { MedicalEventLabelsService } from './medical/medical-event-labels.service';

@Injectable({
	providedIn: 'root'
})
export class EventToHtmlService {
	private translateInstant;
	translate = inject(TranslateService);
	drillConstant = inject(ConstantService);
	customerNamePipe = inject(CustomerNamePipe);
	medicalEventService = inject(MedicalEventLabelsService);
	constructor() {
		this.translateInstant = this.translate.instant.bind(this.translate);
	}

	toHtml(event: Partial<Event | ScoutingGame>, players: Player[] | ExtendedPlayerScouting[], customers: Customer[]): string {
		return `<div class="event-tooltip"><table class="event-tooltip-table">${this.eventToText(
			event,
			players,
			customers
		)}</table></div>`;
	}

	private eventToText(
		event: Partial<Event | ScoutingGame>,
		players: Player[] | ExtendedPlayerScouting[],
		customers: Customer[]
	): string {
		switch ((event as Event).format as 'clubGame' | 'game' | 'training' | 'medical' | 'travel' | 'scoutingGame') {
			case 'clubGame':
			case 'game':
				return this.toEventGame(getEventWithPlayersGame(event as Event, players as Player[]));
			case 'training':
				return this.toEventTraining(getEventWithPlayers(event as Event, players as Player[]));
			case 'medical':
				return this.toEventMedical(getEventWithPlayers(event as Event, players as Player[]), customers);
			case 'travel':
				return this.toEventTravel(getEventWithPlayers(event as Event, players as Player[]));
			case 'scoutingGame':
				return this.toEventScoutingGame(getEventWithPlayersScoutingGame(event as ScoutingGame), customers);
			default:
				return this.toOtherEvent(getEventWithPlayers(event as Event, players as Player[]));
		}
	}

	//#region Common

	private toOtherEvent(event: Partial<Event>): string {
		return `
			${this.formatDate(event)}
			${getValue(event, 'description', this.translateInstant('event.description'))}
      ${getValue(event, 'where', this.translateInstant('event.where'))}
			${getValueIfExists(event, 'players', this.translateInstant('Participants'))}
		`;
	}
	private toAuthor(event: Partial<Event>, customers: Customer[]): string {
		return `<tr><th>${this.translateInstant('tooltip.author')}:</th> <td>${this.customerNamePipe.transform(
			event.author as string,
			customers
		)}</td></tr>`;
	}

	private formatDate(event: Partial<Event>): string {
		const dateFormat = `${getMomentFormatFromStorage()} HH:mm`;
		const start = moment(event.start, dateFormat).format(dateFormat);
		const duration = getGameDurationString((event as any).startTime, (event as any).endTime);
		const end = event.end
			? moment(event.end, dateFormat).format('HH:mm')
			: moment(event.start, dateFormat).add(duration, 'minutes').format('HH:mm');
		return `<tr><th>${this.translateInstant('Date')}:</th> <td>${start} - ${end}</td></tr>`;
	}

	private getEventDuration(event: Partial<Event>): string {
		return `<tr><th>${this.translateInstant('event.duration')}:</th> <td>${
			event.duration ? `${moment.duration(event.duration, 'minutes').humanize()}` : ``
		}</td></tr>`;
	}

	private base(event: Partial<Event | ScoutingGame>): string {
		return `
      <h4>${event instanceof ScoutingGame ? this.getScoutingGameTitle(event) : this.getEventTitle(event as Event)}</h4>
      ${this.formatDate(event as Event)}
    `;
	}

	private getEventTitle(event: Partial<Event>): string {
		return event.title || '';
	}

	private getScoutingGameTitle(game: ScoutingGame): string {
		return (
			game.title || `${game.homeTeam || ''}${!game.homeTeam && !!game.awayTeam ? ' - ' : ''}${game.awayTeam || ''}`
		);
	}
	//endregion

	//region Game
	private toEventGame(event: Partial<Event>): string {
		return `
			${this.formatDate(event)}
			${getValue(event, 'opponent', this.translateInstant('event.opponent'))}
			${homeOrAway(event, this.translateInstant)}
			${getValue(event, 'result', this.translateInstant('matchAnalysis.result'))}
			${getValueIfExists(event, 'players', this.translateInstant('Participants'))}
		`;
	}
	//endregion

	//region Training
	private toEventTraining(event: Partial<Event>): string {
		return `
			${this.formatDate(event)}
			${this.getTrainingTheme(event, 'getEventTheme')}
			${this.getTrainingSubTheme(event, 'getFieldThemeList')}
			${this.getTrainingWorkload(event)}
			${this.getEventDuration(event)}
			${getValueIfExists(event, 'players', this.translateInstant('Participants'))}
		`;
	}

	private getTrainingTheme(event: Partial<Event>, getter: string): string {
		let message = `<tr><th>${this.translateInstant('event.theme')}</th><td>`;
		const theme = (this.drillConstant as any)[getter]().find((c: any) => c.value === event.theme);
		if (theme?.label) message = `${message} ${this.translateInstant(theme.label)}`;
		return `${message}</td></tr>`;
	}

	private getTrainingSubTheme(event: Partial<Event>, getter: string): string {
		let message = `<tr><th>${this.translateInstant('event.subtheme')}:</th><td>`;
		if (event.theme === 'field' && event.subtheme) {
			const subTheme = (this.drillConstant as any)[getter]().find((c: any) => c.value === event.subtheme);
			message = `${message} ${this.translateInstant(subTheme.label)}`;
		}
		return `${message}</td></tr>`;
	}

	private getTrainingWorkload(event: Partial<Event>): string {
		return `<tr><th>${this.translateInstant('event.workload')}:</th> <td>${
			event.workload ? `${this.translateInstant('event.effort.' + event.workload)}` : ``
		}</td></tr>`;
	}
	//endregion

	//#region Travel
	private toEventTravel(event: Partial<Event>): string {
		return `
			${this.formatDate(event)}
			${getValue(event, 'destination', this.translateInstant('event.destination'))}
			${this.getEventDuration(event)}
			${getValueIfExists(event, 'players', this.translateInstant('Participants'))}
		`;
	}
	//endregion

	//#region Medical
	private toEventMedical(event: Event, customers: Customer[]): string {
		return `
			${this.formatDate(event)}
			${this.toTreatmentType(event as any)}
      ${this.toTreatmentDescription(event as any)}
      ${this.toTreatment(event as any)}
      ${this.toAuthor(event, customers)}
			${getValueIfExists(event, 'players', this.translateInstant('Participants'))}
		`;
	}
	private toTreatmentType(event: MedicalEvent): string {
		let elements: unknown[] = [];
		let basicLabel;
		if (((event as any).medicalType as MedicalFieldType) === 'treatment') {
			elements = event.medicalTreatments || [];
			basicLabel = this.translateInstant('prevention.treatments.type');
		} else {
			elements = event.injuryExams || event.preventionExams || [];
			basicLabel = this.translateInstant('prevention.treatments.type');
		}
		if (elements?.length > 1) {
			return `<tr><th>${basicLabel}:</th> <td>${this.translateInstant(
				'medical.prevention.multipleTreatments'
			)}</td></tr>`;
		}
		const label =
			elements?.length === 1
				? this.medicalEventService.getTreatmentType((event as any).medicalType as MedicalFieldType, elements[0])
				: undefined;
		return `<tr><th>${basicLabel}:</th> <td>${label || ''}</td></tr>`;
	}

	private toTreatmentDescription(event: MedicalEvent): string {
		let elements: unknown[] = [];
		let basicLabel;
		if (((event as any).medicalType as MedicalFieldType) === 'treatment') {
			elements = event.medicalTreatments || [];
			basicLabel = this.translateInstant('category');
			basicLabel =
				elements?.length === 1 && this.isMedicalSupplement(elements[0] as MedicalTreatment)
					? this.translateInstant('prevention.treatments.dose')
					: this.translateInstant('category');
		} else {
			elements = event.injuryExams || event.preventionExams || [];
			basicLabel = this.translateInstant('prevention.treatments.description');
		}
		if (elements?.length > 1) {
			return `<tr><th>${basicLabel}:</th> <td>${this.translateInstant(
				'medical.prevention.multipleTreatments'
			)}</td></tr>`;
		}
		const label =
			elements?.length === 1
				? this.medicalEventService.getTreatmentCategory(elements[0], (event as any).medicalType as MedicalFieldType)
				: undefined;
		return `<tr><th>${basicLabel}:</th> <td>${label || ''}</td></tr>`;
	}

	private toTreatment(event: MedicalEvent) {
		let elements: unknown[] = [];
		let basicLabel;
		if (((event as any).medicalType as MedicalFieldType) === 'treatment') {
			elements = event.medicalTreatments || [];
			basicLabel =
				elements?.length === 1 && this.isMedicalSupplement(elements[0] as MedicalTreatment)
					? this.translateInstant('prevention.treatments.drug')
					: this.translateInstant('prevention.treatments.treatment');
		} else {
			elements = event.injuryExams || event.preventionExams || [];
			basicLabel = this.translateInstant('medical.infirmary.exam.exam');
		}
		if (elements?.length > 1) {
			return `<tr><th>${basicLabel}:</th> <td>${this.translateInstant(
				'medical.prevention.multipleTreatments'
			)}</td></tr>`;
		}
		const label =
			elements?.length === 1
				? this.medicalEventService.getTreatmentName(elements[0], (event as any).medicalType as MedicalFieldType)
				: undefined;
		return `<tr><th>${basicLabel}:</th> <td>${label || ''}</td></tr>`;
	}

	private isMedicalSupplement(treatment: MedicalTreatment): boolean {
		return treatment.treatmentType === 'medicationSupplements';
	}

	//endregion

	//#region ScoutingGame

	private toEventScoutingGame(game: ScoutingGame, customers: Customer[]): string {
		return `
      ${this.base(game)}
			${this.getAssignedToLabels(game, customers)}
      ${getValue(game, 'location', this.translateInstant('event.where'))}
      ${getValueIfExists(game, 'players', this.translateInstant('Participants'))}
		`;
	}

	private getAssignedToLabels(game: ScoutingGame, customers: Customer[]): string {
		return `<tr><th>${this.translateInstant('scouting.assignedTo')}:</th><td>${
			(game.assignedTo || [])
				.map((customerId: string) => this.customerNamePipe.transform(customerId, customers))
				.join(', ') || ''
		}</td></tr>`;
	}
	//endregion
}

//region Utils
const getValue = (event: Partial<Event | ScoutingGame>, key: string, label: string) =>
	`<tr><th>${label}:</th> <td>${(event as any)[key] || ``}</td></tr>`;
const getValueIfExists = (event: Partial<Event | ScoutingGame>, key: string, label: string): string =>
	(event as any)[key] ? `<tr><th>${label}:</th> <td>${(event as any)[key]}</td></tr>` : '';

const getEventWithPlayers = (event: Partial<Event>, players: Player[]): any =>
	event?.playerIds?.length
		? {
			...event,
			players: event.playerIds
				.map(playerId => {
					const player = players.find(item => getId(item) === playerId);
					return player ? `${player.displayName}` : ``;
				})
				.join(', ')
		}
		: event;

const getEventWithPlayersGame = (event: Partial<Event>, players: Player[]): any =>
	event._playerMatchStats?.length && event.playerIds?.length
		? {
			...event,
			players:
				'' +
				event._playerMatchStats
					.filter(({ enabled }) => enabled)
					.map(({ playerId, minutesPlayed }) => {
						const player = players.find(({ id }) => id === playerId);
						return player ? `${player.displayName}${minutesPlayed ? ` (${getMinutes(minutesPlayed)})` : ``}` : ``;
					})
					.join(', ')
		}
		: event;

const getEventWithPlayersScoutingGame = (event: ScoutingGame) =>
	event.gameReports?.length
		? {
			...event,
			players: '' + event.gameReports.map(({ displayName }) => displayName).join(', ')
		}
		: event;
const getMinutes = (minutesPlayed: number) => minutesPlayed || '';

const homeOrAway = (event: Partial<Event>, t: (key: string) => string) => {
	if (event.home === true) return `<tr><th>${t('Home/Away')}:</th> <td>${t('sidebar.homeValue')}</td></tr>`;
	return `<tr><th>${t('Home/Away')}:</th> <td>${t('sidebar.awayValue')}</td></tr>`;
};

//endregion

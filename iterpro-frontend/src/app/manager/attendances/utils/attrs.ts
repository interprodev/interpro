import { Event } from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment';
import { AttendancesItem } from 'src/app/+state/attendances-store/ngrx/attendances-store.model';
/**
 * Theme can be null for some events.
 * User can create a gym event without including any players and this event can be seen on attendance.
 * 1 gym (switch case) =>  event for gym
 * 2 gymSession (function called when ) => event for gym and the player has included in that event.
 *
 * User can have gym events without the interested player included and gym events with the interested player include same for training and game.
 *
 * we dont need priority for 'double session' so not defined here.
 * Higher priority is what is shown first on UI. Attendace UI has a priority mechanism that decides what colour to show over the others one.
 *
 * The trainings lia in two categories...
 * 1) type = event
 *      Event Training is an event for the team in that day.
 * 2) type = sessions
 *      Training sessions is when the event training has been also done by the player. For example multiple times training taken double sessions.
 * getTrainingSessionAttrs() is called when sessions training referred.
 */
export const palette = [
	'#0078D7',
	'#f1c40f',
	'#00CC6A',
	'#FF4343',
	'#FF8C00',
	'#018574',
	'#7f8c8d',
	'#9b59b6',
	'#847545',
	'#add8e6',
	'#00B7C3',
	'#e6addb'
];

// represents no event.
export const getNullAttrs = day => ({
	type: 'null',
	priority: 0,
	color: 'rgba(51, 51, 51, 0.48)',
	text: '',
	tooltip: null,
	legend: null,
	day
});

//  Event that are in today date
export const getTodayAttrs = () => ({
	type: 'null',
	priority: 1.0,
	color: '#585c5d',
	text: '',
	tooltip: 'Today',
	legend: 'today'
});

// All type of events
export const getEventAttrs = (event: Partial<Event>) => {
	const attrs = {
		type: 'event',
		color: null,
		priority: 1,
		tooltip: null,
		legend: null, // Used in CVS inports to find out the type of event/sessions(game/training)/injury
		text: ''
	};
	switch (event.format) {
		case 'off':
			attrs.color = palette[8];
			attrs.priority = 1.1;
			attrs.tooltip = 'OFF';
			attrs.legend = 'off';
			break;
		case 'international':
			attrs.color = palette[10];
			attrs.priority = 1.2;
			attrs.tooltip = 'International Duty';
			attrs.legend = 'international';
			break;
		case 'gym':
			attrs.color = palette[5];
			attrs.priority = 1.3;
			attrs.tooltip = 'Gym';
			attrs.legend = 'gym';
			break;
		case 'training':
			attrs.color = palette[2];
			attrs.priority = 1.4;
			attrs.tooltip =
				`${moment(event.start).format('HH:mm')}` + ' Training Event: (' + `${event.duration || '-'} min` + ')'; // Event Training is an event for the team in that day.
			attrs.legend = 'training'; // simple training event
			break;
		case 'friendly': // detailed in scheme
			attrs.color = palette[4];
			attrs.priority = 1.5;
			attrs.tooltip = 'Friendly';
			attrs.legend = 'friendly';
			break;
		// case 'game':
		// 	attrs.type = 'game';
		// 	attrs.color = palette[3];
		// 	attrs.priority = 1.6;
		// 	break;
		default:
			attrs.color = 'rgba(51, 51, 51, 0.48)';
			attrs.priority = 0.9;
			attrs.legend = '';
			break;
	}
	return attrs;
};
export const createTrainingTooltip = (session): string =>
	session &&
	`${moment(session.start).format('HH:mm')} Field ${session.splitName}, ${
		session.individual ? ' Individual' : session.dirty ? ' Modified ' : ' Team'
	} (${Number(session.duration).toFixed(0) || '-'} min)`;

// This is called when a player is added to the existing training event. while planning for any future events, it's possible to create a training event and not tagging players to it.
// Called via Double sessions training(∗∗) or training modified(∗)
export const getTrainingSessionAttrs = (session): AttendancesItem => ({
	type: 'sessions',
	priority: 2,
	color: palette[2],
	text: session?.individual ? 'I' : session?.dirty ? 'M' : '', // Using '∗' star  instead of '*'
	tooltip: createTrainingTooltip(session),
	legend: 'sessionstraining'
});

// This is game event. Not part of getEventAttrs() because we need more details here.
export const getGameAttrs = (session: Event, duration: number): AttendancesItem => ({
	type: 'game',
	priority: 2.1,
	color: palette[3],
	text: !!session && !!duration ? Number(duration).toFixed(0) : '',
	minutes: !!session && !!duration ? Number(duration).toFixed(0) : '',
	tooltip: session ? `${moment(session.start).format('HH:mm')} Game, ${session.title}, (${duration || '-'} min)` : '',
	legend: 'game'
});

export const getClubGameSessionAttrs = (session: Event, duration: number): AttendancesItem => ({
	type: 'clubGame',
	priority: 2.1,
	color: palette[10],
	text: session ? (duration ? Number(duration).toFixed(0) : '') : ' min ',
	minutes: !!session && !!duration ? Number(duration).toFixed(0) : '',
	tooltip: session
		? `${moment(session.start).format('HH:mm')} Club Game, ${session.title}, (${duration || '-'} min)`
		: '',
	legend: 'clubGame'
});

// GameSessions is deprecated for now. Not used.
// TODO: if it is deprecated, remove everywhere! (btw: it is used indeed)
export const getGameSessionAttrs = (session: Event): AttendancesItem => ({
	type: 'game',
	priority: 2.1,
	color: palette[3],
	text: session ? session.duration.toFixed(0) : ' min ',
	minutes: session ? session.duration.toFixed(0) : '0',
	tooltip: 'Game Sessions ',
	legend: 'game'
});

// Detailed in scheme. friendly for that day and player has partecipated to that friendly
export const getFriendlyAttr = (duration: number): AttendancesItem => ({
	type: 'friendly',
	priority: 2.1,
	color: palette[4],
	text: duration ? Number(duration).toFixed(0) : '',
	minutes: duration ? Number(duration).toFixed(0) : '',
	tooltip: `Friendly Game (${duration || '-'} min)`,
	legend: 'friendly'
});

export const createGymTooltip = (session): string =>
	session &&
	`${moment(session.start).format('HH:mm')} Gym ${session.splitName}, (${
		Number(session.duration).toFixed(0) || '-'
	} min)`;

// This is called when a player is added to the existing gym event. while planning for any future events, it's possible to create a gym event and not tagging players to it.
export const getGymSessionAttrs = (session): AttendancesItem => ({
	type: 'sessions',
	priority: 2.1,
	color: palette[5],
	text: session && session.dirty === true ? 'M' : '', // Using '∗' star  instead of '*'
	tooltip: createGymTooltip(session),
	legend: 'gym'
});

// Injury having the highest priority
export const getInjuryAttrsByStatus = (status: string): AttendancesItem => {
	const attrs = {
		type: 'injury',
		color: '#551A8B',
		priority: 3,
		text: '',
		tooltip: null,
		legend: null
	};
	switch (status) {
		case 'medical.infirmary.details.statusList.assessment':
			attrs.priority = 3;
			attrs.text = '?';
			attrs.tooltip = ' Assessment ';
			attrs.legend = 'assessment';
			break;
		case 'medical.infirmary.details.statusList.therapy':
			attrs.priority = 3;
			attrs.text = '✚';
			attrs.tooltip = ' Therapy ';
			attrs.legend = 'therapy';
			break;
		case 'medical.infirmary.details.statusList.rehab':
			attrs.priority = 3;
			attrs.tooltip = ' Rehab ';
			attrs.legend = 'rehab';
			break;
		case 'medical.infirmary.details.statusList.reconditioning':
			attrs.priority = 3;
			attrs.color = 'linear-gradient(to bottom right, #551a8b 0%,#551a8b 50%,#b19dc4 51%,#B19DC5 100%)';
			attrs.tooltip = ' Reconditioning ';
			attrs.legend = 'reconditioning';
			break;
		case 'medical.infirmary.details.statusList.returnToPlay':
		case 'medical.infirmary.details.statusList.returnToGame':
			attrs.priority = 3;
			attrs.color = '#b19dc4';
			attrs.tooltip = ' Return To Game ';
			attrs.legend = 'returnToPlay';
	}
	return attrs;
};

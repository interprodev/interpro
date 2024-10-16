import { Event } from '../../../lib';

export interface CalendarEventMouseOver {
	element: HTMLElement;
	event: Event;
}

export enum PlanningViewType {
	Calendar = 1,
	Plan = 2,
	EventDetail = 3
}

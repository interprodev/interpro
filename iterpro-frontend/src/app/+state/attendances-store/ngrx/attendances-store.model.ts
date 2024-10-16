import { Event, Player } from '@iterpro/shared/data-access/sdk';

export interface AttendancesDay {
	items: AttendancesItem[];
	current: AttendancesItem;
	minutes?: string;
}

export interface AttendancesItem {
	type: string;
	priority: number;
	color: string;
	text: string;
	tooltip: any;
	legend: any;
	current?: AttendancesItem;
	minutes?: string;
	// TODO: sort out that "attendance" mess! change app\manager\attendances\utils\attendance.ts
	attendance?: any; // SessionPlayerData[] | Event | Injury
	event?: Event;
	day?: number;
}

export interface AttendancesStore {
	id: string;
	player: Player;
	days: AttendancesDay[];
}

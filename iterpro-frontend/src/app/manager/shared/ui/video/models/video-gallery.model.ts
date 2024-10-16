import { FormattedDate, Opponent } from '@iterpro/shared/data-access/sdk';

export enum GalleryNavigation {
	CURRENT = 0,
	NEXT = 1,
	PREVIOUS = -1
}

export interface ActiveFilterControls {
	text?: boolean;
	home?: boolean;
	away?: boolean;
	tags?: boolean;
	players?: boolean;
	// staffs?: boolean;
	opponents?: boolean;
	date?: boolean;
}
export interface FilterStatus {
	text: string;
	home: boolean;
	away: boolean;
	tags: string[];
	players: string[];
	// staffs: string[];
	opponents: Opponent[];
	dates: FormattedDate[];
}

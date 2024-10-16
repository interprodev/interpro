export interface TeamPerformanceReport {
	notes: string;
	notesHistory: PlayerReportHistory[];
	notesShareWithPlayers: boolean;
}

export interface PlayerReportHistory {
	updatedAt: Date;
	author: string;
}

export function emptyTeamPerformanceReport(): TeamPerformanceReport {
	return {
		notes: null,
		notesHistory: [],
		notesShareWithPlayers: false
	};
}

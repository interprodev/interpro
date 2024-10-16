import {
	PdfBase,
	PdfBasicType,
	PdfMixedTable,
	StatsResult,
	TeamPerformanceReport
} from '@iterpro/shared/data-access/sdk';

export interface EventGamePDFReport extends PdfBase {
	headers: {
		overview: string;
		matchStats: string;
		myTeamTable: string;
		opponentTable: string;
		myTeamGameReport: string;
		myTeamGameReportTable: string;
	};
	summary: (PdfBasicType & { colspan?: number })[][];
	matchInfo: PdfMatchInfo;
	matchStats: StatsResult[];
	myTeamTable: PdfMixedTable;
	opponentTable: PdfMixedTable;
	myTeamGameReport: TeamPerformanceReport;
	myTeamGameReportTable: PdfMixedTable;
}

export interface PdfMatchInfo {
	home: {
		team: string;
		score: number;
		imageDataURL: string;
	};
	away: {
		team: string;
		score: number;
		imageDataURL: string;
	};
}

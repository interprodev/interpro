import { ChartOptions } from 'chart.js';
import { MixedType, PdfMixedTable } from '../pdf-report/pdf-report';

export interface ScoutingMapping {
	associatedScoutingId: string;
	associatedPosition: number;
}

export interface ScoutingPlayerEntireProfileReportModel {
	currentTeamHeader: CurrentTeamHeader;
	headers: Headers;
	general: BasicItems;
	deal: BasicItems;
	attributes: BasicItems;
	preferredMoves: BasicItems;
	gameReportsTable: GameReportsTable;
	attributesTable: AttributesTable[];
	position: any;
	description: string;
	strenghts: string;
	weaknesses: string;
	chart: {
		data: { labels: any[]; datasets: any[] };
		options: ChartOptions;
	};
	careerTable: PdfMixedTable;
}

interface CurrentTeamHeader {
	team: { value: string };
	logo: string;
	playerImg: string;
	player: string;
}

interface Headers {
	general: string;
	deal: string;
	attributes: string;
	playerReport: string;
	preferredMoves: string;
	description: string;
	strenghts: string;
	weaknesses: string;
	development: string;
	career: string;
}

interface BasicItems {
	items: { label: string; value: string }[];
}

export interface GameReportsTable {
	headers: MixedType[];
	rows: MixedType[][];
}

export interface AttributesTable {
	header: string;
	value: string | number;
	color: string;
	dForSvg?: string;
	items: MixedType[];
}

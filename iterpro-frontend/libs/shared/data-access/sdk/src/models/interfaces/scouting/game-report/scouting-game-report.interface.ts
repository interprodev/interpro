import { Attachment, Customer, PlayerScouting, ScoutingGame, ScoutingGameReport } from '../../../../lib';
import { PlayerToStartObserveInfo, ScoutingSettings, ScoutingSurvey } from '../common.interface';
import { TeamGender } from '../../team/team.interface';
import { ProviderType } from '../../etl/interfaces';
import { Schema } from '../../custom-report-templates/schema/schema';
import { PlayerReportHistory } from '../../custom-report-templates/performance-report-common';

export interface ReportDataColumn {
	key: string;
	label: string;
	value?: any;
	type?: 'colorType' | 'pointType' | 'booleanType';
	color?: string;
}

export interface ReportDataAvg {
	sectionId?: string;
	key: string;
	label: string;
	avg?: any;
	color?: string;
	tooltip?: string;
	max?: number; // property max of range
	description?: string; // property description
}

export type ScoutingGameReportWithAttributes = ScoutingGameReport & {
	performance: number;
	potential: string;
	prognosis: string;
	survey: ScoutingSurvey;
};

export type ScoutingGameReportWithPlayer = ScoutingGameReportWithAttributes & {
	playerScouting: PlayerScouting;
	tempObserved: boolean;
	index: number;
	template: Schema;
};

export interface ScoutingGameWithReport extends ScoutingGame, ScoutingGameReportWithPlayer {
	author: any;
}
export type ScoutingColumnVisibility = Record<'general' | 'deal' | 'attributes' | 'reportData', string[]>;
export type AttributeColor = 'green' | 'yellow' | 'red' | '#dddddd';
export type AttributeChar = 'A' | 'B' | 'C' | '-';
export type AttributeNumber = number | '-';

// watford custom types
export type OverallGradeOption = 'A' | 'B' | 'C' | 'D';
export type PotentialGradeOption = OverallGradeOption;
export type PerformanceGradeOption = 1 | 2 | 3 | 4;
export type PotentialForOption = 'Watford' | 'Udinese' | 'Both';
export type RecommendationOption = 'Sign' | 'Sign – Squad Rotation' | 'Monitor / Watch Again' | 'Monitor' | 'Forget';

export interface WithTooltip<T> {
	value: T;
	tooltip: string;
}

export interface ExtendedPlayerScouting extends PlayerScouting {
	birthYear?: string;
	wageRange?: string;
	feeRange?: string;
	associatedPlayerName?: string;
	offensive?: string;
	defensive?: string;
	attitude?: string;
	archivedStatus?: 'bonus.active' | 'bonus.archived';
	performance?: string;
	potential?: AttributeChar;
	prognosis?: AttributeChar;
	prognosisColor?: AttributeColor;
	prognosisTooltip?: string;
	performanceColor?: string;
	potentialColor?: AttributeColor;
	// watford props
	overallGrade?: WithTooltip<OverallGradeOption>;
	performanceGrade?: WithTooltip<PerformanceGradeOption>;
	potentialFor?: WithTooltip<PotentialForOption>;
	potentialGrade?: WithTooltip<PotentialGradeOption>;
	recommendation?: WithTooltip<RecommendationOption>;
	reportDataAvg?: ReportDataAvg[];
	reportDataAvgFlatted?: any[];
	lastGameReportDate?: Date;
	lastGameReportAuthor?: string;
	gameReportsNumber?: number;
	lastGameReportTeams?: string;
	selectedAttributePlayerDescription?: string;
	selectedAttributeDate?: Date;
	selectedAttributeAuthor?: string;
	playerAttributes?: any; //{ value: string | number; color: string; backgroundColor: string };
}

export interface GameReportRow {
	id: string;
	start: Date;
	title: string;
	homeTeam: string;
	awayTeam: string;
	teams: [string, string];
	scoutId: string;
	scout: string; // scout name
	displayName: string;
	playerScoutingId: string;
	level: string;
	report: string;
	_documents: Attachment[];
	_videos: Attachment[];
	nationality: string;
	position: string;
	birthYear: number;
	competition: string;
	lastUpdate: string;
	lastUpdateAuthor: string;
	gameId: string;
	reportData?: any;
}

export type DateRange = [Date, Date];

export type ScoutingGameReportSettings = Pick<
	ScoutingSettings,
	'survey' | 'tipssSettings' | 'gameReport' | 'activeGameReportTemplateId'
>;

export type ScoutingGameReportAttachmentType = '_videos' | '_documents';

export interface ScoutingPlayerGamesTableRow {
	game: any;
	start: Date;
	assignedTo: string;
	opponent: string;
	location: string;
	level: string;
	_videos: Attachment[];
	_documents: Attachment[];
	report: string;
	author: string;
	completed: boolean;
	reportData?: any;
}

export interface ScoutingGameInit {
	game: ScoutingGame;
	isScoutingAdmin: boolean;
	hasScoutingGamePermission: boolean;
	isAdminOrUniqueScout: boolean;
	customer: ScoutingGameEssentialCustomer;
	customers: ScoutingGameEssentialCustomer[];
	settings: ScoutingGameEssentialSettings;
	existingScoutingPlayers: PlayerScouting[];
	playersToPredisposeReports: PlayerToStartObserveInfo[];
	sourceSection: GameReportSourceSection;
	teamGender: TeamGender;
}

export type GameReportSourceSection = 'calendar' | 'scoutingProfile' | 'scoutingGameReportList';

export type ScoutingGameEssentialCustomer = Pick<Customer, 'id' | 'firstName' | 'lastName'>;
export type ScoutingGameEssentialSettings = Pick<
	ScoutingSettings,
	'activeGameReportTemplateVersion' | 'activeGameReportTemplateId' | 'profileCreation'
>;

export interface DenormalizedScoutingGameFields {
	start: Date;
	assignedTo: string;
	homeTeam: string;
	awayTeam: string;
	history: PlayerReportHistory;
	title: string;
	thirdPartyProviderCompetitionId: number;
	thirdPartyProvider: ProviderType;
}

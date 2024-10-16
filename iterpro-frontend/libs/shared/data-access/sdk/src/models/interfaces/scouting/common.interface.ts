import { ThirdPartyPlayerStat, ThirdPartyTeamDataDetail } from './third-party/third-party-game-detail.interface';

export type TeamInfo = Pick<ThirdPartyTeamDataDetail, 'teamId' | 'teamName' | 'imageDataURL'>;

export interface FormationInfo {
	formation: ThirdPartyPlayerStat[];
	teamId: number;
	teamName: string;
}
export interface PlayerToStartObserveInfo {
	id: string;
	thirdPartyId: number;
}

export interface Question {
	name: string;
	translateLabel: string;
	label?: string;
	description: string;
	answer?: Answer;
}
export interface CustomQuestion {
	name: string;
	translateLabel?: string;
	label: string;
	description: string;
	answer?: Answer;
}

export type SurveyQuestion = Question | CustomQuestion;

export type Answer = 'yes' | 'no';

export type ScoutingSurvey = SurveyQuestion[];

/**
 * @author Piercarlo Serena
 * @author Adriano Costa
 *
 * @description
 * TODO: add total in tipssSetting object for customizing the calculation for the total metric (right now is the sum), similar to the workload setting expression editor
 *
 * @param scenario
 * what the scouting player are associated to ('roles' AC Milan customization | 'players' standard mode)
 * @param gameReport
 * what kind of report you can fill ('tipss' | 'standard')
 * @param playerDescription
 * which kind of attributes are used to describe a Player/PlayerScouting ('tipss' | 'attributes')
 * @param survey
 * whether you can fill a Survey for an Observed Player (both in GameReport and Attributes) ( true | false )
 * @param tipssSettings
 * array of TIPSS settings (available only if the club has TIPSS mode active to Game Report OR Player Description), a tipssSettings is an object with these props:
 * - enabled: collection with the enabled TIPSS;
 * - scale: 0-5 or 0-10;
 * - colorsMapping: array;
 * @param editableSettings
 * refers to which settings the club can edit from the platform (e.g. Scenario Mode will never be visible, as well as PlayerDescription, Survey and Game Report Modes for Swiss)
 **/
export interface ScoutingSettings {
	scenario: 'roles' | 'players';
	gameReport: GameReportType;
	playerDescription: 'tipss' | 'attributes';
	survey: SurveyType;
	tipssSettings: TipssSettings;
	profileCreation: string;
	editableSettings: Array<'gameReport' | 'playerDescription' | 'tipssSettings' | 'profileCreation'>;
	importLimit: number;
	archiveLimit: number;
	activeGameReportTemplateId: string;
	activeGameReportTemplateVersion: number;
}

/**
 * @author Piercarlo Serena
 * @author Adriano Costa
 *
 * @description
 * TIPSS settings (available only if the club has TIPSS mode active to Game Report OR Player Description), a tipssSettings is an object with these props:
 * @param enabled collection with the enabled TIPSS;
 * @param scale 0-5 (fiveDouble) or 0-10 (tenInt);
 * @param colorsMapping array of { min: number; max: number; color: string }
 *
 **/
export interface TipssSettings {
	enabled: Array<string>;
	scale: TipssScale;
	colorsMapping: ColorMapping[];
}

export interface ColorMapping {
	min: number;
	max: number;
	color: string;
}

export type SurveyType = 'none' | 'swiss';

export type GameReportType = 'tipss' | 'standard' | 'watford';

export type TipssScale = 'fiveDouble' | 'tenInt';

export interface GameReportColumn {
	header: string;
	width: string;
	frozen?: boolean;
	tooltip?: string;
	align?: 'left' | 'center' | 'right';
	required?: boolean;
	field?: string;
	type?: string;
	sortable: boolean;
}

export const levels = ['game.level.low', 'game.level.medium', 'game.level.high', 'game.level.elite'];

export interface PlayerScheduledGameModel {
	date: Date;
	label: string;
	matchId: number;
	competitionId: number;
	team: string; // teamName
	opponent: string; // opponentName
	home: boolean; // isHome
	result: string;
	location: string;
	played: boolean;
}

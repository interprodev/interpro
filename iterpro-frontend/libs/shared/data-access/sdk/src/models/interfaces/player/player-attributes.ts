import { Player, PlayerAttributesEntry, PlayerDescriptionEntry, PlayerScouting, Team } from '../../../lib';
import { ScoutingGameWithReport } from '../scouting/game-report/scouting-game-report.interface';

export interface PlayerAttribute {
	value: string;
	label: string;
	category: string;
	custom?: boolean;
	active?: boolean;
	description?: string;
}

export type AttributeCategory = 'offensive' | 'defensive' | 'attitude';
export type SwissAttributeCategory = 'tipss' | 'potential' | 'prognosis';
export type MixedAttributeCategory = AttributeCategory | SwissAttributeCategory;
export type PotentialLetter = '-' | 'C' | 'B' | 'A';
export const attributeAvgCategory: AttributeCategory[] = ['offensive', 'defensive', 'attitude'];

export const attributeCategories: { title: string; category: AttributeCategory }[] = [
	{ title: 'profile.attributes.offensive', category: 'offensive' },
	{ title: 'profile.attributes.defensive', category: 'defensive' },
	{ title: 'profile.attributes.attitude', category: 'attitude' }
];
export const swissAttributesCategories: { title: string; category: SwissAttributeCategory }[] = [
	{ title: 'home.performance', category: 'tipss' },
	{ title: 'scouting.survey.potential', category: 'potential' },
	{ title: 'prognosis', category: 'prognosis' }
];

export interface AdditionalFieldEntry {
	metric: string;
	metricName: string;
	metricDescription: string;
	value: number;
	category: AttributeCategory;
}

export interface StandardAttributes {
	offensive: PlayerAttribute[];
	defensive: PlayerAttribute[];
	attitude: PlayerAttribute[];
}

export interface PlayerReportEntriesEmitter {
	attributes?: PlayerAttributesEntry[];
	descriptions?: PlayerDescriptionEntry[];
	playerId: string;
}

//#region Player Attributes Compare
export interface PlayerAttributeCompareFilter {
	teams: Team[];
	showTeamAvg: boolean;
	ages: number[];
	birthSemester: number[];
	positions: string[];
	customersIds: string[];
	playerIds: string[];
	scoutingPlayerIds: string[];
}

export interface AttributesAvgItems {
	offensive: number;
	defensive: number;
	attitude: number;
}

export interface AttributesCompareItem {
	category: AttributeCategory;
	players: { id: string; displayName: string; value: number }[];
}


export type PlayerItem = Partial<Player> | Partial<PlayerScouting>;
//endregion

//#region Swiss Player Attributes Compare
export interface SwissPlayerAttributeCompareFilter {
	ages: number[];
	positions: string[];
	customersIds: string[];
	scoutingPlayerIds: string[];
}

export type ExtendedChartPoint = {
	x: number | string;
	y: number | string;
	v: Array<{ gameWithReport: ScoutingGameWithReport; title: string }>;
};

//endregion

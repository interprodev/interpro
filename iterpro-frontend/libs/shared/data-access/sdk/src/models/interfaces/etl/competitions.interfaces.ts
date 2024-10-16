import { SelectItem } from 'primeng/api';
import { TeamSeason } from '../../../lib';
import { DynamicType, ProviderType } from './interfaces';

export interface WyscoutCompetitionJson {
	wyId: number;
	name: string;
	gsmId?: number;
	area?: {
		id: number;
		alpha2code: string;
		alpha3code: string;
		name: string;
	};
	format?: string;
	type?: string;
	category?: string;
	gender?: string;
	divisionLevel?: number;
}

export interface CompetitionInfo {
	competition: string;
	season: string;
	lineup: string[];
	sync: boolean;
	name?: string; // Custom competition name
	manual?: boolean; // Custom competition flag
}

export interface InstatCompetitionJson {
	instatId: number | number[];
	name: string;
}

export type InstatTeamJson = {
	instatId: number;
	name: string;
};

export interface CompetitionConstantsInterface {
	initCompetitionList: () => void;
	initAreasList: () => void;
	getCompetitions: () => SelectItem[];
	getCompetitionFromJson: (id: number | string) => WyscoutCompetitionJson | InstatCompetitionJson;
	getCompetitionName: (value: string, season: TeamSeason) => string;
	getCompetitionsByAreas: (areaIds: string[]) => SelectItem[];
	getAllAreaIds: () => SelectItem<string>[];
}

export type CompetitionProviders = Record<Exclude<ProviderType, DynamicType>, CompetitionConstantsInterface>;

export interface WyscoutCompetitionSeasons {
	compId: number;
	seasons: WyscoutSeason[];
}
export interface WyscoutSeason {
	wyId: number;
	name: string;
	startDate: string;
	endDate: string;
	active: boolean;
	competitionId: number;
}

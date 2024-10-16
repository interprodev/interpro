export interface InStatTeam {
	instId: number;
	name: string;
	shortname: string;
}

export interface InStatPlayer {
	instId: string;
	firstName: string;
	lastName: string;
	imageDataURL: string;
	role: { code2: string; label: string };
	currentTeamId: number;
	currentTeamName: string;
	birthArea: any;
	passportArea: any;
	country1_id: string;
	country1_name: string;
	country2_id: string;
	country2_name: string;
	gender: string;
	foot_id: string;
	foot: string;

	is_national_team: string;

	national_number: string;
	national_team_id: string;
	national_team_name: string;

	position1_id: string;
	position1_name: string;
	position2_id: string;
	position2_name: string;
	position3_id: string;
	position3_name: string;

	index: string;
	ts: string;
}

export interface ParsedInStatPlayer extends InStatPlayer {
	instId: string;
	name: string;
	alreadyImported: boolean;
	alreadyImportedTeam?: string;
	img: string;
	transferValue: string;
	careerData: any[];
	position: string;
	loaded: boolean;
}

export interface WyscoutPlayerSearchResult {
	alreadyImported?: boolean; // This field is internal to the component
	alreadyImportedTeam?: string; // This field is internal to the component
	hasAdditionalInfo?: boolean; // This field is internal to the component
	birthArea: {
		id: number;
		alpha2code: string;
		alpha3code: string;
		name: string;
	};
	birthDate: Date;
	currentNationalTeamId: number;
	currentTeamId: number;
	firstName: string;
	foot: string;
	gender: string;
	height: number;
	imageDataURL: string;
	lastName: string;
	middleName: string;
	passportArea: {
		id: number;
		alpha2code: string;
		alpha3code: string;
		name: string;
	};
	role: {
		name: string;
		code2: string;
		code3: string;
	};
	shortName: string;
	status: string;
	weight: number;
	wyId: number;
	transferValue: number;
	img: string;
}

export interface WyscoutPlayerSearchResultAdditionalInfo extends WyscoutPlayerSearchResult {
	wyId: number;
	role: {
		name: string;
		code2: string;
		code3: string;
	};
	imageDataURL: string;
	currentTeam: WyscoutTeamSearchResult;
	wyscoutId: number;
	careerData: [];
}

export interface WyscoutTeamSearchResult {
	wyId: number;
	name: string;
	officialName: string;
	city: string;
	area: {
		id: number;
		alpha2code: string;
		alpha3code: string;
		name: string;
	};
	type: string;
	category: string;
	children: {
		name: string;
		wyId: number;
	}[];
	imageDataURL: string;
}

export interface AlreadyImportedPlayer {
	providerId: number;
	teamName: string;
}

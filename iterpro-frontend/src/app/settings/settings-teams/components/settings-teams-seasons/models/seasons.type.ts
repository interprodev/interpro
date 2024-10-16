import { ClubSeason, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { FormArray, FormControl, FormGroup } from '@angular/forms';

export type TeamSeasonEdit = Pick<TeamSeason, 'id' | 'name' | 'offseason' | 'preseason' | 'inseasonStart' | 'inseasonEnd' | 'clubSeasonId' | 'competitionInfo' |
 'wyscoutAreas' | 'wyscoutNationalLeague' | 'wyscoutNationalCup' | 'thirdPartyCredentials'
	/* last two only for National Club */
	| 'wyscoutTournamentQualifiers' | 'wyscoutTournamentFinalStages'
>;
export type ClubSeasonBasic = Pick<ClubSeason, 'id' | 'name' | 'start' | 'end'>;

export type TeamPreferenceSeasonForm = {
	details: FormGroup<TeamSeasonDetailsForm>
	competitions: FormGroup<TeamSeasonCompetitionsForm>
};

export type TeamSeasonDetailsForm = {
	id: FormControl<string>;
	name: FormControl<string>;
	offseason: FormControl<Date>;
	preseason: FormControl<Date>;
	inseasonStart: FormControl<Date>;
	inseasonEnd: FormControl<Date>;
	clubSeasonId: FormControl<string>;
	thirdPartyCredentials: FormGroup<ThirdPartyCredentialForm>;
}

export type TeamSeasonCompetitionsForm = {
	wyscoutAreas: FormControl<string[]>;
	wyscoutNationalLeague: FormControl<string>;
	wyscoutNationalCup: FormControl<string>;
	// National Club
	wyscoutTournamentQualifiers: FormControl<string>;
	wyscoutTournamentFinalStages: FormControl<string>;
	// end National Club
	selectedCompetitions: FormControl<number[]>;
	competitionInfo: FormArray<FormGroup<CompetitionInfoControl>>;
}
export type CompetitionInfoControl = {
	competition: FormControl<number | string>; // competition id
	lineup: FormControl<string[]>; // array of player ids
	season: FormControl<string>; // team season id
	sync: FormControl<boolean>; // sync events
	manual: FormControl<boolean>; // custom competition
	name: FormControl<string>; // custom competition name
}


export type ThirdPartyCredentialForm = {
	gpexeId: FormControl<string>;
}

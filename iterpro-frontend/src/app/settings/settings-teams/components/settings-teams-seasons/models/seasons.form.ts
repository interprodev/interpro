import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import {
	CompetitionInfoControl,
	TeamPreferenceSeasonForm,
	TeamSeasonCompetitionsForm,
	TeamSeasonDetailsForm
} from './seasons.type';
import { CompetitionInfo } from '@iterpro/shared/data-access/sdk';
import { cloneDeep } from 'lodash';

const valueDefault = {value: null, disabled: true};
// TODO add custom validators for dates
const teamSeasonDetailsForm: TeamSeasonDetailsForm = {
	id: new FormControl(valueDefault),
	name: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	inseasonStart: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	inseasonEnd: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	offseason: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	preseason: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	clubSeasonId: new FormControl(valueDefault, {
		nonNullable: true,
		validators: Validators.compose([Validators.required])
	}),
	thirdPartyCredentials: new FormGroup({
		gpexeId: new FormControl(valueDefault)
	})
}

function toTeamSeasonCompetitionsForm(competitionInfos: CompetitionInfo[]): TeamSeasonCompetitionsForm {
	return {
		wyscoutAreas: new FormControl(valueDefault),
		wyscoutNationalLeague: new FormControl(valueDefault),
		wyscoutNationalCup: new FormControl(valueDefault),
		// National Club
		wyscoutTournamentQualifiers: new FormControl(valueDefault),
		wyscoutTournamentFinalStages: new FormControl(valueDefault),
		// end National Club
		// @ts-ignore
		selectedCompetitions: new FormControl({value: (competitionInfos || []).map(({competition}) => competition), disabled: true}),
		competitionInfo: new FormArray((competitionInfos || []).map(item => new FormGroup(toCompetitionInfoControl(item))))
	}
}

export function toCompetitionInfoControl(competitionInfo: CompetitionInfo, disabled = true): CompetitionInfoControl {
	return {
		competition: new FormControl({value: competitionInfo?.competition, disabled}, Validators.required),
		season: new FormControl({value: competitionInfo?.season, disabled}),
		lineup: new FormControl({value: competitionInfo?.lineup || [], disabled}),
		sync: new FormControl({value: competitionInfo?.sync, disabled}),
		manual: new FormControl({value: competitionInfo?.manual, disabled}),
		name: new FormControl({value: competitionInfo?.name, disabled})
	}
}

export function toTeamPreferenceSeasonForm(competitionInfos: CompetitionInfo[]): TeamPreferenceSeasonForm {
	return {
		details: new FormGroup(cloneDeep(teamSeasonDetailsForm)),
		competitions: new FormGroup(toTeamSeasonCompetitionsForm(competitionInfos))
	}
}

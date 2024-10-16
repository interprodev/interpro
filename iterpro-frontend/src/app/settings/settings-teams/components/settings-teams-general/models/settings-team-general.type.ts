import { CustomerTeamSettings, Team } from '@iterpro/shared/data-access/sdk';
import { FormControl } from '@angular/forms';
import { TeamMetricType } from '../../settings-teams-metrics/models/settings-team-metrics.type';

//region Team Preference General
export type TeamPreferenceGeneralForm = {
	name: FormControl<string>;
	gender: FormControl<string>;
	landingPage: FormControl<string>;
	activeGameReportTemplate: FormControl<{ id: string; version: number }>;
	activeTrainingReportTemplate: FormControl<{ id: string; version: number }>;
};

export type TeamPreferenceGeneral = Pick<
	Team,
	'name' | 'gender' | 'landingPage' | 'gameReportSettings' | 'trainingReportSettings'
>;
//endregion

//region Team Preference User
export type TeamPreferenceUserForm = {
	landingPage: FormControl<string>;
};

export type TeamPreferenceUser = Pick<CustomerTeamSettings, 'landingPage'>;
//endregion

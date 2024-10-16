import { ScoutingSettings } from '@iterpro/shared/data-access/sdk';
import { FormControl, FormGroup } from '@angular/forms';

export type ClubPreferenceScoutingForm = {
	profileCreation: FormControl<string>;
	activeGameReportTemplate: FormControl<{id: string, version: number}>;
};

export type ClubPreferenceScouting = Pick<ScoutingSettings, 'profileCreation' | 'activeGameReportTemplateId' | 'activeGameReportTemplateVersion'>;

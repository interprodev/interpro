import { Club } from '@iterpro/shared/data-access/sdk';
import { FormControl, FormGroup } from '@angular/forms';

export type ClubPreferenceGeneralForm = {
	name: FormControl<string>;
	nation: FormControl<string>;
	crest: FormControl<string>;
	foundation: FormControl<Date>;
	landingPage: FormControl<string>;
};

export type ClubPreferenceGeneral = Pick<Club, 'id' | 'name' | 'nation' | 'crest' | 'foundation' | 'landingPage'>;

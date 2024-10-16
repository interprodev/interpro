import { ClubSeason, TransferWindow } from '@iterpro/shared/data-access/sdk';
import { FormArray, FormControl, FormGroup } from '@angular/forms';

export type ClubSeasonEdit = Pick<ClubSeason, 'id' | 'name' | 'start' | 'end'> & {_transferWindows: TransferWindowEdit[]};

export type TransferWindowEdit = Pick<TransferWindow, 'id' | 'name' | 'budget' | 'start' | 'end'>

export type ClubPreferenceSeasonForm = {
	id: FormControl<string>;
	name: FormControl<string>;
	start: FormControl<Date>;
	end: FormControl<Date>;
	_transferWindows: FormArray<FormGroup<TransferWindowForm>>
};

export type TransferWindowForm = {
	id: FormControl<string>;
	name: FormControl<string>;
	budget: FormControl<number>;
	start: FormControl<Date>;
	end: FormControl<Date>;
}

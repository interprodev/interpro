import { Club } from '@iterpro/shared/data-access/sdk';
import { FormControl } from '@angular/forms';

export type ClubPreferenceFinanceForm = {
	currency: FormControl<string>;
	taxes: FormControl<number>;
	vat: FormControl<number>;
	paymentFrequency: FormControl<string>;
};

export type ClubPreferenceFinance = Pick<Club, 'id' | 'currency' | 'taxes' | 'vat' | 'paymentFrequency'>;

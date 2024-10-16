import { Customer } from '@iterpro/shared/data-access/sdk';
import { FormControl } from '@angular/forms';

export type CustomerEdit = Pick<Customer, 'id' | 'firstName' | 'lastName' | 'email' | 'admin'>;


export type CustomerEditForm = {
	firstName: FormControl<string>;
	lastName: FormControl<string>;
	email: FormControl<string>;
	admin: FormControl<boolean>;
};


export interface CustomerEditInput {
	customer: CustomerEdit;
	currentUserAdmin: boolean;
	alreadyUsedFirstNames: string[];
	alreadyUsedLastNames: string[];
	alreadyUsedEmails: string[];
}

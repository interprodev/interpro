import { AuthSelectors } from '@iterpro/shared/data-access/auth';
import { Customer } from '@iterpro/shared/data-access/sdk';
import { createSelector, MemoizedSelector } from '@ngrx/store';
import { Message } from 'primeng/api';

// make customer available everywhere
export const selectCustomer: MemoizedSelector<object, Customer> = createSelector(
	AuthSelectors.selectCustomer,
	(loginCustomer: Customer) => {
		return loginCustomer;
	}
);

export const selectError: MemoizedSelector<object, any> = createSelector(
	// here you can add other error selectors, BTW: add args to the projector function accordingly
	AuthSelectors.selectError,
	(loginError: any) => {
		return loginError;
	}
);

export const selectMessage: MemoizedSelector<object, Message> = createSelector(
	// here you can add other error selectors, BTW: add args to the projector function accordingly
	AuthSelectors.selectMessage,
	(loginMessage: Message) => {
		return loginMessage;
	}
);

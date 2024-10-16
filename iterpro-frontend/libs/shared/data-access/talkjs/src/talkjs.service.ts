import { Injectable, inject } from '@angular/core';
import { environment } from '@iterpro/config';
import { ChatApi, Customer, CustomerInterface } from '@iterpro/shared/data-access/sdk';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import Talk from 'talkjs';

@Injectable({
	providedIn: 'root'
})
export class TalkService {
	private currentUser!: Talk.User;
	private session$: BehaviorSubject<Talk.Session | null> = new BehaviorSubject<Talk.Session | null>(null);
	readonly #chatApi = inject(ChatApi);

	/**
	 * The Talk.User object is used to synchronize user data with TalkJS, so we can display it inside the chat UI.
	 * This method maps an app user (Customer & CustomerPlayer) to TalkJS User
	 * @param customer
	 * @returns
	 */
	createCurrentTalkJSUser(customer: CustomerInterface): Observable<Talk.User> {
		return from(Talk.ready).pipe(
			map(() => {
				return new Talk.User({
					id: customer.id,
					email: customer.email,
					name: customer ? `${customer.firstName}  ${customer.lastName}` : '',
					photoUrl: customer.downloadUrl,
					locale: customer.currentLanguage,
					role: 'staff' // TODO: role is always staff here. On the web the current user is always a staff member
				});
			})
		);
	}

	/**
	 * A session represents a user's active browser tab.
	 * It also authenticates your app with TalkJS
	 *
	 * @param customer
	 * @returns
	 */
	initTalkJSSession(authUser: Customer): Observable<Talk.Session | null> | undefined {
		if (authUser) {
			const currentUser: Customer = new Customer(authUser);
			return from(Talk.ready).pipe(
				switchMap(() => this.createCurrentTalkJSUser(currentUser)),
				switchMap((user: Talk.User) => {
					this.currentUser = user;
					return this.#chatApi.getSignature(user.id);
				}),
				map((signature: string) => {
					this.session$.next(
						new Talk.Session({
							appId: environment.TALKJS_APP_ID,
							me: this.currentUser,
							signature
						})
					);

					return this.session$.getValue();
				})
			);
		}

		return undefined;
	}

	/**
	 * Returns a Talk.Session object.
	 * The method returns the session property of the current service.
	 *
	 * @returns Talk.Session
	 */
	getSession(): BehaviorSubject<Talk.Session | null> {
		return this.session$;
	}

	/**
	 * Returns a Talk.User object.
	 * The method returns the currentUser property of the current service.
	 *
	 * @returns Talk.User
	 */
	getCurrentUser(): Talk.User {
		return this.currentUser;
	}
}

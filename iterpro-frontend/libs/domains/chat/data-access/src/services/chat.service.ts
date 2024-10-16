import { Injectable, inject } from '@angular/core';
import { ChatApi } from '@iterpro/shared/data-access/sdk';
import { TalkService } from '@iterpro/shared/data-access/talkjs';
import { Observable, forkJoin, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import Talk from 'talkjs';
import { Contact } from '../models/contact.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
	readonly #talkService = inject(TalkService);
	readonly #chatApi = inject(ChatApi);

	/**
	 * Attempts to get the conversation between the two users if it exists already
	 * or create a new one otherwise.
	 *
	 * @param session
	 * @param otherApplicationUser
	 * @returns
	 */
	startOneToOneConversation(contact: Contact): Observable<Talk.ConversationBuilder | undefined> {
		const clonedContact: Contact = { ...contact };
		const user$: Observable<Talk.User> = this.createTalkJSUserFromContact(clonedContact);
		return user$.pipe(
			map(user => {
				const conversation: Talk.ConversationBuilder | undefined = this.#talkService
					.getSession()
					.getValue()
					?.getOrCreateConversation(Talk.oneOnOneId(this.#talkService.getCurrentUser(), user));
				if (conversation) {
					conversation?.setParticipant(this.#talkService.getCurrentUser());
					conversation?.setParticipant(user);
				}

				return conversation;
			})
		);
	}

	/**
	 * Create a new TalkJS Group Chat
	 *
	 * @param contacts
	 * @param subject
	 * @param photoUrl
	 * @returns ConversationBuilder [Group Chat]
	 */
	startGroupConversation(contacts: Contact[], subject?: string, photoUrl?: string): Observable<Talk.ConversationBuilder | undefined> {
		const clonedContacts: Contact[] = [...contacts];
		const users$: Observable<Talk.User>[] = clonedContacts.map(c => this.createTalkJSUserFromContact(c));
		return forkJoin(users$).pipe(
			map((users: Talk.User[]) => {
				const groupID: string = this.generateGroupID();
				const conversation: Talk.ConversationBuilder | undefined = this.#talkService
					.getSession()
					.getValue()
					?.getOrCreateConversation(groupID);

				if (conversation) {
					conversation?.setParticipant(this.#talkService.getCurrentUser());
					users.forEach(u => conversation?.setParticipant(u as Talk.User));
					conversation?.setAttributes({
						subject,
						photoUrl
					});
				}

				return conversation;
			})
		);
	}

	/**
	 * Create a TalkJS user from contact
	 * Add user to TalkJS conversation as a partecipant
	 * @param conversationId
	 * @param contact
	 * @returns userId
	 */
	addPartecipantToGroup(conversationId: string, contact: Contact): Observable<string | number> {
		return this.createTalkJSUserFromContact(contact).pipe(
			switchMap((user: Talk.User) => this.#chatApi.addToConversation(conversationId, user.id))
		);
	}

	/**
	 * Create a TalkJS user from contact
	 * Add user to TalkJS conversation as a partecipant
	 * @param conversationId
	 * @param contact
	 * @returns userId
	 */
	removePartecipantsFromGroup(conversationId: string, contactId: string): Observable<string | number> {
		return this.#chatApi.removeFromConversation(conversationId, contactId);
	}

	/**
	 * The Talk.User object is used to synchronize user data with TalkJS, so we can display it inside the chat UI.
	 * This method maps a Contact in a TalkJS User
	 * @param customer
	 * @returns userID
	 */
	private createTalkJSUserFromContact(contact: Contact): Observable<Talk.User> {
		return from(Talk.ready).pipe(switchMap(() => this.#chatApi.addPerson(contact).pipe(map(contact => new Talk.User({ ...contact })))));
	}

	/**
	 *
	 * Mapping contacts ids to group id
	 * This way we can if we are creating the same group we recover an old one.
	 *
	 * @param contacts
	 * @returns
	 */
	private generateGroupID(): string {
		return 'group__' + Math.random().toString(16).slice(2);
	}
}

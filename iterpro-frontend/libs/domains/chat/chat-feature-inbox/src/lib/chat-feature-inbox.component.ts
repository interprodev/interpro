import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ChatService, Contact } from '@iterpro/chat/data-access';
import { TalkService } from '@iterpro/shared/data-access/talkjs';
import { ItemsGroup, SelectionDialogComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AlertService, DEFAULT_PERSON_IMAGE_BASE64 } from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MenuItem, SelectItem } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';
import Talk from 'talkjs';
import { AddPartecipantComponent } from './add-partecipant/add-partecipant.component';
import { GroupDetailComponent } from './group-detail/group-detail.component';

@Component({
	selector: 'iterpro-chat-feature-inbox',
	standalone: true,
	imports: [CommonModule, TranslateModule, PrimeNgModule, AddPartecipantComponent],
	templateUrl: './chat-feature-inbox.component.html',
	styles: [
		`
			.group-actions {
				background: white;
				position: absolute;
				right: -0.75rem;
				top: -0.75rem;
				border-radius: 100%;
				font-size: 1.25rem;
				padding: 0.5rem;
				color: rgba(17, 17, 17, 0.6);
				z-index: 0;
				width: 2rem;
				height: 2rem;
			}
		`
	],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatFeatureInboxComponent implements AfterViewInit {
	@Input() staff: Contact[] | null = [];
	@Input() players: Contact[] | null = [];

	// TalkJS
	@ViewChild('talkjsContainer', { static: true }) talkjsContainer!: ElementRef;
	inbox: Talk.Inbox | undefined;
	currentConversation$: BehaviorSubject<Talk.ConversationSelectedEvent | null> =
		new BehaviorSubject<Talk.ConversationSelectedEvent | null>(null);
	currentPartecipantIds$: BehaviorSubject<(string | number)[]> = new BehaviorSubject<(string | number)[]>([]);
	isCurrentGroup$: BehaviorSubject<boolean> = new BehaviorSubject(false);

	// GROUP ACTIONS ITEMS
	groupActions: MenuItem[] = [
		{
			label: this.translateService.instant('chat.groupActions'),
			items: [
				{
					label: this.translateService.instant('chat.addPartecipants'),
					icon: 'fa-solid fa-user-plus',
					styleClass: 'p-menuitem-chat',
					command: () => this.addPartecipants()
				},
				{
					label: this.translateService.instant('chat.banPartecipants'),
					icon: 'fa-solid fa-trash',
					styleClass: 'p-menuitem-chat',
					command: () => this.banPartecipants()
				},
				{
					label: this.translateService.instant('chat.leaveConversation'),
					icon: 'fa-solid fa-arrow-right-from-bracket',
					styleClass: 'p-menuitem-chat',
					command: () => this.leaveConversation()
				}
			]
		}
	];
	conversationActionsLoader = false;

	constructor(
		private readonly chatService: ChatService,
		private readonly talkService: TalkService,
		private readonly translateService: TranslateService,
		private readonly dialogService: DialogService,
		private readonly notificationService: AlertService
	) {}

	ngAfterViewInit(): void {
		this.createInbox();
	}

	newChat(): void {
		const dialogRef = this.openContactSelection();
		const conversation$: Observable<Talk.ConversationBuilder | undefined> = dialogRef.onClose.pipe(
			take(1),
			filter((selectedContact: Contact) => !!selectedContact),
			switchMap((contact: Contact) => this.chatService.startOneToOneConversation(contact))
		);

		conversation$.subscribe(c => this.inbox?.select(c));
	}

	newGroup(): void {
		const dialogRef = this.openContactSelection(true);
		const conversation$ = dialogRef.onClose.pipe(
			take(1),
			filter(selectedContacts => !!selectedContacts),
			switchMap((contacts: Contact[]) =>
				this.dialogService.open(GroupDetailComponent, { data: contacts }).onClose.pipe(
					switchMap(data => {
						const groupName: string = data?.name;
						return this.chatService.startGroupConversation(contacts, groupName);
					})
				)
			)
		);

		conversation$.subscribe(c => this.inbox?.select(c));
	}

	private getMappedItemsForGroup(items: Contact[] | null): SelectItem[] {
		return (
			items?.map(item => ({
				label: item.name,
				value: {
					...item,
					itemUrl: item?.photoUrl || DEFAULT_PERSON_IMAGE_BASE64
				}
			})) || []
		);
	}

	private openContactSelection(isGroup = false): DynamicDialogRef {
		const itemsGroups: ItemsGroup[] = [
			{
				groupName: this.translateService.instant('players'),
				groupItems: this.getMappedItemsForGroup(this.players)
			},
			{
				groupName: this.translateService.instant('admin.staff'),
				groupItems: this.getMappedItemsForGroup(this.staff)
			}
		];
		return this.dialogService.open(SelectionDialogComponent, {
			header: this.translateService.instant(isGroup ? 'chat.newGroup' : 'chat.newChat'),
			data: {
				isMultipleSelection: isGroup,
				itemsGroups,
				saveButtonLabel: 'chat.open'
			},
			contentStyle: { overflow: 'auto' }
		});
	}

	private createInbox(): void {
		this.talkService.getSession().subscribe(session => {
			if (session && this.talkjsContainer) {
				this.inbox = session.createInbox();
				this.inbox.mount(this.talkjsContainer.nativeElement);
				this.inbox.onConversationSelected((conversation: Talk.ConversationSelectedEvent) => {
					if (conversation && conversation.conversation?.id) {
						this.currentConversation$.next(conversation);

						/** Get the other partecipants */
						const otherPartecipants: Talk.UserData[] | undefined = conversation.participants?.filter(
							p => p.id !== this.talkService.getCurrentUser().id
						);

						this.currentPartecipantIds$.next(otherPartecipants?.map(({ id }) => id) || []);
						this.isCurrentGroup$.next((otherPartecipants?.length || 0) >= 2);
					} else {
						this.isCurrentGroup$.next(false);
					}
				});
			}
		});
	}

	private addPartecipants(): void {
		const partecipantIds: (string | number)[] = this.currentPartecipantIds$.value;
		const dialog$: DynamicDialogRef = this.dialogService.open(AddPartecipantComponent, {
			header: `${this.translateService.instant('chat.addPartecipants')} ${this.currentConversation$.getValue()?.conversation?.subject}`,
			data: {
				players: this.players,
				staff: this.staff,
				partecipantIds,
				banPartecipants: false
			}
		});

		dialog$.onClose
			.pipe(
				filter((contacts: Contact[]) => !!contacts && contacts.length > 0),
				tap(() => (this.conversationActionsLoader = true)),
				switchMap((contacts: Contact[]) => {
					const conversationId: string = this.currentConversation$.value?.conversation?.id as string;
					return forkJoin(contacts.map(c => this.chatService.addPartecipantToGroup(conversationId, c)));
				}),
				catchError(error => {
					this.notificationService.notify(
						'error',
						this.translateService.instant('chat.addPartecipants'),
						error.message
					);
					return of([]);
				})
			)
			.subscribe(ids => {
				if (ids.length && ids.every(id => !!id)) {
					// Stop loader
					this.conversationActionsLoader = false;

					// New partecipants
					const newPartecipantIds = [...partecipantIds, ...ids];
					this.currentPartecipantIds$.next(newPartecipantIds);

					// Notify
					this.notificationService.notify(
						'success',
						this.translateService.instant('chat.addPartecipants'),
						this.translateService.instant('chat.addPartecipantsSuccess')
					);
				}
			});
	}

	private banPartecipants(): void {
		const partecipantIds: (string | number)[] = this.currentPartecipantIds$.value;
		const dialog$: DynamicDialogRef = this.dialogService.open(AddPartecipantComponent, {
			header: `${this.translateService.instant('chat.banPartecipants')} ${this.currentConversation$.getValue()?.conversation?.subject}`,
			data: {
				players: this.players,
				staff: this.staff,
				partecipantIds,
				banPartecipants: true
			}
		});

		dialog$.onClose
			.pipe(
				filter((contacts: Contact[]) => !!contacts && contacts.length > 0),
				tap(() => (this.conversationActionsLoader = true)),
				switchMap((contacts: Contact[]) => {
					const conversationId: string = this.currentConversation$.value?.conversation?.id as string;
					return forkJoin(contacts.map(c => this.chatService.removePartecipantsFromGroup(conversationId, c.id)));
				}),
				catchError(error => {
					this.notificationService.notify(
						'error',
						this.translateService.instant('chat.banPartecipants'),
						error.message
					);
					return of([]);
				})
			)
			.subscribe((ids: (string | number)[]) => {
				if (ids.length && ids.every(id => !!id)) {
					// Stop loader
					this.conversationActionsLoader = false;

					// New partecipants
					const newPartecipantIds = partecipantIds.filter(id => !ids.includes(id));
					this.currentPartecipantIds$.next(newPartecipantIds);

					// Notify
					this.notificationService.notify(
						'success',
						this.translateService.instant('chat.banPartecipants'),
						this.translateService.instant('chat.banPartecipantsSuccess')
					);
				}
			});
	}

	leaveConversation(): void {
		const conversationId: string = this.currentConversation$.value?.conversation?.id as string;
		const currentUser: Talk.User = this.talkService.getCurrentUser();
		this.chatService
			.removePartecipantsFromGroup(conversationId, currentUser.id)
			.pipe(tap(() => (this.conversationActionsLoader = true)))
			.subscribe(() => {
				this.currentConversation$.next(null);
				this.conversationActionsLoader = false;
				this.inbox?.select(null);
			});
	}
}

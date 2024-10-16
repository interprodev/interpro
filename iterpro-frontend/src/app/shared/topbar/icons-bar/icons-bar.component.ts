import { AsyncPipe, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Event, NavigationStart, Router, RouterModule } from '@angular/router';
import { AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	IterproOrgType,
	IterproRoute,
	IterproUserPermission,
	PermissionsService
} from '@iterpro/shared/data-access/permissions';
import { Club, Customer, Notification } from '@iterpro/shared/data-access/sdk';
import { TalkService } from '@iterpro/shared/data-access/talkjs';
import { NotificationsMenuComponent } from '@iterpro/shared/feature-components';
import { AlertService, NotificationService } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { TooltipModule } from 'primeng/tooltip';
import { Observable, map, switchMap } from 'rxjs';
import { RootStoreSelectors } from 'src/app/+state';
import { RootStoreState } from 'src/app/+state/root-store.state';
import { SupportWidgetComponent } from '../../support-widget/support-widget.component';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [
		AsyncPipe,
		RouterModule,
		TranslateModule,
		RippleModule,
		StyleClassModule,
		BadgeModule,
		NotificationsMenuComponent,
		UserMenuComponent,
		TooltipModule,
		SupportWidgetComponent,
		NgClass
	],
	selector: 'iterpro-icons-bar',
	templateUrl: './icons-bar.component.html',
	styleUrls: ['./icons-bar.component.scss']
})
export class IconsBarComponent implements OnInit {
	selectedClub$: Observable<Club>;
	orgType$: Observable<IterproOrgType>;

	// Notifications
	notificationsListVisible = false;
	notificationsToRead$: Observable<Notification[]>;

	// TalkJS
	unreadConversations = null;
	canAccessChat$: Observable<boolean>;
	customer$ = this.store$.select(AuthSelectors.selectCustomer);

	constructor(
		private readonly router: Router,
		private readonly store$: Store<RootStoreState>,
		private readonly notificationService: NotificationService,
		private readonly talkService: TalkService,
		private readonly alertService: AlertService,
		private readonly permissionsService: PermissionsService,
		private readonly currentTeamService: CurrentTeamService
	) {
		this.selectedClub$ = this.store$.select(AuthSelectors.selectClub);
		this.orgType$ = this.store$.select(AuthSelectors.selectOrganizationType);
		this.canAccessChat$ = this.store$.select(AuthSelectors.selectCanAccessChat);

		this.notificationsToRead$ = this.notificationService.notifications$
			.asObservable()
			.pipe(map(notifications => (notifications || []).filter(({ read }) => !read)));

		this.handleRoutingEvents();

		/** Init chat session */
		this.initChatSession();
	}

	ngOnInit() {}

	private handleRoutingEvents(): void {
		this.router.events.pipe(untilDestroyed(this)).subscribe((event: Event) => {
			if (event instanceof NavigationStart) {
				this.notificationsListVisible = false;
			}
		});
	}

	/**
	 * Init TalkJS Chat Session.
	 * Handle new messages and notifications.
	 */
	private initChatSession(): void {
		this.store$
			.select(RootStoreSelectors.selectCustomer)
			.pipe(
				switchMap((customer: Customer) => this.talkService.initTalkJSSession(customer)),
				untilDestroyed(this)
			)
			.subscribe(session => {
				if (session) {
					session.unreads.onChange(
						unreadsConversations => (this.unreadConversations = unreadsConversations.length || null)
					);
					session.onMessage(message => {
						if (!message.isByMe && !message.read && !this.router.url.includes('/inbox')) {
							this.alertService.notify(
								'chat',
								message.sender.name,
								message.body,
								true,
								{ conversation: message.conversation.id },
								5000,
								'/inbox'
							);
						}
					});
				}
			});
	}

	canAccessToRoute(route: IterproRoute): boolean {
		return this.permissionsService.canAccessToRoute(route, this.currentTeamService.getCurrentTeam());
	}

	closeNotificationsList(): void {
		this.notificationsListVisible = false;
	}

	isAtNotification(): boolean {
		return this.router.url === '/notifications';
	}
}

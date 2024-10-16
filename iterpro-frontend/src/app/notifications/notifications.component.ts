import { Component, OnInit, inject } from '@angular/core';
import { AuthSelectors, SelectableTeam } from '@iterpro/shared/data-access/auth';
import { Club, Notification } from '@iterpro/shared/data-access/sdk';
import { NotificationService } from '@iterpro/shared/utils/common-utils';
import { Store } from '@ngrx/store';
import { NotificationLinkPipe } from 'libs/shared/ui/components/src/lib/user-notifications/single/pipes/notification-link.pipe';
import { Observable } from 'rxjs';
import { RootStoreState } from '../+state/root-store.state';

@Component({
	selector: 'iterpro-notifications',
	templateUrl: './notifications.component.html',
	styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
	readonly #notificationService = inject(NotificationService);
	readonly #notificationLinkPipe = inject(NotificationLinkPipe);
	readonly store$ = inject(Store<RootStoreState>);

	notifications$!: Observable<Notification[]>;
	teamList$!: Observable<SelectableTeam[]>;
	selectedClub$: Observable<Club>;

	constructor() {}

	ngOnInit() {
		this.selectedClub$ = this.store$.select(AuthSelectors.selectClub);
		this.notifications$ = this.#notificationService.notifications$.asObservable();
		this.teamList$ = this.#notificationService.getTeamList();
	}

	onClickNotification(notification: Notification): void {
		const route = this.#notificationLinkPipe.transform(notification);
		this.setNotificationAsRead(notification);
		this.#notificationService.redirect(notification, route);
	}

	onClickMarkAllAsRead(): void {
		this.#notificationService.updateAll();
	}

	setNotificationAsRead(notification: Notification): void {
		this.#notificationService.updateOne(notification);
	}
}

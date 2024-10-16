import { AsyncPipe } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	OnDestroy,
	OnInit,
	Output,
	inject
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SelectableTeam } from '@iterpro/shared/data-access/auth';
import { Club, Notification } from '@iterpro/shared/data-access/sdk';
import { IconButtonComponent, UserNotificationsContainerComponent } from '@iterpro/shared/ui/components';
import { NotificationService } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationLinkPipe } from 'libs/shared/ui/components/src/lib/user-notifications/single/pipes/notification-link.pipe';
import { Observable } from 'rxjs';
import { RootStoreState } from 'src/app/+state/root-store.state';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [
		AsyncPipe,
		UserNotificationsContainerComponent,
		NotificationLinkPipe,
		TranslateModule,
		RouterModule,
		IconButtonComponent
	],
	providers: [NotificationLinkPipe],
	selector: 'iterpro-notifications-menu',
	templateUrl: './notifications-menu.component.html',
	styleUrls: ['./notifications-menu.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsMenuComponent implements OnInit, OnDestroy {
	@Input({ required: true }) club!: Club;
	@Output() notificationClicked = new EventEmitter<null>();

	readonly #notificationService = inject(NotificationService);
	readonly #router = inject(Router);
	readonly #notificationLinkPipe = inject(NotificationLinkPipe);

	notifications$!: Observable<Notification[]>;
	teamList$!: Observable<SelectableTeam[]>;

	ngOnDestroy() {}

	ngOnInit() {
		this.notifications$ = this.#notificationService.notifications$.asObservable();
		this.teamList$ = this.#notificationService.getTeamList();
	}

	onClickNotification(notification: Notification): void {
		const route = this.#notificationLinkPipe.transform(notification);
		this.setNotificationAsRead(notification);
		this.notificationClicked.emit();
		this.#notificationService.redirect(notification, route);
	}

	onClickMarkAllAsRead(): void {
		this.#notificationService.updateAll();
	}

	setNotificationAsRead(notification: Notification): void {
		this.#notificationService.updateOne(notification);
	}

	goToNotifications() {
		this.#router.navigate(['/notifications']);
	}
}

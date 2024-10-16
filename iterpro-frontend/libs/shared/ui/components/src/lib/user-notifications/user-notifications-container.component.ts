import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SelectableTeam } from '@iterpro/shared/data-access/auth';
import { Club, Notification } from '@iterpro/shared/data-access/sdk';
import { TranslateModule } from '@ngx-translate/core';
import { SingleNotificationComponent } from './single/single-notification.component';

@Component({
	standalone: true,
	imports: [NgIf, NgFor, TranslateModule, SingleNotificationComponent, AsyncPipe],
	selector: 'iterpro-user-notifications-container',
	templateUrl: './user-notifications-container.component.html',
	styleUrls: ['./user-notifications-container.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserNotificationsContainerComponent {
	readNotifications: Notification[] = [];
	newNotifications: Notification[] = [];

	@Input({ required: true }) club!: Club;
	@Input({ required: true }) teamList: SelectableTeam[] | null = [];
	@Input({ required: true })
	set notifications(value: Notification[] | null) {
		if (!!value) {
			const mapped: Notification[] = value.map(n => ({
				...n,
				read: !!n.read && n.read
			}));
			this.readNotifications = [...mapped.filter(({ read }) => read)];
			this.newNotifications = [...mapped.filter(({ read }) => !read)];
		}
	}

	@Output() markAllClicked = new EventEmitter();
	@Output() markAsReadClicked = new EventEmitter<Notification>();
	@Output() notificationClicked = new EventEmitter<Notification>();

	markAllAsRead(): void {
		this.markAllClicked.emit();
	}

	onMarkedAsRead(notification: Notification): void {
		this.markAsReadClicked.emit(notification);
	}

	onNotificationClicked(notification: Notification): void {
		this.notificationClicked.emit(notification);
	}
}

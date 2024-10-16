import { NgClass, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SelectableTeam } from '@iterpro/shared/data-access/auth';
import { Club, Notification } from '@iterpro/shared/data-access/sdk';
import { TeamNamePipe } from '@iterpro/shared/ui/pipes';
import { FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { PictureComponent } from '../../picture/picture.component';
import { NotificationColorPipe } from './pipes/notification-color.pipe';
import { NotificationDatePipe } from './pipes/notification-date.pipe';
import { NotificationIconClassPipe } from './pipes/notification-icon-class.pipe';
import { NotificationImagePipe } from './pipes/notification-image.pipe';
import { NotificationLinkPipe } from './pipes/notification-link.pipe';
import { NotificationMessagePipe } from './pipes/notification-message.pipe';

@Component({
	standalone: true,
	imports: [
		NgIf,
		NgClass,
		RouterModule,
		TranslateModule,
		NotificationLinkPipe,
		NotificationColorPipe,
		NotificationImagePipe,
		NotificationMessagePipe,
		NotificationDatePipe,
		NotificationIconClassPipe,
		FormatDateUserSettingPipe,
		TeamNamePipe,
		PictureComponent
	],
	selector: 'iterpro-single-notification',
	templateUrl: './single-notification.component.html',
	styleUrl: './single-notification.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleNotificationComponent {
	@Input({ required: true }) notification!: Notification;
	@Input({ required: true }) club!: Club;
	@Input({ required: true }) teams: SelectableTeam[] = [];

	@Output() notificationClicked: EventEmitter<Notification> = new EventEmitter<Notification>();
	@Output() markAsReadClicked: EventEmitter<Notification> = new EventEmitter<Notification>();

	openNotification(notification: Notification) {
		this.notificationClicked.emit(notification);
	}

	markAsRead(event): void {
		// Avoid propagation in tapped event
		event.preventDefault();
		event.stopPropagation();
		this.markAsReadClicked.emit(this.notification);
	}
}

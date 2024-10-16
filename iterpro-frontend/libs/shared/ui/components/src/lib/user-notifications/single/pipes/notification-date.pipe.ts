import { Pipe, PipeTransform } from '@angular/core';
import { Notification } from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment';

@Pipe({
	standalone: true,
	pure: false,
	name: 'notificationDate'
})
export class NotificationDatePipe implements PipeTransform {
	transform(notification: Notification): string {
		return moment(notification.date).fromNow().toLocaleLowerCase();
	}
}

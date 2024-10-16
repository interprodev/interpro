import { NgModule } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { NotificationsComponent } from './notifications.component';
import { authGuard } from '@iterpro/shared/data-access/auth';
import { RouterModule, Routes } from '@angular/router';
import { BlockUIModule } from 'ng-block-ui';
import { NotificationLinkPipe } from 'libs/shared/ui/components/src/lib/user-notifications/single/pipes/notification-link.pipe';
import { UserNotificationsContainerComponent } from '@iterpro/shared/ui/components';
import { TranslateModule } from '@ngx-translate/core';

const routes: Routes = [
	{
		path: '',
		component: NotificationsComponent,
		canActivate: [authGuard]
	}
];

@NgModule({
	imports: [
		CommonModule,
		AsyncPipe,
		RouterModule.forChild(routes),
		BlockUIModule,
		UserNotificationsContainerComponent,
		NotificationLinkPipe,
		TranslateModule
	],
	declarations: [NotificationsComponent],
	providers: [NotificationLinkPipe]
})
export class NotificationsModule {}

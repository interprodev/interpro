import { NgClass, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { AlertParams, AlertService } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { isEmpty } from 'lodash';
import { Message, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [NgIf, NgClass, NgSwitch, NgSwitchCase, ToastModule],
	selector: 'iterpro-alert',
	templateUrl: './alert.component.html',
	styles: [
		`
			customGrowl .p-growl {
				top: 85vh;
				height: 10em;
			}
		`
	],
	providers: [MessageService],
	encapsulation: ViewEncapsulation.None
})
export class AlertComponent implements OnInit {
	msgs: Message[] = [];
	subscription!: Subscription;

	constructor(
		private readonly alertService: AlertService,
		private readonly messageService: MessageService,
		private readonly router: Router
	) {}

	ngOnInit() {
		this.subscribeToNotifications();
	}

	subscribeToNotifications() {
		this.subscription = this.alertService.alertChange
			.pipe(untilDestroyed(this))
			.subscribe((notification: AlertParams) => {
				this.messageService.clear();
				this.messageService.add(notification);
			});

		this.subscription = this.alertService.alertChangeAll
			.pipe(untilDestroyed(this))
			.subscribe((notifications: AlertParams[]) => {
				this.messageService.clear();
				this.messageService.addAll(notifications);
			});
	}

	redirect(message: AlertParams): void {
		if (message.redirectUrl) {
			this.messageService.clear();
			this.router.navigate([message.redirectUrl], message.params && { queryParams: message.params });
		}
	}

	getZIndex() {
		return isEmpty(this.msgs) ? '0' : '101';
	}
}

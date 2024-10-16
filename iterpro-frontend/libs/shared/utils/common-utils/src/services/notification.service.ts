import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@iterpro/config';
import { AuthActions, AuthSelectors, SelectableTeam } from '@iterpro/shared/data-access/auth';
import { Customer, LoopBackAuth, Notification, NotificationApi } from '@iterpro/shared/data-access/sdk';
import { Store } from '@ngrx/store';
import { NotificationLinkPipe } from 'libs/shared/ui/components/src/lib/user-notifications/single/pipes/notification-link.pipe';
import { findIndex, sortBy } from 'lodash';
import * as moment from 'moment';
import { BehaviorSubject, Observable, first } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { RootStoreState } from 'src/app/+state/root-store.state';
import { getId } from '../utils/functions/utils.functions';
import { ErrorService } from './error.service';

@Injectable({
	providedIn: 'root'
})
export class NotificationService {
	notifications$: BehaviorSubject<Notification[]> = new BehaviorSubject<Notification[]>([]);
	socket: Socket | null = null;

	private customer!: Customer;

	readonly #notificationApi = inject(NotificationApi);
	readonly #error = inject(ErrorService);
	readonly #authService = inject(LoopBackAuth);
	readonly #router = inject(Router);
	readonly store$ = inject(Store<RootStoreState>);

	constructor() {
		this.initNotifications();
	}

	/**
	 * Initialize Notification socket
	 **/
	initNotifications(reconnect?: boolean): void {
		this.customer = this.#authService.getCurrentUserData();
		this.initSocket(reconnect);
	}

	/**
	 * Disconnect Notification socket
	 **/
	disconnect(): void {
		if (this.socket) {
			this.socket.disconnect();
			this.socket.close();
			this.socket = null;
			this.notifications$.next([]);
		}
	}

	/**
	 * Mark notification as read
	 * @param notification notification
	 */
	markNotificationAsRead(notification: Notification): void {
		const notifications = this.notifications$.getValue();
		const index = findIndex(notifications, (n: Notification) => getId(n) === getId(notification));
		if (index !== -1 && notifications) {
			notifications[index] = notification;
			this.notifications$.next([...notifications]);
		}
	}

	/**
	 * Mark all notifications as read
	 */
	markAllAsRead(): void {
		const currentNotifications: Notification[] | null = this.notifications$.getValue();
		if (currentNotifications) {
			const notifications: Notification[] = currentNotifications.map(n => ({ ...n, read: true }));
			this.notifications$.next([...notifications]);
		}
	}

	/**
	 * Initialize Socket
	 * @param reconnect option to reconnect
	 */
	private initSocket(reconnect?: boolean) {
		if (!this.socket || !this.socket.connected || reconnect) {
			this.notifications$.next([]);
			this.disconnect();

			if (this.customer) {
				const { id: userId } = this.customer;
				const token = JSON.stringify({ id: this.#authService.getToken().id, userId });

				this.socket = io(environment.SOCKET_URL, {
					auth: { token },
					transports: ['websocket']
				});

				this.socket.on('connect', () => {
					this.onConnectSocket(userId);
				});
			}
		}
	}

	/**
	 * Connect socket
	 * @param userId user id
	 */
	private onConnectSocket(userId: string) {
		if (this.socket) {
			// Initialize notifications array
			this.socket.on('notifications', ({ notifications }: { notifications: Notification[] }) => {
				const socketNotifications = sortBy(notifications, ({ date }: { date: Date }) =>
					moment(date).toDate()
				).reverse();

				this.notifications$.next(this.getNotifications(socketNotifications as Notification[]));
			});

			// Single notification
			this.socket.on('notification', (notification: Notification) => {
				const currentNotifications: Notification[] | null = this.notifications$.getValue();
				if (currentNotifications) {
					const socketNotifications = sortBy([...currentNotifications, notification], ({ date }: { date: Date }) =>
						moment(date).toDate()
					).reverse();
					this.notifications$.next(this.getNotifications(socketNotifications as Notification[]));
				}
			});

			this.socket.emit('join', { userId });
		}
	}

	/**
	 *
	 * @returns array of notifications by team and last 10 days
	 */
	private getNotifications(notifications: Notification[]): Notification[] {
		// Filtering notifications based on last 10 days
		const filteredNotifications: Notification[] = (notifications || []).filter(
			({ date }) => moment().diff(moment(date), 'days') <= 10
		);

		return filteredNotifications;
	}

	getTeamList(): Observable<SelectableTeam[]> {
		return this.store$.select(AuthSelectors.selectTeamList);
	}

	updateAll(): void {
		this.#notificationApi
			.updateAll(
				{
					customerId: this.customer.id
				},
				{ read: true }
			)
			.pipe(first())
			.subscribe({
				next: () => this.markAllAsRead(),
				error: error => this.#error.handleError(error)
			});
	}

	updateOne(notification: Notification): void {
		this.#notificationApi.patchAttributes(getId(notification), { read: true }).subscribe({
			next: (resultNotification: Notification) => this.markNotificationAsRead(resultNotification),
			error: error => this.#error.handleError(error)
		});
	}

	redirect(notification: Notification, route: [string, object?]): void {
		if (notification.teamId === 'GLOBAL' || notification.teamId === this.customer.currentTeamId) {
			this.#router.navigate(route);
		} else {
			this.store$.dispatch(AuthActions.updateSelectedTeam({ teamId: notification.teamId, redirectUrl: route }));
		}
	}
}

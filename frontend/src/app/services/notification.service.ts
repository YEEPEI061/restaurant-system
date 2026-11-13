
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
    BehaviorSubject,
    Observable,
    Subject,
    tap
} from 'rxjs';

import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface Notification {
    _id: string;
    recipient: string | null;
    recipientRole: 'guest' | 'admin';
    type:
    | 'reservation_created'
    | 'reservation_updated'
    | 'reservation_cancelled'
    | 'reservation_confirmed'
    | 'table_assigned';
    title: string;
    message: string;
    reservationId: string | null;
    read: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationResponse {
    notifications: Notification[];
    unreadCount: number;
}

export interface NotificationActionResponse {
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private readonly endpoint = '/notifications';

    private socket: WebSocket | null = null;

    private notificationsSubject =
        new BehaviorSubject<Notification[]>([]);

    notifications$ =
        this.notificationsSubject.asObservable();

    private unreadCountSubject =
        new BehaviorSubject<number>(0);

    unreadCount$ =
        this.unreadCountSubject.asObservable();

    private notificationSubject =
        new Subject<Notification>();

    notification$ =
        this.notificationSubject.asObservable();

    constructor(
        private http: HttpClient,
        private api: ApiService,
        private auth: AuthService
    ) { }

    // =========================
    // LOAD NOTIFICATIONS
    // =========================

    loadNotifications(): Observable<NotificationResponse> {

        return this.http.get<NotificationResponse>(
            `${this.api.baseUrl}${this.endpoint}`
        ).pipe(
            tap(response => {

                this.notificationsSubject.next(
                    response.notifications
                );

                this.unreadCountSubject.next(
                    response.unreadCount
                );

            })
        );
    }

    // =========================
    // MARK AS READ
    // =========================

    markAsRead(
        notificationId: string
    ): Observable<NotificationActionResponse> {

        return this.http.patch<NotificationActionResponse>(
            `${this.api.baseUrl}${this.endpoint}/${notificationId}/read`,
            {}
        ).pipe(
            tap(() => {

                const notifications =
                    this.notificationsSubject.value.map(notification =>
                        notification._id === notificationId
                            ? { ...notification, read: true }
                            : notification
                    );

                this.notificationsSubject.next(notifications);

                this.unreadCountSubject.next(
                    notifications.filter(n => !n.read).length
                );

            })
        );
    }

    // =========================
    // MARK ALL AS READ
    // =========================

    markAllAsRead(): Observable<NotificationActionResponse> {

        return this.http.patch<NotificationActionResponse>(
            `${this.api.baseUrl}${this.endpoint}/read-all`,
            {}
        ).pipe(
            tap(() => {

                const notifications =
                    this.notificationsSubject.value.map(notification => ({
                        ...notification,
                        read: true
                    }));

                this.notificationsSubject.next(notifications);

                this.unreadCountSubject.next(0);

            })
        );
    }

    // =========================
    // WEBSOCKET
    // =========================

    connectWebSocket(): void {

        if (!this.auth.isLoggedIn()) {
            return;
        }

        if (
            this.socket &&
            (
                this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING
            )
        ) {
            return;
        }

        this.socket =
            new WebSocket('ws://localhost:3000/ws');

        this.socket.onopen = () => {
            console.log('Notification WebSocket connected.');
        };

        this.socket.onmessage = (event) => {

            try {

                const data = JSON.parse(event.data);

                if (data.type !== 'notification.created') {
                    return;
                }

                const notification = data.notification;
                const user = this.auth.getUser();

                if (!user) {
                    return;
                }

                // ADMIN
                if (
                    user.role === 'admin' &&
                    notification.recipientRole === 'admin'
                ) {

                    this.addNotification(notification);
                    return;

                }

                // GUEST
                if (
                    user.role === 'guest' &&
                    notification.recipientRole === 'guest' &&
                    String(notification.recipient) === String(user.id)
                ) {

                    this.addNotification(notification);

                }

            } catch (error) {

                console.error(
                    'Failed to process notification:',
                    error
                );

            }

        };

        this.socket.onclose = () => {

            console.log('Notification WebSocket disconnected.');

            this.socket = null;

        };

        this.socket.onerror = (error) => {

            console.error('Notification WebSocket error:', error);

        };

    }

    // =========================
    // ADD REAL-TIME NOTIFICATION
    // =========================

    private addNotification(notification: Notification): void {

        const current =
            this.notificationsSubject.value;

        // Avoid duplicate notifications.
        if (current.some(n => n._id === notification._id)) {
            return;
        }

        this.notificationsSubject.next([
            notification,
            ...current
        ]);

        if (!notification.read) {

            this.unreadCountSubject.next(
                this.unreadCountSubject.value + 1
            );

        }

        this.notificationSubject.next(notification);

    }

    // =========================
    // DISCONNECT
    // =========================

    disconnectWebSocket(): void {

        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

    }

    // =========================
    // CLEAR NOTIFICATION STATE
    // =========================

    clearNotifications(): void {

        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);

        this.disconnectWebSocket();

    }

}

import {
    Component,
    EventEmitter,
    OnDestroy,
    OnInit,
    Output
} from '@angular/core';

import { Subscription } from 'rxjs';

import { CommonModule } from '@angular/common';
import {
    Notification,
    NotificationService
} from '../../services/notification.service';



@Component({
    selector: 'app-notification-dropdown',
    standalone: true,
    imports: [
        CommonModule
    ],
    templateUrl:
        './notification-dropdown.component.html',
    styleUrl:
        './notification-dropdown.component.css'
})
export class NotificationDropdownComponent
    implements OnInit, OnDestroy {

    @Output()
    closeDropdownEvent = new EventEmitter<void>();

    @Output()
    unreadCountChange =
        new EventEmitter<number>();


    notifications:
        Notification[] = [];

    unreadCount = 0;

    loading = true;

    private notificationSubscription?: Subscription;


    constructor(
        private notificationService:
            NotificationService
    ) { }


    // =========================
    // INITIALISE
    // =========================
    ngOnInit(): void {

        this.loading = false;

        this.notificationSubscription =
            this.notificationService
                .notifications$
                .subscribe(notifications => {

                    this.notifications = notifications;

                });

        this.notificationService
            .unreadCount$
            .subscribe(count => {

                this.unreadCount = count;

                this.unreadCountChange.emit(count);

            });

    }


    // =========================
    // MARK AS READ
    // =========================

    markAsRead(notification: Notification): void {

        if (notification.read) {
            return;
        }

        this.notificationService
            .markAsRead(notification._id)
            .subscribe({

                error: error => {

                    console.error(
                        'Failed to mark notification as read:',
                        error
                    );

                }

            });

    }


    // =========================
    // MARK ALL AS READ
    // =========================

    markAllAsRead(): void {

        if (this.unreadCount === 0) {
            return;
        }

        this.notificationService
            .markAllAsRead()
            .subscribe({

                error: error => {

                    console.error(
                        'Failed to mark all notifications as read:',
                        error
                    );

                }

            });

    }


    // =========================
    // CLOSE
    // =========================

    closeDropdown(): void {

        this.closeDropdownEvent.emit();

    }


    // =========================
    // CLEANUP
    // =========================

    ngOnDestroy(): void {
        this.notificationSubscription?.unsubscribe();
    }

}
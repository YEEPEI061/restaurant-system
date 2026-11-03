import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  OnDestroy
} from '@angular/core';

import { Subscription } from 'rxjs';

import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  AuthService
} from '../../services/auth.service';

import {
  NotificationDropdownComponent
} from '../notification-dropdown/notification-dropdown.component';

import {
  NotificationService
} from '../../services/notification.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    NotificationDropdownComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {

  isProfileMenuOpen = false;

  notificationOpen = false;

  notificationUnreadCount = 0;

  private notificationSubscription?: Subscription;
  private unreadCountSubscription?: Subscription;

  mobileMenuOpen = false;

  logoutConfirmOpen = false;
  logoutRole: 'guest' | 'staff' | null = null;


  constructor(
    private router: Router,
    private elementRef: ElementRef,
    private authService: AuthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {

    this.unreadCountSubscription =
      this.notificationService
        .unreadCount$
        .subscribe(count => {

          this.notificationUnreadCount = count;

        });

    this.connectNotifications();

  }

  ngOnDestroy(): void {

    this.unreadCountSubscription?.unsubscribe();

  }



  // =========================
  // CLICK OUTSIDE
  // =========================

  /**
   * Close the profile menu when clicking
   * outside the header component.
   */
  @HostListener(
    'document:click',
    ['$event']
  )
  onDocumentClick(
    event: MouseEvent
  ): void {

    const clickedInside =
      this.elementRef.nativeElement.contains(
        event.target
      );

    if (!clickedInside) {

      this.closeProfileMenu();

      this.closeNotifications();

    }
  }


  // =========================
  // PORTAL MODE
  // =========================

  isStaffMode(): boolean {

    const url =
      this.router.url
        .split('?')[0]
        .split('#')[0];

    const staffRoutes = [
      '/admin-login',
      '/admin-dashboard',
      '/reservation-management',
      '/user-management',
      '/menu-management'
    ];

    return staffRoutes.some(
      route =>
        url === route ||
        url.startsWith(route + '/')
    );
  }


  // =========================
  // LOGIN PAGE CHECKS
  // =========================

  isGuestLogin(): boolean {

    return (
      this.router.url
        .split('?')[0] ===
      '/guest-login'
    );
  }


  isAdminLogin(): boolean {

    return (
      this.router.url
        .split('?')[0] ===
      '/admin-login'
    );
  }

  // =========================
  // LOGOUT CONFIRMATION
  // =========================

  openLogoutConfirmation(role: 'guest' | 'staff'): void {

    this.logoutRole = role;

    this.logoutConfirmOpen = true;

    this.closeProfileMenu();
  }

  cancelLogout(): void {

    this.logoutConfirmOpen = false;

    this.logoutRole = null;
  }

  confirmLogout(): void {

    if (!this.logoutRole) {
      return;
    }

    const role = this.logoutRole;

    this.cancelLogout();

    if (role === 'guest') {
      this.guestLogout();
    } else {
      this.adminLogout();
    }
  }

  // =========================
  // GUEST AUTHENTICATION
  // =========================

  isLoggedIn(): boolean {

    return this.authService.isLoggedIn();

  }

  isGuestLoggedIn(): boolean {

    const user =
      this.authService.getUser();

    return (
      this.authService.isLoggedIn() &&
      user?.role === 'guest'
    );
  }


  getGuestUser(): any | null {

    if (!this.isGuestLoggedIn()) {
      return null;
    }

    return this.authService.getUser();
  }


  guestLogout(): void {

    this.notificationService.clearNotifications();

    this.authService.logout();

    this.closeProfileMenu();

    void this.router.navigate([
      '/guest-login'
    ]);
  }


  // =========================
  // ADMIN AUTHENTICATION
  // =========================

  isAdminLoggedIn(): boolean {

    const user =
      this.authService.getUser();

    return (
      this.authService.isLoggedIn() &&
      user?.role === 'admin'
    );
  }


  getAdminUser(): any | null {

    if (!this.isAdminLoggedIn()) {
      return null;
    }

    return this.authService.getUser();
  }


  adminLogout(): void {

    this.notificationService.clearNotifications();
    this.authService.logout();

    this.closeProfileMenu();

    void this.router.navigate([
      '/admin-login'
    ]);
  }


  // =========================
  // PROFILE MENU
  // =========================

  toggleProfileMenu(): void {

    this.isProfileMenuOpen =
      !this.isProfileMenuOpen;

    if (this.isProfileMenuOpen) {

      this.closeNotifications();

    }

  }


  closeProfileMenu(): void {

    this.isProfileMenuOpen =
      false;
  }

  goToStaffPortal(): void {

    this.closeProfileMenu();

    if (this.isAdminLoggedIn()) {

      void this.router.navigate([
        '/admin-dashboard'
      ]);

      return;
    }

    void this.router.navigate([
      '/admin-login'
    ]);
  }

  // =========================
  // NOTIFICATIONS
  // =========================
  toggleNotifications(): void {

    if (!this.isLoggedIn()) {
      return;
    }

    this.notificationOpen =
      !this.notificationOpen;

    if (this.notificationOpen) {
      this.closeProfileMenu();
    }

  }


  // =========================
  // CLOSE NOTIFICATIONS
  // =========================

  closeNotifications(): void {

    this.notificationOpen = false;

  }

  connectNotifications(): void {

    if (!this.isLoggedIn()) {
      return;
    }

    this.notificationService.connectWebSocket();

  }

  // =========================
  // MENU BAR
  // =========================

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }


}
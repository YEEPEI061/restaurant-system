import {
  Component,
  ElementRef,
  HostListener
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  AuthService
} from '../../services/auth.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  isProfileMenuOpen = false;


  constructor(
    private router: Router,
    private elementRef: ElementRef,
    private authService: AuthService
  ) { }


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
  // GUEST AUTHENTICATION
  // =========================

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

    this.authService.logout();

    this.closeProfileMenu();

    this.router.navigate([
      '/menu'
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

    this.authService.logout();

    this.closeProfileMenu();

    this.router.navigate([
      '/admin-login'
    ]);
  }


  // =========================
  // PROFILE MENU
  // =========================

  toggleProfileMenu(): void {

    this.isProfileMenuOpen =
      !this.isProfileMenuOpen;
  }


  closeProfileMenu(): void {

    this.isProfileMenuOpen =
      false;
  }

  goToStaffPortal(): void {

    this.closeProfileMenu();

    if (this.isAdminLoggedIn()) {

      this.router.navigate([
        '/admin-dashboard'
      ]);

      return;
    }

    this.router.navigate([
      '/admin-login'
    ]);
  }

}
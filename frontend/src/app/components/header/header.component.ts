
import { Component, ElementRef, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isProfileMenuOpen = false;

  constructor(
    private router: Router,
    private elementRef: ElementRef
  ) {}

  /**
   * Close the profile menu when clicking outside the header component.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(
      event.target
    );

    if (!clickedInside) {
      this.closeProfileMenu();
    }
  }

  isStaffMode(): boolean {
    const url = this.router.url.split('?')[0].split('#')[0];

    const staffRoutes = [
      '/admin-login',
      '/admin-dashboard',
      '/reservation-management',
      '/staff-management',
      '/menu-management',
    ];

    return staffRoutes.some(
      route => url === route || url.startsWith(route + '/')
    );
  }

  isGuestLogin(): boolean {
    return this.router.url.split('?')[0] === '/guest-login';
  }

  isAdminLogin(): boolean {
    return this.router.url.split('?')[0] === '/admin-login';
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }
}

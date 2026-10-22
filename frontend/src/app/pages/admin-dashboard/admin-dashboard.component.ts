import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

import { MenuService } from '../../services/menu.service';

import {
  Reservation,
  ReservationService
} from '../../services/reservation.service';


@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {

  // =========================
  // RESERVATIONS
  // =========================

  reservations: Reservation[] = [];
  menuItems: any[] = [];

  isLoading = true;
  loadError = '';


  // =========================
  // WALK-IN
  // =========================

  showWalkInModal = false;

  walkInName = '';
  walkInGuests = 2;
  walkInTable = 'Unassigned';
  walkInNotes = '';


  // =========================
  // TOAST
  // =========================

  toastMessage = '';


  constructor(
    private reservationService: ReservationService,
    private menuService: MenuService
  ) { }


  // =========================
  // INITIALISE
  // =========================

  ngOnInit(): void {
    this.loadReservations();
    this.loadMenuItems();
  }


  // =========================
  // LOAD RESERVATIONS
  // =========================

  loadReservations(): void {

    this.isLoading = true;
    this.loadError = '';

    this.reservationService
      .getReservations()
      .subscribe({

        next: (response) => {

          this.reservations =
            response.reservations || [];

          this.isLoading = false;
        },

        error: (error) => {

          console.error(
            'Failed to load dashboard reservations:',
            error
          );

          this.isLoading = false;

          this.loadError =
            error?.error?.message ||
            'Unable to load today\'s reservation data.';
        }

      });
  }

  // =========================
  // LOAD MENU ITEMS
  // =========================
  loadMenuItems(): void {
    this.menuService.getMenuItems().subscribe({
      next: (response) => {
        this.menuItems = response.menuItems || [];
      },
      error: (error) => {
        console.error(
          'Failed to load menu items:',
          error
        );
  
        this.menuItems = [];
      }
    });
  }

  get menuItemCount(): number {
    return this.menuItems.length;
  }
  
  get availableMenuItemCount(): number {
    return this.menuItems.filter(
      item => item.available
    ).length;
  }


  // =========================
  // TODAY
  // =========================

  get todayDate(): string {

    const today = new Date();

    const year =
      today.getFullYear();

    const month =
      String(today.getMonth() + 1).padStart(2, '0');

    const day =
      String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }


  get todayLabel(): string {

    const today = new Date();

    return today.toLocaleDateString(
      'en-GB',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    );
  }


  // =========================
  // TODAY'S RESERVATIONS
  // =========================

  get todayReservations(): Reservation[] {

    return this.reservations
      .filter(
        reservation =>
          reservation.date === this.todayDate
      )
      .sort(
        (a, b) =>
          this.timeToMinutes(a.time) -
          this.timeToMinutes(b.time)
      );
  }


  // =========================
  // SUMMARY
  // =========================

  get totalBookings(): number {

    return this.todayReservations.length;
  }


  get totalCovers(): number {

    return this.todayReservations.reduce(
      (total, reservation) =>
        total + reservation.partySize,
      0
    );
  }


  get confirmedBookings(): number {

    return this.todayReservations.filter(
      reservation =>
        reservation.status === 'Confirmed' ||
        reservation.status === 'Seated'
    ).length;
  }


  get pendingBookings(): number {

    return this.todayReservations.filter(
      reservation =>
        reservation.status === 'Pending'
    ).length;
  }


  // =========================
  // UPCOMING ARRIVALS
  // =========================

  get upcomingArrivals(): Reservation[] {

    return this.todayReservations
      .filter(
        reservation =>
          reservation.status === 'Pending' ||
          reservation.status === 'Confirmed'
      )
      .slice(0, 5);
  }


  // =========================
  // SERVICE ATTENTION
  // =========================

  get pendingAttention(): Reservation[] {

    return this.todayReservations
      .filter(
        reservation =>
          reservation.status === 'Pending'
      )
      .slice(0, 5);
  }


  get specialRequestReservations(): Reservation[] {

    return this.todayReservations
      .filter(
        reservation =>
          !!reservation.specialRequests?.trim()
      )
      .slice(0, 5);
  }


  get unassignedReservations(): Reservation[] {

    return this.todayReservations
      .filter(
        reservation =>
          !reservation.table ||
          reservation.table.trim() === ''
      )
      .filter(
        reservation =>
          reservation.status !== 'Cancelled'
      )
      .slice(0, 5);
  }


  // =========================
  // TABLE / SEATING OVERVIEW
  // =========================

  get assignedReservations(): Reservation[] {

    return this.todayReservations
      .filter(
        reservation =>
          !!reservation.table &&
          reservation.table.trim() !== ''
      );
  }


  get occupiedTables(): number {

    return this.assignedReservations.filter(
      reservation =>
        reservation.status === 'Seated'
    ).length;
  }


  get reservedTables(): number {

    return this.assignedReservations.filter(
      reservation =>
        reservation.status === 'Confirmed'
    ).length;
  }


  get pendingTables(): number {

    return this.assignedReservations.filter(
      reservation =>
        reservation.status === 'Pending'
    ).length;
  }


  // =========================
  // DINING OPTIONS
  // =========================

  get tastingBookings(): number {

    return this.todayReservations.filter(
      reservation =>
        reservation.diningOption === 'tasting'
    ).length;
  }


  get aLaCarteBookings(): number {

    return this.todayReservations.filter(
      reservation =>
        reservation.diningOption === 'alacarte'
    ).length;
  }


  get tableOnlyBookings(): number {

    return this.todayReservations.filter(
      reservation =>
        reservation.diningOption === 'table' ||
        reservation.packageName === 'Table Only'
    ).length;
  }


  // =========================
  // TIME HELPERS
  // =========================

  private timeToMinutes(
    time: string
  ): number {

    const [hours, minutes] =
      time.split(':').map(Number);

    return (
      (hours * 60) +
      minutes
    );
  }


  // =========================
  // STATUS LABEL
  // =========================

  getStatusClass(
    status: Reservation['status']
  ): string {

    return status
      .toLowerCase()
      .replace(/\s+/g, '-');
  }


  // =========================
  // WALK-IN MODAL
  // =========================

  openWalkInModal(): void {

    this.walkInName = '';
    this.walkInGuests = 2;
    this.walkInTable = 'Unassigned';
    this.walkInNotes = '';

    this.showWalkInModal = true;
  }


  closeWalkInModal(): void {

    this.showWalkInModal = false;
  }


  confirmWalkIn(): void {

    const name =
      this.walkInName.trim();

    if (!name) {

      this.showToast(
        'Please enter the guest name.'
      );

      return;
    }

    /*
     * Walk-in creation is currently kept
     * as a dashboard UI action.
     *
     * A backend walk-in endpoint can be
     * connected later if required.
     */

    this.showWalkInModal = false;

    this.showToast(
      `${name} has been added to the service list.`
    );
  }


  // =========================
  // VIEW DETAILS
  // =========================

  viewDetails(
    reservation: Reservation
  ): void {

    const details = [
      reservation.reservationId,
      reservation.guestName,
      `${reservation.partySize} ${reservation.partySize === 1
        ? 'guest'
        : 'guests'
      }`,
      reservation.time,
      reservation.packageName ||
      'Dining service'
    ].join(' · ');

    this.showToast(details);
  }


  // =========================
  // TOAST
  // =========================

  showToast(
    message: string
  ): void {

    this.toastMessage = message;
  }


  dismissToast(): void {

    this.toastMessage = '';
  }


}
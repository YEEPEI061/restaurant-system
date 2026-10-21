import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

import {
  Reservation,
  ReservationService
} from '../../services/reservation.service';

type ReservationTab = 'upcoming' | 'past' | 'cancelled';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './my-reservations.component.html',
  styleUrl: './my-reservations.component.css'
})
export class MyReservationsComponent implements OnInit {

  activeTab: ReservationTab = 'upcoming';

  searchTerm = '';
  sortNewestFirst = true;

  reservations: Reservation[] = [];

  isLoggedIn = false;

  isLoading = true;
  isCancelling = false;

  showCancelModal = false;
  selectedReservation: Reservation | null = null;

  successMessage = '';
  successTitle = '';

  errorTitle = '';
  errorMessage = '';

  successTimeout?: ReturnType<typeof setTimeout>;
  errorTimeout?: ReturnType<typeof setTimeout>;

  readonly beveragePairingPrice = 56;

  constructor(
    private reservationService: ReservationService,
    private router: Router
  ) { }

  ngOnInit(): void {

    const token =
      localStorage.getItem('aurelia_token');

    this.isLoggedIn = !!token;

    if (!this.isLoggedIn) {
      return;
    }

    this.loadReservations();
  }


  // =========================================================
  // LOAD RESERVATIONS FROM DATABASE
  // =========================================================

  loadReservations(): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.reservationService.getMyReservations().subscribe({

      next: (response) => {

        this.reservations = response.reservations ?? [];

        this.isLoading = false;

        console.log(
          'My reservations:',
          this.reservations
        );
      },

      error: (error) => {

        console.error(
          'Failed to load reservations:',
          error
        );

        this.isLoading = false;

        if (error.status === 401) {

          this.isLoggedIn = false;
          this.reservations = [];
          this.isLoading = false;

          return;
        }

        this.showError(
          'Unable to Load Reservations',
          error?.error?.message ||
          'Unable to load your reservations. Please try again.'
        );
      }

    });
  }

  // =========================================================
  // RESERVATION GROUPS
  // =========================================================

  get upcomingReservations(): Reservation[] {

    return this.reservations.filter((reservation) => {

      return (
        reservation.status === 'Pending' ||
        reservation.status === 'Confirmed'
      );

    });
  }

  get pastReservations(): Reservation[] {

    return this.reservations.filter((reservation) => {

      return (
        reservation.status === 'Completed' ||
        reservation.status === 'Seated'
      );

    });
  }

  get cancelledReservations(): Reservation[] {

    return this.reservations.filter(
      (reservation) =>
        reservation.status === 'Cancelled'
    );
  }

  get upcomingCount(): number {
    return this.upcomingReservations.length;
  }

  get pastCount(): number {
    return this.pastReservations.length;
  }

  get cancelledCount(): number {
    return this.cancelledReservations.length;
  }

  get currentReservations(): Reservation[] {

    switch (this.activeTab) {

      case 'past':
        return this.pastReservations;

      case 'cancelled':
        return this.cancelledReservations;

      default:
        return this.upcomingReservations;
    }
  }

  // =========================================================
  // SEARCH + SORT
  // =========================================================

  get filteredReservations(): Reservation[] {

    const term =
      this.searchTerm
        .trim()
        .toLowerCase();

    const results =
      this.currentReservations.filter(
        (reservation) => {

          if (!term) {
            return true;
          }

          const searchableValues = [
            reservation.reservationId,
            reservation.date,
            reservation.time,
            reservation.seating,
            reservation.tastingMenu,
            reservation.packageName,
            reservation.status
          ];

          return searchableValues.some(
            (value) =>
              String(value ?? '')
                .toLowerCase()
                .includes(term)
          );
        }
      );

    return [...results].sort((a, b) => {

      const first =
        new Date(`${a.date}T${a.time}`).getTime();

      const second =
        new Date(`${b.date}T${b.time}`).getTime();

      return this.sortNewestFirst
        ? second - first
        : first - second;
    });
  }

  setActiveTab(tab: ReservationTab): void {

    this.activeTab = tab;

    this.searchTerm = '';

    this.clearError();
  }

  toggleSort(): void {
    this.sortNewestFirst =
      !this.sortNewestFirst;
  }

  // =========================================================
  // DISPLAY HELPERS
  // =========================================================

  formatReservationDate(date: string): string {

    if (!date) {
      return '';
    }

    const parsedDate =
      new Date(`${date}T00:00:00`);

    return parsedDate.toLocaleDateString(
      'en-MY',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    );
  }

  getDiningLabel(
    reservation: Reservation
  ): string {

    switch (reservation.diningOption) {

      case 'tasting':
        return (
          reservation.tastingMenu ||
          reservation.packageName ||
          'Tasting Menu'
        );

      case 'alacarte':
        return 'Hand-Picked Dishes';

      case 'table':
        return 'Table Reservation';

      default:
        return 'Dining Reservation';
    }
  }

  getDiningDescription(
    reservation: Reservation
  ): string {

    switch (reservation.diningOption) {

      case 'tasting':
        return 'A curated dining experience from the Aurelia kitchen';

      case 'alacarte':
        return 'Your selected dishes prepared for your visit';

      case 'table':
        return 'Order from the Aurelia menu when seated';

      default:
        return 'Your upcoming dining experience at Aurelia';
    }
  }

  getServicePeriodLabel(
    reservation: Reservation
  ): string {

    return reservation.servicePeriod === 'brunch'
      ? 'Weekend Brunch'
      : 'Dinner';
  }

  getStatusClass(
    status: string
  ): string {

    switch (status) {

      case 'Confirmed':
        return 'confirmed';

      case 'Pending':
        return 'pending';

      case 'Completed':
        return 'completed';

      case 'Cancelled':
        return 'cancelled';

      default:
        return '';
    }
  }

  getSpecialRequest(
    reservation: Reservation
  ): string {

    return (
      reservation.specialRequests?.trim() ||
      'No special requests.'
    );
  }

  // =========================================================
  // PRICE
  // =========================================================

  getSelectedDishesTotal(
    reservation: Reservation
  ): number {

    return (
      reservation.selectedDishes ?? []
    ).reduce(
      (total, dish) =>
        total + Number(dish.price || 0),
      0
    );
  }

  getEstimatedTotal(
    reservation: Reservation
  ): number {

    let total = 0;

    if (
      reservation.diningOption === 'alacarte'
    ) {
      total +=
        this.getSelectedDishesTotal(
          reservation
        ) * reservation.partySize;
    }

    /*
      We currently do not store the tasting-menu
      price inside the reservation record.

      Therefore, do not invent a price here.
    */

    if (reservation.beveragePairing) {

      total +=
        this.beveragePairingPrice *
        reservation.partySize;
    }

    return total;
  }

  hasEstimatedPrice(
    reservation: Reservation
  ): boolean {

    return (
      reservation.diningOption === 'alacarte' ||
      reservation.beveragePairing
    );
  }

  // =========================================================
  // ACTIONS
  // =========================================================

  goToLogin(): void {
    this.router.navigate(['/guest-login']);
  }

  reserveAnotherTable(): void {
    this.router.navigate(['/reservations']);
  }

  modifyReservation(reservation: Reservation): void {

    this.router.navigate(
      ['/reservations'],
      {
        state: {
          reservation
        }
      }
    );

  }

  rebookReservation(
    reservation: Reservation
  ): void {

    this.router.navigate(
      ['/reservations'],
      {
        queryParams: {
          rebook:
            reservation.reservationId
        }
      }
    );
  }

  // =========================================================
  // CANCELLATION
  // =========================================================

  openCancelModal(
    reservation: Reservation
  ): void {

    this.selectedReservation =
      reservation;

    this.clearError();

    this.showCancelModal = true;
  }

  closeCancelModal(): void {

    if (this.isCancelling) {
      return;
    }

    this.showCancelModal = false;

    this.selectedReservation = null;

    this.clearError();
  }

  confirmCancellation(): void {

    if (
      !this.selectedReservation ||
      this.isCancelling
    ) {
      return;
    }

    const reservation =
      this.selectedReservation;

    this.isCancelling = true;

    this.clearError();

    this.reservationService
      .updateReservationStatus(
        reservation.reservationId,
        'Cancelled'
      )
      .subscribe({

        next: () => {

          this.isCancelling = false;

          // Close cancellation confirmation
          this.showCancelModal = false;
          this.selectedReservation = null;

          // Show success modal
          this.showSuccess(
            'Reservation Cancelled',
            `Reservation ${reservation.reservationId} has been cancelled successfully.`
          );

          // Move to Cancelled tab after success message
          setTimeout(() => {

            this.activeTab = 'cancelled';
            this.searchTerm = '';

            this.loadReservations();

          }, 1400);
        },

        error: (error) => {

          console.error(
            'Cancellation failed:',
            error
          );

          this.isCancelling = false;

          this.showError(
            'Unable to Cancel Reservation',
            error?.error?.message ||
            'Unable to cancel this reservation. Please try again.'
          );
        }

      });
  }

  getGroupedSelectedDishes(
    reservation: Reservation
  ): Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }> {

    const grouped = new Map<
      string,
      {
        id: string;
        name: string;
        price: number;
        quantity: number;
      }
    >();

    for (const dish of reservation.selectedDishes ?? []) {

      const existing = grouped.get(dish.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        grouped.set(dish.id, {
          ...dish,
          quantity: 1
        });
      }
    }

    return Array.from(grouped.values());
  }

  canModifyReservation(reservation: Reservation): boolean {
    return (
      reservation.status === 'Pending' ||
      reservation.status === 'Confirmed'
    );
  }

  // =========================
  // SUCCESS MESSAGE
  // =========================

  showSuccess(
    title: string,
    message: string
  ): void {

    // Remove existing error
    this.clearError();

    // Reset existing timer
    if (this.successTimeout) {
      clearTimeout(
        this.successTimeout
      );
    }

    this.successTitle =
      title;

    this.successMessage =
      message;

    this.successTimeout =
      setTimeout(() => {

        this.successMessage =
          '';

        this.successTitle =
          '';

      }, 1400);
  }

  // =========================
  // ERROR MESSAGE
  // =========================


  showError(
    title: string,
    message: string
  ): void {

    // Remove existing success message
    this.clearSuccess();

    // Cancel any previous error timer
    if (this.errorTimeout) {
      clearTimeout(
        this.errorTimeout
      );

      this.errorTimeout =
        undefined;
    }

    this.errorTitle =
      title;

    this.errorMessage =
      message;
  }

  // =========================
  // CLEAR SUCCESS
  // =========================

  clearSuccess(): void {

    if (this.successTimeout) {

      clearTimeout(
        this.successTimeout
      );

      this.successTimeout =
        undefined;
    }

    this.successMessage =
      '';

    this.successTitle =
      '';
  }

  // =========================
  // CLEAR ERROR
  // =========================

  clearError(): void {

    if (this.errorTimeout) {

      clearTimeout(
        this.errorTimeout
      );

      this.errorTimeout =
        undefined;
    }

    this.errorMessage =
      '';

    this.errorTitle =
      '';
  }
}
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

type ReservationTab = 'upcoming' | 'past' | 'cancelled';
type ReservationStatus = 'Confirmed' | 'Completed' | 'Cancelled';

interface CourseItem {
  name: string;
  description: string;
  price: number;
}

interface Reservation {
  reference: string;
  status: ReservationStatus;
  dateLabel: string;
  shortDate: string;
  isoDate: string;
  time: string;
  arrivalWindow: string;
  guests: number;
  area: string;
  tableLabel: string;
  menu: string;
  menuDescription: string;
  menuPrice: number;
  notes: string;
  dietaryLabel: string;
  courses: CourseItem[];
  pairingIncluded: boolean;
  pairingPrice: number;
  paymentLabel: string;
}

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './my-reservations.component.html',
  styleUrl: './my-reservations.component.css'
})
export class MyReservationsComponent {
  activeTab: ReservationTab = 'upcoming';

  searchTerm = '';
  sortNewestFirst = true;

  showCancelModal = false;
  selectedReservation: Reservation | null = null;

  cancelReason = 'Scheduling conflict / Travel changes';
  toastMessage = '';
  errorMessage = '';

  upcomingReservations: Reservation[] = [
    {
      reference: 'AUR-9042',
      status: 'Confirmed',
      dateLabel: 'Saturday, 17 October 2026',
      shortDate: '17 Oct 2026',
      isoDate: '2026-10-17',
      time: '19:15',
      arrivalWindow: '19:15 – 19:30',
      guests: 2,
      area: 'Main Dining Room',
      tableLabel: 'Table 04',
      menu: 'Seven-Course Seasonal Experience',
      menuDescription: 'A curated journey inspired by seasonal ingredients.',
      menuPrice: 320,
      notes: 'Anniversary dinner — a quiet corner table preferred.',
      dietaryLabel: 'Dietary requests noted',
      courses: [
        {
          name: 'Seasonal Tasting Experience × 2',
          description: 'A multi-course seasonal menu',
          price: 320
        },
        {
          name: 'Non-Alcoholic Beverage Pairing × 2',
          description: 'Seasonal juices, botanical infusions and house-made drinks',
          price: 112
        }
      ],
      pairingIncluded: true,
      pairingPrice: 56,
      paymentLabel: 'Deposit secured'
    },
    {
      reference: 'AUR-9187',
      status: 'Confirmed',
      dateLabel: 'Sunday, 8 November 2026',
      shortDate: '8 Nov 2026',
      isoDate: '2026-11-08',
      time: '18:30',
      arrivalWindow: '18:30 – 18:45',
      guests: 4,
      area: 'Chef’s Counter',
      tableLabel: 'Counter 02',
      menu: 'Seasonal Signature Menu',
      menuDescription: 'A selection of Aurelia signature dishes.',
      menuPrice: 280,
      notes: 'Please seat our group together if possible.',
      dietaryLabel: 'No additional requests',
      courses: [
        {
          name: 'Seasonal Signature Menu × 4',
          description: 'A selection of signature dishes',
          price: 280
        }
      ],
      pairingIncluded: false,
      pairingPrice: 56,
      paymentLabel: 'Deposit secured'
    }
  ];

  pastReservations: Reservation[] = [
    {
      reference: 'AUR-8104',
      status: 'Completed',
      dateLabel: '15 August 2026',
      shortDate: '15 Aug 2026',
      isoDate: '2026-08-15',
      time: '20:00',
      arrivalWindow: '20:00',
      guests: 2,
      area: 'Timber Atrium',
      tableLabel: 'Table 06',
      menu: 'Seasonal Harvest Tasting',
      menuDescription: 'A seasonal multi-course dining experience.',
      menuPrice: 350,
      notes: 'No additional requests.',
      dietaryLabel: 'Completed seating',
      courses: [],
      pairingIncluded: false,
      pairingPrice: 56,
      paymentLabel: 'Payment settled'
    },
    {
      reference: 'AUR-7519',
      status: 'Completed',
      dateLabel: '21 June 2026',
      shortDate: '21 Jun 2026',
      isoDate: '2026-06-21',
      time: '19:30',
      arrivalWindow: '19:30',
      guests: 4,
      area: 'Chef’s Counter',
      tableLabel: 'Counter 01',
      menu: 'Midsummer Botanical Evening',
      menuDescription: 'A menu inspired by fresh seasonal ingredients.',
      menuPrice: 680,
      notes: 'A birthday celebration.',
      dietaryLabel: 'Completed seating',
      courses: [],
      pairingIncluded: false,
      pairingPrice: 56,
      paymentLabel: 'Payment settled'
    },
    {
      reference: 'AUR-6890',
      status: 'Completed',
      dateLabel: '12 April 2026',
      shortDate: '12 Apr 2026',
      isoDate: '2026-04-12',
      time: '18:45',
      arrivalWindow: '18:45',
      guests: 2,
      area: 'Main Dining Room',
      tableLabel: 'Table 03',
      menu: 'Spring Garden Degustation',
      menuDescription: 'A spring-inspired tasting experience.',
      menuPrice: 320,
      notes: 'No additional requests.',
      dietaryLabel: 'Completed seating',
      courses: [],
      pairingIncluded: false,
      pairingPrice: 56,
      paymentLabel: 'Payment settled'
    }
  ];

  cancelledReservations: Reservation[] = [];

  constructor(private router: Router) {}

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

  get filteredReservations(): Reservation[] {
    const term = this.searchTerm.trim().toLowerCase();

    const results = this.currentReservations.filter((reservation) => {
      if (!term) {
        return true;
      }

      return [
        reservation.reference,
        reservation.dateLabel,
        reservation.time,
        reservation.area,
        reservation.menu,
        reservation.status
      ].some((value) => value.toLowerCase().includes(term));
    });

    return [...results].sort((a, b) => {
      const comparison = a.isoDate.localeCompare(b.isoDate);
      return this.sortNewestFirst ? -comparison : comparison;
    });
  }

  get estimatedTotal(): number {
    if (!this.selectedReservation) {
      return 0;
    }

    return this.selectedReservation.courses.reduce(
      (total, course) => total + course.price,
      0
    );
  }


  setActiveTab(tab: ReservationTab): void {
    this.activeTab = tab;
    this.searchTerm = '';
    this.errorMessage = '';
  }

  toggleSort(): void {
    this.sortNewestFirst = !this.sortNewestFirst;
  }

  reserveAnotherTable(): void {
    this.router.navigate(['/reservations']);
  }

  modifyReservation(reservation: Reservation): void {
    this.router.navigate(['/reservations'], {
      queryParams: {
        modify: reservation.reference
      }
    });
  }

  rebookReservation(reservation: Reservation): void {
    this.router.navigate(['/reservations'], {
      queryParams: {
        rebook: reservation.reference
      }
    });
  }

  downloadReceipt(reservation: Reservation): void {
    this.showToast(
      `Receipt for ${reservation.reference} will be available when payment records are connected.`
    );
  }

  openCancelModal(reservation: Reservation): void {
    this.selectedReservation = reservation;
    this.cancelReason = 'Scheduling conflict / Travel changes';
    this.errorMessage = '';
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.selectedReservation = null;
    this.errorMessage = '';
  }

  confirmCancellation(): void {
    if (!this.selectedReservation) {
      return;
    }

    const reservation = this.selectedReservation;

    this.upcomingReservations = this.upcomingReservations.filter(
      (item) => item.reference !== reservation.reference
    );

    reservation.status = 'Cancelled';
    reservation.notes =
      `Cancellation reason: ${this.cancelReason}`;

    this.cancelledReservations = [
      reservation,
      ...this.cancelledReservations
    ];

    this.closeCancelModal();
    this.activeTab = 'cancelled';
    this.searchTerm = '';

    this.showToast(
      `${reservation.reference} has been cancelled.`
    );
  }

  showToast(message: string): void {
    this.toastMessage = message;
  }

  dismissToast(): void {
    this.toastMessage = '';
  }

  trackReservation(
    _index: number,
    reservation: Reservation
  ): string {
    return reservation.reference;
  }

  getTotalForReservation(reservation: Reservation): string {
    const total = reservation.courses.reduce(
      (sum, course) => sum + course.price,
      0
    );
  
    return total.toFixed(2);
  }
  
  getBalanceForReservation(reservation: Reservation): string {
    const total = reservation.courses.reduce(
      (sum, course) => sum + course.price,
      0
    );
  
    return Math.max(total).toFixed(2);
  }
}
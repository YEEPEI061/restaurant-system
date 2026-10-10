import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

type BookingStatus = 'Confirmed' | 'Pending' | 'Seated';

interface Reservation {
  id: string;
  time: string;
  customer: string;
  email: string;
  guests: number;
  table: string;
  package: string;
  status: BookingStatus;
  note: string;
  vip?: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  readonly todayLabel = 'Friday, 9 October 2026';

  activeFilter: 'All' | 'Confirmed' | 'Pending' = 'All';
  searchTerm = '';

  showWalkInModal = false;
  toastMessage = '';

  walkInName = '';
  walkInGuests = 2;
  walkInTable = 'Counter 05';
  walkInNotes = '';

  reservations: Reservation[] = [
    {
      id: 'AUR-9042',
      time: '17:30',
      customer: 'Danish Embassy Delegation',
      email: 'delegation@example.com',
      guests: 6,
      table: 'Table 12',
      package: 'Signature Seasonal Menu',
      status: 'Confirmed',
      note: 'Please prepare a quiet seating area.',
      vip: true
    },
    {
      id: 'AUR-9187',
      time: '18:15',
      customer: 'Magnus & Astrid Lindqvist',
      email: 'magnus@example.com',
      guests: 2,
      table: 'Unassigned',
      package: 'Autumn Harvest Tasting',
      status: 'Pending',
      note: 'Window-side table requested for an anniversary.'
    },
    {
      id: 'AUR-9201',
      time: '19:00',
      customer: 'Dr. Soren Møller',
      email: 'soren@example.com',
      guests: 2,
      table: 'Table 04',
      package: 'Seasonal Tasting Menu',
      status: 'Confirmed',
      note: 'One guest is pescatarian.'
    },
    {
      id: 'AUR-9215',
      time: '19:45',
      customer: 'Camilla Schou Group',
      email: 'camilla@example.com',
      guests: 8,
      table: 'Table 18 (Hold)',
      package: 'Group Dining Experience',
      status: 'Pending',
      note: 'Please confirm the group seating arrangement.'
    },
    {
      id: 'AUR-9228',
      time: '20:00',
      customer: 'Elena Rostov & Guest',
      email: 'elena@example.com',
      guests: 2,
      table: 'Counter 03–04',
      package: 'Chef’s Counter Experience',
      status: 'Confirmed',
      note: 'Important: shellfish allergy.'
    },
    {
      id: 'AUR-9240',
      time: '20:15',
      customer: 'Klaus Hedegaard',
      email: 'klaus@example.com',
      guests: 4,
      table: 'Table 09',
      package: 'Signature Seasonal Menu',
      status: 'Confirmed',
      note: 'Seasonal non-alcoholic beverage pairing.'
    }
  ];

  get filteredReservations(): Reservation[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.reservations.filter((reservation) => {
      const matchesFilter =
        this.activeFilter === 'All' ||
        reservation.status === this.activeFilter;

      const searchableText = [
        reservation.id,
        reservation.customer,
        reservation.email,
        reservation.table,
        reservation.package,
        reservation.status
      ].join(' ').toLowerCase();

      return matchesFilter && searchableText.includes(term);
    });
  }

  get totalBookings(): number {
    return this.reservations.length;
  }

  get confirmedBookings(): number {
    return this.reservations.filter(
      (reservation) =>
        reservation.status === 'Confirmed' ||
        reservation.status === 'Seated'
    ).length;
  }

  get pendingBookings(): number {
    return this.reservations.filter(
      (reservation) => reservation.status === 'Pending'
    ).length;
  }

  get totalCovers(): number {
    return this.reservations.reduce(
      (total, reservation) => total + reservation.guests,
      0
    );
  }

  setFilter(filter: 'All' | 'Confirmed' | 'Pending'): void {
    this.activeFilter = filter;
  }

  openWalkInModal(): void {
    this.walkInName = '';
    this.walkInGuests = 2;
    this.walkInTable = 'Counter 05';
    this.walkInNotes = '';
    this.showWalkInModal = true;
  }

  closeWalkInModal(): void {
    this.showWalkInModal = false;
  }

  confirmWalkIn(): void {
    const name = this.walkInName.trim();

    if (!name) {
      this.showToast('Please enter the guest name.');
      return;
    }

    const newReservation: Reservation = {
      id: `AUR-${Math.floor(1000 + Math.random() * 9000)}`,
      time: new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      customer: name,
      email: 'Walk-in guest',
      guests: Number(this.walkInGuests),
      table: this.walkInTable,
      package: 'Walk-In Dining',
      status: 'Seated',
      note: this.walkInNotes.trim() || 'Walk-in booking.'
    };

    this.reservations = [newReservation, ...this.reservations];
    this.showWalkInModal = false;
    this.activeFilter = 'All';
    this.searchTerm = '';

    this.showToast(`${name} has been added to today's bookings.`);
  }

  confirmReservation(reservation: Reservation): void {
    this.updateReservationStatus(reservation, 'Confirmed');
    this.showToast(`Reservation ${reservation.id} confirmed.`);
  }

  seatReservation(reservation: Reservation): void {
    this.updateReservationStatus(reservation, 'Seated');
    this.showToast(`${reservation.customer} has been marked as seated.`);
  }

  private updateReservationStatus(
    target: Reservation,
    status: BookingStatus
  ): void {
    this.reservations = this.reservations.map((reservation) =>
      reservation.id === target.id
        ? { ...reservation, status }
        : reservation
    );
  }

  viewDetails(reservation: Reservation): void {
    const note = reservation.note
      ? `\n\nSpecial notes: ${reservation.note}`
      : '';

    this.showToast(
      `${reservation.id} · ${reservation.customer}${note}`
    );
  }

  showToast(message: string): void {
    this.toastMessage = message;
  }

  dismissToast(): void {
    this.toastMessage = '';
  }
}
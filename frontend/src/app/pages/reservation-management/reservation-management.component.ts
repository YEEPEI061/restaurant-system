import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Seated'
  | 'Completed'
  | 'Cancelled';

interface Reservation {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  table: string;
  packageName: string;
  deposit: number;
  status: BookingStatus;
  dietaryNotes: string;
  specialRequests: string;
  vip: boolean;
}

@Component({
  selector: 'app-reservation-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './reservation-management.component.html',
  styleUrl: './reservation-management.component.css'
})
export class ReservationManagementComponent {
  reservations: Reservation[] = [
    {
      id: 'AUR-8845',
      guestName: "Johan Razak",
      email: 'johan.razak@example.com',
      phone: '+60 12 348 9921',
      date: '2026-10-10',
      time: '20:00',
      guests: 4,
      table: 'T-12',
      packageName: 'Seven-Course Tasting',
      deposit: 200,
      status: 'Pending',
      dietaryNotes: 'Shellfish allergy. Confirm with the kitchen before service.',
      specialRequests: 'Quiet table preferred.',
      vip: true
    },
    {
      id: 'AUR-8821',
      guestName: 'Henrik Lindqvist',
      email: 'henrik.lindqvist@example.com',
      phone: '+60 12 555 1104',
      date: '2026-10-10',
      time: '19:30',
      guests: 6,
      table: 'T-08',
      packageName: 'Seven-Course Tasting',
      deposit: 150,
      status: 'Confirmed',
      dietaryNotes: 'One guest is pescatarian. Please confirm suitable alternatives.',
      specialRequests: 'Anniversary dinner.',
      vip: true
    },
    {
      id: 'AUR-8814',
      guestName: 'Milla Soderberg',
      email: 'milla.soderberg@example.com',
      phone: '+60 12 444 9122',
      date: '2026-10-10',
      time: '18:30',
      guests: 2,
      table: 'T-04',
      packageName: 'Five-Course Tasting',
      deposit: 50,
      status: 'Seated',
      dietaryNotes: 'No dietary notes provided.',
      specialRequests: 'Window seat if available.',
      vip: false
    },
    {
      id: 'AUR-8819',
      guestName: 'Kenji Tanaka',
      email: 'kenji.tanaka@example.com',
      phone: '+60 12 4120 3844',
      date: '2026-10-10',
      time: '19:00',
      guests: 2,
      table: 'C-01',
      packageName: 'Seven-Course Tasting',
      deposit: 100,
      status: 'Seated',
      dietaryNotes: 'Please confirm dietary requirements with the guest.',
      specialRequests: 'Chef counter seating.',
      vip: false
    },
    {
      id: 'AUR-8824',
      guestName: 'Astrid Moller',
      email: 'astrid.moller@example.com',
      phone: '+60 12 509 8234',
      date: '2026-10-10',
      time: '20:00',
      guests: 4,
      table: 'T-05',
      packageName: 'A La Carte',
      deposit: 100,
      status: 'Confirmed',
      dietaryNotes: 'Gluten-free requirements. Confirm preparation with kitchen.',
      specialRequests: 'Birthday dinner.',
      vip: false
    },
    {
      id: 'AUR-8802',
      guestName: 'Marcus Hojbjerg',
      email: 'marcus.h@example.com',
      phone: '+60 12 312 0490',
      date: '2026-10-10',
      time: '18:00',
      guests: 2,
      table: '',
      packageName: 'Five-Course Tasting',
      deposit: 0,
      status: 'Cancelled',
      dietaryNotes: 'None recorded.',
      specialRequests: 'Booking cancelled by guest.',
      vip: false
    }
  ];

  tables = [
    { id: 'T-01', label: 'T-01 · Main Hall · 2 seats' },
    { id: 'T-02', label: 'T-02 · Solarium · 2 seats' },
    { id: 'T-03', label: 'T-03 · Main Hall · 4 seats' },
    { id: 'T-04', label: 'T-04 · Main Hall · 2 seats' },
    { id: 'T-05', label: 'T-05 · Garden Room · 4 seats' },
    { id: 'T-08', label: 'T-08 · Garden Room · 4 seats' },
    { id: 'T-12', label: 'T-12 · Private Dining · 6 seats' },
    { id: 'C-01', label: 'C-01 · Chef Counter · 2 seats' }
  ];

  packages = [
    'A La Carte',
    'Five-Course Tasting',
    'Seven-Course Tasting',
    'Chef Seasonal Menu'
  ];

  statusOptions: BookingStatus[] = [
    'Pending',
    'Confirmed',
    'Seated',
    'Completed',
    'Cancelled'
  ];

  activeFilter = 'All';
  searchQuery = '';

  drawerOpen = false;
  drawerMode: 'create' | 'edit' = 'edit';
  toastMessage = '';

  form: Reservation = this.emptyReservation();

  // constructor() {
  //   const firstReservation = this.reservations.find(
  //     reservation => reservation.status === 'Pending'
  //   );

  //   if (firstReservation) {
  //     this.openReservation(firstReservation);
  //   }
  // }

  get filteredReservations(): Reservation[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.reservations.filter(reservation => {
      const matchesSearch =
        !query ||
        reservation.id.toLowerCase().includes(query) ||
        reservation.guestName.toLowerCase().includes(query) ||
        reservation.phone.toLowerCase().includes(query) ||
        reservation.email.toLowerCase().includes(query);

      const matchesStatus =
        this.activeFilter === 'All' ||
        reservation.status === this.activeFilter;

      return matchesSearch && matchesStatus;
    });
  }

  get totalCount(): number {
    return this.reservations.filter(r => r.status !== 'Cancelled').length;
  }

  get pendingCount(): number {
    return this.reservations.filter(r => r.status === 'Pending').length;
  }

  get confirmedCount(): number {
    return this.reservations.filter(r => r.status === 'Confirmed').length;
  }

  get seatedCount(): number {
    return this.reservations.filter(r => r.status === 'Seated').length;
  }

  get cancelledCount(): number {
    return this.reservations.filter(r => r.status === 'Cancelled').length;
  }

  get estimatedTotal(): number {
    return this.form.guests * this.packagePrice(this.form.packageName);
  }

  get amountDue(): number {
    return Math.max(0, this.estimatedTotal - this.form.deposit);
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
  }

  openReservation(reservation: Reservation): void {
    this.drawerMode = 'edit';
    this.form = { ...reservation };
    this.drawerOpen = true;
  }

  openCreateDrawer(): void {
    this.drawerMode = 'create';
    this.form = this.emptyReservation();
    this.drawerOpen = true;
  }

  closeDrawer(): void {
    this.drawerOpen = false;
  }

  saveReservation(): void {
    if (
      !this.form.guestName.trim() ||
      !this.form.phone.trim() ||
      !this.form.date ||
      !this.form.time ||
      this.form.guests < 1
    ) {
      this.showToast('Please complete all required booking details.');
      return;
    }

    if (this.drawerMode === 'create') {
      const nextNumber =
        Math.max(
          0,
          ...this.reservations.map(r => Number(r.id.split('-')[1]) || 0)
        ) + 1;

      this.form.id = `AUR-${nextNumber}`;
      this.reservations = [
        { ...this.form },
        ...this.reservations
      ];

      this.showToast('New reservation created successfully.');
    } else {
      this.reservations = this.reservations.map(reservation =>
        reservation.id === this.form.id
          ? { ...this.form }
          : reservation
      );

      this.showToast('Reservation changes saved.');
    }

    this.drawerOpen = false;
  }

  updateStatus(
    reservation: Reservation,
    status: BookingStatus
  ): void {
    reservation.status = status;

    if (this.form.id === reservation.id) {
      this.form = { ...reservation };
    }

    this.showToast(`${reservation.id} updated to ${status}.`);
  }

  assignTable(reservation: Reservation, tableId: string): void {
    reservation.table = tableId;

    if (this.form.id === reservation.id) {
      this.form.table = tableId;
    }

    this.showToast(
      tableId
        ? `Table ${tableId} assigned to ${reservation.id}.`
        : `Table assignment removed for ${reservation.id}.`
    );
  }

  getStatusClass(status: BookingStatus): string {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Confirmed':
        return 'status-confirmed';
      case 'Seated':
        return 'status-seated';
      case 'Completed':
        return 'status-completed';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  packagePrice(packageName: string): number {
    switch (packageName) {
      case 'Five-Course Tasting':
        return 150;
      case 'Seven-Course Tasting':
        return 175;
      case 'Chef Seasonal Menu':
        return 200;
      default:
        return 100;
    }
  }

  exportCsv(): void {
    const headers = [
      'Booking Reference',
      'Guest Name',
      'Email',
      'Phone',
      'Date',
      'Time',
      'Guests',
      'Table',
      'Package',
      'Deposit (RM)',
      'Status'
    ];

    const rows = this.filteredReservations.map(r => [
      r.id,
      r.guestName,
      r.email,
      r.phone,
      r.date,
      r.time,
      String(r.guests),
      r.table,
      r.packageName,
      String(r.deposit),
      r.status
    ]);

    const escapeCsv = (value: string): string =>
      `"${value.replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'aurelia-reservations.csv';
    link.click();

    URL.revokeObjectURL(url);
    this.showToast('Reservation CSV exported.');
  }

  showAuditLog(): void {
    this.showToast('Audit log will be connected to the backend later.');
  }

  showFloorMatrix(): void {
    this.showToast('Floor matrix will be available in a future update.');
  }

  trackById(_: number, reservation: Reservation): string {
    return reservation.id;
  }

  private emptyReservation(): Reservation {
    return {
      id: '',
      guestName: '',
      email: '',
      phone: '',
      date: '2026-10-10',
      time: '19:00',
      guests: 2,
      table: '',
      packageName: 'A La Carte',
      deposit: 0,
      status: 'Pending',
      dietaryNotes: '',
      specialRequests: '',
      vip: false
    };
  }

  private showToast(message: string): void {
    this.toastMessage = message;

    setTimeout(() => {
      if (this.toastMessage === message) {
        this.toastMessage = '';
      }
    }, 3000);
  }
}
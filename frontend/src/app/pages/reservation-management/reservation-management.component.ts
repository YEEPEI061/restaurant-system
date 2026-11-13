import {
  Component,
  OnInit, HostListener,
  OnDestroy
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  ReservationService,
  Reservation,
  ReservationStatus,
  SelectedDish
} from '../../services/reservation.service';

import {
  WebSocketService
} from '../../services/websocket.service';
import { interval, Subscription } from 'rxjs';


import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

type ReservationFilter =
  | 'All'
  | 'Pending'
  | 'Confirmed'
  | 'Seated'
  | 'Completed'
  | 'Cancelled';

type ReservationSort =
  | 'date-newest'
  | 'date-oldest'
  | 'id-ascending'
  | 'id-descending';

type DrawerMode =
  | 'create'
  | 'edit';


interface RestaurantTable {
  id: string;
  label: string;
  capacity: number;
}


interface ReservationForm {
  reservationId: string;

  guestName: string;
  phone: string;
  email: string;

  partySize: number;

  date: string;
  time: string;

  packageName: string;
  table: string;

  selectedDishes: SelectedDish[];

  status: ReservationStatus;

  dietaryNotes: string;
  specialRequests: string;
}

interface ReservationRequest {
  guestName: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  partySize: number;
  servicePeriod: 'dinner' | 'brunch';
  diningOption: 'tasting' | 'alacarte' | 'table';
  tastingMenu: string;
  selectedDishes: SelectedDish[];
  beveragePairing: boolean;
  packageName: string;
  table: string;
  status?: ReservationStatus;
  dietaryNotes?: string;
  specialRequests: string;
}

@Component({
  selector: 'app-reservation-management',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent
  ],

  templateUrl:
    './reservation-management.component.html',

  styleUrl:
    './reservation-management.component.css'
})
export class ReservationManagementComponent
  implements OnInit, OnDestroy {

  /*
   * --------------------------------------------------
   * DATA
   * --------------------------------------------------
   */

  reservations: Reservation[] = [];

  isLoading = false;

  /*
   * --------------------------------------------------
   * SEARCH / FILTER
   * --------------------------------------------------
   */

  searchQuery = '';

  activeFilter:
    ReservationFilter = 'All';

  /*
  * --------------------------------------------------
  * PAGINATION
  * --------------------------------------------------
  */

  pageSize = 10;

  currentPage = 1;

  pageSizeOptions = [10, 50, 100];

  /*
   * --------------------------------------------------
   * DRAWER
   * --------------------------------------------------
   */

  drawerOpen = false;

  drawerMode:
    DrawerMode = 'create';


  /*
   * --------------------------------------------------
   * FORM
   * --------------------------------------------------
   */

  form: ReservationForm =
    this.createEmptyForm();


  /*
   * --------------------------------------------------
   * TABLES
   * --------------------------------------------------
   */

  tables: RestaurantTable[] = [
    { id: 'T01', label: 'Table 01', capacity: 2 },
    { id: 'T02', label: 'Table 02', capacity: 2 },
    { id: 'T03', label: 'Table 03', capacity: 2 },
    { id: 'T04', label: 'Table 04', capacity: 4 },
    { id: 'T05', label: 'Table 05', capacity: 4 },
    { id: 'T06', label: 'Table 06', capacity: 4 },
    { id: 'T07', label: 'Table 07', capacity: 4 },
    { id: 'T08', label: 'Table 08', capacity: 6 },
    { id: 'T09', label: 'Table 09', capacity: 6 },
    { id: 'T10', label: 'Table 10', capacity: 8 }
  ];

  private reservationCompletionSubscription?: Subscription;

  /*
 * --------------------------------------------------
 * TABLE CAPACITY VALIDATION
 * --------------------------------------------------
 */

  getTableCapacity(tableId: string): number {
    return this.tables.find(
      table => table.id === tableId
    )?.capacity ?? 0;
  }

  isTableCapacitySuitable(
    tableId: string,
    partySize: number
  ): boolean {
    const capacity = this.getTableCapacity(tableId);

    return (
      capacity > 0 &&
      partySize > 0 &&
      partySize <= capacity
    );
  }

  /*
   * --------------------------------------------------
   * DINING PACKAGES
   * --------------------------------------------------
   */

  packages: string[] = [

    'Seven Course Odyssey',

    'Five Course Prelude',

    'À La Carte',

    'Table Only'

  ];


  /*
   * --------------------------------------------------
   * RESERVATION STATUSES
   * --------------------------------------------------
   */

  statusOptions:
    ReservationStatus[] = [

      'Pending',

      'Confirmed',

      'Seated',

      'Completed',

      'Cancelled'

    ];

  sortOption: ReservationSort = 'date-newest';


  /*
  * --------------------------------------------------
  * MESSAGE MODALS
  * --------------------------------------------------
  */

  successMessage = '';
  successTitle = '';

  private successTimeout?:
    ReturnType<typeof setTimeout>;

  errorTitle = '';
  errorMessage = '';

  private errorTimeout?:
    ReturnType<typeof setTimeout>;


  cancelConfirmOpen = false;

  reservationToCancel: Reservation | null = null;

  deleteConfirmOpen = false;

  reservationToDelete: Reservation | null = null;

  /*
   * --------------------------------------------------
   * CONSTRUCTOR
   * --------------------------------------------------
   */

  constructor(
    private reservationService:
      ReservationService,
    private webSocketService: WebSocketService
  ) { }


  /*
   * --------------------------------------------------
   * INITIALISE
   * --------------------------------------------------
   */

  ngOnInit(): void {

    this.loadReservations();

    this.webSocketService.connect();

    this.webSocketService.messages$
      .subscribe(message => {

        console.log(
          'WebSocket message:',
          message
        );

        switch (message.type) {

          case 'reservation.created':
            this.loadReservations();
            break;

          case 'reservation.updated':
            this.loadReservations();
            break;

          case 'reservation.cancelled':
            this.loadReservations();
            break;

        }

      });

    this.completePastReservations();

    this.reservationCompletionSubscription = interval(10000)
      .subscribe(() => {
        this.completePastReservations();
      });

  }

  ngOnDestroy(): void {
    this.reservationCompletionSubscription?.unsubscribe();
  }


  /*
   * --------------------------------------------------
   * LOAD RESERVATIONS
   * --------------------------------------------------
   */

  loadReservations(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.reservationService
      .getReservations()
      .subscribe({

        next: (response) => {

          this.reservations =
            response.reservations || [];

          this.completePastReservations();

          this.isLoading = false;

        },

        error: (error) => {

          console.error(
            'Failed to load reservations:',
            error
          );

          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            'Unable to load reservations. Please try again.';

        }

      });

  }


  /*
   * --------------------------------------------------
   * EMPTY FORM
   * --------------------------------------------------
   */

  private createEmptyForm():
    ReservationForm {

    const today =
      new Date();

    const date =
      this.toDateInputValue(today);

    return {

      reservationId: '',

      guestName: '',

      phone: '',

      email: '',

      partySize: 2,

      date,

      time: '18:00',

      packageName:
        'Seven Course Odyssey',

      table: '',

      selectedDishes: [],

      status: 'Pending',

      dietaryNotes: '',

      specialRequests: ''

    };

  }


  /*
   * --------------------------------------------------
   * CREATE DRAWER
   * --------------------------------------------------
   */

  openCreateDrawer(): void {

    this.drawerMode = 'create';

    this.form =
      this.createEmptyForm();

    this.drawerOpen = true;

  }


  /*
   * --------------------------------------------------
   * OPEN EXISTING RESERVATION
   * --------------------------------------------------
   */

  openReservation(
    reservation: Reservation
  ): void {

    this.drawerMode = 'edit';

    this.form = {

      reservationId:
        reservation.reservationId || '',

      guestName:
        reservation.guestName || '',

      phone:
        reservation.phone || '',

      email:
        reservation.email || '',

      partySize:
        Number(reservation.partySize) || 1,

      date:
        this.formatDateForInput(
          reservation.date
        ),

      time:
        reservation.time || '18:00',

      packageName:
        reservation.packageName ||
        this.getPackageName(
          reservation
        ),

      selectedDishes:
        reservation.selectedDishes || [],

      table:
        reservation.table || '',

      status:
        reservation.status ||
        'Pending',

      dietaryNotes: '',

      specialRequests:
        reservation.specialRequests ||
        ''

    };

    this.drawerOpen = true;

  }


  /*
   * --------------------------------------------------
   * CLOSE DRAWER
   * --------------------------------------------------
   */

  closeDrawer(): void {

    this.drawerOpen = false;

    this.form =
      this.createEmptyForm();

  }


  /*
   * --------------------------------------------------
   * FILTER
   * --------------------------------------------------
   */

  setFilter(filter: ReservationFilter): void {
    this.activeFilter = filter;
    this.currentPage = 1;
  }


  /*
   * --------------------------------------------------
   * FILTERED RESERVATIONS
   * --------------------------------------------------
   */

  get filteredReservations(): Reservation[] {

    const query = this.searchQuery
      .trim()
      .toLowerCase();

    const filtered = this.reservations.filter(
      reservation => {

        // Status filter
        if (
          this.activeFilter !== 'All' &&
          reservation.status !== this.activeFilter
        ) {
          return false;
        }

        // Search filter
        if (!query) {
          return true;
        }

        const searchableText = [
          reservation.reservationId,
          reservation.guestName,
          reservation.phone,
          reservation.email,
          reservation.packageName,
          reservation.table
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(query);

      }
    );

    // Sorting
    return filtered.sort((a, b) => {

      switch (this.sortOption) {

        case 'date-newest':
          return new Date(b.date).getTime() -
            new Date(a.date).getTime();

        case 'date-oldest':
          return new Date(a.date).getTime() -
            new Date(b.date).getTime();

        case 'id-ascending':
          return a.reservationId.localeCompare(
            b.reservationId,
            undefined,
            { numeric: true }
          );

        case 'id-descending':
          return b.reservationId.localeCompare(
            a.reservationId,
            undefined,
            { numeric: true }
          );

        default:
          return 0;

      }

    });

  }

  /*
 * --------------------------------------------------
 * PAGINATION
 * --------------------------------------------------
 */

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredReservations.length / this.pageSize)
    );
  }

  get paginatedReservations(): Reservation[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;

    return this.filteredReservations.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  get startRecord(): number {
    return this.filteredReservations.length === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredReservations.length
    );
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  changePageSize(): void {
    this.currentPage = 1;
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  /*
   * --------------------------------------------------
   * COUNTS
   * --------------------------------------------------
   */

  get totalCount(): number {

    return this.reservations.filter(
      reservation =>
        reservation.status !==
        'Cancelled'
    ).length;

  }


  get pendingCount(): number {

    return this.reservations.filter(
      reservation =>
        reservation.status ===
        'Pending'
    ).length;

  }


  get confirmedCount(): number {

    return this.reservations.filter(
      reservation =>
        reservation.status ===
        'Confirmed'
    ).length;

  }


  get seatedCount(): number {

    return this.reservations.filter(
      reservation =>
        reservation.status ===
        'Seated'
    ).length;

  }


  get cancelledCount(): number {

    return this.reservations.filter(
      reservation =>
        reservation.status ===
        'Cancelled'
    ).length;

  }


  /*
   * --------------------------------------------------
   * STATUS CLASS
   * --------------------------------------------------
   */

  getStatusClass(
    status: ReservationStatus
  ): string {

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

  /*
   * --------------------------------------------------
   * TABLE ASSIGNMENT
   * --------------------------------------------------
   */

  assignTable(
    reservation: Reservation,
    tableId: string
  ): void {

    const previousTable = reservation.table || '';
    const previousStatus = reservation.status;

    /*
     * Restore the original selection when validation fails.
     */
    const restoreTable = (): void => {
      reservation.table = previousTable;
    };

    /*
     * Check table capacity.
     */
    if (
      tableId &&
      !this.isTableCapacitySuitable(
        tableId,
        reservation.partySize
      )
    ) {

      restoreTable();

      this.showError(
        'Insufficient Table Capacity',
        `${tableId} can only accommodate ${this.getTableCapacity(tableId)} guests. This reservation requires ${reservation.partySize} seats.`
      );

      return;
    }

    /*
     * Check table availability.
     */
    if (
      tableId &&
      tableId !== previousTable &&
      this.isTableOccupied(
        tableId,
        reservation.date,
        reservation.time,
        reservation.reservationId
      )
    ) {

      restoreTable();

      this.showError(
        'Table Unavailable',
        `${tableId} is already occupied at ${reservation.time} on ${reservation.date}.`
      );

      return;
    }

    /*
     * Update table assignment.
     */
    this.reservationService
      .updateReservation(
        reservation.reservationId,
        {
          table: tableId
        }
      )
      .subscribe({

        next: (tableResponse) => {

          /*
           * Pending reservation:
           * Assign table, then confirm.
           */
          if (
            previousStatus === 'Pending' &&
            tableId
          ) {

            this.reservationService
              .updateReservationStatus(
                reservation.reservationId,
                'Confirmed'
              )
              .subscribe({

                next: (statusResponse) => {

                  const updated =
                    statusResponse.reservation;

                  const index =
                    this.reservations.findIndex(
                      item =>
                        item.reservationId ===
                        reservation.reservationId
                    );

                  if (index !== -1) {
                    this.reservations[index] = updated;
                  }

                  this.showSuccess(
                    'Table Assigned',
                    `${reservation.reservationId} has been assigned to ${tableId} and confirmed.`
                  );

                },

                error: (error) => {

                  console.error(
                    'Status update after table assignment failed:',
                    error
                  );

                  /*
                   * Restore previous table assignment.
                   */
                  this.reservationService
                    .updateReservation(
                      reservation.reservationId,
                      {
                        table: previousTable
                      }
                    )
                    .subscribe({

                      next: () => {
                        this.loadReservations();
                      },

                      error: () => {
                        this.loadReservations();
                      }

                    });

                  restoreTable();

                  this.showError(
                    'Unable to Confirm Reservation',
                    error?.error?.message ||
                    'The table was assigned, but the reservation could not be confirmed.'
                  );

                }

              });

            return;
          }

          /*
           * Other reservation statuses:
           * Update table only.
           */
          const updated =
            tableResponse.reservation;

          const index =
            this.reservations.findIndex(
              item =>
                item.reservationId ===
                reservation.reservationId
            );

          if (index !== -1) {
            this.reservations[index] = updated;
          }

          this.showSuccess(
            tableId
              ? 'Table Assigned'
              : 'Table Assignment Removed',
            tableId
              ? `${reservation.reservationId} has been assigned to ${tableId}.`
              : `${reservation.reservationId} table assignment has been removed.`
          );

        },

        error: (error) => {

          console.error(
            'Table assignment failed:',
            error
          );

          restoreTable();

          this.showError(
            'Unable to Assign Table',
            error?.error?.message ||
            'Unable to update table assignment.'
          );

        }

      });

  }


  getGroupedReservationDishes(reservation: Reservation): {
    name: string;
    quantity: number;
  }[] {
    const grouped = new Map<string, number>();

    for (const dish of reservation.selectedDishes || []) {
      grouped.set(
        dish.name,
        (grouped.get(dish.name) || 0) + 1
      );
    }

    return Array.from(grouped, ([name, quantity]) => ({
      name,
      quantity
    }));
  }

  /*
   * --------------------------------------------------
   * UPDATE STATUS
   * --------------------------------------------------
   */

  updateStatus(
    reservation: Reservation,
    status: ReservationStatus
  ): void {

    /*
     * Cancellation requires confirmation.
     */
    if (status === 'Cancelled') {

      this.reservationToCancel =
        reservation;

      this.cancelConfirmOpen =
        true;

      return;
    }


    /*
     * All other status changes can
     * happen immediately.
     */

    this.reservationService
      .updateReservationStatus(
        reservation.reservationId,
        status
      )
      .subscribe({

        next: (response) => {

          const updated =
            response.reservation;


          const index =
            this.reservations.findIndex(
              item =>
                item.reservationId ===
                reservation.reservationId
            );


          if (index !== -1) {

            this.reservations[index] =
              updated;

          }


          this.showSuccess(
            this.getStatusSuccessTitle(status),
            this.getStatusSuccessMessage(
              reservation.reservationId,
              status
            )
          );

        },

        error: (error) => {

          console.error(
            'Status update failed:',
            error
          );

          this.showError(
            'Unable to Update Reservation',
            error?.error?.message ||
            'Unable to update reservation status.'
          );

        }

      });

  }

  /*
   * --------------------------------------------------
   * CANCEL CONFIRMATION
   * --------------------------------------------------
   */

  cancelReservation(): void {

    if (!this.reservationToCancel) {
      return;
    }


    const reservation =
      this.reservationToCancel;


    this.reservationService
      .updateReservationStatus(
        reservation.reservationId,
        'Cancelled'
      )
      .subscribe({

        next: (response) => {

          const updated =
            response.reservation;


          const index =
            this.reservations.findIndex(
              item =>
                item.reservationId ===
                reservation.reservationId
            );


          if (index !== -1) {

            this.reservations[index] =
              updated;

          }


          this.cancelConfirmOpen =
            false;

          this.reservationToCancel =
            null;


          this.showSuccess(
            'Reservation Cancelled',
            `${reservation.reservationId} has been cancelled successfully.`
          );

        },

        error: (error) => {

          console.error(
            'Cancellation failed:',
            error
          );


          this.cancelConfirmOpen =
            false;

          this.reservationToCancel =
            null;


          this.showError(
            'Unable to Cancel Reservation',
            error?.error?.message ||
            'Unable to cancel this reservation.'
          );

        }

      });

  }


  closeCancelConfirmation(): void {

    this.cancelConfirmOpen =
      false;

    this.reservationToCancel =
      null;

  }

  /*
  * --------------------------------------------------
  * DELETE CONFIRMATION
  * --------------------------------------------------
  */

  openDeleteConfirmation(
    reservation: Reservation
  ): void {

    this.reservationToDelete =
      reservation;

    this.deleteConfirmOpen =
      true;

  }


  closeDeleteConfirmation(): void {

    this.deleteConfirmOpen =
      false;

    this.reservationToDelete =
      null;

  }


  /*
  * --------------------------------------------------
  * DELETE RESERVATION
  * --------------------------------------------------
  */

  deleteReservation(): void {

    if (!this.reservationToDelete) {
      return;
    }


    const reservation =
      this.reservationToDelete;


    this.reservationService
      .deleteReservation(
        reservation.reservationId
      )
      .subscribe({

        next: (response) => {

          /*
           * Remove the deleted reservation
           * from the current list immediately.
           */
          this.reservations =
            this.reservations.filter(
              item =>
                item.reservationId !==
                reservation.reservationId
            );


          this.deleteConfirmOpen =
            false;

          this.reservationToDelete =
            null;


          this.showSuccess(
            'Reservation Deleted',
            response?.message ||
            `${reservation.reservationId} has been deleted successfully.`
          );

        },

        error: (error) => {

          console.error(
            'Delete reservation failed:',
            error
          );


          this.deleteConfirmOpen =
            false;

          this.reservationToDelete =
            null;


          this.showError(
            'Unable to Delete Reservation',
            error?.error?.message ||
            'Unable to delete this reservation.'
          );

        }

      });

  }

  onDrawerOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDrawer();
    }
  }

  onFloorOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeFloorMatrix();
    }
  }

  onCancelConfirmationBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeCancelConfirmation();
    }
  }

  onDeleteConfirmationBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDeleteConfirmation();
    }
  }

  /*
   * --------------------------------------------------
   * SUCCESS MESSAGE
   * --------------------------------------------------
   */


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

  // =========================
  // HANDLE ENTER KEY FOR MODALS
  // =========================

  @HostListener('document:keydown.enter', ['$event'])
  handleModalEnter(event: KeyboardEvent): void {

    // CLOSE ERROR MODAL
    if (this.errorMessage) {

      event.preventDefault();
      event.stopPropagation();

      this.clearError();

      return;
    }

    // CLOSE SUCCESS MODAL
    if (this.successMessage) {

      event.preventDefault();
      event.stopPropagation();

      this.clearSuccess();

    }

  }


  /*
   * --------------------------------------------------
   * STATUS SUCCESS TITLE
   * --------------------------------------------------
   */

  private getStatusSuccessTitle(
    status: ReservationStatus
  ): string {

    switch (status) {

      case 'Confirmed':
        return 'Reservation Confirmed';

      case 'Seated':
        return 'Guest Seated';

      case 'Completed':
        return 'Reservation Completed';

      case 'Pending':
        return 'Reservation Reopened';

      default:
        return 'Reservation Updated';

    }

  }


  /*
   * --------------------------------------------------
   * STATUS SUCCESS MESSAGE
   * --------------------------------------------------
   */

  private getStatusSuccessMessage(
    reservationId: string,
    status: ReservationStatus
  ): string {

    switch (status) {

      case 'Confirmed':
        return `${reservationId} has been confirmed successfully.`;

      case 'Seated':
        return `${reservationId} has been marked as seated.`;

      case 'Completed':
        return `${reservationId} has been completed successfully.`;

      case 'Pending':
        return `${reservationId} has been reopened as pending.`;

      default:
        return `${reservationId} has been updated successfully.`;

    }

  }

  /*
   * --------------------------------------------------
   * SAVE RESERVATION
   * --------------------------------------------------
   */

  saveReservation(): void {

    /*
     * Basic validation
     */

    if (
      !this.form.guestName.trim() ||
      !this.form.phone.trim() ||
      !this.form.date ||
      !this.form.time ||
      !this.form.partySize
    ) {

      this.showError(
        'Incomplete Booking Details',
        'Please complete all required booking details.'
      );

      return;

    }

    /*
    * Table capacity validation
    */

    if (
      this.form.table &&
      !this.isTableCapacitySuitable(
        this.form.table,
        Number(this.form.partySize)
      )
    ) {

      this.showError(
        'Insufficient Table Capacity',
        `${this.form.table} can only accommodate ${this.getTableCapacity(this.form.table)} guests. Please select a suitable table.`
      );

      return;
    }

    /*
     * Table availability validation
     */

    if (
      this.form.table &&
      !this.isTableAvailable(this.form.table)
    ) {

      this.showError(
        'Table Unavailable',
        `${this.form.table} is already reserved during this booking period.`
      );

      return;
    }


    /*
     * CREATE
     */

    if (
      this.drawerMode ===
      'create'
    ) {

      const request: ReservationRequest = {

        guestName:
          this.form.guestName.trim(),

        phone:
          this.form.phone.trim(),

        email:
          this.form.email.trim(),

        date:
          this.form.date,

        time:
          this.form.time,

        partySize:
          Number(this.form.partySize),

        servicePeriod:
          'dinner',

        diningOption:
          this.getDiningOption(
            this.form.packageName
          ),

        tastingMenu:
          this.form.packageName,

        selectedDishes:
          [],

        beveragePairing:
          false,

        packageName:
          this.form.packageName,

        table:
          this.form.table,

        dietaryNotes:
          this.form.dietaryNotes.trim(),

        specialRequests:
          this.form.specialRequests.trim()

      };


      this.reservationService
        .createReservation(request)
        .subscribe({

          next: (response) => {

            this.reservations = [

              response.reservation,

              ...this.reservations

            ];


            this.closeDrawer();


            this.showSuccess(
              'Reservation Created',
              `Reservation ${response.reservation.reservationId} has been created successfully.`
            );

          },

          error: (error) => {

            console.error(
              'Create reservation failed:',
              error
            );

            this.showError(
              'Unable to Create Reservation',
              error?.error?.message ||
              'Unable to create reservation.'
            );

          }

        });

      return;

    }


    /*
     * UPDATE
     */

    const update: Partial<ReservationRequest> = {

      guestName:
        this.form.guestName.trim(),

      phone:
        this.form.phone.trim(),

      email:
        this.form.email.trim(),

      date:
        this.form.date,

      time:
        this.form.time,

      partySize:
        Number(this.form.partySize),

      packageName:
        this.form.packageName,

      table:
        this.form.table,

      status:
        this.form.status,

      dietaryNotes:
        this.form.dietaryNotes.trim(),

      specialRequests:
        this.form.specialRequests.trim()

    };


    this.reservationService
      .updateReservation(
        this.form.reservationId,
        update
      )
      .subscribe({

        next: (response) => {

          const index =
            this.reservations.findIndex(
              reservation =>
                reservation.reservationId ===
                this.form.reservationId
            );


          if (index !== -1) {

            this.reservations[index] =
              response.reservation;

          }


          this.closeDrawer();


          this.showSuccess(
            'Reservation Updated',
            `Reservation ${response.reservation.reservationId} has been updated successfully.`
          );

        },

        error: (error) => {

          console.error(
            'Update reservation failed:',
            error
          );

          this.showError(
            'Unable to Update Reservation',
            error?.error?.message ||
            'Unable to update reservation.'
          );

        }

      });

  }


  /*
   * --------------------------------------------------
   * PACKAGE PRICES
   * --------------------------------------------------
   */

  packagePrice(
    packageName: string
  ): number {

    switch (packageName) {

      case 'Seven Course Odyssey':
        return 175;

      case 'Five Course Prelude':
        return 125;

      case 'À La Carte':
        return 0;

      case 'Table Only':
        return 0;

      default:
        return 0;

    }

  }


  /*
   * --------------------------------------------------
   * ESTIMATED TOTAL
   * --------------------------------------------------
   */

  get estimatedTotal(): number {

    if (this.form.packageName === 'À La Carte') {

      return this.groupedSelectedDishes.reduce(
        (total, dish) =>
          total + (dish.price * dish.quantity),
        0
      );

    }

    return (
      this.packagePrice(this.form.packageName) *
      this.form.partySize
    );
  }


  /*
   * --------------------------------------------------
   * AMOUNT DUE
   * --------------------------------------------------
   *
   * Currently uses the same estimated amount.
   * This can later be changed if Aurelia
   * introduces deposits/payments.
   * --------------------------------------------------
   */

  get amountDue(): number {

    return this.estimatedTotal;

  }


  /*
   * --------------------------------------------------
   * PACKAGE NAME FALLBACK
   * --------------------------------------------------
   */

  private getPackageName(
    reservation: Reservation
  ): string {

    if (
      reservation.packageName
    ) {

      return reservation.packageName;

    }


    if (
      reservation.tastingMenu
    ) {

      return reservation.tastingMenu;

    }


    return 'À La Carte';

  }

  hasSelectedDishes(reservation: Reservation): boolean {
    return (reservation.selectedDishes?.length ?? 0) > 0;
  }

  /*
   * --------------------------------------------------
   * DINING OPTION
   * --------------------------------------------------
   */

  private getDiningOption(
    packageName: string
  ): 'tasting' | 'alacarte' | 'table' {

    switch (packageName) {

      case 'À La Carte':
        return 'alacarte';

      case 'Table Only':
        return 'table';

      default:
        return 'tasting';

    }

  }


  /*
  * --------------------------------------------------
  * FLOOR MATRIX / TABLE AVAILABILITY
  * --------------------------------------------------
  */

  hasSeatedReservation(
    tableId: string
  ): boolean {

    return this.getTableReservations(
      tableId
    ).some(
      reservation =>
        reservation.status === 'Seated'
    );
  }

  floorMatrixOpen = false;

  showFloorMatrix(): void {
    this.floorMatrixOpen = true;
  }

  closeFloorMatrix(): void {
    this.floorMatrixOpen = false;
  }


  /*
  * Check whether a table has an overlapping
  * reservation on a specific date.
  */
  isTableOccupied(
    tableId: string,
    date: string,
    time: string,
    excludeReservationId?: string
  ): boolean {

    const requestedStart =
      this.timeToMinutes(time);

    const requestedEnd =
      requestedStart + 60;

    return this.reservations.some(reservation => {

      if (
        reservation.reservationId === excludeReservationId ||
        reservation.table !== tableId ||
        reservation.date !== date ||
        reservation.status === 'Cancelled' ||
        reservation.status === 'Completed'
      ) {
        return false;
      }

      const existingStart =
        this.timeToMinutes(reservation.time);

      const existingEnd =
        existingStart + 60;

      // Check whether the two booking periods overlap.
      return (
        requestedStart < existingEnd &&
        requestedEnd > existingStart
      );

    });
  }


  /*
    * Check whether a table can be assigned
    * to the current drawer form.
    */
  isTableAvailable(
    tableId: string
  ): boolean {

    if (
      !this.form.date ||
      !this.form.time
    ) {
      return true;
    }

    return !this.isTableOccupied(
      tableId,
      this.form.date,
      this.form.time,
      this.drawerMode === 'edit'
        ? this.form.reservationId
        : undefined
    );

  }


  /*
    * Get the reservation currently occupying
    * a table at a specific date/time.
    */
  getTableReservationAtTime(
    tableId: string,
    date: string,
    time: string
  ): Reservation | undefined {

    const requestedTime =
      this.timeToMinutes(time);

    return this.reservations.find(
      reservation => {

        if (
          reservation.table !== tableId
        ) {
          return false;
        }

        if (
          reservation.date !== date
        ) {
          return false;
        }

        if (
          reservation.status === 'Cancelled' ||
          reservation.status === 'Completed'
        ) {
          return false;
        }

        const reservationTime =
          this.timeToMinutes(
            reservation.time
          );

        return (
          requestedTime >= reservationTime &&
          requestedTime < reservationTime + 60
        );

      }
    );

  }


  /*
    * Convert HH:mm to minutes.
    */
  private timeToMinutes(
    time: string
  ): number {

    if (!time) {
      return 0;
    }

    const [
      hours,
      minutes
    ] = time
      .split(':')
      .map(Number);

    return (
      hours * 60 +
      minutes
    );

  }


  /*
    * Add one hour to a reservation time.
    */
  getEndTime(
    time: string
  ): string {

    const totalMinutes =
      this.timeToMinutes(time) + 60;

    const hours =
      Math.floor(
        totalMinutes / 60
      ) % 24;

    const minutes =
      totalMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  }


  /*
    * Return the reservation occupying
    * a table on a particular date.
    */
  getTableReservations(
    tableId: string
  ): Reservation[] {

    return this.reservations
      .filter(
        reservation =>
          reservation.table === tableId &&
          reservation.status !== 'Cancelled' &&
          reservation.status !== 'Completed'
      )
      .sort(
        (a, b) =>
          this.timeToMinutes(a.time) -
          this.timeToMinutes(b.time)
      );

  }

  getTableStatus(tableId: string): 'Available' | 'Reserved' | 'Seated' {

    const reservation =
      this.reservations.find(
        reservation =>
          reservation.table === tableId &&
          reservation.status !== 'Cancelled' &&
          reservation.status !== 'Completed'
      );

    if (!reservation) {
      return 'Available';
    }

    if (reservation.status === 'Seated') {
      return 'Seated';
    }

    return 'Reserved';
  }


  /*
   * --------------------------------------------------
   * DATE HELPERS
   * --------------------------------------------------
   */

  private toDateInputValue(
    date: Date
  ): string {

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');


    return `${year}-${month}-${day}`;

  }

  onErrorBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.clearError();
    }
  }


  private formatDateForInput(
    value: string
  ): string {

    if (!value) {

      return '';

    }


    /*
     * Already YYYY-MM-DD
     */

    if (
      /^\d{4}-\d{2}-\d{2}$/
        .test(value)
    ) {

      return value;

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return '';

    }


    return this.toDateInputValue(
      date
    );

  }


  /*
   * --------------------------------------------------
   * SERVICE DATE
   * --------------------------------------------------
   */

  get serviceDate(): string {

    const activeReservations =
      this.reservations
        .filter(
          reservation =>
            reservation.status !==
            'Cancelled'
        );


    if (
      activeReservations.length === 0
    ) {

      return this.formatDisplayDate(
        new Date()
      );

    }


    const dates =
      activeReservations
        .map(
          reservation =>
            new Date(
              reservation.date
            )
        )
        .filter(
          date =>
            !Number.isNaN(
              date.getTime()
            )
        )
        .sort(
          (a, b) =>
            a.getTime() -
            b.getTime()
        );


    if (
      dates.length === 0
    ) {

      return this.formatDisplayDate(
        new Date()
      );

    }


    return this.formatDisplayDate(
      dates[0]
    );

  }


  get groupedSelectedDishes(): {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[] {

    const grouped =
      new Map<
        string,
        {
          id: string;
          name: string;
          price: number;
          quantity: number;
        }
      >();

    for (const dish of this.form.selectedDishes) {

      const existing =
        grouped.get(dish.id);

      if (existing) {

        existing.quantity += 1;

      } else {

        grouped.set(dish.id, {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: 1
        });

      }

    }

    return Array.from(grouped.values());
  }



  private formatDisplayDate(
    date: Date
  ): string {

    return new Intl.DateTimeFormat(
      'en-GB',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    ).format(date);

  }

  get isReservationEditable(): boolean {

    return this.form.status === 'Pending';

  }


  private completePastReservations(): void {

    const now = new Date();

    const currentDate = this.toDateInputValue(now);

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    const seatedReservations =
      this.reservations.filter(reservation => {

        if (reservation.status !== 'Seated') {
          return false;
        }

        // Only process today's and past reservations.
        if (reservation.date > currentDate) {
          return false;
        }

        // Reservations from previous dates are overdue.
        if (reservation.date < currentDate) {
          return true;
        }

        // Calculate the scheduled end time (1 hour).
        const [hours, minutes] =
          reservation.time.split(':').map(Number);

        const reservationEndMinutes =
          hours * 60 + minutes + 60;

        return currentMinutes >= reservationEndMinutes;

      });

    for (const reservation of seatedReservations) {

      this.reservationService
        .updateReservationStatus(
          reservation.reservationId,
          'Completed'
        )
        .subscribe({

          next: (response) => {

            const index =
              this.reservations.findIndex(
                item =>
                  item.reservationId ===
                  reservation.reservationId
              );

            if (index !== -1) {
              this.reservations[index] =
                response.reservation;
            }

          },

          error: (error) => {

            console.error(
              `Failed to complete reservation ${reservation.reservationId}:`,
              error
            );

          }

        });

    }

  }


}
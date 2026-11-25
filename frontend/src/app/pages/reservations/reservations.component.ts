import {
  Component,
  HostListener,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

import {
  ReservationService,
  CreateReservationRequest,
  SelectedDish,
  TastingMenuSelection
} from '../../services/reservation.service';

import {
  TastingService,
  TastingItem
} from '../../services/tasting.service';

interface CalendarDay {
  date: Date;
  disabled: boolean;
  isCurrentMonth: boolean;
}

interface TimeSlot {
  time: string;
  label: string;
  disabled: boolean;
}

interface ReservationDetails {
  reservationId?: string;
  guestName?: string;
  email?: string;
  phone?: string;
  specialRequests?: string;
  servicePeriod?: 'dinner' | 'brunch';
  date?: string;
  time?: string;
  partySize?: number;

  tastingMenus?: TastingMenuSelection[];
  showTastingMenus?: boolean;
  showHandPickDishes?: boolean;
  orderAtTable?: boolean;

  alacarteGuests?: number;
  orderAtTableGuests?: number;

  diningOption?: 'tasting' | 'alacarte' | 'table';

  selectedDishes?: SelectedDish[];
}

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css'
})

export class ReservationsComponent implements OnInit {

  today = this.startOfDay(new Date());

  minReservationDate: Date = this.getMinimumReservationDate();

  displayedMonth = new Date(
    this.minReservationDate.getFullYear(),
    this.minReservationDate.getMonth(),
    1
  );

  selectedDate =
    this.findNextAvailableDate(this.minReservationDate);

  selectedPeriod:
    'dinner' | 'brunch' = 'dinner';

  partySize:
    number | '7+' = 2;

  largePartySize = 7;

  selectedTime = '';

  // =========================
  // DINING SELECTIONS
  // =========================

  showTastingMenus = false;
  showHandPickDishes = false;
  orderAtTable = false;

  selectedTastingMenus: TastingMenuSelection[] = [];

  alacarteGuests = 0;
  orderAtTableGuests = 0;

  tastingList: TastingItem[] = [];

  guestName = '';
  guestEmail = '';
  guestPhone = '';
  specialNotes = '';

  isSubmitting = false;
  isEditMode = false;
  editingReservationId = '';

  successMessage = '';
  successTitle = '';

  errorMessage = '';
  errorTitle = '';

  createdReservationId = '';

  calendarDays:
    CalendarDay[] = [];

  readonly tastingMenus = [
    {
      name: 'Seven Course Odyssey',
      label: 'SIGNATURE EXPERIENCE',
      description:
        'A refined multi-course journey featuring seasonal ingredients and French culinary techniques.',
      courses: '7 courses',
      price: 175
    },
    {
      name: 'Five Course Prelude',
      label: 'EARLY EVENING',
      description:
        'A shorter tasting experience highlighting seasonal produce and classic French flavours.',
      courses: '5 courses',
      price: 125
    }
  ];

  readonly dinnerTimes: TimeSlot[] = [
    {
      time: '17:30',
      label: 'Available',
      disabled: false
    },
    {
      time: '18:00',
      label: 'Available',
      disabled: false
    },
    {
      time: '18:30',
      label: 'Available',
      disabled: false
    },
    {
      time: '19:00',
      label: 'Popular',
      disabled: false
    },
    {
      time: '19:15',
      label: 'Popular',
      disabled: false
    },
    {
      time: '19:30',
      label: 'Popular',
      disabled: false
    },
    {
      time: '20:00',
      label: 'Available',
      disabled: false
    },
    {
      time: '20:30',
      label: 'Available',
      disabled: false
    },
    {
      time: '21:00',
      label: 'Available',
      disabled: false
    },
    {
      time: '21:30',
      label: 'Unavailable',
      disabled: true
    }
  ];

  readonly brunchTimes: TimeSlot[] = [
    {
      time: '11:00',
      label: 'Available',
      disabled: false
    },
    {
      time: '11:30',
      label: 'Available',
      disabled: false
    },
    {
      time: '12:00',
      label: 'Available',
      disabled: false
    },
    {
      time: '12:30',
      label: 'Popular',
      disabled: false
    },
    {
      time: '13:00',
      label: 'Available',
      disabled: false
    },
    {
      time: '13:30',
      label: 'Available',
      disabled: false
    },
    {
      time: '14:00',
      label: 'Available',
      disabled: false
    },
    {
      time: '14:30',
      label: 'Unavailable',
      disabled: true
    }
  ];

  constructor(
    private reservationService:
      ReservationService,

    private tastingService:
      TastingService,

    private router: Router,
    private route: ActivatedRoute
  ) {
    this.rebuildCalendar();
    this.selectFirstAvailableTime();
  }

  ngOnInit(): void {

    this.tastingList =
      this.tastingService.getItems();

    // =========================
    // RETURN FROM MENU
    // =========================

    const savedDraft = sessionStorage.getItem('reservationDraft');

    if (savedDraft) {

      const reservation =
        JSON.parse(savedDraft) as ReservationDetails;

      // Get the latest selections from TastingService
      const updatedDishes =
        this.tastingService.getItems();

      // Restore reservation details
      this.loadReservationForEditing(reservation);

      // TastingService is the source of truth for hand-picked dishes
      this.tastingList = updatedDishes;

      // Keep the service and component synchronised
      this.tastingService.setItems(updatedDishes);

      // Automatically select Hand-Pick Dishes if dishes exist
      if (updatedDishes.length > 0) {
        this.showHandPickDishes = true;
        this.orderAtTable = false;
      }

      return;
    }

    // =========================
    // MODIFY EXISTING RESERVATION
    // =========================
    const reservation =
      history.state?.reservation;

    if (reservation) {

      this.loadReservationForEditing(reservation);

      this.tastingService.setItems(
        this.tastingList
      );

      return;
    }

    // =========================
    // RE-BOOK PREVIOUS RESERVATION
    // =========================
    const rebookId =
      this.route.snapshot.queryParamMap.get('rebook');

    if (rebookId) {

      this.loadReservationForRebooking(rebookId);

      return;
    }

    // =========================
    // NORMAL NEW RESERVATION
    // =========================
    if (this.tastingList.length > 0) {

      this.showHandPickDishes = true;

      this.orderAtTable = false;

      this.alacarteGuests = this.guestCount;

    }

  }

  private getMinimumReservationDate(): Date {
    const now = new Date();

    const lastReservationTime = new Date(now);
    lastReservationTime.setHours(21, 15, 0, 0);

    // After 9:15 PM, same-day reservations are no longer allowed.
    if (now >= lastReservationTime) {
      now.setDate(now.getDate() + 1);
    }

    now.setHours(0, 0, 0, 0);

    return now;
  }

  private formatDateForApi(
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

  private startOfDay(
    date: Date
  ): Date {

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  }

  private findNextAvailableDate(
    from: Date
  ): Date {

    const date =
      this.startOfDay(from);

    // Monday is the restaurant's regular closing day.
    while (date.getDay() === 1) {
      date.setDate(
        date.getDate() + 1
      );
    }

    return date;
  }

  get monthLabel(): string {

    return this.displayedMonth
      .toLocaleDateString(
        'en-MY',
        {
          month: 'long',
          year: 'numeric'
        }
      );
  }

  get selectedDateLabel(): string {

    return this.selectedDate
      .toLocaleDateString(
        'en-MY',
        {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }
      );
  }

  get shortSelectedDate(): string {

    return this.selectedDate
      .toLocaleDateString(
        'en-MY',
        {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        }
      );
  }

  get currentTimes(): TimeSlot[] {

    return this.selectedPeriod === 'dinner'
      ? this.dinnerTimes
      : this.brunchTimes;
  }

  // =========================
  // DINING OPTION TOGGLES
  // =========================

  toggleTastingMenus(): void {
    this.showTastingMenus = !this.showTastingMenus;

    if (this.showTastingMenus) {
      // Tasting menus can be combined with hand-picked dishes.
      this.orderAtTable = false;
    } else {
      this.selectedTastingMenus = [];
    }
  }

  toggleHandPickDishes(): void {
    this.showHandPickDishes = !this.showHandPickDishes;

    if (this.showHandPickDishes) {
      // Hand-picked dishes can be combined with tasting menus.
      this.orderAtTable = false;
    } else {
      // Clear selected dishes through TastingService.
      this.tastingService.clearItems();
      this.tastingList = [];
    }
  }

  toggleOrderAtTable(): void {
    this.orderAtTable = !this.orderAtTable;

    if (this.orderAtTable) {
      // Order at Table is mutually exclusive with the other options.
      this.showTastingMenus = false;
      this.showHandPickDishes = false;

      this.selectedTastingMenus = [];

      this.tastingService.clearItems();
      this.tastingList = [];

      this.alacarteGuests = 0;
      this.orderAtTableGuests = 0;
    }
  }

  // =========================
  // TASTING MENU QUANTITIES
  // =========================

  getTastingMenuQuantity(menuName: string): number {
    return this.selectedTastingMenus.find(
      menu => menu.name === menuName
    )?.quantity ?? 0;
  }

  updateTastingMenuQuantity(
    menuName: string,
    quantity: number
  ): void {

    const menu = this.tastingMenus.find(
      item => item.name === menuName
    );

    if (!menu) {
      return;
    }

    const existing = this.selectedTastingMenus.find(
      item => item.name === menuName
    );

    if (quantity <= 0) {

      this.selectedTastingMenus =
        this.selectedTastingMenus.filter(
          item => item.name !== menuName
        );

    } else if (existing) {

      this.selectedTastingMenus =
        this.selectedTastingMenus.map(item =>
          item.name === menuName
            ? { ...item, quantity }
            : item
        );

    } else {

      this.selectedTastingMenus = [
        ...this.selectedTastingMenus,
        {
          name: menu.name,
          quantity,
          price: menu.price
        }
      ];

    }

    this.errorMessage = '';

    // Always save the latest set-menu selection
    const savedDraft =
      sessionStorage.getItem('reservationDraft');

    const reservation = savedDraft
      ? JSON.parse(savedDraft)
      : {};

    reservation.tastingMenus =
      this.selectedTastingMenus;

    reservation.showTastingMenus =
      this.showTastingMenus;

    sessionStorage.setItem(
      'reservationDraft',
      JSON.stringify(reservation)
    );

  }
  get guestCount(): number {

    return this.partySize === '7+'
      ? this.largePartySize
      : this.partySize;
  }

  get diningSubtotal(): number {

    // Tasting menu subtotal
    const tastingSubtotal =
      this.selectedTastingMenus.reduce(
        (total, menu) =>
          total + menu.price * menu.quantity,
        0
      );

    // À la carte subtotal
    const alacarteSubtotal =
      this.tastingList.reduce(
        (total, item) =>
          total + item.price * item.quantity,
        0
      );

    return tastingSubtotal +
      alacarteSubtotal;
  }

  private rebuildCalendar(): void {

    const year =
      this.displayedMonth
        .getFullYear();

    const month =
      this.displayedMonth
        .getMonth();

    const firstDay =
      new Date(
        year,
        month,
        1
      );

    const daysInMonth =
      new Date(
        year,
        month + 1,
        0
      ).getDate();

    // Sunday-first calendar.
    // Empty cells keep dates aligned.
    const leadingBlanks =
      firstDay.getDay();

    const cells:
      CalendarDay[] = [];

    for (
      let i = 0;
      i < leadingBlanks;
      i++
    ) {

      cells.push({
        date: new Date(
          year,
          month,
          1 -
          (
            leadingBlanks -
            i
          )
        ),
        disabled: true,
        isCurrentMonth: false
      });

    }

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {

      const date =
        new Date(
          year,
          month,
          day
        );

      const isBeforeMinimumDate =
        date < this.minReservationDate;

      const isMonday =
        date.getDay() === 1;

      cells.push({
        date,
        disabled:
          isBeforeMinimumDate ||
          isMonday,
        isCurrentMonth: true
      });

    }

    while (
      cells.length % 7 !== 0
    ) {

      const lastDate =
        cells[
          cells.length - 1
        ].date;

      const nextDate =
        new Date(lastDate);

      nextDate.setDate(
        nextDate.getDate() + 1
      );

      cells.push({
        date: nextDate,
        disabled: true,
        isCurrentMonth: false
      });

    }

    this.calendarDays =
      cells;
  }

  previousMonth(): void {

    const previous =
      new Date(
        this.displayedMonth
          .getFullYear(),
        this.displayedMonth
          .getMonth() - 1,
        1
      );

    const earliestMonth =
      new Date(
        this.today.getFullYear(),
        this.today.getMonth(),
        1
      );

    if (
      previous <
      earliestMonth
    ) {
      return;
    }

    this.displayedMonth =
      previous;

    this.rebuildCalendar();
  }

  nextMonth(): void {

    this.displayedMonth =
      new Date(
        this.displayedMonth
          .getFullYear(),
        this.displayedMonth
          .getMonth() + 1,
        1
      );

    this.rebuildCalendar();
  }

  isSameDate(
    first: Date,
    second: Date
  ): boolean {

    return (
      first.getFullYear() ===
      second.getFullYear()
      &&
      first.getMonth() ===
      second.getMonth()
      &&
      first.getDate() ===
      second.getDate()
    );
  }

  isWeekend(
    date: Date
  ): boolean {

    return (
      date.getDay() === 0 ||
      date.getDay() === 6
    );
  }

  selectDate(day: CalendarDay): void {

    if (
      day.disabled ||
      !day.isCurrentMonth ||
      day.date < this.minReservationDate
    ) {
      return;
    }

    if (
      this.selectedPeriod === 'brunch' &&
      !this.isWeekend(day.date)
    ) {
      return;
    }

    const previousTime = this.selectedTime;

    this.selectedDate = new Date(day.date);

    const matchingTime = this.currentTimes.find(
      slot =>
        slot.time === previousTime &&
        !slot.disabled
    );

    if (matchingTime) {
      this.selectedTime = matchingTime.time;
    } else {
      this.selectFirstAvailableTime();
    }

    this.errorMessage = '';
  }

  changePeriod(
    period:
      'dinner' | 'brunch'
  ): void {

    this.selectedPeriod =
      period;

    if (
      period === 'brunch' &&
      !this.isWeekend(
        this.selectedDate
      )
    ) {

      const date =
        new Date(
          this.selectedDate
        );

      while (
        !this.isWeekend(date) ||
        date < this.today
      ) {

        date.setDate(
          date.getDate() + 1
        );

      }

      this.selectedDate =
        date;

      this.displayedMonth =
        new Date(
          date.getFullYear(),
          date.getMonth(),
          1
        );

      this.rebuildCalendar();
    }

    this.selectedTime = '';

    this.selectFirstAvailableTime();

    this.errorMessage = '';
  }

  selectFirstAvailableTime(): void {

    this.selectedTime =
      this.currentTimes.find(
        slot =>
          !slot.disabled
      )?.time ?? '';
  }

  selectTime(
    slot: TimeSlot
  ): void {

    if (slot.disabled) {
      return;
    }

    this.selectedTime =
      slot.time;

    this.errorMessage = '';
  }

  selectPartySize(
    size: number | '7+'
  ): void {

    this.partySize =
      size;

    this.errorMessage = '';
  }

  private loadReservationForEditing(
    reservation: ReservationDetails
  ): void {

    // =========================
    // ENABLE EDIT MODE
    // =========================

    this.isEditMode =
      !!reservation.reservationId;

    // this.editingReservationId =
    //   reservation._id ||
    //   reservation.reservationId ||
    //   '';

    this.editingReservationId =
      reservation.reservationId || '';


    // =========================
    // CONTACT DETAILS
    // =========================

    this.guestName =
      reservation.guestName || '';

    this.guestEmail =
      reservation.email || '';

    this.guestPhone =
      reservation.phone || '';

    this.specialNotes =
      reservation.specialRequests || '';


    // =========================
    // SERVICE PERIOD
    // =========================

    this.selectedPeriod =
      reservation.servicePeriod === 'brunch'
        ? 'brunch'
        : 'dinner';


    // =========================
    // DATE
    // =========================

    // =========================
    // DATE
    // =========================

    if (reservation.date) {

      const date = new Date(
        reservation.date + 'T00:00:00'
      );

      if (!this.isEditMode && date < this.minReservationDate) {

        this.selectedDate =
          this.findNextAvailableDate(this.minReservationDate);

      } else {

        this.selectedDate = date;

      }

      this.displayedMonth = new Date(
        this.selectedDate.getFullYear(),
        this.selectedDate.getMonth(),
        1
      );

      this.rebuildCalendar();
    }


    // =========================
    // TIME
    // =========================

    this.selectedTime =
      reservation.time || '';


    // =========================
    // PARTY SIZE
    // =========================

    const partySize =
      Number(reservation.partySize);

    if (
      Number.isInteger(partySize) &&
      partySize >= 7
    ) {

      this.partySize = '7+';

      this.largePartySize =
        partySize;

    } else {

      this.partySize =
        partySize || 2;

    }

    // =========================
    // DINING SELECTIONS
    // =========================

    if (reservation.tastingMenus?.length) {

      this.selectedTastingMenus =
        reservation.tastingMenus.map(menu => ({
          ...menu
        }));

      this.alacarteGuests =
        reservation.alacarteGuests ?? 0;

      this.orderAtTableGuests =
        reservation.orderAtTableGuests ?? 0;

    } else {

      this.selectedTastingMenus = [];

      this.alacarteGuests = 0;

      this.orderAtTableGuests = 0;

      this.selectedTastingMenus =
        (reservation.tastingMenus ?? []).map(menu => ({
          ...menu
        }));

      this.alacarteGuests =
        reservation.alacarteGuests ?? 0;

      this.orderAtTableGuests =
        reservation.orderAtTableGuests ?? 0;

    }

    // Restore selected dishes
    this.tastingList =
      (reservation.selectedDishes || []).map(dish => ({
        id: dish.id,
        name: dish.name,
        price: Number(dish.price),
        quantity: dish.quantity ?? 1
      }));

    this.tastingService.setItems(this.tastingList);

    // Restore dining option card selections
    this.showTastingMenus =
      reservation.showTastingMenus ??
      this.selectedTastingMenus.length > 0;

    this.showHandPickDishes =
      reservation.showHandPickDishes ??
      this.tastingList.length > 0;

    this.orderAtTable =
      reservation.orderAtTable ??
      (reservation.orderAtTableGuests ?? 0) > 0;

    // =========================
    // RESTORE ORIGINAL TIME
    // =========================

    const matchingTime =
      this.currentTimes.find(
        slot =>
          slot.time === this.selectedTime &&
          !slot.disabled
      );

    if (!matchingTime) {

      this.selectFirstAvailableTime();

    }


    // =========================
    // CLEAR MESSAGES
    // =========================

    this.errorMessage = '';
    this.errorTitle = '';

    this.successMessage = '';
    this.successTitle = '';

  }

  private loadReservationForRebooking(
    reservationId: string
  ): void {

    this.reservationService
      .getReservationById(reservationId)
      .subscribe({

        next: (response) => {

          const reservation = response.reservation;

          // Re-booking creates a new reservation
          this.isEditMode = false;
          this.editingReservationId = '';

          // Guest information
          this.guestName = reservation.guestName || '';
          this.guestEmail = reservation.email || '';
          this.guestPhone = reservation.phone || '';
          this.specialNotes = reservation.specialRequests || '';

          // Service period
          this.selectedPeriod =
            reservation.servicePeriod === 'brunch'
              ? 'brunch'
              : 'dinner';

          if (reservation.date) {
            this.selectedDate = new Date(
              reservation.date + 'T00:00:00'
            );
          }

          this.displayedMonth = new Date(
            this.selectedDate.getFullYear(),
            this.selectedDate.getMonth(),
            1
          );

          this.rebuildCalendar();

          const matchingTime = this.currentTimes.find(
            slot =>
              slot.time === reservation.time &&
              !slot.disabled
          );

          if (matchingTime) {
            this.selectedTime = reservation.time;
          } else {
            this.selectFirstAvailableTime();
          }

          // Restore party size
          const partySize = Number(reservation.partySize);

          if (Number.isInteger(partySize) && partySize >= 7) {
            this.partySize = '7+';
            this.largePartySize = partySize;
          } else {
            this.partySize = partySize || 2;
          }

          if (reservation.tastingMenus?.length) {

            this.selectedTastingMenus =
              reservation.tastingMenus.map(menu => ({
                name: menu.name,
                quantity: Number(menu.quantity),
                price: Number(menu.price)
              }));

            this.alacarteGuests =
              Number(reservation.alacarteGuests || 0);

            this.orderAtTableGuests =
              Number(reservation.orderAtTableGuests || 0);

          } else {

            this.selectedTastingMenus = [];
            this.alacarteGuests = 0;
            this.orderAtTableGuests = 0;

            this.selectedTastingMenus =
              (reservation.tastingMenus ?? []).map(menu => ({
                name: menu.name,
                quantity: Number(menu.quantity),
                price: Number(menu.price)
              }));

            this.alacarteGuests =
              Number(reservation.alacarteGuests || 0);

            this.orderAtTableGuests =
              Number(reservation.orderAtTableGuests || 0);
          }

          // Restore à la carte dishes and quantities
          this.tastingList = (
            reservation.selectedDishes || []
          ).map(dish => ({
            id: dish.id,
            name: dish.name,
            price: Number(dish.price),
            quantity: dish.quantity ?? 1
          }));

          this.tastingService.setItems(this.tastingList);

          // Restore dining option card selections
          this.showTastingMenus =
            reservation.showTastingMenus ??
            this.selectedTastingMenus.length > 0;

          this.showHandPickDishes =
            reservation.showHandPickDishes ??
            this.tastingList.length > 0;

          this.orderAtTable =
            reservation.orderAtTable ??
            (reservation.orderAtTableGuests ?? 0) > 0;

          // Clear messages
          this.errorMessage = '';
          this.errorTitle = '';
          this.successMessage = '';
          this.successTitle = '';

        },

        error: (error) => {

          console.error(
            'Failed to load reservation for re-booking:',
            error
          );

          this.errorTitle = 'Unable to Re-book';

          this.errorMessage =
            error?.error?.message ||
            'Unable to load the previous reservation details. Please try again.';

        }

      });
  }


  goToMenuForEditing(): void {

    const savedDraft = sessionStorage.getItem('reservationDraft');

    const previousDraft = savedDraft
      ? JSON.parse(savedDraft)
      : {};

    const reservationDraft = {
      ...previousDraft,

      reservationId: this.editingReservationId,
      guestName: this.guestName,
      email: this.guestEmail,
      phone: this.guestPhone,
      date: this.formatDateForApi(this.selectedDate),
      time: this.selectedTime,
      partySize: this.guestCount,
      servicePeriod: this.selectedPeriod,

      // Preserve current set menu selections
      tastingMenus: this.selectedTastingMenus,
      showTastingMenus: this.showTastingMenus,
      showHandPickDishes: this.showHandPickDishes,
      orderAtTable: this.orderAtTable,

      // Preserve selected dishes
      selectedDishes: this.tastingList,

      specialRequests: this.specialNotes
    };

    sessionStorage.setItem(
      'reservationDraft',
      JSON.stringify(reservationDraft)
    );

    if (this.isEditMode) {
      sessionStorage.setItem(
        'editingReservation',
        JSON.stringify(reservationDraft)
      );
    }

    this.tastingService.setItems(this.tastingList);

    void this.router.navigate(['/menu']);
  }

  confirmReservation(): void {

    // =========================
    // RESET MESSAGES
    // =========================

    this.errorTitle = '';
    this.errorMessage = '';

    if (
      !this.showTastingMenus &&
      !this.showHandPickDishes &&
      !this.orderAtTable
    ) {
      this.errorTitle =
        'Dining Option Required';
      this.errorMessage = 'Please select at least one dining option before proceeding.';
      return;
    }

    // =========================
    // VALIDATE CONTACT DETAILS
    // =========================

    if (
      !this.guestName.trim() ||
      !this.guestEmail.trim() ||
      !this.guestPhone.trim()
    ) {

      this.errorTitle =
        'Incomplete Contact Details';

      this.errorMessage =
        'Please complete all required contact details.';

      return;
    }

    if (
      this.showHandPickDishes &&
      this.tastingList.length === 0
    ) {
      this.errorTitle = 'Dishes Required';
      this.errorMessage = 'Please select at least one dish for your hand-picked dining experience.';
      return;
    }

    // =========================
    // VALIDATE DATE AND TIME
    // =========================

    if (
      !this.selectedDate ||
      !this.selectedTime ||
      this.selectedDate < this.minReservationDate
    ) {

      this.errorTitle =
        'Invalid Date or Time';

      this.errorMessage =
        'Please select a valid date and time for your reservation.';

      return;
    }


    // =========================
    // VALIDATE BRUNCH DATE
    // =========================

    if (
      this.selectedPeriod === 'brunch' &&
      !this.isWeekend(
        this.selectedDate
      )
    ) {

      this.errorTitle =
        'Invalid Brunch Date';

      this.errorMessage =
        'Weekend brunch is available on Saturdays and Sundays only.';

      return;
    }


    // =========================
    // VALIDATE PARTY SIZE
    // =========================

    if (
      this.partySize === '7+'
      && (
        !Number.isInteger(
          Number(this.largePartySize)
        )
        || Number(this.largePartySize) < 7
        || Number(this.largePartySize) > 30
      )
    ) {

      this.errorTitle =
        'Invalid Party Size';

      this.errorMessage =
        'Please enter a party size between 7 and 30 guests.';

      return;
    }

    // VALIDATE TASTING MENU QUANTITIES

    const tastingGuestCount =
      this.selectedTastingMenus.reduce(
        (total, menu) => total + menu.quantity,
        0
      );

    if (tastingGuestCount > this.guestCount) {

      this.errorTitle = 'Invalid Tasting Menu Selection';

      this.errorMessage =
        'The total number of tasting menus cannot exceed your party size.';

      return;
    }

    // =========================
    // PREPARE RESERVATION DATA
    // =========================

    const reservationData:
      CreateReservationRequest = {

      guestName:
        this.guestName.trim(),

      email:
        this.guestEmail
          .trim()
          .toLowerCase(),

      phone:
        this.guestPhone.trim(),

      date:
        this.formatDateForApi(
          this.selectedDate
        ),

      time:
        this.selectedTime,

      partySize:
        this.guestCount,

      servicePeriod: this.selectedPeriod,

      tastingMenus: this.selectedTastingMenus,

      alacarteGuests: this.alacarteGuests,
      orderAtTableGuests: this.orderAtTableGuests,

      selectedDishes: this.tastingList.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),

      diningOption:
        this.selectedTastingMenus.length > 0
          ? 'tasting'
          : this.tastingList.length > 0
            ? 'alacarte'
            : 'table',

      specialRequests: this.specialNotes.trim()
    };

    // =========================
    // SUBMIT TO BACKEND
    // =========================

    this.isSubmitting = true;

    const request$ = this.isEditMode
      ? this.reservationService.updateReservation(
        this.editingReservationId,
        reservationData
      )
      : this.reservationService.createReservation(
        reservationData
      );

    request$.subscribe({

      // =========================
      // SUCCESS
      // =========================

      next: (response) => {

        console.log(
          this.isEditMode
            ? 'Reservation updated:'
            : 'Reservation created:',
          response.reservation
        );

        this.isSubmitting = false;

        this.errorMessage = '';
        this.errorTitle = '';

        // Clear selected dishes only after the reservation has been saved successfully.
        this.tastingService.clearItems();
        this.tastingList = [];

        this.selectedTastingMenus = [];

        sessionStorage.removeItem('editingReservation');
        sessionStorage.removeItem('reservationDraft');

        // =========================
        // EDIT SUCCESS
        // =========================

        if (this.isEditMode) {

          this.successTitle =
            'Reservation Updated';

          this.successMessage =
            `Reservation ${response.reservation.reservationId} has been updated successfully.`;

        }


        // =========================
        // NEW RESERVATION SUCCESS
        // =========================

        else {

          this.createdReservationId =
            response.reservation.reservationId;

          this.successTitle =
            'Your Table Has Been Reserved';

          this.successMessage =
            `Reservation ${this.createdReservationId} has been submitted successfully. ` +
            'Your reservation is currently pending restaurant confirmation.';

        }


        // =========================
        // RETURN TO MY RESERVATIONS
        // =========================

        setTimeout(() => {

          this.successMessage = '';
          this.successTitle = '';

          void this.router.navigate([
            '/my-reservations'
          ]);

        }, 3000);

      },


      // =========================
      // ERROR
      // =========================

      error: (error) => {

        console.error(
          'Reservation error:',
          error
        );

        this.isSubmitting = false;


        // =========================
        // AUTHENTICATION ERROR
        // =========================

        if (error.status === 401) {

          this.errorTitle =
            'Login Required';

          this.errorMessage =
            'Please log in before making a reservation.';

          return;
        }

        // =========================
        // RESERVATION CAPACITY ERROR
        // =========================

        if (error.status === 409) {

          this.errorTitle =
            'Time Slot Unavailable';

          this.errorMessage =
            error?.error?.message ||
            'This time slot does not have enough capacity. Please select another time or date.';

          return;
        }

        // =========================
        // VALIDATION ERROR
        // =========================

        if (error.status === 400) {

          this.errorTitle =
            'Invalid Reservation';

          this.errorMessage =
            error?.error?.message ||
            'Please check your reservation details and try again.';

          return;
        }


        // =========================
        // FORBIDDEN
        // =========================

        if (error.status === 403) {

          this.errorTitle =
            'Unable to Modify Reservation';

          this.errorMessage =
            error?.error?.message ||
            'You are not allowed to modify this reservation.';

          return;
        }


        // =========================
        // NOT FOUND
        // =========================

        if (error.status === 404) {

          this.errorTitle =
            'Reservation Not Found';

          this.errorMessage =
            'The reservation could not be found. Please return to My Reservations.';

          return;
        }


        // =========================
        // GENERAL ERROR
        // =========================

        this.errorTitle =
          this.isEditMode
            ? 'Reservation Could Not Be Updated'
            : 'Reservation Could Not Be Submitted';

        this.errorMessage =
          error?.error?.message ||
          (
            this.isEditMode
              ? 'Unable to update your reservation. Please try again.'
              : 'Unable to create your reservation. Please try again.'
          );

      }

    });

  }

  get groupedTastingList(): TastingItem[] {
    return this.tastingList;
  }

  clearError(): void {
    this.errorMessage = '';
    this.errorTitle = '';
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

  }

  onErrorBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.clearError();
    }
  }

  get selectedDishCount(): number {
    return this.tastingList.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }

}
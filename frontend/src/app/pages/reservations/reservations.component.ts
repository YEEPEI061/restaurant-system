import {
  Component,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

import {
  ReservationService,
  CreateReservationRequest
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

  displayedMonth = new Date(
    this.today.getFullYear(),
    this.today.getMonth(),
    1
  );

  selectedDate =
    this.findNextAvailableDate(this.today);

  selectedPeriod:
    'dinner' | 'brunch' = 'dinner';

  partySize:
    number | '7+' = 2;

  largePartySize = 7;

  selectedSeating =
    'Main Dining Room';

  selectedTime = '';

  selectedDiningOption =
    'tasting';

  selectedTastingMenu =
    'Seven Course Odyssey';

  tastingList:
    TastingItem[] = [];

  includeBeveragePairing =
    false;

  guestName = '';
  guestEmail = '';
  guestPhone = '';
  specialNotes = '';

  isSubmitting = false;

  successMessage = '';
  successTitle = '';

  errorMessage = '';
  errorTitle = '';

  createdReservationId = '';

  calendarDays:
    CalendarDay[] = [];

  readonly beveragePairingPrice = 56;

  readonly seatingOptions = [
    {
      name: 'Main Dining Room',
      label: 'CLASSIC',
      description:
        'An intimate setting with warm oak tables and soft ambient lighting.',
      icon: 'chair'
    },
    {
      name: "Chef's Counter",
      label: 'INTERACTIVE',
      description:
        'Enjoy a closer view of our chefs preparing seasonal dishes.',
      icon: 'local_fire_department'
    },
    {
      name: 'Garden Solarium',
      label: 'SERENE',
      description:
        'A calm dining space inspired by greenery and natural light.',
      icon: 'potted_plant'
    }
  ];

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
      time: '19:15',
      label: 'Popular',
      disabled: false
    },
    {
      time: '20:00',
      label: 'Available',
      disabled: false
    },
    {
      time: '20:45',
      label: 'Available',
      disabled: false
    },
    {
      time: '21:15',
      label: 'Late seating',
      disabled: false
    },
    {
      time: '21:45',
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

    private router: Router
  ) {
    this.rebuildCalendar();
    this.selectFirstAvailableTime();
  }

  ngOnInit(): void {

    // =========================
    // LOAD SELECTED MENU ITEMS
    // =========================

    this.tastingList =
      this.tastingService.getItems();


    // =========================
    // USE HAND-PICKED DISHES
    // =========================

    if (this.tastingList.length > 0) {

      this.selectedDiningOption =
        'alacarte';

    }

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

  get selectedMenu() {

    return this.tastingMenus.find(
      menu =>
        menu.name ===
        this.selectedTastingMenu
    ) ?? this.tastingMenus[0];
  }

  get guestCount(): number {

    return this.partySize === '7+'
      ? this.largePartySize
      : this.partySize;
  }

  get diningSubtotal(): number {

    let total = 0;


    // =========================
    // TASTING MENU
    // =========================

    if (
      this.selectedDiningOption ===
      'tasting'
    ) {

      total =
        this.selectedMenu.price *
        this.guestCount;

    }


    // =========================
    // HAND-PICKED DISHES
    // =========================

    if (
      this.selectedDiningOption ===
      'alacarte'
    ) {

      total =
        this.tastingList.reduce(
          (sum, item) =>
            sum + item.price,
          0
        );

      total *=
        this.guestCount;

    }


    // =========================
    // BEVERAGE PAIRING
    // =========================

    if (
      this.includeBeveragePairing
    ) {

      total +=
        this.beveragePairingPrice *
        this.guestCount;

    }

    return total;
  }


  get diningOptionLabel(): string {

    switch (
      this.selectedDiningOption
    ) {

      case 'tasting':
        return 'Set Tasting Menu';

      case 'alacarte':
        return 'Hand-Pick Dishes';

      default:
        return 'Order at Table';
    }
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

      const isPast =
        date < this.today;

      const isMonday =
        date.getDay() === 1;

      cells.push({
        date,
        disabled:
          isPast ||
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

  selectDate(
    day: CalendarDay
  ): void {

    if (
      day.disabled ||
      !day.isCurrentMonth
    ) {
      return;
    }

    if (
      this.selectedPeriod ===
        'brunch'
      &&
      !this.isWeekend(day.date)
    ) {

      return;
    }

    this.selectedDate =
      new Date(day.date);

    this.selectedTime = '';

    this.selectFirstAvailableTime();

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

      let date =
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

  selectSeating(
    seating: string
  ): void {

    this.selectedSeating =
      seating;

    this.errorMessage = '';
  }

  selectDiningOption(
    option: string
  ): void {

    this.selectedDiningOption =
      option;

    this.errorMessage = '';
  }

  selectMenu(
    menu: string
  ): void {

    this.selectedTastingMenu =
      menu;

    this.selectedDiningOption =
      'tasting';

    this.errorMessage = '';
  }

  confirmReservation(): void {

    // =========================
    // RESET MESSAGES
    // =========================
  
    this.errorTitle = '';
    this.errorMessage = '';
  
  
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
  
  
    // =========================
    // VALIDATE DATE AND TIME
    // =========================
  
    if (
      !this.selectedDate ||
      !this.selectedTime ||
      this.selectedDate < this.today
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
  
  
    // =========================
    // VALIDATE HAND-PICKED DISHES
    // =========================
  
    if (
      this.selectedDiningOption === 'alacarte'
      && this.tastingList.length === 0
    ) {
  
      this.errorTitle =
        'No Dishes Selected';
  
      this.errorMessage =
        'Please select at least one dish before making a reservation.';
  
      return;
    }
  
  
    // =========================
    // PREPARE SELECTED DISHES
    // =========================
  
    const selectedDishes =
      this.selectedDiningOption === 'alacarte'
  
        ? this.tastingList.map(
            item => ({
              id: item.id,
              name: item.name,
              price: item.price
            })
          )
  
        : [];
  
  
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
  
      servicePeriod:
        this.selectedPeriod,
  
      seating:
        this.selectedSeating,
  
      diningOption:
        this.selectedDiningOption as
          'tasting' |
          'alacarte' |
          'table',
  
      tastingMenu:
        this.selectedDiningOption === 'tasting'
          ? this.selectedTastingMenu
          : '',
  
      // =========================
      // SEND SELECTED DISHES
      // =========================
  
      selectedDishes:
        selectedDishes,
  
      beveragePairing:
        this.includeBeveragePairing,
  
      packageName:
        this.selectedDiningOption === 'tasting'
          ? this.selectedTastingMenu
          : '',
  
      specialRequests:
        this.specialNotes.trim()
    };
  
  
    // =========================
    // DEBUG
    // =========================
  
    console.log(
      'Reservation data:',
      reservationData
    );
  
  
    // =========================
    // SUBMIT TO BACKEND
    // =========================
  
    this.isSubmitting = true;
  
    this.reservationService
      .createReservation(
        reservationData
      )
      .subscribe({
  
        // =========================
        // SUCCESS
        // =========================
  
        next: (response) => {

          this.createdReservationId =
            response.reservation.reservationId;
        
          console.log(
            'Reservation created:',
            response.reservation
          );
        
          this.isSubmitting = false;
        
          this.errorMessage = '';
          this.errorTitle = '';
        
          // Clear selected dishes only after
          // the reservation has been saved successfully.
          this.tastingService.clearItems();
        
          this.tastingList = [];
        
          // =========================
          // SHOW SUCCESS MESSAGE
          // =========================

          this.successTitle =
            'Your Table Has Been Reserved';

          this.successMessage =
            `Reservation ${this.createdReservationId} has been submitted successfully. ` +
            'Your reservation is currently pending restaurant confirmation.';

          // Keep the success modal visible for 3 seconds.
          setTimeout(() => {

            this.successMessage = '';
            this.successTitle = '';

            this.router.navigate([
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
        
          this.errorTitle =
            'Reservation Could Not Be Submitted';
        
          this.errorMessage =
            error?.error?.message ||
            'Something went wrong while submitting your reservation. Please try again.';
  
  
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
          // GENERAL ERROR
          // =========================
  
          this.errorTitle =
            'Reservation Could Not Be Submitted';
  
          this.errorMessage =
            error?.error?.message ||
            'Unable to create your reservation. Please try again.';
  
        }
  
      });
  
  }

  get groupedTastingList(): Array<TastingItem & { quantity: number }> {

    const grouped =
      new Map<string, TastingItem & { quantity: number }>();
  
    for (const item of this.tastingList) {
  
      const existing =
        grouped.get(item.id);
  
      if (existing) {
  
        existing.quantity += 1;
  
      } else {
  
        grouped.set(item.id, {
          ...item,
          quantity: 1
        });
  
      }
  
    }
  
    return Array.from(grouped.values());
  }

  clearError(): void {
    this.errorMessage = '';
    this.errorTitle = '';
  }

}
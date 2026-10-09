import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

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
export class ReservationsComponent {
  today = this.startOfDay(new Date());

  displayedMonth = new Date(
    this.today.getFullYear(),
    this.today.getMonth(),
    1
  );

  selectedDate = this.findNextAvailableDate(this.today);
  selectedPeriod: 'dinner' | 'brunch' = 'dinner';
  partySize: number | '7+' = 2;
  selectedSeating = 'Main Dining Room';
  selectedTime = '';
  selectedDiningOption = 'tasting';
  selectedTastingMenu = 'Seven Course Odyssey';

  includeBeveragePairing = false;

  guestName = '';
  guestEmail = '';
  guestPhone = '';
  specialNotes = '';

  isSubmitting = false;
  isConfirmed = false;
  errorMessage = '';

  calendarDays: CalendarDay[] = [];

  readonly depositPerGuest = 25;
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
    { time: '17:30', label: 'Available', disabled: false },
    { time: '18:00', label: 'Available', disabled: false },
    { time: '18:30', label: 'Available', disabled: false },
    { time: '19:15', label: 'Popular', disabled: false },
    { time: '20:00', label: 'Available', disabled: false },
    { time: '20:45', label: 'Available', disabled: false },
    { time: '21:15', label: 'Late seating', disabled: false },
    { time: '21:45', label: 'Unavailable', disabled: true }
  ];

  readonly brunchTimes: TimeSlot[] = [
    { time: '11:00', label: 'Available', disabled: false },
    { time: '11:30', label: 'Available', disabled: false },
    { time: '12:00', label: 'Available', disabled: false },
    { time: '12:30', label: 'Popular', disabled: false },
    { time: '13:00', label: 'Available', disabled: false },
    { time: '13:30', label: 'Available', disabled: false },
    { time: '14:00', label: 'Available', disabled: false },
    { time: '14:30', label: 'Unavailable', disabled: true }
  ];

  constructor() {
    this.rebuildCalendar();
    this.selectFirstAvailableTime();
  }

  private startOfDay(date: Date): Date {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  }

  private findNextAvailableDate(from: Date): Date {
    const date = this.startOfDay(from);

    // Monday is the restaurant's regular closing day.
    while (date.getDay() === 1) {
      date.setDate(date.getDate() + 1);
    }

    return date;
  }

  get monthLabel(): string {
    return this.displayedMonth.toLocaleDateString('en-MY', {
      month: 'long',
      year: 'numeric'
    });
  }

  get selectedDateLabel(): string {
    return this.selectedDate.toLocaleDateString('en-MY', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  get shortSelectedDate(): string {
    return this.selectedDate.toLocaleDateString('en-MY', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  get currentTimes(): TimeSlot[] {
    return this.selectedPeriod === 'dinner'
      ? this.dinnerTimes
      : this.brunchTimes;
  }

  get selectedMenu() {
    return this.tastingMenus.find(
      menu => menu.name === this.selectedTastingMenu
    ) ?? this.tastingMenus[0];
  }

  get guestCount(): number {
    return this.partySize === '7+' ? 8 : this.partySize;
  }

  get diningSubtotal(): number {
    let total = 0;

    if (this.selectedDiningOption === 'tasting') {
      total = this.selectedMenu.price * this.guestCount;
    }

    if (this.includeBeveragePairing) {
      total += this.beveragePairingPrice * this.guestCount;
    }

    return total;
  }

  get depositTotal(): number {
    return this.depositPerGuest * this.guestCount;
  }

  get diningOptionLabel(): string {
    switch (this.selectedDiningOption) {
      case 'tasting':
        return 'Set Tasting Menu';
      case 'alacarte':
        return 'Hand-Pick Dishes';
      default:
        return 'Order at Table';
    }
  }

  private rebuildCalendar(): void {
    const year = this.displayedMonth.getFullYear();
    const month = this.displayedMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Sunday-first calendar. Empty cells keep dates aligned.
    const leadingBlanks = firstDay.getDay();

    const cells: CalendarDay[] = [];

    for (let i = 0; i < leadingBlanks; i++) {
      cells.push({
        date: new Date(year, month, 1 - (leadingBlanks - i)),
        disabled: true,
        isCurrentMonth: false
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isPast = date < this.today;
      const isMonday = date.getDay() === 1;

      cells.push({
        date,
        disabled: isPast || isMonday,
        isCurrentMonth: true
      });
    }

    while (cells.length % 7 !== 0) {
      const lastDate = cells[cells.length - 1].date;

      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 1);

      cells.push({
        date: nextDate,
        disabled: true,
        isCurrentMonth: false
      });
    }

    this.calendarDays = cells;
  }

  previousMonth(): void {
    const previous = new Date(
      this.displayedMonth.getFullYear(),
      this.displayedMonth.getMonth() - 1,
      1
    );

    const earliestMonth = new Date(
      this.today.getFullYear(),
      this.today.getMonth(),
      1
    );

    if (previous < earliestMonth) {
      return;
    }

    this.displayedMonth = previous;
    this.rebuildCalendar();
  }

  nextMonth(): void {
    this.displayedMonth = new Date(
      this.displayedMonth.getFullYear(),
      this.displayedMonth.getMonth() + 1,
      1
    );

    this.rebuildCalendar();
  }

  isSameDate(first: Date, second: Date): boolean {
    return first.getFullYear() === second.getFullYear()
      && first.getMonth() === second.getMonth()
      && first.getDate() === second.getDate();
  }

  isWeekend(date: Date): boolean {
    return date.getDay() === 0 || date.getDay() === 6;
  }

  selectDate(day: CalendarDay): void {
    if (day.disabled || !day.isCurrentMonth) {
      return;
    }

    if (
      this.selectedPeriod === 'brunch'
      && !this.isWeekend(day.date)
    ) {
      return;
    }

    this.selectedDate = new Date(day.date);
    this.selectedTime = '';
    this.selectFirstAvailableTime();
    this.isConfirmed = false;
    this.errorMessage = '';
  }

  changePeriod(period: 'dinner' | 'brunch'): void {
    this.selectedPeriod = period;

    if (period === 'brunch' && !this.isWeekend(this.selectedDate)) {
      let date = new Date(this.selectedDate);

      while (!this.isWeekend(date) || date < this.today) {
        date.setDate(date.getDate() + 1);
      }

      this.selectedDate = date;
      this.displayedMonth = new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      );

      this.rebuildCalendar();
    }

    this.selectedTime = '';
    this.selectFirstAvailableTime();
    this.isConfirmed = false;
    this.errorMessage = '';
  }

  selectFirstAvailableTime(): void {
    this.selectedTime =
      this.currentTimes.find(slot => !slot.disabled)?.time ?? '';
  }

  selectTime(slot: TimeSlot): void {
    if (slot.disabled) {
      return;
    }

    this.selectedTime = slot.time;
    this.isConfirmed = false;
    this.errorMessage = '';
  }

  selectPartySize(size: number | '7+'): void {
    this.partySize = size;
    this.isConfirmed = false;
    this.errorMessage = '';
  }

  selectSeating(seating: string): void {
    this.selectedSeating = seating;
    this.isConfirmed = false;
    this.errorMessage = '';
  }

  selectDiningOption(option: string): void {
    this.selectedDiningOption = option;
    this.isConfirmed = false;
    this.errorMessage = '';
  }

  selectMenu(menu: string): void {
    this.selectedTastingMenu = menu;
    this.selectedDiningOption = 'tasting';
    this.isConfirmed = false;
    this.errorMessage = '';
  }

  confirmReservation(): void {
    this.errorMessage = '';

    if (
      !this.guestName.trim()
      || !this.guestEmail.trim()
      || !this.guestPhone.trim()
    ) {
      this.errorMessage = 'Please complete all required contact details.';
      return;
    }

    if (
      !this.selectedDate
      || !this.selectedTime
      || this.selectedDate < this.today
    ) {
      this.errorMessage = 'Please select a valid date and time.';
      return;
    }

    if (
      this.selectedPeriod === 'brunch'
      && !this.isWeekend(this.selectedDate)
    ) {
      this.errorMessage = 'Weekend brunch is available on Saturdays and Sundays only.';
      return;
    }

    this.isSubmitting = true;
    this.isConfirmed = false;

    // Temporary frontend demonstration.
    // Later, this will submit the reservation to the Express API.
    setTimeout(() => {
      this.isSubmitting = false;
      this.isConfirmed = true;

      console.log('Reservation preview:', {
        guestName: this.guestName,
        guestEmail: this.guestEmail,
        guestPhone: this.guestPhone,
        date: this.selectedDateLabel,
        period: this.selectedPeriod,
        time: this.selectedTime,
        partySize: this.partySize,
        seating: this.selectedSeating,
        diningOption: this.diningOptionLabel,
        tastingMenu:
          this.selectedDiningOption === 'tasting'
            ? this.selectedTastingMenu
            : null,
        beveragePairing: this.includeBeveragePairing,
        estimatedSubtotal: this.diningSubtotal,
        deposit: this.depositTotal,
        specialNotes: this.specialNotes
      });
    }, 700);
  }
}
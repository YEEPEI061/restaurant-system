import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export type ServicePeriod = 'dinner' | 'brunch';

export type DiningOption =
  | 'tasting'
  | 'alacarte'
  | 'table';

export type ReservationStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Seated'
  | 'Completed'
  | 'Cancelled';

// =========================
// SELECTED DISH
// =========================

export interface SelectedDish {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface TastingMenuSelection {
  name: string;
  quantity: number;
  price: number;
}

export interface Reservation {
  _id: string;
  reservationId: string;

  guest: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };

  guestName: string;
  email: string;
  phone: string;

  date: string;
  time: string;
  partySize: number;

  servicePeriod: ServicePeriod;
  diningOption: DiningOption;

  // =========================
  // SELECTED DISHES
  // =========================

  selectedDishes: SelectedDish[];

  table?: string | null;

  specialRequests: string;

  status: ReservationStatus;

  createdAt?: string;
  updatedAt?: string;

  tastingMenus?: TastingMenuSelection[];
  showTastingMenus?: boolean;
  showHandPickDishes?: boolean;
  orderAtTable?: boolean;

  alacarteGuests?: number;

  orderAtTableGuests?: number;

}

export interface CreateReservationRequest {
  guestName: string;
  email: string;
  phone: string;

  date: string;
  time: string;
  partySize: number;

  servicePeriod: ServicePeriod;
  diningOption: DiningOption;

  // =========================
  // SELECTED DISHES
  // =========================

  selectedDishes?: SelectedDish[];

  table?: string;

  specialRequests?: string;

  // =========================
  // DINING SELECTIONS
  // =========================

  tastingMenus: TastingMenuSelection[];
  alacarteGuests: number;
  orderAtTableGuests: number;

}

export interface UpdateReservationRequest {
  guestName?: string;
  email?: string;
  phone?: string;

  date?: string;
  time?: string;
  partySize?: number;

  servicePeriod?: ServicePeriod;
  diningOption?: DiningOption;

  // =========================
  // SELECTED DISHES
  // =========================

  selectedDishes?: SelectedDish[];

  table?: string;

  specialRequests?: string;

  status?: ReservationStatus;

  // =========================
  // DINING SELECTIONS
  // =========================

  tastingMenus?: TastingMenuSelection[];
  alacarteGuests?: number;
  orderAtTableGuests?: number;

}

export interface ReservationsResponse {
  count: number;
  reservations: Reservation[];
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {

  private readonly endpoint = '/reservations';

  constructor(
    private http: HttpClient,
    private api: ApiService
  ) { }

  // =========================
  // GET ALL RESERVATIONS
  // =========================

  getReservations(): Observable<ReservationsResponse> {
    return this.http.get<ReservationsResponse>(
      `${this.api.baseUrl}${this.endpoint}`
    );
  }

  // =========================
  // GET ONE RESERVATION
  // =========================

  getReservationById(
    reservationId: string
  ): Observable<{ reservation: Reservation }> {

    return this.http.get<{ reservation: Reservation }>(
      `${this.api.baseUrl}${this.endpoint}/${reservationId}`
    );
  }

  // =========================
  // GET LOGGED-IN GUEST RESERVATIONS
  // =========================

  getMyReservations(): Observable<ReservationsResponse> {
    return this.http.get<ReservationsResponse>(
      `${this.api.baseUrl}${this.endpoint}/my`
    );
  }

  // =========================
  // CREATE RESERVATION
  // =========================

  createReservation(
    data: CreateReservationRequest
  ): Observable<{
    message: string;
    reservation: Reservation;
  }> {

    return this.http.post<{
      message: string;
      reservation: Reservation;
    }>(
      `${this.api.baseUrl}${this.endpoint}`,
      data
    );
  }

  // =========================
  // UPDATE RESERVATION
  // =========================

  updateReservation(
    reservationId: string,
    data: UpdateReservationRequest
  ): Observable<{
    message: string;
    reservation: Reservation;
  }> {

    return this.http.put<{
      message: string;
      reservation: Reservation;
    }>(
      `${this.api.baseUrl}${this.endpoint}/${reservationId}`,
      data
    );
  }

  // =========================
  // UPDATE STATUS
  // =========================

  updateReservationStatus(
    reservationId: string,
    status: ReservationStatus
  ): Observable<{
    message: string;
    reservation: Reservation;
  }> {

    return this.http.patch<{
      message: string;
      reservation: Reservation;
    }>(
      `${this.api.baseUrl}${this.endpoint}/${reservationId}/status`,
      { status }
    );
  }

  // =========================
  // DELETE RESERVATION
  // =========================

  deleteReservation(
    reservationId: string
  ): Observable<{ message: string }> {

    return this.http.delete<{ message: string }>(
      `${this.api.baseUrl}${this.endpoint}/${reservationId}`
    );
  }
}
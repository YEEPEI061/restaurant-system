import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiService } from './api.service';
import {
  LoginCredentials,
  GuestSignupData,
  AuthUser,
  AuthResponse,
  SignupResponse,
  CurrentUserResponse
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly endpoint = '/auth';

  constructor(
    private http: HttpClient,
    private api: ApiService
  ) { }

  // =========================
  // GUEST SIGNUP
  // =========================

  guestSignup(data: GuestSignupData): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(
      `${this.api.baseUrl}${this.endpoint}/guest/signup`,
      data
    );
  }

  // =========================
  // GUEST LOGIN
  // =========================

  guestLogin(data: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.api.baseUrl}${this.endpoint}/guest/login`,
        data
      )
      .pipe(
        tap(response => {
          this.storeAuthentication(response);
        })
      );
  }

  // =========================
  // ADMIN LOGIN
  // =========================

  adminLogin(data: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.api.baseUrl}${this.endpoint}/admin/login`,
        data
      )
      .pipe(
        tap(response => {
          this.storeAuthentication(response);
        })
      );
  }

  // =========================
  // CURRENT USER
  // =========================

  getCurrentUser(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(
      `${this.api.baseUrl}${this.endpoint}/me`
    );
  }

  // =========================
  // TOKEN
  // =========================

  getToken(): string | null {
    return localStorage.getItem('aurelia_token');
  }

  // =========================
  // USER
  // =========================

  getUser(): AuthUser | null {
    const user =
      localStorage.getItem('aurelia_user');

    return user
      ? JSON.parse(user) as AuthUser
      : null;
  }

  // =========================
  // LOGIN STATUS
  // =========================

  isLoggedIn(): boolean {

    const token = this.getToken();

    if (!token) {
      return false;
    }

    try {

      // Decode JWT payload
      const payload = token.split('.')[1];

      if (!payload) {
        this.logout();
        return false;
      }

      const decoded = JSON.parse(
        atob(
          payload
            .replace(/-/g, '+')
            .replace(/_/g, '/')
        )
      );

      // Check token expiry
      if (
        !decoded.exp ||
        decoded.exp * 1000 <= Date.now()
      ) {

        this.logout();
        return false;
      }

      return true;

    } catch {
      // Invalid token format
      this.logout();
      return false;

    }
  }

  // =========================
  // LOGOUT
  // =========================

  logout(): void {
    localStorage.removeItem('aurelia_token');
    localStorage.removeItem('aurelia_user');
  }

  // =========================
  // STORE AUTHENTICATION
  // =========================

  private storeAuthentication(response: AuthResponse): void {
    if (response.token) {
      localStorage.setItem('aurelia_token', response.token);
    }

    if (response.user) {
      localStorage.setItem(
        'aurelia_user',
        JSON.stringify(response.user)
      );
    }
  }
}
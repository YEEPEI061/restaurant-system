import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export type UserRole = 'guest' | 'admin';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsersResponse {
  count: number;
  users: User[];
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
  active?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly endpoint = '/users';

  constructor(
    private http: HttpClient,
    private api: ApiService
  ) {}

  getUsers(): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(
      `${this.api.baseUrl}${this.endpoint}`
    );
  }

  getUser(id: string): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(
      `${this.api.baseUrl}${this.endpoint}/${id}`
    );
  }

  createUser(
    data: CreateUserRequest
  ): Observable<{ message: string; user: User }> {
    return this.http.post<{ message: string; user: User }>(
      `${this.api.baseUrl}${this.endpoint}`,
      data
    );
  }

  updateUser(
    id: string,
    data: UpdateUserRequest
  ): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(
      `${this.api.baseUrl}${this.endpoint}/${id}`,
      data
    );
  }

  updateUserStatus(
    id: string,
    active: boolean
  ): Observable<{ message: string; user: User }> {
    return this.http.patch<{ message: string; user: User }>(
      `${this.api.baseUrl}${this.endpoint}/${id}/status`,
      { active }
    );
  }

  deleteUser(
    id: string
  ): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.api.baseUrl}${this.endpoint}/${id}`
    );
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export type MenuCategory =
  | 'Prelude & Starters'
  | 'Wood-Fire Mains'
  | 'Mid-Course Savory'
  | 'Desserts & Confections'
  | 'Beverages';

export type DietaryTag =
  | 'GF'
  | 'DF'
  | 'SF'
  | 'NF'
  | 'Veg';

export interface MenuItem {
  _id: string;
  dishId: string;
  name: string;
  description: string;
  category: MenuCategory;
  price: number;
  available: boolean;
  signature: boolean;
  dietary: DietaryTag[];
  image: string;
  provenance: string;
  pairing: string;
  allergens: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItemsResponse {
  count: number;
  menuItems: MenuItem[];
}

export interface CreateMenuItemRequest {
  name: string;
  description: string;
  category: MenuCategory;
  price: number;
  available?: boolean;
  signature?: boolean;
  dietary?: DietaryTag[];
  image?: string;
  provenance?: string;
  pairing?: string;
  allergens?: string;
}

export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  category?: MenuCategory;
  price?: number;
  available?: boolean;
  signature?: boolean;
  dietary?: DietaryTag[];
  image?: string;
  provenance?: string;
  pairing?: string;
  allergens?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private readonly endpoint = '/menu';

  constructor(
    private http: HttpClient,
    private api: ApiService
  ) {}

  getMenuItems(): Observable<MenuItemsResponse> {
    return this.http.get<MenuItemsResponse>(
      `${this.api.baseUrl}${this.endpoint}`
    );
  }

  getMenuItemById(
    dishId: string
  ): Observable<{ menuItem: MenuItem }> {
    return this.http.get<{ menuItem: MenuItem }>(
      `${this.api.baseUrl}${this.endpoint}/${dishId}`
    );
  }

  createMenuItem(
    data: CreateMenuItemRequest
  ): Observable<{ message: string; menuItem: MenuItem }> {
    return this.http.post<{ message: string; menuItem: MenuItem }>(
      `${this.api.baseUrl}${this.endpoint}`,
      data
    );
  }

  updateMenuItem(
    dishId: string,
    data: UpdateMenuItemRequest
  ): Observable<{ message: string; menuItem: MenuItem }> {
    return this.http.put<{ message: string; menuItem: MenuItem }>(
      `${this.api.baseUrl}${this.endpoint}/${dishId}`,
      data
    );
  }

  deleteMenuItem(
    dishId: string
  ): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.api.baseUrl}${this.endpoint}/${dishId}`
    );
  }

  updateAvailability(
    dishId: string,
    available: boolean
  ): Observable<{ message: string; menuItem: MenuItem }> {
    return this.http.patch<{ message: string; menuItem: MenuItem }>(
      `${this.api.baseUrl}${this.endpoint}/${dishId}/availability`,
      { available }
    );
  }
}
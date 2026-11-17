import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TastingItem {
  name: string;
  price: number;
  id: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class TastingService {

  private readonly tastingItemsSubject =
    new BehaviorSubject<TastingItem[]>([]);

  readonly tastingItems$ =
    this.tastingItemsSubject.asObservable();

  getItems(): TastingItem[] {
    return this.tastingItemsSubject.value;
  }

  setItems(items: TastingItem[]): void {
    this.tastingItemsSubject.next([...items]);
  }

  addItem(item: Omit<TastingItem, 'quantity'>): void {

    const currentItems = this.tastingItemsSubject.value;

    const existing = currentItems.find(
      current => current.id === item.id
    );

    let updatedItems: TastingItem[];

    if (existing) {

      updatedItems = currentItems.map(current =>
        current.id === item.id
          ? { ...current, quantity: current.quantity + 1 }
          : current
      );

    } else {

      updatedItems = [
        ...currentItems,
        {
          ...item,
          quantity: 1
        }
      ];

    }

    this.tastingItemsSubject.next(updatedItems);
  }

  removeItem(id: string): void {
    const updatedItems =
      this.tastingItemsSubject.value.filter(
        item => item.id !== id
      );

    this.tastingItemsSubject.next(updatedItems);
  }

  clearItems(): void {
    this.tastingItemsSubject.next([]);
  }

  getTotal(): number {
    return this.tastingItemsSubject.value.reduce(
      (total, item) =>
        total + item.price * item.quantity,
      0
    );
  }
}
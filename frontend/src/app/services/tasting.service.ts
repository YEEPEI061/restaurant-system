import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TastingItem {
  name: string;
  price: number;
  id: string;
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

  addItem(item: TastingItem): void {
    const currentItems =
      this.tastingItemsSubject.value;

    this.tastingItemsSubject.next([
      ...currentItems,
      item
    ]);
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
      (total, item) => total + item.price,
      0
    );
  }
}
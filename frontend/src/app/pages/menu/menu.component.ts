import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import {
  MenuService,
  MenuCategory,
  DietaryTag
} from '../../services/menu.service';

import {
  TastingService,
  TastingItem
} from '../../services/tasting.service';
import { AuthService } from '../../services/auth.service';

import {
  WebSocketService
} from '../../services/websocket.service';
import { TastingMenuSelection } from '../../services/reservation.service';

interface MenuItem {
  _id: string;
  dishId: string;
  name: string;
  price: number;
  category: MenuCategory;
  dietary: DietaryTag[];
  description: string;
  provenance: string;
  pairing: string;
  image: string;
  available: boolean;
  signature: boolean;
  allergens: string;
}


@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})

export class MenuComponent implements OnInit {

  constructor(
    private menuService: MenuService,
    private tastingService: TastingService,
    private authService: AuthService,
    private router: Router,
    private webSocketService: WebSocketService
  ) { }

  activeCategory = 'all';

  activeFilters = new Set<string>();

  searchQuery = '';

  isLoading = false;
  loadError = '';

  isDietaryModalOpen = false;
  isTastingDrawerOpen = false;

  selectedDish: MenuItem | null = null;
  menuItems: MenuItem[] = [];

  tastingList: TastingItem[] = [];

  tastingDeleteConfirmOpen = false;
  tastingItemToDelete: TastingItem | null = null;
  successMessage = '';
  successTitle = '';
  successTimeout?: ReturnType<typeof setTimeout>;

  selectedReservationMenus: TastingMenuSelection[] = [];
  reservationMenuToDeleteIndex: number | null = null;

  categories = [
    {
      value: 'all',
      label: 'All Creations'
    },
    {
      value: 'Prelude & Starters',
      label: 'Small Plates & Crudo'
    },
    {
      value: 'Wood-Fire Mains',
      label: 'Mains & Hearth'
    },
    {
      value: 'Mid-Course Savory',
      label: 'Wood-fired Sides'
    },
    {
      value: 'Desserts & Confections',
      label: 'Desserts'
    },
    {
      value: 'Beverages',
      label: 'Beverages'
    }
  ];

  dietaryFilters = [
    {
      value: 'GF',
      label: 'Gluten-Free [GF]'
    },
    {
      value: 'Veg',
      label: 'Vegetarian [Veg]'
    },
    {
      value: 'DF',
      label: 'Dairy-Free [DF]'
    },
    {
      value: 'SPECIAL',
      label: 'Chef Special'
    }
  ];

  ngOnInit(): void {

    this.tastingService.tastingItems$.subscribe(items => {
      this.tastingList = items;
    });

    // Restore selected set menus from reservation draft
    const savedDraft =
      sessionStorage.getItem('reservationDraft');

    if (savedDraft) {
      const reservation = JSON.parse(savedDraft);

      this.selectedReservationMenus =
        reservation.tastingMenus || [];
    }

    this.loadMenuItems();

    this.webSocketService.connect();

    this.webSocketService.messages$
      .subscribe(message => {

        switch (message.type) {
          case 'menu.created':
          case 'menu.updated':
          case 'menu.deleted':
            this.loadMenuItems();
            break;
        }

      });

  }

  loadMenuItems(): void {

    this.isLoading = true;
    this.loadError = '';

    this.menuService.getMenuItems().subscribe({
      next: (response) => {

        this.menuItems = response.menuItems
          .filter(item => item.available)
          .map(item => ({
            _id: item._id,
            dishId: item.dishId,
            name: item.name,
            price: item.price,
            category: item.category,
            dietary: item.dietary,
            description: item.description,
            provenance: item.provenance,
            pairing: item.pairing,
            image: item.image,
            available: item.available,
            signature: item.signature,
            allergens: item.allergens
          }));

        this.isLoading = false;
      },

      error: (error) => {

        console.error('Failed to load menu:', error);

        this.loadError =
          error?.error?.message ||
          'Unable to load the menu at this time.';

        this.isLoading = false;
      }
    });
  }

  clearDietaryFilters(): void {
    this.activeFilters.clear();
  }

  get filteredItems(): MenuItem[] {

    const query = this.searchQuery
      .toLowerCase()
      .trim();

    return this.menuItems.filter(item => {

      const categoryMatch =
        this.activeCategory === 'all' ||
        item.category === this.activeCategory;

      const dietaryMatch =
        this.activeFilters.size === 0 ||
        [...this.activeFilters].every(filter => {

          if (filter === 'SPECIAL') {
            return item.signature;
          }

          return item.dietary.includes(
            filter as DietaryTag
          );
        });

      const searchMatch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.provenance.toLowerCase().includes(query);

      return (
        categoryMatch &&
        dietaryMatch &&
        searchMatch
      );
    });
  }

  get tastingTotal(): number {
    const dishTotal = this.tastingList.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    const setMenuTotal = this.selectedReservationMenus.reduce(
      (total, menu) => total + menu.price * menu.quantity,
      0
    );

    return dishTotal + setMenuTotal;
  }

  selectCategory(category: string): void {
    this.activeCategory = category;
  }

  toggleDietaryFilter(filter: string): void {
    if (this.activeFilters.has(filter)) {
      this.activeFilters.delete(filter);
    } else {
      this.activeFilters.add(filter);
    }
  }

  isFilterActive(filter: string): boolean {
    return this.activeFilters.has(filter);
  }

  addToTasting(item: MenuItem): void {

    this.tastingService.addItem({
      name: item.name,
      price: item.price,
      id: item.dishId
    });

    this.tastingList =
      this.tastingService.getItems();

    this.updateReservationDraftDishes();

    this.openTastingDrawer();
  }

  selectTastingMenu(
    type: '5-course' | '7-course'
  ): void {

    const menu: TastingMenuSelection = type === '5-course'
      ? {
        name: 'Five Course Prelude',
        price: 125,
        quantity: 1
      }
      : {
        name: 'Seven Course Odyssey',
        price: 175,
        quantity: 1
      };

    const existingMenu = this.selectedReservationMenus.find(
      item => item.name === menu.name
    );

    if (existingMenu) {
      existingMenu.quantity++;
    } else {
      this.selectedReservationMenus.push(menu);
    }

    // Save selected set menus into reservation draft
    const savedDraft = sessionStorage.getItem('reservationDraft');

    const reservation = savedDraft
      ? JSON.parse(savedDraft)
      : {};

    reservation.tastingMenus = this.selectedReservationMenus;
    reservation.showTastingMenus = true;

    sessionStorage.setItem(
      'reservationDraft',
      JSON.stringify(reservation)
    );

    this.openTastingDrawer();
  }

  removeFromTasting(id?: string, menuIndex?: number): void {

    if (menuIndex !== undefined) {
      this.selectedReservationMenus.splice(menuIndex, 1);

      const savedDraft = sessionStorage.getItem('reservationDraft');

      if (savedDraft) {
        const reservation = JSON.parse(savedDraft);

        reservation.tastingMenus = this.selectedReservationMenus;
        reservation.showTastingMenus = this.selectedReservationMenus.length > 0;

        sessionStorage.setItem('reservationDraft', JSON.stringify(reservation));
      }

    } else if (id) {

      this.tastingService.removeItem(id);

      this.tastingList =
        this.tastingService.getItems();

      this.updateReservationDraftDishes();

    }

  }

  openDietaryModal(item: MenuItem): void {
    this.selectedDish = item;
    this.isDietaryModalOpen = true;
  }

  closeDietaryModal(): void {
    this.isDietaryModalOpen = false;
    this.selectedDish = null;
  }

  openTastingDrawer(): void {
    this.isTastingDrawerOpen = true;
  }

  closeTastingDrawer(): void {
    this.isTastingDrawerOpen = false;
  }

  openTastingDeleteConfirm(item?: TastingItem, menuIndex?: number): void {
    this.tastingItemToDelete = item ?? null;
    this.reservationMenuToDeleteIndex = menuIndex ?? null;
    this.tastingDeleteConfirmOpen = true;
  }

  cancelTastingDelete(): void {
    this.tastingDeleteConfirmOpen = false;
    this.tastingItemToDelete = null;
    this.reservationMenuToDeleteIndex = null;
  }

  confirmTastingDelete(): void {

    // Remove selected set menu
    if (this.reservationMenuToDeleteIndex !== null) {

      const menuName =
        this.selectedReservationMenus[this.reservationMenuToDeleteIndex]?.name;

      this.removeFromTasting(
        undefined,
        this.reservationMenuToDeleteIndex
      );

      this.cancelTastingDelete();

      this.reservationMenuToDeleteIndex = null;

      this.showSuccess(
        'Set Menu Removed',
        `${menuName} has been removed from your tasting list.`
      );

      return;
    }

    // Remove hand-picked dish
    if (!this.tastingItemToDelete) return;

    const dishName = this.tastingItemToDelete.name;

    this.removeFromTasting(this.tastingItemToDelete.id);

    this.cancelTastingDelete();

    this.showSuccess(
      'Dish Removed',
      `${dishName} has been removed from your tasting list.`
    );
  }

  onDietaryBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDietaryModal();
    }
  }

  onTastingDrawerBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeTastingDrawer();
    }
  }

  onTastingDeleteBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancelTastingDelete();
    }
  }

  showSuccess(
    title: string,
    message: string
  ): void {

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

      }, 1600);
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

  proceedToReservation(): void {

    this.closeTastingDrawer();

    const hasReservationDraft =
      !!sessionStorage.getItem('reservationDraft');

    const destination = hasReservationDraft
      ? '/reservations?returnFromMenu=true'
      : '/reservations';

    if (this.authService.isLoggedIn()) {

      void this.router.navigateByUrl(destination);

    } else {

      void this.router.navigate(
        ['/guest-login'],
        {
          queryParams: {
            returnUrl: destination
          }
        }
      );

    }
  }

  get groupedTastingList(): TastingItem[] {
    return this.tastingList;
  }

  get tastingItemCount(): number {
    const dishCount = this.tastingList.reduce(
      (total, item) => total + item.quantity,
      0
    );

    const setMenuCount = this.selectedReservationMenus.reduce(
      (total, menu) => total + menu.quantity,
      0
    );

    return dishCount + setMenuCount;
  }

  trackByName(index: number, item: MenuItem): string {
    return item.name;
  }

  private updateReservationDraftDishes(): void {

    const savedDraft =
      sessionStorage.getItem('reservationDraft');

    if (!savedDraft) {
      return;
    }

    const reservation = JSON.parse(savedDraft);

    reservation.selectedDishes =
      this.tastingService.getItems();

    reservation.showHandPickDishes =
      reservation.selectedDishes.length > 0 ||
      reservation.showHandPickDishes === true;

    sessionStorage.setItem(
      'reservationDraft',
      JSON.stringify(reservation)
    );

  }

}
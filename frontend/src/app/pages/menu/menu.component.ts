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
    private router: Router
  ) {}

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
      value: 'SF',
      label: 'Shellfish-Free [SF]'
    },
    {
      value: 'NF',
      label: 'Nut-Free [NF]'
    },
    {
      value: 'SPECIAL',
      label: 'Chef Special'
    }
  ];

  ngOnInit(): void {
    this.loadMenuItems();
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
    return this.tastingList.reduce(
      (total, item) => total + item.price,
      0
    );
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
  
    this.openTastingDrawer();
  }

  selectTastingMenu(
    type: '5-course' | '7-course'
  ): void {
  
    if (type === '5-course') {
  
      this.tastingService.addItem({
        name: '5-Course Prelude Tasting Menu',
        price: 125,
        id: 'tasting-5-course'
      });
  
    } else {
  
      this.tastingService.addItem({
        name: '7-Course Odyssey Tasting Menu',
        price: 175,
        id: 'tasting-7-course'
      });
  
    }
  
    this.tastingList =
      this.tastingService.getItems();
  
    this.openTastingDrawer();
  }

  removeFromTasting(id: string): void {

    this.tastingService.removeItem(id);
  
    this.tastingList =
      this.tastingService.getItems();
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

  proceedToReservation(): void {

    // Close the tasting drawer first
    this.closeTastingDrawer();
  
    // Check whether the guest is logged in
    if (this.authService.isLoggedIn()) {
  
      // Already logged in
      this.router.navigate(['/reservations']);
  
    } else {
  
      // Not logged in
      this.router.navigate(['/guest-login']);
  
    }
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

  trackByName(index: number, item: MenuItem): string {
    return item.name;
  }
}
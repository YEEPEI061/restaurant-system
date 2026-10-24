import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

import {
  MenuService,
  MenuItem as ApiMenuItem,
  MenuCategory,
  DietaryTag
} from '../../services/menu.service';

import {
  WebSocketService
} from '../../services/websocket.service';

interface MenuDish {
  id: string;
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
}

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './menu-management.component.html',
  styleUrl: './menu-management.component.css'
})

export class MenuManagementComponent implements OnInit {

  // =========================
  // FILTERS
  // =========================

  categories = [
    'All Courses',
    'Prelude & Starters',
    'Wood-Fire Mains',
    'Mid-Course Savory',
    'Desserts & Confections',
    'Beverages'
  ];

  dietaryOptions: DietaryTag[] = [
    'GF',
    'DF',
    'SF',
    'NF',
    'Veg'
  ];

  activeCategory = 'All Courses';

  searchTerm = '';

  activeDietary: DietaryTag[] = [];

  signatureOnly = false;

  unavailableOnly = false;

  // =========================
  // SUCCESS MESSAGE
  // =========================

  successMessage = '';
  successTitle = '';

  private successTimeout?:
    ReturnType<typeof setTimeout>;

  // =========================
  // ERROR MESSAGE
  // =========================

  errorMessage = '';
  errorTitle = '';

  private errorTimeout?:
    ReturnType<typeof setTimeout>;

  // =========================
  // DELETE CONFIRMATION
  // =========================

  deleteConfirmOpen = false;

  dishToDelete:
    MenuDish | null = null;

  // =========================
  // DRAWER
  // =========================

  showDishDrawer = false;

  editingDishId: string | null = null;

  // =========================
  // LOADING
  // =========================

  isLoading = false;

  // =========================
  // FORM
  // =========================

  form: MenuDish =
    this.createEmptyDish();

  // =========================
  // MENU DATA
  // =========================

  dishes: MenuDish[] = [];

  constructor(
    private menuService: MenuService,
    private webSocketService: WebSocketService
  ) { }

  ngOnInit(): void {

    this.loadMenuItems();

    this.webSocketService.connect();

    this.webSocketService.messages$
      .subscribe(message => {

        console.log(
          'Menu WebSocket message:',
          message
        );

        switch (message.type) {

          case 'menu.created':
            this.loadMenuItems();
            break;

          case 'menu.updated':
            this.loadMenuItems();
            break;

          case 'menu.deleted':
            this.loadMenuItems();
            break;

        }

      });

  }

  // =========================
  // LOAD MENU ITEMS
  // =========================

  loadMenuItems(): void {

    this.isLoading = true;

    this.menuService
      .getMenuItems()
      .subscribe({

        next: (response) => {

          this.dishes =
            response.menuItems.map(
              item =>
                this.mapApiMenuItem(item)
            );

          this.isLoading = false;
        },

        error: (error) => {

          console.error(
            'Failed to load menu items:',
            error
          );

          this.isLoading = false;

          this.showError(
            'Unable to Load Menu',
            error?.error?.message ||
            'Failed to load the menu catalogue.'
          );
        }

      });
  }

  // =========================
  // API → FRONTEND MAPPING
  // =========================

  private mapApiMenuItem(
    item: ApiMenuItem
  ): MenuDish {

    return {
      id: item.dishId,
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      available: item.available,
      signature: item.signature,
      dietary: item.dietary || [],
      image: item.image || '',
      provenance: item.provenance || '',
      pairing: item.pairing || '',
      allergens: item.allergens || ''
    };
  }

  // =========================
  // EMPTY MENU ITEM
  // =========================

  private createEmptyDish(): MenuDish {

    return {
      id: '',
      name: '',
      description: '',
      category: 'Wood-Fire Mains',
      price: 0,
      available: true,
      signature: false,
      dietary: [],
      image: '',
      provenance: '',
      pairing: '',
      allergens: ''
    };
  }

  // =========================
  // FILTERING
  // =========================

  get filteredDishes(): MenuDish[] {

    const term =
      this.searchTerm
        .trim()
        .toLowerCase();

    return this.dishes.filter(dish => {

      const matchesCategory =
        this.activeCategory === 'All Courses' ||
        dish.category === this.activeCategory;

      const matchesSearch =
        !term ||
        dish.name
          .toLowerCase()
          .includes(term) ||
        dish.description
          .toLowerCase()
          .includes(term) ||
        dish.id
          .toLowerCase()
          .includes(term);

      const matchesDietary =
        this.activeDietary.every(
          tag =>
            dish.dietary.includes(tag)
        );

      const matchesSignature =
        !this.signatureOnly ||
        dish.signature;

      const matchesUnavailable =
        !this.unavailableOnly ||
        !dish.available;

      return (
        matchesCategory &&
        matchesSearch &&
        matchesDietary &&
        matchesSignature &&
        matchesUnavailable
      );
    });
  }

  // =========================
  // COUNTS
  // =========================

  get totalDishCount(): number {

    return this.dishes.length;
  }

  get signatureDishCount(): number {

    return this.dishes.filter(
      dish => dish.signature
    ).length;
  }

  get activeDishCount(): number {

    return this.dishes.filter(
      dish => dish.available
    ).length;
  }

  get unavailableCount(): number {

    return this.dishes.filter(
      dish => !dish.available
    ).length;
  }

  get categoryCount(): number {

    return new Set(
      this.dishes.map(
        dish => dish.category
      )
    ).size;
  }

  // =========================
  // DRAWER TITLE
  // =========================

  get drawerTitle(): string {

    return this.editingDishId
      ? 'Edit Menu Item'
      : 'Add New Menu Item';
  }

  // =========================
  // CATEGORY FILTER
  // =========================

  selectCategory(
    category: string
  ): void {

    this.activeCategory =
      category;
  }

  // =========================
  // DIETARY FILTER
  // =========================

  toggleDietary(
    tag: DietaryTag
  ): void {

    if (
      this.activeDietary.includes(tag)
    ) {

      this.activeDietary =
        this.activeDietary.filter(
          item => item !== tag
        );

    } else {

      this.activeDietary = [
        ...this.activeDietary,
        tag
      ];
    }
  }

  isDietaryActive(
    tag: DietaryTag
  ): boolean {

    return this.activeDietary
      .includes(tag);
  }

  // =========================
  // OPEN ADD DRAWER
  // =========================

  openAddDrawer(): void {

    this.editingDishId = null;

    this.form =
      this.createEmptyDish();

    this.drawerOpenMessageCleanup();

    this.showDishDrawer = true;
  }

  // =========================
  // OPEN EDIT DRAWER
  // =========================

  openEditDrawer(
    dish: MenuDish
  ): void {

    this.editingDishId =
      dish.id;

    this.form = {
      ...dish,
      dietary: [
        ...dish.dietary
      ]
    };

    this.drawerOpenMessageCleanup();

    this.showDishDrawer = true;
  }

  // =========================
  // CLOSE DRAWER
  // =========================

  closeDrawer(): void {

    this.showDishDrawer = false;

    this.editingDishId = null;
  }

  // =========================
  // CLEAR MESSAGE BEFORE
  // OPENING DRAWER
  // =========================

  private drawerOpenMessageCleanup(): void {

    this.clearSuccess();
    this.clearError();
  }

  // =========================
  // FORM DIETARY
  // =========================

  toggleFormDietary(
    tag: DietaryTag,
    checked: boolean
  ): void {

    if (
      checked &&
      !this.form.dietary.includes(tag)
    ) {

      this.form.dietary = [
        ...this.form.dietary,
        tag
      ];

    } else if (!checked) {

      this.form.dietary =
        this.form.dietary.filter(
          item => item !== tag
        );
    }
  }

  // =========================
  // SAVE MENU ITEM
  // =========================

  saveDish(): void {

    const name =
      this.form.name.trim();

    const description =
      this.form.description.trim();

    // =========================
    // FRONTEND VALIDATION
    // =========================

    // =========================
    // FRONTEND VALIDATION
    // =========================

    if (!name) {
      return;
    }

    if (!this.form.category) {
      return;
    }

    if (!this.form.price || this.form.price <= 0) {
      return;
    }

    if (!description) {
      return;
    }

    // =========================
    // CREATE / UPDATE DATA
    // =========================

    const menuData = {
      name,
      description,
      category:
        this.form.category,
      price:
        this.form.price,
      available:
        this.form.available,
      signature:
        this.form.signature,
      dietary:
        this.form.dietary,
      image:
        this.form.image,
      provenance:
        this.form.provenance.trim(),
      pairing:
        this.form.pairing.trim(),
      allergens:
        this.form.allergens.trim()
    };

    // =========================
    // UPDATE MENU ITEM
    // =========================

    if (this.editingDishId) {

      this.menuService
        .updateMenuItem(
          this.editingDishId,
          menuData
        )
        .subscribe({

          next: (response) => {

            const updatedDish =
              this.mapApiMenuItem(
                response.menuItem
              );

            const index =
              this.dishes.findIndex(
                dish =>
                  dish.id ===
                  updatedDish.id
              );

            if (index !== -1) {

              this.dishes[index] =
                updatedDish;
            }

            this.closeDrawer();

            this.showSuccess(
              'Changes Saved',
              `${name} has been updated successfully.`
            );
          },

          error: (error) => {

            console.error(
              'Failed to update menu item:',
              error
            );

            this.showError(
              'Unable to Save Changes',
              error?.error?.message ||
              'Failed to update the menu item.'
            );
          }

        });

      return;
    }

    // =========================
    // CREATE MENU ITEM
    // =========================

    this.menuService
      .createMenuItem(
        menuData
      )
      .subscribe({

        next: (response) => {

          const newDish =
            this.mapApiMenuItem(
              response.menuItem
            );

          this.dishes.unshift(
            newDish
          );

          this.closeDrawer();

          this.showSuccess(
            'Menu Item Added',
            `${name} has been added to the menu successfully.`
          );
        },

        error: (error) => {

          console.error(
            'Failed to create menu item:',
            error
          );

          this.showError(
            'Unable to Add Menu Item',
            error?.error?.message ||
            'Failed to create the menu item.'
          );
        }

      });
  }

  // =========================
  // TOGGLE AVAILABILITY
  // =========================

  toggleAvailability(
    dish: MenuDish
  ): void {

    const newStatus =
      !dish.available;

    this.menuService
      .updateAvailability(
        dish.id,
        newStatus
      )
      .subscribe({

        next: (response) => {

          const updatedDish =
            this.mapApiMenuItem(
              response.menuItem
            );

          this.dishes =
            this.dishes.map(item =>
              item.id ===
                updatedDish.id
                ? updatedDish
                : item
            );

          if (
            updatedDish.available
          ) {

            this.showSuccess(
              'Dish Available',
              `${updatedDish.name} is now available on the menu.`
            );

          } else {

            this.showSuccess(
              'Dish Unavailable',
              `${updatedDish.name} has been marked as unavailable.`
            );
          }
        },

        error: (error) => {

          console.error(
            'Failed to update availability:',
            error
          );

          this.showError(
            'Unable to Update Availability',
            error?.error?.message ||
            'Failed to update menu availability.'
          );
        }

      });
  }

  // =========================
  // OPEN DELETE CONFIRMATION
  // =========================

  openDeleteConfirmation(
    dish: MenuDish
  ): void {

    this.dishToDelete =
      dish;

    this.deleteConfirmOpen =
      true;
  }

  // =========================
  // CANCEL DELETE
  // =========================

  cancelDelete(): void {

    this.deleteConfirmOpen =
      false;

    this.dishToDelete =
      null;
  }

  // =========================
  // CONFIRM DELETE
  // =========================

  confirmDelete(): void {

    if (!this.dishToDelete) {
      return;
    }

    const dish =
      this.dishToDelete;

    this.menuService
      .deleteMenuItem(
        dish.id
      )
      .subscribe({

        next: () => {

          this.dishes =
            this.dishes.filter(
              item =>
                item.id !==
                dish.id
            );

          // Close confirmation
          this.deleteConfirmOpen =
            false;

          this.dishToDelete =
            null;

          // Close drawer if necessary
          if (
            this.editingDishId ===
            dish.id
          ) {
            this.closeDrawer();
          }

          this.showSuccess(
            'Menu Item Deleted',
            `${dish.name} has been removed from the menu successfully.`
          );
        },

        error: (error) => {

          console.error(
            'Failed to delete menu item:',
            error
          );

          // Close confirmation
          this.deleteConfirmOpen =
            false;

          this.dishToDelete =
            null;

          this.showError(
            'Unable to Delete Menu Item',
            error?.error?.message ||
            'Failed to delete the menu item.'
          );
        }

      });
  }

  // =========================
  // CATEGORY COUNT
  // =========================

  categoryDishCount(
    category: string
  ): number {

    if (
      category === 'All Courses'
    ) {

      return this.dishes.length;
    }

    return this.dishes.filter(
      dish =>
        dish.category ===
        category
    ).length;
  }

  // =========================
  // TRACKING
  // =========================

  trackByDishId(
    index: number,
    dish: MenuDish
  ): string {

    return dish.id;
  }

  // =========================
  // IMAGE UPLOAD
  // =========================

  onDishImageSelected(
    event: Event
  ): void {

    const input =
      event.target as
      HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {

      this.showError(
        'Invalid Image',
        'Please select a valid image file.'
      );

      input.value = '';

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {

      this.showError(
        'Image Too Large',
        'Please choose an image smaller than 5 MB.'
      );

      input.value = '';

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {

      if (
        typeof reader.result ===
        'string'
      ) {

        this.form.image =
          reader.result;
      }
    };

    reader.readAsDataURL(
      file
    );

    input.value = '';
  }

  // =========================
  // REMOVE IMAGE
  // =========================

  removeDishImage(): void {

    this.form.image = '';
  }

  // =========================
  // SUCCESS MESSAGE
  // =========================

  showSuccess(
    title: string,
    message: string
  ): void {

    // Remove existing error
    this.clearError();

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

        this.successTimeout =
          undefined;

      }, 1400);
  }

  // =========================
  // ERROR MESSAGE
  // =========================

  showError(
    title: string,
    message: string
  ): void {

    // Remove existing success message
    this.clearSuccess();

    // Cancel previous error timer
    if (this.errorTimeout) {

      clearTimeout(
        this.errorTimeout
      );

      this.errorTimeout =
        undefined;
    }

    this.errorTitle =
      title;

    this.errorMessage =
      message;
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

  // =========================
  // CLEAR ERROR
  // =========================

  clearError(): void {

    if (this.errorTimeout) {

      clearTimeout(
        this.errorTimeout
      );

      this.errorTimeout =
        undefined;
    }

    this.errorMessage =
      '';

    this.errorTitle =
      '';
  }

  getDietaryFullName(tag: string): string {
    const dietaryNames: Record<string, string> = {
      V: 'Vegetarian',
      VG: 'Vegan',
      GF: 'Gluten-Free',
      DF: 'Dairy-Free',
      NF: 'Nut-Free',
      SF: 'Seafood-Free'
    };

    return dietaryNames[tag] || tag;
  }
}
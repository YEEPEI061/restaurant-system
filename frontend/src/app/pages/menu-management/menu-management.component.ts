
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

interface MenuDish {
  id: string;
  name: string;
  description: string;
  category: string;
  station: string;
  price: number;
  cost: number;
  stock: number;
  parCap: number;
  available: boolean;
  signature: boolean;
  dietary: string[];
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
export class MenuManagementComponent {
  categories = [
    'All Courses',
    'Prelude & Starters',
    'Wood-Fire Mains',
    'Mid-Course Savory',
    'Desserts & Confections',
    'Beverages'
  ];

  stations = [
    'Grill & Robata',
    'Larder / Garde Manger',
    'Pastry Line',
    'Beverage Station'
  ];

  dietaryOptions = ['GF', 'DF', 'SF', 'NF', 'Veg'];

  readonly Math = Math;

  activeCategory = 'All Courses';
  searchTerm = '';
  selectedStation = 'All Stations';
  activeDietary: string[] = [];
  signatureOnly = false;
  unavailableOnly = false;

  showDishDrawer = false;
  editingDishId: string | null = null;
  toastMessage = '';

  dishes: MenuDish[] = [
    {
      id: 'M-043',
      name: 'Ember-Smoked Duck Breast',
      description: 'Danish duck breast, charred maitake mushrooms, lingonberry reduction and sansho oil.',
      category: 'Wood-Fire Mains',
      station: 'Grill & Robata',
      price: 145,
      cost: 38,
      stock: 16,
      parCap: 20,
      available: true,
      signature: true,
      dietary: ['GF', 'DF'],
      image: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=180&q=80',
      provenance: 'Danish heritage farm, Kyoto wild sansho',
      pairing: 'Seasonal fruit soda',
      allergens: '',
    },
    {
      id: 'M-018',
      name: 'Cured Nordic Mackerel',
      description: 'Cured mackerel, pickled cucumber, fermented kohlrabi and dill infusion.',
      category: 'Prelude & Starters',
      station: 'Larder / Garde Manger',
      price: 64,
      cost: 14.5,
      stock: 28,
      parCap: 30,
      available: true,
      signature: false,
      dietary: ['GF', 'DF'],
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=180&q=80',
      provenance: 'Responsibly sourced seafood',
      pairing: 'Citrus herb cooler',
      allergens: '',
    },
    {
      id: 'M-022',
      name: 'Kagoshima A5 Striploin',
      description: 'Binchotan grilled beef, black garlic glaze and pickled sea fennel.',
      category: 'Wood-Fire Mains',
      station: 'Grill & Robata',
      price: 260,
      cost: 88,
      stock: 12,
      parCap: 15,
      available: true,
      signature: true,
      dietary: ['GF'],
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=180&q=80',
      provenance: 'Kagoshima, Japan',
      pairing: 'Roasted barley tea',
      allergens: '',
    },
    {
      id: 'M-039',
      name: 'Wild Forest Chanterelle Tart',
      description: 'Mushroom tart, seasonal herbs and a delicate birch syrup glaze.',
      category: 'Desserts & Confections',
      station: 'Pastry Line',
      price: 48,
      cost: 11.2,
      stock: 0,
      parCap: 24,
      available: false,
      signature: false,
      dietary: ['Veg'],
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=180&q=80',
      provenance: 'Seasonal local produce',
      pairing: 'Apple and elderflower infusion',
      allergens: '',
    },
    {
      id: 'M-009',
      name: 'Hokkaido Scallop Crudo',
      description: 'Scallop crudo, citrus dressing, kelp oil and fresh herbs.',
      category: 'Prelude & Starters',
      station: 'Larder / Garde Manger',
      price: 82,
      cost: 22,
      stock: 18,
      parCap: 25,
      available: true,
      signature: false,
      dietary: ['GF', 'DF'],
      image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=180&q=80',
      provenance: 'Hokkaido, Japan',
      pairing: 'Yuzu sparkling water',
      allergens: '',
    },
    {
      id: 'M-051',
      name: 'Vanilla Bean Panna Cotta',
      description: 'Vanilla bean cream, seasonal berries and crisp almond crumble.',
      category: 'Desserts & Confections',
      station: 'Pastry Line',
      price: 32,
      cost: 8,
      stock: 14,
      parCap: 20,
      available: true,
      signature: false,
      dietary: [],
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=180&q=80',
      provenance: 'Madagascar vanilla',
      pairing: 'Freshly brewed coffee',
      allergens: '',
    }
  ];

  form: MenuDish = this.createEmptyDish();

  get filteredDishes(): MenuDish[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.dishes.filter(dish => {
      const matchesCategory =
        this.activeCategory === 'All Courses' ||
        dish.category === this.activeCategory;

      const matchesSearch =
        !term ||
        dish.name.toLowerCase().includes(term) ||
        dish.description.toLowerCase().includes(term) ||
        dish.id.toLowerCase().includes(term) ||
        dish.station.toLowerCase().includes(term);

      const matchesStation =
        this.selectedStation === 'All Stations' ||
        dish.station === this.selectedStation;

      const matchesDietary =
        this.activeDietary.every(tag => dish.dietary.includes(tag));

      const matchesSignature =
        !this.signatureOnly || dish.signature;

      const matchesUnavailable =
        !this.unavailableOnly || !dish.available;

      return matchesCategory &&
        matchesSearch &&
        matchesStation &&
        matchesDietary &&
        matchesSignature &&
        matchesUnavailable;
    });
  }

  get activeDishCount(): number {
    return this.dishes.filter(dish => dish.available).length;
  }

  get unavailableCount(): number {
    return this.dishes.filter(dish => !dish.available).length;
  }

  get averageMargin(): number {
    const active = this.dishes.filter(dish => dish.available && dish.price > 0);

    if (!active.length) {
      return 0;
    }

    const totalMargin = active.reduce(
      (sum, dish) => sum + ((dish.price - dish.cost) / dish.price) * 100,
      0
    );

    return totalMargin / active.length;
  }

  get categoryCount(): number {
    return new Set(this.dishes.map(dish => dish.category)).size;
  }

  get drawerTitle(): string {
    return this.editingDishId ? 'Edit Menu Item' : 'Add New Menu Item';
  }

  get foodCostMargin(): number {
    if (this.form.price <= 0) {
      return 0;
    }

    return ((this.form.price - this.form.cost) / this.form.price) * 100;
  }

  selectCategory(category: string): void {
    this.activeCategory = category;
  }

  toggleDietary(tag: string): void {
    if (this.activeDietary.includes(tag)) {
      this.activeDietary = this.activeDietary.filter(item => item !== tag);
    } else {
      this.activeDietary = [...this.activeDietary, tag];
    }
  }

  isDietaryActive(tag: string): boolean {
    return this.activeDietary.includes(tag);
  }

  openAddDrawer(): void {
    this.editingDishId = null;
    this.form = this.createEmptyDish();
    this.showDishDrawer = true;
  }

  openEditDrawer(dish: MenuDish): void {
    this.editingDishId = dish.id;
    this.form = {
      ...dish,
      dietary: [...dish.dietary]
    };
    this.showDishDrawer = true;
  }

  closeDrawer(): void {
    this.showDishDrawer = false;
    this.editingDishId = null;
  }

  toggleFormDietary(tag: string, checked: boolean): void {
    if (checked && !this.form.dietary.includes(tag)) {
      this.form.dietary = [...this.form.dietary, tag];
    } else if (!checked) {
      this.form.dietary = this.form.dietary.filter(item => item !== tag);
    }
  }

  saveDish(): void {
    const name = this.form.name.trim();

    if (!name) {
      this.showToast('Please enter a dish name.');
      return;
    }

    if (this.form.price < 0 || this.form.cost < 0 || this.form.stock < 0 || this.form.parCap < 0) {
      this.showToast('Price, cost and stock values cannot be negative.');
      return;
    }

    if (this.form.price <= 0) {
      this.showToast('Please enter a price greater than RM 0.');
      return;
    }

    if (this.editingDishId) {
      this.dishes = this.dishes.map(dish =>
        dish.id === this.editingDishId
          ? { ...this.form, name }
          : dish
      );
      this.showToast(`${name} updated successfully.`);
    } else {
      const newDish: MenuDish = {
        ...this.form,
        id: `M-${String(Date.now()).slice(-5)}`,
        name
      };

      this.dishes = [newDish, ...this.dishes];
      this.showToast(`${name} added to the menu.`);
    }

    this.closeDrawer();
  }

  toggleAvailability(dish: MenuDish): void {
    dish.available = !dish.available;

    if (!dish.available) {
      this.showToast(`${dish.name} marked as unavailable.`);
    } else {
      this.showToast(`${dish.name} is now available.`);
    }
  }

  deleteDish(dish: MenuDish): void {
    const confirmed = window.confirm(
      `Remove "${dish.name}" from this demo menu?`
    );

    if (!confirmed) {
      return;
    }

    this.dishes = this.dishes.filter(item => item.id !== dish.id);
    this.showToast(`${dish.name} removed from the menu.`);
  }

  exportCsv(): void {
    const headers = [
      'ID',
      'Name',
      'Category',
      'Station',
      'Price (RM)',
      'Cost (RM)',
      'Available',
      'Stock',
      'Par Cap'
    ];

    const rows = this.filteredDishes.map(dish => [
      dish.id,
      dish.name,
      dish.category,
      dish.station,
      dish.price.toFixed(2),
      dish.cost.toFixed(2),
      dish.available ? 'Yes' : 'No',
      dish.stock,
      dish.parCap
    ]);

    const escapeCsv = (value: string | number): string =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCsv).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'aurelia-menu.csv';
    link.click();

    URL.revokeObjectURL(url);
    this.showToast('Menu CSV exported.');
  }

  showToast(message: string): void {
    this.toastMessage = message;
  }

  dismissToast(): void {
    this.toastMessage = '';
  }

  trackByDishId(index: number, dish: MenuDish): string {
    return dish.id;
  }

  private createEmptyDish(): MenuDish {
    return {
      id: '',
      name: '',
      description: '',
      category: 'Wood-Fire Mains',
      station: 'Grill & Robata',
      price: 0,
      cost: 0,
      stock: 0,
      parCap: 20,
      available: true,
      signature: false,
      dietary: [],
      image: '',
      provenance: '',
      pairing: '',
      allergens: '',
    };
  }

  categoryDishCount(category: string): number {
    if (category === 'All Courses') {
      return this.dishes.length;
    }
  
    return this.dishes.filter(dish => dish.category === category).length;
  }

  onDishImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
  
    if (!file) return;
  
    if (!file.type.startsWith('image/')) {
      this.toastMessage = 'Please select a valid image file.';
      input.value = '';
      return;
    }
  
    // Keep the demo upload at a reasonable size.
    if (file.size > 5 * 1024 * 1024) {
      this.toastMessage = 'Please choose an image smaller than 5 MB.';
      input.value = '';
      return;
    }
  
    const reader = new FileReader();
  
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.form.image = reader.result;
      }
    };
  
    reader.readAsDataURL(file);
    input.value = '';
  }
  
  removeDishImage(): void {
    this.form.image = '';
  }
}

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { MenuManagementComponent } from './menu-management.component';

import { MenuService } from '../../services/menu.service';
import { WebSocketService } from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';
import { provideHttpClient } from '@angular/common/http';

describe('MenuManagementComponent', () => {

    let menuService: jasmine.SpyObj<MenuService>;
    let webSocketService: jasmine.SpyObj<WebSocketService>;
    let authService: jasmine.SpyObj<AuthService>;

    const mockMenuItems: any[] = [
        {
            dishId: 'D-001',
            name: 'French Onion Soup',
            description: 'Classic French onion soup',
            category: 'Prelude & Starters',
            price: 28,
            available: true,
            signature: true,
            dietary: ['GF'],
            image: '',
            provenance: '',
            pairing: '',
            allergens: ''
        },
        {
            dishId: 'D-002',
            name: 'Grilled Salmon',
            description: 'Fresh salmon with herbs',
            category: 'Wood-Fire Mains',
            price: 68,
            available: true,
            signature: false,
            dietary: ['GF', 'DF'],
            image: '',
            provenance: '',
            pairing: '',
            allergens: ''
        },
        {
            dishId: 'D-003',
            name: 'Chocolate Tart',
            description: 'Dark chocolate dessert',
            category: 'Desserts & Confections',
            price: 35,
            available: false,
            signature: false,
            dietary: ['Veg'],
            image: '',
            provenance: '',
            pairing: '',
            allergens: ''
        }
    ];

    beforeEach(async () => {

        menuService = jasmine.createSpyObj(
            'MenuService',
            [
                'getMenuItems',
                'createMenuItem',
                'updateMenuItem',
                'updateAvailability',
                'deleteMenuItem'
            ]
        );

        webSocketService = jasmine.createSpyObj(
            'WebSocketService',
            ['connect'],
            { messages$: of() }
        );

        authService = jasmine.createSpyObj(
            'AuthService',
            [
                'getUser',
                'isLoggedIn'
            ]
        );

        authService.getUser.and.returnValue(null);
        authService.isLoggedIn.and.returnValue(false);

        menuService.getMenuItems.and.returnValue(
            of({ menuItems: mockMenuItems } as any)
        );

        menuService.deleteMenuItem.and.returnValue(
            of({ message: 'Menu item deleted successfully' } as any)
        );

        await TestBed.configureTestingModule({
            imports: [MenuManagementComponent],
            providers: [
                { provide: MenuService, useValue: menuService },
                { provide: WebSocketService, useValue: webSocketService },
                { provide: AuthService, useValue: authService },
                provideHttpClient(),
                provideRouter([])
            ]
        }).compileComponents();

    });

    it('should load menu items on initialisation', () => {

        const fixture = TestBed.createComponent(MenuManagementComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance;

        expect(menuService.getMenuItems).toHaveBeenCalled();
        expect(webSocketService.connect).toHaveBeenCalled();

        expect(component.dishes.length).toBe(3);
        expect(component.dishes[0].name).toBe('French Onion Soup');
        expect(component.isLoading).toBeFalse();

    });

    it('should filter menu items by category, search and dietary preferences', () => {

        const fixture = TestBed.createComponent(MenuManagementComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance;

        component.selectCategory('Wood-Fire Mains');
        component.toggleDietary('GF');
        component.searchTerm = 'salmon';

        expect(component.filteredDishes.length).toBe(1);
        expect(component.filteredDishes[0].name).toBe('Grilled Salmon');

    });

    it('should calculate menu statistics and sort dishes by price', () => {

        const fixture = TestBed.createComponent(MenuManagementComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance;

        expect(component.totalDishCount).toBe(3);
        expect(component.activeDishCount).toBe(2);
        expect(component.unavailableCount).toBe(1);
        expect(component.signatureDishCount).toBe(1);
        expect(component.categoryCount).toBe(3);

        component.sortOption = 'price-high';

        expect(component.filteredDishes[0].name).toBe('Grilled Salmon');

    });

    it('should delete a menu item after confirmation', () => {

        const fixture = TestBed.createComponent(MenuManagementComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance;
        const dish = component.dishes[0];

        component.openDeleteConfirmation(dish);
        expect(component.deleteConfirmOpen).toBeTrue();

        component.confirmDelete();

        expect(menuService.deleteMenuItem).toHaveBeenCalledWith('D-001');
        expect(component.dishes.length).toBe(2);
        expect(component.dishes.some(item => item.id === 'D-001')).toBeFalse();
        expect(component.deleteConfirmOpen).toBeFalse();
        expect(component.successTitle).toBe('Menu Item Deleted');

    });

});

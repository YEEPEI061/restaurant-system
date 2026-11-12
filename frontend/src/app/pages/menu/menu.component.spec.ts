import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { MenuComponent } from './menu.component';

import { MenuService } from '../../services/menu.service';
import { TastingService } from '../../services/tasting.service';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';

describe('MenuComponent', () => {

    let menuService: jasmine.SpyObj<MenuService>;
    let tastingService: jasmine.SpyObj<TastingService>;
    let authService: jasmine.SpyObj<AuthService>;
    let webSocketService: jasmine.SpyObj<WebSocketService>;

    const tastingItemsSubject = new Subject<any[]>();

    const mockMenuItems: any[] = [
        {
            _id: '1',
            dishId: 'D001',
            name: 'French Onion Soup',
            price: 35,
            category: 'Prelude & Starters',
            dietary: ['Veg'],
            description: 'Classic French onion soup',
            provenance: 'France',
            pairing: 'Herbal tea',
            image: 'soup.jpg',
            available: true,
            signature: true,
            allergens: 'Dairy'
        },
        {
            _id: '2',
            dishId: 'D002',
            name: 'Grilled Salmon',
            price: 65,
            category: 'Wood-Fire Mains',
            dietary: ['GF', 'DF'],
            description: 'Wood-fired fresh salmon',
            provenance: 'Hokkaido',
            pairing: 'Botanical infusion',
            image: 'salmon.jpg',
            available: true,
            signature: false,
            allergens: 'Fish'
        },
        {
            _id: '3',
            dishId: 'D003',
            name: 'Chocolate Tart',
            price: 28,
            category: 'Desserts & Confections',
            dietary: [],
            description: 'Dark chocolate tart',
            provenance: 'Belgium',
            pairing: 'Specialty tea',
            image: 'tart.jpg',
            available: false,
            signature: false,
            allergens: 'Dairy, Gluten'
        }
    ];

    beforeEach(async () => {

        menuService = jasmine.createSpyObj(
            'MenuService',
            ['getMenuItems']
        );

        tastingService = jasmine.createSpyObj(
            'TastingService',
            ['addItem', 'removeItem', 'getItems'],
            { tastingItems$: tastingItemsSubject.asObservable() }
        );

        authService = jasmine.createSpyObj(
            'AuthService',
            ['isLoggedIn', 'getUser']
        );

        authService.isLoggedIn.and.returnValue(false);
        authService.getUser.and.returnValue(null);

        webSocketService = jasmine.createSpyObj(
            'WebSocketService',
            ['connect'],
            { messages$: new Subject<any>() }
        );

        menuService.getMenuItems.and.returnValue(
            of({ menuItems: mockMenuItems } as any)
        );

        tastingService.getItems.and.returnValue([]);

        await TestBed.configureTestingModule({
            imports: [MenuComponent],
            providers: [
                { provide: MenuService, useValue: menuService },
                { provide: TastingService, useValue: tastingService },
                { provide: AuthService, useValue: authService },
                { provide: WebSocketService, useValue: webSocketService },
                provideHttpClient(),
                provideRouter([])
            ]
        }).compileComponents();

    });

    it('should create the menu component', () => {

        const fixture = TestBed.createComponent(MenuComponent);

        expect(fixture.componentInstance).toBeTruthy();

    });

    it('should load available menu items on initialisation', () => {

        const fixture = TestBed.createComponent(MenuComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance;

        expect(menuService.getMenuItems).toHaveBeenCalled();
        expect(webSocketService.connect).toHaveBeenCalled();

        expect(component.menuItems.length).toBe(2);
        expect(component.menuItems[0].name).toBe('French Onion Soup');
        expect(component.isLoading).toBeFalse();

    });

    it('should filter menu items by category and dietary preferences', () => {

        const fixture = TestBed.createComponent(MenuComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance;

        component.selectCategory('Wood-Fire Mains');

        expect(component.filteredItems.length).toBe(1);
        expect(component.filteredItems[0].name).toBe('Grilled Salmon');

        component.toggleDietaryFilter('GF');

        expect(component.filteredItems.length).toBe(1);
        expect(component.isFilterActive('GF')).toBeTrue();

        component.clearDietaryFilters();

        expect(component.activeFilters.size).toBe(0);

    });

    it('should add a dish to the tasting list and open the drawer', () => {

        const fixture = TestBed.createComponent(MenuComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance;
        const dish = component.menuItems[0];

        component.addToTasting(dish);

        expect(tastingService.addItem).toHaveBeenCalledWith({
            name: 'French Onion Soup',
            price: 35,
            id: 'D001'
        });

        expect(component.isTastingDrawerOpen).toBeTrue();

    });

    it('should remove a dish after confirming deletion', () => {

        const fixture = TestBed.createComponent(MenuComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance;

        component.tastingItemToDelete = {
            id: 'D001',
            name: 'French Onion Soup',
            price: 35
        };

        component.tastingDeleteConfirmOpen = true;

        tastingService.getItems.and.returnValue([]);

        component.confirmTastingDelete();

        expect(tastingService.removeItem).toHaveBeenCalledWith('D001');
        expect(component.tastingDeleteConfirmOpen).toBeFalse();
        expect(component.tastingItemToDelete).toBeNull();
        expect(component.successTitle).toBe('Dish Removed');

    });

});

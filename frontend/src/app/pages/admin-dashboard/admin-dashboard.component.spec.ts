
import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';

import { AdminDashboardComponent } from './admin-dashboard.component';

import { ReservationService, Reservation } from '../../services/reservation.service';
import { MenuService, MenuItem } from '../../services/menu.service';
import { WebSocketService } from '../../services/websocket.service';

import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('AdminDashboardComponent', () => {

    let reservationService: jasmine.SpyObj<ReservationService>;
    let menuService: jasmine.SpyObj<MenuService>;
    let webSocketService: jasmine.SpyObj<WebSocketService>;

    const today = new Date();

    const todayDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');

    const mockReservations: Reservation[] = [
        {
            _id: 'mongo-001',
            reservationId: 'R-001',
            guest: 'guest-001',
            guestName: 'John Smith',
            email: 'john@example.com',
            phone: '+60123456789',
            date: todayDate,
            time: '18:00',
            partySize: 2,
            seating: 'Main Dining Room',
            servicePeriod: 'dinner',
            diningOption: 'tasting',
            tastingMenu: 'Classic Tasting Menu',
            selectedDishes: [],
            beveragePairing: false,
            packageName: 'Classic',
            table: 'T01',
            specialRequests: '',
            status: 'Confirmed'
        },
        {
            _id: 'mongo-002',
            reservationId: 'R-002',
            guest: 'guest-002',
            guestName: 'Sarah Lee',
            email: 'sarah@example.com',
            phone: '+60123456788',
            date: todayDate,
            time: '19:00',
            partySize: 4,
            seating: 'Garden Solarium',
            servicePeriod: 'dinner',
            diningOption: 'alacarte',
            tastingMenu: '',
            selectedDishes: [],
            beveragePairing: false,
            packageName: '',
            table: '',
            specialRequests: 'Vegetarian preference',
            status: 'Pending'
        },
        {
            _id: 'mongo-003',
            reservationId: 'R-003',
            guest: 'guest-003',
            guestName: 'Michael Tan',
            email: 'michael@example.com',
            phone: '+60123456787',
            date: todayDate,
            time: '20:00',
            partySize: 3,
            seating: 'Chef’s Counter',
            servicePeriod: 'dinner',
            diningOption: 'table',
            tastingMenu: '',
            selectedDishes: [],
            beveragePairing: false,
            packageName: '',
            table: 'T03',
            specialRequests: '',
            status: 'Seated'
        },
        {
            _id: 'mongo-004',
            reservationId: 'R-004',
            guest: 'guest-004',
            guestName: 'Emily Wong',
            email: 'emily@example.com',
            phone: '+60123456786',
            date: '2026-11-10',
            time: '17:00',
            partySize: 2,
            seating: 'Main Dining Room',
            servicePeriod: 'dinner',
            diningOption: 'tasting',
            tastingMenu: 'Classic Tasting Menu',
            selectedDishes: [],
            beveragePairing: false,
            packageName: 'Classic',
            table: 'T04',
            specialRequests: '',
            status: 'Confirmed'
        }
    ];

    const mockMenuItems: MenuItem[] = [
        {
            _id: 'menu-001',
            dishId: 'M-001',
            name: 'French Onion Soup',
            description: 'Traditional French onion soup',
            category: 'Prelude & Starters',
            price: 28,
            available: true,
            signature: false,
            dietary: ['Veg'],
            image: 'french-onion-soup.jpg',
            provenance: 'France',
            pairing: 'White wine',
            allergens: 'Dairy'
        },
        {
            _id: 'menu-002',
            dishId: 'M-002',
            name: 'Grilled Salmon',
            description: 'Fresh grilled salmon',
            category: 'Wood-Fire Mains',
            price: 68,
            available: true,
            signature: true,
            dietary: ['GF'],
            image: 'grilled-salmon.jpg',
            provenance: 'Norway',
            pairing: 'Chardonnay',
            allergens: 'Fish'
        },
        {
            _id: 'menu-003',
            dishId: 'M-003',
            name: 'Chocolate Tart',
            description: 'Rich chocolate dessert',
            category: 'Desserts & Confections',
            price: 32,
            available: false,
            signature: false,
            dietary: [],
            image: 'chocolate-tart.jpg',
            provenance: 'Belgium',
            pairing: 'Coffee',
            allergens: 'Dairy, Gluten'
        }
    ];

    beforeEach(async () => {

        reservationService = jasmine.createSpyObj(
            'ReservationService',
            ['getReservations']
        );

        menuService = jasmine.createSpyObj(
            'MenuService',
            ['getMenuItems']
        );

        webSocketService = jasmine.createSpyObj(
            'WebSocketService',
            ['connect'],
            { messages$: new Subject<unknown>() }
        );

        reservationService.getReservations.and.returnValue(
            of({
                reservations: mockReservations,
                count: mockReservations.length
            })
        );

        menuService.getMenuItems.and.returnValue(
            of({
                menuItems: mockMenuItems,
                count: mockMenuItems.length
            })
        );

        await TestBed.configureTestingModule({
            imports: [AdminDashboardComponent],
            providers: [
                { provide: ReservationService, useValue: reservationService },
                { provide: MenuService, useValue: menuService },
                { provide: WebSocketService, useValue: webSocketService },
                provideHttpClient(),
                provideRouter([])
            ]
        }).compileComponents();

    });

    it('should create the dashboard component', () => {

        const fixture = TestBed.createComponent(AdminDashboardComponent);

        expect(fixture.componentInstance).toBeTruthy();

    });

    it('should load reservations and menu items on initialisation', () => {

        const fixture = TestBed.createComponent(AdminDashboardComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance;

        expect(reservationService.getReservations).toHaveBeenCalled();
        expect(menuService.getMenuItems).toHaveBeenCalled();
        expect(webSocketService.connect).toHaveBeenCalled();

        expect(component.reservations.length).toBe(4);
        expect(component.menuItems.length).toBe(3);
        expect(component.isLoading).toBeFalse();

    });

    it('should calculate today’s reservation summary correctly', () => {

        const fixture = TestBed.createComponent(AdminDashboardComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance;

        expect(component.totalBookings).toBe(3);
        expect(component.totalCovers).toBe(9);
        expect(component.confirmedBookings).toBe(2);
        expect(component.pendingBookings).toBe(1);

        expect(component.menuItemCount).toBe(3);
        expect(component.availableMenuItemCount).toBe(2);

    });

    it('should filter upcoming arrivals and reservations requiring attention', () => {

        const fixture = TestBed.createComponent(AdminDashboardComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance;

        expect(component.upcomingArrivals.length).toBe(2);
        expect(component.upcomingArrivals[0].reservationId).toBe('R-001');

        expect(component.pendingAttention.length).toBe(1);
        expect(component.specialRequestReservations.length).toBe(1);
        expect(component.unassignedReservations.length).toBe(1);

    });

    it('should calculate table assignments and dining options correctly', () => {

        const fixture = TestBed.createComponent(AdminDashboardComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance;

        expect(component.occupiedTables).toBe(1);
        expect(component.reservedTables).toBe(1);
        expect(component.pendingTables).toBe(0);

        expect(component.tastingBookings).toBe(1);
        expect(component.aLaCarteBookings).toBe(1);
        expect(component.tableOnlyBookings).toBe(1);

    });

    it('should display an error when reservations fail to load', () => {

        reservationService.getReservations.and.returnValue(
            throwError(() => ({
                error: { message: 'Unable to retrieve reservations' }
            }))
        );

        const fixture = TestBed.createComponent(AdminDashboardComponent);
        fixture.detectChanges();

        const component = fixture.componentInstance;

        expect(component.isLoading).toBeFalse();
        expect(component.loadError).toBe(
            'Unable to retrieve reservations'
        );

    });

});

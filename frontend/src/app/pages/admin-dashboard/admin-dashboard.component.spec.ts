import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';

import { AdminDashboardComponent } from './admin-dashboard.component';

import { ReservationService } from '../../services/reservation.service';
import { MenuService } from '../../services/menu.service';
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

    const mockReservations: any[] = [
        {
            reservationId: 'R-001',
            guestName: 'John Smith',
            date: todayDate,
            time: '18:00',
            partySize: 2,
            status: 'Confirmed',
            table: 'T01',
            diningOption: 'tasting',
            specialRequests: ''
        },
        {
            reservationId: 'R-002',
            guestName: 'Sarah Lee',
            date: todayDate,
            time: '19:00',
            partySize: 4,
            status: 'Pending',
            table: '',
            diningOption: 'alacarte',
            specialRequests: 'Vegetarian preference'
        },
        {
            reservationId: 'R-003',
            guestName: 'Michael Tan',
            date: todayDate,
            time: '20:00',
            partySize: 3,
            status: 'Seated',
            table: 'T03',
            diningOption: 'table',
            specialRequests: ''
        },
        {
            reservationId: 'R-004',
            guestName: 'Emily Wong',
            date: '2026-11-10',
            time: '17:00',
            partySize: 2,
            status: 'Confirmed',
            table: 'T04',
            diningOption: 'tasting',
            specialRequests: ''
        }
    ];

    const mockMenuItems = [
        { name: 'French Onion Soup', available: true },
        { name: 'Grilled Salmon', available: true },
        { name: 'Chocolate Tart', available: false }
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
            { messages$: new Subject<any>() }
        );

        reservationService.getReservations.and.returnValue(
            of({ reservations: mockReservations } as any)
        );

        menuService.getMenuItems.and.returnValue(
            of({ menuItems: mockMenuItems } as any)
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

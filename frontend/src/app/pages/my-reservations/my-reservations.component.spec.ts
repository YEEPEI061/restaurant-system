
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { MyReservationsComponent } from './my-reservations.component';
import {
    ReservationService,
    Reservation,
    ReservationsResponse
} from '../../services/reservation.service';
import { WebSocketService } from '../../services/websocket.service';

describe('MyReservationsComponent', () => {

    let reservationService: jasmine.SpyObj<ReservationService>;
    let webSocketService: jasmine.SpyObj<WebSocketService>;

    const mockReservations: Reservation[] = [
        {
            _id: '1',
            reservationId: 'R-001',
            guest: 'guest-001',
            guestName: 'Test Guest',
            email: 'guest@example.com',
            phone: '0123456789',
            date: '2026-12-20',
            time: '19:00',
            partySize: 2,
            servicePeriod: 'dinner',
            seating: 'Main Dining Room',
            diningOption: 'table',
            tastingMenu: '',
            packageName: '',
            table: null,
            specialRequests: '',
            status: 'Confirmed',
            selectedDishes: [],
            beveragePairing: false
        },
        {
            _id: '2',
            reservationId: 'R-002',
            guest: 'guest-002',
            guestName: 'Test Guest',
            email: 'guest@example.com',
            phone: '0123456789',
            date: '2026-10-10',
            time: '18:00',
            partySize: 4,
            servicePeriod: 'dinner',
            seating: 'Garden Solarium',
            diningOption: 'tasting',
            tastingMenu: 'Seven-Course Tasting Menu',
            packageName: '',
            table: null,
            specialRequests: '',
            status: 'Completed',
            selectedDishes: [],
            beveragePairing: false
        },
        {
            _id: '3',
            reservationId: 'R-003',
            guest: 'guest-003',
            guestName: 'Test Guest',
            email: 'guest@example.com',
            phone: '0123456789',
            date: '2026-11-15',
            time: '19:30',
            partySize: 2,
            servicePeriod: 'dinner',
            seating: 'Chef’s Counter',
            diningOption: 'alacarte',
            tastingMenu: '',
            packageName: '',
            table: null,
            specialRequests: '',
            status: 'Cancelled',
            selectedDishes: [],
            beveragePairing: false
        }
    ];

    beforeEach(async () => {

        reservationService = jasmine.createSpyObj(
            'ReservationService',
            [
                'getMyReservations',
                'updateReservationStatus'
            ]
        );

        webSocketService = jasmine.createSpyObj(
            'WebSocketService',
            [
                'connect'
            ],
            [
                'messages$'
            ]
        );

        Object.defineProperty(webSocketService, 'messages$', {
            value: of(),
            writable: true
        });

        const mockReservationsResponse: ReservationsResponse = {
            reservations: mockReservations,
            count: mockReservations.length
        };

        reservationService.getMyReservations.and.returnValue(
            of(mockReservationsResponse)
        );

        reservationService.updateReservationStatus.and.returnValue(
            of({
                message: 'Reservation cancelled successfully',
                reservation: {
                    ...mockReservations[0],
                    status: 'Cancelled' as const
                }
            })
        );

        await TestBed.configureTestingModule({
            imports: [MyReservationsComponent],
            providers: [
                {
                    provide: ReservationService,
                    useValue: reservationService
                },
                {
                    provide: WebSocketService,
                    useValue: webSocketService
                },
                provideHttpClient(),
                provideRouter([])
            ]
        }).compileComponents();

    });

    function createComponent() {
        localStorage.setItem('aurelia_token', 'test-token');

        const fixture = TestBed.createComponent(
            MyReservationsComponent
        );

        fixture.detectChanges();

        return fixture;
    }

    afterEach(() => {
        localStorage.removeItem('aurelia_token');
    });

    it('should create the component', () => {

        const fixture = createComponent();

        expect(fixture.componentInstance).toBeTruthy();

    });

    it('should load reservations and connect to WebSocket on initialisation', () => {

        const fixture = createComponent();
        const component = fixture.componentInstance;

        expect(reservationService.getMyReservations).toHaveBeenCalled();
        expect(webSocketService.connect).toHaveBeenCalled();
        expect(component.reservations.length).toBe(3);
        expect(component.isLoading).toBeFalse();

    });

    it('should group reservations correctly by status', () => {

        const fixture = createComponent();
        const component = fixture.componentInstance;

        expect(component.upcomingCount).toBe(1);
        expect(component.pastCount).toBe(1);
        expect(component.cancelledCount).toBe(1);

        expect(component.upcomingReservations[0].reservationId)
            .toBe('R-001');

        expect(component.pastReservations[0].reservationId)
            .toBe('R-002');

        expect(component.cancelledReservations[0].reservationId)
            .toBe('R-003');

    });

    it('should filter and sort reservations correctly', () => {

        const fixture = createComponent();
        const component = fixture.componentInstance;

        component.searchTerm = 'R-001';

        expect(component.filteredReservations.length).toBe(1);
        expect(component.filteredReservations[0].reservationId)
            .toBe('R-001');

        component.searchTerm = '';
        component.sortNewestFirst = true;

        expect(component.filteredReservations[0].reservationId)
            .toBe('R-001');

        component.sortNewestFirst = false;

        expect(component.filteredReservations[0].reservationId)
            .toBe('R-001');

    });

    it('should cancel a reservation successfully', fakeAsync(() => {

        const fixture = createComponent();
        const component = fixture.componentInstance;

        const reservation = component.reservations[0];

        component.openCancelModal(reservation);
        component.confirmCancellation();

        expect(reservationService.updateReservationStatus)
            .toHaveBeenCalledWith('R-001', 'Cancelled');

        expect(component.isCancelling).toBeFalse();
        expect(component.showCancelModal).toBeFalse();
        expect(component.successTitle).toBe('Reservation Cancelled');

        tick(1400);

        expect(component.activeTab).toBe('cancelled');
        expect(reservationService.getMyReservations).toHaveBeenCalledTimes(2);

    }));

});

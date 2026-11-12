import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { ReservationManagementComponent } from './reservation-management.component';
import { ReservationService } from '../../services/reservation.service';
import { WebSocketService } from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';

describe('ReservationManagementComponent', () => {
    let component: ReservationManagementComponent;
    let fixture: ComponentFixture<ReservationManagementComponent>;

    let reservationService: jasmine.SpyObj<ReservationService>;
    let webSocketService: jasmine.SpyObj<WebSocketService>;
    let authService: jasmine.SpyObj<AuthService>;

    const now = new Date();

    const today =
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const mockReservations: any[] = [
        {
            reservationId: 'R-001',
            guestName: 'Alex Tan',
            phone: '0123456789',
            email: 'alex@example.com',
            date: today,
            time: '18:00',
            partySize: 2,
            status: 'Confirmed',
            table: 'T01',
            seating: 'Main Dining Room',
            packageName: 'Seven Course Odyssey',
            selectedDishes: [],
            specialRequests: ''
        },
        {
            reservationId: 'R-002',
            guestName: 'Sarah Lee',
            phone: '0123456788',
            email: 'sarah@example.com',
            date: today,
            time: '19:00',
            partySize: 3,
            status: 'Pending',
            table: '',
            seating: 'Garden Solarium',
            packageName: 'À La Carte',
            selectedDishes: [],
            specialRequests: ''
        },
        {
            reservationId: 'R-003',
            guestName: 'David Lim',
            phone: '0123456787',
            email: 'david@example.com',
            date: today,
            time: '20:00',
            partySize: 2,
            status: 'Seated',
            table: 'T03',
            seating: 'Main Dining Room',
            packageName: 'Table Only',
            selectedDishes: [],
            specialRequests: ''
        },
        {
            reservationId: 'R-004',
            guestName: 'Emily Wong',
            phone: '0123456786',
            email: 'emily@example.com',
            date: today,
            time: '20:30',
            partySize: 4,
            status: 'Cancelled',
            table: '',
            seating: 'Main Dining Room',
            packageName: 'Five Course Prelude',
            selectedDishes: [],
            specialRequests: ''
        }
    ];

    beforeEach(async () => {
        reservationService = jasmine.createSpyObj(
            'ReservationService',
            [
                'getReservations',
                'updateReservation',
                'updateReservationStatus'
            ]
        );

        webSocketService = jasmine.createSpyObj(
            'WebSocketService',
            ['connect'],
            { messages$: new Subject<any>() }
        );

        authService = jasmine.createSpyObj(
            'AuthService',
            ['getUser', 'isLoggedIn']
        );

        authService.getUser.and.returnValue(null);
        authService.isLoggedIn.and.returnValue(false);

        reservationService.getReservations.and.returnValue(
            of({
                reservations: mockReservations.map(reservation => ({
                    ...reservation,
                    selectedDishes: [...reservation.selectedDishes]
                }))
            } as any)
        );

        await TestBed.configureTestingModule({
            imports: [ReservationManagementComponent],
            providers: [
                { provide: ReservationService, useValue: reservationService },
                { provide: WebSocketService, useValue: webSocketService },
                { provide: AuthService, useValue: authService },
                provideHttpClient(),
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ReservationManagementComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should load reservations and connect to WebSocket on initialisation', () => {
        expect(reservationService.getReservations).toHaveBeenCalled();
        expect(webSocketService.connect).toHaveBeenCalled();
        expect(component.reservations.length).toBe(4);
        expect(component.isLoading).toBeFalse();
    });

    it('should filter and sort reservations correctly', () => {
        component.setFilter('Pending');

        expect(component.filteredReservations.length).toBe(1);
        expect(component.filteredReservations[0].reservationId).toBe('R-002');

        component.setFilter('All');
        component.searchQuery = 'alex';

        expect(component.filteredReservations.length).toBe(1);
        expect(component.filteredReservations[0].guestName).toBe('Alex Tan');

        component.searchQuery = '';
        component.sortOption = 'id-descending';

        expect(component.filteredReservations[0].reservationId).toBe('R-004');
    });

    it('should calculate reservation summary counts correctly', () => {
        expect(component.totalCount).toBe(3);
        expect(component.pendingCount).toBe(1);
        expect(component.confirmedCount).toBe(1);
        expect(component.seatedCount).toBe(1);
        expect(component.cancelledCount).toBe(1);
    });

    it('should assign a table and update the reservation', () => {
        const reservation = component.reservations[0]; // R-001, Confirmed

        reservationService.updateReservation.and.returnValue(
            of({
                reservation: {
                    ...reservation,
                    table: 'T02'
                }
            } as any)
        );

        component.assignTable(reservation, 'T02');

        expect(reservationService.updateReservation).toHaveBeenCalledWith(
            'R-001',
            { table: 'T02' }
        );

        expect(component.reservations[0].table).toBe('T02');
    });

    it('should cancel a reservation after confirmation', () => {
        const reservation = component.reservations[0];

        const cancelledReservation = {
            ...reservation,
            status: 'Cancelled'
        };

        reservationService.updateReservationStatus.and.returnValue(
            of({ reservation: cancelledReservation } as any)
        );

        // Request cancellation first
        component.updateStatus(reservation, 'Cancelled');

        expect(component.cancelConfirmOpen).toBeTrue();
        expect(reservationService.updateReservationStatus).not.toHaveBeenCalled();

        // Confirm cancellation
        component.cancelReservation();

        expect(reservationService.updateReservationStatus).toHaveBeenCalledWith(
            'R-001',
            'Cancelled'
        );

        expect(component.reservations[0].status).toBe('Cancelled');
        expect(component.cancelConfirmOpen).toBeFalse();

        component.clearSuccess();
    });
});

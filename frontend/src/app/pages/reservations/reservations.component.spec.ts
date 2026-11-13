import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ReservationsComponent } from './reservations.component';
import {
    ReservationService,
    SelectedDish,
    Reservation
} from '../../services/reservation.service';
import { TastingService } from '../../services/tasting.service';
import { AuthService } from '../../services/auth.service';

describe('ReservationsComponent', () => {

    let component: ReservationsComponent;
    let fixture: ComponentFixture<ReservationsComponent>;

    let reservationService: jasmine.SpyObj<ReservationService>;
    let tastingService: jasmine.SpyObj<TastingService>;
    let authService: jasmine.SpyObj<AuthService>;

    const mockDishes: SelectedDish[] = [
        {
            id: 'D001',
            name: 'French Onion Soup',
            price: 28
        },
        {
            id: 'D002',
            name: 'Grilled Salmon',
            price: 65
        }
    ];

    beforeEach(async () => {

        reservationService = jasmine.createSpyObj(
            'ReservationService',
            [
                'createReservation',
                'updateReservation',
                'getReservationById'
            ]
        );

        tastingService = jasmine.createSpyObj(
            'TastingService',
            [
                'getItems',
                'clearItems',
                'setItems'
            ]
        );

        authService = jasmine.createSpyObj(
            'AuthService',
            [
                'getUser',
                'isLoggedIn'
            ]
        );

        tastingService.getItems.and.returnValue([]);

        authService.getUser.and.returnValue(null);
        authService.isLoggedIn.and.returnValue(false);

        const mockCreatedReservation: Reservation = {
            _id: 'mongo-001',
            reservationId: 'R-001',
            guest: 'guest-001',
            guestName: 'Alex Tan',
            email: 'alex@example.com',
            phone: '0123456789',
            date: '2026-11-14',
            time: '18:00',
            partySize: 2,
            servicePeriod: 'dinner',
            diningOption: 'tasting',
            tastingMenu: 'Seven Course Odyssey',
            selectedDishes: [],
            beveragePairing: false,
            packageName: 'Seven Course Odyssey',
            table: null,
            specialRequests: '',
            status: 'Confirmed'
        };

        reservationService.createReservation.and.returnValue(
            of({
                message: 'Reservation created successfully',
                reservation: mockCreatedReservation
            })
        );

        await TestBed.configureTestingModule({

            imports: [
                ReservationsComponent
            ],

            providers: [

                {
                    provide: ReservationService,
                    useValue: reservationService
                },

                {
                    provide: TastingService,
                    useValue: tastingService
                },

                {
                    provide: AuthService,
                    useValue: authService
                },

                provideHttpClient(),
                provideRouter([])

            ]

        }).compileComponents();

        fixture = TestBed.createComponent(
            ReservationsComponent
        );

        component = fixture.componentInstance;

        fixture.detectChanges();

    });


    it('should create the reservations component', () => {

        expect(component).toBeTruthy();

    });


    it('should load previously selected dishes on initialisation', () => {

        tastingService.getItems.and.returnValue(mockDishes);

        component.ngOnInit();

        expect(tastingService.getItems).toHaveBeenCalled();
        expect(component.tastingList).toEqual(mockDishes);

    });


    it('should select a weekend date when brunch is selected', () => {

        component.changePeriod('brunch');

        expect(component.selectedPeriod).toBe('brunch');
        expect(component.isWeekend(component.selectedDate)).toBeTrue();
        expect(component.selectedTime).toBe('11:00');

    });


    it('should calculate the dining subtotal correctly', () => {

        // Default tasting menu: RM175 × 2 guests
        expect(component.diningSubtotal).toBe(350);

        // Add beverage pairing: RM56 × 2 guests
        component.includeBeveragePairing = true;

        expect(component.diningSubtotal).toBe(462);

        // À la carte: calculate based on selected dishes
        component.selectDiningOption('alacarte');

        component.includeBeveragePairing = false;
        component.tastingList = mockDishes;

        expect(component.diningSubtotal).toBe(93);

    });


    it('should reject incomplete details and submit a valid reservation', () => {

        // Incomplete contact details
        component.confirmReservation();

        expect(component.errorTitle).toBe(
            'Incomplete Contact Details'
        );

        expect(reservationService.createReservation)
            .not.toHaveBeenCalled();


        // Complete contact details
        component.guestName = 'Alex Tan';
        component.guestEmail = 'ALEX@EXAMPLE.COM';
        component.guestPhone = '0123456789';

        component.confirmReservation();

        expect(reservationService.createReservation)
            .toHaveBeenCalled();

        const submittedData =
            reservationService.createReservation.calls.mostRecent().args[0];

        expect(submittedData.guestName).toBe('Alex Tan');
        expect(submittedData.email).toBe('alex@example.com');
        expect(submittedData.phone).toBe('0123456789');
        expect(submittedData.diningOption).toBe('tasting');

        expect(component.successTitle).toBe(
            'Your Table Has Been Reserved'
        );

        expect(component.isSubmitting).toBeFalse();

    });

});

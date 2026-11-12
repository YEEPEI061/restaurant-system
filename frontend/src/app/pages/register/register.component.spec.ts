import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { provideHttpClient } from '@angular/common/http';

describe('RegisterComponent', () => {

    let authService: jasmine.SpyObj<AuthService>;
    let router: Router;

    beforeEach(async () => {

        authService = jasmine.createSpyObj(
            'AuthService',
            ['guestSignup', 'getUser', 'isLoggedIn']
        );

        authService.getUser.and.returnValue(null);
        authService.isLoggedIn.and.returnValue(false);

        authService.guestSignup.and.returnValue(
            of({ message: 'Account created successfully' } as any)
        );

        await TestBed.configureTestingModule({
            imports: [RegisterComponent],
            providers: [
                {
                    provide: AuthService,
                    useValue: authService
                },
                provideHttpClient(),
                provideRouter([])
            ]
        }).compileComponents();

        router = TestBed.inject(Router);

    });

    function createComponent() {

        const fixture = TestBed.createComponent(RegisterComponent);

        fixture.detectChanges();

        return fixture;
    }

    function fillValidRegistration(component: RegisterComponent) {

        component.firstName = 'Amelia';
        component.lastName = 'Laurent';
        component.email = 'amelia@example.com';
        component.phone = '+60123456789';
        component.password = 'Password123';
        component.confirmPassword = 'Password123';
        component.agreeToTerms = true;

    }

    it('should create the component', () => {

        const fixture = createComponent();

        expect(fixture.componentInstance).toBeTruthy();

    });

    it('should display an error when required fields are incomplete', () => {

        const fixture = createComponent();
        const component = fixture.componentInstance;

        component.createAccount();

        expect(component.errorTitle).toBe('Incomplete Information');
        expect(component.errorMessage).toContain('complete all required fields');
        expect(authService.guestSignup).not.toHaveBeenCalled();

    });

    it('should reject invalid or mismatched passwords', () => {

        const fixture = createComponent();
        const component = fixture.componentInstance;

        fillValidRegistration(component);

        component.password = 'short';
        component.confirmPassword = 'short';

        component.createAccount();

        expect(component.errorTitle).toBe('Invalid Password');

        component.password = 'Password123';
        component.confirmPassword = 'Different123';

        component.createAccount();

        expect(component.errorTitle).toBe('Passwords Do Not Match');
        expect(authService.guestSignup).not.toHaveBeenCalled();

    });

    it('should require agreement to the terms before registration', () => {

        const fixture = createComponent();
        const component = fixture.componentInstance;

        fillValidRegistration(component);
        component.agreeToTerms = false;

        component.createAccount();

        expect(component.errorTitle).toBe('Agreement Required');
        expect(authService.guestSignup).not.toHaveBeenCalled();

    });

    it('should create a guest account successfully', () => {

        const fixture = createComponent();
        const component = fixture.componentInstance;

        fillValidRegistration(component);

        component.createAccount();

        expect(authService.guestSignup).toHaveBeenCalledWith({
            firstName: 'Amelia',
            lastName: 'Laurent',
            email: 'amelia@example.com',
            phone: '+60123456789',
            password: 'Password123'
        });

        expect(component.isCreatingAccount).toBeFalse();
        expect(component.successTitle).toBe('Account Created');
        expect(component.successMessage).toContain('created successfully');

    });

});

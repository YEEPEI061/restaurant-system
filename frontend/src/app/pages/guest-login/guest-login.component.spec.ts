import { fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { GuestLoginComponent } from './guest-login.component';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Router, ActivatedRoute } from '@angular/router';

describe('GuestLoginComponent', () => {

    let component: GuestLoginComponent;

    let authService: jasmine.SpyObj<AuthService>;
    let notificationService: jasmine.SpyObj<NotificationService>;
    let router: jasmine.SpyObj<Router>;
    let route: ActivatedRoute;

    beforeEach(() => {

        authService = jasmine.createSpyObj<AuthService>(
            'AuthService',
            ['guestLogin']
        );

        notificationService = jasmine.createSpyObj<NotificationService>(
            'NotificationService',
            ['loadNotifications', 'connectWebSocket']
        );

        router = jasmine.createSpyObj<Router>(
            'Router',
            ['navigateByUrl']
        );

        route = {
            snapshot: {
                queryParamMap: {
                    get: () => null
                }
            }
        } as unknown as ActivatedRoute;

        component = new GuestLoginComponent(
            authService,
            notificationService,
            router,
            route
        );

    });


    it('should create the component', () => {

        expect(component).toBeTruthy();

    });


    it('should display an error when email and password are empty', () => {

        component.email = '';
        component.password = '';

        component.signIn();

        expect(component.errorTitle).toBe('Incomplete Information');

        expect(component.errorMessage).toBe(
            'Please enter your email address and password.'
        );

        expect(authService.guestLogin).not.toHaveBeenCalled();

    });


    it('should trim and convert the email to lowercase', () => {

        authService.guestLogin.and.returnValue(of({} as any));

        notificationService.loadNotifications.and.returnValue(of([] as any));

        component.email = '  GUEST@AURELIA.COM  ';
        component.password = 'password123';

        component.signIn();

        expect(authService.guestLogin).toHaveBeenCalledWith({
            email: 'guest@aurelia.com',
            password: 'password123'
        });

    });


    it('should toggle password visibility', () => {

        expect(component.showPassword).toBeFalse();

        component.togglePassword();

        expect(component.showPassword).toBeTrue();

        component.togglePassword();

        expect(component.showPassword).toBeFalse();

    });


    it('should display an error when login fails', () => {

        authService.guestLogin.and.returnValue(
            throwError(() => ({
                error: {
                    message: 'Invalid login credentials.'
                }
            }))
        );

        component.email = 'guest@aurelia.com';
        component.password = 'wrongpassword';

        component.signIn();

        expect(component.isSigningIn).toBeFalse();
        expect(component.errorTitle).toBe('Unable to Sign In');
        expect(component.errorMessage).toBe(
            'Invalid login credentials.'
        );

    });


    it('should load notifications and redirect after successful login', fakeAsync(() => {

        authService.guestLogin.and.returnValue(of({} as any));

        notificationService.loadNotifications.and.returnValue(of([] as any));

        component.email = 'guest@aurelia.com';
        component.password = 'password123';

        component.signIn();

        expect(component.isSigningIn).toBeFalse();
        expect(component.successTitle).toBe('Welcome Back');
        expect(notificationService.loadNotifications).toHaveBeenCalled();
        expect(notificationService.connectWebSocket).toHaveBeenCalled();

        tick(1400);

        expect(router.navigateByUrl).toHaveBeenCalledWith('/menu');

    }));


    it('should clear the error message', () => {

        component.showError('Error', 'Something went wrong.');
        component.clearError();

        expect(component.errorTitle).toBe('');
        expect(component.errorMessage).toBe('');

    });


    it('should clear the success message', () => {

        component.showSuccess('Success', 'Login successful.');
        component.clearSuccess();

        expect(component.successTitle).toBe('');
        expect(component.successMessage).toBe('');

    });

});

import { fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AdminLoginComponent } from './admin-login.component';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';

describe('AdminLoginComponent', () => {

    let component: AdminLoginComponent;

    let authService: jasmine.SpyObj<AuthService>;
    let notificationService: jasmine.SpyObj<NotificationService>;
    let router: jasmine.SpyObj<Router>;

    beforeEach(() => {

        authService = jasmine.createSpyObj<AuthService>(
            'AuthService',
            ['adminLogin']
        );

        notificationService = jasmine.createSpyObj<NotificationService>(
            'NotificationService',
            ['loadNotifications', 'connectWebSocket']
        );

        router = jasmine.createSpyObj<Router>(
            'Router',
            ['navigate']
        );

        component = new AdminLoginComponent(
            authService,
            notificationService,
            router
        );

    });


    it('should create the component', () => {

        expect(component).toBeTruthy();

    });


    it('should display an error when staff identifier and password are empty', () => {

        component.staffIdentifier = '';
        component.password = '';

        component.signIn();

        expect(component.errorTitle).toBe('Incomplete Information');
        expect(component.errorMessage).toBe(
            'Please enter your work email or staff ID and password.'
        );
        expect(authService.adminLogin).not.toHaveBeenCalled();

    });


    it('should trim and convert the staff identifier to lowercase', () => {

        authService.adminLogin.and.returnValue(of({
            user: {}
        } as any));

        notificationService.loadNotifications.and.returnValue(of([] as any));

        component.staffIdentifier = '  STAFF@AURELIA.COM  ';
        component.password = 'password123';

        component.signIn();

        expect(authService.adminLogin).toHaveBeenCalledWith({
            email: 'staff@aurelia.com',
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


    it('should display an error when admin login fails', () => {

        authService.adminLogin.and.returnValue(
            throwError(() => ({
                error: {
                    message: 'Invalid staff credentials.'
                }
            }))
        );

        component.staffIdentifier = 'staff@aurelia.com';
        component.password = 'wrongpassword';

        component.signIn();

        expect(component.isSigningIn).toBeFalse();
        expect(component.errorTitle).toBe('Unable to Sign In');
        expect(component.errorMessage).toBe(
            'Invalid staff credentials.'
        );

    });


    it('should load notifications and redirect to admin dashboard', fakeAsync(() => {

        authService.adminLogin.and.returnValue(of({
            user: {}
        } as any));

        notificationService.loadNotifications.and.returnValue(of([] as any));

        component.staffIdentifier = 'staff@aurelia.com';
        component.password = 'password123';

        component.signIn();

        expect(component.isSigningIn).toBeFalse();
        expect(component.successTitle).toBe('Access Granted');
        expect(notificationService.loadNotifications).toHaveBeenCalled();
        expect(notificationService.connectWebSocket).toHaveBeenCalled();

        tick(1400);

        expect(router.navigate).toHaveBeenCalledWith([
            '/admin-dashboard'
        ]);

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

import { inject } from '@angular/core';

import {
    CanActivateFn,
    Router
} from '@angular/router';

import {
    AuthService
} from '../services/auth.service';

export const guestGuard: CanActivateFn = (
    route,
    state
) => {

    const authService =
        inject(AuthService);

    const router =
        inject(Router);

    const user =
        authService.getUser();

    if (
        authService.isLoggedIn() &&
        user?.role === 'guest'
    ) {
        return true;
    }

    return router.createUrlTree(
        ['/guest-login'],
        {
            queryParams: {
                returnUrl: state.url
            }
        }
    );
};

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('aurelia_token');

  const authReq = token
    ? req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
    : req;

  return next(authReq).pipe(
    catchError(error => {
      if (error.status === 401 && token) {
        let user: any = null;

        try {
          user = JSON.parse(
            localStorage.getItem('aurelia_user') || 'null'
          );
        } catch {
          // Ignore invalid stored user data.
        }

        localStorage.removeItem('aurelia_token');
        localStorage.removeItem('aurelia_user');

        void router.navigate(
          user?.role === 'admin'
            ? ['/admin-login']
            : ['/guest-login']
        );
      }

      return throwError(() => error);
    })
  );
};
